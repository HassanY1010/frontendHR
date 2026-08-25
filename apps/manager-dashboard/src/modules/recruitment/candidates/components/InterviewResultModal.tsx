import React from 'react';
import { motion } from 'framer-motion';
import {
    X,
    FileText,
    Brain,
    CheckCircle2,
    AlertCircle,
    Star,
    Clock,
    Video,
    MessageSquare,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';

interface InterviewResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidate: any;
    interview: any;
    onStatusUpdate: (status: string) => void;
}

const InterviewResultModal: React.FC<InterviewResultModalProps> = ({
    isOpen,
    onClose,
    candidate,
    interview,
    onStatusUpdate
}) => {
    if (!isOpen) return null;

    const resolveUrl = (url: string): string => {
        if (!url || !url.startsWith('/')) return url || '';
        const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
        return `${baseUrl}${url}`;
    };

    const aiAnalysis = typeof interview?.aiAnalysis === 'string'
        ? (() => { try { return JSON.parse(interview.aiAnalysis); } catch { return {}; } })()
        : (interview?.aiAnalysis || (candidate?.aiAnalysisDetails ? (typeof candidate.aiAnalysisDetails === 'string' ? (() => { try { return JSON.parse(candidate.aiAnalysisDetails); } catch { return {}; } })() : candidate.aiAnalysisDetails) : {}));

    const hasRealEvaluation = aiAnalysis?.isEvaluated === true || (interview?.aiScore !== null && interview?.aiScore !== undefined && !['PENDING_REVIEW', 'review'].includes(aiAnalysis?.decision));

    const rawScore = interview?.aiScore !== undefined && interview?.aiScore !== null 
        ? interview.aiScore 
        : (candidate?.aiScore !== undefined && candidate?.aiScore !== null ? candidate.aiScore : null);
    
    // إذا كانت الدرجة من 10 نحسب النسبة المئوية، إذا كانت بالفعل من 100 نتركها كما هي
    const score = (hasRealEvaluation && rawScore !== null) ? (rawScore <= 10 ? Math.round(rawScore * 10) : rawScore) : null;
    const isHire = aiAnalysis?.decision === 'مقبول' || aiAnalysis?.recommendation === 'مقبول' || aiAnalysis?.recommendation === 'hire' || (score !== null && score >= 70);
    const recommendationText = hasRealEvaluation 
        ? (aiAnalysis?.decision || aiAnalysis?.recommendation || (isHire ? 'قبول وتوظيف مقترح' : 'غير ملائم'))
        : 'بانتظار المراجعة والتقييم';
    const transcriptText = interview?.transcript || interview?.notes || '';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-gray-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 z-10 max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                            <Brain className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                نتائج المقابلة المسجلة: {candidate?.fullName || 'المرشح'}
                            </h2>
                            <p className="text-xs text-gray-500">
                                تحليل المقابلة والتسجيل المرئي المرفوع
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">النتيجة الإجمالية</span>
                                <Star className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                            </div>
                            <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                                {score !== null ? `${score}%` : 'قيد التقييم'}
                            </div>
                            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: score !== null ? `${score}%` : '0%' }}
                                />
                            </div>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">توصية النظام</span>
                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                {recommendationText}
                            </div>
                            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                                {hasRealEvaluation ? 'بناءً على المعايير المحددة للوظيفة' : 'بانتظار التفريغ والمراجعة اليدوية'}
                            </p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">حالة المقابلة</span>
                                <Clock className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                {interview?.videoUrl ? 'تم تسجيل الفيديو' : (interview?.status === 'completed' ? 'مكتملة' : 'في الانتظار')}
                            </div>
                            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                                {interview?.duration ? `المدة: ${Math.floor(interview.duration / 60)}:${(interview.duration % 60).toString().padStart(2, '0')} دقيقة` : 'تسجيل مرئي متاح للمشاهدة'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Video Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Video className="w-5 h-5 text-indigo-500" /> تسجيل المقابلة
                            </h3>
                            <div className="aspect-video bg-gray-900 rounded-3xl overflow-hidden relative group border-4 border-gray-100 dark:border-gray-800 shadow-xl">
                                {interview.videoUrl ? (
                                    <video
                                        src={resolveUrl(interview.videoUrl)}
                                        controls
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                        <AlertCircle className="w-12 h-12 mb-2 opacity-20" />
                                        <p>لم يتم العثور على تسجيل فيديو</p>
                                    </div>
                                )}
                            </div>

                            {/* Key Highlights */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-purple-500" /> نقاط القوة والضعف
                                </h4>
                                {hasRealEvaluation && ((aiAnalysis.strengths && aiAnalysis.strengths.length > 0) || (aiAnalysis.weaknesses && aiAnalysis.weaknesses.length > 0)) ? (
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-2">نقاط القوة (مدعومة بأدلة من الإجابات):</span>
                                            <div className="flex flex-wrap gap-2">
                                                {aiAnalysis.strengths?.map((s: string, i: number) => (
                                                    <span key={i} className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
                                                        {s}
                                                    </span>
                                                )) || <span className="text-xs text-gray-400">لا يوجد بيانات</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-2">تحتاج تطوير وملاحظات:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {aiAnalysis.weaknesses?.map((w: string, i: number) => (
                                                    <span key={i} className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-800">
                                                        {w}
                                                    </span>
                                                )) || <span className="text-xs text-gray-400">لا يوجد بيانات</span>}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                                        <p className="text-xs font-medium text-gray-500">
                                            لم يتم تسجيل إجابات نصية أو تفريغ معتمد للمرشح حتى الآن لاستخراج نقاط القوة والضعف آلياً.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Analysis & Transcript Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" /> ملخص التقييم
                            </h3>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm leading-relaxed">
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                    {interview.aiSummary || aiAnalysis?.summary || 'تم استلام تسجيل المقابلة وهو بانتظار المراجعة والتقييم.'}
                                </p>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 pt-2">
                                <MessageSquare className="w-5 h-5 text-indigo-500" /> نصوص الأسئلة والإجابات
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-800/30 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {transcriptText ? (
                                    <div className="space-y-4 text-sm">
                                        {transcriptText.split('\n\n').map((paragraph: string, i: number) => (
                                            <div key={i} className="p-3.5 bg-white dark:bg-gray-800/80 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-2xs">
                                                <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed whitespace-pre-line">
                                                    {paragraph}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm text-center py-10">لا يوجد نص متاح حالياً</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 flex items-center justify-between">
                    <div className="flex gap-3">
                        <button
                            onClick={() => onStatusUpdate('HIRED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                        >
                            <CheckCircle2 className="w-5 h-5" /> قبول المرشح
                        </button>
                        <button
                            onClick={() => onStatusUpdate('REJECTED')}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-red-100"
                        >
                            <X className="w-5 h-5" /> رفض
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium px-4 py-2"
                    >
                        إغلاق
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default InterviewResultModal;
