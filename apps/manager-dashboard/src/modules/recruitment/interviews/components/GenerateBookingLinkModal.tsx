import React, { useState } from 'react';
import { interviewSchedulingService } from '@hr/services';
import { Copy, Check, Send, Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';

interface GenerateBookingLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidate: any;
    interviewers: any[];
}

export const GenerateBookingLinkModal: React.FC<GenerateBookingLinkModalProps> = ({
    isOpen,
    onClose,
    candidate,
    interviewers
}) => {
    const [interviewerId, setInterviewerId] = useState<string>(interviewers[0]?.id || '');
    const [interviewType, setInterviewType] = useState<string>('VIDEO');
    const [duration, setDuration] = useState<number>(45);
    const [expiryHours, setExpiryHours] = useState<number>(72);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    if (!isOpen) return null;

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        try {
            const res = await interviewSchedulingService.createSchedulingSession({
                candidateId: candidate.id,
                interviewerId: interviewerId || interviewers[0]?.id,
                interviewType,
                duration,
                expiryHours
            });

            setGeneratedLink(res.data.bookingUrl);
            toast.success('تم إنشاء وإرسال رابط الحجز الذكي للمرشح بنجاح!');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'فشل إنشاء رابط الحجز';
            toast.error(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!generatedLink) return;
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        toast.success('تم نسخ الرابط إلى الحافظة');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Sparkles className="w-5 h-5" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">إنشاء رابط حجز ذاتي للمرشح</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg">✕</button>
                </div>

                {!generatedLink ? (
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span>المرشح: <strong>{candidate?.fullName}</strong> ({candidate?.recruitmentjob?.title || 'طلب التوظيف'})</span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المقيم المسؤول</label>
                            <select
                                value={interviewerId}
                                onChange={(e) => setInterviewerId(e.target.value)}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                                required
                            >
                                {interviewers.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نوع المقابلة</label>
                                <select
                                    value={interviewType}
                                    onChange={(e) => setInterviewType(e.target.value)}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                                >
                                    <option value="VIDEO">فيديو (Online Meeting)</option>
                                    <option value="PHONE">هاتفي (Phone Call)</option>
                                    <option value="PHYSICAL">حضوري في المقر (In-Person)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مدة المقابلة</label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                                >
                                    <option value={30}>30 دقيقة</option>
                                    <option value={45}>45 دقيقة</option>
                                    <option value={60}>60 دقيقة</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">صلاحية الرابط (قاعدة الـ 72 ساعة)</label>
                            <input
                                type="number"
                                min={12}
                                max={168}
                                value={expiryHours}
                                onChange={(e) => setExpiryHours(Number(e.target.value))}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">الافتراضي: 72 ساعة من وقت الإنشاء.</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold">
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                disabled={isGenerating}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <Send className="w-4 h-4" />
                                {isGenerating ? 'جاري التوليد...' : 'توليد وإرسال الرابط'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed">
                            تم إنشاء الرابط وإرساله تلقائياً إلى بريد المرشح الإلكتروني. يمكنك أيضاً نسخه ومشاركته مباشرة.
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                            <input
                                readOnly
                                value={generatedLink}
                                className="bg-transparent text-xs font-mono w-full px-2 outline-none text-slate-700 dark:text-slate-200"
                            />
                            <button
                                onClick={handleCopy}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button onClick={onClose} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700">
                                إغلاق
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenerateBookingLinkModal;
