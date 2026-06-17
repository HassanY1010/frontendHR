import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { Button, Card, CardContent, CardHeader } from '@hr/ui';
import { Camera, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../../providers/AuthProvider';
import { setFaceVerified } from '../../../utils/face-model-cache';

// ✅ Module-level flag: prevents re-loading models on re-mount (React Strict Mode safe)
let modelsLoaded = false;

const FaceVerification: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'scanning' | 'success' | 'failed' | 'timeout'>('loading');
    const [message, setMessage] = useState('جاري تجهيز النظام...');
    const [loadingStep, setLoadingStep] = useState<string>('');
    const navigate = useNavigate();
    const { logout } = useAuth();
    const mountedRef = useRef(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedRef = useRef(false); // ✅ prevents double-execution in React Strict Mode

    // ✅ Overall timeout — runs once only
    useEffect(() => {
        const timer = setTimeout(() => {
            if (mountedRef.current && (status === 'loading' || status === 'scanning')) {
                setStatus('timeout');
                setMessage('انتهت مهلة التحقق. يرجى إعادة المحاولة.');
                if (intervalRef.current) clearInterval(intervalRef.current);
            }
        }, 90000);
        return () => clearTimeout(timer);
    }, []); // ✅ empty deps — runs once

    // ✅ Main verification flow — empty deps [] to run exactly once, no infinite loop
    useEffect(() => {
        // Guard against React Strict Mode double-invocation
        if (startedRef.current) return;
        startedRef.current = true;

        const run = async () => {
            // ── STEP 1: Load AI models (sequential, not parallel with camera) ──
            // CRITICAL: TensorFlow.js WebGL backend must fully initialize BEFORE
            // opening the camera to avoid WebGL context conflict.
            if (!modelsLoaded) {
                try {
                    setLoadingStep('جاري تحميل نماذج الذكاء الاصطناعي...');
                    // Load sequentially to avoid TensorFlow initialization race condition
                    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
                    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
                    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
                    modelsLoaded = true;
                } catch (err) {
                    console.error('[FaceVerify] Model loading error:', err);
                    if (mountedRef.current) {
                        setMessage('فشل تحميل نماذج الذكاء الاصطناعي. تحقق من اتصالك بالإنترنت.');
                        setStatus('failed');
                    }
                    return;
                }
            }

            if (!mountedRef.current) return;

            // ── STEP 2: Start camera AFTER TensorFlow is fully ready ──
            try {
                setLoadingStep('جاري تشغيل الكاميرا...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: 'user' },
                });
                if (!mountedRef.current) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Wait for video metadata to be ready before scanning
                    await new Promise<void>((resolve) => {
                        if (!videoRef.current) return resolve();
                        if (videoRef.current.readyState >= 1) return resolve();
                        videoRef.current.onloadedmetadata = () => resolve();
                    });
                }
            } catch (err: any) {
                console.error('[FaceVerify] Camera error:', err);
                if (mountedRef.current) {
                    setMessage(`لا يمكن الوصول إلى الكاميرا: ${err.message || 'تأكد من منح إذن الكاميرا'}`);
                    setStatus('failed');
                }
                return;
            }

            if (!mountedRef.current) return;

            // ── STEP 3: Process reference admin images ──
            setLoadingStep('جاري معالجة الصور المرجعية...');
            const labels = ['admin1', 'admin2', 'admin3'];
            const adminNames: Record<string, string> = {
                admin1: 'حاتم',
                admin2: 'حسن',
                admin3: 'مشاري',
            };
            const labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];

            for (const label of labels) {
                try {
                    const img = await faceapi.fetchImage(`/admin-faces/${label}.jpg`);
                    const det = await faceapi
                        .detectSingleFace(img)
                        .withFaceLandmarks()
                        .withFaceDescriptor();
                    if (det) {
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

            if (labeledDescriptors.length === 0) {
                if (mountedRef.current) {
                    setMessage('لم يتم العثور على صور مرجعية صالحة. يرجى التواصل مع الدعم الفني.');
                    setStatus('failed');
                }
                return;
            }

            if (!mountedRef.current) return;

            // ── STEP 4: Start face scanning loop ──
            const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.45);
            setStatus('scanning');
            setMessage('يرجى تثبيت وجهك أمام الكاميرا...');
            setLoadingStep('');

            let attempts = 0;
            const maxAttempts = 40;

            intervalRef.current = setInterval(async () => {
                if (!mountedRef.current || !videoRef.current || !canvasRef.current) return;

                if (attempts > maxAttempts) {
                    clearInterval(intervalRef.current!);
                    if (mountedRef.current) {
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

                    const resized = faceapi.resizeResults(detections, displaySize);
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                    if (resized.length > 0) {
                        const results = resized.map(d => matcher.findBestMatch(d.descriptor));
                        const match = results.find(r => r.label !== 'unknown' && r.distance < 0.45);

                        if (match && mountedRef.current) {
                            clearInterval(intervalRef.current!);
                            setStatus('success');
                            setMessage(`تم التحقق بنجاح! مرحباً بك يا ${adminNames[match.label] || match.label} 👋`);
                            setFaceVerified();
                            setTimeout(() => {
                                if (mountedRef.current) navigate('/');
                            }, 1000);
                        }
                    }
                } catch (err) {
                    // Silently continue on transient errors during scanning
                    console.warn('[FaceVerify] Scan frame error:', err);
                }
            }, 300);
        };

        run();

        // Cleanup on unmount
        return () => {
            mountedRef.current = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // ✅ CRITICAL: empty deps — NO infinite loop, runs exactly once

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
