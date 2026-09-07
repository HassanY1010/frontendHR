import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Clock, Award, ShieldCheck, Zap } from 'lucide-react';

const stats = [
    {
        icon: Clock,
        value: '70%',
        label: 'توفير في وقت التوظيف',
        description: 'تقليص دورة التوظيف من أسابيع إلى أيام معدودة',
        color: 'from-blue-600 to-indigo-600',
    },
    {
        icon: Users,
        value: '+50,000',
        label: 'مقابلة ذكية منجزة',
        description: 'تم تقييمها بدقة واحترافية عبر الذكاء الاصطناعي',
        color: 'from-indigo-600 to-purple-600',
    },
    {
        icon: TrendingUp,
        value: '96.8%',
        label: 'دقة المطابقة الوظيفية',
        description: 'توافق الكفاءات والمهارات مع متطلبات الشاغر',
        color: 'from-purple-600 to-pink-600',
    },
    {
        icon: ShieldCheck,
        value: '99.9%',
        label: 'جاهزية وأمان السحابة',
        description: 'تشفير بيانات متقدم متوافق مع لوائح الأمن السيبراني',
        color: 'from-emerald-600 to-teal-600',
    },
];

export const StatsSection = () => {
    return (
        <section className="py-20 relative bg-slate-900 text-white overflow-hidden">
            {/* Background glowing gradients */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full blur-[140px]" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full blur-[140px]" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs mb-4 border border-indigo-500/30">
                        أرقام تتحدث عن القيمة
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
                        نتائج حقيقية تحققها المنظمات الرائدة
                    </h2>
                    <p className="text-slate-400 text-base">
                        نمكن قادة الموارد البشرية من اتخاذ قرارات دقيقة ومبنية على البيانات في كل لحظة.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-8 rounded-3xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/50 transition-all hover:-translate-y-1"
                            >
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/20`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="text-4xl lg:text-5xl font-black text-white mb-2 tracking-tight">
                                    {stat.value}
                                </div>
                                <div className="text-lg font-bold text-slate-200 mb-2">
                                    {stat.label}
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                                    {stat.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default StatsSection;
