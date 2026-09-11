import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles, Send, Bot, User, CheckCircle2,
    Search, Briefcase, MapPin, Award,
    TrendingUp, Users, RefreshCw
} from 'lucide-react';
import { copilotService, CopilotMessage, CandidateRecommendation } from '@hr/services';
import { Button, Card, CardContent, Badge } from '@hr/ui';
import { toast } from 'sonner';

export const RecruitmentCopilotPage: React.FC = () => {
    const [messages, setMessages] = useState<CopilotMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'مرحباً بك! أنا مساعد التوظيف الذكي (Recruitment Copilot). صف لي احتياجك الوظيفي باللغة الطبيعية (مثال: "أحتاج مدير مبيعات في الرياض، سعودي، خبرة 7 سنوات، يتحدث الإنجليزية") وسأقوم فوراً بهيكلة المتطلبات، تحليل معايير السوق، واقتراح أفضل المرشحين المؤهلين.',
            createdAt: new Date().toISOString()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | undefined>(undefined);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [marketInsights, setMarketInsights] = useState<any>(null);
    const [candidates, setCandidates] = useState<CandidateRecommendation[]>([]);
    const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);
    const [isCreatingJob, setIsCreatingJob] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);



    const handleSendMessage = async (customText?: string) => {
        const text = customText || inputText;
        if (!text.trim() || isLoading) return;

        const userMsg: CopilotMessage = {
            id: `usr_${Date.now()}`,
            role: 'user',
            content: text,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        if (!customText) setInputText('');
        setIsLoading(true);

        try {
            const res = await copilotService.sendMessage(text, sessionId);
            setSessionId(res.sessionId);
            setMessages(prev => [...prev, res.message]);

            if (res.extractedData) {
                setExtractedData(res.extractedData);
            }
            if (res.marketInsights) {
                setMarketInsights(res.marketInsights);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'حدث خطأ أثناء التواصل مع المساعد الذكي');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmCreateJob = async () => {
        if (!sessionId || !extractedData) {
            toast.error('لا توجد بيانات وظيفة مستخرجة لإنشائها');
            return;
        }
        setIsCreatingJob(true);
        try {
            const res = await copilotService.createJobRequest(sessionId, extractedData);
            toast.success(`تم إنشاء طلب التوظيف بنجاح برقم (${res.jobRequest?.requestId})!`);
            
            // Add confirmation message to chat
            setMessages(prev => [
                ...prev,
                {
                    id: `asst_${Date.now()}`,
                    role: 'assistant',
                    content: `🎉 رائع! تم إنشاء وتثبيت طلب التوظيف (${res.jobRequest?.jobTitle}) في النظام برقم مرجعي: ${res.jobRequest?.requestId}. هل ترغب في بدء مطابقة وفحص المرشحين المناسبين الآن؟`,
                    createdAt: new Date().toISOString()
                }
            ]);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'فشل في إنشاء طلب التوظيف');
        } finally {
            setIsCreatingJob(false);
        }
    };

    const handleSearchCandidates = async () => {
        setIsSearchingCandidates(true);
        try {
            const res = await copilotService.searchCandidates(sessionId, extractedData);
            setCandidates(res.candidates);
            toast.success(`تم فحص ومطابقة ${res.candidates.length} مرشح من قاعدة بيانات الشركة`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'فشل في البحث عن المرشحين');
        } finally {
            setIsSearchingCandidates(false);
        }
    };

    const quickPrompts = [
        'أحتاج مدير مبيعات في الرياض، سعودي، خبرة 7 سنوات، يتحدث الإنجليزية',
        'مطلوب مطور React واجهات أمامية، خبرة 4 سنوات، للعمل عن بُعد',
        'أبحث عن أخصائي موارد بشرية بالدمام، خبرة 5 سنوات مع إتقان منصات قوى والتأمينات'
    ];

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Recruitment Copilot — مساعد التوظيف الذكي</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black">أتمتة رحلة التوظيف بالذكاء الاصطناعي</h1>
                    <p className="text-indigo-200/80 text-sm mt-1 max-w-xl">
                        تحدث باللغة الطبيعية لإنشاء طلبات التوظيف، تحليل متطلبات السوق، وفحص ومطابقة أفضل الكفاءات بدقة فائقة.
                    </p>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            setMessages([
                                {
                                    id: 'welcome',
                                    role: 'assistant',
                                    content: 'بدأنا محادثة جديدة! صف لي احتياجك الوظيفي بالتفصيل وسأقوم بتحليله فوراً.',
                                    createdAt: new Date().toISOString()
                                }
                            ]);
                            setSessionId(undefined);
                            setExtractedData(null);
                            setMarketInsights(null);
                            setCandidates([]);
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold"
                    >
                        <RefreshCw className="w-4 h-4 ml-1.5" /> محادثة جديدة
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Chat Column (7 cols) */}
                <div className="lg:col-span-7 flex flex-col h-[700px] bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-xl overflow-hidden">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-start' : 'justify-start'}`}
                            >
                                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-md ${
                                    msg.role === 'user'
                                        ? 'bg-gradient-to-tr from-slate-700 to-slate-900 text-white'
                                        : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-indigo-500/20'
                                }`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className="space-y-3 max-w-[85%]">
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white rounded-tr-none font-medium'
                                            : 'bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-slate-100 border border-indigo-100 dark:border-indigo-900/50 rounded-tl-none font-normal'
                                    }`}>
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    </div>

                                    {/* Action Chips if AI proposed */}
                                    {msg.actions && msg.actions.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {msg.actions.map((act, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={handleConfirmCreateJob}
                                                    disabled={isCreatingJob}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all transform active:scale-95 disabled:opacity-50"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>{act.label}</span>
                                                </button>
                                            ))}
                                            <button
                                                onClick={handleSearchCandidates}
                                                disabled={isSearchingCandidates}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 disabled:opacity-50"
                                            >
                                                <Search className="w-3.5 h-3.5" />
                                                <span>البحث عن مرشحين متطابقين</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {isLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center">
                                <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center animate-pulse">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="px-4 py-3 bg-indigo-50 dark:bg-gray-800 rounded-2xl text-xs text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                                    المساعد الذكي يحلل متطلباتك ويستخرج هيكل الوظيفة...
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestions Chips */}
                    <div className="p-3 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <span className="text-[11px] font-bold text-slate-400 shrink-0">أمثلة سريعة:</span>
                        {quickPrompts.map((p, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSendMessage(p)}
                                className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-gray-700 transition whitespace-nowrap shrink-0 font-medium"
                            >
                                {p.length > 35 ? p.substring(0, 35) + '...' : p}
                            </button>
                        ))}
                    </div>

                    {/* Input Bar */}
                    <div className="p-4 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="اكتب طلب التوظيف هنا باللغة الطبيعية..."
                                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isLoading || !inputText.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 px-5 rounded-2xl font-bold h-12 shadow-lg shadow-indigo-600/20"
                            >
                                <Send className="w-4 h-4 ml-1.5" /> إرسال
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Right Analytics & Funnel Column (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Extracted Requirements Widget */}
                    <Card className="border-slate-200 dark:border-gray-800 shadow-lg rounded-3xl overflow-hidden">
                        <CardContent className="p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-3">
                                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-indigo-600" />
                                    هيكل متطلبات الوظيفة المستخرجة
                                </h3>
                                {extractedData && (
                                    <Badge variant="success" className="text-[10px] font-bold">جاهز للتأكيد</Badge>
                                )}
                            </div>

                            {extractedData ? (
                                <div className="space-y-3 text-sm">
                                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-1.5">
                                        <p className="text-xs text-indigo-500 font-bold">المسمى الوظيفي</p>
                                        <p className="font-black text-slate-900 dark:text-white text-base">{extractedData.jobTitle}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2.5 bg-slate-50 dark:bg-gray-800 rounded-xl">
                                            <span className="text-[11px] text-slate-400 font-bold block">الموقع</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3 text-red-500" /> {extractedData.location || 'الرياض'}
                                            </span>
                                        </div>
                                        <div className="p-2.5 bg-slate-50 dark:bg-gray-800 rounded-xl">
                                            <span className="text-[11px] text-slate-400 font-bold block">الخبرة المطلوبة</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1 mt-0.5">
                                                <Award className="w-3 h-3 text-amber-500" /> {extractedData.experienceYears || 3} سنوات+
                                            </span>
                                        </div>
                                    </div>

                                    {extractedData.requiredSkills && (
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold mb-1.5">المهارات المستخرجة:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {extractedData.requiredSkills.map((s: string, idx: number) => (
                                                    <span key={idx} className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg border border-indigo-100 dark:border-indigo-800">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <Button
                                        variant="primary"
                                        onClick={handleConfirmCreateJob}
                                        disabled={isCreatingJob}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-xs py-2.5 shadow-md shadow-indigo-600/20 mt-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4 ml-1.5" /> تأكيد وإنشاء طلب التوظيف
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 space-y-2">
                                    <Bot className="w-8 h-8 mx-auto text-slate-300" />
                                    <p className="text-xs">اكتب طلب التوظيف في المحادثة ليتم استخراج وهيكلة كافة الحقول تلقائياً.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Market Insights Widget */}
                    {marketInsights && (
                        <Card className="border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/40 to-purple-50/40 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-3xl shadow-lg">
                            <CardContent className="p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-indigo-950 dark:text-indigo-200 text-sm flex items-center gap-1.5">
                                        <TrendingUp className="w-4 h-4 text-indigo-600" /> قراءة مؤشرات السوق
                                    </h4>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                                        تقدير تحليلي للمنصة
                                    </span>
                                </div>
                                <div className="space-y-2 text-xs">
                                    {marketInsights.estimatedMarketSalaryAverage && (
                                        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-indigo-100/60 dark:border-gray-700">
                                            <span className="text-slate-500 font-bold">متوسط الراتب المتوقع:</span>
                                            <span className="font-black text-slate-900 dark:text-white">{marketInsights.estimatedMarketSalaryAverage}</span>
                                        </div>
                                    )}
                                    {marketInsights.marketTip && (
                                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                                            💡 {marketInsights.marketTip}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Funnel & Matched Candidates Widget */}
                    {candidates.length > 0 && (
                        <Card className="border-slate-200 dark:border-gray-800 shadow-lg rounded-3xl">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                        <Users className="w-4 h-4 text-emerald-600" />
                                        أفضل المرشحين المتطابقين ({candidates.length})
                                    </h3>
                                    <Badge variant="success" className="text-xs font-bold">مطابقة ذكية</Badge>
                                </div>

                                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                    {candidates.slice(0, 4).map((c, idx) => (
                                        <div key={idx} className="p-3.5 bg-slate-50 dark:bg-gray-800/60 rounded-2xl border border-slate-100 dark:border-gray-700 space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h5 className="font-black text-slate-900 dark:text-white text-xs">{c.fullName}</h5>
                                                    <p className="text-[11px] text-slate-500 font-medium">{c.currentTitle} • {c.location}</p>
                                                </div>
                                                <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                                                    c.matchScore >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    تطابق {c.matchScore}%
                                                </span>
                                            </div>

                                            {c.strengths && c.strengths[0] && (
                                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg">
                                                    ✓ {c.strengths[0]}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecruitmentCopilotPage;
