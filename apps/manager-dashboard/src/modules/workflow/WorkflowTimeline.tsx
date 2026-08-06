import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, AlertTriangle, XCircle, ChevronRight,
  MessageSquare, ArrowRight, Send, Loader2
} from 'lucide-react';
import { getWorkflowInstance, advanceWorkflowStep, rejectWorkflowStep, addWorkflowComment } from './workflow.service';

interface WorkflowTimelineProps {
  jobRequestId: string;
  canAdvance?: boolean;
}

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string; bg: string }> = {
  COMPLETED: { icon: CheckCircle2, color: '#10b981', label: 'مكتمل', bg: 'rgba(16,185,129,0.15)' },
  IN_PROGRESS: { icon: Clock, color: '#6366f1', label: 'جاري', bg: 'rgba(99,102,241,0.15)' },
  OVERDUE: { icon: AlertTriangle, color: '#ef4444', label: 'متأخر', bg: 'rgba(239,68,68,0.15)' },
  PENDING: { icon: ChevronRight, color: '#475569', label: 'قادم', bg: 'rgba(71,85,105,0.1)' },
  REJECTED: { icon: XCircle, color: '#ef4444', label: 'مرفوض', bg: 'rgba(239,68,68,0.15)' },
  SKIPPED: { icon: ChevronRight, color: '#64748b', label: 'متخطى', bg: 'rgba(100,116,139,0.1)' },
};

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ jobRequestId, canAdvance = true }) => {
  const [instance, setInstance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const loadInstance = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await getWorkflowInstance(jobRequestId);
      const data = res?.stepInstances ? res : (res?.data?.stepInstances ? res.data : res);
      setInstance(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (jobRequestId) loadInstance(); }, [jobRequestId]);

  const handleAdvance = async () => {
    try {
      setAdvancing(true);
      await advanceWorkflowStep(jobRequestId, { comment });
      setComment('');
      setShowComment(false);
      setActionMsg('تم الانتقال إلى المرحلة التالية ✅');
      await loadInstance();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdvancing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { setError('يرجى إدخال سبب الرفض'); return; }
    try {
      setAdvancing(true);
      await rejectWorkflowStep(jobRequestId, { reason: rejectReason });
      setRejectReason('');
      setShowReject(false);
      setActionMsg('تم رفض المرحلة وإغلاق المسار');
      await loadInstance();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdvancing(false);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await addWorkflowComment(jobRequestId, comment);
      setComment('');
      setActionMsg('تم إضافة التعليق ✅');
      setTimeout(() => setActionMsg(''), 2000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl text-red-400 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
        {error}
      </div>
    );
  }

  if (!instance) return null;

  const { stepInstances = [], progressPercent = 0, totalSteps = 0, completedSteps = 0, status, template } = instance;
  const currentStepInst = stepInstances.find((s: any) => s.stepOrder === instance.currentStep);
  const isCompleted = status === 'COMPLETED';
  const isCancelled = status === 'CANCELLED';

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-medium text-sm">مسار التوظيف</span>
          <span className="text-indigo-300 text-sm font-bold">{progressPercent}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: isCompleted ? '#10b981' : isCancelled ? '#ef4444' : 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{completedSteps} مرحلة مكتملة</span>
          <span>{totalSteps} مرحلة إجمالاً</span>
        </div>
      </div>

      {/* Action Messages */}
      <AnimatePresence>
        {actionMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl text-sm text-green-300"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            {actionMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline Steps */}
      <div className="relative">
        {stepInstances.map((step: any, i: number) => {
          const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.PENDING;
          const Icon = cfg.icon;
          const isLast = i === stepInstances.length - 1;
          const stepDef = template?.steps?.find((s: any) => s.id === step.stepId);

          return (
            <div key={step.id} className="flex gap-3 relative">
              {/* Connector line */}
              {!isLast && (
                <div className="absolute right-[18px] top-9 bottom-0 w-0.5"
                  style={{ background: step.status === 'COMPLETED' ? '#10b981' : 'rgba(255,255,255,0.08)' }} />
              )}

              {/* Step icon */}
              <div className="relative z-10 flex-shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: cfg.bg, border: `2px solid ${cfg.color}` }}>
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
              </div>

              {/* Step content */}
              <div className="flex-1 pb-5">
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-xl p-3"
                  style={{
                    background: step.status === 'IN_PROGRESS'
                      ? 'rgba(99,102,241,0.12)'
                      : step.status === 'OVERDUE'
                        ? 'rgba(239,68,68,0.08)'
                        : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${step.status === 'IN_PROGRESS' ? 'rgba(99,102,241,0.3)' : step.status === 'OVERDUE' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {stepDef?.nameAr || step.stepOrder + '. مرحلة'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {stepDef?.role && `المسؤول: ${stepDef.role}`}
                        {step.assignedTo && ` · ${step.assignedTo.name}`}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Timing info */}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {step.startedAt && (
                      <span>بدأ: {new Date(step.startedAt).toLocaleDateString('ar-SA')}</span>
                    )}
                    {step.dueAt && step.status !== 'COMPLETED' && (
                      <span style={{ color: step.status === 'OVERDUE' ? '#f87171' : '#94a3b8' }}>
                        SLA: {new Date(step.dueAt).toLocaleDateString('ar-SA')}
                      </span>
                    )}
                    {step.completedAt && (
                      <span className="text-green-400">اكتمل: {new Date(step.completedAt).toLocaleDateString('ar-SA')}</span>
                    )}
                    {step.actualDuration != null && (
                      <span>المدة الفعلية: {step.actualDuration}h</span>
                    )}
                    <span>SLA: {step.expectedDuration}h</span>
                  </div>

                  {/* SLA breach warning */}
                  {step.slaBreach && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                      <AlertTriangle className="w-3 h-3" />
                      تجاوز SLA المحدد
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions Panel — only for active instances */}
      {canAdvance && !isCompleted && !isCancelled && (
        <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <h4 className="text-white font-medium text-sm">إجراءات المرحلة الحالية</h4>

          {currentStepInst && (
            <div className="text-xs text-indigo-300 mb-3">
              المرحلة الحالية: <strong>{template?.steps?.find((s: any) => s.id === currentStepInst.stepId)?.nameAr || `المرحلة ${instance.currentStep}`}</strong>
            </div>
          )}

          {/* Comment input */}
          {showComment && (
            <div className="flex gap-2">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="أضف تعليقاً (اختياري)..."
                className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button onClick={handleComment} className="p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Reject reason */}
          {showReject && (
            <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <label className="text-xs text-red-400">سبب الرفض *</label>
              <input
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="أدخل سبب رفض هذه المرحلة..."
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(239,68,68,0.3)' }}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowReject(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white">إلغاء</button>
                <button
                  onClick={handleReject}
                  disabled={advancing}
                  className="px-3 py-1.5 rounded-lg text-xs text-white"
                  style={{ background: '#dc2626' }}
                >
                  {advancing ? '...' : 'تأكيد الرفض'}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleAdvance}
              disabled={advancing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {advancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              تقديم إلى المرحلة التالية
            </button>

            <button
              onClick={() => { setShowComment(!showComment); setShowReject(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <MessageSquare className="w-4 h-4" />
              تعليق
            </button>

            <button
              onClick={() => { setShowReject(!showReject); setShowComment(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <XCircle className="w-4 h-4" />
              رفض
            </button>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-green-300 font-semibold">تم اكتمال مسار التوظيف بنجاح 🎉</div>
        </div>
      )}

      {isCancelled && (
        <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <div className="text-red-300 font-semibold">تم إغلاق مسار التوظيف</div>
        </div>
      )}
    </div>
  );
};

export default WorkflowTimeline;
