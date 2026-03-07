import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader2, CheckCircle2, Sparkles, RotateCcw } from 'lucide-react'
import { recruitmentService } from '@hr/services'
import type { Job } from '@hr/types'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface JobAiChatProps {
    onComplete: (jobData: Partial<Job>) => void
    onCancel: () => void
}

// --- State Machine Definition ---
interface CollectedData {
    title?: string
    seniorityLevel?: string
    employmentType?: string
    workMode?: string
    city?: string
    salaryMin?: number
    salaryMax?: number
    yearsOfExperience?: number
    skills?: string
}

const QUESTIONS: { key: keyof CollectedData; question: string }[] = [
    { key: 'title', question: 'ما هو مسمى الوظيفة التي ترغب في الإعلان عنها؟' },
    { key: 'seniorityLevel', question: 'ما هو مستوى الخبرة المطلوب؟ (مبتدئ / متوسط / خبير / قائد فريق / مدير)' },
    { key: 'employmentType', question: 'ما هو نوع التوظيف؟ (دوام كامل / دوام جزئي / عقد)' },
    { key: 'workMode', question: 'ما هو نظام العمل؟ (من المكتب / هايبرد / عن بعد)' },
    { key: 'city', question: 'في أي مدينة تقع الوظيفة؟' },
    { key: 'salaryMin', question: 'ما هو الحد الأدنى للراتب الشهري بالريال/الدولار؟' },
    { key: 'salaryMax', question: 'ما هو الحد الأعلى للراتب الشهري؟' },
    { key: 'yearsOfExperience', question: 'كم سنة خبرة مطلوبة لهذه الوظيفة؟' },
    { key: 'skills', question: 'ما هي أهم المهارات المطلوبة؟ (اذكرها مفصولة بفاصلة)' },
]

const parseSeniority = (text: string) => {
    const t = text.toLowerCase()
    if (t.includes('مبتد') || t.includes('junior')) return 'JUNIOR'
    if (t.includes('خبير') || t.includes('senior')) return 'SENIOR'
    if (t.includes('قائد') || t.includes('lead')) return 'LEAD'
    if (t.includes('مدير') || t.includes('manager')) return 'MANAGER'
    return 'MID' // default: متوسط
}

const parseEmploymentType = (text: string) => {
    const t = text.toLowerCase()
    if (t.includes('جزئي') || t.includes('part')) return 'PART_TIME'
    if (t.includes('عقد') || t.includes('contract')) return 'CONTRACT'
    return 'FULL_TIME'
}

const parseWorkMode = (text: string) => {
    const t = text.toLowerCase()
    if (t.includes('هايبرد') || t.includes('hybrid')) return 'HYBRID'
    if (t.includes('بعد') || t.includes('remote')) return 'REMOTE'
    return 'ONSITE'
}

const JobAiChat: React.FC<JobAiChatProps> = ({ onComplete, onCancel }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'مرحباً! أنا مساعد التوظيف الذكي. سأساعدك في إنشاء وصف وظيفي احترافي.\n\n' + QUESTIONS[0].question }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isFinished, setIsFinished] = useState(false)
    const [generatedJob, setGeneratedJob] = useState<Partial<Job> | null>(null)
    const [currentStep, setCurrentStep] = useState(0)
    const [collectedData, setCollectedData] = useState<CollectedData>({})
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const addMessage = (role: 'user' | 'assistant', content: string) => {
        setMessages(prev => [...prev, { role, content }])
    }

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isLoading || isFinished) return

        const userAnswer = input.trim()
        addMessage('user', userAnswer)
        setInput('')

        // --- State Machine: Store the answer for current step ---
        const stepKey = QUESTIONS[currentStep]?.key
        const updated: CollectedData = { ...collectedData }

        if (stepKey === 'title') updated.title = userAnswer
        else if (stepKey === 'seniorityLevel') updated.seniorityLevel = parseSeniority(userAnswer)
        else if (stepKey === 'employmentType') updated.employmentType = parseEmploymentType(userAnswer)
        else if (stepKey === 'workMode') updated.workMode = parseWorkMode(userAnswer)
        else if (stepKey === 'city') updated.city = userAnswer
        else if (stepKey === 'salaryMin') updated.salaryMin = parseInt(userAnswer.replace(/[^\d]/g, '')) || 0
        else if (stepKey === 'salaryMax') updated.salaryMax = parseInt(userAnswer.replace(/[^\d]/g, '')) || 0
        else if (stepKey === 'yearsOfExperience') updated.yearsOfExperience = parseInt(userAnswer.replace(/[^\d]/g, '')) || 1
        else if (stepKey === 'skills') updated.skills = userAnswer

        setCollectedData(updated)
        const nextStep = currentStep + 1

        // --- If more questions remain, ask the next one ---
        if (nextStep < QUESTIONS.length) {
            setCurrentStep(nextStep)
            addMessage('assistant', QUESTIONS[nextStep].question)
            return
        }

        // --- All questions answered: Generate final JD with AI ---
        setIsLoading(true)
        addMessage('assistant', '✅ جمعت كل المعلومات! جاري الآن توليد الوصف الوظيفي الكامل بالذكاء الاصطناعي...')

        try {
            const aiMessages = [
                {
                    role: 'user' as const,
                    content: `قم بإنشاء وصف وظيفي احترافي باللغة العربية بناءً على هذه المعلومات:
- المسمى الوظيفي: ${updated.title}
- مستوى الأقدمية: ${updated.seniorityLevel}
- نوع التوظيف: ${updated.employmentType}
- نظام العمل: ${updated.workMode}
- المدينة: ${updated.city}
- الراتب: ${updated.salaryMin} - ${updated.salaryMax}
- سنوات الخبرة: ${updated.yearsOfExperience}
- المهارات: ${updated.skills}

أعط الرد بصيغة JSON فقط:
{
  "nextQuestion": null,
  "isComplete": true,
  "jobData": {
    "title": "...",
    "employmentType": "FULL_TIME|PART_TIME|CONTRACT",
    "workMode": "ONSITE|HYBRID|REMOTE",
    "seniorityLevel": "JUNIOR|MID|SENIOR|LEAD|MANAGER",
    "yearsOfExperience": 0,
    "city": "...",
    "salaryMin": 0,
    "salaryMax": 0,
    "description": "وصف وظيفي احترافي كامل...",
    "requirements": ["متطلب 1", "متطلب 2"],
    "responsibilities": ["مسؤولية 1", "مسؤولية 2"]
  }
}`
                }
            ]

            const response = await recruitmentService.getAiJobConversationResponse(aiMessages)

            if (response.isComplete && response.jobData) {
                addMessage('assistant', '🎉 رائع! تم إنشاء الوصف الوظيفي بنجاح. يمكنك مراجعته والتأكيد.')
                setGeneratedJob(response.jobData)
                setIsFinished(true)
            } else {
                // Fallback: build job from collected data without AI
                const fallbackJob: Partial<Job> = {
                    title: updated.title,
                    employmentType: updated.employmentType as any,
                    workMode: updated.workMode as any,
                    seniorityLevel: updated.seniorityLevel as any,
                    yearsOfExperience: updated.yearsOfExperience,
                    city: updated.city,
                    location: updated.city,
                    salaryMin: updated.salaryMin,
                    salaryMax: updated.salaryMax,
                    description: `وظيفة ${updated.title} في مدينة ${updated.city}. نحن نبحث عن مرشح ${updated.seniorityLevel} بخبرة ${updated.yearsOfExperience} سنوات.`,
                    requirements: updated.skills?.split(/[,،]/).map(s => s.trim()).filter(Boolean) || []
                }
                addMessage('assistant', '✅ تم تجميع بيانات الوظيفة. يمكنك مراجعتها والتعديل عليها.')
                setGeneratedJob(fallbackJob)
                setIsFinished(true)
            }
        } catch (error) {
            console.error('AI Chat Error:', error)
            addMessage('assistant', 'عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يمكنك إعادة المحاولة.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegenerate = () => {
        setMessages([{ role: 'assistant', content: 'مرحباً! أنا مساعد التوظيف الذكي. سأساعدك في إنشاء وصف وظيفي احترافي.\n\n' + QUESTIONS[0].question }])
        setGeneratedJob(null)
        setIsFinished(false)
        setInput('')
        setCurrentStep(0)
        setCollectedData({})
    }

    return (
        <div className="flex flex-col h-[500px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
            {/* Progress Bar */}
            {!isFinished && (
                <div className="px-4 pt-3 pb-1">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>السؤال {Math.min(currentStep + 1, QUESTIONS.length)} من {QUESTIONS.length}</span>
                        <span>{Math.round((currentStep / QUESTIONS.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                            className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${(currentStep / QUESTIONS.length) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex max-w-[85%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'assistant'
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    }`}>
                                    {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                                </div>
                                <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'assistant'
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tr-none'
                                    : 'bg-blue-600 text-white rounded-tl-none'
                                    } shadow-sm`}>
                                    {msg.content}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tr-none flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                            <span className="text-xs text-gray-500">جاري توليد الوصف الوظيفي...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Completion View */}
            {isFinished && generatedJob && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-50 dark:bg-green-900/20 border-t border-green-100 dark:border-green-900/30"
                >
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-3">
                        <CheckCircle2 size={20} />
                        <span className="font-bold">تم توليد الوصف الوظيفي بنجاح!</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onComplete(generatedJob)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Sparkles size={18} />
                            مراجعة وتأكيد
                        </button>
                        <button
                            onClick={handleRegenerate}
                            className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-2 px-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            title="إعادة البدء"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <button
                            onClick={onCancel}
                            className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-2 px-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Input Area */}
            {!isFinished && (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="اكتب ردك هنا..."
                            className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all dark:text-white"
                            disabled={isLoading}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors shadow-md"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                    <p className="mt-2 text-[10px] text-gray-400 text-center">
                        الذكاء الاصطناعي قد يخطئ في بعض الأحيان، يرجى مراجعة النتائج النهائية.
                    </p>
                </form>
            )}
        </div>
    )
}

export default JobAiChat
