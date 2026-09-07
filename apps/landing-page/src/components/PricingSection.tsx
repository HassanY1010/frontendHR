import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Zap, Shield, PhoneCall } from 'lucide-react';

export const PricingSection = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

    const plans = [
        {
            name: 'الباقة الأساسية (Starter)',
            badge: 'للشركات الناشئة',
            monthlyPrice: '499',
            yearlyPrice: '399',
            period: 'شهرياً / تدفع سنوياً',
            description: 'مثالية للشركات الصغيرة التي تبدأ أتمتة إدارة التوظيف والموظفين.',
            features: [
                'إدارة حتى 30 موظفاً',
                'نشر 5 وظائف نشطة شهرياً',
                'فرز السير الذاتية بالذكاء الاصطناعي',
                'جدولة المقابلات الآلية',
                'تطبيق الموظف للخدمة الذاتية',
                'دعم فني عبر البريد',
            ],
            highlighted: false,
            ctaText: 'ابدأ التجربة المجانية',
            ctaStyle: 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50',
        },
        {
            name: 'الباقة الاحترافية (Pro Growth)',
            badge: 'الأكثر طلباً ⭐',
            monthlyPrice: '1,199',
            yearlyPrice: '949',
            period: 'شهرياً / تدفع سنوياً',
            description: 'للشركات المتنامية التي تحتاج مقابلات ذكية وتحليلات متقدمة.',
            features: [
                'إدارة حتى 150 موظفاً',
                'وظائف وشواغر غير محدودة',
                'غرفة مقابلات الفيديو التفاعلية بالذكاء الاصطناعي',
                'مراقبة وتحليل التفاعل ونبرة الصوت ولغة الجسد',
                'لوحة مؤشرات الأداء والتحليلات المتقدمة (BI)',
                'توليد التوصيف الوظيفي آلياً بـ GPT-4',
                'دعم فني ذو أولوية 24/7 عبر واتساب',
            ],
            highlighted: true,
            ctaText: 'اشترك في الباقة الاحترافية',
            ctaStyle: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/25',
        },
        {
            name: 'باقة المؤسسات (Enterprise)',
            badge: 'حلول مخصصة',
            monthlyPrice: 'مخصص',
            yearlyPrice: 'مخصص',
            period: 'حسب حجم المؤسسة',
            description: 'للمؤسسات الكبرى والقطاعات الحكومية التي تتطلب تخصيصاً وربطاً كاملاً.',
            features: [
                'عدد موظفين وشواغر غير محدود',
                'خوادم سحابية خاصة أو On-Premise',
                'ربط API مع أنظمة ERP (SAP, Oracle, Odoo)',
                'مدير حساب مخصص وتدريب ميداني',
                'تخصيص كامل للهوية البصرية والنماذج',
                'اتفاقية مستوى الخدمة (SLA 99.9%)',
            ],
            highlighted: false,
            ctaText: 'تواصل مع فريق المبيعات',
            ctaStyle: 'bg-slate-900 text-white hover:bg-slate-800',
        },
    ];

    return (
        <section id="pricing" className="py-24 bg-slate-50 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs mb-4 border border-indigo-100">
                        خطط واضحة بدون تكاليف خفية
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-slate-900">
                        استثمر في <span className="text-indigo-600">كفاءة فريقك</span> اليوم
                    </h2>
                    <p className="text-slate-600 text-lg mb-8">
                        اختر الباقة المناسبة لحجم أعمالك مع إمكانية الترقية أو الإلغاء في أي وقت.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-3 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                billingCycle === 'monthly'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            الدفع الشهري
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                billingCycle === 'yearly'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span>الدفع السنوي</span>
                            <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                                وفر 20%
                            </span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
                    {plans.map((plan, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between transition-all relative ${
                                plan.highlighted
                                    ? 'bg-white border-2 border-indigo-500 shadow-2xl shadow-indigo-500/15 lg:-translate-y-3'
                                    : 'bg-white border border-slate-200/80 shadow-md hover:shadow-xl'
                            }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-4 right-1/2 translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-md">
                                    {plan.badge}
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                                    {!plan.highlighted && (
                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                            {plan.badge}
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-slate-500 mb-6 leading-relaxed font-normal min-h-[36px]">
                                    {plan.description}
                                </p>

                                <div className="mb-8 pb-6 border-b border-slate-100">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl lg:text-5xl font-black text-slate-900">
                                            {billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                                        </span>
                                        {plan.yearlyPrice !== 'مخصص' && (
                                            <span className="text-sm font-bold text-slate-500">ر.س</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium">
                                        {plan.period}
                                    </span>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                        المميزات المتضمنة:
                                    </div>
                                    {plan.features.map((feat, fIdx) => (
                                        <div key={fIdx} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-xs text-slate-700 font-medium leading-tight">
                                                {feat}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <a
                                href="https://wa.me/966545206666"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-full py-4 rounded-2xl font-bold text-sm text-center transition-all flex items-center justify-center gap-2 ${plan.ctaStyle}`}
                            >
                                {plan.ctaText}
                            </a>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
