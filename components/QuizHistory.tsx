import React, { useState, useEffect } from 'react';
import { getQuizHistory, getQuizSummary } from '../services/db';
import { QuizResult } from '../types';
import { Trophy, Clock, Target, TrendingUp, Calendar, RotateCw, ChevronRight, Loader2, Award, Zap, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuizHistoryProps {
    onRetry?: (topic: string, mode: 'standard' | 'blitz' | 'deep-dive') => void;
    onBack?: () => void;
}

const QuizHistory: React.FC<QuizHistoryProps> = ({ onRetry, onBack }) => {
    const [quizzes, setQuizzes] = useState<QuizResult[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'standard' | 'blitz' | 'deep-dive'>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [historyData, summaryData] = await Promise.all([
                getQuizHistory(50),
                getQuizSummary()
            ]);
            setQuizzes(historyData);
            setSummary(summaryData);
        } catch (error) {
            console.error('Error loading quiz history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (seconds: number | undefined) => {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'blitz': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'deep-dive': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        }
    };

    const getModeIcon = (mode: string) => {
        switch (mode) {
            case 'blitz': return <Zap size={12} />;
            case 'deep-dive': return <Brain size={12} />;
            default: return <Target size={12} />;
        }
    };

    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-400';
        if (percentage >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const filteredQuizzes = filter === 'all'
        ? quizzes
        : quizzes.filter(q => q.mode === filter);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020202] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020202] text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                            >
                                <ChevronRight className="rotate-180" size={20} />
                            </button>
                        )}
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                Quiz History
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">Track your learning progress</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && summary.total_quizzes > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Trophy className="text-blue-400" size={24} />
                                <span className="text-3xl font-bold text-white">{summary.total_quizzes}</span>
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
                                <span className="text-3xl font-bold text-white">
                                    {Math.round(summary.overall_avg_score)}%
                                </span>
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
                                <span className="text-3xl font-bold text-white">{summary.unique_topics}</span>
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
                                <Award className="text-yellow-400" size={24} />
                                <span className="text-3xl font-bold text-white">{summary.total_correct}</span>
                            </div>
                            <p className="text-slate-400 text-sm">Correct Answers</p>
                        </motion.div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                    {['all', 'standard', 'blitz', 'deep-dive'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setFilter(mode as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filter === mode
                                    ? 'bg-primary text-white'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
                        </button>
                    ))}
                </div>

                {/* Quiz List */}
                {filteredQuizzes.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <Trophy size={32} className="text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No quizzes yet</h3>
                        <p className="text-slate-400 text-sm">
                            {filter === 'all'
                                ? 'Start taking quizzes to see your history here!'
                                : `No ${filter} quizzes found. Try a different filter.`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredQuizzes.map((quiz, index) => {
                            const percentage = Math.round((quiz.score / quiz.total_questions) * 100);

                            return (
                                <motion.div
                                    key={quiz.id || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-white truncate max-w-md">
                                                    {quiz.topic}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${getModeColor(quiz.mode)}`}>
                                                    {getModeIcon(quiz.mode)}
                                                    {quiz.mode.toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={14} />
                                                    <span>{formatDate(quiz.created_at || '')}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={14} />
                                                    <span>{formatTime(quiz.time_taken)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Target size={14} />
                                                    <span>{quiz.total_questions} questions</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className={`text-3xl font-bold ${getScoreColor(percentage)}`}>
                                                    {percentage}%
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {quiz.score}/{quiz.total_questions} correct
                                                </div>
                                            </div>

                                            {onRetry && (
                                                <button
                                                    onClick={() => {
                                                        // Normalize mode values for compatibility
                                                        let normalizedMode: 'standard' | 'blitz' | 'deep-dive';
                                                        if (quiz.mode === 'speed_blitz') {
                                                            normalizedMode = 'blitz';
                                                        } else if (quiz.mode === 'deep_dive') {
                                                            normalizedMode = 'deep-dive';
                                                        } else {
                                                            normalizedMode = quiz.mode as 'standard' | 'blitz' | 'deep-dive';
                                                        }
                                                        onRetry(quiz.topic, normalizedMode);
                                                    }}
                                                    className="p-3 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/50 rounded-xl transition-all group-hover:scale-105"
                                                    title="Retry this quiz"
                                                >
                                                    <RotateCw size={18} className="text-slate-400 group-hover:text-primary" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizHistory;
