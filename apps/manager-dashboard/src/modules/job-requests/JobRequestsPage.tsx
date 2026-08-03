import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FilePlus,
  Clock,
  AlertTriangle,
  Search,
  Briefcase,
  Layers,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { jobRequestService } from '@hr/services';
import { CreateJobRequestModal } from './CreateJobRequestModal';
import { JobRequestDetailsModal } from './JobRequestDetailsModal';

export const JobRequestsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchRequests();
  }, [selectedStatus]);

  const fetchStats = async () => {
    try {
      const res = await jobRequestService.getStats();
      setStats(res?.data || res);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const result = await jobRequestService.getJobRequests({
        status: selectedStatus || undefined,
        search: search || undefined,
        limit: 50
      });
      const list = Array.isArray(result) ? result : (result?.data || []);
      setRequests(list);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      DRAFT: { label: 'مسودة', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
      SUBMITTED: { label: 'مُقدّم', bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-600 dark:text-blue-400' },
      UNDER_REVIEW: { label: 'قيد المراجعة', bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-600 dark:text-indigo-400' },
      PENDING_APPROVAL: { label: 'في انتظار الاعتماد', bg: 'bg-yellow-50 dark:bg-yellow-950/50', text: 'text-yellow-600 dark:text-yellow-400' },
      APPROVED: { label: 'معتمد', bg: 'bg-green-50 dark:bg-green-950/50', text: 'text-green-600 dark:text-green-400' },
      RECRUITMENT_STARTED: { label: 'بدء التوظيف', bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-600 dark:text-teal-400' },
      INTERVIEW_PROCESS: { label: 'المقابلات', bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-600 dark:text-purple-400' },
      OFFER_STAGE: { label: 'عرض عمل', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-600 dark:text-emerald-400' },
      HIRED: { label: 'تم التعيين', bg: 'bg-emerald-100 dark:bg-emerald-900/60', text: 'text-emerald-700 dark:text-emerald-300' },
      CLOSED: { label: 'مغلق', bg: 'bg-gray-200 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' },
      REJECTED: { label: 'مرفوض', bg: 'bg-red-50 dark:bg-red-950/50', text: 'text-red-600 dark:text-red-400' }
    };
    const s = map[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-600' };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">نظام إدارة طلبات التوظيف (Job Requests)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            دورة رقمية احترافية لتقديم، متابعة، واعتماد الاحتياجات التوظيفية قبل النشر
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-500/20 transition flex items-center justify-center gap-2"
        >
          <FilePlus className="w-5 h-5" /> إنشاء طلب توظيف جديد
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">إجمالي طلبات التوظيف</span>
            <div className="p-2.5 bg-primary-50 dark:bg-primary-900/40 text-primary-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{stats?.totalRequests || 0}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">كل الطلبات المسجلة بالحساب</span>
        </motion.div>

        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">متوسط زمن الاعتماد</span>
            <div className="p-2.5 bg-green-50 dark:bg-green-900/40 text-green-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{stats?.avgApprovalTimeHours || 0} ساعة</p>
          <span className="text-[11px] text-green-500 mt-1 block">سرعة اتخاذ القرارات التوظيفية</span>
        </motion.div>

        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">الطلبات المتأخرة (&gt; 5 أيام)</span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-3">{stats?.overdueCount || 0}</p>
          <span className="text-[11px] text-amber-500 mt-1 block">تحتاج إلى تذكير المدراء</span>
        </motion.div>

        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">الوظائف المفتوحة الحالية</span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{stats?.openJobs || 0}</p>
          <span className="text-[11px] text-blue-500 mt-1 block">في مرحلة البحث والمقابلات</span>
        </motion.div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالمسمى أو رقم الطلب..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRequests()}
              className="w-full pr-9 pl-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
            />
          </div>
          <button
            onClick={fetchRequests}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold"
          >
            بحث
          </button>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedStatus('')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition ${
              selectedStatus === '' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setSelectedStatus('SUBMITTED')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition ${
              selectedStatus === 'SUBMITTED' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            المُقدّمة
          </button>
          <button
            onClick={() => setSelectedStatus('PENDING_APPROVAL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition ${
              selectedStatus === 'PENDING_APPROVAL' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            بانتظار الموافقة
          </button>
          <button
            onClick={() => setSelectedStatus('APPROVED')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition ${
              selectedStatus === 'APPROVED' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            المعتمدة
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">جاري تحميل طلبات التوظيف...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">لا توجد طلبات توظيف حالياً</h3>
            <p className="text-xs text-gray-400">قم بإنشاء طلب توظيف جديد لبدء الدورة الرقمية للاحتياجات التوظيفية.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50/70 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3.5 font-bold">معرف الطلب</th>
                  <th className="px-6 py-3.5 font-bold">المسمى الوظيفي</th>
                  <th className="px-6 py-3.5 font-bold">القسم</th>
                  <th className="px-6 py-3.5 font-bold">الشواغر</th>
                  <th className="px-6 py-3.5 font-bold">الأولوية</th>
                  <th className="px-6 py-3.5 font-bold">الحالة</th>
                  <th className="px-6 py-3.5 font-bold">تاريخ الطلب</th>
                  <th className="px-6 py-3.5 font-bold text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRequestId(r.id)}
                    className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 cursor-pointer transition"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-primary-600 dark:text-primary-400">{r.requestId}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{r.jobTitle}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{r.department?.name || 'غير محدد'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{r.vacancies}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          r.priority === 'URGENT'
                            ? 'bg-red-100 text-red-700'
                            : r.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(r.createdAt).toLocaleDateString('ar-SA')}</td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`هل أنت تأكد من رغبتك في حذف طلب التوظيف (${r.jobTitle})؟`)) {
                              try {
                                await jobRequestService.deleteJobRequest(r.id);
                                fetchStats();
                                fetchRequests();
                              } catch (err: any) {
                                alert(err?.response?.data?.error || err.message || 'حدث خطأ أثناء الحذف');
                              }
                            }
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                          title="حذف طلب التوظيف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequestId(r.id);
                          }}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/50 rounded-lg transition"
                          title="عرض التفاصيل"
                        >
                          <ChevronRight className="w-5 h-5 rotate-180" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateJobRequestModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchStats();
          fetchRequests();
        }}
      />

      <JobRequestDetailsModal
        requestId={selectedRequestId}
        isOpen={!!selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        onRefresh={() => {
          fetchStats();
          fetchRequests();
        }}
      />
    </div>
  );
};

export default JobRequestsPage;
