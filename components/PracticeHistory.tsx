import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Trophy, ArrowRight, Target, BarChart2, TrendingUp, AlertCircle, Eye, Check } from 'lucide-react';
import { format } from 'date-fns';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { getTestSeriesHistory } from '../services/testSeriesDb';
import { TestAttempt } from '../types';

interface PracticeHistoryProps {
    onRetry: (test: any) => void;
    onViewAnalysis: (test: any) => void;
    onBack: () => void;
}

const PracticeHistory: React.FC<PracticeHistoryProps> = ({ onRetry, onViewAnalysis, onBack }) => {
    const [history, setHistory] = useState<TestAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getTestSeriesHistory();
            setHistory(data);
        } catch (error: any) {
            console.error('Error fetching history:', error);
            setError(error.message || "Failed to load history.");
        } finally {
            setLoading(false);
        }
    };

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return 'text-emerald-400';
        if (percentage >= 70) return 'text-blue-400';
        if (percentage >= 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getGradeBg = (percentage: number) => {
        if (percentage >= 90) return 'bg-emerald-500/10 border-emerald-500/20';
        if (percentage >= 70) return 'bg-blue-500/10 border-blue-500/20';
        if (percentage >= 50) return 'bg-yellow-500/10 border-yellow-500/20';
        return 'bg-red-500/10 border-red-500/20';
    };

    // Prepare chart data (reverse chronological for chart)
    const chartData = [...history].reverse().map((item, index) => ({
        name: `T${index + 1}`,
        score: Math.round((item.score / item.total_questions) * 100),
        date: format(new Date(item.completed_at), 'MMM d')
    }));

    return (
        <div className="w-full max-w-none mx-auto space-y-6 p-2 md:p-6 pb-24">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent">Test History</h2>
                    <p className="text-blue-200/80 font-medium text-xs md:text-sm mt-1">Your performance timeline</p>
                </div>

                {/* Stats Overview - Consistent Style with Results */}
                <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 scrollbar-hide">
                    <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-4 min-w-[140px] shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 relative z-10">
                            <Target size={20} />
                        </div>
                        <div className="relative z-10">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Tests</span>
                            <div className="text-xl font-bold text-white">{history.length}</div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-4 min-w-[140px] shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                        <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 relative z-10">
                            <TrendingUp size={20} />
                        </div>
                        <div className="relative z-10">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Avg. Score</span>
                            <div className="text-xl font-bold text-white">
                                {history.length > 0
                                    ? Math.round(history.reduce((acc, curr) => acc + (curr.score / curr.total_questions) * 100, 0) / history.length)
                                    : 0}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-32">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : error ? (
                <div className="text-center py-12 bg-[#111] rounded-3xl border border-red-500/20">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-red-300/80 text-sm mb-6">{error}</p>
                    <button onClick={fetchHistory} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-bold transition-all">
                        Retry
                    </button>
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-32 bg-[#0a0a0a] rounded-3xl border border-white/5">
                    <Trophy className="w-16 h-16 text-blue-400 mx-auto mb-6 opacity-50" />
                    <h3 className="text-2xl font-bold text-white mb-3">No Tests Yet</h3>
                    <button
                        onClick={onBack}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-base transition-all shadow-xl shadow-blue-600/20"
                    >
                        Start First Test
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Performance Chart - Larger & Clearer */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-4 md:p-6 shadow-xl relative overflow-hidden">
                        <h3 className="text-sm font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                            <BarChart2 className="text-blue-400" size={18} /> Performance Trend
                        </h3>
                        <div className="h-[150px] md:h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} width={30} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', fontSize: '14px', padding: '10px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent History List - Comfortable Spacing */}
                    <div className="space-y-3">
                        <h3 className="text-sm md:text-base font-bold text-white px-1">Recent Activity</h3>
                        <div className="grid gap-3">
                            {history.map((item) => {
                                const percentage = Math.round((item.score / item.total_questions) * 100);

                                return (
                                    <div
                                        key={item.id}
                                        className="group bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-white/10 rounded-2xl p-3 md:p-4 transition-all flex items-center gap-4"
                                    >
                                        {/* Score Badge */}
                                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border shrink-0 ${getGradeBg(percentage)}`}>
                                            <span className={`text-xs md:text-sm font-bold ${getGradeColor(percentage)}`}>
                                                {percentage}%
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-sm md:text-base font-bold text-white truncate max-w-[150px] md:max-w-none">{item.topic || 'General Test'}</h3>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold border ${item.difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    item.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    }`}>
                                                    {item.difficulty || 'Medium'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                                                <span className="flex items-center gap-1.5"><Calendar size={12} /> {format(new Date(item.completed_at), 'MMM d, yyyy')}</span>
                                                <span className="flex items-center gap-1.5"><Check size={12} /> {item.score}/{item.total_questions} Correct</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onViewAnalysis(item)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 group-hover:scale-105"
                                                title="View Detailed Analysis"
                                            >
                                                <Eye size={14} /> <span className="hidden md:inline">View Analysis</span><span className="md:hidden">View</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PracticeHistory;
