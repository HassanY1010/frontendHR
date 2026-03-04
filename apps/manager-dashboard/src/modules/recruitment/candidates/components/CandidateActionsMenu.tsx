import React, { useState, useRef, useEffect } from 'react'
import { MoreVertical, Clock, Briefcase, CheckCircle, XCircle } from 'lucide-react'

interface CandidateActionsMenuProps {
    candidate: any
    onUpdateStatus: (candidateId: string, status: string) => void
    onStartInterview?: (candidate: any) => void
}

const CandidateActionsMenu: React.FC<CandidateActionsMenuProps> = ({
    candidate,
    onUpdateStatus,
    onStartInterview
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleAction = (status: string) => {
        if (status === 'INTERVIEWING' && onStartInterview) {
            onStartInterview(candidate)
        } else {
            onUpdateStatus(candidate.id, status)
        }
        setIsOpen(false)
    }

    const actions = [
        {
            label: 'قيد المراجعة',
            status: 'SCREENING',
            icon: <Clock className="h-4 w-4 text-yellow-500 shrink-0" />,
            hover: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
        },
        {
            label: 'مقابلة',
            status: 'INTERVIEWING',
            icon: <Briefcase className="h-4 w-4 text-purple-500 shrink-0" />,
            hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
        },
        {
            label: 'قبول',
            status: 'HIRED',
            icon: <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />,
            hover: 'hover:bg-green-50 dark:hover:bg-green-900/20',
        },
        {
            label: 'رفض',
            status: 'REJECTED',
            icon: <XCircle className="h-4 w-4 text-red-500 shrink-0" />,
            hover: 'hover:bg-red-50 dark:hover:bg-red-900/20',
        },
    ]

    return (
        <div className="relative" ref={menuRef} dir="rtl">
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
                <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>
            {isOpen && (
                <div className="absolute left-0 top-10 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden z-50 min-w-[180px]">
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500">تغيير الحالة</p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                        {actions.map((action) => (
                            <button
                                key={action.status}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleAction(action.status)
                                }}
                                className={`flex flex-row-reverse items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 ${action.hover} rounded-lg transition-colors`}
                            >
                                {action.icon}
                                <span className="flex-1 text-right">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default CandidateActionsMenu
