import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Sparkles, Video, CheckCircle, ArrowLeft } from 'lucide-react';

const steps = [
    {
        number: '01',
        title: 'أضف الشواغر وحدد الكفاءات',
        description: 'اكتب تفاصيل الوظيفة أو دع الذكاء الاصطناعي يولد الوصف الوظيفي ومعايير التقييم بنقرة واحدة.',
        icon: UserPlus,
        color: 'from-blue-500 to-indigo-600',
    },
    {
        number: '02',
        title: 'فرز وتقييم ذكي فوري',
        description: 'يقوم محرك AI بمطابقة السير الذاتية، وتحليل الخبرات، واقتراح أفضل المرشحين المؤهلين تلقائياً.',
        icon: Sparkles,
        color: 'from-indigo-600 to-purple-600',
    },
    {
        number: '03',
        title: 'مقابلات ذكية ومجدولة',
        description: 'إجراء مقابلات فيديو ذكية مع تقييم نبرة الصوت، لغة الجسد، والإجابات الفنية بتقارير جاهزة للاعتماد.',
        icon: Video,
        color: 'from-purple-600 to-pink-600',
    },
    {
        number: '04',
        title: 'قرار توظيف سريع وموثوق',
        description: 'لوحات تحكم تمنحك الرؤية الشاملة لتقديم عروض العمل وإتمام إجراءات التوظيف بكل سلاسة.',
        icon: CheckCircle,
        color: 'from-emerald-500 to-teal-600',
    },
];

export const HowItWorks = () => {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs mb-4 border border-indigo-100">
                        بساطة وسرعة فائقة
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-slate-900">
                        كيف يعمل <span className="text-indigo-600">النظام في 4 خطوات؟</span>
                    </h2>
                    <p className="text-slate-600 text-lg">
                        تجربة استخدام صُممت لتختصر مئات ساعات العمل اليدوي وتمنحك أفضل الكفاءات بأعلى دقة.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                    {steps.map((step, idx) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 25 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.12 }}
                                className="relative p-8 rounded-3xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-xl transition-all group"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <span className="text-3xl font-black text-slate-200 group-hover:text-indigo-200 transition-colors">
                                        {step.number}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                                    {step.title}
                                </h3>

                                <p className="text-sm text-slate-500 leading-relaxed font-normal">
                                    {step.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
