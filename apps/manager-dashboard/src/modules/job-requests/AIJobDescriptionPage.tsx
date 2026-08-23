import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Plus,
  X,
  BookOpen,
  Target,
  FilePlus,
  Share2,
  Linkedin,
  Twitter,
  AlertCircle,
  ExternalLink,
  Edit3,
  Save,
  Trash2
} from 'lucide-react';
import { jobRequestService } from '@hr/services';
import { useNavigate } from 'react-router-dom';
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
  seniorityLevel?: string;
  educationLevel?: string;

  confidence_score: number;
  marketAnalysis?: {
    marketTip?: string;
    recommendedSkillsToAdd?: string[];
    salarySuggestion?: string;
    marketCompetitiveness?: string;
  };
  searchKeywords?: string[];
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
const JDResultView: React.FC<{
  result: JDResult;
  onReset: () => void;
  formData?: Record<string, any>;
}> = ({ result: initialResult, onReset, formData = {} }) => {
  const navigate = useNavigate();
  const [activeResult, setActiveResult] = useState<JDResult>(initialResult);
  const [isEditing, setIsEditing] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');

  const [creatingJR, setCreatingJR] = useState(false);
  const [jrSuccess, setJrSuccess] = useState<string | null>(null);
  const [jrError, setJrError] = useState<string | null>(null);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [generatingSocial, setGeneratingSocial] = useState(false);
  const [socialPost, setSocialPost] = useState<{ linkedin: string; twitter: string } | null>(null);
  const [copiedSocial, setCopiedSocial] = useState<'linkedin' | 'twitter' | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    setActiveResult(initialResult);
  }, [initialResult]);

  const handleCopyEntireJD = () => {
    const formattedFullJD = [
      `📌 الوصف الوظيفي الكامل: ${activeResult.jobTitle}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏢 نوع التوظيف: ${activeResult.employmentType ? (EMPLOYMENT_LABELS[activeResult.employmentType] || activeResult.employmentType) : 'دوام كامل'}`,
      `📍 نظام العمل: ${activeResult.workMode ? (WORK_MODE_LABELS[activeResult.workMode] || activeResult.workMode) : 'هجين'}`,
      `⭐ مستوى الخبرة: ${activeResult.seniorityLevel ? (SENIORITY_LABELS[activeResult.seniorityLevel] || activeResult.seniorityLevel) : 'متوسط'}`,
      activeResult.educationLevel ? `🎓 المؤهل العلمي: ${activeResult.educationLevel}` : null,
      activeResult.salaryInsight ? `💰 نطاق الراتب: ${activeResult.salaryInsight}` : null,

      `\n📝 ملخص الوظيفة:`,
      `${activeResult.summary}`,
      `\n🎯 المسؤوليات الوظيفية:`,
      activeResult.responsibilities?.map((r, i) => `${i + 1}. ${r}`).join('\n') || 'غير محددة',
      `\n📋 المتطلبات والاشتراطات:`,
      activeResult.requirements?.map((r) => `• ${r}`).join('\n') || 'غير محددة',
      `\n🛠️ المهارات الأساسية المطلوبة:`,
      activeResult.requiredSkills?.map((s) => `• ${s}`).join('\n') || 'غير محددة',
      activeResult.preferredSkills?.length > 0 ? `\n✨ المهارات المفضلة:\n` + activeResult.preferredSkills.map((s) => `• ${s}`).join('\n') : null,
      activeResult.interviewQuestions?.length > 0 ? `\n❓ أسئلة المقابلة المقترحة:\n` + activeResult.interviewQuestions.map((q, i) => `${i + 1}. ${q.question} [${q.category}]`).join('\n') : null,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `تم التوليد والنشر عبر منصة HR Platform 🚀`
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(formattedFullJD);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const fullText = `# ${activeResult.jobTitle}\n\n## ملخص الوظيفة\n${activeResult.summary}\n\n## المؤهل العلمي\n${activeResult.educationLevel || ''}\n\n## المسؤوليات\n${activeResult.responsibilities?.map((r) => `- ${r}`).join('\n')}\n\n## المتطلبات\n${activeResult.requirements?.map((r) => `- ${r}`).join('\n')}\n\n## المهارات المطلوبة\n${activeResult.requiredSkills?.join('، ')}\n\n## المهارات المفضلة\n${activeResult.preferredSkills?.join('، ')}`;

  // ── Responsibilities Handlers ──────────────────────────────────────────────
  const handleUpdateResponsibility = (index: number, val: string) => {
    const list = [...(activeResult.responsibilities || [])];
    list[index] = val;
    setActiveResult({ ...activeResult, responsibilities: list });
  };
  const handleAddResponsibility = () => {
    const list = [...(activeResult.responsibilities || []), 'مسؤولية جديدة...'];
    setActiveResult({ ...activeResult, responsibilities: list });
  };
  const handleRemoveResponsibility = (index: number) => {
    const list = activeResult.responsibilities.filter((_, i) => i !== index);
    setActiveResult({ ...activeResult, responsibilities: list });
  };

  // ── Requirements Handlers ──────────────────────────────────────────────────
  const handleUpdateRequirement = (index: number, val: string) => {
    const list = [...(activeResult.requirements || [])];
    list[index] = val;
    setActiveResult({ ...activeResult, requirements: list });
  };
  const handleAddRequirement = () => {
    const list = [...(activeResult.requirements || []), 'متطلب جديد...'];
    setActiveResult({ ...activeResult, requirements: list });
  };
  const handleRemoveRequirement = (index: number) => {
    const list = activeResult.requirements.filter((_, i) => i !== index);
    setActiveResult({ ...activeResult, requirements: list });
  };

  // ── Skills Handlers ────────────────────────────────────────────────────────
  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    const skills = [...(activeResult.requiredSkills || []), newSkillInput.trim()];
    setActiveResult({ ...activeResult, requiredSkills: skills });
    setNewSkillInput('');
  };
  const handleRemoveSkill = (skillName: string) => {
    const skills = activeResult.requiredSkills.filter(s => s !== skillName);
    setActiveResult({ ...activeResult, requiredSkills: skills });
  };

  // ── Questions Handlers ─────────────────────────────────────────────────────
  const handleUpdateQuestion = (index: number, field: string, val: string) => {
    const qList = [...(activeResult.interviewQuestions || [])];
    qList[index] = { ...qList[index], [field]: val };
    setActiveResult({ ...activeResult, interviewQuestions: qList });
  };
  const handleAddQuestion = () => {
    const qList = [...(activeResult.interviewQuestions || []), { question: 'سؤال جديد للمقابلة...', category: 'تقني' }];
    setActiveResult({ ...activeResult, interviewQuestions: qList });
  };
  const handleRemoveQuestion = (index: number) => {
    const qList = activeResult.interviewQuestions.filter((_, i) => i !== index);
    setActiveResult({ ...activeResult, interviewQuestions: qList });
  };

  // ── Create Job Request ──────────────────────────────────────────────────────
  const handleCreateJobRequest = async () => {
    setCreatingJR(true);
    setJrError(null);
    try {
      const targetTitle = activeResult.jobTitle && activeResult.jobTitle !== 'المسمى الوظيفي' ? activeResult.jobTitle : (formData.jobTitle || 'وظيفة جديدة');
      const targetDepartment = formData.department || 'تكنولوجيا المعلومات';

      const today = new Date();
      const defaultReqDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const defaultDeadline = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const payload = {
        jobTitle: targetTitle,
        department: targetDepartment,
        departmentName: targetDepartment,
        departmentId: formData.departmentId || null,
        location: formData.location || 'الرياض',
        employmentType: activeResult.employmentType || formData.employmentType || 'FULL_TIME',
        vacancies: formData.vacancies || 1,
        jobSummary: activeResult.summary,
        requiredExperience: formData.experience || '',
        educationLevel: activeResult.educationLevel || formData.educationLevel || 'بكالوريوس (Bachelor)',
        responsibilities: activeResult.responsibilities?.join('\n') || '',
        skills: activeResult.requiredSkills || [],
        salaryMin: formData.salaryMin || '',
        salaryMax: formData.salaryMax || '',
        budgetCode: `BUD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        costCenter: 'CC-101',
        hiringType: 'IMMEDIATE',
        requiredDate: defaultReqDate,
        hiringDeadline: defaultDeadline,
        priority: 'MEDIUM',
        hiringReason: 'NEW_POSITION',
        submitDirectly: true
      };
      const res: any = await jobRequestService.createJobRequest(payload);
      const id = res?.data?.data?.id || res?.data?.id;
      setJrSuccess(id || 'created');
    } catch (err: any) {
      setJrError(err?.response?.data?.error || 'فشل إنشاء طلب التوظيف. يرجى المحاولة مرة أخرى.');
    } finally {
      setCreatingJR(false);
    }
  };

  // ── Generate Social Post ────────────────────────────────────────────────────
  const handleGenerateSocialPost = async () => {
    setGeneratingSocial(true);
    setSocialPost(null);
    try {
      const skills = activeResult.requiredSkills?.slice(0, 5).join(' | ') || '';
      const salary = formData.salaryMin && formData.salaryMax
        ? `💰 الراتب: ${Number(formData.salaryMin).toLocaleString()} - ${Number(formData.salaryMax).toLocaleString()} ريال`
        : '';
      const location = formData.location || 'الرياض';
      const empType = activeResult.employmentType === 'FULL_TIME' ? 'دوام كامل' : activeResult.employmentType === 'HYBRID' ? 'هجين' : activeResult.employmentType === 'REMOTE' ? 'عن بُعد' : 'دوام كامل';

      const linkedin = `🚀 نحن نوظّف! | ${activeResult.jobTitle}\n\n` +
        `${activeResult.summary?.substring(0, 200)}...\n\n` +
        `📋 المتطلبات الرئيسية:\n` +
        activeResult.requirements?.slice(0, 3).map(r => `• ${r}`).join('\n') + '\n\n' +
        `🛠️ المهارات: ${skills}\n` +
        `📍 الموقع: ${location} | ${empType}\n` +
        (salary ? `${salary}\n` : '') +
        `\n📩 للتقديم: تواصل معنا عبر الرسائل المباشرة أو أرسل سيرتك الذاتية.\n\n` +
        `#توظيف #${activeResult.jobTitle?.replace(/\s/g, '_')} #وظائف_السعودية #${location}`;

      const twitterLines = [
        `📢 وظيفة شاغرة: ${activeResult.jobTitle}`,
        `📍 ${location} | ${empType}`,
        skills ? `🛠️ ${skills}` : '',
        salary || '',
        `📩 راسلنا للتقديم!`,
        `#وظائف #${activeResult.jobTitle?.replace(/\s/g, '_')} #السعودية`
      ].filter(Boolean).join('\n');

      setSocialPost({ linkedin, twitter: twitterLines });
    } catch {
      setSocialPost({
        linkedin: `🚀 نحن نوظّف ${activeResult.jobTitle}! تواصل معنا للتفاصيل. #وظائف`,
        twitter: `📢 وظيفة: ${activeResult.jobTitle} | تواصل معنا! #وظائف`
      });
    } finally {
      setGeneratingSocial(false);
    }
  };

  const copyToClipboard = (text: string, type: 'linkedin' | 'twitter') => {
    navigator.clipboard.writeText(text);
    setCopiedSocial(type);
    setTimeout(() => setCopiedSocial(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Edit Mode Alert Banner */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-2xl flex items-center justify-between gap-3 text-amber-800 dark:text-amber-200 text-sm"
        >
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="font-bold">✏️ أنت الآن في وضع التعديل المباشر: يمكنك تعديل أي حقل، مسؤولية، أو متطلب بالأسفل ثم النقر على "حفظ التعديلات".</span>
          </div>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shrink-0"
          >
            <Save className="w-4 h-4" />
            حفظ التعديلات
          </button>
        </motion.div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-600 via-violet-600 to-secondary-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-4 w-32 h-32 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-8 w-24 h-24 rounded-full bg-white blur-2xl" />
        </div>
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 opacity-80" />
              <span className="text-xs font-medium opacity-80">تم التوليد بالذكاء الاصطناعي</span>
            </div>
            
            {isEditing ? (
              <div className="mb-2">
                <label className="text-xs text-white/80 block mb-1">المسمى الوظيفي:</label>
                <input
                  type="text"
                  value={activeResult.jobTitle}
                  onChange={(e) => setActiveResult({ ...activeResult, jobTitle: e.target.value })}
                  className="w-full text-xl font-bold bg-white/20 border border-white/40 text-white placeholder-white/60 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
            ) : (
              <h2 className="text-2xl font-bold mb-1">{activeResult.jobTitle}</h2>
            )}

            <div className="flex flex-wrap gap-3 text-sm opacity-90">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                {EMPLOYMENT_LABELS[activeResult.employmentType] || activeResult.employmentType}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {WORK_MODE_LABELS[activeResult.workMode] || activeResult.workMode}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                {activeResult.seniorityLevel ? (SENIORITY_LABELS[activeResult.seniorityLevel] || activeResult.seniorityLevel) : 'متوسط'}
              </span>
              {activeResult.educationLevel && (
                <span className="flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  <BookOpen className="w-3.5 h-3.5" />
                  {activeResult.educationLevel}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyEntireJD}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition shadow-md ${
                copiedAll
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white border border-white/40'
              }`}
            >
              {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedAll ? 'تم نسخ الوصف بالكامل ✓' : 'نسخ الوصف بالكامل'}
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition shadow-md ${
                isEditing
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white border border-white/40'
              }`}
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {isEditing ? 'حفظ التعديلات' : 'تعديل البيانات'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <SectionCard
        icon={<FileText className="w-4 h-4" />}
        title="ملخص الوظيفة"
        headerRight={<CopyButton text={activeResult.summary} />}
      >
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">نص ملخص الوظيفة:</label>
              <textarea
                rows={4}
                value={activeResult.summary}
                onChange={(e) => setActiveResult({ ...activeResult, summary: e.target.value })}
                className="w-full p-3 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">المؤهل العلمي المطلوب:</label>
              <input
                type="text"
                value={activeResult.educationLevel || ''}
                onChange={(e) => setActiveResult({ ...activeResult, educationLevel: e.target.value })}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="مثال: بكالوريوس علوم حاسب / دبلوم"
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{activeResult.summary}</p>
        )}

        {activeResult.salaryInsight && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-start gap-2 text-green-700 dark:text-green-300 text-xs">
              <DollarSign className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{activeResult.salaryInsight}</span>
            </div>
          </div>
        )}

        {/* Market Optimization & AI Suggestions */}
        {activeResult.marketAnalysis && (
          <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>تحليل السوق واقتراحات الذكاء الاصطناعي (Market Intelligence)</span>
            </div>
            {activeResult.marketAnalysis.marketTip && (
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                💡 {activeResult.marketAnalysis.marketTip}
              </p>
            )}
            {activeResult.marketAnalysis.recommendedSkillsToAdd && activeResult.marketAnalysis.recommendedSkillsToAdd.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 shrink-0">مهارات تنافسية مقترحة:</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeResult.marketAnalysis.recommendedSkillsToAdd.map((s: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs rounded-md font-medium"
                    >
                      + {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </SectionCard>


      {/* Responsibilities */}
      <SectionCard
        icon={<Target className="w-4 h-4" />}
        title={`المسؤوليات الوظيفية (${activeResult.responsibilities?.length || 0})`}
        headerRight={<CopyButton text={activeResult.responsibilities?.join('\n') || ''} />}
      >
        <ul className="space-y-2">
          {activeResult.responsibilities?.map((item, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
              <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </span>
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateResponsibility(i, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleRemoveResponsibility(i)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                    title="حذف المسؤولية"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span>{item}</span>
              )}
            </li>
          ))}
        </ul>
        {isEditing && (
          <button
            onClick={handleAddResponsibility}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
          >
            <Plus className="w-4 h-4" /> إضافة مسؤولية جديدة
          </button>
        )}
      </SectionCard>

      {/* Requirements */}
      <SectionCard
        icon={<BookOpen className="w-4 h-4" />}
        title={`المتطلبات (${activeResult.requirements?.length || 0})`}
        headerRight={<CopyButton text={activeResult.requirements?.join('\n') || ''} />}
      >
        <ul className="space-y-2">
          {activeResult.requirements?.map((item, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateRequirement(i, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleRemoveRequirement(i)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                    title="حذف المتطلب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span>{item}</span>
              )}
            </li>
          ))}
        </ul>
        {isEditing && (
          <button
            onClick={handleAddRequirement}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 hover:underline"
          >
            <Plus className="w-4 h-4" /> إضافة متطلب جديد
          </button>
        )}
      </SectionCard>

      {/* Skills */}
      <SectionCard icon={<Code className="w-4 h-4" />} title="المهارات المطلوبة والمفضلة">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">مهارات أساسية (مطلوبة)</p>
            <div className="flex flex-wrap gap-2">
              {activeResult.requiredSkills?.map((s, i) => (
                <div key={i} className="inline-flex items-center gap-1">
                  <SkillTag skill={s} variant="required" />
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveSkill(s)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold px-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  placeholder="أضف مهارة جديدة واضغط إضافة..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700"
                >
                  إضافة
                </button>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Interview Questions */}
      {activeResult.interviewQuestions?.length > 0 && (
        <SectionCard
          icon={<MessageSquare className="w-4 h-4" />}
          title={`أسئلة المقابلة المقترحة (${activeResult.interviewQuestions.length})`}
          headerRight={
            <CopyButton
              text={activeResult.interviewQuestions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}
            />
          }
        >
          <div className="space-y-3">
            {activeResult.interviewQuestions.map((q, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
              >
                <span className="w-6 h-6 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleUpdateQuestion(i, 'question', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <select
                        value={q.category}
                        onChange={(e) => handleUpdateQuestion(i, 'category', e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="تقني">تقني</option>
                        <option value="سلوكي">سلوكي</option>
                        <option value="استراتيجي">استراتيجي</option>
                        <option value="قيادي">قيادي</option>
                      </select>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{q.question}</p>
                      <span
                        className={`mt-1.5 inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
                          QUESTION_CATEGORY_COLORS[q.category] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {q.category}
                      </span>
                    </>
                  )}
                </div>
                {isEditing && (
                  <button
                    onClick={() => handleRemoveQuestion(i)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <button
              onClick={handleAddQuestion}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              <Plus className="w-4 h-4" /> إضافة سؤال جديد للمقابلة
            </button>
          )}
        </SectionCard>
      )}

      {/* ── Job Request Success Banner ── */}
      {jrSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-2xl flex items-start gap-3"
        >
          <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-green-600 dark:text-green-300" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-green-800 dark:text-green-200 text-sm">✅ تم إنشاء طلب التوظيف بنجاح بالبيانات المحدثة!</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">تم تقديم الطلب للمراجعة تلقائياً. يمكنك متابعته في صفحة طلبات التوظيف.</p>
          </div>
          <button
            onClick={() => navigate('/job-requests')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            متابعة الطلب
          </button>
        </motion.div>
      )}

      {jrError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {jrError}
        </div>
      )}

      {/* ── Actions Bar ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">الإجراءات</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">

          {/* Copy Entire JD Button */}
          <button
            onClick={handleCopyEntireJD}
            className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition group ${
              copiedAll
                ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-gray-200 dark:border-gray-700 hover:border-emerald-300'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
              copiedAll ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-emerald-50 dark:bg-emerald-900/30'
            }`}>
              {copiedAll ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> : <Copy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <span className="text-xs font-bold text-center text-emerald-700 dark:text-emerald-300">
              {copiedAll ? 'تم النسخ ✓' : 'نسخ الوصف بالكامل'}
            </span>
          </button>

          {/* Edit / Save Toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition group ${
              isEditing
                ? 'bg-green-50 dark:bg-green-900/30 border-green-400 text-green-700 dark:text-green-300'
                : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
              isEditing ? 'bg-green-100 dark:bg-green-800' : 'bg-indigo-50 dark:bg-indigo-900/30'
            }`}>
              {isEditing ? <Save className="w-4 h-4 text-green-600 dark:text-green-300" /> : <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            </div>
            <span className="text-xs font-bold text-center">
              {isEditing ? 'حفظ التعديلات' : 'تعديل البيانات'}
            </span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="flex flex-col items-center gap-2 p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition group"
          >
            <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 rounded-xl flex items-center justify-center transition">
              <RefreshCw className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-center">توليد جديد</span>
          </button>

          {/* Download */}
          <button
            onClick={() => {
              const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${activeResult.jobTitle}-JD.txt`;
              a.click();
            }}
            className="flex flex-col items-center gap-2 p-3 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl transition group"
          >
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 rounded-xl flex items-center justify-center transition">
              <Download className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-center text-blue-600 dark:text-blue-400">تحميل الوصف</span>
          </button>

          {/* Create Job Request */}
          <button
            onClick={handleCreateJobRequest}
            disabled={creatingJR || !!jrSuccess}
            className="flex flex-col items-center gap-2 p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 rounded-xl transition group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/30 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 rounded-xl flex items-center justify-center transition">
              {creatingJR ? <RefreshCw className="w-4 h-4 text-primary-500 animate-spin" /> : jrSuccess ? <Check className="w-4 h-4 text-green-500" /> : <FilePlus className="w-4 h-4 text-primary-500" />}
            </div>
            <span className="text-xs font-medium text-center text-primary-600 dark:text-primary-400">
              {creatingJR ? 'جاري الإنشاء...' : jrSuccess ? 'تم الإنشاء ✓' : 'إنشاء طلب توظيف'}
            </span>
          </button>

          {/* Social Post */}
          <button
            onClick={() => { setShowSocialModal(true); handleGenerateSocialPost(); }}
            className="flex flex-col items-center gap-2 p-3 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 rounded-xl transition group"
          >
            <div className="w-9 h-9 bg-violet-50 dark:bg-violet-900/30 group-hover:bg-violet-100 rounded-xl flex items-center justify-center transition">
              <Share2 className="w-4 h-4 text-violet-500" />
            </div>
            <span className="text-xs font-medium text-center text-violet-600 dark:text-violet-400">مشاركة على السوشيال</span>
          </button>
        </div>
      </div>

      {/* ── Social Media Modal ── */}
      {showSocialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-violet-600 to-primary-600">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-white" />
                <div>
                  <h3 className="text-white font-bold text-sm">مولّد إعلان شبكات التواصل الاجتماعي</h3>
                  <p className="text-white/70 text-xs">{activeResult.jobTitle}</p>
                </div>
              </div>
              <button onClick={() => setShowSocialModal(false)} className="p-1.5 text-white/70 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {generatingSocial ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-violet-500 animate-pulse" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">جاري توليد الإعلانات...</p>
                </div>
              ) : socialPost ? (
                <>
                  {/* LinkedIn */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-[#0077B5]/10 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#0077B5] rounded-lg flex items-center justify-center">
                          <Linkedin className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-sm text-[#0077B5]">LinkedIn</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(socialPost.linkedin, 'linkedin')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0077B5] hover:bg-[#005885] text-white text-xs font-medium rounded-lg transition"
                      >
                        {copiedSocial === 'linkedin' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedSocial === 'linkedin' ? 'تم النسخ!' : 'نسخ النص'}
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={socialPost.linkedin}
                      rows={8}
                      className="w-full px-4 py-3 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 resize-none outline-none leading-relaxed"
                    />
                  </div>

                  {/* X / Twitter */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-black/5 dark:bg-white/5 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                          <Twitter className="w-4 h-4 text-white dark:text-black" />
                        </div>
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">X (Twitter)</span>
                        <span className="text-xs text-gray-400">({socialPost.twitter.length} حرف)</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(socialPost.twitter, 'twitter')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black text-xs font-medium rounded-lg transition"
                      >
                        {copiedSocial === 'twitter' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedSocial === 'twitter' ? 'تم النسخ!' : 'نسخ النص'}
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={socialPost.twitter}
                      rows={5}
                      className="w-full px-4 py-3 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 resize-none outline-none leading-relaxed"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      انسخ النص واذهب مباشرة إلى LinkedIn أو X لنشر الإعلان! يمكنك تعديل النص حسب رغبتك قبل النشر.
                    </p>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => { setSocialPost(null); handleGenerateSocialPost(); }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة التوليد
              </button>
              <button
                onClick={() => setShowSocialModal(false)}
                className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 transition"
              >
                تم
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// Form Mode
// ============================================================================
const FormMode: React.FC<{
  onResult: (data: JDResult, fd: Record<string, any>) => void;
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
    educationLevel: initialValues.educationLevel || '',
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
        educationLevel: initialValues.educationLevel || '',
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
      onResult(data, formData);
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <label className={labelClass}>المؤهل العلمي</label>
          <input
            className={inputClass}
            placeholder="مثال: بكالوريوس علوم حاسب / دبلوم"
            value={formData.educationLevel}
            onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
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
const ChatMode: React.FC<{ onResult: (data: JDResult, fd?: Record<string, any>) => void }> = ({ onResult }) => {
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
      const responseData = res?.data || res;
      const data = responseData?.data || responseData;
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
      const responseData = res?.data || res;
      const data = responseData?.data || responseData;

      if (data?.isComplete && (data?.jobDescription || data?.jobData)) {
        const jd = data.jobDescription || data.jobData;
        const realFd = data?.formData || { jobTitle: jd?.jobTitle, department: jd?.department || 'تكنولوجيا المعلومات' };
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: '✅ ممتاز! لديّ كل المعلومات اللازمة. جاري عرض الوصف الوظيفي الكامل...',
        };
        setMessages([...newMessages, assistantMsg]);

        // If jd is already a full structured object, use it directly
        if (jd?.summary || jd?.jobTitle) {
          setTimeout(() => onResult(jd, realFd), 800);
        } else {
          // Otherwise call generate endpoint
          const jdRes: any = await apiClient.post('/ai-jd/generate', {
            ...jd,
            skills: jd?.skills || [],
          });
          const resPayload = jdRes?.data || jdRes;
          onResult(resPayload?.data || resPayload, realFd);
        }
      } else {
        const nextQ = data?.nextQuestion;
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: nextQ && typeof nextQ === 'string' && nextQ.trim() ? nextQ : 'ما هي المهارات الرئيسية المطلوبة لهذه الوظيفة؟',
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
  const [lastFormData, setLastFormData] = useState<Record<string, any>>({});
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<Record<string, any>>({});
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

  const defaultTemplates: Template[] = [
    // ── Tech & Engineering ──────────────────────────────────────────
    {
      id: 'software-engineer',
      icon: '💻',
      category: 'تكنولوجيا المعلومات',
      title: 'مهندس برمجيات (Full Stack)',
      description: 'React, Node.js, TypeScript & Cloud',
      preset: {
        jobTitle: 'مهندس برمجيات (Full Stack)',
        department: 'تكنولوجيا المعلومات',
        experience: '3-5 سنوات',
        educationLevel: 'بكالوريوس علوم حاسب / هندسة برمجيات',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'MID',
        skills: ['TypeScript', 'React.js', 'Node.js', 'PostgreSQL', 'Docker', 'RESTful APIs'],
        salaryMin: 14000,
        salaryMax: 22000,
        location: 'الرياض'
      }
    },
    {
      id: 'backend-engineer',
      icon: '⚙️',
      category: 'تكنولوجيا المعلومات',
      title: 'مطور واجهات خلفية (Backend)',
      description: 'Microservices, APIs, Node.js & Database',
      preset: {
        jobTitle: 'مطور خلفيات برمجية (Senior Backend Developer)',
        department: 'تكنولوجيا المعلومات',
        experience: '5-7 سنوات',
        educationLevel: 'بكالوريوس علوم حاسب أو هندسة تقنية',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'SENIOR',
        skills: ['Node.js', 'Prisma ORM', 'Redis Caching', 'PostgreSQL', 'System Architecture', 'CI/CD'],
        salaryMin: 18000,
        salaryMax: 28000,
        location: 'الرياض'
      }
    },
    {
      id: 'frontend-engineer',
      icon: '🎨',
      category: 'تكنولوجيا المعلومات',
      title: 'مطور واجهات أمامية (Frontend)',
      description: 'React, Next.js, TailwindCSS & UI/UX',
      preset: {
        jobTitle: 'مطور واجهات أمامية (Frontend Developer)',
        department: 'تكنولوجيا المعلومات',
        experience: '3-5 سنوات',
        educationLevel: 'بكالوريوس علوم حاسب أو تصميم تفاعلي',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'MID',
        skills: ['React.js', 'Next.js', 'TailwindCSS', 'Redux / Zustand', 'Responsive Design', 'Web Performance'],
        salaryMin: 13000,
        salaryMax: 20000,
        location: 'الرياض'
      }
    },
    {
      id: 'mobile-developer',
      icon: '📱',
      category: 'تكنولوجيا المعلومات',
      title: 'مطور تطبيقات جوال (Mobile App)',
      description: 'Flutter / React Native / iOS & Android',
      preset: {
        jobTitle: 'مطور تطبيقات جوال (Mobile Developer)',
        department: 'تكنولوجيا المعلومات',
        experience: '3-5 سنوات',
        educationLevel: 'بكالوريوس علوم حاسب أو هندسة برمجيات',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'MID',
        skills: ['Flutter', 'React Native', 'Dart', 'State Management', 'Mobile Security', 'App Store Publishing'],
        salaryMin: 14000,
        salaryMax: 22000,
        location: 'الرياض'
      }
    },
    {
      id: 'devops-engineer',
      icon: '☁️',
      category: 'تكنولوجيا المعلومات',
      title: 'مهندس ديف أوبس وسحابي (DevOps/Cloud)',
      description: 'AWS, Kubernetes, CI/CD & Terraform',
      preset: {
        jobTitle: 'مهندس سحابي وعمليات (Senior DevOps Engineer)',
        department: 'تكنولوجيا المعلومات',
        experience: '5-8 سنوات',
        educationLevel: 'بكالوريوس علوم حاسب أو هندسة شبكات',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'SENIOR',
        skills: ['AWS / GCP', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD Pipelines', 'Linux Administration'],
        salaryMin: 20000,
        salaryMax: 32000,
        location: 'الرياض'
      }
    },
    {
      id: 'cybersecurity-analyst',
      icon: '🔒',
      category: 'تكنولوجيا المعلومات',
      title: 'أخصائي أمن سيبراني (Cybersecurity)',
      description: 'SOC, Compliance, Penetration Testing & NCA',
      preset: {
        jobTitle: 'أخصائي أمن سيبراني (Cybersecurity Specialist)',
        department: 'الأمن السيبراني والمخاطر',
        experience: '3-6 سنوات',
        educationLevel: 'بكالوريوس أمن سيبراني أو أمن معلومات',
        employmentType: 'FULL_TIME',
        workMode: 'ONSITE',
        seniorityLevel: 'MID',
        skills: ['معايير الهيئة الوطنية للأمن السيبراني (NCA)', 'SOC Monitoring', 'SIEM Tools', 'Vulnerability Assessment', 'Incident Response'],
        salaryMin: 16000,
        salaryMax: 25000,
        location: 'الرياض'
      }
    },
    {
      id: 'ai-engineer',
      icon: '🤖',
      category: 'الذكاء الاصطناعي والبيانات',
      title: 'مهندس ذكاء اصطناعي (AI & ML Engineer)',
      description: 'LLMs, PyTorch, LangChain & Machine Learning',
      preset: {
        jobTitle: 'مهندس ذكاء اصطناعي وتعلّم آلي (AI/ML Engineer)',
        department: 'الذكاء الاصطناعي والبيانات',
        experience: '3-6 سنوات',
        educationLevel: 'بكالوريوس أو ماجستير علوم حاسب / ذكاء اصطناعي',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'MID',
        skills: ['Python', 'Large Language Models (LLMs)', 'PyTorch / TensorFlow', 'LangChain', 'Prompt Engineering', 'Vector Databases'],
        salaryMin: 18000,
        salaryMax: 30000,
        location: 'الرياض'
      }
    },
    {
      id: 'data-analyst',
      icon: '📊',
      category: 'الذكاء الاصطناعي والبيانات',
      title: 'محلل بيانات ذكاء أعمال (BI Data Analyst)',
      description: 'Power BI, SQL, Python & Dashboards',
      preset: {
        jobTitle: 'محلل بيانات وذكاء أعمال (BI & Data Analyst)',
        department: 'إدارة البيانات والتحليلات',
        experience: '2-4 سنوات',
        educationLevel: 'بكالوريوس إحصاء / نظم معلومات إدارية / علوم حاسب',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'MID',
        skills: ['SQL المتقدم', 'Power BI / Tableau', 'Python for Data Analysis', 'بناء لوحات التحكم التفاعلية', 'تحليل المؤشرات والـ KPIs'],
        salaryMin: 11000,
        salaryMax: 18000,
        location: 'الرياض'
      }
    },
    {
      id: 'data-engineer',
      icon: '🗄️',
      category: 'الذكاء الاصطناعي والبيانات',
      title: 'مهندس بيانات (Data Engineer)',
      description: 'ETL Pipelines, Data Warehouse, Spark & Snowflake',
      preset: {
        jobTitle: 'مهندس بيانات أول (Senior Data Engineer)',
        department: 'إدارة البيانات والتحليلات',
        experience: '4-7 سنوات',
        educationLevel: 'بكالوريوس علوم حاسب أو هندسة برمجيات',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'SENIOR',
        skills: ['Apache Spark', 'ETL/ELT Pipelines', 'Snowflake / BigQuery', 'SQL & Python', 'Data Modeling', 'Airflow'],
        salaryMin: 18000,
        salaryMax: 29000,
        location: 'الرياض'
      }
    },

    // ── Product & Design ─────────────────────────────────────────────
    {
      id: 'product-manager',
      icon: '🚀',
      category: 'إدارة المنتجات والتصميم',
      title: 'مدير منتج رقمي (Product Manager)',
      description: 'Agile/Scrum, Roadmap & User Experience',
      preset: {
        jobTitle: 'مدير منتج رقمي (Product Manager)',
        department: 'إدارة المنتجات',
        experience: '4-7 سنوات',
        educationLevel: 'بكالوريوس إدارة أعمال أو نظم معلومات حاسوبية',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'SENIOR',
        skills: ['استراتيجية المنتج وخارطة الطريق', 'Agile / Scrum Methodology', 'تحليل متطلبات المستخدمين', 'KPIs & Metrics Tracking', 'Jira / Confluence'],
        salaryMin: 18000,
        salaryMax: 30000,
        location: 'الرياض'
      }
    },
    {
      id: 'ui-ux-designer',
      icon: '✨',
      category: 'إدارة المنتجات والتصميم',
      title: 'مصمم تجربة وواجهة المستخدم (UI/UX)',
      description: 'Figma, Design Systems, User Research & Prototyping',
      preset: {
        jobTitle: 'مصمم تجربة وواجهة المستخدم (Senior UI/UX Designer)',
        department: 'إدارة المنتجات والتصميم',
        experience: '4-6 سنوات',
        educationLevel: 'بكالوريوس تصميم جرافيك / تفاعلي أو علوم حاسب',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'SENIOR',
        skills: ['Figma المتقدم', 'بناء وإدارة أنظمة التصميم (Design Systems)', 'أبحاث واختبارات المستخدمين (User Research)', 'Wireframing & Prototyping', 'Micro-interactions'],
        salaryMin: 14000,
        salaryMax: 23000,
        location: 'الرياض'
      }
    },

    // ── Human Resources ──────────────────────────────────────────────
    {
      id: 'hr-manager',
      icon: '👔',
      category: 'الموارد البشرية',
      title: 'مدير الموارد البشرية (HR Manager)',
      description: 'نظام العمل السعودي، استراتيجية الموارد وإدارة المواهب',
      preset: {
        jobTitle: 'مدير الموارد البشرية (HR Manager)',
        department: 'الموارد البشرية',
        experience: '6-9 سنوات',
        educationLevel: 'بكالوريوس أو ماجستير إدارة موارد بشرية / إدارة أعمال',
        employmentType: 'FULL_TIME',
        workMode: 'ONSITE',
        seniorityLevel: 'MANAGER',
        skills: ['إتقان نظام العمل والعمال السعودي', 'التخطيط الاستراتيجي للقوى العاملة (Manpower Planning)', 'إدارة الأداء والتقييم السنوي', 'العلاقات الحكومية ومنصات قوى ومقيم والتأمينات', 'إدارة سياسات ولائحة العمل'],
        salaryMin: 20000,
        salaryMax: 35000,
        location: 'الرياض'
      }
    },
    {
      id: 'recruitment-specialist',
      icon: '🎯',
      category: 'الموارد البشرية',
      title: 'أخصائي استقطاب مواهب وتوظيف (Talent Acquisition)',
      description: 'ATS, Headhunting, مقابلة وتقييم المرشحين',
      preset: {
        jobTitle: 'أخصائي استقطاب مواهب أول (Senior Talent Acquisition Specialist)',
        department: 'الموارد البشرية',
        experience: '3-6 سنوات',
        educationLevel: 'بكالوريوس إدارة موارد بشرية أو علوم إدارية',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'MID',
        skills: ['أنظمة إدارة المرشحين (ATS)', 'استقطاب الكفاءات والبحث المباشر (Headhunting)', 'المقابلات السلوكية والفنية (Competency-based Interviews)', 'إدارة عروض العمل والتفاوض', 'بناء خطط التوظيف وتحديد الـ SLAs'],
        salaryMin: 11000,
        salaryMax: 17000,
        location: 'الرياض'
      }
    },
    {
      id: 'hr-operations',
      icon: '📋',
      category: 'الموارد البشرية',
      title: 'أخصائي عمليات الموارد البشرية والرواتب (HR Operations & Payroll)',
      description: 'مسير الرواتب (Payroll), التأمينات, مدد, قوى',
      preset: {
        jobTitle: 'أخصائي عمليات الموارد البشرية ومسير الرواتب (HR Operations Specialist)',
        department: 'الموارد البشرية',
        experience: '3-5 سنوات',
        educationLevel: 'بكالوريوس إدارة أعمال أو محاسبة أو موارد بشرية',
        employmentType: 'FULL_TIME',
        workMode: 'ONSITE',
        seniorityLevel: 'MID',
        skills: ['إعداد ومعالجة مسيرات الرواتب (WPS)', 'منصة مدد ومنصة قوى', 'التأمينات الاجتماعية (GOSI)', 'إدارة الإجازات ومستحقات نهاية الخدمة', 'أتمتة ملفات الموظفين ونظم الـ HRIS'],
        salaryMin: 9000,
        salaryMax: 15000,
        location: 'الرياض'
      }
    },
    {
      id: 'training-development-specialist',
      icon: '🎓',
      category: 'الموارد البشرية',
      title: 'أخصائي تدريب وتطوير كفاءات (L&D Specialist)',
      description: 'Training Needs Analysis, KPIs & Career Paths',
      preset: {
        jobTitle: 'أخصائي تدريب وتطوير مؤسسي (Learning & Development Specialist)',
        department: 'الموارد البشرية',
        experience: '3-5 سنوات',
        educationLevel: 'بكالوريوس موارد بشرية أو علوم تربوية وإدارية',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'MID',
        skills: ['تحليل الاحتياجات التدريبية (TNA)', 'تصميم وتقييم الحقائب التدريبية', 'قياس أثر التدريب (Kirkpatrick Model)', 'تخطيط المسارات الوظيفية والإحلال الوظيفي', 'إدارة منصات التدريب الإلكتروني (LMS)'],
        salaryMin: 10000,
        salaryMax: 16000,
        location: 'الرياض'
      }
    },

    // ── Finance & Accounting ─────────────────────────────────────────
    {
      id: 'financial-controller',
      icon: '💰',
      category: 'المالية والمحاسبة',
      title: 'مدير مالي / مراقب مالي (Financial Controller)',
      description: 'ZATCA E-invoicing, IFRS, Budgeting & Auditing',
      preset: {
        jobTitle: 'مراقب مالي أول (Financial Controller)',
        department: 'الإدارة المالية',
        experience: '6-10 سنوات',
        educationLevel: 'بكالوريوس محاسبة أو مالية (يفضل SOCPA / CMA / CPA)',
        employmentType: 'FULL_TIME',
        workMode: 'ONSITE',
        seniorityLevel: 'MANAGER',
        skills: ['معايير المحاسبة الدولية (IFRS)', 'أنظمة الفوترة الإلكترونية وهيئة الزكاة والضريبة والجمارك (ZATCA)', 'إعداد الموازنات التقديرية والتدفقات النقدية', 'إدارة التدقيق المالي الداخلي والخارجي', 'أنظمة ERP المالية (Oracle / SAP / Odoo)'],
        salaryMin: 22000,
        salaryMax: 38000,
        location: 'الرياض'
      }
    },
    {
      id: 'senior-accountant',
      icon: '📑',
      category: 'المالية والمحاسبة',
      title: 'محاسب عام أول (Senior Accountant)',
      description: 'General Ledger, VAT, Financial Reports & Reconciliation',
      preset: {
        jobTitle: 'محاسب عام أول (Senior Accountant)',
        department: 'الإدارة المالية',
        experience: '4-7 سنوات',
        educationLevel: 'بكالوريوس محاسبة مع اعتماد SOCPA',
        employmentType: 'FULL_TIME',
        workMode: 'ONSITE',
        seniorityLevel: 'SENIOR',
        skills: ['إعداد الإقرارات الضريبية والزكوية (VAT & Zakat)', 'تسوية الحسابات البنكية وإقفال الفترات المالية', 'إعداد القوائم المالية الشهرية والسنوية', 'محاسبة التكاليف والأصول الثابتة', 'إجادة برامج ERP المحاسبية'],
        salaryMin: 10000,
        salaryMax: 16000,
        location: 'جدة'
      }
    },
    {
      id: 'financial-analyst',
      icon: '📈',
      category: 'المالية والمحاسبة',
      title: 'محلل مالي واستثماري (Financial Analyst)',
      description: 'Financial Modeling, Valuation, ROI & Feasibility Studies',
      preset: {
        jobTitle: 'محلل مالي واستثماري (Financial Analyst)',
        department: 'الإدارة المالية والاستثمار',
        experience: '3-6 سنوات',
        educationLevel: 'بكالوريوس مالية أو اقتصاد (يفضل شهادة CFA)',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'MID',
        skills: ['النمذجة والتحليل المالي المتقدم (Financial Modeling)', 'دراسات الجدوى وتقييم الاستثمارات (Valuation & ROI)', 'تحليل التباين والأداء المالي الفعلي مقابل المخطط', 'إعداد تقارير المستثمرين ومجلس الإدارة', 'إتقان Excel المتقدم وبناء السيناريوهات المالية'],
        salaryMin: 13000,
        salaryMax: 22000,
        location: 'الرياض'
      }
    },

    // ── Sales & Business Development ─────────────────────────────────
    {
      id: 'sales-director',
      icon: '💼',
      category: 'المبيعات وتطوير الأعمال',
      title: 'مدير مبيعات إقليمي (Regional Sales Director)',
      description: 'B2B Enterprise Sales, Revenue Strategy & Team Leadership',
      preset: {
        jobTitle: 'مدير مبيعات إقليمي (Regional Sales Director)',
        department: 'المبيعات وتطوير الأعمال',
        experience: '7-12 سنة',
        educationLevel: 'بكالوريوس إدارة أعمال أو تسويق (يفضل ماجستير MBA)',
        employmentType: 'FULL_TIME',
        workMode: 'ONSITE',
        seniorityLevel: 'LEAD',
        skills: ['قيادة فرق المبيعات وتحقيق مستهدفات الإيرادات (Target Achievement)', 'مبيعات الشركات والقطاع الحكومي (B2B & B2G Enterprise Sales)', 'التفاوض وإبرام الصفقات والعقود الكبرى', 'إدارة خط المبيعات وعلاقات العملاء (Pipeline Management & CRM)', 'استراتيجيات التسعير والتوسع في السوق السعودي'],
        salaryMin: 25000,
        salaryMax: 45000,
        location: 'الرياض'
      }
    },
    {
      id: 'key-account-manager',
      icon: '🤝',
      category: 'المبيعات وتطوير الأعمال',
      title: 'مدير كبار العملاء (Key Account Manager)',
      description: 'B2B Account Growth, Retention & Strategic Partnerships',
      preset: {
        jobTitle: 'مدير كبار العملاء (Key Account Manager)',
        department: 'المبيعات وتطوير الأعمال',
        experience: '4-7 سنوات',
        educationLevel: 'بكالوريوس إدارة أعمال أو علاقات عامة أو تسويق',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'SENIOR',
        skills: ['إدارة وتنمية حسابات كبار العملاء (Account Management)', 'بناء الشراكات الاستراتيجية طويلة المدى', 'التفاوض وحل النزاعات التجارية', 'Upselling & Cross-selling Solutions', 'تقديم العروض التقديمية التنفيذية'],
        salaryMin: 14000,
        salaryMax: 22000,
        location: 'الرياض'
      }
    },

    // ── Marketing & Communications ───────────────────────────────────
    {
      id: 'marketing-director',
      icon: '📣',
      category: 'التسويق والإعلام الرقمي',
      title: 'مدير إدارة التسويق والاتصال المؤسسي (Marketing Director)',
      description: 'Brand Strategy, Growth Marketing, PR & Performance',
      preset: {
        jobTitle: 'مدير إدارة التسويق والاتصال المؤسسي (Marketing Director)',
        department: 'التسويق والاتصال المؤسسي',
        experience: '7-10 سنوات',
        educationLevel: 'بكالوريوس أو ماجستير تسويق أو اتصال مؤسسي',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'MANAGER',
        skills: ['بناء الهوية والعلامة التجارية (Brand Strategy)', 'إدارة الحملات الإعلانية متعددة القنوات 360', 'التسويق الرقمي القائم على الأداء (Performance Marketing)', 'الاتصال المؤسسي والعلاقات العامة وإدارة الأزمات الإعلامية', 'إدارة الميزانيات التسويقية وحساب العائد على الاستثمار (ROAS)'],
        salaryMin: 22000,
        salaryMax: 36000,
        location: 'الرياض'
      }
    },
    {
      id: 'performance-marketer',
      icon: '🎯',
      category: 'التسويق والإعلام الرقمي',
      title: 'أخصائي تسويق رقمي ونمو (Growth & Performance Marketer)',
      description: 'Google Ads, Meta Ads, SEO, Analytics & Conversion Rate',
      preset: {
        jobTitle: 'أخصائي تسويق رقمي ونمو (Growth Marketing Specialist)',
        department: 'التسويق والاتصال المؤسسي',
        experience: '3-6 سنوات',
        educationLevel: 'بكالوريوس تسويق رقمي أو نظم معلومات حاسوبية',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'MID',
        skills: ['Google Search & Display Ads (PPC)', 'إدارة إعلانات منصات التواصل (Meta, TikTok, Snapchat, LinkedIn)', 'تحسين محركات البحث (SEO/SEM)', 'تحسين معدل التحويل (CRO & A/B Testing)', 'Google Analytics 4 & Tag Manager'],
        salaryMin: 10000,
        salaryMax: 17000,
        location: 'الرياض'
      }
    },
    {
      id: 'content-creator',
      icon: '✍️',
      category: 'التسويق والإعلام الرقمي',
      title: 'كاتب محتوى إبداعي وصانع وسائط (Creative Content Creator)',
      description: 'Copywriting, Social Media Content, Storytelling & Scripts',
      preset: {
        jobTitle: 'كاتب ومحرر محتوى إبداعي (Creative Copywriter & Content Specialist)',
        department: 'التسويق والاتصال المؤسسي',
        experience: '2-5 سنوات',
        educationLevel: 'بكالوريوس إعلام، لغة عربية، أو تسويق',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'MID',
        skills: ['كتابة النصوص الإعلانية الجذابة (Copywriting)', 'إدارة وجدولة قنوات التواصل الاجتماعي', 'كتابة السيناريوهات الإعلانية والفيديوهات القصيرة', 'إتقان الصياغة باللغتين العربية والإنجليزية', 'التسويق بالمحتوى والـ Storytelling المؤثر'],
        salaryMin: 8000,
        salaryMax: 14000,
        location: 'الرياض'
      }
    },

    // ── Operations & Supply Chain ────────────────────────────────────
    {
      id: 'operations-manager',
      icon: '🏭',
      category: 'العمليات وسلاسل الإمداد',
      title: 'مدير العمليات التشغيلية (Operations Manager)',
      description: 'Operational Excellence, SLA Management & Process Automation',
      preset: {
        jobTitle: 'مدير العمليات التشغيلية (Operations Manager)',
        department: 'الإدارة التشغيلية',
        experience: '6-9 سنوات',
        educationLevel: 'بكالوريوس هندسة صناعية أو إدارة أعمال',
        employmentType: 'FULL_TIME',
        workMode: 'ONSITE',
        seniorityLevel: 'MANAGER',
        skills: ['هندسة وتحسين الإجراءات التشغيلية (Process Optimization)', 'تطبيق منهجيات اللين وسيكس سيجما (Lean Six Sigma)', 'إدارة اتفاقيات مستوى الخدمة (SLAs & KPIs)', 'إدارة سلاسل الإمداد والمشتريات التشغيلية', 'قيادة فرق الميدان ومتابعة مؤشرات الجودة'],
        salaryMin: 20000,
        salaryMax: 32000,
        location: 'الدمام'
      }
    },
    {
      id: 'procurement-specialist',
      icon: '📦',
      category: 'العمليات وسلاسل الإمداد',
      title: 'أخصائي مشتريات ومناقصات (Procurement Specialist)',
      description: 'Vendor Management, Tenders, RFP & Cost Negotiation',
      preset: {
        jobTitle: 'أخصائي مشتريات ومناقصات أول (Senior Procurement Specialist)',
        department: 'إدارة المشتريات وسلاسل الإمداد',
        experience: '4-7 سنوات',
        educationLevel: 'بكالوريوس إدارة أعمال أو سلاسل إمداد أو هندسة',
        employmentType: 'FULL_TIME',
        workMode: 'ONSITE',
        seniorityLevel: 'SENIOR',
        skills: ['إدارة المناقصات وطلبات العروض (RFP / RFQ)', 'تقييم وتأهيل الموردين (Vendor Management)', 'التفاوض التجاري وخفض التكاليف التشغيلية', 'أنظمة اعتماد منصة اعتماد الحكومية أو أنظمة ERP للمشتريات', 'إدارة عقود التوريد ومراقبة سلاسل الإمداد'],
        salaryMin: 12000,
        salaryMax: 18000,
        location: 'الرياض'
      }
    },

    // ── Customer Success & Support ───────────────────────────────────
    {
      id: 'customer-success-lead',
      icon: '🌟',
      category: 'خدمة ونجاح العملاء',
      title: 'قائد تجربة ونجاح العملاء (Customer Success Lead)',
      description: 'Onboarding, Churn Reduction, CSAT & NPS Management',
      preset: {
        jobTitle: 'قائد تجربة ونجاح العملاء (Customer Success Lead)',
        department: 'خدمة ونجاح العملاء',
        experience: '4-7 سنوات',
        educationLevel: 'بكالوريوس إدارة أعمال أو علاقات عامة أو نظم معلومات',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        seniorityLevel: 'LEAD',
        skills: ['إدارة وتهيئة العملاء الجدد (Customer Onboarding)', 'تقليل معدل التسرب والاحتفاظ بالعملاء (Churn Reduction)', 'متابعة وتطوير مؤشرات رضا العملاء (CSAT, NPS, CES)', 'أنظمة خدمة العملاء والتذاكر (Zendesk / Freshdesk / HubSpot)', 'تدريب فرق الدعم وتأسيس معايير الجودة'],
        salaryMin: 13000,
        salaryMax: 20000,
        location: 'الرياض'
      }
    },

    // ── Legal & Compliance ───────────────────────────────────────────
    {
      id: 'legal-counsel',
      icon: '⚖️',
      category: 'الشؤون القانونية والامتثال',
      title: 'مستشار قانوني للشركات (Corporate Legal Counsel)',
      description: 'العقود التجارية، الامتثال والأنظمة واللوائح السعودية',
      preset: {
        jobTitle: 'مستشار قانوني للشركات (Corporate Legal Counsel)',
        department: 'الإدارة القانونية والامتثال',
        experience: '5-8 سنوات',
        educationLevel: 'بكالوريوس شريعة أو قانون / حقوق (يفضل ماجستير قانون شركات)',
        employmentType: 'FULL_TIME',
        workMode: 'ONSITE',
        seniorityLevel: 'SENIOR',
        skills: ['صياغة ومراجعة العقود التجارية والاتفاقيات الدولية', 'نظام الشركات ونظام العمل والاستثمار الأجنبي السعودي', 'حوكمة الشركات والامتثال للوائح والتعليمات الحكومية', 'إدارة النزاعات القانونية والتحكيم والتسويات', 'حماية الملكية الفكرية والبيانات الشخصية (PDPL)'],
        salaryMin: 18000,
        salaryMax: 32000,
        location: 'الرياض'
      }
    },

    // ── Healthcare & Medical ─────────────────────────────────────────
    {
      id: 'occupational-health-officer',
      icon: '🩺',
      category: 'الصحة والسلامة المهنية',
      title: 'مسؤول الصحة والسلامة المهنية والبيئة (HSE Specialist)',
      description: 'OHSAS, ISO 45001, Safety Audits & Risk Assessment',
      preset: {
        jobTitle: 'أخصائي الصحة والسلامة المهنية والبيئة (HSE Specialist)',
        department: 'الصحة والسلامة المهنية',
        experience: '3-6 سنوات',
        educationLevel: 'بكالوريوس علوم بيئية أو هندسة سلامة (شهادة NEBOSH / OSHA)',
        employmentType: 'FULL_TIME',
        workMode: 'ONSITE',
        seniorityLevel: 'MID',
        skills: ['تطبيق معايير ISO 45001 و ISO 14001', 'تقييم المخاطر المهنية وإجراءات الطوارئ (Risk Assessment)', 'التفتيش الميداني والتحقيق في الحوادث المهنية', 'إعداد خطط الإخلاء وتدريب الموظفين على السلامة', 'الامتثال للوائح الدفاع المدني ووزارة الموارد البشرية'],
        salaryMin: 11000,
        salaryMax: 18000,
        location: 'الرياض'
      }
    }
  ];

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res: any = await apiClient.get('/ai-jd/templates');
        const list = res?.data?.data || res?.data;
        if (Array.isArray(list) && list.length > 0) {
          setTemplates(list);
        } else {
          setTemplates(defaultTemplates);
        }
      } catch {
        setTemplates(defaultTemplates);
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

  // Categories list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(templates.map(t => t.category)));
    return ['الكل', ...cats];
  }, [templates]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesCategory = selectedCategory === 'الكل' || t.category === selectedCategory;
      const q = templateSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.preset?.skills?.some((s: string) => s.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, templateSearch]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-violet-600 to-secondary-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-8 w-40 h-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-16 w-32 h-32 rounded-full bg-white blur-2xl" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">مولّد الوصف الوظيفي الذكي بالذكاء الاصطناعي</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                  {templates.length}+ قالب احترافي
                </span>
              </div>
              <p className="text-sm opacity-90 mt-1">
                اختر قالباً جاهزاً معتمداً لسوق العمل السعودي أو أنشئ وصفاً مخصصاً بالكامل يشمل المتطلبات، المهارات والأسئلة
              </p>
            </div>
          </div>
        </div>
      </div>

      {result ? (
        <JDResultView result={result} onReset={handleReset} formData={lastFormData} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Templates */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm flex flex-col h-[750px]">
              {/* Header & Badges */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">مكتبة القوالب الجاهزة</h3>
                    <p className="text-[11px] text-gray-500">{filteredTemplates.length} قالب متاح</p>
                  </div>
                </div>
                {selectedCategory !== 'الكل' && (
                  <button
                    onClick={() => setSelectedCategory('الكل')}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    إعادة ضبط
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="ابحث عن وظيفة، مهارة، أو تخصص..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none transition"
                />
                <div className="absolute right-2.5 top-2.5 text-gray-400 pointer-events-none">
                  🔍
                </div>
                {templateSearch && (
                  <button
                    onClick={() => setTemplateSearch('')}
                    className="absolute left-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-thin">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Templates List */}
              {loadingTemplates ? (
                <div className="space-y-2 overflow-hidden">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center py-8 text-gray-400">
                  <span className="text-3xl mb-2">🔍</span>
                  <p className="text-xs font-medium">لم يتم العثور على قوالب مطابقة للبحث</p>
                  <button
                    onClick={() => { setTemplateSearch(''); setSelectedCategory('الكل'); }}
                    className="mt-2 text-xs text-primary-600 hover:underline"
                  >
                    عرض جميع القوالب
                  </button>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {filteredTemplates.map((t) => {
                    const isSelected = JSON.stringify(selectedPreset) === JSON.stringify(t.preset);
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedPreset(t.preset);
                          setActiveMode('form');
                        }}
                        className={`w-full text-right p-3 rounded-xl border transition-all duration-200 group ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-900/40 shadow-sm ring-1 ring-primary-400'
                            : 'border-gray-100 dark:border-gray-800 hover:border-primary-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl p-1 bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-100 dark:border-gray-700/60 shrink-0">
                            {t.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                                {t.title}
                              </p>
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md shrink-0">
                                {t.preset?.seniorityLevel ? SENIORITY_LABELS[t.preset.seniorityLevel] || t.preset.seniorityLevel : t.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mb-1.5">
                              {t.description}
                            </p>
                            {t.preset?.skills && (
                              <div className="flex flex-wrap gap-1">
                                {t.preset.skills.slice(0, 3).map((sk: string, sIdx: number) => (
                                  <span
                                    key={sIdx}
                                    className="text-[10px] px-1.5 py-0.2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded border border-gray-200/50"
                                  >
                                    {sk}
                                  </span>
                                ))}
                                {t.preset.skills.length > 3 && (
                                  <span className="text-[10px] text-gray-400">
                                    +{t.preset.skills.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
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
                    <FormMode key="form" onResult={(data, fd) => { setResult(data); setLastFormData(fd); }} initialValues={selectedPreset} />
                  ) : (
                    <ChatMode key="chat" onResult={(data, fd) => { setResult(data); setLastFormData(fd || { jobTitle: data.jobTitle }); }} />
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
