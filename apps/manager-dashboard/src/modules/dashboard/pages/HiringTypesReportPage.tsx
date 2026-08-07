import React, { useState, useEffect } from 'react';
import {
  PieChart, Zap, Calendar, Snowflake, ShieldAlert, CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { hiringPlanService } from '@hr/services';

export const HiringTypesReportPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hiringPlanService.getHiringTypesReport();
      const data = res?.data?.data || res?.data || res;
      setReportData(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'فشل في تحميل تقرير أنواع التوظيف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const summary = reportData?.summary || {
    immediateJobsCount: 0,
    urgentImmediateJobsCount: 0,
    totalPlannedPositions: 0,
    totalFulfilledPositions: 0,
    plannedFulfillmentRate: 0,
    onHoldJobsCount: 0
  };

  const freezeReasonDistribution = reportData?.freezeReasonDistribution || [];
  const onHoldJobs = reportData?.onHoldJobs || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              تقارير وإحصائيات أنواع التوظيف الثلاثة (Hiring Types Reports)
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              تحليل التوظيف الفوري العاجل، خطة التوظيف السنوية، والوظائف المجمدة مع أسباب التجميد
            </p>
          </div>
        </div>

        <button
          onClick={loadReport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-white text-xs font-bold rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-2xl text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Immediate Jobs */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-red-600 dark:text-red-400">{summary.urgentImmediateJobsCount}</div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">وظائف التوظيف الفوري (Urgent)</div>
            <div className="text-[11px] text-gray-500">إجمالي الطلبات الفورية: {summary.immediateJobsCount}</div>
          </div>
        </div>

        {/* Planned Jobs */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{summary.totalPlannedPositions}</div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">وظائف الخطة السنوية (2027)</div>
            <div className="text-[11px] text-gray-500">معدل الإنجاز: {summary.plannedFulfillmentRate}%</div>
          </div>
        </div>

        {/* On Hold Jobs */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Snowflake className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{summary.onHoldJobsCount}</div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">الوظائف المجمدة (On Hold)</div>
            <div className="text-[11px] text-gray-500">تنتظر الموافقة أو الميزانية</div>
          </div>
        </div>

        {/* Planned Fulfillment */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{summary.totalFulfilledPositions}</div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">الوظائف المحققة بالكامل</div>
            <div className="text-[11px] text-gray-500">من إجمالي خطة القوى العاملة</div>
          </div>
        </div>
      </div>

      {/* Freeze Reason Distribution Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Snowflake className="w-4 h-4 text-amber-500" /> تحليل أسباب التجميد للوظائف المعلقة (Freeze Reason Breakdown)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {freezeReasonDistribution.map((item: any, i: number) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
              <div className="text-xs font-bold text-gray-900 dark:text-white">{item.labelName}</div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{item.count} طلب</span>
                <span className="text-xs font-bold text-gray-500">{item.percentage}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${item.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* On Hold Jobs Detailed Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Snowflake className="w-4 h-4 text-amber-500" /> قائمة الطلبات المجمدة حالياً (On Hold Requests)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="p-3.5">رقم الطلب (ID)</th>
                <th className="p-3.5">الوظيفة (Title)</th>
                <th className="p-3.5">القسم (Department)</th>
                <th className="p-3.5">سبب التجميد (Freeze Reason)</th>
                <th className="p-3.5">تاريخ التجميد (Frozen Date)</th>
                <th className="p-3.5">تاريخ الاستئناف المتوقع (Resume Date)</th>
                <th className="p-3.5">المسؤول (Owner)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {onHoldJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    لا توجد طلبات توظيف مجمدة في الوقت الحالي ✨
                  </td>
                </tr>
              ) : (
                onHoldJobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                    <td className="p-3.5 font-bold text-gray-900 dark:text-white">{job.requestId}</td>
                    <td className="p-3.5 font-semibold text-gray-800 dark:text-gray-200">{job.jobTitle}</td>
                    <td className="p-3.5 text-gray-600 dark:text-gray-400">{job.departmentName || 'عام'}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold rounded-full text-[10px]">
                        {job.freezeReason === 'BUDGET_PENDING' ? 'الميزانية قيد الانتظار' :
                         job.freezeReason === 'MANAGEMENT_APPROVAL' ? 'موافقة الإدارة' :
                         job.freezeReason === 'BUSINESS_CHANGE' ? 'تغيير الخطة' : 'أخرى'}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-600 dark:text-gray-400">
                      {job.frozenDate ? new Date(job.frozenDate).toLocaleDateString('ar-SA') : '-'}
                    </td>
                    <td className="p-3.5 font-semibold text-purple-600 dark:text-purple-400">
                      {job.resumeDate ? new Date(job.resumeDate).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </td>
                    <td className="p-3.5 text-gray-700 dark:text-gray-300 font-medium">
                      {job.ownerName || 'مدير التوظيف'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HiringTypesReportPage;
