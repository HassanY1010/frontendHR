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

const JobAiChat: React.FC<JobAiChatProps> = ({ onComplete, onCancel }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'مرحباً! أنا مساعد التوظيف الذكي. سأساعدك في إنشاء وصف وظيفي احترافي. ما هو مسمى الوظيفة التي ترغب في الإعلان عنها؟' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isFinished, setIsFinished] = useState(false)
    const [generatedJob, setGeneratedJob] = useState<Partial<Job> | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isLoading || isFinished) return

        const userMessage: Message = { role: 'user', content: input }
        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        setInput('')
        setIsLoading(true)

        try {
            const response = await recruitmentService.getAiJobConversationResponse(newMessages)

            if (response.isComplete && response.jobData) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'رائع! لقد قمت بإنشاء الوصف الوظيفي بناءً على معلوماتك. يمكنك مراجعته الآن وتأكيد النشر.'
                }])
                setGeneratedJob(response.jobData)
                setIsFinished(true)
            } else if (response.nextQuestion) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.nextQuestion! }])
            }
        } catch (error) {
            console.error('AI Chat Error:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: 'عذراً، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.' }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegenerate = () => {
        setMessages([
            { role: 'assistant', content: 'مرحباً! أنا مساعد التوظيف الذكي. سأساعدك في إنشاء وصف وظيفي احترافي. ما هو مسمى الوظيفة التي ترغب في الإعلان عنها؟' }
        ])
        setGeneratedJob(null)
        setIsFinished(false)
        setInput('')
    }

    return (
        <div className="flex flex-col h-[500px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
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
                                <div className={`p-3 rounded-2xl text-sm ${msg.role === 'assistant'
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
                            <span className="text-xs text-gray-500">جاري التفكير...</span>
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
