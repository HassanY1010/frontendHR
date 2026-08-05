import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle2, GitBranch, Zap, BarChart3, Target } from 'lucide-react';

interface WorkflowDashboardProps {
  data: any;
  loading: boolean;
  onRefresh: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string; icon: any; color: string; trend?: string }> =
  ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: 'rgba(30,27,75,0.6)', border: `1px solid ${color}33`, backdropFilter: 'blur(10px)' }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-3xl"
        style={{ background: color, transform: 'translate(30%, -30%)' }} />
      <div className="flex items-start justify-between relative">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <span className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ background: color + '22', color }}>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-3xl font-bold text-white">{value}</div>
        <div className="text-sm font-medium mt-1" style={{ color }}>{title}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
      </div>
    </motion.div>
  );

const ProgressBar: React.FC<{ label: string; value: number; max: number; color: string; slaHours: number; breaches: number }> =
  ({ label, value, max, color, slaHours, breaches }) => {
    const pct = max > 0 ? Math.min(100, Math.round((value / slaHours) * 100)) : 0;
    const isOver = value > slaHours;
    return (
      <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300 font-medium">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: isOver ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: isOver ? '#f87171' : '#34d399' }}>
              {value}h متوسط
            </span>
            {breaches > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                {breaches} خرق
              </span>
            )}
          </div>
        </div>
        <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, pct)}%`, background: isOver ? '#ef4444' : color }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">0h</span>
          <span className="text-xs text-gray-500">SLA: {slaHours}h</span>
        </div>
      </div>
    );
  };

const DEFAULT_STEPS = [
  { name: 'إنشاء طلب التوظيف', slaHours: 24 },
  { name: 'مراجعة HR', slaHours: 48 },
  { name: 'الموافقة الإدارية', slaHours: 72 },
  { name: 'البحث عن المرشحين', slaHours: 168 },
  { name: 'عملية المقابلات', slaHours: 240 },
  { name: 'مرحلة العرض', slaHours: 72 },
  { name: 'اكتمال التعيين', slaHours: 24 },
];

const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
        ))}
      </div>
    );
  }

  if (!data) return (
    <div className="text-center py-20 text-gray-400">
      <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-20" />
      <p>لا توجد بيانات متاحة حتى الآن</p>
      <p className="text-sm mt-2 text-gray-500">قم بإنشاء طلبات توظيف أولاً لرؤية إحصاءات الـ Workflow</p>
    </div>
  );

  const { kpis = {}, stepSummary = [], recentBreaches = [], bottleneck } = data;

  const stepSummaryWithSLA = DEFAULT_STEPS.map((defStep) => {
    const found = stepSummary.find((s: any) => s.name === defStep.name);
    return {
      name: defStep.name,
      avgHours: found?.avgHours || 0,
      breaches: found?.breaches || 0,
      total: found?.total || 0,
      slaHours: defStep.slaHours
    };
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي المسارات" value={kpis.totalInstances || 0} icon={GitBranch} color="#6366f1" subtitle="مسار توظيف" />
        <StatCard title="نشط حالياً" value={kpis.activeInstances || 0} icon={Clock} color="#10b981"
          trend={kpis.activeInstances > 0 ? 'قيد التنفيذ' : undefined} />
        <StatCard title="نسبة الإنجاز" value={`${kpis.completionRate || 0}%`} icon={CheckCircle2} color="#3b82f6"
          subtitle={`${kpis.completedInstances || 0} مكتمل`} />
        <StatCard title="خروقات SLA" value={kpis.slaBreachCount || 0} icon={AlertTriangle} color="#ef4444"
          trend={kpis.slaBreachCount > 0 ? '⚠️ تحتاج إجراء' : '✅ لا خروقات'} />
      </div>

      {/* Bottleneck Alert */}
      {bottleneck && bottleneck.breaches > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl flex items-start gap-4"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.2)' }}>
            <Zap className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="text-red-300 font-semibold">🔴 اختناق في المسار</div>
            <div className="text-red-400 text-sm mt-1">
              المرحلة <strong>"{bottleneck.name}"</strong> تُسبب أكبر تأخير مع <strong>{bottleneck.breaches} خرق SLA</strong>.
              متوسط وقتها <strong>{bottleneck.avgHours} ساعة</strong>.
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step Performance */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(30,27,75,0.6)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white font-semibold">أداء كل مرحلة مقارنة بـ SLA</h3>
          </div>
          <div className="space-y-3">
            {stepSummaryWithSLA.map((step, i) => (
              <ProgressBar
                key={i}
                label={step.name}
                value={step.avgHours}
                max={step.slaHours * 2}
                slaHours={step.slaHours}
                color="#6366f1"
                breaches={step.breaches}
              />
            ))}
          </div>
        </div>

        {/* Recent SLA Breaches */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(30,27,75,0.6)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-white font-semibold">آخر خروقات SLA</h3>
          </div>
          {recentBreaches.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
              <p>لا توجد خروقات SLA 🎉</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentBreaches.map((b: any, i: number) => (
                <div key={i} className="p-3 rounded-xl flex items-start gap-3"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.2)' }}>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{b.step?.nameAr || b.step?.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {b.instance?.jobRequest?.jobTitle} · {b.instance?.jobRequest?.requestId}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                    متأخر
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SLA Reference Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
        <div className="p-4 flex items-center gap-2" style={{ background: 'rgba(99,102,241,0.1)', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
          <Target className="w-5 h-5 text-indigo-400" />
          <h3 className="text-white font-semibold">جدول SLA المرجعي</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['#', 'المرحلة', 'المسؤول', 'SLA المحدد', 'متوسط الأداء', 'الخروقات'].map((h) => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { step: 'إنشاء طلب التوظيف', role: 'Hiring Manager', sla: '24 ساعة' },
                { step: 'مراجعة HR', role: 'HR Manager', sla: '48 ساعة' },
                { step: 'الموافقة الإدارية', role: 'Management', sla: '72 ساعة' },
                { step: 'البحث عن المرشحين', role: 'Recruiter', sla: '7 أيام' },
                { step: 'عملية المقابلات', role: 'Recruiter / HR', sla: '10 أيام' },
                { step: 'مرحلة العرض', role: 'HR Manager', sla: '72 ساعة' },
                { step: 'اكتمال التعيين', role: 'HR Manager', sla: '24 ساعة' },
              ].map((row, i) => {
                const stat = stepSummaryWithSLA[i];
                const isOver = stat?.avgHours > 0 && stat?.slaHours && stat.avgHours > stat.slaHours;
                return (
                  <tr key={i} className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <td className="px-4 py-3 text-indigo-400 font-bold">{i + 1}</td>
                    <td className="px-4 py-3 text-gray-200 font-medium">{row.step}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{row.role}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-medium"
                        style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                        {row.sla}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {stat?.avgHours > 0 ? (
                        <span className="text-sm font-medium" style={{ color: isOver ? '#f87171' : '#34d399' }}>
                          {stat.avgHours}h {isOver ? '⚠️' : '✅'}
                        </span>
                      ) : <span className="text-gray-600 text-xs">لا بيانات</span>}
                    </td>
                    <td className="px-4 py-3">
                      {stat?.breaches > 0 ? (
                        <span className="px-2 py-1 rounded-full text-xs font-bold"
                          style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                          {stat.breaches}
                        </span>
                      ) : <span className="text-green-500 text-xs">✅ لا خروقات</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDashboard;
