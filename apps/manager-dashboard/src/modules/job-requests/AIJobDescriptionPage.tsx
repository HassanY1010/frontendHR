import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Briefcase,
  MapPin,
  DollarSign,
  Code,
  Star,
  FileText,
  MessageSquare,
  Zap,
  ArrowLeft,
  Plus,
  X,
  BookOpen,
  Target
} from 'lucide-react';
import { apiClient } from '@hr/services';

// ============================================================================
// Types
// ============================================================================
interface JDResult {
  jobTitle: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  interviewQuestions: { question: string; category: string }[];
  salaryInsight: string;
  employmentType: string;
  workMode: string;
  seniorityLevel: string;
  confidence_score: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Template {
  id: string;
  icon: string;
  category: string;
  title: string;
  description: string;
  preset: Record<string, any>;
}

// ============================================================================
// Helpers
// ============================================================================
const SENIORITY_LABELS: Record<string, string> = {
  JUNIOR: 'مبتدئ (Junior)',
  MID: 'متوسط (Mid)',
  SENIOR: 'أول (Senior)',
  LEAD: 'قائد فريق (Lead)',
  MANAGER: 'مدير (Manager)',
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'دوام كامل',
  PART_TIME: 'دوام جزئي',
  CONTRACT: 'عقد مؤقت',
  REMOTE: 'عن بُعد',
  HYBRID: 'هجين',
};

const WORK_MODE_LABELS: Record<string, string> = {
  ONSITE: 'مكتب (Onsite)',
  HYBRID: 'هجين (Hybrid)',
  REMOTE: 'عن بُعد (Remote)',
};

const QUESTION_CATEGORY_COLORS: Record<string, string> = {
  تقني: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  سلوكي: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  استراتيجي: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  قيادي: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
};

// ============================================================================
// Sub-components
// ============================================================================

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg transition-colors"
      title="نسخ"
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

const SkillTag: React.FC<{ skill: string; variant?: 'required' | 'preferred' }> = ({
  skill,
  variant = 'required',
}) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
      variant === 'required'
        ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-700/50'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50'
    }`}
  >
    {skill}
  </span>
);

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headerRight?: React.ReactNode;
}> = ({ icon, title, children, defaultOpen = true, headerRight }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="text-primary-500">{icon}</div>
          <span className="font-semibold text-gray-900 dark:text-white text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {headerRight}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
};

// ============================================================================
// JD Result Display
// ============================================================================
const JDResultView: React.FC<{ result: JDResult; onReset: () => void }> = ({ result, onReset }) => {
  const fullText = `# ${result.jobTitle}\n\n## ملخص الوظيفة\n${result.summary}\n\n## المسؤوليات\n${result.responsibilities.map((r) => `- ${r}`).join('\n')}\n\n## المتطلبات\n${result.requirements.map((r) => `- ${r}`).join('\n')}\n\n## المهارات المطلوبة\n${result.requiredSkills.join('، ')}\n\n## المهارات المفضلة\n${result.preferredSkills.join('، ')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-600 via-violet-600 to-secondary-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-4 w-32 h-32 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-8 w-24 h-24 rounded-full bg-white blur-2xl" />
        </div>
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 opacity-80" />
              <span className="text-xs font-medium opacity-80">تم التوليد بالذكاء الاصطناعي</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">{result.jobTitle}</h2>
            <div className="flex flex-wrap gap-3 text-sm opacity-90">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                {EMPLOYMENT_LABELS[result.employmentType] || result.employmentType}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {WORK_MODE_LABELS[result.workMode] || result.workMode}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                {SENIORITY_LABELS[result.seniorityLevel] || result.seniorityLevel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-center bg-white/20 rounded-xl px-3 py-2">
              <p className="text-2xl font-bold">{Math.round((result.confidence_score || 0.9) * 100)}%</p>
              <p className="text-xs opacity-80">دقة AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <SectionCard
        icon={<FileText className="w-4 h-4" />}
        title="ملخص الوظيفة"
        headerRight={<CopyButton text={result.summary} />}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{result.summary}</p>
        {result.salaryInsight && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-start gap-2 text-green-700 dark:text-green-300 text-xs">
              <DollarSign className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{result.salaryInsight}</span>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Responsibilities */}
      <SectionCard
        icon={<Target className="w-4 h-4" />}
        title={`المسؤوليات الوظيفية (${result.responsibilities?.length || 0})`}
        headerRight={<CopyButton text={result.responsibilities?.join('\n') || ''} />}
      >
        <ul className="space-y-2">
          {result.responsibilities?.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
              <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Requirements */}
      <SectionCard
        icon={<BookOpen className="w-4 h-4" />}
        title={`المتطلبات (${result.requirements?.length || 0})`}
        headerRight={<CopyButton text={result.requirements?.join('\n') || ''} />}
      >
        <ul className="space-y-2">
          {result.requirements?.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
              <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Skills */}
      <SectionCard icon={<Code className="w-4 h-4" />} title="المهارات المطلوبة والمفضلة">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">مهارات أساسية (مطلوبة)</p>
            <div className="flex flex-wrap gap-2">
              {result.requiredSkills?.map((s, i) => <SkillTag key={i} skill={s} variant="required" />)}
            </div>
          </div>
          {result.preferredSkills?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">مهارات مفضلة (إضافية)</p>
              <div className="flex flex-wrap gap-2">
                {result.preferredSkills?.map((s, i) => <SkillTag key={i} skill={s} variant="preferred" />)}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Interview Questions */}
      {result.interviewQuestions?.length > 0 && (
        <SectionCard
          icon={<MessageSquare className="w-4 h-4" />}
          title={`أسئلة المقابلة المقترحة (${result.interviewQuestions.length})`}
          headerRight={
            <CopyButton
              text={result.interviewQuestions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}
            />
          }
        >
          <div className="space-y-3">
            {result.interviewQuestions.map((q, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
              >
                <span className="w-6 h-6 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200">{q.question}</p>
                  <span
                    className={`mt-1.5 inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
                      QUESTION_CATEGORY_COLORS[q.category] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {q.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 justify-between pt-2">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          توليد وصف جديد
        </button>
        <button
          onClick={() => {
            const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${result.jobTitle}-JD.txt`;
            a.click();
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition"
        >
          <Download className="w-4 h-4" />
          تحميل الوصف الوظيفي
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Form Mode
// ============================================================================
const FormMode: React.FC<{
  onResult: (data: JDResult) => void;
  initialValues?: Record<string, any>;
}> = ({ onResult, initialValues = {} }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState({
    jobTitle: initialValues.jobTitle || '',
    department: initialValues.department || '',
    experience: initialValues.experience || '',
    location: initialValues.location || 'الرياض',
    employmentType: initialValues.employmentType || 'FULL_TIME',
    workMode: initialValues.workMode || 'ONSITE',
    seniorityLevel: initialValues.seniorityLevel || 'MID',
    salaryMin: initialValues.salaryMin || '',
    salaryMax: initialValues.salaryMax || '',
    skills: initialValues.skills || [] as string[],
  });

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        jobTitle: initialValues.jobTitle || '',
        department: initialValues.department || '',
        experience: initialValues.experience || '',
        location: initialValues.location || 'الرياض',
        employmentType: initialValues.employmentType || 'FULL_TIME',
        workMode: initialValues.workMode || 'ONSITE',
        seniorityLevel: initialValues.seniorityLevel || 'MID',
        salaryMin: initialValues.salaryMin || '',
        salaryMax: initialValues.salaryMax || '',
        skills: initialValues.skills || [],
      });
    }
  }, [initialValues]);

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (s: string) =>
    setFormData({ ...formData, skills: formData.skills.filter((x: string) => x !== s) });

  const handleGenerate = async () => {
    if (!formData.jobTitle.trim()) {
      setError('يرجى إدخال المسمى الوظيفي');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res: any = await apiClient.post('/ai-jd/generate', formData);
      const data = res?.data?.data || res?.data;
      onResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'فشل توليد الوصف الوظيفي');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition placeholder:text-gray-400';
  const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>المسمى الوظيفي *</label>
          <input
            className={inputClass}
            placeholder="مثال: Senior Backend Developer"
            value={formData.jobTitle}
            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>القسم / الإدارة</label>
          <input
            className={inputClass}
            placeholder="مثال: تكنولوجيا المعلومات"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>مستوى الأقدمية</label>
          <select
            className={inputClass}
            value={formData.seniorityLevel}
            onChange={(e) => setFormData({ ...formData, seniorityLevel: e.target.value })}
          >
            <option value="JUNIOR">مبتدئ (Junior)</option>
            <option value="MID">متوسط (Mid)</option>
            <option value="SENIOR">أول (Senior)</option>
            <option value="LEAD">قائد فريق (Lead)</option>
            <option value="MANAGER">مدير (Manager)</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>نوع التوظيف</label>
          <select
            className={inputClass}
            value={formData.employmentType}
            onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
          >
            <option value="FULL_TIME">دوام كامل</option>
            <option value="PART_TIME">دوام جزئي</option>
            <option value="CONTRACT">عقد مؤقت</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>طريقة العمل</label>
          <select
            className={inputClass}
            value={formData.workMode}
            onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
          >
            <option value="ONSITE">مكتب (Onsite)</option>
            <option value="HYBRID">هجين (Hybrid)</option>
            <option value="REMOTE">عن بُعد (Remote)</option>
          </select>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>المدينة / الموقع</label>
          <input
            className={inputClass}
            placeholder="الرياض"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>سنوات الخبرة</label>
          <input
            className={inputClass}
            placeholder="مثال: 3-5 سنوات"
            value={formData.experience}
            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>نطاق الراتب (ريال)</label>
          <div className="flex gap-2">
            <input
              className={inputClass}
              placeholder="الأدنى"
              type="number"
              value={formData.salaryMin}
              onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="الأعلى"
              type="number"
              value={formData.salaryMax}
              onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className={labelClass}>المهارات المطلوبة</label>
        <div className="flex gap-2 mb-2">
          <input
            className={`${inputClass} flex-1`}
            placeholder="أضف مهارة واضغط Enter..."
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 flex items-center gap-1.5 transition shrink-0"
          >
            <Plus className="w-4 h-4" /> إضافة
          </button>
        </div>
        {formData.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((s: string, i: number) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs rounded-lg border border-primary-200/50"
              >
                {s}
                <button onClick={() => removeSkill(s)} className="hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !formData.jobTitle.trim()}
        className="w-full py-3.5 bg-gradient-to-r from-primary-600 via-violet-600 to-secondary-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            جاري توليد الوصف الوظيفي...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            توليد الوصف الوظيفي بالذكاء الاصطناعي
          </>
        )}
      </button>
    </motion.div>
  );
};

// ============================================================================
// Chat Mode
// ============================================================================
const ChatMode: React.FC<{ onResult: (data: JDResult) => void }> = ({ onResult }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startChat = async () => {
    setStarted(true);
    setLoading(true);
    const initMsg: ChatMessage = {
      role: 'user',
      content: 'مرحباً، أريد إنشاء وصف وظيفي جديد.',
    };
    setMessages([initMsg]);
    try {
      const res: any = await apiClient.post('/ai-jd/chat', {
        messages: [initMsg],
      });
      const data = res?.data?.data;
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data?.nextQuestion || 'مرحباً! ما هو المسمى الوظيفي الذي تريد إنشاء وصف وظيفي له؟',
      };
      setMessages([initMsg, assistantMsg]);
    } catch {
      setMessages([
        initMsg,
        {
          role: 'assistant',
          content: 'حدث خطأ في الاتصال. يرجى استخدام نموذج الإدخال بدلاً من ذلك.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res: any = await apiClient.post('/ai-jd/chat', {
        messages: newMessages,
      });
      const data = res?.data?.data;

      if (data?.isComplete && data?.jobData) {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: '✅ ممتاز! لديّ كل المعلومات اللازمة. جاري توليد الوصف الوظيفي الكامل...',
        };
        setMessages([...newMessages, assistantMsg]);
        // Now generate full JD using form endpoint
        const jdRes: any = await apiClient.post('/ai-jd/generate', {
          ...data.jobData,
          skills: data.jobData.skills || [],
        });
        onResult(jdRes?.data?.data || jdRes?.data);
      } else {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: data?.nextQuestion || 'شكراً، ما هي المعلومات الإضافية؟',
        };
        setMessages([...newMessages, assistantMsg]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          محادثة ذكية لإنشاء الوصف الوظيفي
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          أخبرني عن الوظيفة بشكل طبيعي وسأطرح عليك الأسئلة الضرورية ثم أولّد الوصف الكامل تلقائياً
        </p>
        <button
          onClick={startChat}
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-violet-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          ابدأ المحادثة
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50/50 dark:bg-gray-800/20 rounded-xl mb-3">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tr-none'
                  : 'bg-gradient-to-r from-primary-600 to-violet-600 text-white rounded-tl-none'
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-end">
            <div className="bg-gradient-to-r from-primary-600 to-violet-600 text-white px-4 py-3 rounded-2xl rounded-tl-none text-sm">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition"
          placeholder="اكتب ردك هنا..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="p-3 bg-gradient-to-r from-primary-600 to-violet-600 text-white rounded-xl disabled:opacity-50 hover:shadow-md transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Main Page
// ============================================================================
const AIJobDescriptionPage: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'form' | 'chat'>('form');
  const [result, setResult] = useState<JDResult | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<Record<string, any>>({});
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res: any = await apiClient.get('/ai-jd/templates');
        setTemplates(res?.data?.data || []);
      } catch {
        // fallback to empty
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleReset = () => {
    setResult(null);
    setSelectedPreset({});
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-violet-600 to-secondary-600 rounded-2xl p-6 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-8 w-40 h-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-16 w-32 h-32 rounded-full bg-white blur-2xl" />
        </div>
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1">مولّد الوصف الوظيفي بالذكاء الاصطناعي</h1>
            <p className="text-sm opacity-85">
              أدخل بيانات الوظيفة وسيقوم AI بإنشاء وصف احترافي كامل يشمل المسؤوليات، المتطلبات، المهارات وأسئلة المقابلة
            </p>
          </div>
          <div className="mr-auto hidden md:flex items-center gap-3">
            <div className="text-center bg-white/20 rounded-xl px-4 py-2">
              <p className="text-lg font-bold">GPT-4o</p>
              <p className="text-xs opacity-80">النموذج المستخدم</p>
            </div>
            <div className="text-center bg-white/20 rounded-xl px-4 py-2">
              <p className="text-lg font-bold">{'< 10s'}</p>
              <p className="text-xs opacity-80">متوسط التوليد</p>
            </div>
          </div>
        </div>
      </div>

      {result ? (
        <JDResultView result={result} onReset={handleReset} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Templates */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">قوالب جاهزة</h3>
              </div>
              {loadingTemplates ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedPreset(t.preset);
                        setActiveMode('form');
                      }}
                      className={`w-full text-right p-3 rounded-xl border transition-all hover:shadow-sm ${
                        JSON.stringify(selectedPreset) === JSON.stringify(t.preset)
                          ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-100 dark:border-gray-800 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{t.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.description}</p>
                        </div>
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md shrink-0">
                          {t.category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Generator */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {/* Mode Tabs */}
              <div className="flex border-b border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setActiveMode('form')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                    activeMode === 'form'
                      ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  نموذج الإدخال
                </button>
                <button
                  onClick={() => setActiveMode('chat')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                    activeMode === 'chat'
                      ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  محادثة ذكية
                </button>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeMode === 'form' ? (
                    <FormMode key="form" onResult={setResult} initialValues={selectedPreset} />
                  ) : (
                    <ChatMode key="chat" onResult={setResult} />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIJobDescriptionPage;
