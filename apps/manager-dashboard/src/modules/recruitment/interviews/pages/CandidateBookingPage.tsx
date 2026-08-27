import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewSchedulingService } from '@hr/services';
import { Calendar, Clock, Video, User, CheckCircle2, AlertCircle, Sparkles, Globe } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SessionData {
    candidateName: string;
    jobTitle: string;
    interviewerName: string;
    interviewType: string;
    duration: number;
    expiresAt: string;
    location?: string;
}

interface Slot {
    startTime: string;
    endTime: string;
    date: string;
    isAvailable: boolean;
}

export const CandidateBookingPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<SessionData | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [timezone, setTimezone] = useState<string>('Asia/Riyadh');
    const [notes, setNotes] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isBooking, setIsBooking] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

    useEffect(() => {
        const fetchSessionAndSlots = async () => {
            if (!token) return;
            setIsLoading(true);
            setErrorMessage(null);
            try {
                // 1. Fetch public session details
                const sessionRes = await interviewSchedulingService.getSessionDetails(token);
                setSession(sessionRes.data);

                // 2. Fetch available slots
                const slotsRes = await interviewSchedulingService.getAvailableSlots(token, timezone);
                const fetchedSlots = slotsRes.data.slots || [];
                setSlots(fetchedSlots);

                if (fetchedSlots.length > 0) {
                    const firstDate = fetchedSlots[0].date;
                    setSelectedDate(firstDate);
                }
            } catch (err: any) {
                const msg = err.response?.data?.message || 'عذراً، حدث خطأ أثناء تحميل بيانات جلسة المقابلة.';
                setErrorMessage(msg);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSessionAndSlots();
    }, [token, timezone]);

    const handleBooking = async () => {
        if (!selectedSlot || !token) return;
        setIsBooking(true);
        setErrorMessage(null);
        try {
            const res = await interviewSchedulingService.bookInterview({
                token,
                startTime: selectedSlot.startTime,
                timezone,
                notes
            });
            setBookingSuccess(res.data);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'تعذر تأكيد الحجز، يرجى المحاولة مرة أخرى.';
            setErrorMessage(msg);
        } finally {
            setIsBooking(false);
        }
    };

    // Group available slots by date
    const uniqueDates = Array.from(new Set(slots.map(s => s.date)));
    const filteredSlots = slots.filter(s => s.date === selectedDate);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl max-w-md w-full text-center border border-slate-100 dark:border-slate-800">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">جاري تحميل المواعيد المتاحة...</h2>
                    <p className="text-sm text-slate-500 mt-2">يرجى الانتظار بينما نقوم بالتحقق من جدول المقابلات.</p>
                </div>
            </div>
        );
    }

    if (bookingSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl max-w-lg w-full text-center border border-emerald-100 dark:border-emerald-950/40">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">تم تأكيد موعد المقابلة بنجاح!</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        شكراً لك <strong>{session?.candidateName}</strong>. تم إرسال تفاصيل الموعد ورابط الاجتماع إلى بريدك الإلكتروني.
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 text-right space-y-3 mb-6 border border-slate-100 dark:border-slate-800 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">الوظيفة:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{session?.jobTitle}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">المقيم:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{session?.interviewerName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">التاريخ والوقت:</span>
                            <span className="font-semibold text-blue-600">
                                {format(parseISO(bookingSuccess.startTime), 'EEEE, d MMMM yyyy - hh:mm a', { locale: ar })}
                            </span>
                        </div>
                        {bookingSuccess.meetingUrl && (
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                                <span className="text-slate-500">رابط الاجتماع:</span>
                                <a href={bookingSuccess.meetingUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">
                                    الانضمام للاجتماع
                                </a>
                            </div>
                        )}
                    </div>

                    {/* AI Practice Session Invitation Banner */}
                    <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-2xl p-5 text-right mb-6 space-y-3">
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                            <Sparkles className="w-4 h-4" />
                            <span>تدرب الآن قبل المقابلة الحقيقية!</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            اختبر الكاميرا والميكروفون وجرب مقابلة تدريبية سريعة (1-3 دقائق) واحصل على تقييم فوري من مدرب الذكاء الاصطناعي لكسر حاجز التوتر.
                        </p>
                        <button
                            onClick={async () => {
                                try {
                                    const { interviewPracticeService } = await import('@hr/services');
                                    const res = await interviewPracticeService.createSession({ schedulingToken: token });
                                    const practiceToken = res.data?.practiceToken;
                                    if (practiceToken) {
                                        navigate(`/practice-interview/${practiceToken}`);
                                    } else {
                                        navigate(`/practice-interview/${token}`);
                                    }
                                } catch (e) {
                                    // Fallback to scheduling token
                                    navigate(`/practice-interview/${token}`);
                                }
                            }}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            ابدأ المقابلة التجريبية (AI Coach)
                        </button>
                    </div>

                    <div className="text-xs text-slate-400">
                        نتمنى لك كل التوفيق في مقابلتك القادمة!
                    </div>
                </div>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl max-w-md w-full text-center border border-red-100 dark:border-red-950/40">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">تعذر إتمام الحجز</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{errorMessage}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-4">
                            <Sparkles className="w-3.5 h-3.5" />
                            منظومة المقابلات الذكية
                        </div>
                        <h1 className="text-3xl font-extrabold mb-2">حجز موعد المقابلة الشخصية</h1>
                        <p className="text-blue-100 max-w-xl text-sm leading-relaxed">
                            مرحباً <strong>{session?.candidateName}</strong>، يرجى اختيار الوقت الأنسب لك من بين المواعيد المتاحة خلال الـ 72 ساعة القادمة.
                        </p>

                        <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-white/20 text-xs">
                            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                                <User className="w-4 h-4 text-blue-200" />
                                <span>المقيم: {session?.interviewerName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                                <Clock className="w-4 h-4 text-blue-200" />
                                <span>المدة: {session?.duration} دقيقة</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                                <Video className="w-4 h-4 text-blue-200" />
                                <span>النوع: {session?.interviewType}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left: Step 1 - Choose Date */}
                    <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            1. اختر اليوم
                        </h3>
                        <div className="space-y-2">
                            {uniqueDates.map(dateStr => (
                                <button
                                    key={dateStr}
                                    onClick={() => {
                                        setSelectedDate(dateStr);
                                        setSelectedSlot(null);
                                    }}
                                    className={`w-full text-right p-3.5 rounded-2xl font-medium text-sm transition-all flex items-center justify-between ${
                                        selectedDate === dateStr
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <span>{format(parseISO(dateStr), 'EEEE, d MMMM', { locale: ar })}</span>
                                    {selectedDate === dateStr && <CheckCircle2 className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>

                        {/* Timezone Switcher */}
                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <label className="text-xs font-semibold text-slate-500 mb-2 block flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-blue-600" />
                                المنطقة الزمنية
                            </label>
                            <select
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-700 dark:text-slate-200"
                            >
                                <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                                <option value="Asia/Aden">صنعاء / عدن (GMT+3)</option>
                                <option value="Asia/Dubai">دبي (GMT+4)</option>
                                <option value="Africa/Cairo">القاهرة (GMT+2)</option>
                                <option value="UTC">UTC (توقيت غرينتش)</option>
                            </select>
                        </div>
                    </div>

                    {/* Middle: Step 2 - Choose Slot */}
                    <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            2. اختر الوقت المتاح
                        </h3>

                        {filteredSlots.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                لا توجد أوقات متاحة لهذا اليوم.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                {filteredSlots.map((slot, idx) => {
                                    const isSelected = selectedSlot?.startTime === slot.startTime;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`p-3.5 rounded-2xl text-center font-bold text-sm transition-all border ${
                                                isSelected
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/60 hover:border-blue-300 text-slate-700 dark:text-slate-200'
                                            }`}
                                        >
                                            {format(parseISO(slot.startTime), 'hh:mm a')}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Notes input */}
                        <div className="mb-6">
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                                ملاحظات إضافية للمقيم (اختياري)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="إذا كان لديك أي تفضيلات أو استفسار مختصر..."
                                rows={3}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Booking Submit Button */}
                        <button
                            disabled={!selectedSlot || isBooking}
                            onClick={handleBooking}
                            className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                                !selectedSlot || isBooking
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/25 active:scale-[0.99]'
                            }`}
                        >
                            {isBooking ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>جاري تأكيد الموعد...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>تأكيد حجز المقابلة</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateBookingPage;
