import React, { useState, useEffect } from 'react';
import {
  User, Briefcase, GraduationCap, MapPin, Mail, Phone, Award,
  Sparkles, Brain, CheckCircle, Clock, Trash2, Edit3, X,
  ExternalLink, FileText, Layers, StickyNote, Plus, Video, Target,
  Loader2, AlertCircle
} from 'lucide-react';
import { atsCandidateService } from '../../../../../../../packages/services/src/ats-candidate.service';
import { recruitmentService } from '../../../../../../../packages/services/src/recruitment.service';

interface CandidateProfileModalProps {
  candidateId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({
  candidateId,
  onClose,
  onUpdate,
}) => {
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'interviews' | 'applications' | 'notes' | 'documents' | 'history'>('profile');
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [selectedMatchJobId, setSelectedMatchJobId] = useState<string>('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res: any = await atsCandidateService.getCandidateById(candidateId);
      const candData = res?.data || res;
      setCandidate(candData);
      setEditForm({
        fullName: candData.fullName || '',
        currentTitle: candData.currentTitle || '',
        location: candData.location || '',
        nationality: candData.nationality || '',
        salaryExpectation: candData.salaryExpectation || '',
        availability: candData.availability || '',
        yearsOfExperience: candData.yearsOfExperience || candData.experience || 0
      });
      if (candData.jobId) {
        setSelectedMatchJobId(candData.jobId);
      }
    } catch (err) {
      console.error('Failed to load candidate full profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const res: any = await recruitmentService.getJobs();
      const list = res?.jobs || (Array.isArray(res) ? res : (res?.data || []));
      setAvailableJobs(list);
    } catch (err) {
      console.error('Failed to load jobs for candidate matching:', err);
    }
  };

  const loadNotes = async () => {
    try {
      const res: any = await atsCandidateService.getNotes(candidateId);
      setNotes(res?.data || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  };

  const loadApplications = async () => {
    try {
      const res: any = await atsCandidateService.getApplications(candidateId);
      setApplications(res?.data || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    }
  };

  useEffect(() => {
    loadProfile();
    loadJobs();
    loadNotes();
    loadApplications();
  }, [candidateId]);

  const handleRunAIMatch = async (targetJobIdOverride?: string) => {
    const targetJobId = targetJobIdOverride || selectedMatchJobId || candidate?.jobId;
    try {
      setMatchingLoading(true);
      await atsCandidateService.matchCandidateWithJob(candidateId, targetJobId);
      await loadProfile();
      await loadApplications();
      onUpdate();
    } catch (err) {
      console.error('AI Matching failed:', err);
      alert('تعذر إكمال مطابقة الذكاء الاصطناعي مع الوظيفة المحددة.');
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleDeleteCandidate = async () => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف المرشح (${candidate?.fullName})؟`)) return;
    try {
      await atsCandidateService.deleteCandidate(candidateId);
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Failed to delete candidate:', err);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await atsCandidateService.updateCandidateStatus(candidateId, newStatus, `تحديث مرحلة التوظيف إلى: ${newStatus}`);
      await loadProfile();
      onUpdate();
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    try {
      setAddingNote(true);
      await atsCandidateService.addNote(candidateId, newNoteContent.trim());
      setNewNoteContent('');
      await loadNotes();
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('هل تريد حذف هذه الملاحظة؟')) return;
    try {
      await atsCandidateService.deleteNote(candidateId, noteId);
      await loadNotes();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSavingEdit(true);
      await atsCandidateService.updateCandidate(candidateId, {
        ...editForm,
        yearsOfExperience: Number(editForm.yearsOfExperience),
        salaryExpectation: editForm.salaryExpectation ? Number(editForm.salaryExpectation) : undefined
      });
      setIsEditing(false);
      await loadProfile();
      onUpdate();
    } catch (err) {
      console.error('Failed to save profile updates:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  // Authenticated CV viewing with Blob handling & cleanup
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);

  const handleOpenCV = async () => {
    try {
      setCvLoading(true);
      setCvError(null);

      const response = await atsCandidateService.downloadCandidateCV(candidateId);
      
      const contentType = response?.headers?.['content-type'] || 'application/pdf';
      const fileBlob = new Blob([response.data], { type: contentType });
      const blobUrl = URL.createObjectURL(fileBlob);

      const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        // Fallback for pop-up blockers: trigger download link
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `CV-${candidate.fullName || candidateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      // Cleanup blob url after 60 seconds
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60000);

    } catch (err: any) {
      console.error('Error opening CV:', err);
      const status = err?.response?.status;
      if (status === 401) {
        setCvError('جلسة الدخول انتهت، يرجى تسجيل الدخول مرة أخرى.');
      } else if (status === 403) {
        setCvError('ليس لديك صلاحية مشاهدة السيرة الذاتية لهذا المرشح.');
      } else if (status === 404) {
        setCvError('السيرة الذاتية غير متوفرة لهذا المرشح.');
      } else {
        setCvError(err?.response?.data?.message || 'تعذر جلب ملف السيرة الذاتية. يرجى المحاولة لاحقاً.');
      }
    } finally {
      setCvLoading(false);
    }
  };

  if (loading || !candidate) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl flex items-center gap-3 text-gray-700 dark:text-gray-200">
          <div className="w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-bold text-sm">جاري تحميل ملف المرشح...</span>
        </div>
      </div>
    );
  }

  const skillsList = candidate.candidateSkills?.length > 0
    ? candidate.candidateSkills.map((s: any) => s.skillName)
    : (candidate.skills ? (typeof candidate.skills === 'string' && candidate.skills.startsWith('[') ? JSON.parse(candidate.skills) : candidate.skills.split(',')) : []);

  const previousCompanies = candidate.previousCompanies
    ? (typeof candidate.previousCompanies === 'string' && candidate.previousCompanies.startsWith('[') ? JSON.parse(candidate.previousCompanies) : (typeof candidate.previousCompanies === 'string' ? [candidate.previousCompanies] : candidate.previousCompanies))
    : [];

  const aiDetails = candidate.aiAnalysisDetails
    ? (typeof candidate.aiAnalysisDetails === 'string' ? JSON.parse(candidate.aiAnalysisDetails) : candidate.aiAnalysisDetails)
    : null;

  const interviewsList = candidate.interviews || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white dark:bg-gray-800 w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden my-8">
        
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between flex-wrap gap-4 relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {candidate.fullName ? candidate.fullName.charAt(0) : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{candidate.fullName}</h2>
                {typeof candidate.aiScore === 'number' && candidate.aiScore !== null ? (
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {candidate.aiScore}/100 Match
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-white/10 text-gray-300 text-xs font-bold rounded-full">
                    لم تجرَ المطابقة بعد
                  </span>
                )}
              </div>
              <p className="text-indigo-200 text-xs mt-0.5">
                {candidate.currentTitle || 'المسمى غير محدد في السيرة الذاتية'} {candidate.recruitmentjob?.title ? `• متقدم لوظيفة: ${candidate.recruitmentjob.title}` : ''} • {candidate.yearsOfExperience || candidate.experience ? `${candidate.yearsOfExperience || candidate.experience} سنوات خبرة` : 'الخبرة غير محددة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'إلغاء التعديل' : 'تعديل الملف'}
            </button>
            <button
              onClick={() => handleRunAIMatch()}
              disabled={matchingLoading}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              <Brain className={`w-4 h-4 ${matchingLoading ? 'animate-spin' : ''}`} />
              {matchingLoading ? 'جاري التحليل...' : 'تشغيل AI Matching 🤖'}
            </button>
            <button
              onClick={handleDeleteCandidate}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-all border border-red-500/30"
              title="حذف المرشح"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pipeline Status Action Bar */}
        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border-b border-purple-100 dark:border-purple-900 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">المرحلة الحالية:</span>
            <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-sm">
              {candidate.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">تحديث المرحلة:</span>
            <div className="flex flex-wrap gap-1.5">
              {['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'OFFER_EXTENDED', 'HIRED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  disabled={updatingStatus || candidate.status === st}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    candidate.status === st
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 overflow-x-auto">
          <button onClick={() => setActiveTab('profile')} className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <User className="w-4 h-4" /> الملف الشخصي
          </button>
          <button onClick={() => setActiveTab('ai')} className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ai' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Brain className="w-4 h-4" /> تحليل الذكاء الاصطناعي (AI Matching)
          </button>
          <button onClick={() => setActiveTab('interviews')} className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'interviews' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Video className="w-4 h-4" /> المقابلات الحقيقية ({interviewsList.length})
          </button>
          <button onClick={() => setActiveTab('applications')} className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'applications' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Layers className="w-4 h-4" /> الطلبات
          </button>
          <button onClick={() => setActiveTab('notes')} className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'notes' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <StickyNote className="w-4 h-4" /> ملاحظات ({notes.length})
          </button>
          <button onClick={() => setActiveTab('documents')} className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'documents' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <FileText className="w-4 h-4" /> الملفات
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'profile' && (
            <div>
              {isEditing ? (
                <div className="bg-purple-50/50 dark:bg-purple-950/20 p-5 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-4">
                  <h3 className="text-xs font-bold text-purple-900 dark:text-purple-300">تعديل بيانات المرشح</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">الاسم الكامل</label>
                      <input type="text" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className="w-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 text-xs" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">المسمى الحالي</label>
                      <input type="text" value={editForm.currentTitle} onChange={(e) => setEditForm({ ...editForm, currentTitle: e.target.value })} className="w-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 text-xs" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">الموقع / المدينة</label>
                      <input type="text" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} placeholder="غير محدد" className="w-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 text-xs" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">الجنسية</label>
                      <input type="text" value={editForm.nationality} onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })} placeholder="غير محدد" className="w-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 text-xs" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">الراتب المتوقع (SAR)</label>
                      <input type="number" value={editForm.salaryExpectation} onChange={(e) => setEditForm({ ...editForm, salaryExpectation: e.target.value })} className="w-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 text-xs" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-bold bg-gray-200 rounded-xl">إلغاء</button>
                    <button onClick={handleSaveEdit} disabled={savingEdit} className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl shadow-md">{savingEdit ? 'جاري الحفظ...' : 'حفظ'}</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-500" /> البيانات الشخصية والتعويضات
                      </h3>
                      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /> <span>{candidate.email || 'غير مسجل'}</span></div>
                        <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> <span>{candidate.phone || 'غير مسجل'}</span></div>
                        <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400" /> <span>الموقع: {candidate.location || 'غير متوفر'}</span></div>
                        <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-gray-400" /> <span>الجنسية: {candidate.nationality || 'غير محددة'}</span></div>
                        <div className="flex items-center gap-2"><Award className="w-3.5 h-3.5 text-emerald-500" /> <span>الراتب المتوقع: <strong>{candidate.salaryExpectation ? `${candidate.salaryExpectation} SAR` : 'غير محدد'}</strong></span></div>
                        <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-indigo-500" /> <span>الجاهزية: <strong>{candidate.availability || 'غير محدد'}</strong></span></div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-500" /> المهارات المستخرجة
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {skillsList.length > 0 ? (
                          skillsList.map((skill: string, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold rounded-lg">{skill}</span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">لم تذكر أي مهارات في السيرة الذاتية</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-6">
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-purple-500" /> الخبرات والشركات السابقة
                      </h3>
                      {candidate.candidateExperiences?.length > 0 ? (
                        <div className="space-y-3">
                          {candidate.candidateExperiences.map((exp: any) => (
                            <div key={exp.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                              <div className="font-bold text-xs text-gray-900 dark:text-white">{exp.position} - {exp.company}</div>
                              <div className="text-[11px] text-gray-500 mt-1">{exp.description || 'لم يتم إضافة تفاصيل إضافية للخبرة'}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {Array.isArray(previousCompanies) && previousCompanies.length > 0 
                            ? previousCompanies.join(' • ') 
                            : 'لم تسجل شركات سابقة صراحة في السيرة الذاتية.'}
                        </div>
                      )}
                    </div>
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-purple-500" /> المؤهل العلمي
                      </h3>
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        {(() => {
                          if (!candidate.education) return 'لم يذكر المؤهل العلمي في السيرة الذاتية.';
                          if (typeof candidate.education === 'object') {
                            return `${candidate.education.degree || ''} ${candidate.education.field ? `في ${candidate.education.field}` : ''} ${candidate.education.institution ? `- ${candidate.education.institution}` : ''}`.trim() || 'لم يذكر المؤهل العلمي في السيرة الذاتية.';
                          }
                          if (typeof candidate.education === 'string' && candidate.education.startsWith('{')) {
                            try {
                              const parsed = JSON.parse(candidate.education);
                              return `${parsed.degree || ''} ${parsed.field ? `في ${parsed.field}` : ''} ${parsed.institution ? `- ${parsed.institution}` : ''}`.trim() || candidate.education;
                            } catch {
                              return candidate.education;
                            }
                          }
                          return candidate.education;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200">الوظيفة المستهدفة للمطابقة:</span>
                  <select value={selectedMatchJobId} onChange={(e) => setSelectedMatchJobId(e.target.value)} className="p-1.5 bg-white dark:bg-gray-800 rounded-lg border border-purple-300 text-xs font-medium">
                    <option value="">{candidate.recruitmentjob?.title || 'اختر وظيفة محددة'}</option>
                    {availableJobs.map((j) => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => handleRunAIMatch(selectedMatchJobId)} disabled={matchingLoading} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5 disabled:opacity-50">
                  <Sparkles className="w-3.5 h-3.5" /> إعادة المطابقة
                </button>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl font-black shadow-md">
                      {typeof candidate.aiScore === 'number' && candidate.aiScore !== null ? `${candidate.aiScore}%` : 'N/A'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">درجة مطابقة الذكاء الاصطناعي الفعلية</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">تقييم دقيق بناءً على الوظيفة المحددة ({aiDetails?.jobTitle || candidate.recruitmentjob?.title || 'المحددة'})</p>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-purple-900">
                  <span className="font-bold text-purple-900 dark:text-purple-300 block mb-1">التقرير والملخص التحليلي:</span>
                  {candidate.aiSummary || 'لم يتم إجراء تحليل ومطابقة بالذكاء الاصطناعي بعد.'}
                </div>

                {/* Score Breakdown if available */}
                {aiDetails?.scoreBreakdown && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                      <div className="text-xs text-gray-500">مطابقة المهارات</div>
                      <div className="text-base font-extrabold text-purple-600 mt-0.5">
                        {aiDetails.scoreBreakdown.skills ?? aiDetails.scoreBreakdown.skillsMatch ?? 'غير محدد'}%
                      </div>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                      <div className="text-xs text-gray-500">مطابقة الخبرة العملية</div>
                      <div className="text-base font-extrabold text-indigo-600 mt-0.5">
                        {aiDetails.scoreBreakdown.experience ?? aiDetails.scoreBreakdown.experienceMatch ?? 'غير محدد'}%
                      </div>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                      <div className="text-xs text-gray-500">مطابقة المؤهل العلمي</div>
                      <div className="text-base font-extrabold text-teal-600 mt-0.5">
                        {aiDetails.scoreBreakdown.education ?? aiDetails.scoreBreakdown.educationMatch ?? 'غير محدد'}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Strengths & Weaknesses & Evidence */}
                {aiDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> نقاط القوة المدعومة بالأدلة:
                      </h4>
                      {aiDetails.strengths?.length > 0 ? (
                        <ul className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1 list-disc list-inside">
                          {aiDetails.strengths.map((str: string, i: number) => (
                            <li key={i}>{str}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-emerald-600 italic">لا توجد نقاط قوة إضافية مسجلة صراحة.</p>
                      )}
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
                      <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" /> نقاط القصور والمهارات الناقصة:
                      </h4>
                      {aiDetails.weaknesses?.length > 0 || aiDetails.missingSkills?.length > 0 ? (
                        <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                          {aiDetails.weaknesses?.map((wk: string, i: number) => (
                            <li key={i}>{wk}</li>
                          ))}
                          {aiDetails.missingSkills?.map((ms: string, i: number) => (
                            <li key={`ms-${i}`}>مهارة ناقصة: {ms}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-amber-600 italic">لم تسجل نقاط قصور جوهرية مقارنة بمتطلبات الوظيفة.</p>
                      )}
                    </div>
                  </div>
                )}

                {aiDetails?.evidence?.length > 0 && (
                  <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800 space-y-2">
                    <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" /> الأدلة المستخرجة من السيرة الذاتية:
                    </h4>
                    <ul className="text-xs text-purple-800 dark:text-purple-300 space-y-1 list-disc list-inside">
                      {aiDetails.evidence.map((ev: string, idx: number) => (
                        <li key={idx}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'interviews' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-500" /> سجل المقابلات الحقيقية ونتائج الذكاء الاصطناعي
              </h3>
              {interviewsList.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                  لم يقم المرشح بإجراء أي مقابلة بعد.
                </div>
              ) : (
                interviewsList.map((inv: any) => {
                  const interviewAnalysis = inv.aiAnalysis ? (typeof inv.aiAnalysis === 'string' ? JSON.parse(inv.aiAnalysis) : inv.aiAnalysis) : null;
                  return (
                    <div key={inv.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-purple-600 text-white text-[10px] font-bold rounded-lg">{inv.type || 'مقابلة فيديو AI'}</span>
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">الحالة: {inv.status || (inv.completed ? 'مكتملة' : 'قيد الإجراء')}</span>
                        </div>
                        {typeof inv.aiScore === 'number' && inv.aiScore !== null && (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-lg border border-emerald-300">
                            درجة المقابلة: {inv.aiScore}/100
                          </span>
                        )}
                      </div>

                      {inv.notes && (
                        <div className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                          <strong>ملاحظات وإجابات المرشح:</strong> {inv.notes}
                        </div>
                      )}

                      {inv.aiSummary && (
                        <div className="text-xs text-purple-900 dark:text-purple-200 bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-200 dark:border-purple-800">
                          <strong>تقييم الذكاء الاصطناعي للمقابلة:</strong> {inv.aiSummary}
                        </div>
                      )}

                      {interviewAnalysis && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {interviewAnalysis.strengths && (
                            <div className="p-2.5 bg-emerald-50/50 rounded-lg text-emerald-800">
                              <strong>نقاط قوة المقابلة:</strong> {Array.isArray(interviewAnalysis.strengths) ? interviewAnalysis.strengths.join(' • ') : interviewAnalysis.strengths}
                            </div>
                          )}
                          {interviewAnalysis.weaknesses && (
                            <div className="p-2.5 bg-amber-50/50 rounded-lg text-amber-800">
                              <strong>ملاحظات المقابلة:</strong> {Array.isArray(interviewAnalysis.weaknesses) ? interviewAnalysis.weaknesses.join(' • ') : interviewAnalysis.weaknesses}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-[10px] text-gray-400">تاريخ المقابلة: {new Date(inv.createdAt).toLocaleString('ar-SA')}</div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" /> الوظائف التي تقدم إليها المرشح
              </h3>
              {applications.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">لا توجد طلبات تقديم إضافية لهذا المرشح.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {applications.map((app: any) => (
                    <div key={app.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-900 dark:text-white">{app.recruitmentjob?.title || app.jobRequest?.jobTitle || 'وظيفة معلنة'}</span>
                        <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">{app.status}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{app.matchAnalysis || 'طلب تقديم رسمي عبر نظام ATS'}</p>
                      {typeof app.score === 'number' && app.score !== null && (
                        <div className="text-xs font-extrabold text-emerald-600">درجة المطابقة مع هذه الوظيفة: {app.score}%</div>
                      )}
                      <div className="text-[10px] text-gray-400">تاريخ التقديم: {new Date(app.createdAt).toLocaleDateString('ar-SA')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea rows={2} value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="أضف ملاحظة سرية لفريق التوظيف..." className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-purple-500" />
                <button type="submit" disabled={addingNote || !newNoteContent.trim()} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50">
                  <Plus className="w-4 h-4" /> {addingNote ? 'جاري الإضافة...' : 'إضافة ملاحظة'}
                </button>
              </form>
              <div className="space-y-3 pt-2">
                {notes.length === 0 ? (
                  <div className="text-center p-6 text-xs text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                    لا توجد ملاحظات مسجلة بعد لهذا المرشح.
                  </div>
                ) : (
                  notes.map((n: any) => (
                    <div key={n.id} className="p-3.5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <strong className="text-purple-600 dark:text-purple-400">{n.authorName || 'مسؤول التوظيف'}</strong>
                          <span className="text-[11px] text-gray-400">{new Date(n.createdAt).toLocaleString('ar-SA')}</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{n.content}</p>
                      </div>
                      <button onClick={() => handleDeleteNote(n.id)} className="text-red-400 hover:text-red-600 p-1" title="حذف الملاحظة">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" /> استعراض السيرة الذاتية (Secure CV Viewer)
              </h3>
              <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">{candidate.fullName} - Resume</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">الملف مؤمن ومحمي ويتم استعراضه عبر جلسة التوثيق الخاصة بشركتك.</p>
                </div>
                {candidate.resumePath || candidate.resumeUrl ? (
                  <button
                    onClick={handleOpenCV}
                    disabled={cvLoading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                  >
                    {cvLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري جلب الملف الآمن...</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح واستعراض السيرة الذاتية</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 italic">لا يوجد ملف سيرة ذاتية مرفق لهذا المرشح</span>
                )}
              </div>

              {cvError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{cvError}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" /> سجل التحركات والتحديثات (Audit Trail)
              </h3>
              <div className="relative border-r-2 border-purple-200 dark:border-purple-900 mr-4 pr-6 space-y-6">
                {candidate.candidateHistories?.map((log: any) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -right-9 top-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">✓</div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-900 dark:text-white">{log.action}</span>
                        <span className="text-[11px] text-gray-500">{new Date(log.createdAt).toLocaleString('ar-SA')}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">{log.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-500">كود المقابلة الموحد: <strong className="text-purple-600 font-mono">{candidate.interviewCode || 'غير منشأ'}</strong></span>
          <button onClick={onClose} className="px-5 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-800 dark:text-white text-xs font-bold rounded-xl">
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

export default CandidateProfileModal;

