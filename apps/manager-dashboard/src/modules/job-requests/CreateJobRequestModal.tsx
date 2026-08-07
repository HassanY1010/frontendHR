import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, FileText, DollarSign, Briefcase, Calendar, Award, Sparkles } from 'lucide-react';
import { jobRequestService } from '@hr/services';

interface CreateJobRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateJobRequestModal: React.FC<CreateJobRequestModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(['TypeScript', 'Node.js', 'React']);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summarySuccessMessage, setSummarySuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    jobTitle: '',
    departmentId: '', // Default or selected
    location: 'الرياض',
    employmentType: 'FULL_TIME',
    vacancies: 1,
    jobSummary: '',
    requiredExperience: '',
    educationLevel: 'بكالوريوس',
    certifications: '',
    languages: 'العربية، الإنجليزية',
    responsibilities: '',
    salaryMin: '',
    salaryMax: '',
    budgetCode: `BUD-${new Date().getFullYear()}-101`,
    costCenter: 'CC-101',
    hiringReason: 'NEW_POSITION',
    requiredDate: '',
    priority: 'MEDIUM',
    hiringType: 'IMMEDIATE',
    hiringDeadline: '',
    freezeReason: 'BUDGET_PENDING',
    frozenDate: new Date().toISOString().slice(0, 10),
    resumeDate: '',
    ownerName: ''
  });

  if (!isOpen) return null;

  const handleGenerateSummary = async () => {
    if (!formData.jobTitle.trim()) {
      setError('يرجى كتابة المسمى الوظيفي أولاً لتوليد ملخص الوظيفة بالذكاء الاصطناعي');
      return;
    }
    setError(null);
    setSummarySuccessMessage(null);
    setIsGeneratingSummary(true);
    try {
      const departmentNameMap: Record<string, string> = {
        'dep-tech': 'تكنولوجيا المعلومات والبرمجيات',
        'dep-hr': 'الموارد البشرية',
        'dep-finance': 'الإدارة المالية',
        'dep-marketing': 'التسويق والمبيعات',
        'dep-operations': 'العمليات والتشغيل'
      };

      const summaryText = await jobRequestService.generateSummary({
        jobTitle: formData.jobTitle.trim(),
        department: departmentNameMap[formData.departmentId] || 'تكنولوجيا المعلومات',
        location: formData.location,
        employmentType: formData.employmentType,
        requiredExperience: formData.requiredExperience,
        skills,
        educationLevel: formData.educationLevel,
        hiringReason: formData.hiringReason
      });

      if (summaryText) {
        setFormData(prev => ({ ...prev, jobSummary: summaryText }));
        setSummarySuccessMessage('✨ تم توليد ملخص الوظيفة بنجاح! يمكنك تعديله كاملاً بالأسفل كما ترغب.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'فشل توليد ملخص الوظيفة بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (submitDirectly: boolean) => {
    setError(null);
    if (!formData.jobTitle.trim()) {
      setError('يرجى إدخال المسمى الوظيفي');
      return;
    }

    setLoading(true);
    try {
      await jobRequestService.createJobRequest({
        ...formData,
        departmentId: formData.departmentId || 'dep-tech',
        skills,
        submitDirectly
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'فشل في حفظ طلب التوظيف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-xl">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">إنشاء طلب توظيف جديد (Job Request)</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">إدخال متطلبات الاحتياج الوظيفي وبدء مسار الاعتمادات</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Hiring Type Selection (أنواع التوظيف الثلاثة) */}
          <div>
            <label className="block text-xs font-bold text-gray-900 dark:text-white mb-2">نوع التوظيف المطلوب (Hiring Type) *</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                onClick={() => setFormData({ ...formData, hiringType: 'IMMEDIATE', priority: 'URGENT' })}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.hiringType === 'IMMEDIATE'
                    ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 shadow-md ring-2 ring-red-500/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-red-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">⚡</span>
                  <span className="font-bold text-xs text-red-600 dark:text-red-400">1. Immediate Hiring</span>
                </div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">توظيف فوري عاجل</div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">تلبية الاحتياجات العاجلة جداً مع SLA سريع وأولوية Urgent.</p>
              </div>

              <div
                onClick={() => setFormData({ ...formData, hiringType: 'PLANNED', priority: 'MEDIUM' })}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.hiringType === 'PLANNED'
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-md ring-2 ring-purple-500/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📅</span>
                  <span className="font-bold text-xs text-purple-600 dark:text-purple-400">2. Manpower Force Plan</span>
                </div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">خطة التوظيف السنوية</div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">التخطيط المسبق للوظائف والميزانيات لعام 2027.</p>
              </div>

              <div
                onClick={() => setFormData({ ...formData, hiringType: 'ON_HOLD', priority: 'LOW' })}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.hiringType === 'ON_HOLD'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-500/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">❄️</span>
                  <span className="font-bold text-xs text-amber-600 dark:text-amber-400">3. On Hold Hiring</span>
                </div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">توظيف مجمد / معلق</div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">تعليق طلب التوظيف لحين الموافقة أو توفر الميزانية.</p>
              </div>
            </div>

            {/* Conditional Type Fields */}
            {formData.hiringType === 'IMMEDIATE' && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
                  <span>🚀 مسار التوظيف الفوري (Fast SLA): Priority تلقائياً URGENT</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-700 dark:text-gray-300 font-medium">الموعد النهائي للتوظيف (Deadline):</label>
                  <input
                    type="date"
                    value={formData.hiringDeadline}
                    onChange={(e) => setFormData({ ...formData, hiringDeadline: e.target.value })}
                    className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            {formData.hiringType === 'ON_HOLD' && (
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">❄️ خصائص التوظيف المجمد (On Hold Properties):</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">سبب التجميد (Freeze Reason) *</label>
                    <select
                      value={formData.freezeReason}
                      onChange={(e) => setFormData({ ...formData, freezeReason: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs"
                    >
                      <option value="BUDGET_PENDING">Budget Pending (الميزانية قيد الانتظار)</option>
                      <option value="MANAGEMENT_APPROVAL">Management Approval (موافقة الإدارة العليا)</option>
                      <option value="BUSINESS_CHANGE">Business Change (تغيير خطة العمل)</option>
                      <option value="OTHER">Other (أسباب أخرى)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ المتوقع للاستئناف (Resume Date)</label>
                    <input
                      type="date"
                      value={formData.resumeDate}
                      onChange={(e) => setFormData({ ...formData, resumeDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">المسؤول / المتابع (Owner)</label>
                    <input
                      type="text"
                      placeholder="اسم المتابع أو المدير..."
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" /> المعلومات الأساسية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">المسمى الوظيفي *</label>
                <input
                  type="text"
                  placeholder="مثال: Senior Backend Developer"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">القسم / الإدارة *</label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">اختر القسم...</option>
                  <option value="dep-tech">تكنولوجيا المعلومات والبرمجيات</option>
                  <option value="dep-hr">الموارد البشرية</option>
                  <option value="dep-finance">الإدارة المالية</option>
                  <option value="dep-marketing">التسويق والمبيعات</option>
                  <option value="dep-operations">العمليات والتشغيل</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">مكان العمل (Location)</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">نوع التوظيف (Employment Type)</label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm"
                >
                  <option value="FULL_TIME">دوام كامل (Full Time)</option>
                  <option value="PART_TIME">دوام جزئي (Part Time)</option>
                  <option value="CONTRACT">عقد مؤقت (Contract)</option>
                  <option value="REMOTE">عن بُعد بالكامل (Remote)</option>
                  <option value="HYBRID">هجين (Hybrid)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">عدد الشواغر المطلوبة (Vacancies)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.vacancies}
                  onChange={(e) => setFormData({ ...formData, vacancies: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">درجة الأولوية (Priority)</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm"
                >
                  <option value="LOW">منخفضة (Low)</option>
                  <option value="MEDIUM">متوسطة (Medium)</option>
                  <option value="HIGH">عالية (High)</option>
                  <option value="URGENT">عاجل جداً (Urgent)</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* Section 2: Job Details & Qualifications */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-secondary-500" /> تفاصيل الوظيفة والمؤهلات
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    ملخص الوظيفة (Job Summary)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isGeneratingSummary ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>جارٍ توليد ملخص الوظيفة...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>✨ توليد بالذكاء الاصطناعي</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  rows={3}
                  placeholder="أدخل ملخص الوظيفة يدويًا أو اضغط زر ✨ توليد بالذكاء الاصطناعي لتوليده أوتوماتيكيًا..."
                  value={formData.jobSummary}
                  onChange={(e) => setFormData({ ...formData, jobSummary: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 leading-relaxed"
                />

                {summarySuccessMessage && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium">
                    {summarySuccessMessage}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">المهارات المطلوبة (Required Skills)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="أضف مهارة واضغط إضافة..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700"
                  >
                    إضافة
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs rounded-lg border border-primary-200/50">
                      {s}
                      <button type="button" onClick={() => handleRemoveSkill(s)} className="hover:text-red-500">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">الخبرة المطلوبة</label>
                  <input
                    type="text"
                    placeholder="مثال: 3-5 سنوات خبرة في Node.js"
                    value={formData.requiredExperience}
                    onChange={(e) => setFormData({ ...formData, requiredExperience: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">المؤهل العلمي</label>
                  <input
                    type="text"
                    value={formData.educationLevel}
                    onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* Section 3: Financial Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" /> المعلومات المالية والبودجيت
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">الراتب المتوقع (الأدنى)</label>
                <input
                  type="number"
                  placeholder="8000"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">الراتب المتوقع (الأعلى)</label>
                <input
                  type="number"
                  placeholder="14000"
                  value={formData.salaryMax}
                  onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">كود الميزانية (Budget Code)</label>
                <input
                  type="text"
                  placeholder="BDG-2026-ENG"
                  value={formData.budgetCode}
                  onChange={(e) => setFormData({ ...formData, budgetCode: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">مركز التكلفة (Cost Center)</label>
                <input
                  type="text"
                  placeholder="CC-102"
                  value={formData.costCenter}
                  onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* Section 4: Hiring Details & Reason */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" /> سبب التوظيف والتاريخ المطلوبة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">سبب الاحتياج (Hiring Reason)</label>
                <select
                  value={formData.hiringReason}
                  onChange={(e) => setFormData({ ...formData, hiringReason: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm"
                >
                  <option value="NEW_POSITION">وظيفة جديدة (New Position)</option>
                  <option value="REPLACEMENT">بديل موظف (Replacement)</option>
                  <option value="EXPANSION">توسع الفريق (Expansion)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ المباشرة المطلوبة (Target Date)</label>
                <input
                  type="date"
                  value={formData.requiredDate}
                  onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
          >
            إلغاء
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-xl transition"
            >
              حفظ كمسودة (Draft)
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(true)}
              className="px-5 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white text-sm font-medium rounded-xl shadow-md transition flex items-center gap-2"
            >
              {loading ? 'جاري الإرسال...' : 'تقديم الطلب للمراجعة (Submit)'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
