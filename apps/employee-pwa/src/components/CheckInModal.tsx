import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@hr/services';
import { motion, AnimatePresence } from 'framer-motion';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import { X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CheckInState {
    state: 'IDLE' | 'ACTIVE_QUESTION' | 'LOCKED';
    assessmentId?: string;
    entryId?: string;
    question?: {
        order: number;
        type: string;
        text: string;
    };
    unlockTime?: string;
    expiresAt?: string;
    nextQuestionOrder?: number;
}

export const CheckInModal: React.FC = () => {
    const queryClient = useQueryClient();
    const [answerText, setAnswerText] = useState('');
    const [answerValue, setAnswerValue] = useState<number | null>(null);
    const [timer, setTimer] = useState(30);
    const [isOpen, setIsOpen] = useState(false);
    const isSubmitting = useRef(false);

    // 1. React Query for Polling Status
    const { data: status } = useQuery<CheckInState>({
        queryKey: ['check-in-status'],
        queryFn: async () => {
            const res = await apiClient.get('/check-in/status') as any;
            return res.data;
        },
        refetchInterval: 60000, // Poll every minute
        refetchOnWindowFocus: true,
        staleTime: 10000,
    });

    // 2. React Query Mutation for Submission
    const submitMutation = useMutation({
        mutationFn: async (payload: { entryId: string; answerText?: string; answerValue?: number | null; timeToAnswer: number }) => {
            return apiClient.post(`/check-in/entry/${payload.entryId}/answer`, {
                answerText: payload.answerText,
                answerValue: payload.answerValue,
                timeToAnswer: payload.timeToAnswer
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['check-in-status'] });
            // Reset local state if needed
            setAnswerText('');
            setAnswerValue(null);
        }
    });

    // 3. Logic to Auto-Open/Close based on Status
    useEffect(() => {
        if (!status) return;

        if (status.state === 'ACTIVE_QUESTION') {
            if (!isOpen) {
                console.log('✅ Opening modal for active question');
                setIsOpen(true);
                setAnswerText('');
                setAnswerValue(null);
                setTimer(30);
            }
        } else if (status.state === 'LOCKED' && status.unlockTime) {
            const now = new Date();
            const unlocks = new Date(status.unlockTime);
            const remainingByCheck = Math.ceil((unlocks.getTime() - now.getTime()) / 1000);

            if (remainingByCheck <= 60 && remainingByCheck > 0) {
                if (!isOpen) setIsOpen(true);
            } else {
                if (isOpen) setIsOpen(false);
            }
        } else {
            if (isOpen) setIsOpen(false);
        }
    }, [status]); // Only run when status changes (dampened by React Query)

    // Window Event Listener for Manual Trigger
    useEffect(() => {
        const handleUpdate = () => queryClient.invalidateQueries({ queryKey: ['check-in-status'] });
        window.addEventListener('check-in-update', handleUpdate);
        return () => window.removeEventListener('check-in-update', handleUpdate);
    }, [queryClient]);

    // Strict countdown timer using server expiry (same as before)
    useEffect(() => {
        if (!isOpen || !status) return;

        if (status.state === 'ACTIVE_QUESTION' && status.expiresAt) {
            const interval = setInterval(() => {
                const now = new Date();
                const expires = new Date(status.expiresAt!);
                const remaining = Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / 1000));
                setTimer(remaining);
                if (remaining <= 0) {
                    clearInterval(interval);
                    if (!submitMutation.isPending && !isSubmitting.current) submitAnswer(true);
                }
            }, 1000);
            return () => clearInterval(interval);
        }

        if (status.state === 'LOCKED' && status.unlockTime) {
            const interval = setInterval(() => {
                const now = new Date();
                const unlocks = new Date(status.unlockTime!);
                const remaining = Math.max(0, Math.ceil((unlocks.getTime() - now.getTime()) / 1000));

                if (remaining <= 60 && remaining > 0 && !isOpen) {
                    setIsOpen(true);
                }
                if (remaining <= 0) {
                    clearInterval(interval);
                    queryClient.invalidateQueries({ queryKey: ['check-in-status'] });
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isOpen, status]);

    // Disable body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            disableBodyScroll(document.body);
        } else {
            enableBodyScroll(document.body);
        }
        return () => {
            enableBodyScroll(document.body);
        };
    }, [isOpen]);

    const submitAnswer = async (forced = false, explicitText?: string | null, explicitValue?: number | null) => {
        if (!status?.entryId || submitMutation.isPending || isSubmitting.current) return;

        isSubmitting.current = true; // Ref guard

        try {
            const textToSend = explicitText !== undefined ? explicitText : answerText;
            const valueToSend = explicitValue !== undefined ? explicitValue : answerValue;

            await submitMutation.mutateAsync({
                entryId: status.entryId,
                answerText: textToSend || (forced ? 'انتهى الوقت' : ''),
                answerValue: valueToSend,
                timeToAnswer: 30 - timer
            });
        } catch (err: any) {
            console.error('Error submitting answer', err);
        } finally {
            isSubmitting.current = false;
        }
    };

    if (!isOpen || !status) return null;

    // RENDER: LOCKED STATE
    if (status.state === 'LOCKED') {
        const unlockDate = new Date(status.unlockTime || '');
        const timeStr = unlockDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 text-center shadow-2xl"
                        dir="rtl"
                    >
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-10 h-10 text-indigo-600 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">استراحة قصيرة</h3>
                        <p className="text-slate-500 mb-6 font-medium">
                            السؤال التالي سيكون متاحاً في الساعة <span className="text-indigo-600 font-bold dir-ltr">{timeStr}</span>
                        </p>
                        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                            نظام 30×3 يصمم فترات راحة بين الأسئلة لضمان دقة مشاعرك.
                        </p>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                        >
                            حسناً، فهمت
                        </button>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    // RENDER: ACTIVE QUESTION
    if (status.state === 'ACTIVE_QUESTION' && status.question) {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
                        dir="rtl"
                    >
                        {/* Header with Timer */}
                        <div className="relative bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                            <div className="relative flex justify-between items-start mb-6">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-2 border border-white/10">
                                        <Clock className="w-3 h-3" />
                                        <span>نظام 30×3 الذكي</span>
                                    </div>
                                    <h2 className="text-2xl font-black">سؤال {status.question.order} من 3</h2>
                                </div>

                                {/* Circular Timer or Badge */}
                                <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 transition-colors ${timer < 10 ? 'bg-red-500/20 border-red-200/30' : ''}`}>
                                    <span className={`text-2xl font-black ${timer < 10 ? 'text-red-200' : 'text-white'}`}>{timer}</span>
                                    <span className="text-[10px] text-indigo-100">ثانية</span>
                                </div>
                            </div>

                            {submitMutation.error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 p-3 bg-red-500/20 border border-red-200/30 rounded-xl flex items-center gap-2 text-red-100 text-xs font-bold"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{(submitMutation.error as any).message || 'خطأ في الاتصال'}</span>
                                </motion.div>
                            )}

                            <p className="relative text-lg font-medium leading-relaxed text-indigo-50">
                                {status.question.text}
                            </p>
                        </div>

                        {/* Body */}
                        <div className="p-8 bg-slate-50">
                            {(status.question.type === 'FACT' || status.question.type === 'yes_no') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => { setAnswerText('Yes'); submitAnswer(false, 'Yes'); }}
                                        disabled={submitMutation.isPending}
                                        className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3
                                            ${answerText === 'Yes'
                                                ? 'bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-100'
                                                : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${answerText === 'Yes' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-slate-700">نعم، تم</span>
                                    </button>

                                    <button
                                        onClick={() => { setAnswerText('No'); submitAnswer(false, 'No'); }}
                                        disabled={submitMutation.isPending}
                                        className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3
                                            ${answerText === 'No'
                                                ? 'bg-red-50 border-red-500 shadow-lg shadow-red-100'
                                                : 'bg-white border-slate-200 hover:border-red-300 hover:shadow-md'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${answerText === 'No' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600 group-hover:bg-red-500 group-hover:text-white'}`}>
                                            <X className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-slate-700">لا، لم يتم</span>
                                    </button>
                                </div>
                            )}

                            {(status.question.type === 'FEELING' || status.question.type === 'rating') && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center px-4">
                                        {[1, 2, 3, 4, 5].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => { setAnswerValue(val); submitAnswer(false, undefined, val); }}
                                                disabled={submitMutation.isPending}
                                                className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all duration-300
                                                    ${answerValue === val
                                                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 -translate-y-2'
                                                        : 'bg-white text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'}`}
                                            >
                                                {val}
                                                {answerValue === val && (
                                                    <motion.div
                                                        layoutId="active-indicator"
                                                        className="absolute -bottom-2 w-1.5 h-1.5 bg-indigo-600 rounded-full"
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-slate-400 px-2">
                                        <span>ضغط منخفض / راحة</span>
                                        <span>ضغط عالي / إجهاد</span>
                                    </div>
                                </div>
                            )}

                            {(status.question.type === 'BARRIER' || status.question.type === 'text') && (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <textarea
                                            className="w-full p-4 pr-12 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none text-slate-700 min-h-[120px]"
                                            placeholder="اكتب إجابتك هنا بوضوح..."
                                            value={answerText}
                                            disabled={submitMutation.isPending}
                                            onChange={(e) => setAnswerText(e.target.value)}
                                        />
                                        <div className="absolute top-4 right-4 text-slate-400">
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 mr-2">إجابتك تساعدنا في تحسين بيئة العمل وإزالة العقبات.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white border-t border-slate-100">
                            <button
                                onClick={() => submitAnswer()}
                                disabled={submitMutation.isPending || timer === 0 || (!answerText && !answerValue)}
                                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                            >
                                {submitMutation.isPending ? (
                                    <>
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>جاري الحفظ...</span>
                                    </>
                                ) : (
                                    <span>تأكيد الإجابة</span>
                                )}
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100">
                            <motion.div
                                className={`h-full ${timer < 10 ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
                                initial={{ width: '100%' }}
                                animate={{ width: `${(timer / 30) * 100}%` }}
                                transition={{ ease: 'linear', duration: 1 }}
                            />
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    return null;
};
