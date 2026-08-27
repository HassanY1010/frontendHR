import React from 'react';
import { motion } from 'framer-motion';
import {
    Brain, CheckCircle, AlertTriangle, TrendingUp,
    Info, ChevronDown, ChevronUp
} from 'lucide-react';
import type { EvaluationScore } from '../services/evaluationApi';

interface AIScoreCardProps {
    label: string;
    labelAr: string;
    score: number | null | undefined;
    detail: EvaluationScore | null | undefined;
    weight: number;
    icon?: React.ReactNode;
    className?: string;
    accentColor?: string;
}

const getScoreColor = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 65) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
};

const getScoreBg = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'bg-gray-100 dark:bg-gray-800';
    if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
    if (score >= 65) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    if (score >= 50) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
};

const getProgressColor = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'bg-gray-300';
    if (score >= 80) return 'bg-gradient-to-r from-emerald-400 to-emerald-600';
    if (score >= 65) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    if (score >= 50) return 'bg-gradient-to-r from-amber-400 to-amber-600';
    return 'bg-gradient-to-r from-red-400 to-red-600';
};

const AIScoreCard: React.FC<AIScoreCardProps> = ({
    label,
    labelAr,
    score,
    detail,
    weight,
    icon,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const displayScore = score !== null && score !== undefined ? Math.round(score) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 ${getScoreBg(score)} ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${getScoreBg(score)} ${getScoreColor(score)}`}>
                        {icon || <Brain className="w-4 h-4" />}
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{labelAr}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{label} · Weight: {(weight * 100).toFixed(0)}%</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold tabular-nums ${getScoreColor(score)}`}>
                        {displayScore !== null ? displayScore : '—'}
                        {displayScore !== null && <span className="text-sm font-normal opacity-60">/100</span>}
                    </span>
                    {detail && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                            title="Show details"
                        >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${displayScore ?? 0}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                    className={`h-full rounded-full ${getProgressColor(score)}`}
                />
            </div>

            {/* Expandable Details */}
            {isExpanded && detail && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-3 text-sm"
                >
                    {/* Explanation */}
                    {detail.explanation && (
                        <div className="flex gap-2 text-gray-700 dark:text-gray-300">
                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                            <p className="leading-relaxed">{detail.explanation}</p>
                        </div>
                    )}

                    {/* Strengths */}
                    {detail.strengths && detail.strengths.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> نقاط القوة
                            </p>
                            <ul className="space-y-1">
                                {detail.strengths.map((s, i) => (
                                    <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-1.5 items-start">
                                        <span className="text-emerald-500 mt-0.5">•</span> {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Weaknesses */}
                    {detail.weaknesses && detail.weaknesses.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> نقاط التحسين
                            </p>
                            <ul className="space-y-1">
                                {detail.weaknesses.map((w, i) => (
                                    <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-1.5 items-start">
                                        <span className="text-amber-500 mt-0.5">•</span> {w}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Evidence */}
                    {detail.evidence && detail.evidence.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> الأدلة من النص
                            </p>
                            <ul className="space-y-1">
                                {detail.evidence.map((e, i) => (
                                    <li key={i} className="text-xs text-gray-500 dark:text-gray-500 italic border-r-2 border-blue-300 dark:border-blue-700 pr-2">
                                        "{e}"
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
};

export default AIScoreCard;
