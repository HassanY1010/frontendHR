// apps/owner-dashboard/src/modules/companies/pages/CompanyDetailPage.tsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2, Users, ShieldAlert, ArrowRight, Mail, Phone,
    MapPin, Globe, Calendar, CreditCard, UserCheck, UserX, RefreshCw, AlertTriangle, CheckCircle2, MoreVertical
} from 'lucide-react'
import { useCompaniesStore } from '../store'
import { userService } from '@hr/services'
import { Card, CardContent, Button, Badge, LoadingCard, Modal } from '@hr/ui'
import { toast } from 'sonner'
import type { Company } from '../types'
import type { User } from '@hr/types'

const CompanyDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { companies, refreshCompanies, forceLogout, updateCompany } = useCompaniesStore()

    const [company, setCompany] = useState<Company | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [showConfirmLogout, setShowConfirmLogout] = useState(false)
    const [showConfirmStatus, setShowConfirmStatus] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return

            try {
                setLoading(true)
                // Ensure companies are loaded in store
                if (companies.length === 0) {
                    await refreshCompanies()
                }

                const found = useCompaniesStore.getState().companies.find(c => c.id === id)
                if (found) {
                    setCompany(found)
                }

                const usersRes = await userService.getUsersByCompany(id)
                setUsers(usersRes.data.users)
            } catch (error) {
                toast.error('فشل في تحميل بيانات الشركة')
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id, companies.length, refreshCompanies])

    const handleToggleAccess = async () => {
        if (!company) return
        const isCurrentlyActive = company.status === 'active'
        const newStatus = isCurrentlyActive ? 'inactive' : 'active'

        setIsLoggingOut(true)
        try {
            // 1. Update status
            await updateCompany(company.id, { status: newStatus })
            setCompany(prev => prev ? { ...prev, status: newStatus } : null)

            // 2. If blocking (active -> inactive), also force logout
            if (isCurrentlyActive) {
                await forceLogout(company.id)
                toast.success('تم حظر الوصول وتسجيل خروج جميع المستخدمين')
            } else {
                toast.success('تم إعادة تفعيل وصول المستخدمين بنجاح')
            }

            setShowConfirmLogout(false)
        } catch (error) {
            toast.error('فشل في تحديث صلاحيات الوصول')
            console.error(error)
        } finally {
            setIsLoggingOut(false)
        }
    }

    const handleToggleStatus = async () => {
        if (!company) return
        const newStatus = company.status === 'active' ? 'inactive' : 'active'
        try {
            await updateCompany(company.id, { status: newStatus })
            setCompany(prev => prev ? { ...prev, status: newStatus } : null)
            toast.success(newStatus === 'active' ? 'تم تفعيل الشركة' : 'تم تعليق الشركة')
            setShowConfirmStatus(false)
        } catch (error) {
            toast.error('فشل في تحديث حالة الشركة')
        }
    }

    if (loading) return <LoadingCard title="جاري تحميل بيانات الشركة..." />

    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-neutral-300">
                <Building2 className="w-16 h-16 text-neutral-400 mb-4" />
                <h2 className="text-xl font-bold text-neutral-900 mb-2">الشركة غير موجودة</h2>
                <Button onClick={() => navigate('/companies')} variant="outline">
                    العودة لقائمة الشركات
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/companies')}
                        className="p-2 h-auto"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-500/20">
                            {company.logo ? <img src={company.logo} alt={company.name} className="w-full h-full object-cover rounded-2xl" /> : company.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">{company.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant={company.status === 'active' ? 'success' : 'danger'} className="px-3 py-0.5 rounded-full font-bold">
                                    {company.status === 'active' ? 'نشطة' : 'معلقة'}
                                </Badge>
                                <span className="text-neutral-500 text-sm flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {company.domain}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant={company.status === 'active' ? 'danger' : 'success'}
                        className="gap-2 font-bold px-6 shadow-lg"
                        onClick={() => setShowConfirmLogout(true)}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : company.status === 'active' ? (
                            <ShieldAlert className="w-4 h-4" />
                        ) : (
                            <UserCheck className="w-4 h-4" />
                        )}
                        {company.status === 'active' ? 'إخراج وحظر الجميع' : 'تفعيل وصول الجميع'}
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 font-bold border-2"
                        onClick={() => setShowConfirmStatus(true)}
                    >
                        {company.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        {company.status === 'active' ? 'تعليق فقط' : 'تنشيط فقط'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Company Info Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="overflow-hidden border-none shadow-xl bg-white/80 backdrop-blur-xl">
                        <div className="h-2 bg-gradient-to-r from-primary-500 to-secondary-500" />
                        <CardContent className="p-6">
                            <h3 className="font-bold text-neutral-900 mb-6 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary-500" />
                                معلومات المنشأة
                            </h3>

                            <div className="space-y-4">
                                <InfoRow icon={Mail} label="البريد الإلكتروني" value={company.contact?.email || 'N/A'} />
                                <InfoRow icon={Phone} label="رقم الهاتف" value={company.contact?.phone || 'N/A'} />
                                <InfoRow icon={MapPin} label="الموقع" value={company.contact?.location || 'N/A'} />
                                <InfoRow icon={Calendar} label="تاريخ الانضمام" value={new Date(company.createdAt).toLocaleDateString('ar-EG')} />
                            </div>

                            <div className="mt-8 pt-6 border-t border-neutral-100">
                                <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4">تفاصيل الاشتراك</h4>
                                <div className="bg-neutral-50 rounded-2xl p-4 space-y-3 border border-neutral-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-neutral-500 text-sm">الباقة الحالية</span>
                                        <Badge variant="outline" className="font-bold uppercase text-primary-600 bg-primary-50 border-primary-100">
                                            {company.subscription.plan}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-neutral-500 text-sm">حد المستخدمين</span>
                                        <span className="font-bold text-neutral-900">{company.subscription.seats} موظف</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-neutral-500 text-sm">المستخدمين الحاليين</span>
                                        <span className="font-bold text-neutral-900">{company.userCount} مستخدم</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard icon={Users} label="إجمالي الفريق" value={users.length.toString()} color="blue" />
                        <StatCard icon={CreditCard} label="العائد الشهري" value={`$${company.revenue}`} color="emerald" />
                    </div>
                </div>

                {/* Users List Section */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-0">
                            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                                <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-secondary-500" />
                                    إدارة المستخدمين
                                </h3>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="rounded-full px-4">{users.length} مستخدم</Badge>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-neutral-50/50">
                                            <th className="px-6 py-4 font-bold text-neutral-500 text-sm">المستخدم</th>
                                            <th className="px-6 py-4 font-bold text-neutral-500 text-sm">الدور</th>
                                            <th className="px-6 py-4 font-bold text-neutral-500 text-sm">الحالة</th>
                                            <th className="px-6 py-4 font-bold text-neutral-500 text-sm">آخر دخول</th>
                                            <th className="px-6 py-4 font-bold text-neutral-500 text-sm text-left">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        <AnimatePresence>
                                            {users.map((u, idx) => (
                                                <motion.tr
                                                    key={u.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="hover:bg-neutral-50/50 transition-colors group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold border border-neutral-200 overflow-hidden shrink-0">
                                                                {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-neutral-900 truncate">{u.name}</p>
                                                                <p className="text-xs text-neutral-500 truncate">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className={`font-bold ${u.role === 'MANAGER' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' : 'text-neutral-600 bg-neutral-100'}`}>
                                                            {u.role === 'MANAGER' ? 'مدير شركة' : 'موظف'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`w-2 h-2 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500 shadow-sm shadow-red-500/50'}`} />
                                                            <span className={`text-sm font-bold ${u.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                {u.status === 'ACTIVE' ? 'نشط' : 'معطل'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-neutral-500">
                                                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('ar-EG') : 'لم يدخل بعد'}
                                                    </td>
                                                    <td className="px-6 py-4 text-left">
                                                        <Button variant="ghost" size="sm" className="p-2 h-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreVertical className="w-4 h-4 text-neutral-400" />
                                                        </Button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Confirmation Modals */}
            <Modal
                isOpen={showConfirmLogout}
                onClose={() => setShowConfirmLogout(false)}
                title={company.status === 'active' ? 'تأكيد حظر الوصول' : 'تأكيد تفعيل الوصول'}
            >
                <div className="p-6 text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${company.status === 'active' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {company.status === 'active' ? <ShieldAlert className="w-8 h-8" /> : <UserCheck className="w-8 h-8" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900">
                            {company.status === 'active' ? 'هل أنت متأكد من حظر وصول الجميع؟' : 'هل تريد تفعيل وصول الجميع؟'}
                        </h3>
                        <p className="text-neutral-500 text-sm mt-2">
                            {company.status === 'active'
                                ? `سيتم تعليق حساب شركة "${company.name}" فوراً وتسجيل خروج كافة المستخدمين الحاليين ومنع أي محاولات دخول جديدة.`
                                : `سيتم إعادة تفعيل حساب شركة "${company.name}" والسماح لجميع المستخدمين بالدخول للمنصة بشكل طبيعي.`}
                        </p>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button
                            className="flex-1 font-bold h-12"
                            variant={company.status === 'active' ? 'danger' : 'success'}
                            onClick={handleToggleAccess}
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'تأكيد الإجراء'}
                        </Button>
                        <Button
                            className="flex-1 font-bold h-12"
                            variant="outline"
                            onClick={() => setShowConfirmLogout(false)}
                        >
                            إلغاء
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showConfirmStatus}
                onClose={() => setShowConfirmStatus(false)}
                title={company.status === 'active' ? 'تعليق حساب الشركة' : 'تفعيل حساب الشركة'}
            >
                <div className="p-6 text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${company.status === 'active' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {company.status === 'active' ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900">
                            {company.status === 'active' ? 'هل تريد تعليق حساب الشركة؟' : 'هل تريد تفعيل حساب الشركة؟'}
                        </h3>
                        <p className="text-neutral-500 text-sm mt-2">
                            {company.status === 'active'
                                ? 'عند التعليق، لن يتمكن أي مستخدم من تسجيل الدخول أو استخدام المنصة حتى يتم تفعيلها مرة أخرى.'
                                : 'سيتم إعادة صلاحيات الدخول لجميع مستخدمي الشركة فوراً.'}
                        </p>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button
                            className={`flex-1 font-bold h-12 ${company.status === 'active' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            onClick={handleToggleStatus}
                        >
                            نعم، متأكد
                        </Button>
                        <Button
                            className="flex-1 font-bold h-12"
                            variant="outline"
                            onClick={() => setShowConfirmStatus(false)}
                        >
                            إلغاء
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

const InfoRow: React.FC<{ icon: any, label: string, value: string }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-neutral-100 text-neutral-500">
            <Icon className="w-4 h-4" />
        </div>
        <div>
            <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider whitespace-nowrap">{label}</p>
            <p className="text-sm font-bold text-neutral-900 break-all">{value}</p>
        </div>
    </div>
)

const StatCard: React.FC<{ icon: any, label: string, value: string, color: 'blue' | 'emerald' }> = ({ icon: Icon, label, value, color }) => {
    const colors = {
        blue: 'from-blue-500 to-indigo-600 shadow-blue-500/20',
        emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/20'
    }

    return (
        <Card className={`overflow-hidden border-none shadow-lg bg-gradient-to-br ${colors[color]} text-white`}>
            <CardContent className="p-4 relative">
                <Icon className="absolute -bottom-2 -right-2 w-16 h-16 opacity-10" />
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">{label}</p>
                <p className="text-2xl font-black">{value}</p>
            </CardContent>
        </Card>
    )
}

export default CompanyDetailPage
