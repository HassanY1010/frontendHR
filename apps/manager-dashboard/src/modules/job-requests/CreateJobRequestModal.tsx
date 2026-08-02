import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, FileText, DollarSign, Briefcase, Calendar, Award } from 'lucide-react';
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
    budgetCode: '',
    costCenter: '',
    hiringReason: 'NEW_POSITION',
    requiredDate: '',
    priority: 'MEDIUM'
  });

  if (!isOpen) return null;

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
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">ملخص الوظيفة (Job Summary)</label>
                <textarea
                  rows={2}
                  placeholder="وصف مختصر لمسؤوليات وأهداف الوظيفة..."
                  value={formData.jobSummary}
                  onChange={(e) => setFormData({ ...formData, jobSummary: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm"
                />
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
