import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Hero from '../components/Hero';
import LogoCloud from '../components/LogoCloud';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import AISection from '../components/AISection';
import RecruitmentSection from '../components/RecruitmentSection';
import AnalyticsSection from '../components/AnalyticsSection';
import StatsSection from '../components/StatsSection';
import PricingSection from '../components/PricingSection';
import TestimonialsSection from '../components/TestimonialsSection';
import FAQSection from '../components/FAQSection';
import FinalCTA from '../components/FinalCTA';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';
import AuthTabs from '../components/AuthTabs';

const LandingPage = () => {
    const [activeAuth, setActiveAuth] = useState<'login' | 'signup' | null>(null);

    const handleOpenAuth = (mode: 'login' | 'signup') => {
        setActiveAuth(mode);
        document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Header with Nav */}
            <Header onAuthClick={handleOpenAuth} />

            <main>
                {/* 1. Hero Section */}
                <Hero onGetStarted={() => handleOpenAuth('signup')} />

                {/* 2. Social Proof Logo Cloud */}
                <LogoCloud />

                {/* 3. How It Works (4 Steps) */}
                <div id="how-it-works">
                    <HowItWorks />
                </div>

                {/* 4. Core Features Matrix */}
                <Features />

                {/* 5. Key Numbers & Proof Stats */}
                <StatsSection />

                {/* 6. Deep AI Intelligence */}
                <AISection />

                {/* 7. Recruitment Pipeline */}
                <RecruitmentSection />

                {/* 8. Analytics & BI */}
                <AnalyticsSection />

                {/* 9. Testimonials & Client Reviews */}
                <TestimonialsSection />

                {/* 10. Interactive SaaS Pricing Table */}
                <PricingSection />

                {/* 11. Frequently Asked Questions (FAQ) */}
                <FAQSection />

                {/* 12. Final High-Impact CTA Banner */}
                <FinalCTA onGetStarted={() => handleOpenAuth('signup')} />

                {/* 13. Direct Contact Interface */}
                <ContactSection />

                {/* 14. Premium Auth Registration / Login */}
                <section id="auth-section" className="py-24 bg-white border-t border-slate-100">
                    <div className="container mx-auto px-6">
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center mb-12">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs mb-3 border border-indigo-100">
                                    حساب تجريبي فوري
                                </span>
                                <h2 className="text-3xl md:text-4xl font-black mb-4 text-slate-900">
                                    انضم إلى قائمة <span className="text-indigo-600">الشركات الذكية</span>
                                </h2>
                                <p className="text-slate-500 font-medium text-sm">
                                    ابدأ تجربتك المجانية اليوم واكتشف قوة الذكاء الاصطناعي في إدارة الكفاءات
                                </p>
                            </div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="glass-card bg-white border-slate-100 p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-indigo-500/10"
                            >
                                <AuthTabs
                                    initialMode={activeAuth === 'signup' ? 'register' : 'login'}
                                    onToggleMode={(mode: 'login' | 'register') => setActiveAuth(mode === 'login' ? 'login' : 'signup')}
                                />
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
