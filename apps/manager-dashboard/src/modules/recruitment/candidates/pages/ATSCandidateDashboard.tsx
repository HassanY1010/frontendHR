import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, Search, Filter, Sparkles, Plus, Upload, CheckCircle2,
  Eye, MapPin, Briefcase, Award, RotateCcw, X, Trash2, Loader2
} from 'lucide-react';
import { atsCandidateService, recruitmentService } from '@hr/services';
import CandidateProfileModal from '../components/CandidateProfileModal';

export const ATSCandidateDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId);
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
    location: '',
    currentTitle: '',
    yearsOfExperience: 0,
    skills: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  // CV Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const candidateStatuses = [
    { id: '', title: 'كافة الحالات' },
    { id: 'APPLIED', title: 'تقديم الطلب (Applied)' },
    { id: 'SCREENING', title: 'الفحص (Screening)' },
    { id: 'AI_REVIEW', title: 'مراجعة AI (AI Review)' },
    { id: 'SHORTLISTED', title: 'القائمة القصيرة (Shortlisted)' },
    { id: 'INTERVIEW_SCHEDULED', title: 'جدولة المقابلة' },
    { id: 'INTERVIEW_COMPLETED', title: 'إكمال المقابلة' },
    { id: 'OFFER_SENT', title: 'إرسال العرض (Offer Sent)' },
    { id: 'ACCEPTED', title: 'تم القبول (Accepted)' },
    { id: 'HIRED', title: 'تم التعيين (Hired)' },
    { id: 'REJECTED', title: 'مرفوض (Rejected)' }
  ];

  // Sync searchParams with state
  useEffect(() => {
    const urlJobId = searchParams.get('jobId') || '';
    setSelectedJobId(urlJobId);
  }, [searchParams]);

  // Load available jobs for filter header
  useEffect(() => {
    const loadJobsList = async () => {
      try {
        const res: any = await recruitmentService.getJobs();
        const list = res?.jobs || (Array.isArray(res) ? res : (res?.data || []));
        setJobs(list);
      } catch (err) {
        console.error('Failed to load jobs list:', err);
      }
    };
    loadJobsList();
  }, []);

  const loadCandidates = async (overrideJobId?: string) => {
    try {
      setLoading(true);
      const activeJobId = overrideJobId !== undefined ? overrideJobId : selectedJobId;
      const res: any = await atsCandidateService.getCandidates({
        search: search || undefined,
        skill: skillFilter || undefined,
        status: statusFilter || undefined,
        location: locationFilter || undefined,
        minExperience: minExp !== '' ? Number(minExp) : undefined,
        minScore: minScore !== '' ? Number(minScore) : undefined,
        jobId: activeJobId || undefined
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
  }, [statusFilter, selectedJobId]);

  const handleClearJobFilter = () => {
    setSelectedJobId('');
    setSearchParams({});
    loadCandidates('');
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    if (jobId) {
      setSearchParams({ jobId });
    } else {
      setSearchParams({});
    }
    loadCandidates(jobId);
  };

  const handleDeleteCandidate = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف المرشح (${name})؟`)) return;
    try {
      await atsCandidateService.deleteCandidate(id);
      await loadCandidates();
    } catch (err: any) {
      console.error('Failed to delete candidate:', err);
      if (err?.response?.status === 403) {
        alert('عذراً: ليس لديك الصلاحية الكافية لحذف هذا المرشح.');
      } else if (err?.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('تعذر حذف المرشح. يرجى المحاولة مرة أخرى.');
      }
    }
  };

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
      setCreateForm({ fullName: '', email: '', phone: '', location: '', currentTitle: '', yearsOfExperience: 0, skills: '' });
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
      if (selectedJobId) {
        formData.append('jobId', selectedJobId);
      }
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

  // Compute summary stats based on real data
  const totalCount = candidates.length;
  const hiredCount = candidates.filter(c => c.status === 'HIRED').length;
  const shortlistedCount = candidates.filter(c => ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'].includes(c.status)).length;
  const evaluatedCandidates = candidates.filter(c => typeof c.aiScore === 'number' && c.aiScore !== null);
  const avgScore = evaluatedCandidates.length > 0
    ? Math.round(evaluatedCandidates.reduce((acc, curr) => acc + (curr.aiScore || 0), 0) / evaluatedCandidates.length)
    : null;

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
              نظام تتبع وإدارة المرشحين (ATS)
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              إدارة رحلة المرشحين بالذكاء الاصطناعي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4 text-purple-600" /> رفع وتحليل CV
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> إضافة مرشح
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
            <div className="text-xs font-bold text-gray-500">إجمالي المرشحين</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{shortlistedCount}</div>
            <div className="text-xs font-bold text-gray-500">في القائمة القصيرة</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{hiredCount}</div>
            <div className="text-xs font-bold text-gray-500">تم قبولهم وتوظيفهم</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {avgScore !== null ? `${avgScore}%` : 'غير متوفر'}
            </div>
            <div className="text-xs font-bold text-gray-500">متوسط درجة مطابقة AI للمقيمين</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        {/* Active Job Filter Banner */}
        {selectedJobId && (
          <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-4 py-2.5 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-bold">
              <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>يتم الآن عرض المتقدمين المخصصين لوظيفة: </span>
              <span className="text-purple-700 dark:text-purple-300 font-extrabold bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-md">
                {jobs.find((j: any) => j.id === selectedJobId)?.title || 'الوظيفة المحددة'}
              </span>
            </div>
            <button
              onClick={handleClearJobFilter}
              className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 font-bold flex items-center gap-1 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-700 shadow-xs"
            >
              <X className="w-3.5 h-3.5" /> عرض جميع المرشحين
            </button>
          </div>
        )}

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو البريد..."
              className="w-full pr-9 pl-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <select
              value={selectedJobId}
              onChange={(e) => handleJobSelect(e.target.value)}
              className="w-full p-2 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="">جميع الوظائف</option>
              {jobs.map((job: any) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-purple-500"
            >
              <option value="">كافة الحالات</option>
              {candidateStatuses.map((st: any) => (
                <option key={st.id} value={st.id}>{st.title}</option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="فلترة بالمهارة (React...)"
              className="w-full p-2 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Filter className="w-3.5 h-3.5" /> تطبيق
            </button>
            <button
              type="button"
              onClick={() => { setSearch(''); setStatusFilter(''); setSkillFilter(''); setLocationFilter(''); setMinExp(''); setMinScore(''); handleClearJobFilter(); }}
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300 rounded-xl text-xs"
              title="إعادة ضبط"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Candidates Pipeline Grid / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-xs text-gray-500">جاري تحميل وتحديث قائمة المرشحين...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
          <Users className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">لا يوجد مرشحين مسجلين حالياً</h3>
          <p className="text-xs text-gray-400">يمكنك رفع سير ذاتية جديدة لتفكيكها وتحليلها بواسطة الذكاء الاصطناعي</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {candidates.map((cand) => {
            const skills = Array.isArray(cand.candidateSkills) && cand.candidateSkills.length > 0
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
                        {cand.currentTitle || 'المسمى غير محدد في السيرة الذاتية'}
                      </p>
                    </div>
                  </div>

                  {typeof cand.aiScore === 'number' && cand.aiScore !== null ? (
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-extrabold rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {cand.aiScore}/100
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                      لم يتم التحليل
                    </span>
                  )}
                </div>

                {/* Details Pills */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" /> 
                    <span>{cand.yearsOfExperience || cand.experience ? `${cand.yearsOfExperience || cand.experience} سنوات خبرة` : 'الخبرة غير محددة'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> 
                    <span>{cand.location || 'غير متوفر'}</span>
                  </div>
                </div>

                {/* Skills Badges */}
                <div className="flex flex-wrap gap-1">
                  {skills.length > 0 ? (
                    <>
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
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">لا توجد مهارات مسجلة</span>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded-lg border border-purple-200 dark:border-purple-800">
                    {candidateStatuses.find(s => s.id === cand.status)?.title || cand.status}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteCandidate(cand.id, cand.fullName)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 rounded-xl transition-all border border-red-200 dark:border-red-800"
                      title="حذف المرشح"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedCandidateId(cand.id)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> معاينة الملف
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
