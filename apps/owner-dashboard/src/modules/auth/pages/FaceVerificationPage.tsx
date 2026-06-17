import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { Button, Card, CardContent, CardHeader } from '@hr/ui';
import { Camera, CheckCircle, XCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../../../providers/AuthProvider';
import { loadModelsFromCache, cacheModelFiles, setFaceVerified } from '../../../utils/face-model-cache';

const FALLBACK_PIN = '1234';

const FaceVerification: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'scanning' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState('جاري تحميل نماذج التعرف على الوجوه...');
    const [showPinFallback, setShowPinFallback] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    const navigate = useNavigate();
    const { logout } = useAuth();
    const attemptsRef = useRef(0);
    const maxAttempts = 100;
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => { mountedRef.current = false; };
    }, []);

    const onVerified = useCallback(() => {
        setFaceVerified();
        setTimeout(() => {
            if (mountedRef.current) navigate('/');
        }, 500);
    }, [navigate]);

    const loadModels = useCallback(async () => {
        const MODEL_URL = '/models';
        const nets = [
            faceapi.nets.ssdMobilenetv1,
            faceapi.nets.faceLandmark68Net,
            faceapi.nets.faceRecognitionNet,
        ];

        const loaded = await loadModelsFromCache(nets, MODEL_URL);
        if (loaded) {
            startVideo();
            return;
        }

        const loadTimeout = setTimeout(() => {
            if (mountedRef.current) setShowPinFallback(true);
        }, 5000);

        try {
            await Promise.all(nets.map(net => net.loadFromUri(MODEL_URL)));
            clearTimeout(loadTimeout);
            cacheModelFiles().catch(() => {});
            if (mountedRef.current) startVideo();
        } catch (error) {
            clearTimeout(loadTimeout);
            console.error('Error loading models:', error);
            if (mountedRef.current) {
                setMessage('فشل تحميل نماذج التعرف على الوجوه');
                setStatus('failed');
                setShowPinFallback(true);
            }
        }
    }, []);

    const startVideo = useCallback(() => {
        setMessage('جاري تشغيل الكاميرا...');
        navigator.mediaDevices
            .getUserMedia({ video: {} })
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch((err) => {
                console.error('Error opening video:', err);
                setMessage('تعذر الوصول للكاميرا');
                setStatus('failed');
                setShowPinFallback(true);
            });
    }, []);

    useEffect(() => {
        loadModels();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [loadModels]);

    const handlePinSubmit = () => {
        if (pinInput === FALLBACK_PIN) {
            setPinError('');
            setStatus('success');
            setMessage('تم التحقق بنجاح!');
            onVerified();
        } else {
            setPinError('رمز PIN غير صحيح');
        }
    };

    const handleVideoPlay = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setMessage('جاري معالجة الصور المرجعية...');

        const adminNames: Record<string, string> = {
            'admin1': 'حاتم',
            'admin2': 'حسن',
            'admin3': 'مشاري'
        };

        const labels = ['admin1', 'admin2', 'admin3'];
        const labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];

        try {
            for (const label of labels) {
                const imgUrl = `/admin-faces/${label}.jpg`;
                const img = await faceapi.fetchImage(imgUrl);
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

                if (detections) {
                    labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(label, [detections.descriptor]));
                } else {
                    console.warn(`No face detected in ${label}`);
                }
            }

            if (labeledDescriptors.length === 0) {
                setMessage('لم يتم العثور على صور مرجعية صالحة. يرجاء استخدام رمز PIN.');
                setStatus('failed');
                setShowPinFallback(true);
                return;
            }

            const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.45);

            setStatus('scanning');
            setMessage('يرجى تثبيت وجهك أمام الكاميرا...');

            const interval = setInterval(async () => {
                if (!videoRef.current || !canvasRef.current || !mountedRef.current) return;

                if (status === 'success' || status === 'failed') {
                    clearInterval(interval);
                    return;
                }

                if (attemptsRef.current > maxAttempts) {
                    clearInterval(interval);
                    setStatus('failed');
                    setMessage('فشل التحقق. لم يتم التعرف على الوجه.');
                    setShowPinFallback(true);
                    setTimeout(() => { if (mountedRef.current) logout(); }, 5000);
                    return;
                }

                attemptsRef.current += 1;

                const displaySize = {
                    width: videoRef.current.videoWidth,
                    height: videoRef.current.videoHeight
                };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(
                    videoRef.current,
                    new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
                )
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);

                const context = canvasRef.current.getContext('2d');
                if (context) {
                    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }

                if (resizedDetections.length > 0) {
                    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
                    const match = results.find(r => r.label !== 'unknown' && r.distance < 0.45);

                    if (match) {
                        clearInterval(interval);
                        setStatus('success');
                        const adminName = adminNames[match.label] || match.label;
                        setMessage(`تم التحقق بنجاح! مرحباً بك يا ${adminName}`);
                        onVerified();
                    }
                }
            }, 300);

        } catch (error) {
            console.error(error);
            setMessage('حدث خطأ أثناء المعالجة');
            setStatus('failed');
            setShowPinFallback(true);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <Card className="w-full max-w-lg bg-slate-800 border-slate-700 text-white">
                <CardHeader className="text-center pb-2">
                    <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                        <Camera className="w-8 h-8 text-amber-500" />
                        التحقق من الهوية
                    </h2>
                    <p className="text-slate-400">نظام التعرف على الوجوه الأمني</p>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-slate-600">
                        <video
                            ref={videoRef}
                            onPlay={handleVideoPlay}
                            autoPlay
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                        {status === 'loading' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 transition-all">
                                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full" />
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/20 backdrop-blur-sm z-20">
                                <CheckCircle className="w-16 h-16 text-green-500 mb-2" />
                                <span className="text-xl font-bold text-green-100">تم التحقق</span>
                            </div>
                        )}

                        {status === 'failed' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/20 backdrop-blur-sm z-20">
                                <XCircle className="w-16 h-16 text-red-500 mb-2" />
                                <span className="text-xl font-bold text-red-100">فشل التحقق</span>
                            </div>
                        )}
                    </div>

                    <div className="text-center space-y-2 w-full">
                        <p className={`text-lg font-medium ${status === 'success' ? 'text-green-400' :
                            status === 'failed' ? 'text-red-400' : 'text-slate-200'
                            }`}>
                            {message}
                        </p>
                        {status !== 'success' && !showPinFallback && (
                            <p className="text-xs text-slate-500">
                                يرجى التأكد من وجود إضاءة كافية والنظر مباشرة للكاميرا
                            </p>
                        )}
                    </div>

                    {showPinFallback && status !== 'success' && (
                        <div className="w-full space-y-3 border-t border-slate-700 pt-4 mt-2">
                            <p className="text-sm text-slate-400 text-center flex items-center justify-center gap-2">
                                <KeyRound className="w-4 h-4" />
                                أو استخدم رمز PIN للتحقق السريع
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={pinInput}
                                    onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handlePinSubmit(); }}
                                    placeholder="أدخل رمز PIN"
                                    className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-center text-lg tracking-widest focus:outline-none focus:border-amber-500"
                                    maxLength={6}
                                    autoFocus
                                />
                                <Button variant="primary" onClick={handlePinSubmit} className="px-6">
                                    تحقق
                                </Button>
                            </div>
                            {pinError && (
                                <p className="text-red-400 text-sm text-center">{pinError}</p>
                            )}
                        </div>
                    )}

                    {status === 'failed' && !showPinFallback && (
                        <Button
                            variant="danger"
                            className="w-full mt-4"
                            onClick={logout}
                        >
                            تسجيل الخروج
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FaceVerification;
