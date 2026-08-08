import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  ShieldCheck,
  Send,
  GitBranch
} from 'lucide-react';
import { jobRequestService, hiringPlanService } from '@hr/services';
import WorkflowTimeline from '../workflow/WorkflowTimeline';
import { Snowflake, Play } from 'lucide-react';

interface JobRequestDetailsModalProps {
  requestId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const STATUS_STEPS = [
  { key: 'DRAFT', label: 'تم الإنشاء' },
  { key: 'SUBMITTED', label: 'مُقدّم' },
  { key: 'UNDER_REVIEW', label: 'قيد المراجعة' },
  { key: 'APPROVED', label: 'معتمد' },
  { key: 'RECRUITMENT_STARTED', label: 'بدء التوظيف' },
  { key: 'INTERVIEW_PROCESS', label: 'المقابلات' },
  { key: 'OFFER_STAGE', label: 'مرحلة العرض' },
  { key: 'HIRED', label: 'تم التعيين' },
  { key: 'CLOSED', label: 'مغلق' }
];

export const JobRequestDetailsModal: React.FC<JobRequestDetailsModalProps> = ({
  requestId,
  isOpen,
  onClose,
  onRefresh
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'approvals' | 'history' | 'workflow'>('details');

  // Freeze Modal state
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeReason, setFreezeReason] = useState('BUDGET_PENDING');
  const [resumeDate, setResumeDate] = useState('');
  const [freezeComment, setFreezeComment] = useState('');

  React.useEffect(() => {
    if (isOpen && requestId) {
      fetchDetails();
    }
  }, [isOpen, requestId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await jobRequestService.getJobRequestById(requestId!);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch request details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleFreeze = async () => {
    setActionLoading(true);
    try {
      await hiringPlanService.freezeJobRequest(requestId!, {
        freezeReason,
        resumeDate,
        comment: freezeComment
      });
      setShowFreezeModal(false);
      fetchDetails();
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'فشل تجميد الطلب');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfreeze = async () => {
    setActionLoading(true);
    try {
      await hiringPlanService.unfreezeJobRequest(requestId!, comment || 'فك التجميد واستئناف التوظيف');
      fetchDetails();
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'فشل فك تجميد الطلب');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async (actionType: string, payload: any = {}) => {
    setActionLoading(true);
    try {
      if (actionType === 'submit') {
        await jobRequestService.submitJobRequest(requestId!);
      } else if (actionType === 'approve') {
        await jobRequestService.approveJobRequest(requestId!, payload.comment);
      } else if (actionType === 'reject') {
        await jobRequestService.rejectJobRequest(requestId!, payload.comment);
      } else if (actionType === 'convert-to-job') {
        await jobRequestService.convertToRecruitmentJob(requestId!);
      } else if (actionType === 'transition') {
        await jobRequestService.transitionState(requestId!, payload.targetStatus, payload.comment);
      }
      setComment('');
      fetchDetails();
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'حدث خطأ أثناء تنفيذ الإجراء');
    } finally {
      setActionLoading(false);
    }
  };

  const getStepStatusIndex = (status: string) => {
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  const currentStepIdx = data ? getStepStatusIndex(data.status) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          {loading || !data ? (
            <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 w-48 rounded"></div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-mono font-bold rounded-lg">
                {data.requestId}
              </span>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {data.jobTitle}
                  {data.hiringType === 'IMMEDIATE' && (
                    <span className="px-2.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                      ⚡ توظيف فوري عاجل
                    </span>
                  )}
                  {data.hiringType === 'PLANNED' && (
                    <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                      📅 خطة سنوية (2027)
                    </span>
                  )}
                  {data.hiringType === 'ON_HOLD' && (
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                      ❄️ توظيف مجمد
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  القسم: {data.department?.name || 'غير محدد'} | الشواغر: {data.vacancies}
                </p>
              </div>
            </div>
          )}
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {data && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Interactive Timeline Stepper */}
            <div className="px-6 py-4 bg-gray-50/70 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
              <div className="flex items-center min-w-[700px] justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0" />
                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIdx && data.status !== 'REJECTED' && data.status !== 'CANCELLED';
                  const isCurrent = idx === currentStepIdx;
                  return (
                    <button
                      key={step.key}
                      onClick={() => handleAction('transition', { targetStatus: step.key })}
                      title={`اضغط للانتقال المباشر إلى مرحلة: ${step.label}`}
                      className="flex flex-col items-center relative z-10 cursor-pointer group focus:outline-none"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/50 scale-110 shadow-lg'
                            : isCompleted
                            ? 'bg-green-500 text-white group-hover:scale-105'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-primary-200'
                        }`}
                      >
                        {isCompleted && !isCurrent ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={`text-[11px] font-medium mt-1 transition-all ${isCurrent ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-500'}`}>
                        {step.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-800 px-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
                  activeTab === 'details'
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                تفاصيل الطلب والمالية
              </button>
              <button
                onClick={() => setActiveTab('approvals')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'approvals'
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                سلسلة الموافقات
                {data.approvals?.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-[10px]">
                    {data.approvals.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
                  activeTab === 'history'
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                سجل التغييرات (Audit Trail)
              </button>
              <button
                onClick={() => setActiveTab('workflow')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'workflow'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                مسار التوظيف
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {activeTab === 'workflow' && (
                <div style={{ background: '#0f172a', borderRadius: '12px', padding: '16px' }}>
                  <WorkflowTimeline jobRequestId={data.id} canAdvance={true} />
                </div>
              )}
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1 & 2: Overview */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ملخص الاحتياج الوظيفي</h4>
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                        {data.jobSummary || 'لا يوجد ملخص مضاف.'}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">المهارات المطلوبة</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.skills?.length > 0 ? (
                          data.skills.map((s: any) => (
                            <span key={s.id} className="px-3 py-1 bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-lg">
                              {s.skillName}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">لم يتم تحديد مهارات.</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl">
                        <span className="text-xs text-gray-400 block">الخبرة المطلوبة</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{data.requiredExperience || 'غير محدد'}</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl">
                        <span className="text-xs text-gray-400 block">المؤهل العلمي</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{data.educationLevel || 'غير محدد'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Meta & Financials */}
                  <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-green-500" /> البيانات المالية والتوظيف
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-200/50 dark:border-gray-700/50">
                        <span className="text-gray-500">نطاق الراتب:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {data.salaryMin ? `${data.salaryMin} - ${data.salaryMax} SAR` : 'غير محدد'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-200/50 dark:border-gray-700/50">
                        <span className="text-gray-500">كود الميزانية:</span>
                        <span className="font-mono font-medium text-gray-900 dark:text-white">{data.budgetCode || 'غير مدخل'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-200/50 dark:border-gray-700/50">
                        <span className="text-gray-500">مركز التكلفة:</span>
                        <span className="font-mono font-medium text-gray-900 dark:text-white">{data.costCenter || 'غير مدخل'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-200/50 dark:border-gray-700/50">
                        <span className="text-gray-500">سبب الاحتياج:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{data.hiringReason}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500">مُنشئ الطلب:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{data.createdByUser?.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'approvals' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">مراحل الاعتماد والمسؤولين</h4>
                  {data.approvals?.map((app: any, idx: number) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            app.status === 'APPROVED'
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/40'
                              : app.status === 'REJECTED'
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/40'
                              : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40'
                          }`}
                        >
                          {app.status === 'APPROVED' ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : app.status === 'REJECTED' ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-gray-900 dark:text-white">
                            مرحلة #{idx + 1}: {app.approvalType}
                          </h5>
                          <p className="text-xs text-gray-500">المسؤول: {app.approver?.name || 'في انتظار الاعتماد'}</p>
                          {app.comment && <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-1">"{app.comment}"</p>}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          app.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : app.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">سجل الأنشطة وتغيير الحالات (Audit Log)</h4>
                  <div className="relative border-r-2 border-gray-200 dark:border-gray-700 mr-4 space-y-6">
                    {data.history?.map((hist: any) => (
                      <div key={hist.id} className="relative pr-6">
                        <div className="absolute -right-2 top-0.5 w-3.5 h-3.5 rounded-full bg-primary-500 ring-4 ring-white dark:ring-gray-900" />
                        <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-900 dark:text-white">{hist.action}</span>
                            <span className="text-gray-400">{new Date(hist.createdAt).toLocaleString('ar-SA')}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            بواسطة: <span className="font-medium">{hist.performer?.name}</span>
                          </p>
                          {hist.comment && <p className="text-xs text-gray-500 mt-1 bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">{hist.comment}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'workflow' && (
                <div className="space-y-4 pt-2">
                  <WorkflowTimeline jobRequestId={requestId!} canAdvance={true} />
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="إضافة ملاحظة أو سبب القرار..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                {data.status === 'DRAFT' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleAction('submit')}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> تقديم للمراجعة
                  </button>
                )}

                {['SUBMITTED', 'UNDER_REVIEW', 'PENDING_APPROVAL'].includes(data.status) && (
                  <>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAction('reject', { comment })}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl"
                    >
                      رفض الطلب
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAction('approve', { comment })}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" /> اعتماد الطلب
                    </button>
                  </>
                )}

                {/* Publish to Active Recruitment Jobs Page */}
                {['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'RECRUITMENT_STARTED'].includes(data.status) && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleAction('convert-to-job')}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all"
                    title="نشر الطلب وتحويله لوظيفة توظيف نشطة في قسم التوظيف الذكي"
                  >
                    <Send className="w-3.5 h-3.5" /> نشر الوظيفة في قسم التوظيف 🚀
                  </button>
                )}

                {data.status === 'ON_HOLD' ? (
                  <button
                    disabled={actionLoading}
                    onClick={handleUnfreeze}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Play className="w-4 h-4" /> فك التجميد واستئناف التوظيف ⚡
                  </button>
                ) : (
                  <button
                    disabled={actionLoading}
                    onClick={() => setShowFreezeModal(true)}
                    className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-xl flex items-center gap-1 border border-amber-500/30 transition-all"
                  >
                    <Snowflake className="w-3.5 h-3.5" /> تجميد التوظيف
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Freeze Request Confirmation Modal */}
      {showFreezeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Snowflake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">تجميد طلب التوظيف (Freeze Request)</h3>
                <p className="text-xs text-amber-600">تعليق التوظيف مؤقتاً لحين استيفاء الملاحظات</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">سبب التجميد (Freeze Reason) *</label>
                <select
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                >
                  <option value="BUDGET_PENDING">Budget Pending (الميزانية قيد الانتظار)</option>
                  <option value="MANAGEMENT_APPROVAL">Management Approval (موافقة الإدارة العليا)</option>
                  <option value="BUSINESS_CHANGE">Business Change (تغيير خطة العمل)</option>
                  <option value="OTHER">Other (أسباب أخرى)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ المتوقع للاستئناف (Resume Date)</label>
                <input
                  type="date"
                  value={resumeDate}
                  onChange={(e) => setResumeDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">سبب قرار التجميد / ملاحظات</label>
                <textarea
                  rows={2}
                  placeholder="اكتب ملاحظات إضافية عن سبب التجميد..."
                  value={freezeComment}
                  onChange={(e) => setFreezeComment(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowFreezeModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                إلغاء
              </button>
              <button
                disabled={actionLoading}
                onClick={handleFreeze}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20"
              >
                {actionLoading ? 'جاري التجميد...' : 'تأكيد تجميد التوظيف ❄️'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
