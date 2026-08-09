import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Sparkles, Plus, Upload, CheckCircle2,
  Eye, MapPin, Briefcase, Award, RefreshCw, X
} from 'lucide-react';
import { atsCandidateService } from '@hr/services';
import CandidateProfileModal from '../components/CandidateProfileModal';

export const ATSCandidateDashboard: React.FC = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minExp, setMinExp] = useState<number | ''>('');
  const [minScore, setMinScore] = useState<number | ''>('');

  // Selected Candidate Modal
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: 'الرياض',
    currentTitle: '',
    yearsOfExperience: 3,
    skills: 'React, Node.js, TypeScript'
  });
  const [createLoading, setCreateLoading] = useState(false);

  // CV Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const pipelineStages = [
    { id: '', label: 'جميع المراحل' },
    { id: 'APPLIED', label: 'تقديم الطلب (Applied)' },
    { id: 'SCREENING', label: 'الفحص (Screening)' },
    { id: 'AI_REVIEW', label: 'مراجعة AI (AI Review)' },
    { id: 'SHORTLISTED', label: 'القائمة القصيرة (Shortlisted)' },
    { id: 'INTERVIEW_SCHEDULED', label: 'جدولة المقابلة' },
    { id: 'INTERVIEW_COMPLETED', label: 'إكمال المقابلة' },
    { id: 'OFFER_SENT', label: 'إرسال العرض (Offer Sent)' },
    { id: 'ACCEPTED', label: 'تم القبول (Accepted)' },
    { id: 'HIRED', label: 'تم التعيين (Hired)' },
    { id: 'REJECTED', label: 'مرفوض (Rejected)' }
  ];

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const res: any = await atsCandidateService.getCandidates({
        search: search || undefined,
        skill: skillFilter || undefined,
        status: statusFilter || undefined,
        location: locationFilter || undefined,
        minExperience: minExp !== '' ? Number(minExp) : undefined,
        minScore: minScore !== '' ? Number(minScore) : undefined
      });
      setCandidates(res.data || res.candidates || []);
    } catch (err: any) {
      console.error('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCandidates();
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      await atsCandidateService.createCandidate({
        ...createForm,
        yearsOfExperience: Number(createForm.yearsOfExperience),
        skills: createForm.skills.split(',').map(s => s.trim())
      });
      setShowCreateModal(false);
      setCreateForm({ fullName: '', email: '', phone: '', location: 'الرياض', currentTitle: '', yearsOfExperience: 3, skills: 'React, Node.js, TypeScript' });
      await loadCandidates();
    } catch (err: any) {
      console.error('Create candidate failed:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUploadCV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) return;
    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('cv', cvFile);
      await atsCandidateService.uploadAndParseCV(formData);
      setShowUploadModal(false);
      setCvFile(null);
      await loadCandidates();
    } catch (err: any) {
      console.error('CV upload failed:', err);
    } finally {
      setUploadLoading(false);
    }
  };

  // Compute summary stats
  const totalCount = candidates.length;
  const hiredCount = candidates.filter(c => c.status === 'HIRED').length;
  const shortlistedCount = candidates.filter(c => ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'].includes(c.status)).length;
  const avgScore = totalCount > 0
    ? Math.round(candidates.reduce((acc, curr) => acc + (curr.aiScore || 80), 0) / totalCount)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 space-y-6" dir="rtl">
      
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              نظام تتبع وإدارة المرشحين (ATS Candidate Dashboard)
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              إدارة رحلة المرشحين بالذكاء الاصطناعي من التقديم والتحليل حتى التعيين الفعلي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4 text-purple-600" /> رفع وتحليل CV بالـ AI
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> إضافة مرشح جديد
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{totalCount}</div>
            <div className="text-xs font-bold text-gray-500">إجمالي المرشحين المسجلين</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{shortlistedCount}</div>
            <div className="text-xs font-bold text-gray-500">في القائمة القصيرة والمقابلات</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{hiredCount}</div>
            <div className="text-xs font-bold text-gray-500">مرشحين تم تعيينهم بنجاح</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{avgScore}/100</div>
            <div className="text-xs font-bold text-gray-500">متوسط درجة مطابقة AI</div>
          </div>
        </div>
      </div>

      {/* Advanced Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              placeholder="ابحث باسم المرشح، البريد الإلكتروني، المسمى الوظيفي، أو المهارة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>

          {/* Pipeline Stage Select */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white font-bold"
            >
              {pipelineStages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.label}</option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow"
            >
              <Filter className="w-4 h-4" /> تصفية النتائج
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch(''); setSkillFilter(''); setStatusFilter(''); setLocationFilter(''); setMinExp(''); setMinScore('');
                loadCandidates();
              }}
              className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300 rounded-xl text-xs"
              title="إعادة ضبط الفلاتر"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </form>

      {/* Candidates List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-12 text-center text-gray-500">جاري تحميل المرشحين...</div>
        ) : candidates.length === 0 ? (
          <div className="col-span-3 p-12 bg-white dark:bg-gray-800 rounded-2xl text-center text-gray-500 font-bold">
            لا يوجد مرشحون يطابقون شروط البحث حالياً ✨
          </div>
        ) : (
          candidates.map((cand) => {
            const skills = cand.candidateSkills?.length > 0
              ? cand.candidateSkills.map((s: any) => s.skillName)
              : (cand.skills ? (cand.skills.startsWith('[') ? JSON.parse(cand.skills) : cand.skills.split(',')) : []);

            return (
              <div
                key={cand.id}
                className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all space-y-4 relative group"
              >
                {/* Top Row: Name & Match Score */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 font-bold flex items-center justify-center text-lg">
                      {cand.fullName ? cand.fullName.charAt(0) : 'C'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                        {cand.fullName}
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {cand.currentTitle || cand.recruitmentjob?.title || 'مطور برمجيات'}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-extrabold rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {cand.aiScore || 85}/100
                  </span>
                </div>

                {/* Details Pills */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-gray-400" /> <span>{cand.yearsOfExperience || cand.experience || 0} سنوات</span></div>
                  <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" /> <span>{cand.location || 'الرياض'}</span></div>
                </div>

                {/* Skills Badges */}
                <div className="flex flex-wrap gap-1">
                  {skills.slice(0, 4).map((s: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-semibold rounded-md">
                      {s}
                    </span>
                  ))}
                  {skills.length > 4 && (
                    <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-md">
                      +{skills.length - 4}
                    </span>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded-lg border border-purple-200 dark:border-purple-800">
                    {cand.status}
                  </span>

                  <button
                    onClick={() => setSelectedCandidateId(cand.id)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" /> معاينة الملف
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Candidate Profile Modal */}
      {selectedCandidateId && (
        <CandidateProfileModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
          onUpdate={loadCandidates}
        />
      )}

      {/* Create Candidate Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" /> إضافة مرشح جديد يدوياً
              </h3>
              <button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <form onSubmit={handleCreateCandidate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">المسمى الوظيفي الحالي</label>
                  <input
                    type="text"
                    value={createForm.currentTitle}
                    onChange={(e) => setCreateForm({ ...createForm, currentTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">سنوات الخبرة</label>
                  <input
                    type="number"
                    value={createForm.yearsOfExperience}
                    onChange={(e) => setCreateForm({ ...createForm, yearsOfExperience: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">المهارات التقنية (مفصولة بفواصل)</label>
                <input
                  type="text"
                  value={createForm.skills}
                  onChange={(e) => setCreateForm({ ...createForm, skills: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl">إلغاء</button>
                <button type="submit" disabled={createLoading} className="px-5 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow">{createLoading ? 'جاري الحفظ...' : 'حفظ المرشح ✨'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload CV Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" /> رفع وتحليل CV بالذكاء الاصطناعي
              </h3>
              <button onClick={() => setShowUploadModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <form onSubmit={handleUploadCV} className="space-y-4">
              <div className="border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-2xl p-6 text-center space-y-2 bg-purple-50/50 dark:bg-purple-950/20">
                <Upload className="w-8 h-8 text-purple-600 mx-auto" />
                <div className="text-xs font-bold text-gray-700 dark:text-gray-300">اختر ملف السيرة الذاتية (PDF, Word)</div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl">إلغاء</button>
                <button type="submit" disabled={!cvFile || uploadLoading} className="px-5 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow disabled:opacity-50">
                  {uploadLoading ? 'جاري الفحص والتحليل...' : 'تشغيل التحليل والحفظ ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ATSCandidateDashboard;
