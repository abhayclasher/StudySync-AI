import React, { useState, useEffect } from 'react';
import { getQuizTrendData, getTopicPerformance, getModeComparison, getWeakTopics, getQuizSummary } from '../services/db';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, Target, Award, AlertCircle, BarChart3, PieChart as PieIcon, Loader2, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import EmptyState from './common/EmptyState';

interface QuizAnalyticsProps {
    onBack?: () => void;
}

const COLORS = {
    standard: '#3b82f6',
    blitz: '#f59e0b',
    'deep-dive': '#8b5cf6',
    primary: '#10b981',
    warning: '#ef4444',
    info: '#06b6d4'
};

const QuizAnalytics: React.FC<QuizAnalyticsProps> = ({ onBack }) => {
    const [loading, setLoading] = useState(true);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [topicData, setTopicData] = useState<any[]>([]);
    const [modeData, setModeData] = useState<any[]>([]);
    const [weakTopics, setWeakTopics] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const [trend, topics, modes, weak, summaryData] = await Promise.all([
                getQuizTrendData(30),
                getTopicPerformance(),
                getModeComparison(),
                getWeakTopics(70),
                getQuizSummary()
            ]);

            setTrendData(trend);
            setTopicData(topics);
            setModeData(modes);
            setWeakTopics(weak);
            setSummary(summaryData);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020202] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!summary || summary.total_quizzes === 0) {
        return (
            <div className="min-h-screen bg-[#020202] p-3 md:p-6">
                <EmptyState
                    icon={BarChart3}
                    title="No Quiz Data Yet"
                    description="Take some quizzes to see your performance analytics and insights"
                    action={onBack ? {
                        label: "Go Back",
                        onClick: onBack
                    } : undefined}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020202] text-white p-3 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            Quiz Analytics
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Track your learning progress and identify areas for improvement</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Award className="text-blue-400" size={24} />
                            <span className="text-2xl md:text-3xl font-bold text-white">{summary.total_quizzes}</span>
                        </div>
                        <p className="text-slate-400 text-sm">Total Quizzes</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="text-green-400" size={24} />
                            <span className="text-2xl md:text-3xl font-bold text-white">{Math.round(summary.overall_avg_score)}%</span>
                        </div>
                        <p className="text-slate-400 text-sm">Average Score</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Target className="text-purple-400" size={24} />
                            <span className="text-2xl md:text-3xl font-bold text-white">{summary.unique_topics}</span>
                        </div>
                        <p className="text-slate-400 text-sm">Topics Covered</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="text-yellow-400" size={24} />
                            <span className="text-2xl md:text-3xl font-bold text-white">{weakTopics.length}</span>
                        </div>
                        <p className="text-slate-400 text-sm">Weak Topics</p>
                    </motion.div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Score Trend Chart */}
                    {trendData.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6"
                        >
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="text-green-400" size={20} />
                                Score Trend (Last 30 Days)
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0a0a0a',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke={COLORS.primary}
                                        strokeWidth={2}
                                        dot={{ fill: COLORS.primary, r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}

                    {/* Topic Performance Chart */}
                    {topicData.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6"
                        >
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Target className="text-purple-400" size={20} />
                                Topic Performance
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topicData.slice(0, 5)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="topic" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0a0a0a',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Bar dataKey="avgScore" fill={COLORS.info} radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}

                    {/* Mode Comparison Chart */}
                    {modeData.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6"
                        >
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <PieIcon className="text-blue-400" size={20} />
                                Quiz Mode Distribution
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={modeData}
                                        dataKey="count"
                                        nameKey="mode"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={(entry) => `${entry.mode}: ${entry.count}`}
                                    >
                                        {modeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.mode as keyof typeof COLORS] || COLORS.primary} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0a0a0a',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}

                    {/* Weak Topics */}
                    {weakTopics.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6"
                        >
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <AlertCircle className="text-red-400" size={20} />
                                Topics Needing Improvement
                            </h3>
                            <div className="space-y-3">
                                {weakTopics.slice(0, 5).map((topic, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div className="flex-1">
                                            <p className="text-white font-medium text-sm truncate">{topic.topic}</p>
                                            <p className="text-slate-400 text-xs">{topic.totalQuizzes} quizzes</p>
                                        </div>
                                        <div className={`text-lg font-bold ${topic.avgScore < 50 ? 'text-red-400' : 'text-yellow-400'}`}>
                                            {topic.avgScore}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizAnalytics;
