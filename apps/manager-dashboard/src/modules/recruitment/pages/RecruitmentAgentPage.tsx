import React, { useState, useEffect } from 'react';
import {
    Play, CheckCircle2, AlertTriangle, Clock, RefreshCw,
    ShieldCheck, Zap, FileText, XCircle, Sparkles
} from 'lucide-react';
import {
    agentService,
    AgentTask,
    AgentLog,
    AgentTaskType
} from '@hr/services';
import { Button, Card, CardContent, Badge } from '@hr/ui';
import { toast } from 'sonner';

export const RecruitmentAgentPage: React.FC = () => {
    const [tasks, setTasks] = useState<AgentTask[]>([]);
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRunningSweep, setIsRunningSweep] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'TASKS' | 'RECOMMENDATIONS' | 'LOGS'>('RECOMMENDATIONS');
    const [taskFilter, setTaskFilter] = useState<AgentTaskType>('ALL');
    const [executingLogId, setExecutingLogId] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [tasksRes, logsRes] = await Promise.all([
                agentService.getAgentTasks({ limit: 30 }),
                agentService.getAgentLogs({ limit: 50 })
            ]);
            setTasks(tasksRes.tasks || []);
            setLogs(logsRes.logs || []);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'فشل في تحميل بيانات وكيل التوظيف');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRunSweep = async (type: AgentTaskType = 'ALL') => {
        setIsRunningSweep(true);
        try {
            const res = await agentService.runAgentSweep(type);
            toast.success(res.message || 'تم تشغيل جولة فحص وكيل التوظيف بنجاح');
            await loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'فشل في تشغيل وكيل التوظيف الآلي');
        } finally {
            setIsRunningSweep(false);
        }
    };

    const handleExecuteAction = async (logId: string, decision: 'APPROVE' | 'REJECT') => {
        setExecutingLogId(logId);
        try {
            const res = await agentService.executeAction(logId, decision);
            if (decision === 'APPROVE') {
                toast.success('تم اعتماد وتنفيذ الإجراء في النظام بنجاح!');
            } else {
                toast.info('تم رفض الإجراء المقترح');
            }
            // Update local state instantly
            setLogs(prev => prev.map(l => l.id === logId ? { ...l, actionStatus: res.data.status } : l));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'فشل في تنفيذ إجراء الوكيل');
        } finally {
            setExecutingLogId(null);
        }
    };

    const pendingRecommendations = logs.filter(l => l.actionStatus === 'RECOMMENDED');
    const completedActions = logs.filter(l => l.actionStatus === 'EXECUTED');
    const failedTasks = tasks.filter(t => t.status === 'FAILED');

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header with Glassmorphism & Status indicator */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
                <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Autonomous Hiring Agent — وكيل التوظيف الآلي نشط</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black">غرفة عمليات التوظيف الذاتية</h1>
                    <p className="text-indigo-200/80 text-sm max-w-xl leading-relaxed">
                        يراقب النظام الشواغر الراكدة، يتابع المرشحين المتأخرين، يفرز أفضل الكفاءات للمقابلة، وينشئ التقارير الأسبوعية مع إبقاء قرار الاعتماد النهائي بيدك.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 relative z-10">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => loadData()}
                        disabled={isLoading}
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold"
                    >
                        <RefreshCw className={`w-4 h-4 ml-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                        تحديث
                    </Button>

                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRunSweep('ALL')}
                        disabled={isRunningSweep}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-lg shadow-indigo-600/30"
                    >
                        <Play className="w-4 h-4 ml-1.5 fill-current" />
                        {isRunningSweep ? 'جاري الفحص الشامل...' : 'تشغيل فحص النظام الآن'}
                    </Button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">توصيات بانتظار الاعتماد</p>
                            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingRecommendations.length}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجراءات معتمدة ومنفذة</p>
                            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{completedActions.length}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">المهام المكتملة</p>
                            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                                {tasks.filter(t => t.status === 'COMPLETED').length}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600">
                            <Zap className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">مهام متعثرة / أخطاء</p>
                            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{failedTasks.length}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600">
                            <XCircle className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-gray-800 pb-2">
                <button
                    onClick={() => setSelectedTab('RECOMMENDATIONS')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                        selectedTab === 'RECOMMENDATIONS'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800'
                    }`}
                >
                    <Sparkles className="w-4 h-4" />
                    <span>التوصيات والقرارات المقترحة ({pendingRecommendations.length})</span>
                </button>

                <button
                    onClick={() => setSelectedTab('TASKS')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                        selectedTab === 'TASKS'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800'
                    }`}
                >
                    <Zap className="w-4 h-4" />
                    <span>المهام الذاتية النشطة ({tasks.length})</span>
                </button>

                <button
                    onClick={() => setSelectedTab('LOGS')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                        selectedTab === 'LOGS'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>سجل التدقيق والإجراءات ({logs.length})</span>
                </button>
            </div>

            {/* TAB CONTENT: RECOMMENDATIONS & DECISIONS */}
            {selectedTab === 'RECOMMENDATIONS' && (
                <div className="space-y-4">
                    {pendingRecommendations.length === 0 ? (
                        <Card className="p-12 text-center bg-white dark:bg-gray-900 border-dashed border-2">
                            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">لا توجد توصيات معلقة بانتظار الاعتماد</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                                المنظومة مستقرة ولا توجد شواغر راكدة أو مرشحين عالقين يتطلبون تدخلاً عاجلاً.
                            </p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingRecommendations.map((rec) => (
                                <Card key={rec.id} className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition">
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200">
                                                    توصية ذكية تحتاج موافقة
                                                </Badge>
                                                <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                                                    {rec.action === 'PROPOSE_TOP_5_CANDIDATE' && `ترشيح للمقابلة: ${rec.input?.name}`}
                                                    {rec.action === 'RECOMMEND_STALLED_JOB_FIX' && `معالجة ركود وظيفة: ${rec.input?.jobTitle}`}
                                                    {rec.action === 'RECOMMEND_CANDIDATE_FOLLOWUP' && `متابعة مرشح: ${rec.input?.candidateName}`}
                                                    {!['PROPOSE_TOP_5_CANDIDATE', 'RECOMMEND_STALLED_JOB_FIX', 'RECOMMEND_CANDIDATE_FOLLOWUP'].includes(rec.action) && rec.action}
                                                </h4>
                                            </div>
                                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(rec.timestamp).toLocaleDateString('ar-SA')}
                                            </span>
                                        </div>

                                        {/* Evidence & Reasoning */}
                                        {rec.evidence && (
                                            <div className="p-3 bg-slate-50 dark:bg-gray-800/60 rounded-xl text-xs space-y-1.5 border border-slate-100 dark:border-gray-800">
                                                <p className="font-bold text-slate-700 dark:text-slate-300">الأدلة والأسباب المعتمدة:</p>
                                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    {rec.evidence.reason || rec.evidence.reasons?.join(' • ') || 'استناداً إلى معايير التوافق الوظيفي وفترة المكوث في المرحلة'}
                                                </p>
                                                {rec.evidence.score && (
                                                    <div className="flex items-center gap-2 pt-1 font-bold text-indigo-600 dark:text-indigo-400">
                                                        <span>درجة التوافق المحسوبة:</span>
                                                        <span className="text-sm">{rec.evidence.score}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Proposed Action details */}
                                        {rec.output?.recommendedActions && (
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">الإجراءات المقترحة:</p>
                                                <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside space-y-1">
                                                    {rec.output.recommendedActions.map((act: any, idx: number) => (
                                                        <li key={idx}><span className="font-bold">{act.label}:</span> {act.detail}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
                                            <Button
                                                size="sm"
                                                onClick={() => handleExecuteAction(rec.id, 'APPROVE')}
                                                disabled={executingLogId === rec.id}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                                                اعتماد وتنفيذ الإجراء
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleExecuteAction(rec.id, 'REJECT')}
                                                disabled={executingLogId === rec.id}
                                                className="text-xs text-slate-600 hover:text-rose-600 font-bold"
                                            >
                                                <XCircle className="w-3.5 h-3.5 ml-1" />
                                                تجاهل
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: AUTONOMOUS TASKS */}
            {selectedTab === 'TASKS' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 pb-2">
                        {(['ALL', 'STALLED_JOBS', 'CANDIDATE_FOLLOWUP', 'WEEKLY_REPORT', 'TOP_CANDIDATES'] as AgentTaskType[]).map(type => (
                            <button
                                key={type}
                                onClick={() => setTaskFilter(type)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                    taskFilter === type
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                        : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300'
                                }`}
                            >
                                {type === 'ALL' && 'الكل'}
                                {type === 'STALLED_JOBS' && 'الشواغر الراكدة'}
                                {type === 'CANDIDATE_FOLLOWUP' && 'متابعة المرشحين'}
                                {type === 'WEEKLY_REPORT' && 'التقرير الأسبوعي'}
                                {type === 'TOP_CANDIDATES' && 'أفضل 5 مرشحين'}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        {tasks
                            .filter(t => taskFilter === 'ALL' || t.taskType === taskFilter)
                            .map((task) => (
                                <Card key={task.id} className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                                                    task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                    task.status === 'RUNNING' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse' :
                                                    task.status === 'FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {task.status}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">
                                                    {new Date(task.createdAt).toLocaleString('ar-SA')}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{task.title}</h4>
                                            {task.result?.summary && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{task.result.summary}</p>
                                            )}
                                            {task.errorReason && (
                                                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">خطأ: {task.errorReason}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRunSweep(task.taskType)}
                                                disabled={isRunningSweep}
                                                className="text-xs font-bold"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5 ml-1" />
                                                إعادة التشغيل
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: AUDIT LOGS */}
            {selectedTab === 'LOGS' && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">سجل التدقيق الشامل لقرارات الوكيل الآلي</h3>
                        <span className="text-xs text-slate-400">{logs.length} عملية مسجلة</span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-gray-800">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            log.actionStatus === 'EXECUTED' ? 'bg-emerald-100 text-emerald-800' :
                                            log.actionStatus === 'RECOMMENDED' ? 'bg-amber-100 text-amber-800' :
                                            log.actionStatus === 'REJECTED' ? 'bg-slate-200 text-slate-700' :
                                            'bg-rose-100 text-rose-800'
                                        }`}>
                                            {log.actionStatus}
                                        </span>
                                        <span className="font-mono text-slate-500 font-bold">{log.action}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        المُنفِّذ: <span className="font-semibold text-slate-800 dark:text-slate-200">{log.performedBy || 'الوكيل الآلي'}</span>
                                    </p>
                                </div>
                                <span className="text-slate-400 shrink-0 font-mono">
                                    {new Date(log.timestamp).toLocaleString('ar-SA')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruitmentAgentPage;
