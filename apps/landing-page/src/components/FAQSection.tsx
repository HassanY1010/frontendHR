import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
    {
        q: 'كيف يعمل التقييم بالذكاء الاصطناعي في مقابلات الفيديو؟',
        a: 'يقوم النظام بتحليل الإجابات النصية ومطابقتها مع المهارات المطلوبة للشاغر الوظيفي، مع قياس مستوى الطلاقة، نبرة الصوت، ولغة الجسد أثناء الإجابة، ليولد تقريراً تحليلياً شاملاً يساعد مسؤول التوظيف على اتخاذ القرار السليم.',
    },
    {
        q: 'هل النظام متوافق مع نظام العمل واللوائح في المملكة العربية السعودية؟',
        a: 'نعم، النظام مصمم بالكامل ليتوافق مع أنظمة ولوائح وزارة الموارد البشرية والتنمية الاجتماعية وقواعد حماية البيانات الشخصية والأمن السيبراني، ويدعم حساب نهاية الخدمة، التأمينات، ونظام الإجازات السعودي بدقة.',
    },
    {
        q: 'هل يمكن ربط النظام مع الأنظمة الحالية لشركتنا (ERP / Payroll)؟',
        a: 'بالتأكيد، توفر باقة المؤسسات (Enterprise) واجهات برمجة تطبيقات (REST APIs) جاهزة للتكامل المباشر مع أنظمة SAP و Oracle و Odoo وبوابات الرواتب المصرفية.',
    },
    {
        q: 'كم يستغرق إعداد النظام وتدريب الفريق عليه؟',
        a: 'النظام سحابي وجاهز للاستخدام الفوري بدون أي تثبيت معقد. يمكن إنشاء حساب شركتك والبدء في نشر الوظائف وإضافة الموظفين خلال أقل من 15 دقيقة، مع توفير تدريب ودعم فني مستمر.',
    },
    {
        q: 'كيف يضمن النظام حماية وسرية بيانات الموظفين والمرشحين؟',
        a: 'تُخزن جميع البيانات في بيئة سحابية مشفرة بتشفير AES-256، مع دعم المصادقة الثنائية (2FA)، وصلاحيات وصول دقيقة حسب الأدوار (مدير، مالك، موظف) لمنع أي وصول غير مصرح به.',
    },
];

export const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (idx: number) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <section id="faq" className="py-24 bg-slate-50 relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs mb-4 border border-indigo-100">
                        الأسئلة الأكثر تكراراً
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-slate-900">
                        كل ما تحتاج <span className="text-indigo-600">معرفته عن المنصة</span>
                    </h2>
                    <p className="text-slate-600 text-lg">
                        إجابات سريعة وواضحة على الأسئلة الشائعة من قادة ومدراء الموارد البشرية.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-4">
                    {faqs.map((faq, idx) => {
                        const isOpen = openIndex === idx;
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.08 }}
                                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all"
                            >
                                <button
                                    onClick={() => toggle(idx)}
                                    className="w-full p-6 text-right flex items-center justify-between gap-4 font-bold text-base text-slate-900 hover:text-indigo-600 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 transition-transform ${isOpen ? 'rotate-180 bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}>
                                        <ChevronDown className="w-5 h-5" />
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-6 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-50 font-normal">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
