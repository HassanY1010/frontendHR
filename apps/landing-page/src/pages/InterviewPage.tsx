import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic,
    Video,
    Send,
    ArrowLeft,
    Brain,
    Clock,
    CheckCircle2,
    Lock,
    ShieldCheck,
    Loader2,
    Smile,
    Heart,
    Star,
    AlertCircle,
    FileText,
    Eye
} from 'lucide-react';
import { recruitmentService } from '@hr/services';
import { toast } from 'sonner';
import { Candidate } from '@hr/types';

const InterviewPage = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [interview, setInterview] = useState<any>(null); // Keeping any for interview if it has extra frontend-only fields not in base Interview type, otherwise use Interview
    const [loading, setLoading] = useState(true);

    // Steps: auth -> terms -> privacy -> intro -> questions -> finishing -> feedback -> done
    const [step, setStep] = useState('auth');
    const [inputToken, setInputToken] = useState(token || '');

    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [completed, setCompleted] = useState(false);

    // Question Phases: READING (30s) -> PREPARING (15s) -> ANSWERING (start recording, 120s max)
    type QuestionPhase = 'READING' | 'PREPARING' | 'ANSWERING';
    const [phase, setPhase] = useState<QuestionPhase>('READING');
    const [timeLeft, setTimeLeft] = useState(30);

    const [isRecording, setIsRecording] = useState(false);

    // Media State
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Feedback State
    const [rating, setRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState('');

    useEffect(() => {
        if (token) {
            verifyToken(token);
        } else {
            setLoading(false);
        }
        return () => {
            stopMediaStream();
        };
    }, [token]);

    // Timer Logic
    useEffect(() => {
        if (step !== 'questions') return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleTimerExpiry();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [step, phase, timeLeft]);

    const handleTimerExpiry = () => {
        if (phase === 'READING') {
            setPhase('PREPARING');
            setTimeLeft(15);
        } else if (phase === 'PREPARING') {
            setPhase('ANSWERING');
            setTimeLeft(120); // 2 minutes
            // بدء التسجيل فقط عند السؤال الأول
            if (currentQuestionIdx === 0 && !isRecording) {
                startInterviewRecording();
            }
        } else if (phase === 'ANSWERING') {
            // Time limit reached for answer
            handleNext();
        }
    };

    // Auto-scroll to top when step changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    // Cleanup media on unmount
    useEffect(() => {
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Load questions when entering questions step
    useEffect(() => {
        if (step === 'questions') {
            fetchQuestions();
            startMediaStream();
            // Reset for first question
            setPhase('READING');
            setTimeLeft(30);
        }
    }, [step]);

    const startMediaStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setMediaStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing media devices:", err);
            toast.error("يرجى السماح بالوصول للكاميرا والميكروفون");
        }
    };

    const stopMediaStream = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            setMediaStream(null);
        }
    };

    const fetchQuestions = async () => {
        if (!token) return;
        try {
            const fetchedQuestions: string[] = await recruitmentService.getInterviewQuestionsByToken(token);
            if (fetchedQuestions && fetchedQuestions.length > 0) {
                setQuestions(fetchedQuestions);
            } else {
                setQuestions([
                    "حدثنا عن نفسك وعن أهم خبراتك المهنية.",
                    "لماذا تعتقد أنك المرشح المثالي لهذه الوظيفة؟",
                    "ما هي نقاط القوة التي ستضيفها لفريقنا؟"
                ]);
            }
        } catch (error) {
            console.error(error);
            toast.error("فشل تحميل الأسئلة، يرجى المحاولة مرة أخرى");
        }
    };

    const verifyToken = async (t: string) => {
        setLoading(true);
        try {
            const interviewData = await recruitmentService.getInterviewByToken(t);
            setInterview(interviewData);
            setCandidate(interviewData.candidate ?? null);
            setStep('auth-success');

            setTimeout(() => setStep('terms'), 800);

        } catch (error) {
            toast.error('رابط المقابلة غير صحيح أو منتهي الصلاحية');
            setStep('auth');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        // لا نوقف التسجيل، فقط ننتقل للسؤال التالي
        moveToNextQuestion();
    };

    const moveToNextQuestion = () => {
        if (currentQuestionIdx < questions.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
            setPhase('READING');
            setTimeLeft(30);
        } else {
            finishInterview();
        }
    };

    const finishInterview = () => {
        setStep('finishing');
        // إيقاف التسجيل وحفظ الفيديو الكامل
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop(); // This will trigger onstop which saves the complete video
        } else {
            // If recording wasn't started, just proceed
            stopMediaStream();
            setTimeout(() => {
                setStep('feedback');
            }, 2000);
        }
    };

    const startInterviewRecording = () => {
        if (!mediaStream) return;

        let mimeType = 'video/webm';
        if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            mimeType = 'video/webm;codecs=vp9';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            mimeType = 'video/webm;codecs=vp8';
        }

        // إعدادات محسّنة للتسجيل الطويل
        const options = {
            mimeType,
            videoBitsPerSecond: 2500000, // 2.5 Mbps - جودة جيدة
        };

        const recorder = new MediaRecorder(mediaStream, options);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
                console.log(`Recorded chunk: ${e.data.size} bytes, Total chunks: ${chunks.length}`);
            }
        };

        recorder.onerror = (event) => {
            console.error('MediaRecorder error:', event);
            toast.error('حدث خطأ في التسجيل');
        };

        recorder.onstop = async () => {
            setIsRecording(false);
            console.log(`Recording stopped. Total chunks: ${chunks.length}`);
            const blob = new Blob(chunks, { type: mimeType });
            console.log(`Final video size: ${blob.size} bytes (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);

            // حفظ الفيديو الكامل مع جميع الأسئلة
            await handleUploadAndSubmit(blob);
            // إيقاف البث بعد الحفظ
            stopMediaStream();
            // الانتقال لصفحة التقييم
            setTimeout(() => {
                setStep('feedback');
            }, 1000);
        };

        // بدء التسجيل مع timeslice لجمع البيانات كل 1 ثانية
        // هذا يضمن عدم فقدان البيانات في التسجيلات الطويلة
        recorder.start(1000); // جمع البيانات كل ثانية
        setMediaRecorder(recorder);
        setIsRecording(true);
        console.log('Recording started with timeslice: 1000ms');
    };

    const handleUploadAndSubmit = async (videoBlob: Blob) => {
        if (!candidate) return;

        // Optimistic UI update or toast
        toast.info('جاري حفظ المقابلة الكاملة...');

        try {
            // 1. Upload Complete Video
            const uploadResponse = await recruitmentService.uploadInterviewVideo(videoBlob, candidate.id);
            const videoUrl = uploadResponse.url;

            // 2. Submit Complete Interview with all questions
            const allQuestionsNotes = questions.map((q, idx) => `السؤال ${idx + 1}: ${q}`).join('\n\n');

            await recruitmentService.submitInterview({
                candidateId: candidate.id,
                videoUrl: videoUrl,
                notes: allQuestionsNotes,
                token: token
            });

            toast.success('تم حفظ المقابلة بنجاح');
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء حفظ المقابلة');
        }
    };

    const submitFeedback = async () => {
        if (!candidate) return;
        try {
            await recruitmentService.submitInterviewFeedback(candidate.id, rating, feedbackText);
            toast.success("شكراً لتقييمك!");
        } catch (err) {
            console.error(err);
            toast.success("شكراً لتقييمك!"); // Show success even if fail (optimistic)
        }
        setStep('done');
        setCompleted(true);
    };

    if (loading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            <p className="mt-4 text-slate-500 font-bold">جاري التحميل...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Brain className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="font-black text-slate-800 text-lg">المقابلة الذكية</span>
                </div>
                {candidate && (
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">المرشح</span>
                            <span className="text-sm font-black text-slate-700">
                                {candidate.fullName}
                            </span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-50">
                            {candidate.fullName.charAt(0)}
                        </div>
                    </div>
                )}
            </div>

            <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
                <AnimatePresence mode="wait">

                    {/* AUTH STEP */}
                    {step === 'auth' && (
                        <motion.div
                            key="auth"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200 rotate-3">
                                <Lock className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900">التحقق من الهوية</h2>
                            <p className="text-slate-500 font-medium text-sm">أدخل رمز الدخول المرسل إليك عبر البريد الإلكتروني</p>
                            <input
                                type="text"
                                placeholder="- - - - - -"
                                className="w-full text-center text-3xl font-black tracking-[0.2em] py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all uppercase placeholder:text-slate-200"
                                maxLength={36}
                                value={inputToken}
                                onChange={e => setInputToken(e.target.value)}
                            />
                            <button
                                onClick={() => verifyToken(inputToken)}
                                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                دخول للمقابلة
                            </button>
                        </motion.div>
                    )}

                    {/* TERMS STEP */}
                    {step === 'terms' && (
                        <motion.div
                            key="terms"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full max-w-2xl bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100"
                        >
                            <h2 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                <FileText className="w-8 h-8 text-indigo-600" />
                                الشروط والأحكام
                            </h2>
                            <div className="prose prose-slate bg-slate-50 p-6 rounded-2xl mb-8 max-h-[300px] overflow-y-auto text-right">
                                <p className="font-bold text-slate-700">يرجى قراءة الشروط التالية بعناية قبل البدء:</p>
                                <ul className="list-disc pr-5 space-y-2 text-slate-600 font-medium mt-4">
                                    <li>سيتم تسجيل الفيديو والصوت لأغراض التقييم والتوظيف فقط.</li>
                                    <li>سيتم مشاركة التسجيل مع فريق التوظيف في الشركة المعلنة فقط.</li>
                                    <li>قد يتم استخدام تقنيات الذكاء الاصطناعي للمساعدة في تحليل الإجابات، ولكن القرار النهائي بيد مسؤولي التوظيف.</li>
                                    <li>يحق لك التوقف وانسحاب من المقابلة في أي وقت، ولكن قد يؤثر ذلك على اكتمال طلبك.</li>
                                    <li>نلتزم بحماية بياناتك وخصوصيتك وفقاً للأنظمة المعمول بها.</li>
                                </ul>
                            </div>
                            <div className="flex items-center gap-3 mb-8">
                                <input id="terms-check" type="checkbox" className="w-6 h-6 text-indigo-600 rounded-lg border-2 border-slate-300 focus:ring-indigo-500"
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            if (candidate) {
                                                recruitmentService.acceptTerms(candidate.id).catch(console.error);
                                            }
                                            setStep('privacy');
                                        }
                                    }}
                                />
                                <label htmlFor="terms-check" className="text-lg font-bold text-slate-800 cursor-pointer select-none">
                                    أوافق على الشروط والأحكام المذكورة أعلاه
                                </label>
                            </div>
                            <p className="text-sm text-slate-400 font-bold">يجب الموافقة للمتابعة</p>
                        </motion.div>
                    )}

                    {/* PRIVACY / INSTRUCTION STEP */}
                    {step === 'privacy' && (
                        <motion.div
                            key="privacy"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full max-w-2xl bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100 text-center"
                        >
                            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="w-12 h-12 text-emerald-600" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-4">تعليمات الخصوصية</h2>
                            <p className="text-xl text-slate-600 font-medium mb-8 leading-relaxed max-w-lg mx-auto">
                                نحن نحترم خصوصيتك بشكل كامل.
                                <br />
                                <span className="text-indigo-600 font-bold">لا يشترط إظهار الوجه بالكامل</span> في حال رغبتك بذلك.
                                <br />
                                ما يهمنا هو: <span className="font-bold text-slate-800">جودة الصوت ووضوح الإجابة</span>.
                                <br />
                                يمكنك التأكد من إعداداتك في الخطوة التالية.
                            </p>
                            <button
                                onClick={() => setStep('intro')}
                                className="btn-premium px-12 py-4 text-lg"
                            >
                                فهمت، التالي
                            </button>
                        </motion.div>
                    )}

                    {/* INTRO STEP */}
                    {step === 'intro' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="w-full max-w-3xl bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h2 className="text-4xl font-black text-slate-900 mb-6">أهلاً بك م/ {candidate?.fullName}</h2>
                                <p className="text-xl text-slate-600 font-medium mb-10 leading-relaxed">
                                    أنت الآن بصدد بدء <span className="font-bold text-indigo-600">المقابلة الذكية</span> لمنصب <span className="font-bold text-slate-800">{(candidate as any)?.recruitmentjob?.title || (candidate as any)?.job?.title || 'الوظيفة'}</span>.
                                    <br />
                                    سنطرح عليك <span className="font-black text-indigo-600 underline decoration-indigo-200 underline-offset-4">5 أسئلة جوهرية</span>.
                                </p>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                <motion.div whileHover={{ y: -5 }} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <Eye className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div className="font-black text-2xl text-slate-800 mb-1">30ث</div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">وقت القراءة</div>
                                </motion.div>
                                <motion.div whileHover={{ y: -5 }} className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 shadow-sm">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <Brain className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <div className="font-black text-2xl text-indigo-600 mb-1">15ث</div>
                                    <div className="text-xs text-indigo-500 font-bold uppercase tracking-wider">وقت التحضير</div>
                                </motion.div>
                                <motion.div whileHover={{ y: -5 }} className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 shadow-sm">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <Video className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div className="font-black text-2xl text-emerald-600 mb-1">2د</div>
                                    <div className="text-xs text-emerald-500 font-bold uppercase tracking-wider">وقت الإجابة</div>
                                </motion.div>
                            </div>

                            <button
                                onClick={() => setStep('questions')}
                                className="w-full py-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-xl shadow-indigo-200 transition-all duration-500 group"
                            >
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                                    <Video className="w-5 h-5 text-white" />
                                </div>
                                <span>ابدأ تجربة المقابلة الآن</span>
                            </button>

                            <p className="mt-6 text-slate-400 text-sm font-medium">سيتم طلب الإذن للوصول للكاميرا والميكروفون عند البدء</p>
                        </motion.div>
                    )}

                    {/* QUESTIONS STEP */}
                    {step === 'questions' && (
                        <motion.div
                            key="questions"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-7xl grid lg:grid-cols-5 gap-8 items-stretch"
                        >
                            {/* Camera Feed - 3/5 width */}
                            <div className="lg:col-span-3 bg-slate-900 rounded-[3rem] overflow-hidden relative shadow-2xl border-4 border-white aspect-video lg:aspect-auto">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                />

                                {/* Overlay AI Effect */}
                                <div className="absolute inset-0 pointer-events-none border-[16px] border-white/10 rounded-[2.5rem]" />
                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                                            <span className="text-white font-black text-xs uppercase tracking-widest shadow-sm">بث حي ومؤمن</span>
                                        </div>
                                        <h4 className="text-white text-xl font-bold truncate max-w-[200px]">{candidate?.fullName}</h4>
                                    </div>

                                    {isRecording && (
                                        <div className="flex items-center gap-3 bg-red-600/90 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-red-400/30">
                                            <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                                            <span className="text-white font-black text-sm uppercase tracking-tighter">REC • {timeLeft}s</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Question & Timer Panel - 2/5 width */}
                            <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col relative overflow-hidden"
                                onContextMenu={e => e.preventDefault()}
                                onCopy={e => e.preventDefault()}
                                onSelectStart={e => e.preventDefault()}
                                style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="px-4 py-1.5 border border-slate-200 text-slate-500 font-bold rounded-full text-xs">
                                            السؤال {currentQuestionIdx + 1} / {questions.length}
                                        </div>

                                        <div className={`p-3 rounded-2xl flex items-center justify-center ${phase === 'READING' ? 'bg-slate-100 text-slate-600' :
                                            phase === 'PREPARING' ? 'bg-amber-100 text-amber-600' :
                                                'bg-indigo-100 text-indigo-600'
                                            }`}>
                                            <Clock className="w-6 h-6" />
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-center text-center select-none">
                                        <motion.div
                                            key={currentQuestionIdx}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="space-y-6"
                                        >
                                            <h3 className="text-2xl font-black text-slate-800 leading-[1.3] min-h-[150px]"
                                                onCopy={e => e.preventDefault()}>
                                                {questions[currentQuestionIdx]}
                                            </h3>

                                            <div className="h-24 flex items-center justify-center">
                                                {phase === 'READING' && (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">وقت القراءة</span>
                                                        <span className="text-5xl font-black text-slate-800 tabular-nums">{timeLeft}</span>
                                                    </div>
                                                )}
                                                {phase === 'PREPARING' && (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className="text-amber-500 font-bold uppercase tracking-widest text-sm animate-pulse">استعد للإجابة</span>
                                                        <span className="text-5xl font-black text-amber-500 tabular-nums">{timeLeft}</span>
                                                    </div>
                                                )}
                                                {phase === 'ANSWERING' && (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce" />
                                                            <span className="text-indigo-600 font-black uppercase tracking-widest text-sm">تحدث الآن</span>
                                                        </div>
                                                        <span className="text-5xl font-black text-indigo-600 tabular-nums">{timeLeft}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>

                                    <div className="mt-10 space-y-4">
                                        <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <motion.div
                                                className={`h-full bg-gradient-to-r ${phase === 'READING' ? 'from-slate-400 to-slate-500' :
                                                    phase === 'PREPARING' ? 'from-amber-400 to-orange-500' :
                                                        'from-indigo-500 to-purple-600'
                                                    }`}
                                                initial={{ width: "100%" }}
                                                animate={{ width: "0%" }}
                                                transition={{
                                                    duration: phase === 'READING' ? 30 : phase === 'PREPARING' ? 15 : 120,
                                                    ease: "linear"
                                                }}
                                                key={`${currentQuestionIdx}-${phase}`}
                                            />
                                        </div>

                                        {phase === 'ANSWERING' ? (
                                            <button
                                                onClick={handleNext}
                                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                                            >
                                                <span>تمت الإجابة</span>
                                                <Send className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleTimerExpiry}
                                                className="w-full py-5 border-2 border-slate-100 text-slate-400 rounded-2xl font-bold hover:bg-slate-50 hover:text-slate-600 transition-all"
                                            >
                                                تخطي الانتظار
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* FINISHING STEP */}
                    {step === 'finishing' && (
                        <motion.div
                            key="finishing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center bg-white p-12 rounded-[2rem] shadow-xl max-w-lg mx-auto"
                        >
                            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-6" />
                            <h2 className="text-2xl font-black text-slate-900 mb-2">جاري حفظ إجاباتك...</h2>
                            <p className="text-slate-500 font-bold">شكراً لوقتك ومجهودك</p>
                        </motion.div>
                    )}

                    {/* FEEDBACK STEP */}
                    {step === 'feedback' && (
                        <motion.div
                            key="feedback"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center bg-white p-12 rounded-[2rem] shadow-xl max-w-lg mx-auto space-y-8"
                        >
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                                <Star className="w-10 h-10 text-indigo-500" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 mb-2">كيف كانت تجربتك؟</h2>
                                <p className="text-slate-500 font-medium">ساعدنا في تحسين منصة المقابلات</p>
                            </div>

                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="group p-2 transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <Star
                                            className={`w-10 h-10 transition-colors ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200 group-hover:text-amber-200'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                placeholder="ملاحظات إضافية (اختياري)..."
                                className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl resize-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                value={feedbackText}
                                onChange={e => setFeedbackText(e.target.value)}
                            />

                            <button
                                onClick={submitFeedback}
                                className="btn-premium w-full py-4 text-lg"
                            >
                                إرسال التقييم وإنهاء
                            </button>
                        </motion.div>
                    )}

                    {/* DONE STEP */}
                    {step === 'done' && (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center bg-white p-12 rounded-[2rem] shadow-xl max-w-lg mx-auto space-y-8"
                        >
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900">تم الانتهاء بنجاح!</h2>
                            <p className="text-xl text-slate-600 font-medium">سيتم التواصل معك قريباً بخصوص نتيجة المقابلة.</p>

                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                            >
                                العودة للرئيسية
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
};

export default InterviewPage;
