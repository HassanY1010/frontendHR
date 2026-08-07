import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, TrendingUp, Users, DollarSign, CheckCircle2,
  Building2, Briefcase, RefreshCw, AlertCircle, Edit, Trash2
} from 'lucide-react';
import { hiringPlanService, HiringPlanData } from '@hr/services';

export const ManpowerPlanPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2027);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<HiringPlanData>({
    year: 2027,
    departmentId: 'dep-tech',
    position: '',
    quantity: 1,
    fulfilledCount: 0,
    expectedDate: '',
    budget: 0,
    notes: '',
    status: 'PLANNED'
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hiringPlanService.getManpowerDashboard(selectedYear);
      const data = res?.data?.data || res?.data || res;
      setDashboardData(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'فشل في تحميل خطة القوى العاملة السنوية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [selectedYear]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      year: selectedYear,
      departmentId: 'dep-tech',
      position: '',
      quantity: 1,
      fulfilledCount: 0,
      expectedDate: new Date(selectedYear, 5, 1).toISOString().slice(0, 10),
      budget: 150000,
      notes: '',
      status: 'PLANNED'
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: any) => {
    setEditingId(plan.id);
    setFormData({
      year: plan.year,
      departmentId: plan.departmentId,
      position: plan.position,
      quantity: plan.quantity,
      fulfilledCount: plan.fulfilledCount || 0,
      expectedDate: plan.expectedDate ? new Date(plan.expectedDate).toISOString().slice(0, 10) : '',
      budget: plan.budget || 0,
      notes: plan.notes || '',
      status: plan.status || 'PLANNED'
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.position.trim()) {
      setModalError('يرجى كتابة المسمى الوظيفي المطلوب في الخطة');
      return;
    }

    try {
      setModalLoading(true);
      setModalError(null);

      if (editingId) {
        await hiringPlanService.updateHiringPlan(editingId, formData);
      } else {
        await hiringPlanService.createHiringPlan(formData);
      }

      setIsModalOpen(false);
      await loadDashboard();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err.message || 'فشل حفظ بند الخطة');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('هل أنت تأكد من رغبتك في حذف هذا البند من الخطة؟')) return;
    try {
      await hiringPlanService.deleteHiringPlan(id);
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || 'فشل حذف البند');
    }
  };

  const kpis = dashboardData?.kpis || {
    totalPlannedPositions: 0,
    totalFulfilledPositions: 0,
    remainingPositions: 0,
    fulfillmentRate: 0,
    totalAllocatedBudget: 0,
    totalPlanItems: 0
  };

  const departmentBreakdown = dashboardData?.departmentBreakdown || [];
  const plans = dashboardData?.plans || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-600 flex items-center justify-center border border-purple-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              خطة القوى العاملة والتوظيف السنوية (Manpower Force Plan)
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              التخطيط التقديري الاحترافي للوظائف والميزانيات لعام {selectedYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-800 dark:text-white"
          >
            <option value={2026}>عام 2026</option>
            <option value={2027}>عام 2027 (الخطة القادمة)</option>
            <option value={2028}>عام 2028</option>
          </select>

          <button
            onClick={loadDashboard}
            className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-gray-700 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> إضافة بند للخطة السنوية
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{kpis.totalPlannedPositions}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">إجمالي الوظائف المخططة ({selectedYear})</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{kpis.totalFulfilledPositions}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">الوظائف المحققة والمنجزة</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{kpis.fulfillmentRate}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">نسبة إنجاز الخطة السنوية</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-gray-900 dark:text-white">
              {kpis.totalAllocatedBudget.toLocaleString('ar-SA')} <span className="text-xs font-normal">ر.س</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">الميزانية المخصصة للخطة</div>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      {departmentBreakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" /> توزيع الخطة حسب الأقسام (Department Force Allocation)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {departmentBreakdown.map((dept: any, i: number) => {
              const rate = dept.planned > 0 ? Math.round((dept.fulfilled / dept.planned) * 100) : 0;
              return (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                    <span>{dept.name}</span>
                    <span className="text-purple-600">{dept.fulfilled} / {dept.planned} وظيفة</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${Math.min(100, rate)}%` }} />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-gray-500 dark:text-gray-400">
                    <span>الميزانية: {dept.budget.toLocaleString('ar-SA')} ر.س</span>
                    <span className="font-semibold">{rate}% محقق</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manpower Force Plan Items Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-600" /> بنود خطة القوى العاملة لعام {selectedYear} ({plans.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="p-3.5">الوظيفة (Position)</th>
                <th className="p-3.5">القسم (Department)</th>
                <th className="p-3.5 text-center">العدد المطلوب (Quantity)</th>
                <th className="p-3.5 text-center">المنجز (Fulfilled)</th>
                <th className="p-3.5">التاريخ المتوقع (Expected Date)</th>
                <th className="p-3.5">الميزانية (Budget)</th>
                <th className="p-3.5 text-center">الحالة (Status)</th>
                <th className="p-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    لا توجد بنود مضافة لخطة التوظيف السنوية لعام {selectedYear} بعد. اضغط على "إضافة بند للخطة السنوية" للبدء!
                  </td>
                </tr>
              ) : (
                plans.map((plan: any) => (
                  <tr key={plan.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all">
                    <td className="p-3.5 font-bold text-gray-900 dark:text-white">{plan.position}</td>
                    <td className="p-3.5 text-gray-600 dark:text-gray-300">{plan.department?.name || 'غير محدد'}</td>
                    <td className="p-3.5 text-center font-bold text-purple-600 dark:text-purple-400">{plan.quantity}</td>
                    <td className="p-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400">{plan.fulfilledCount}</td>
                    <td className="p-3.5 text-gray-600 dark:text-gray-300">
                      {plan.expectedDate ? new Date(plan.expectedDate).toLocaleDateString('ar-SA') : '-'}
                    </td>
                    <td className="p-3.5 font-semibold text-gray-800 dark:text-gray-200">
                      {plan.budget ? plan.budget.toLocaleString('ar-SA') + ' ر.س' : '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        plan.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                        plan.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                      }`}>
                        {plan.status === 'FULFILLED' ? 'مكتمل' : plan.status === 'IN_PROGRESS' ? 'قيد التوظيف' : 'مخطط'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(plan)}
                        className="p-1.5 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="تعديل البند"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="حذف البند"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Plan Item Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl space-y-4 border border-gray-100 dark:border-gray-700"
            >
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                {editingId ? 'تعديل بند خطة التوظيف' : 'إضافة بند جديد لخطة التوظيف السنوية'}
              </h3>

              {modalError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitPlan} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">سنة الخطة (Year)</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">القسم (Department) *</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl"
                    >
                      <option value="dep-tech">تكنولوجيا المعلومات والبرمجيات</option>
                      <option value="dep-hr">الموارد البشرية</option>
                      <option value="dep-finance">الإدارة المالية</option>
                      <option value="dep-marketing">التسويق والمبيعات</option>
                      <option value="dep-operations">العمليات والتشغيل</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">المسمى الوظيفي (Position Title) *</label>
                  <input
                    type="text"
                    placeholder="مثال: Backend Developer x10"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">العدد المطلوب (Quantity) *</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">الميزانية المخصصة (Budget SAR)</label>
                    <input
                      type="number"
                      placeholder="150000"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ المتوقع للبدء (Expected Date)</label>
                    <input
                      type="date"
                      value={formData.expectedDate}
                      onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">حالة البند (Status)</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl"
                    >
                      <option value="PLANNED">مخطط (Planned)</option>
                      <option value="IN_PROGRESS">قيد التوظيف (In Progress)</option>
                      <option value="FULFILLED">مكتمل المكتسبات (Fulfilled)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20"
                  >
                    {modalLoading ? 'جاري الحفظ...' : 'حفظ البند في الخطة السنوية ✨'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManpowerPlanPage;
