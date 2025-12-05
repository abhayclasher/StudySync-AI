import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Trophy, ArrowRight, Target, BarChart2, TrendingUp, AlertCircle, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
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

interface HistoryItem {
    id: string;
    topic: string;
    score: number;
    total_questions: number;
    completed_at: string;
    difficulty: string;
    time_taken?: number; // in seconds
}

interface PracticeHistoryProps {
    onRetry: (test: any) => void;
    onBack: () => void;
}

const PracticeHistory: React.FC<PracticeHistoryProps> = ({ onRetry, onBack }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError("Please sign in to view history.");
                return;
            }

            const { data, error } = await supabase
                .from('quiz_history')
                .select('*')
                .eq('user_id', user.id)
                .order('completed_at', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
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
        <div className="w-full max-w-4xl mx-auto space-y-4 p-1 md:p-4 pb-20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent">Test History</h2>
                    <p className="text-blue-200/80 font-medium text-xs">Your performance timeline</p>
                </div>

                {/* Stats Overview - Compact */}
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 scrollbar-hide">
                    <div className="bg-[#111] border border-white/10 px-3 py-2 rounded-xl flex items-center gap-2 min-w-[110px] shadow-sm">
                        <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
                            <Target size={14} />
                        </div>
                        <div>
                            <span className="text-[9px] text-slate-300 uppercase tracking-wider font-bold block">Tests</span>
                            <div className="text-sm font-bold text-white">{history.length}</div>
                        </div>
                    </div>
                    <div className="bg-[#111] border border-white/10 px-3 py-2 rounded-xl flex items-center gap-2 min-w-[110px] shadow-sm">
                        <div className="p-1.5 bg-purple-500/20 rounded-lg text-purple-400">
                            <TrendingUp size={14} />
                        </div>
                        <div>
                            <span className="text-[9px] text-slate-300 uppercase tracking-wider font-bold block">Avg. Score</span>
                            <div className="text-sm font-bold text-white">
                                {history.length > 0
                                    ? Math.round(history.reduce((acc, curr) => acc + (curr.score / curr.total_questions) * 100, 0) / history.length)
                                    : 0}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : error ? (
                <div className="text-center py-10 bg-[#111] rounded-2xl border border-red-500/20">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-red-300/80 text-xs mb-4">{error}</p>
                    <button onClick={fetchHistory} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-bold transition-all">
                        Retry
                    </button>
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-20 bg-[#0a0a0a] rounded-2xl border border-white/5">
                    <Trophy className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-white mb-2">No Tests Yet</h3>
                    <button
                        onClick={onBack}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                    >
                        Start First Test
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Performance Chart - Compact */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 shadow-lg relative overflow-hidden">
                        <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                            <BarChart2 className="text-blue-400" size={14} /> Performance Trend
                        </h3>
                        <div className="h-[150px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} width={25} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent History List - Compact Rows */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white px-1">Recent Activity</h3>
                        <div className="grid gap-2">
                            {history.map((item) => {
                                const percentage = Math.round((item.score / item.total_questions) * 100);

                                return (
                                    <div
                                        key={item.id}
                                        className="group bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-white/10 rounded-xl p-3 transition-all flex items-center gap-3"
                                    >
                                        {/* Score Badge */}
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${getGradeBg(percentage)}`}>
                                            <span className={`text-xs font-bold ${getGradeColor(percentage)}`}>
                                                {percentage}%
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-xs font-bold text-white truncate max-w-[120px]">{item.topic}</h3>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border ${item.difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    item.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    }`}>
                                                    {item.difficulty?.substring(0, 1) || 'M'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
                                                <span>{format(new Date(item.completed_at), 'MMM d')}</span>
                                                <span>{item.score}/{item.total_questions} Correct</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    // Placeholder for advanced analysis view
                                                    // In a real app, this would navigate to a detailed result page fetching questions from DB
                                                    alert("Detailed analysis feature coming soon!");
                                                }}
                                                className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-blue-400 rounded-lg transition-all"
                                                title="View Analysis"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={() => onRetry(item)}
                                                className="p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all"
                                                title="Retake Test"
                                            >
                                                <ArrowRight size={14} />
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
