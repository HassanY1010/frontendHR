import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';

interface FinalCTAProps {
    onGetStarted?: () => void;
}

export const FinalCTA = ({ onGetStarted }: FinalCTAProps) => {
    return (
        <section className="py-20 relative bg-white overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="relative rounded-[3rem] bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-10 md:p-16 lg:p-20 overflow-hidden shadow-2xl shadow-indigo-900/30">
                    {/* Background Light Orbs */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

                    <div className="relative z-10 max-w-4xl mx-auto text-center">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-indigo-200 font-bold text-xs mb-6 border border-white/15 backdrop-blur-md">
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            جاهز لتحويل إدارة الموارد البشرية لديك؟
                        </span>

                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                            ابدأ رحلتك مع أذكى منصة <br />
                            <span className="bg-gradient-to-r from-indigo-200 via-white to-purple-200 bg-clip-text text-transparent">
                                للموارد البشرية والتوظيف اليوم
                            </span>
                        </h2>

                        <p className="text-indigo-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                            انضم إلى مئات الشركات الرائدة واستمتع بأتمتة كاملة لعمليات التوظيف والتقييم وإدارة الفريق.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            <button
                                onClick={() => {
                                    if (onGetStarted) onGetStarted();
                                    document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white text-indigo-900 font-black text-lg hover:bg-slate-100 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 active:scale-95"
                            >
                                <span>ابدأ التجربة المجانية الآن</span>
                                <ArrowLeft className="w-5 h-5" />
                            </button>

                            <a
                                href="https://wa.me/966545206666"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-lg transition-all backdrop-blur-md"
                            >
                                حجز عرض توضيحي خاص (Demo)
                            </a>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap justify-center items-center gap-8 text-xs text-indigo-200 font-medium">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span>بدون بطاقة ائتمانية للتجربة</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span>إعداد فوري خلال دقائق</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-300" />
                                <span>تحديثات مستمرة بالذكاء الاصطناعي</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FinalCTA;
