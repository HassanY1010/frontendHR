import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { Button, Card, CardContent, CardHeader } from '@hr/ui';
import { Camera, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../../../providers/AuthProvider';
import { setFaceVerified } from '../../../utils/face-model-cache';

const FaceVerification: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'scanning' | 'success' | 'failed' | 'timeout'>('loading');
    const [message, setMessage] = useState('جاري تجهيز النظام...');
    const [loadingStep, setLoadingStep] = useState<string>('');
    const [showBypass, setShowBypass] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();
    const attemptsRef = useRef(0);
    const maxAttempts = 40;
    const mountedRef = useRef(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Stop camera
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Show bypass button after 20 seconds if still loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (mountedRef.current && (status === 'loading' || status === 'scanning')) {
                setShowBypass(true);
            }
        }, 20000);
        return () => clearTimeout(timer);
    }, [status]);

    // Overall timeout: fail after 90 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            if (mountedRef.current && (status === 'loading' || status === 'scanning')) {
                setStatus('timeout');
                setMessage('انتهت مهلة التحقق. يرجى المحاولة مرة أخرى أو استخدام الرمز البديل.');
                setShowBypass(true);
                if (intervalRef.current) clearInterval(intervalRef.current);
            }
        }, 90000);
        return () => clearTimeout(timer);
    }, [status]);

    const onVerified = useCallback(() => {
        setFaceVerified();
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimeout(() => {
            if (mountedRef.current) navigate('/');
        }, 1000);
    }, [navigate]);

    const startVideo = useCallback(async (): Promise<boolean> => {
        try {
            setLoadingStep('جاري تشغيل الكاميرا...');
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            return true;
        } catch (err: any) {
            console.error('Camera error:', err);
            if (mountedRef.current) {
                setMessage(`لا يمكن الوصول إلى الكاميرا: ${err.message || 'تأكد من منح إذن الكاميرا'}`);
                setStatus('failed');
                setShowBypass(true);
            }
            return false;
        }
    }, []);

    const loadModels = useCallback(async (): Promise<boolean> => {
        const MODEL_URL = '/models';
        const nets = [
            faceapi.nets.ssdMobilenetv1,
            faceapi.nets.faceLandmark68Net,
            faceapi.nets.faceRecognitionNet,
        ];
        try {
            setLoadingStep('جاري تحميل نماذج الذكاء الاصطناعي (قد يستغرق دقيقة)...');
            await Promise.all(nets.map(net => net.loadFromUri(MODEL_URL)));
            return true;
        } catch (err) {
            console.error('Model loading error:', err);
            if (mountedRef.current) {
                setMessage('فشل تحميل نماذج التعرف على الوجه. تحقق من اتصالك بالإنترنت.');
                setStatus('failed');
                setShowBypass(true);
            }
            return false;
        }
    }, []);

    const processReferenceImages = useCallback(async () => {
        const labels = ['admin1', 'admin2', 'admin3'];
        const adminNames: Record<string, string> = {
            'admin1': 'حاتم',
            'admin2': 'حسن',
            'admin3': 'مشاري'
        };
        const labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];

        setLoadingStep('جاري معالجة الصور المرجعية...');

        for (const label of labels) {
            try {
                const imgUrl = `/admin-faces/${label}.jpg`;
                const img = await faceapi.fetchImage(imgUrl);
                const detections = await faceapi
                    .detectSingleFace(img)
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detections) {
                    labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(label, [detections.descriptor]));
                } else {
                    console.warn(`No face detected in reference image: ${label}`);
                }
            } catch (err) {
                console.warn(`Failed to load/process reference image ${label}:`, err);
            }
        }

        if (labeledDescriptors.length === 0) {
            if (mountedRef.current) {
                setMessage('لم يتم العثور على صور مرجعية صالحة. يرجى التواصل مع الدعم الفني.');
                setStatus('failed');
                setShowBypass(true);
            }
            return null;
        }

        return { matcher: new faceapi.FaceMatcher(labeledDescriptors, 0.45), adminNames };
    }, []);

    const startScanning = useCallback((matcher: faceapi.FaceMatcher, adminNames: Record<string, string>) => {
        if (!mountedRef.current) return;

        setStatus('scanning');
        setMessage('يرجى تثبيت وجهك أمام الكاميرا...');
        setLoadingStep('');
        attemptsRef.current = 0;

        intervalRef.current = setInterval(async () => {
            if (!videoRef.current || !canvasRef.current || !mountedRef.current) return;
            if (attemptsRef.current > maxAttempts) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                if (mountedRef.current) {
                    setStatus('failed');
                    setMessage('فشل التحقق: لم يتم التعرف على الوجه. حاول مرة أخرى مع إضاءة أفضل.');
                    setShowBypass(true);
                }
                return;
            }

            attemptsRef.current += 1;

            try {
                const displaySize = {
                    width: videoRef.current.videoWidth || 640,
                    height: videoRef.current.videoHeight || 480,
                };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi
                    .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                if (resizedDetections.length > 0) {
                    const results = resizedDetections.map(d => matcher.findBestMatch(d.descriptor));
                    const match = results.find(r => r.label !== 'unknown' && r.distance < 0.45);

                    if (match) {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        if (mountedRef.current) {
                            setStatus('success');
                            const adminName = adminNames[match.label] || match.label;
                            setMessage(`تم التحقق بنجاح! مرحباً بك يا ${adminName} 👋`);
                            onVerified();
                        }
                    }
                }
            } catch (err) {
                // Silently continue scanning on transient errors
                console.warn('Scan frame error:', err);
            }
        }, 300);
    }, [onVerified, maxAttempts]);

    const runVerification = useCallback(async () => {
        // Step 1: Load models and camera in parallel
        const [cameraOk, modelsOk] = await Promise.all([startVideo(), loadModels()]);

        if (!cameraOk || !modelsOk) return;
        if (!mountedRef.current) return;

        // Step 2: Process reference images
        const result = await processReferenceImages();
        if (!result || !mountedRef.current) return;

        // Step 3: Start scanning
        startScanning(result.matcher, result.adminNames);
    }, [startVideo, loadModels, processReferenceImages, startScanning]);

    useEffect(() => {
        runVerification();
    }, [runVerification]);

    const handleBypassVerification = () => {
        // Security bypass: sets faceVerified and goes to dashboard
        // This is a fallback for when camera/models fail
        setFaceVerified();
        navigate('/');
    };

    const statusIcon = {
        loading: <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full" />,
        scanning: <Camera className="w-12 h-12 text-blue-400 animate-pulse" />,
        success: <CheckCircle className="w-14 h-14 text-green-500" />,
        failed: <XCircle className="w-14 h-14 text-red-500" />,
        timeout: <Clock className="w-14 h-14 text-orange-400" />,
    };

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
                        {(status === 'loading') && (
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
                        {status === 'loading' && showBypass && (
                            <p className="text-xs text-amber-400 flex items-center justify-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                التحميل يستغرق وقتاً أطول من المعتاد...
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

                        {/* Bypass button - shown on failure/timeout OR after 20s loading */}
                        {(status === 'failed' || status === 'timeout' || (showBypass && status === 'loading') || (showBypass && status === 'scanning')) && (
                            <Button
                                variant="ghost"
                                className="w-full border border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                                onClick={handleBypassVerification}
                            >
                                تجاوز التحقق بالوجه والدخول مباشرة
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
