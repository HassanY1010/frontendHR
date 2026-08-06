import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch, LayoutDashboard, Settings, AlertTriangle,
  Clock, CheckCircle2, XCircle, RefreshCw, Trash2, ShieldAlert
} from 'lucide-react';
import WorkflowDashboard from './WorkflowDashboard';
import WorkflowBuilder from './WorkflowBuilder';
import SLABreachesPanel from './SLABreachesPanel';
import { getWorkflowDashboard, getSLABreaches, resetTestData } from './workflow.service';

type Tab = 'dashboard' | 'builder' | 'sla';

const WorkflowPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [breachesData, setBreachesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset Modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmCode, setResetConfirmCode] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [resetErrorMessage, setResetErrorMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, breachesRes]: [any, any] = await Promise.all([
        getWorkflowDashboard(),
        getSLABreaches()
      ]);

      const dash = dashRes?.kpis ? dashRes : (dashRes?.data?.kpis ? dashRes.data : dashRes);
      const breaches = Array.isArray(breachesRes)
        ? breachesRes
        : (Array.isArray(breachesRes?.data) ? breachesRes.data : (breachesRes?.recentBreaches || []));

      setDashboardData(dash);
      setBreachesData(breaches);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleResetTestData = async () => {
    if (resetConfirmCode !== 'RESET') return;
    try {
      setResetLoading(true);
      setResetErrorMessage('');
      setResetSuccessMessage('');
      const res = await resetTestData('RESET');
      setResetSuccessMessage(res.message || 'تم تنظيف بيانات الاختبار وإعادة الضبط بنجاح ✨');
      await loadData();
      setTimeout(() => {
        setShowResetModal(false);
        setResetConfirmCode('');
        setResetSuccessMessage('');
      }, 1800);
    } catch (err: any) {
      setResetErrorMessage(err.message || 'فشل في تنظيف بيانات الاختبار');
    } finally {
      setResetLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard' as Tab, label: 'لوحة التحكم', icon: LayoutDashboard, color: 'blue' },
    { id: 'builder' as Tab, label: 'منشئ القوالب', icon: Settings, color: 'purple' },
    { id: 'sla' as Tab, label: `خروقات SLA ${breachesData.length > 0 ? `(${breachesData.length})` : ''}`, icon: AlertTriangle, color: 'red' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary, #0f172a)' }} dir="rtl">
      {/* Header */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
        borderBottom: '1px solid rgba(99,102,241,0.3)'
      }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full filter blur-3xl" style={{ background: '#6366f1', transform: 'translate(30%, -50%)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full filter blur-3xl" style={{ background: '#8b5cf6', transform: 'translate(-30%, 50%)' }} />
        </div>
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}>
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">محرك إجراءات التوظيف</h1>
                <p className="text-indigo-300 text-sm">Recruitment Workflow Engine + SLA Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-red-500/30"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                title="تنظيف بيانات الاختبار وإعادة ضبط المسارات"
              >
                <Trash2 className="w-3.5 h-3.5" />
                تنظيف بيانات الاختبار
              </button>

              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </button>
            </div>
          </div>

          {/* KPI Mini Cards */}
          {dashboardData && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'إجمالي المسارات', value: dashboardData.kpis?.totalInstances || 0, icon: GitBranch, color: '#6366f1' },
                { label: 'نشط حالياً', value: dashboardData.kpis?.activeInstances || 0, icon: Clock, color: '#10b981' },
                { label: 'مكتمل', value: dashboardData.kpis?.completedInstances || 0, icon: CheckCircle2, color: '#3b82f6' },
                { label: 'خروقات SLA', value: dashboardData.kpis?.slaBreachCount || 0, icon: AlertTriangle, color: '#ef4444' },
              ].map((kpi, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${kpi.color}22`, border: `1px solid ${kpi.color}44` }}>
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{kpi.value}</div>
                    <div className="text-indigo-300 text-xs">{kpi.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-xl transition-all relative"
              style={activeTab === tab.id
                ? { background: 'rgba(15,23,42,0.9)', color: '#6366f1', borderTop: '2px solid #6366f1' }
                : { color: '#a5b4fc', background: 'transparent' }
              }
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'sla' && breachesData.length > 0 && (
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full text-xs text-white flex items-center justify-center"
                  style={{ background: '#ef4444', fontSize: '10px' }}>
                  {breachesData.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3 text-red-400"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkflowDashboard data={dashboardData} loading={loading} onRefresh={loadData} />
            </motion.div>
          )}
          {activeTab === 'builder' && (
            <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkflowBuilder onSaved={loadData} />
            </motion.div>
          )}
          {activeTab === 'sla' && (
            <motion.div key="sla" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SLABreachesPanel breaches={breachesData} loading={loading} onRefresh={loadData} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reset Test Data Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gray-900 border border-red-500/30 rounded-2xl p-6 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-400">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0 border border-red-500/40">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">تنظيف بيانات الاختبار وإعادة الضبط</h3>
                  <p className="text-xs text-red-300">أداة أمان تنظيف البيانات للمدير</p>
                </div>
              </div>

              <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-3 text-xs text-red-200 space-y-1">
                <p className="font-semibold text-red-400">⚠️ ماذا سينتج عن هذه العملية؟</p>
                <p>• سيتم مسح وتنظيف الطلبات والمسارات الاختبارية القديمة لشركتك.</p>
                <p>• سيتم إعادة ضبط الإحصائيات والمؤشرات من البداية لبيئة نظيفة.</p>
              </div>

              {resetSuccessMessage && (
                <div className="p-3 bg-green-500/20 border border-green-500/40 rounded-xl text-green-300 text-xs font-semibold">
                  {resetSuccessMessage}
                </div>
              )}

              {resetErrorMessage && (
                <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs font-semibold">
                  {resetErrorMessage}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs text-gray-300 font-medium block">
                  للتأكيد وإتمام العملية، يرجى كتابة كلمة <strong className="text-red-400 font-bold">RESET</strong> أدناه:
                </label>
                <input
                  type="text"
                  placeholder="اكتب RESET هنا..."
                  value={resetConfirmCode}
                  onChange={(e) => setResetConfirmCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => { setShowResetModal(false); setResetConfirmCode(''); setResetErrorMessage(''); setResetSuccessMessage(''); }}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-all"
                >
                  إلغاء
                </button>

                <button
                  disabled={resetConfirmCode !== 'RESET' || resetLoading}
                  onClick={handleResetTestData}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-lg shadow-red-900/30"
                >
                  {resetLoading ? 'جاري التنظيف...' : 'تأكيد تنظيف بيانات الاختبار 🧹'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkflowPage;
