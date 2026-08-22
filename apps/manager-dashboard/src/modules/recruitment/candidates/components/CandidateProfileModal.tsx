import React, { useState, useEffect } from 'react';
import {
  X, User, Briefcase, GraduationCap, Award, Sparkles, Clock, MapPin, Phone, Mail, Globe,
  ChevronRight, Brain, ThumbsUp, ThumbsDown, Trash2, FileText, StickyNote, Plus, Layers,
  DollarSign, Calendar, ExternalLink, Edit3, Check
} from 'lucide-react';
import { atsCandidateService } from '@hr/services';

interface CandidateProfileModalProps {
  candidateId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({
  candidateId,
  onClose,
  onUpdate
}) => {
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'applications' | 'notes' | 'documents' | 'history'>('profile');
  const [statusComment, setStatusComment] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Applications state
  const [applications, setApplications] = useState<any[]>([]);

  // Edit Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const pipelineStages = [
    { id: 'APPLIED', label: 'تقديم الطلب (Applied)', color: 'blue' },
    { id: 'SCREENING', label: 'الفحص المبدئي (Screening)', color: 'purple' },
    { id: 'AI_REVIEW', label: 'مراجعة AI (AI Review)', color: 'indigo' },
    { id: 'SHORTLISTED', label: 'القائمة القصيرة (Shortlisted)', color: 'teal' },
    { id: 'INTERVIEW_SCHEDULED', label: 'جدولة المقابلة (Interview Scheduled)', color: 'amber' },
    { id: 'INTERVIEW_COMPLETED', label: 'إكمال المقابلة (Interview Completed)', color: 'cyan' },
    { id: 'OFFER_SENT', label: 'إرسال العرض (Offer Sent)', color: 'orange' },
    { id: 'ACCEPTED', label: 'قبول العرض (Accepted)', color: 'emerald' },
    { id: 'HIRED', label: 'تم التعيين (Hired)', color: 'green' },
    { id: 'REJECTED', label: 'مرفوض (Rejected)', color: 'red' },
    { id: 'WITHDRAWN', label: 'منسحب (Withdrawn)', color: 'gray' },
    { id: 'NO_RESPONSE', label: 'لا يستجيب (No Response)', color: 'slate' }
  ];

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res: any = await atsCandidateService.getCandidateById(candidateId);
      const data = res?.data || res;
      setCandidate(data);
      setEditForm({
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        nationality: data.nationality || '',
        currentTitle: data.currentTitle || '',
        yearsOfExperience: data.yearsOfExperience || data.experience || 0,
        salaryExpectation: data.salaryExpectation || '',
        availability: data.availability || '',
        education: data.education || ''
      });
    } catch (err) {
      console.error('Failed to load candidate profile:', err);
    } finally {
      setLoading(false);
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
    loadNotes();
    loadApplications();
  }, [candidateId]);

  const handleRunAIMatch = async () => {
    try {
      setMatchingLoading(true);
      await atsCandidateService.matchCandidateWithJob(candidateId);
      await loadProfile();
      onUpdate();
    } catch (err) {
      console.error('AI Matching failed:', err);
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
      await atsCandidateService.updateCandidateStatus(candidateId, newStatus, statusComment);
      setStatusComment('');
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
      await loadProfile();
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

  if (loading || !candidate) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl flex items-center gap-3 text-gray-700 dark:text-gray-200">
          <div className="w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-bold text-sm">جاري تحميل ملف المرشح الكامل...</span>
        </div>
      </div>
    );
  }

  const skillsList = candidate.candidateSkills?.length > 0
    ? candidate.candidateSkills.map((s: any) => s.skillName)
    : (candidate.skills ? (candidate.skills.startsWith('[') ? JSON.parse(candidate.skills) : candidate.skills.split(',')) : []);

  const previousCompanies = candidate.previousCompanies
    ? (typeof candidate.previousCompanies === 'string' && candidate.previousCompanies.startsWith('[') ? JSON.parse(candidate.previousCompanies) : candidate.previousCompanies)
    : [];

  const aiDetails = candidate.aiAnalysisDetails
    ? (typeof candidate.aiAnalysisDetails === 'string' ? JSON.parse(candidate.aiAnalysisDetails) : candidate.aiAnalysisDetails)
    : null;

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
                {candidate.aiScore && (
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {candidate.aiScore}/100 Match
                  </span>
                )}
              </div>
              <p className="text-indigo-200 text-xs mt-0.5">
                {candidate.currentTitle || candidate.recruitmentjob?.title || 'متقدم لوظيفة'} • {candidate.yearsOfExperience || candidate.experience || 0} سنوات خبرة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'إلغاء التعديل' : 'تعديل الملف'}
            </button>
            <button
              onClick={handleRunAIMatch}
              disabled={matchingLoading}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              <Brain className={`w-4 h-4 ${matchingLoading ? 'animate-spin' : ''}`} />
              {matchingLoading ? 'جاري التحليل...' : 'تشغيل AI Matching 🤖'}
            </button>
            <button
              onClick={handleDeleteCandidate}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl transition-all"
              title="حذف المرشح"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Pipeline Stage Selector Bar */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
            <ChevronRight className="w-4 h-4 text-purple-500" /> مسار مرحلة التوظيف الحالية (Pipeline Stage):
          </div>
          <div className="flex items-center gap-2 min-w-max">
            {pipelineStages.map((stage) => {
              const isActive = candidate.status === stage.id;
              return (
                <button
                  key={stage.id}
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange(stage.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isActive
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                >
                  {stage.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4" /> الملف الشخصي والمهني
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'ai'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Brain className="w-4 h-4" /> تحليل الذكاء الاصطناعي (AI Analysis)
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'applications'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4" /> طلبات الوظائف ({applications.length})
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'notes'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <StickyNote className="w-4 h-4" /> الملاحظات الداخلية ({notes.length})
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" /> السيرة الذاتية (CV)
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4" /> المسار الزمني (Timeline)
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'profile' && (
            <div>
              {isEditing ? (
                <div className="bg-purple-50/50 dark:bg-purple-950/20 p-5 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-4">
                  <h3 className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> تعديل بيانات المرشح
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">الاسم الكامل</label>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="w-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">المسمى الحالي</label>
                      <input
                        type="text"
                        value={editForm.currentTitle}
                        onChange={(e) => setEditForm({ ...editForm, currentTitle: e.target.value })}
                        className="w-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">الراتب المتوقع (SAR)</label>
                      <input
                        type="number"
                        value={editForm.salaryExpectation}
                        onChange={(e) => setEditForm({ ...editForm, salaryExpectation: e.target.value })}
                        className="w-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">الجاهزية للعمل (Availability)</label>
                      <input
                        type="text"
                        value={editForm.availability}
                        onChange={(e) => setEditForm({ ...editForm, availability: e.target.value })}
                        placeholder="مثال: فوري / إشعار شهر"
                        className="w-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-xs font-bold bg-gray-200 dark:bg-gray-700 rounded-xl"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                      className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl shadow-md flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> {savingEdit ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left Column: Personal & Compensation Info */}
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-500" /> البيانات الشخصية والتعويضات
                      </h3>
                      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /> <span>{candidate.email}</span></div>
                        <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> <span>{candidate.phone || 'غير مسجل'}</span></div>
                        <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400" /> <span>{candidate.location || 'الرياض'}</span></div>
                        <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-gray-400" /> <span>الجنسية: {candidate.nationality || 'سعودي'}</span></div>
                        <div className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-emerald-500" /> <span>الراتب المتوقع: <strong>{candidate.salaryExpectation ? `${candidate.salaryExpectation} SAR` : 'غير محدد'}</strong></span></div>
                        <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-indigo-500" /> <span>الجاهزية: <strong>{candidate.availability || 'غير محدد'}</strong></span></div>
                      </div>
                    </div>

                    {/* Skills Box */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-500" /> المهارات التقنية
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {skillsList.map((skill: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold rounded-lg">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Professional Experience & Education */}
                  <div className="md:col-span-2 space-y-6">
                    
                    {/* Previous Companies */}
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-purple-500" /> الخبرات والشركات السابقة
                      </h3>
                      
                      {candidate.candidateExperiences?.length > 0 ? (
                        <div className="space-y-3">
                          {candidate.candidateExperiences.map((exp: any) => (
                            <div key={exp.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                              <div className="font-bold text-xs text-gray-900 dark:text-white">{exp.position} - {exp.company}</div>
                              <div className="text-[11px] text-gray-500 mt-1">{exp.description || 'خبرة سابقة في تطوير البرمجيات وإدارة المهام'}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">
                          {Array.isArray(previousCompanies) && previousCompanies.length > 0 ? previousCompanies.join(' • ') : 'الخبرات السابقة مسجلة ومحفوظة في السيرة الذاتية.'}
                        </div>
                      )}
                    </div>

                    {/* Education */}
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-purple-500" /> المؤهل العلمي
                      </h3>
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        {candidate.education || 'بكالوريوس علوم الحاسب والمعلومات - جامعة الملك سعود'}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl font-black">
                      {candidate.aiScore || 85}%
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">نتيجة مطابقة الذكاء الاصطناعي (AI Match Score)</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">تقييم شامل لمدى توافق المرشح مع متطلبات الوظيفة</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-purple-900">
                  {candidate.aiSummary || 'يمتلك المرشح خبرة تقنية مناسبة ومطابقة قوية لمتطلبات الوظيفة مع مهارات أساسية متقدمة.'}
                </p>

                {/* Strengths & Weaknesses */}
                {aiDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <ThumbsUp className="w-4 h-4 text-emerald-600" /> نقاط القوة (Strengths):
                      </h4>
                      <ul className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1 list-disc list-inside">
                        {aiDetails.strengths?.map((str: string, i: number) => (
                          <li key={i}>{str}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
                      <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <ThumbsDown className="w-4 h-4 text-amber-600" /> التوصيات والملاحظات (Weaknesses):
                      </h4>
                      <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                        {aiDetails.weaknesses?.map((wk: string, i: number) => (
                          <li key={i}>{wk}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" /> الوظائف التي تقدم إليها المرشح (Multi-Job Applications)
              </h3>
              {applications.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                  لا توجد طلبات تقديم إضافية لهذا المرشح.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {applications.map((app: any) => (
                    <div key={app.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-900 dark:text-white">{app.recruitmentjob?.title || app.jobRequest?.jobTitle || 'وظيفة معلنة'}</span>
                        <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">{app.status}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{app.matchAnalysis || 'طلب تقديم رسمي عبر نظام ATS'}</p>
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
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <StickyNote className="w-4 h-4 text-purple-500" /> إضافة ملاحظة سرية للمرشح:
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="اكتب ملاحظة لفريق التوظيف (مثل: انطباع المقابلة، التوصيات...)"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={addingNote || !newNoteContent.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" /> {addingNote ? 'جاري الإضافة...' : 'إضافة'}
                  </button>
                </div>
              </form>

              <div className="space-y-3 pt-3">
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
                      <button
                        onClick={() => handleDeleteNote(n.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="حذف الملاحظة"
                      >
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
              <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">{candidate.fullName} - Resume.pdf</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">الملف مؤمن ومشفر ويتم استعراضه عبر جلسة التوثيق الخاصة بشركتك.</p>
                </div>
                <a
                  href={atsCandidateService.getCandidateCVUrl(candidateId)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> فتح واستعراض السيرة الذاتية
                </a>
              </div>
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
                    <div className="absolute -right-9 top-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>
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
          <span className="text-xs text-gray-500">كود المقابلة الموحد: <strong className="text-purple-600 font-mono">{candidate.interviewCode}</strong></span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-800 dark:text-white text-xs font-bold rounded-xl"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

export default CandidateProfileModal;

