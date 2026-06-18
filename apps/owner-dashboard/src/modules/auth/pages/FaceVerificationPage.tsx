import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { Button, Card, CardContent, CardHeader } from '@hr/ui';
import { Camera, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../../providers/AuthProvider';
import { setFaceVerified } from '../../../utils/face-model-cache';

// ✅ Cache the load models promise globally to avoid parallel load calls
let loadModelsPromise: Promise<void> | null = null;

const loadModelsOnce = () => {
    if (loadModelsPromise) return loadModelsPromise;
    loadModelsPromise = (async () => {
        const loadPromise = Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('انتهت مهلة تحميل نماذج الذكاء الاصطناعي (15 ثانية)')), 15000)
        );

        await Promise.race([loadPromise, timeoutPromise]);
    })();

    // Reset cache on failure to allow retry
    loadModelsPromise.catch(() => {
        loadModelsPromise = null;
    });

    return loadModelsPromise;
};

const FaceVerification: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'scanning' | 'success' | 'failed' | 'timeout'>('loading');
    const [message, setMessage] = useState('جاري تجهيز النظام...');
    const [loadingStep, setLoadingStep] = useState<string>('');
    const navigate = useNavigate();
    const { logout } = useAuth();

    // ✅ Overall timeout — runs once only
    useEffect(() => {
        let active = true;
        const timer = setTimeout(() => {
            if (active && (status === 'loading' || status === 'scanning')) {
                setStatus('timeout');
                setMessage('انتهت مهلة التحقق. يرجى إعادة المحاولة.');
            }
        }, 90000);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [status]);

    // ✅ Main verification flow — empty deps [] to run exactly once per mount
    useEffect(() => {
        let active = true;
        let stream: MediaStream | null = null;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const run = async () => {
            // ── STEP 1: Load AI models ──
            try {
                setLoadingStep('جاري تحميل نماذج الذكاء الاصطناعي...');
                await loadModelsOnce();
                if (!active) return;

                // ── STEP 2: Start camera AFTER TensorFlow is fully ready ──
                setLoadingStep('جاري تشغيل الكاميرا...');
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: 'user' },
                });
                if (!active) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    
                    // Timeout metadata loading to avoid infinite pending
                    await Promise.race([
                        new Promise<void>((resolve) => {
                            if (!videoRef.current) return resolve();
                            if (videoRef.current.readyState >= 1) return resolve();
                            videoRef.current.onloadedmetadata = () => resolve();
                        }),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('انتهت مهلة تشغيل الكاميرا (10 ثوان)')), 10000)
                        )
                    ]);
                }
            } catch (err: any) {
                console.error('[FaceVerify] Initialization error:', err);
                if (active) {
                    setMessage(`لا يمكن الوصول إلى الكاميرا أو النماذج: ${err.message || 'تأكد من منح إذن الكاميرا'}`);
                    setStatus('failed');
                }
                return;
            }

            if (!active) return;

            // ── STEP 3: Process reference admin images ──
            try {
                const labels = ['admin1', 'admin2', 'admin3'];
                const adminNames: Record<string, string> = {
                    admin1: 'حاتم',
                    admin2: 'حسن',
                    admin3: 'مشاري',
                };
                let labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];

                // Try loading from localStorage cache first
                const cachedDescriptors = localStorage.getItem('adminFaceDescriptors');
                if (cachedDescriptors) {
                    setLoadingStep('جاري تحميل الصور المرجعية من الذاكرة المؤقتة...');
                    try {
                        const parsed = JSON.parse(cachedDescriptors);
                        labeledDescriptors = parsed.map((item: any) => 
                            new faceapi.LabeledFaceDescriptors(
                                item.label,
                                item.descriptors.map((d: any) => new Float32Array(Object.values(d)))
                            )
                        );
                    } catch (cacheErr) {
                        console.warn('[FaceVerify] Failed to parse cached descriptors, re-detecting:', cacheErr);
                        localStorage.removeItem('adminFaceDescriptors');
                    }
                }

                // If cache is empty or failed, run face detection on images
                if (labeledDescriptors.length === 0) {
                    for (let i = 0; i < labels.length; i++) {
                        const label = labels[i];
                        setLoadingStep(`جاري معالجة الصورة المرجعية ${i + 1} من ${labels.length}...`);
                        
                        // Yield to let the browser paint the loading message update
                        await new Promise(resolve => setTimeout(resolve, 50));
                        if (!active) return;

                        try {
                            const img = await faceapi.fetchImage(`/admin-faces/${label}.jpg`);
                            const det = await faceapi
                                .detectSingleFace(img)
                                .withFaceLandmarks()
                                .withFaceDescriptor();
                            if (det && active) {
                                labeledDescriptors.push(
                                    new faceapi.LabeledFaceDescriptors(label, [det.descriptor])
                                );
                            } else {
                                console.warn(`[FaceVerify] No face detected in reference image: ${label}`);
                            }
                        } catch (err) {
                            console.warn(`[FaceVerify] Failed to process reference image ${label}:`, err);
                        }
                    }

                    // Save computed descriptors to cache if valid
                    if (labeledDescriptors.length > 0 && active) {
                        localStorage.setItem('adminFaceDescriptors', JSON.stringify(
                            labeledDescriptors.map(ld => ({
                                label: ld.label,
                                descriptors: ld.descriptors.map(d => Array.from(d))
                            }))
                        ));
                    }
                }

                if (!active) return;

                if (labeledDescriptors.length === 0) {
                    setMessage('لم يتم العثور على صور مرجعية صالحة. يرجى التواصل مع الدعم الفني.');
                    setStatus('failed');
                    return;
                }

                // ── STEP 4: Start face scanning loop ──
                const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.45);
                setStatus('scanning');
                setMessage('يرجى تثبيت وجهك أمام الكاميرا...');
                setLoadingStep('');

                let attempts = 0;
                const maxAttempts = 40;

                intervalId = setInterval(async () => {
                    if (!active || !videoRef.current || !canvasRef.current) return;

                    if (attempts > maxAttempts) {
                        if (intervalId) clearInterval(intervalId);
                        if (active) {
                            setStatus('failed');
                            setMessage('فشل التحقق: لم يتم التعرف على الوجه. حاول مرة أخرى مع إضاءة أفضل.');
                        }
                        return;
                    }

                    attempts++;

                    try {
                        const displaySize = {
                            width: videoRef.current.videoWidth || 640,
                            height: videoRef.current.videoHeight || 480,
                        };
                        faceapi.matchDimensions(canvasRef.current, displaySize);

                        const detections = await faceapi
                            .detectAllFaces(
                                videoRef.current,
                                new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
                            )
                            .withFaceLandmarks()
                            .withFaceDescriptors();

                        if (!active) return;

                        const resized = faceapi.resizeResults(detections, displaySize);
                        const ctx = canvasRef.current.getContext('2d');
                        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                        if (resized.length > 0) {
                            const results = resized.map(d => matcher.findBestMatch(d.descriptor));
                            const match = results.find(r => r.label !== 'unknown' && r.distance < 0.45);

                            if (match && active) {
                                if (intervalId) clearInterval(intervalId);
                                setStatus('success');
                                setMessage(`تم التحقق بنجاح! مرحباً بك يا ${adminNames[match.label] || match.label} 👋`);
                                setFaceVerified();
                                setTimeout(() => {
                                    if (active) navigate('/');
                                }, 1000);
                            }
                        }
                    } catch (err) {
                        // Silently continue on transient errors during scanning
                        console.warn('[FaceVerify] Scan frame error:', err);
                    }
                }, 300);
            } catch (err: any) {
                console.error('[FaceVerify] Processing error:', err);
                if (active) {
                    setMessage('حدث خطأ أثناء معالجة الصور. يرجى المحاولة مرة أخرى.');
                    setStatus('failed');
                }
            }
        };

        run();

        // Cleanup on unmount
        return () => {
            active = false;
            if (intervalId) clearInterval(intervalId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [navigate]);

    const statusColors = {
        loading: 'text-slate-200',
        scanning: 'text-blue-300',
        success: 'text-green-400',
        failed: 'text-red-400',
        timeout: 'text-orange-400',
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4" dir="rtl">
            <Card className="w-full max-w-lg bg-slate-800 border-slate-700 text-white">
                <CardHeader className="text-center pb-2">
                    <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                        <Camera className="w-8 h-8 text-amber-500" />
                        التحقق من الهوية
                    </h2>
                    <p className="text-slate-400 text-sm">نظام التعرف على الوجوه الأمني</p>
                </CardHeader>

                <CardContent className="flex flex-col items-center gap-4">
                    {/* Video / Camera area */}
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-slate-600">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                        {/* Loading overlay */}
                        {status === 'loading' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 gap-4">
                                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full" />
                                {loadingStep && (
                                    <p className="text-slate-300 text-sm text-center px-4">{loadingStep}</p>
                                )}
                            </div>
                        )}

                        {/* Success overlay */}
                        {status === 'success' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/20 backdrop-blur-sm z-20">
                                <CheckCircle className="w-16 h-16 text-green-500 mb-2" />
                                <span className="text-xl font-bold text-green-100">تم التحقق</span>
                            </div>
                        )}

                        {/* Failed / Timeout overlay */}
                        {(status === 'failed' || status === 'timeout') && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 backdrop-blur-sm z-20">
                                {status === 'timeout'
                                    ? <Clock className="w-16 h-16 text-orange-400 mb-2" />
                                    : <XCircle className="w-16 h-16 text-red-500 mb-2" />
                                }
                                <span className="text-lg font-bold text-red-100">
                                    {status === 'timeout' ? 'انتهت المهلة' : 'فشل التحقق'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Status message */}
                    <div className="text-center space-y-1 w-full">
                        <p className={`text-base font-medium ${statusColors[status]}`}>
                            {message}
                        </p>
                        {status === 'scanning' && (
                            <p className="text-xs text-slate-500">
                                يرجى التأكد من وجود إضاءة كافية والنظر مباشرة للكاميرا
                            </p>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 w-full">
                        {(status === 'failed' || status === 'timeout') && (
                            <Button
                                variant="primary"
                                className="w-full"
                                onClick={() => window.location.reload()}
                            >
                                إعادة المحاولة
                            </Button>
                        )}
                        <Button
                            variant="danger"
                            className="w-full"
                            onClick={logout}
                        >
                            تسجيل الخروج
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default FaceVerification;
