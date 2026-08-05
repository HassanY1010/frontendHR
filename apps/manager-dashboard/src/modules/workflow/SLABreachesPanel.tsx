import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, ArrowUpRight, RefreshCw, CheckCircle2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SLABreachesPanelProps {
  breaches: any[];
  loading: boolean;
  onRefresh: () => void;
}

const priorityColors: Record<string, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#6366f1'
};

const priorityLabels: Record<string, string> = {
  URGENT: 'عاجل',
  HIGH: 'مرتفع',
  MEDIUM: 'متوسط',
  LOW: 'منخفض'
};

const SLABreachesPanel: React.FC<SLABreachesPanelProps> = ({ breaches, loading, onRefresh }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
        ))}
      </div>
    );
  }

  if (breaches.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20 rounded-2xl"
        style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}
      >
        <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(16,185,129,0.15)' }}>
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-green-400 mb-2">لا توجد خروقات SLA</h3>
        <p className="text-gray-400">جميع مراحل التوظيف تسير ضمن الأوقات المحددة 🎉</p>
        <button
          onClick={onRefresh}
          className="mt-6 flex items-center gap-2 px-4 py-2 rounded-xl text-sm mx-auto"
          style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </motion.div>
    );
  }

  // Sort by hoursOverdue descending
  const sorted = [...breaches].sort((a, b) => (b.hoursOverdue || 0) - (a.hoursOverdue || 0));

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.2)' }}>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="text-red-300 font-semibold">{breaches.length} خرق SLA نشط</div>
            <div className="text-red-400 text-sm">تحتاج إلى معالجة فورية</div>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all"
          style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          تحديث
        </button>
      </div>

      {/* Breach Cards */}
      <div className="space-y-3">
        {sorted.map((breach, i) => {
          const priority = breach.priority || 'MEDIUM';
          const pColor = priorityColors[priority] || '#6366f1';
          const hoursOver = breach.hoursOverdue || 0;
          const severity = hoursOver > 72 ? 'critical' : hoursOver > 24 ? 'high' : 'medium';

          return (
            <motion.div
              key={breach.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: severity === 'critical'
                  ? 'rgba(239,68,68,0.12)'
                  : severity === 'high'
                    ? 'rgba(249,115,22,0.08)'
                    : 'rgba(234,179,8,0.08)',
                border: `1px solid ${severity === 'critical' ? 'rgba(239,68,68,0.35)' : severity === 'high' ? 'rgba(249,115,22,0.3)' : 'rgba(234,179,8,0.25)'}`
              }}
            >
              {/* Severity indicator */}
              <div className="absolute top-0 right-0 w-1 h-full rounded-l"
                style={{ background: severity === 'critical' ? '#ef4444' : severity === 'high' ? '#f97316' : '#eab308' }} />

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Step Badge */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={{
                      background: severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)',
                      color: severity === 'critical' ? '#f87171' : '#fb923c'
                    }}>
                    {breach.stepOrder}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">{breach.stepName}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: `${pColor}22`, color: pColor }}>
                        {priorityLabels[priority]}
                      </span>
                      {breach.escalated && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                          style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                          <Zap className="w-2.5 h-2.5" />
                          مُصعَّد
                        </span>
                      )}
                    </div>

                    <div className="mt-1">
                      <span className="text-gray-300 text-sm font-medium">{breach.jobTitle}</span>
                      <span className="text-gray-500 text-xs mr-2">· {breach.requestId}</span>
                    </div>

                    {breach.assignedTo && (
                      <div className="text-gray-500 text-xs mt-1">
                        مُسند إلى: <span className="text-gray-300">{breach.assignedTo.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {/* Hours overdue */}
                  <div className="text-right">
                    <div className="text-lg font-bold"
                      style={{ color: severity === 'critical' ? '#f87171' : severity === 'high' ? '#fb923c' : '#fbbf24' }}>
                      +{hoursOver}h
                    </div>
                    <div className="text-xs text-gray-500">تأخير</div>
                  </div>
                  {/* SLA expected */}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    SLA: {breach.expectedHours}h
                  </div>
                  {/* Navigate to job request */}
                  {breach.jobRequestId && (
                    <button
                      onClick={() => navigate('/job-requests')}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      عرض
                    </button>
                  )}
                </div>
              </div>

              {/* Due date */}
              {breach.dueAt && (
                <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-gray-500"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <Clock className="w-3 h-3" />
                  كان يجب الانتهاء في: {new Date(breach.dueAt).toLocaleString('ar-SA')}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SLABreachesPanel;
