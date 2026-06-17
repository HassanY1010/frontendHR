import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { Button, Card, CardContent, CardHeader } from '@hr/ui';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../../providers/AuthProvider';
import { setFaceVerified } from '../../../utils/face-model-cache';

const FaceVerification: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'scanning' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState('جاري تحميل نماذج التعرف على الوجوه...');
    const navigate = useNavigate();
    const { logout } = useAuth();
    const attemptsRef = useRef(0);
    const maxAttempts = 30;
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

    const startVideo = useCallback(async (): Promise<void> => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, []);

    const loadModelsAndStart = useCallback(async () => {
        setMessage('جاري تجهيز النظام...');
        const MODEL_URL = '/models';
        const nets = [
            faceapi.nets.ssdMobilenetv1,
            faceapi.nets.faceLandmark68Net,
            faceapi.nets.faceRecognitionNet,
        ];

        try {
            await Promise.all([
                startVideo(),
                Promise.all(nets.map(net => net.loadFromUri(MODEL_URL))),
            ]);
            if (mountedRef.current) setMessage('جاري معالجة الصور المرجعية...');
        } catch (error) {
            console.error('Error loading models or camera:', error);
            if (mountedRef.current) {
                setMessage('حدث خطأ في تحميل النظام. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
                setStatus('failed');
            }
        }
    }, [startVideo]);

    useEffect(() => {
        loadModelsAndStart();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [loadModelsAndStart]);

    const handleVideoPlay = async () => {
        if (!videoRef.current || !canvasRef.current) return;

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
                setMessage('لم يتم العثور على صور مرجعية صالحة. يرجى التواصل مع الدعم الفني.');
                setStatus('failed');
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
                        {status === 'scanning' && (
                            <p className="text-xs text-slate-500">
                                يرجى التأكد من وجود إضاءة كافية والنظر مباشرة للكاميرا
                            </p>
                        )}
                    </div>

                    {status === 'failed' && (
                        <div className="flex gap-3 w-full">
                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={() => window.location.reload()}
                            >
                                إعادة المحاولة
                            </Button>
                            <Button
                                variant="danger"
                                onClick={logout}
                            >
                                تسجيل الخروج
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FaceVerification;
