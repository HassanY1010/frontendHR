import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Sparkles, RefreshCw, Upload, FileText, CheckCircle2,
    XCircle, AlertTriangle, TrendingUp, Shield, Clock, Mic,
    Info, History, Star,
    ThumbsUp, ThumbsDown, Minus, Loader2, Edit3, Save, X,
    Code2, Zap, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { evaluationApi, InterviewEvaluation } from '../services/evaluationApi';
import AIScoreCard from './AIScoreCard';

interface AIEvaluationDashboardProps {
    interview: {
        id: string;
        status?: string;
        transcript?: string;
        notes?: string;
        videoUrl?: string;
        candidate?: { fullName?: string; currentTitle?: string };
    };
    onClose?: () => void;
    compactMode?: boolean; // Renders inline without modal chrome
}

// ─── Recommendation Badge ─────────────────────────────────────────────────────

const RecommendationBadge: React.FC<{ recommendation: string }> = ({ recommendation }) => {
    const configs: Record<string, { label: string; labelAr: string; icon: React.ReactNode; classes: string }> = {
        STRONG_HIRE: {
            label: 'Strong Hire',
            labelAr: 'توظيف قوي جداً',
            icon: <Star className="w-4 h-4" />,
            classes: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/30'
        },
        HIRE: {
            label: 'Hire',
            labelAr: 'يُوصى بالتوظيف',
            icon: <ThumbsUp className="w-4 h-4" />,
            classes: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-blue-500/30'
        },
        MAYBE: {
            label: 'Maybe',
            labelAr: 'يحتاج مراجعة',
            icon: <Minus className="w-4 h-4" />,
            classes: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-amber-500/30'
        },
        REJECT: {
            label: 'Reject',
            labelAr: 'غير مناسب',
            icon: <ThumbsDown className="w-4 h-4" />,
            classes: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-500/30'
        },
        PENDING: {
            label: 'Pending',
            labelAr: 'بانتظار التقييم',
            icon: <Clock className="w-4 h-4" />,
            classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
        }
    };

    const config = configs[recommendation] || configs.PENDING;

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-base shadow-lg ${config.classes}`}
        >
            {config.icon}
            <span>{config.labelAr}</span>
            <span className="text-xs opacity-75">({config.label})</span>
        </motion.div>
    );
};

// ─── Circular Score Gauge ────────────────────────────────────────────────────

const CircularScore: React.FC<{ score: number | null; size?: number }> = ({ score, size = 120 }) => {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = score !== null ? (score / 100) * circumference : 0;
    const color = score === null ? '#9CA3AF' : score >= 80 ? '#10B981' : score >= 65 ? '#3B82F6' : score >= 50 ? '#F59E0B' : '#EF4444';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="10"
                    className="dark:stroke-gray-700"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-3xl font-extrabold tabular-nums"
                    style={{ color }}
                >
                    {score !== null ? score : '—'}
                </motion.span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">/ 100</span>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AIEvaluationDashboard: React.FC<AIEvaluationDashboardProps> = ({
    interview
}) => {
    const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
    const [versions, setVersions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [activeTab, setActiveTab] = useState<'scores' | 'transcript' | 'history'>('scores');
    const [showVersionHistory, setShowVersionHistory] = useState(false);

    // Transcript editing
    const [editingTranscript, setEditingTranscript] = useState(false);
    const [transcriptValue, setTranscriptValue] = useState(interview.transcript || interview.notes || '');
    const [isSavingTranscript, setIsSavingTranscript] = useState(false);

    // STT upload
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Load initial data ─────────────────────────────────────────────────────
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const [evalData, versionData] = await Promise.allSettled([
                    evaluationApi.getEvaluation(interview.id),
                    evaluationApi.getVersions(interview.id)
                ]);

                if (!isMounted) return;

                if (evalData.status === 'fulfilled') setEvaluation(evalData.value);
                if (versionData.status === 'fulfilled') setVersions(versionData.value.allVersions || []);
            } catch {
                // silently handled
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, [interview.id]);

    // ── Trigger evaluation ────────────────────────────────────────────────────
    const handleEvaluate = async (forceReEvaluate = false) => {
        const hasTranscript = transcriptValue.trim().length > 30;
        if (!hasTranscript) {
            toast.error('يرجى إدخال نص المقابلة أو رفع ملف صوتي أولاً', {
                description: 'النظام يحتاج نص المقابلة لتقييم المرشح'
            });
            setActiveTab('transcript');
            return;
        }

        setIsEvaluating(true);
        try {
            const result = await evaluationApi.evaluate(interview.id, {
                transcript: transcriptValue.trim(),
                forceReEvaluate
            });

            setEvaluation(result.evaluation);

            if (result.isExisting && !forceReEvaluate) {
                toast.info('تم تحميل التقييم الموجود مسبقاً', {
                    description: `الإصدار ${result.version} · يمكنك إعادة التقييم إذا أردت`
                });
            } else {
                toast.success(
                    forceReEvaluate ? `تم إنشاء تقييم جديد (إصدار ${result.version})` : 'اكتمل التقييم بنجاح',
                    { description: `الدرجة الكلية: ${result.evaluation.overallScore}/100 · ${getRecommendationAr(result.evaluation.recommendation)}` }
                );
            }

            // Refresh versions
            const versionData = await evaluationApi.getVersions(interview.id);
            setVersions(versionData.allVersions);
            setActiveTab('scores');
        } catch (err: any) {
            toast.error('فشل التقييم', { description: err.message });
        } finally {
            setIsEvaluating(false);
        }
    };

    // ── STT Upload ────────────────────────────────────────────────────────────
    const handleFileUpload = async (file: File) => {
        setIsTranscribing(true);
        try {
            toast.loading('جاري تحويل الصوت إلى نص...', { id: 'stt' });
            const result = await evaluationApi.transcribeAudio(file);

            setTranscriptValue(result.transcript);
            setActiveTab('transcript');

            toast.success('تم تحويل الصوت إلى نص بنجاح', {
                id: 'stt',
                description: `اللغة: ${result.language === 'ar' ? 'عربي' : result.language === 'en' ? 'إنجليزي' : 'مختلط'}`
            });
        } catch (err: any) {
            toast.error('فشل تحويل الصوت', { id: 'stt', description: err.message });
        } finally {
            setIsTranscribing(false);
        }
    };

    // ── Save Transcript ───────────────────────────────────────────────────────
    const handleSaveTranscript = async () => {
        setIsSavingTranscript(true);
        try {
            await evaluationApi.updateTranscript(interview.id, transcriptValue);
            setEditingTranscript(false);
            toast.success('تم حفظ النص بنجاح');
        } catch (err: any) {
            toast.error('فشل حفظ النص', { description: err.message });
        } finally {
            setIsSavingTranscript(false);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getRecommendationAr = (rec: string) => {
        const map: Record<string, string> = {
            STRONG_HIRE: 'توظيف قوي جداً', HIRE: 'يُوصى بالتوظيف',
            MAYBE: 'يحتاج مراجعة', REJECT: 'غير مناسب', PENDING: 'بانتظار التقييم'
        };
        return map[rec] || rec;
    };

    // ─────────────────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
                    <Brain className="w-10 h-10 text-purple-500" />
                </motion.div>
                <p className="text-gray-500 dark:text-gray-400">جاري تحميل بيانات التقييم...</p>
            </div>
        );
    }

    const hasEvaluation = evaluation && evaluation.status === 'DONE';
    const scores = evaluation?.scores;

    return (
        <div className="space-y-6 min-h-[400px]" dir="rtl">

            {/* ─── Header ─────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            تقييم المقابلة بالذكاء الاصطناعي
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {interview.candidate?.fullName || 'المرشح'} · {interview.candidate?.currentTitle || 'المنصب'}
                            {evaluation && ` · إصدار ${evaluation.version}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {hasEvaluation && (
                        <button
                            onClick={() => setShowVersionHistory(!showVersionHistory)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <History className="w-3.5 h-3.5" />
                            {versions.length} إصدار
                        </button>
                    )}

                    {hasEvaluation && (
                        <button
                            onClick={() => handleEvaluate(true)}
                            disabled={isEvaluating}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
                        >
                            {isEvaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            إعادة التقييم
                        </button>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleEvaluate(false)}
                        disabled={isEvaluating || isTranscribing}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:opacity-90 transition-all disabled:opacity-60"
                    >
                        {isEvaluating ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> جاري التقييم...</>
                        ) : (
                            <><Sparkles className="w-4 h-4" /> {hasEvaluation ? 'تقييم AI' : 'تقييم بالذكاء الاصطناعي'}</>
                        )}
                    </motion.button>
                </div>
            </div>

            {/* ─── Version History Dropdown ────────────────────────────────── */}
            <AnimatePresence>
                {showVersionHistory && versions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900/50"
                    >
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                سجل إصدارات التقييم
                            </p>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {versions.map((v) => (
                                <div key={v.id} className="flex items-center justify-between px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                        {v.isActive && (
                                            <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">
                                                الحالي
                                            </span>
                                        )}
                                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">إصدار {v.version}</span>
                                        <span className="text-xs text-gray-400">· {v.triggerSource === 'RE_EVALUATE' ? 'إعادة تقييم' : 'تقييم أول'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        {v.overallScore !== null && (
                                            <span className="font-semibold">{v.overallScore}/100</span>
                                        )}
                                        <span>{new Date(v.createdAt).toLocaleDateString('ar')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── No Evaluation State ─────────────────────────────────────── */}
            {!hasEvaluation && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 p-8 text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-8 h-8 text-purple-500" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                        لا يوجد تقييم بعد
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                        أضف نص المقابلة (أو حوّل ملف صوتي تلقائياً) ثم اضغط "تقييم بالذكاء الاصطناعي"
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => setActiveTab('transcript')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <FileText className="w-4 h-4" /> إضافة نص المقابلة
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isTranscribing}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                            تحويل صوت/فيديو إلى نص
                        </button>
                    </div>
                </motion.div>
            )}

            {/* ─── Tabs ────────────────────────────────────────────────────── */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                {[
                    { id: 'scores', label: 'نتائج التقييم', icon: <Sparkles className="w-3.5 h-3.5" /> },
                    { id: 'transcript', label: 'نص المقابلة', icon: <FileText className="w-3.5 h-3.5" /> },
                    { id: 'history', label: 'الإصدارات', icon: <History className="w-3.5 h-3.5" /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            activeTab === tab.id
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── Tab: Scores ─────────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {activeTab === 'scores' && hasEvaluation && (
                    <motion.div
                        key="scores"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Overall Score + Recommendation */}
                        <div className="flex flex-col sm:flex-row gap-6 items-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                            <CircularScore score={evaluation.overallScore} size={130} />
                            <div className="flex-1 text-center sm:text-right space-y-3">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">النتيجة الكلية</h3>
                                <RecommendationBadge recommendation={evaluation.recommendation} />
                                {evaluation.aiSummary && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-prose">
                                        {evaluation.aiSummary}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Shield className="w-3 h-3" /> بدون تحيز
                                    </span>
                                    <span className="text-xs text-gray-400">·</span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> {evaluation.metadata?.aiModel || 'GPT-4o'}
                                    </span>
                                    <span className="text-xs text-gray-400">·</span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {new Date(evaluation.metadata?.createdAt || '').toLocaleDateString('ar')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Dimensional Scores */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <AIScoreCard
                                label="Technical Skills"
                                labelAr="المهارات التقنية"
                                score={evaluation.overallScore ? scores?.technical?.score : null}
                                detail={scores?.technical || null}
                                weight={evaluation.scoringWeights?.technical || 0.3}
                                icon={<Code2 className="w-4 h-4" />}
                            />
                            <AIScoreCard
                                label="Communication"
                                labelAr="التواصل والتعبير"
                                score={scores?.communication?.score}
                                detail={scores?.communication || null}
                                weight={evaluation.scoringWeights?.communication || 0.25}
                                icon={<Users className="w-4 h-4" />}
                            />
                            <AIScoreCard
                                label="Experience Match"
                                labelAr="توافق الخبرة"
                                score={scores?.experience?.score}
                                detail={scores?.experience || null}
                                weight={evaluation.scoringWeights?.experience || 0.2}
                                icon={<TrendingUp className="w-4 h-4" />}
                            />
                            <AIScoreCard
                                label="Problem Solving"
                                labelAr="حل المشكلات"
                                score={scores?.problemSolving?.score}
                                detail={scores?.problemSolving || null}
                                weight={evaluation.scoringWeights?.problemSolving || 0.15}
                                icon={<Brain className="w-4 h-4" />}
                            />
                            <AIScoreCard
                                label="Culture Fit"
                                labelAr="التوافق الثقافي"
                                score={scores?.cultureFit?.score}
                                detail={scores?.cultureFit || null}
                                weight={evaluation.scoringWeights?.cultureFit || 0.1}
                                icon={<Star className="w-4 h-4" />}
                                className="sm:col-span-2"
                            />
                        </div>

                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Strengths */}
                            {evaluation.strengths?.length > 0 && (
                                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 p-4">
                                    <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mb-3">
                                        <CheckCircle2 className="w-4 h-4" /> نقاط القوة
                                    </h4>
                                    <ul className="space-y-2">
                                        {evaluation.strengths.map((s, i) => (
                                            <li key={i} className="text-sm text-emerald-800 dark:text-emerald-300 flex gap-2 items-start">
                                                <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span> {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Weaknesses */}
                            {evaluation.weaknesses?.length > 0 && (
                                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-4">
                                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-3">
                                        <AlertTriangle className="w-4 h-4" /> نقاط التحسين
                                    </h4>
                                    <ul className="space-y-2">
                                        {evaluation.weaknesses.map((w, i) => (
                                            <li key={i} className="text-sm text-amber-800 dark:text-amber-300 flex gap-2 items-start">
                                                <span className="text-amber-500 mt-0.5 flex-shrink-0">!</span> {w}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Risk Factors */}
                        {evaluation.riskFactors?.length > 0 && (
                            <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4">
                                <h4 className="text-sm font-bold text-red-800 dark:text-red-300 flex items-center gap-2 mb-3">
                                    <Shield className="w-4 h-4" /> عوامل المخاطرة
                                </h4>
                                <ul className="space-y-2">
                                    {evaluation.riskFactors.map((r, i) => (
                                        <li key={i} className="text-sm text-red-700 dark:text-red-300 flex gap-2 items-start">
                                            <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span> {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Rejection Reasons (only if REJECT) */}
                        {evaluation.recommendation === 'REJECT' && evaluation.rejectionReasons?.length > 0 && (
                            <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 p-5">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <h4 className="text-sm font-bold text-red-800 dark:text-red-300 flex items-center gap-2">
                                        <XCircle className="w-4 h-4" /> توصية الذكاء الاصطناعي: أسباب عدم الملاءمة
                                    </h4>
                                    <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">
                                        توصية استرشادية
                                    </span>
                                </div>
                                <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                                    هذه توصية استرشادية مبنية على تحليل إجابات المقابلة مقارنة بمتطلبات الوظيفة. القرار النهائي يعود لفريق التوظيف.
                                </p>
                                <ul className="space-y-2.5">
                                    {evaluation.rejectionReasons.map((r, i) => (
                                        <li key={i} className="text-sm text-red-700 dark:text-red-300 flex gap-2 items-start">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Scoring Weights Info */}
                        {evaluation.scoringWeights && (
                            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4">
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                                    <Info className="w-3.5 h-3.5" /> أوزان التقييم (مُخصصة حسب طبيعة الوظيفة)
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(evaluation.scoringWeights).map(([key, weight]) => (
                                        <span key={key} className="text-xs px-2.5 py-1 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                                            {key === 'technical' ? 'تقني' : key === 'communication' ? 'تواصل' : key === 'experience' ? 'خبرة' : key === 'problemSolving' ? 'حل مشكلات' : 'توافق ثقافي'}: {((weight as number) * 100).toFixed(0)}%
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ─── Tab: Transcript ─────────────────────────────────────── */}
                {activeTab === 'transcript' && (
                    <motion.div
                        key="transcript"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* STT Upload Zone */}
                        <div
                            className="rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-6 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            onClick={() => !isTranscribing && fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="audio/*,video/*"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                            />
                            {isTranscribing ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">جاري تحويل الصوت إلى نص...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="w-8 h-8 text-blue-400" />
                                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                        رفع ملف صوتي أو فيديو للتحويل التلقائي
                                    </p>
                                    <p className="text-xs text-gray-500">MP3, MP4, WAV, WebM, OGG, M4A · حتى 25 ميغابايت</p>
                                    <p className="text-xs text-gray-400">يدعم: العربية · الإنجليزية · المزيج</p>
                                </div>
                            )}
                        </div>

                        {/* Transcript Text Area */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" /> نص المقابلة
                                    {transcriptValue && <span className="text-gray-400">({transcriptValue.length} حرف)</span>}
                                </span>
                                <div className="flex items-center gap-2">
                                    {!editingTranscript ? (
                                        <button
                                            onClick={() => setEditingTranscript(true)}
                                            className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" /> تعديل
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveTranscript}
                                                disabled={isSavingTranscript}
                                                className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                                            >
                                                {isSavingTranscript ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} حفظ
                                            </button>
                                            <button
                                                onClick={() => setEditingTranscript(false)}
                                                className="text-xs flex items-center gap-1 text-gray-500 hover:underline"
                                            >
                                                <X className="w-3.5 h-3.5" /> إلغاء
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <textarea
                                value={transcriptValue}
                                onChange={(e) => setTranscriptValue(e.target.value)}
                                readOnly={!editingTranscript}
                                rows={10}
                                placeholder="أدخل نص المقابلة هنا... أو استخدم زر تحويل الصوت أعلاه للتحويل التلقائي.

مثال:
المحاور: حدثنا عن خبرتك في تطوير تطبيقات الويب.
المرشح: لديّ خبرة 4 سنوات في React وNode.js، وقد عملت على مشروع..."
                                className={`w-full p-4 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 resize-none outline-none leading-relaxed font-mono ${!editingTranscript ? 'cursor-default' : ''}`}
                            />
                        </div>

                        <p className="text-xs text-gray-400 text-center">
                            💡 يمكنك تعديل النص يدوياً لتصحيح أخطاء التحويل قبل التقييم
                        </p>
                    </motion.div>
                )}

                {/* ─── Tab: History ─────────────────────────────────────────── */}
                {activeTab === 'history' && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                    >
                        {versions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <History className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">لا يوجد سجل إصدارات بعد</p>
                            </div>
                        ) : (
                            versions.map((v) => (
                                <div
                                    key={v.id}
                                    className={`rounded-xl border p-4 ${v.isActive ? 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'}`}
                                >
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-2">
                                            {v.isActive && (
                                                <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">
                                                    ✓ الحالي
                                                </span>
                                            )}
                                            <span className="font-semibold text-gray-900 dark:text-white text-sm">إصدار {v.version}</span>
                                            <span className="text-xs text-gray-400">
                                                {v.triggerSource === 'RE_EVALUATE' ? '• إعادة تقييم' : v.triggerSource === 'MANUAL' ? '• تقييم يدوي' : '• تلقائي'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {v.overallScore !== null && (
                                                <span className="text-lg font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                                                    {v.overallScore}<span className="text-xs font-normal text-gray-400">/100</span>
                                                </span>
                                            )}
                                            {v.recommendation && v.recommendation !== 'PENDING' && (
                                                <RecommendationBadge recommendation={v.recommendation} />
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(v.createdAt).toLocaleString('ar-SA')}
                                    </p>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIEvaluationDashboard;
