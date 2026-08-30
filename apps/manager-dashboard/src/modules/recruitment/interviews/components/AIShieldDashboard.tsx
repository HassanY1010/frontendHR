import React, { useState, useEffect } from 'react';
import {
    Shield,
    AlertTriangle,
    Eye,
    Volume2,
    BookOpen,
    Clock,
    CheckCircle2,
    XCircle,
    UserCheck,
    Sparkles,
    Lock,
    RefreshCw,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { aiShieldService, AIShieldReport } from '@hr/services';
import { toast } from 'sonner';

interface AIShieldDashboardProps {
    interviewId: string;
    candidateName?: string;
    jobTitle?: string;
    onClose?: () => void;
}

export const AIShieldDashboard: React.FC<AIShieldDashboardProps> = ({
    interviewId,
    candidateName = 'المرشح',
    jobTitle = 'المسمى الوظيفي'
}) => {
    const [report, setReport] = useState<AIShieldReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REJECTED' | 'INCONCLUSIVE'>('APPROVED');
    const [reviewNotes, setReviewNotes] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'review'>('overview');
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const data = await aiShieldService.getReport(interviewId);
            setReport(data);
            if (data?.humanReview?.reviewNotes) {
                setReviewNotes(data.humanReview.reviewNotes);
            }
            if (data?.humanReview?.reviewerDecision) {
                setReviewDecision(data.humanReview.reviewerDecision as any);
            }
        } catch (err: any) {
            console.error('Failed to load AI Shield report:', err);
            toast.error('حدث خطأ أثناء جلب تقرير أمان المقابلة.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (interviewId) {
            fetchReport();
        }
    }, [interviewId]);

    // Handle Quick Simulation / Initialization for Demo & Production testing
    const handleStartSimulation = async () => {
        setIsSimulating(true);
        try {
            // 1. Start Session with Identity Verification
            const startRes = await aiShieldService.startSession({
                interviewId,
                consentGiven: true,
                baselineSnapshot: {
                    faceDetected: true,
                    faceCount: 1,
                    similarityIndex: 0.94,
                    livenessScore: 0.91,
                    landmarkQuality: 0.89
                }
            });

            const sessionId = startRes.session.id;

            // 2. Stream a visual frame
            await aiShieldService.analyzeFrame({
                sessionId,
                timestamp: 15,
                frameMetrics: {
                    faceCount: 1,
                    facePresent: true,
                    gazeDirection: 'CENTER',
                    headPose: { yaw: 2, pitch: -1, roll: 0 }
                }
            });

            // 3. Stream a minor gaze signal
            await aiShieldService.analyzeFrame({
                sessionId,
                timestamp: 45,
                frameMetrics: {
                    faceCount: 1,
                    facePresent: true,
                    gazeDirection: 'AWAY',
                    gazeOffScreenDuration: 5,
                    headPose: { yaw: 35, pitch: -5, roll: 2 }
                }
            });

            // 4. Stream audio slice
            await aiShieldService.analyzeAudio({
                sessionId,
                timestamp: 60,
                audioMetrics: {
                    speakerCount: 1,
                    secondarySpeakerDetected: false,
                    abnormalSilenceDuration: 0
                }
            });

            // 5. Complete Session
            await aiShieldService.completeSession(sessionId);

            toast.success('تم تشغيل وإكمال فحص الأمان ونزاهة المقابلة بنجاح.');
            await fetchReport();
        } catch (err: any) {
            console.error('Simulation error:', err);
            const msg = err.response?.data?.message || 'فشل تشغيل فحص AI Shield.';
            toast.error(msg);
        } finally {
            setIsSimulating(false);
        }
    };

    // Handle Human Review Submission
    const handleSubmitReview = async () => {
        if (!report) return;
        setIsSubmittingReview(true);
        try {
            await aiShieldService.submitHumanReview(report.id, {
                status: 'REVIEWED',
                reviewerDecision: reviewDecision,
                reviewNotes: reviewNotes
            });
            toast.success('تم حفظ قرار المراجعة البشرية بنجاح.');
            await fetchReport();
        } catch (err: any) {
            toast.error('حدث خطأ أثناء حفظ قرار المراجعة.');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'HIGH':
                return {
                    bg: 'bg-red-50 dark:bg-red-950/40',
                    border: 'border-red-200 dark:border-red-800',
                    text: 'text-red-700 dark:text-red-400',
                    badge: 'bg-red-600 text-white',
                    label: 'مخاطر مرتفعة (High Risk)'
                };
            case 'MEDIUM':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-950/40',
                    border: 'border-amber-200 dark:border-amber-800',
                    text: 'text-amber-700 dark:text-amber-400',
                    badge: 'bg-amber-500 text-white',
                    label: 'مخاطر متوسطة (Medium Risk)'
                };
            default:
                return {
                    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
                    border: 'border-emerald-200 dark:border-emerald-800',
                    text: 'text-emerald-700 dark:text-emerald-400',
                    badge: 'bg-emerald-600 text-white',
                    label: 'نزاهة مستقرة / مخاطر منخفضة (Low Risk)'
                };
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-red-600 text-white">حرج (Critical)</span>;
            case 'HIGH':
                return <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-orange-500 text-white">عالي (High)</span>;
            case 'MEDIUM':
                return <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">متوسط</span>;
            default:
                return <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">منخفض</span>;
        }
    };

    const riskMeta = getRiskColor(report?.scores?.riskLevel || 'LOW');

    return (
        <div className="space-y-6 text-right" dir="rtl">
            {/* Top Header & Overview Banner */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="flex items-center gap-3.5 z-10">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                        <Shield className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight">نظام الحماية والأمان (AI Shield)</h2>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-sm">PRO Tier</span>
                        </div>
                        <p className="text-xs text-indigo-200/80 mt-0.5">
                            مراقبة النزاهة ورصد الإشارات الملاحظة · {candidateName} ({jobTitle})
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 z-10 w-full md:w-auto justify-end">
                    <button
                        onClick={handleStartSimulation}
                        disabled={isSimulating}
                        className="px-4 py-2 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-2 shadow-lg hover:shadow-indigo-600/20 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                        {report ? 'إعادة فحص الأمان' : 'بدء فحص الأمان (Start Shield)'}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-1">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'overview'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                >
                    مؤشرات النزاهة والنتائج
                </button>
                <button
                    onClick={() => setActiveTab('timeline')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'timeline'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                >
                    المخطط الزمني للإشارات ({report?.eventsTimeline?.length || 0})
                </button>
                <button
                    onClick={() => setActiveTab('review')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'review'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                >
                    المراجعة البشرية (Human Review)
                    {report?.humanReview?.status === 'REVIEWED' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                </button>
            </div>

            {/* Content Loading State */}
            {isLoading && (
                <div className="py-16 text-center text-gray-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
                    <p className="text-sm font-medium">جاري جلب تقرير أمان ونزاهة المقابلة...</p>
                </div>
            )}

            {/* Empty State: No Session yet */}
            {!isLoading && !report && (
                <div className="p-8 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center bg-gray-50 dark:bg-gray-900/50">
                    <Shield className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">لم يتم تشغيل فحص AI Shield لهذه المقابلة بعد</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-5">
                        يوفر نظام AI Shield مراقبة حية لهوية المرشح واتجاه البصر وتعدد المتحدثين وأصالة الإجابات مع الحفاظ التام على الخصوصية.
                    </p>
                    <button
                        onClick={handleStartSimulation}
                        disabled={isSimulating}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all shadow-md inline-flex items-center gap-2"
                    >
                        <Shield className="w-4 h-4" />
                        بدء تفعيل AI Shield للمقابلة
                    </button>
                </div>
            )}

            {/* TAB 1: OVERVIEW & 4 PILLARS */}
            {!isLoading && report && activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Overall Risk & Trust Gauge Card */}
                    <div className={`p-5 rounded-2xl border ${riskMeta.bg} ${riskMeta.border} flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm`}>
                        <div className="space-y-2 text-right">
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${riskMeta.badge}`}>
                                    {riskMeta.label}
                                </span>
                                {report.scores.isHardRuleTriggered && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 border border-red-300 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        تنبيه أمني قاطع (Hard Rule Triggered)
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                تقرير مؤشر النزاهة العامة: {report.scores.overallScore ?? '--'}/100
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                                {report.summary}
                            </p>
                        </div>

                        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm min-w-[140px]">
                            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                                {report.scores.overallScore ?? '--'}%
                            </div>
                            <div className="text-[11px] font-medium text-gray-500 mt-0.5">درجة النزاهة الموزونة</div>
                        </div>
                    </div>

                    {/* The 4 Core Verification Pillars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Pillar 1: Identity */}
                        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500">تحقق الهوية والوجه</span>
                                <UserCheck className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {report.scores.identityScore ?? '--'}<span className="text-xs text-gray-400 font-normal">/100</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    style={{ width: `${report.scores.identityScore || 0}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-gray-500">
                                الوزن: 35% · مطابقة الوجه وملامح الحيوية
                            </p>
                        </div>

                        {/* Pillar 2: Behavior / Attention */}
                        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500">السلوك والانتباه</span>
                                <Eye className="w-4 h-4 text-purple-500" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {report.scores.behaviorScore ?? '--'}<span className="text-xs text-gray-400 font-normal">/100</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-purple-600 h-1.5 rounded-full"
                                    style={{ width: `${report.scores.behaviorScore || 0}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-gray-500">
                                الوزن: 25% · ثبات البصر وعدم تعدد الأشخاص
                            </p>
                        </div>

                        {/* Pillar 3: Audio Integrity */}
                        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500">نزاهة الصوت والمحيط</span>
                                <Volume2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {report.scores.audioScore ?? '--'}<span className="text-xs text-gray-400 font-normal">/100</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-emerald-600 h-1.5 rounded-full"
                                    style={{ width: `${report.scores.audioScore || 0}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-gray-500">
                                الوزن: 20% · خلو الخلفية من متحدثين إضافيين
                            </p>
                        </div>

                        {/* Pillar 4: Answer Authenticity */}
                        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500">أصالة الإجابات والـ CV</span>
                                <BookOpen className="w-4 h-4 text-amber-500" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {report.scores.answerIntegrityScore ?? '--'}<span className="text-xs text-gray-400 font-normal">/100</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-amber-500 h-1.5 rounded-full"
                                    style={{ width: `${report.scores.answerIntegrityScore || 0}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-gray-500">
                                الوزن: 20% · خلو النص من التلقين الآلي
                            </p>
                        </div>
                    </div>

                    {/* Recommendations & Advisory Disclaimer */}
                    {report.recommendations && report.recommendations.length > 0 && (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                توصيات وملاحظات النظام الاسترشادية:
                            </h4>
                            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                                {report.recommendations.map((rec, idx) => (
                                    <li key={idx}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Privacy & Governance Notice */}
                    <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
                        <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold">التزام الخصوصية وعدم تخزين القياسات الحيوية:</span> تم الحصول على موافقة المرشح الصريحة ({report.privacy.consentPurpose}). يتم تحليل الإشارات آنياً ولا يتم الاحتفاظ بالصور الحيوية الخام أو التسجيلات غير المصرح بها (سياسة الحذف: {report.privacy.retentionPolicy}).
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: TIMELINE & OBSERVED SIGNALS */}
            {!isLoading && report && activeTab === 'timeline' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            سجل الإشارات والملاحظات المرصودة أثناء المقابلة
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                            إجمالي الأحداث: {report.eventsTimeline.length}
                        </span>
                    </div>

                    {report.eventsTimeline.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-500 border border-dashed rounded-xl border-gray-200 dark:border-gray-800">
                            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                            لم يتم رصد أي إشارات أو سلوكيات مشبوهة خلال المقابلة. جميع المؤشرات ضمن النطاق الطبيعي.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {report.eventsTimeline.map((event) => {
                                const isExpanded = expandedEventId === event.id;
                                return (
                                    <div
                                        key={event.id}
                                        className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2 transition-all hover:border-indigo-300 dark:hover:border-indigo-700"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-mono font-bold">
                                                    +{Math.floor(event.timestamp / 60)}:{(Math.floor(event.timestamp % 60)).toString().padStart(2, '0')}
                                                </span>
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                    {event.eventType}
                                                </span>
                                                {getSeverityBadge(event.severity)}
                                            </div>
                                            <span className="text-[11px] text-gray-400">
                                                ثقة الإشارة: {Math.round(event.confidence * 100)}%
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-600 dark:text-gray-300">
                                            {event.description}
                                        </p>

                                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                                            <div>
                                                <button
                                                    onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                                                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium inline-flex items-center gap-1 mt-1 hover:underline"
                                                >
                                                    {isExpanded ? 'إخفاء التفاصيل الفنية' : 'عرض التفاصيل الفنية للإشارة'}
                                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                </button>
                                                {isExpanded && (
                                                    <pre className="mt-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-950 text-[10px] text-gray-700 dark:text-gray-300 font-mono overflow-x-auto border border-gray-200 dark:border-gray-800 text-left" dir="ltr">
                                                        {JSON.stringify(event.metadata, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: HUMAN REVIEW AUDIT */}
            {!isLoading && report && activeTab === 'review' && (
                <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-indigo-600" />
                                المراجعة والاعتماد البشري (Human in the Loop)
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                قرارات الذكاء الاصطناعي استرشادية ولا تغني عن تقدير مسؤول التوظيف المعتمد.
                            </p>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${report.humanReview?.status === 'REVIEWED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                            {report.humanReview?.status === 'REVIEWED' ? 'تمت المراجعة البشرية' : 'بانتظار المراجعة'}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                                قرار المراجع البشري:
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setReviewDecision('APPROVED')}
                                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1.5 ${reviewDecision === 'APPROVED'
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    نزاهة مؤكدة (Approved)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReviewDecision('INCONCLUSIVE')}
                                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1.5 ${reviewDecision === 'INCONCLUSIVE'
                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    ملاحظات تتطلب مقابلة ثانية
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReviewDecision('REJECTED')}
                                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1.5 ${reviewDecision === 'REJECTED'
                                        ? 'border-red-500 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    <XCircle className="w-5 h-5 text-red-500" />
                                    مخالفة معايير النزاهة (Reject)
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                ملاحظات وتبرير المراجع:
                            </label>
                            <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="اكتب الملاحظات التوضيحية لمطابقة الهوية وأداء المرشح..."
                                rows={4}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSubmitReview}
                                disabled={isSubmittingReview}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {isSubmittingReview ? 'جاري الحفظ...' : 'اعتماد قرار المراجعة البشرية'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIShieldDashboard;
