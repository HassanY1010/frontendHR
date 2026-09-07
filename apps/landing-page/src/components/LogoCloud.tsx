import React from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';

const companies = [
    { name: 'شركة أرامكو رائدة الحلول', label: 'تقنية المعلومات' },
    { name: 'مجموعة الفنار القابضة', label: 'الصناعة والطاقة' },
    { name: 'شركة علم للحلول الرقمية', label: 'الحلول السحابية' },
    { name: 'مستشفيات رعاية الصحية', label: 'القطاع الطبي' },
    { name: 'بنك الخليج للاستثمار', label: 'الخدمات المالية' },
    { name: 'شركة جاهز الدولية', label: 'اللوجستيات' },
];

export const LogoCloud = () => {
    return (
        <section className="py-12 bg-white/60 border-y border-slate-100 backdrop-blur-md">
            <div className="container mx-auto px-6">
                <div className="text-center mb-8">
                    <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
                        موثوق به من قبل رواد الأعمال وأكثر من <span className="text-indigo-600 font-extrabold">+500 شركة ومؤسسة</span> في الشرق الأوسط
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center">
                    {companies.map((comp, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.08 }}
                            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/80 hover:bg-white hover:shadow-md border border-slate-100 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2 group-hover:scale-110 transition-transform">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-700 text-xs text-center line-clamp-1">{comp.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{comp.label}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LogoCloud;
