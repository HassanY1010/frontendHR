import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, CheckCircle } from 'lucide-react';

const testimonials = [
    {
        name: 'عبدالله السعدون',
        role: 'رئيس قطاع الموارد البشرية',
        company: 'شركة التقنية المتقدمة',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=120&h=120&q=80',
        content: 'نظام غير مجرى التوظيف لدينا تماماً. وفرنا أكثر من 65% من ساعات العمل اليدوي في فرز السير الذاتية وإجراء المقابلات الأولية، والتقارير التحليلية ممتازة جداً.',
        rating: 5,
    },
    {
        name: 'سارة القحطاني',
        role: 'مديرة استقطاب المواهب',
        company: 'مجموعة الأفق الاستثمارية',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?fit=crop&w=120&h=120&q=80',
        content: 'غرفة المقابلات المدعومة بالذكاء الاصطناعي كانت بمثابة نقلة نوعية. دقة تقييم الإجابات وتحليل المؤشرات أعطتنا ثقة لا متناهية في اختيار الكفاءات المناسبة.',
        rating: 5,
    },
    {
        name: 'م. فهد الزهراني',
        role: 'الرئيس التنفيذي للعمليات',
        company: 'ريادة للخدمات اللوجستية',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fit=crop&w=120&h=120&q=80',
        content: 'تطبيق الموظف وسهولة وصول الفريق لطلبات الإجازات والمهام رفع رضا الموظفين بنسبة ملحوظة. لوحة تحكم المالك تمنحني أرقاماً واضحة عن الأداء لحظة بلحظة.',
        rating: 5,
    },
];

export const TestimonialsSection = () => {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs mb-4 border border-indigo-100">
                        قصص نجاح شركائنا
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-slate-900">
                        ماذا يقول <span className="text-indigo-600">قادة الأعمال</span> عنا؟
                    </h2>
                    <p className="text-slate-600 text-lg">
                        اكتشف كيف ساهمت المنصة في تمكين فرق العمل وتحقيق أهداف المنظمات الرائدة.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.12 }}
                            className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex flex-col justify-between hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all group"
                        >
                            <div>
                                <div className="flex items-center gap-1 text-amber-400 mb-6">
                                    {[...Array(item.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed mb-8 font-normal">
                                    "{item.content}"
                                </p>
                            </div>

                            <div className="flex items-center gap-4 pt-6 border-t border-slate-200/60">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/20"
                                />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                                    <p className="text-xs text-slate-500">{item.role} - <span className="text-indigo-600 font-bold">{item.company}</span></p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
