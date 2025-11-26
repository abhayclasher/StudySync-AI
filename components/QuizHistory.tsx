import React, { useState, useEffect } from 'react';
import { getQuizHistory, getQuizSummary } from '../services/db';
import { getTestSeriesHistory } from '../services/testSeriesDb';
import { QuizResult, TestAttempt } from '../types';
import {
    Trophy,
    Clock,
    Target,
    TrendingUp,
    Calendar,
    RotateCw,
    ChevronRight,
    Award,
    Zap,
    Brain,
    Sparkles,
    FileText,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizHistoryProps {
    onRetry?: (topic: string, mode: 'standard' | 'blitz' | 'deep-dive') => void;
    onBack?: () => void;
}

const QuizHistory: React.FC<QuizHistoryProps> = ({ onRetry, onBack }) => {
    const [activeTab, setActiveTab] = useState<'standard' | 'test-series'>('standard');
    const [quizzes, setQuizzes] = useState<QuizResult[]>([]);
    const [testSeriesAttempts, setTestSeriesAttempts] = useState<TestAttempt[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'standard' | 'blitz' | 'deep-dive'>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [historyData, summaryData, testSeriesData] = await Promise.all([
                getQuizHistory(20),
                getQuizSummary(),
                getTestSeriesHistory()
            ]);
            setQuizzes(historyData);
            setSummary(summaryData);
            setTestSeriesAttempts(testSeriesData);
        } catch (error) {
            console.error('Error loading history:', error);
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
            case 'blitz': return 'text-yellow-400 bg-yellow-500/10 ring-yellow-500/20';
            case 'deep-dive': return 'text-blue-400 bg-blue-500/10 ring-blue-500/20';
            default: return 'text-blue-400 bg-blue-500/10 ring-blue-500/20';
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
        if (percentage >= 80) return 'text-emerald-400';
        if (percentage >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const filteredQuizzes = filter === 'all'
        ? quizzes
        : quizzes.filter(q => q.mode === filter);

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-24 md:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 bg-neutral-900 hover:bg-neutral-800 rounded-xl border border-neutral-800 transition-colors"
                        >
                            <ChevronRight className="rotate-180 text-neutral-400" size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">History & Analytics</h2>
                        <p className="text-neutral-400 text-sm mt-1">Track your progress across all modes</p>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex p-1 bg-[#111] border border-white/5 rounded-xl w-full md:w-fit">
                <button
                    onClick={() => setActiveTab('standard')}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'standard'
                        ? 'bg-neutral-800 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                        }`}
                >
                    <Target size={16} />
                    Standard Quizzes
                </button>
                <button
                    onClick={() => setActiveTab('test-series')}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'test-series'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        : 'text-neutral-400 hover:text-white'
                        }`}
                >
                    <Sparkles size={16} />
                    AI Test Series
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'standard' ? (
                    <motion.div
                        key="standard"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Summary Cards */}
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-24 bg-[#111] rounded-2xl border border-neutral-800 animate-pulse"></div>
                                ))}
                            </div>
                        ) : summary && summary.total_quizzes > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <Trophy className="text-blue-400" size={20} />
                                        <span className="text-2xl font-bold text-white">{summary.total_quizzes}</span>
                                    </div>
                                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Total Quizzes</p>
                                </div>
                                <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <TrendingUp className="text-emerald-400" size={20} />
                                        <span className="text-2xl font-bold text-white">{Math.round(summary.overall_avg_score)}%</span>
                                    </div>
                                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Avg Score</p>
                                </div>
                                <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <Target className="text-blue-400" size={20} />
                                        <span className="text-2xl font-bold text-white">{summary.unique_topics}</span>
                                    </div>
                                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Topics</p>
                                </div>
                                <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <Award className="text-yellow-400" size={20} />
                                        <span className="text-2xl font-bold text-white">{summary.total_correct}</span>
                                    </div>
                                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Correct</p>
                                </div>
                            </div>
                        )}

                        {/* Filter Tabs */}
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                            {['all', 'standard', 'blitz', 'deep-dive'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setFilter(mode as any)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${filter === mode
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                        : 'bg-[#111] text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800'
                                        }`}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
                                </button>
                            ))}
                        </div>

                        {/* Quiz List */}
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-[#111] rounded-2xl border border-neutral-800 animate-pulse"></div>
                                ))}
                            </div>
                        ) : filteredQuizzes.length === 0 ? (
                            <div className="text-center py-12 bg-[#111] rounded-2xl border border-neutral-800">
                                <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-4">
                                    <Trophy size={24} className="text-neutral-600" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">No quizzes yet</h3>
                                <p className="text-neutral-500 text-sm max-w-xs mx-auto">
                                    Start taking quizzes to see your history here!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredQuizzes.map((quiz, index) => {
                                    const percentage = Math.round((quiz.score / quiz.total_questions) * 100);
                                    return (
                                        <div
                                            key={quiz.id || index}
                                            className="group bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-2xl p-5 hover:border-blue-500/20 transition-all shadow-sm hover:shadow-lg hover:shadow-black/40"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-base font-bold text-white truncate max-w-md group-hover:text-blue-400 transition-colors">
                                                            {quiz.topic}
                                                        </h3>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ring-1 ring-inset flex items-center gap-1 uppercase tracking-wider ${getModeColor(quiz.mode)}`}>
                                                            {getModeIcon(quiz.mode)}
                                                            {quiz.mode.replace('_', ' ')}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar size={12} />
                                                            <span>{formatDate(quiz.created_at || '')}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock size={12} />
                                                            <span>{formatTime(quiz.time_taken)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Target size={12} />
                                                            <span>{quiz.total_questions} questions</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <div className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                                                            {percentage}%
                                                        </div>
                                                        <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                                                            Score
                                                        </div>
                                                    </div>

                                                    {onRetry && (
                                                        <button
                                                            onClick={() => {
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
                                                            className="p-3 bg-[#151515] hover:bg-blue-600 text-neutral-400 hover:text-white rounded-xl transition-all border border-white/5 hover:border-transparent"
                                                            title="Retry this quiz"
                                                        >
                                                            <RotateCw size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="test-series"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-[#111] rounded-2xl border border-neutral-800 animate-pulse"></div>
                                ))}
                            </div>
                        ) : testSeriesAttempts.length === 0 ? (
                            <div className="text-center py-12 bg-[#111] rounded-2xl border border-neutral-800">
                                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                                    <Sparkles size={24} className="text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">No Test Series Attempts</h3>
                                <p className="text-neutral-500 text-sm max-w-xs mx-auto">
                                    Generate and take AI-powered test series to see your results here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {testSeriesAttempts.map((attempt, index) => {
                                    const percentage = Math.round((attempt.score / attempt.total_questions) * 100);

                                    return (
                                        <div
                                            key={attempt.id || index}
                                            className="group bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-2xl p-5 hover:border-blue-500/20 transition-all shadow-sm hover:shadow-lg hover:shadow-blue-900/10"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-base font-bold text-white truncate max-w-md group-hover:text-blue-400 transition-colors">
                                                            {attempt.topic || 'Unknown Topic'}
                                                        </h3>
                                                        {attempt.examType && (
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                                                                {attempt.examType}
                                                            </span>
                                                        )}
                                                        {attempt.difficulty && (
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${attempt.difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                attempt.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                }`}>
                                                                {attempt.difficulty}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar size={12} />
                                                            <span>{formatDate(attempt.completed_at)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock size={12} />
                                                            <span>{formatTime(attempt.time_taken)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <FileText size={12} />
                                                            <span>{attempt.total_questions} questions</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <div className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                                                            {percentage}%
                                                        </div>
                                                        <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                                                            Score
                                                        </div>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-xl bg-[#151515] border border-white/5 flex items-center justify-center text-neutral-500">
                                                        <CheckCircle2 size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuizHistory;
