
import React, { useEffect, useState } from 'react';
import { UserProfile, RoadmapCourse, RoadmapStep, Goal } from '../types';
import { getRoadmaps, getStudyStreakData } from '../services/db';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    Legend,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    ReferenceLine
} from 'recharts';
import { Flame, Clock, Trophy, Target, Zap, Activity, PieChart as PieIcon, Crown, CheckCircle, PlayCircle, Lock, Star, Trash2, Plus, Pause, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import ColourfulText from './ui/colourful-text';

import { Tabs } from './ui/tabs';

import StudyStreakCalendar from './common/StudyStreakCalendar';

interface DashboardProps {
    user: UserProfile;
    goals: Goal[];
    isTimerActive: boolean;
    timeLeft: number;
    onToggleTimer: () => void;
    onResetTimer: () => void;
    onAdjustTimer: (minutes: number) => void;
    onAddGoal: (title: string) => void;
    onToggleGoal: (id: string) => void;
    onDeleteGoal: (id: string) => void;
    onStartVideo: (video: RoadmapStep, courseId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
    user,
    goals,
    isTimerActive,
    timeLeft,
    onToggleTimer,
    onResetTimer,
    onAdjustTimer,
    onAddGoal,
    onToggleGoal,
    onDeleteGoal,
    onStartVideo
}) => {
    const [activeCourse, setActiveCourse] = useState<RoadmapCourse | null>(null);
    const [nextStep, setNextStep] = useState<RoadmapStep | null>(null);
    const [loadingActive, setLoadingActive] = useState(false); // Changed to false for faster initial render
    const [streakData, setStreakData] = useState<Record<string, number>>({});

    // Local state for adding goals on mobile
    const [isAddingGoal, setIsAddingGoal] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [imageError, setImageError] = useState(false);

    // Memoize the loadActiveCourse function to prevent recreation
    const loadActiveCourse = React.useCallback(async () => {
        setLoadingActive(true);
        try {
            const courses = await getRoadmaps();

            // 1. Try to find the last active course from localStorage
            const lastActiveId = typeof window !== 'undefined' ? localStorage.getItem('app_active_course') : null;
            let current = lastActiveId ? courses.find(c => c.id === lastActiveId) : null;

            // 2. If no last active (or it's completed), find the first incomplete course
            if (!current || current.progress === 100) {
                current = courses.find(c => c.progress < 100) || null;
            }

            // 3. If still nothing and we have courses, just show the first one (even if completed, to allow review)
            if (!current && courses.length > 0) {
                current = courses[0];
            }

            setActiveCourse(current);
            if (current) {
                const next = current.steps.find(s => s.status !== 'completed') || current.steps[0];
                setNextStep(next);
            }
        } catch (error) {
            console.error('Error loading active course:', error);
        } finally {
            setLoadingActive(false);
        }
    }, []); // No dependencies - function is stable

    useEffect(() => {
        loadActiveCourse();
    }, [loadActiveCourse]);

    // Fetch study streak data
    useEffect(() => {
        const fetchStreakData = async () => {
            if (user?.id) {
                const data = await getStudyStreakData(user.id);
                setStreakData(data);
            }
        };
        fetchStreakData();
    }, [user?.id]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleAddGoalSubmit = () => {
        if (!newGoalTitle.trim()) return;
        onAddGoal(newGoalTitle);
        setNewGoalTitle('');
        setIsAddingGoal(false);
    };

    const rawWeeklyData = user.weeklyStats && user.weeklyStats.length > 0 ? user.weeklyStats : [
        { name: 'Mon', hours: 0, videos: 0, quizzes: 0 },
        { name: 'Tue', hours: 0.5, videos: 1, quizzes: 0 },
        { name: 'Wed', hours: 0, videos: 0, quizzes: 0 },
        { name: 'Thu', hours: 1, videos: 0, quizzes: 1 },
        { name: 'Fri', hours: 0.5, videos: 1, quizzes: 0 },
        { name: 'Sat', hours: 0, videos: 0, quizzes: 0 },
        { name: 'Sun', hours: 0, videos: 0, quizzes: 0 },
    ];

    const weeklyData = rawWeeklyData.map(d => ({
        ...d,
        videos: d.videos || 0,
        quizzes: d.quizzes || 0,
        speedBlitz: d.speedBlitz !== undefined ? d.speedBlitz : (d.quizzes ? Math.ceil(d.quizzes * 0.5) : 0),
        deepDive: d.deepDive !== undefined ? d.deepDive : (d.videos ? Math.ceil(d.videos * 0.3) : 0),
        flashcards: d.flashcards !== undefined ? d.flashcards : (d.hours ? Math.ceil(d.hours * 10) : 0)
    }));

    const stats = user.stats || { videosCompleted: 0, quizzesCompleted: 0, flashcardsReviewed: 0, focusSessions: 0 };
    const totalActivities = stats.videosCompleted + stats.quizzesCompleted + (stats.flashcardsReviewed > 0 ? 1 : 0);

    const distributionData = totalActivities === 0 ? [
        { name: 'No Activity', value: 1, color: '#1f1f1f' }
    ] : [
        { name: 'Lessons', value: stats.videosCompleted, color: '#6366f1' },
        { name: 'Quizzes', value: stats.quizzesCompleted, color: '#ec4899' },
        { name: 'Practice', value: Math.ceil(stats.flashcardsReviewed / 10), color: '#06b6d4' },
    ].filter(d => d.value > 0);

    const nextLevelXp = user.level * 1000;
    const progressToNext = ((user.xp % 1000) / 1000) * 100;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    // Tab Content: Activity
    const ActivityContent = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Main Chart: Weekly Focus */}
            <div className="lg:col-span-2 h-full min-h-[350px]">
                <div className="bg-[#050505] border border-white/10 rounded-2xl p-6 relative w-full h-full flex flex-col shadow-lg hover:border-white/20 transition-all group overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all"></div>

                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div>
                            <div className="text-xl font-bold text-white flex items-center mb-1">
                                <Activity className="w-5 h-5 mr-2 text-indigo-400" /> Weekly Activity
                            </div>
                            <p className="text-xs text-slate-400">Your learning momentum over the last 7 days</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 justify-end">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                <span className="text-[10px] text-slate-400">Videos</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                                <span className="text-[10px] text-slate-400">Quizzes</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                <span className="text-[10px] text-slate-400">Blitz</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                                <span className="text-[10px] text-slate-400">Deep Dive</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-[10px] text-slate-400">Cards</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[250px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart key={JSON.stringify(weeklyData)} data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVideos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorQuizzes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorBlitz" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDeep" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCards" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#525252"
                                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={15}
                                />
                                <YAxis
                                    stroke="#525252"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#ffffff20', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl">
                                                    <p className="text-white font-bold mb-2">{label}</p>
                                                    {payload.map((entry: any, index: number) => (
                                                        <div key={index} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }}></div>
                                                            <span className="text-slate-300 capitalize">{entry.name}:</span>
                                                            <span className="text-white font-bold">{entry.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <ReferenceLine y={2} stroke="#ffffff20" strokeDasharray="3 3" label={{ value: 'Daily Goal', position: 'insideTopRight', fill: '#ffffff40', fontSize: 10 }} />
                                <Area
                                    type="monotone"
                                    dataKey="videos"
                                    name="Videos"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorVideos)"
                                    animationDuration={1000}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="quizzes"
                                    name="Quizzes"
                                    stroke="#ec4899"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorQuizzes)"
                                    animationDuration={1000}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="speedBlitz"
                                    name="Speed Blitz"
                                    stroke="#eab308"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorBlitz)"
                                    animationDuration={1000}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="deepDive"
                                    name="Deep Dive"
                                    stroke="#06b6d4"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorDeep)"
                                    animationDuration={1000}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="flashcards"
                                    name="Flashcards"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorCards)"
                                    animationDuration={1000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Learning Distribution (Donut Chart) */}
            <div className="h-full min-h-[300px]">
                <div className="bg-[#050505] border border-white/10 rounded-2xl p-6 flex flex-col relative w-full h-full shadow-lg hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                        <div className="text-lg font-bold text-white flex items-center">
                            <PieIcon className="w-5 h-5 mr-2 text-pink-500" /> Learning Split
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">Based on your recent activity</p>

                    <div className="flex-1 relative flex items-center justify-center min-h-[200px]">
                        <div className="absolute inset-0 flex items-center justify-center z-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart key={JSON.stringify(distributionData)}>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#121212', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Centered Text with explicit z-index to sit on top of pie hole */}
                        <div className="relative z-10 text-center pointer-events-none">
                            <span className="text-2xl md:text-3xl font-bold text-white block">{(user.total_study_hours || 0).toFixed(1)}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mt-1">Hours</span>
                        </div>
                    </div>

                    <div className="space-y-3 mt-4">
                        {totalActivities === 0 ? (
                            <p className="text-xs text-center text-slate-500 italic">Complete a lesson to see data.</p>
                        ) : (
                            distributionData.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center">
                                        <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-slate-300">{item.name}</span>
                                    </div>
                                    <span className="font-bold text-white">
                                        {Math.round((item.value / totalActivities) * 100)}%
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const tabs = [
        {
            title: "Overview",
            value: "activity",
            content: <ActivityContent />
        },
        {
            title: "Achievements",
            value: "achievements",
            content: (
                <div className="w-full h-full min-h-[400px]">
                    <div className="w-full h-full bg-[#050505] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Badge Collection</h3>
                                <p className="text-xs text-slate-400 mt-1">Unlock badges by mastering topics.</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-primary">
                                    {user.achievements.filter(a => a.unlocked).length}/{user.achievements.length}
                                </p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Unlocked</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto custom-scrollbar pr-2 max-h-[300px]">
                            {user.achievements.map((ach) => (
                                <div
                                    key={ach.id}
                                    className={`
                            relative p-3 rounded-xl border transition-all duration-300 group
                            ${!ach.unlocked ? 'bg-white/[0.02] border-white/5 opacity-60' : 'bg-gradient-to-br from-white/[0.05] to-white/[0.01] border-white/10 hover:border-primary/30'}
                        `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-lg
                                ${!ach.unlocked ? 'bg-white/5 text-slate-600' : 'bg-primary/20 text-primary'}
                            `}>
                                            {ach.unlocked ? ach.icon : <Lock className="w-3 h-3" />}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-xs ${!ach.unlocked ? 'text-slate-500' : 'text-white'}`}>{ach.title}</h4>
                                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{ach.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0f0f0f]">
            <motion.div
                className="space-y-6 pb-10 w-full"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* WELCOME HEADER - Simplified and Cleaner */}
                <header className="w-full">
                    <div className="relative w-full rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-white/10 p-5 md:p-7 overflow-hidden shadow-lg">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full border-2 border-white/20 overflow-hidden shadow-lg hidden md:block">
                                    {user.avatar_url && !imageError ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                        Welcome back, <ColourfulText text={user.name} />
                                    </h1>
                                    <p className="text-slate-300 text-sm md:text-base">
                                        You're on a <span className="text-white font-semibold">{user.streak || 0} day streak</span>. Keep the momentum going!
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onToggleTimer}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all flex items-center whitespace-nowrap shadow-lg"
                                >
                                    <Zap className="w-4 h-4 mr-2" /> {isTimerActive ? 'Stop Focus' : 'Quick Study'}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>





                {/* STATS GRID - Simplified */}
                <section>
                    <h2 className="text-lg font-semibold text-white mb-4">Your Progress</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Level Progress', sub: `to Lvl ${(user.level || 1) + 1}`, val: progressToNext.toFixed(0), suffix: '%', icon: <Crown size={18} />, color: 'text-yellow-400' },
                            { label: 'Total XP', sub: 'Points', val: (user?.xp ?? 0), suffix: '', icon: <Trophy size={18} />, color: 'text-blue-400' },
                            { label: 'Streak', sub: 'Days', val: (user.streak || 0), suffix: '', icon: <Flame size={18} />, color: 'text-orange-400' },
                            { label: 'Study Time', sub: 'Hours', val: (user.total_study_hours || 0), suffix: 'h', icon: <Clock size={18} />, color: 'text-emerald-400', decimals: 1 }
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`${stat.color}`}>
                                        {stat.icon}
                                    </div>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider">
                                        {stat.label}
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">
                                    <CountUp
                                        end={typeof stat.val === 'number' ? stat.val : parseFloat(stat.val)}
                                        duration={2}
                                        decimals={stat.decimals || 0}
                                        suffix={stat.suffix}
                                        separator=","
                                    />
                                </div>
                                <div className="text-xs text-slate-400">
                                    {stat.sub}
                                </div>
                                {stat.label === 'Level Progress' && (
                                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-3">
                                        <motion.div
                                            className="h-full bg-yellow-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stat.val}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* STUDY STREAK CALENDAR */}
                {Object.keys(streakData).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-6"
                    >
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Flame className="text-orange-400" size={20} />
                                Study Streak Calendar
                            </h3>
                            <StudyStreakCalendar data={streakData} />
                        </div>
                    </motion.div>
                )}

                {/* MAIN CONTENT LAYOUT - Simplified */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* LEFT COLUMN - Activity Overview */}
                    <div className="xl:col-span-2">
                        <Tabs tabs={tabs} contentClassName="mt-0" />
                    </div>

                    {/* RIGHT COLUMN - Focus & Goals */}
                    <div className="space-y-6">
                        {/* Current Focus Card */}
                        {activeCourse && nextStep && (
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Target size={16} className="text-blue-400" />
                                    <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Current Focus</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{activeCourse.topic}</h3>
                                <p className="text-slate-300 text-sm mb-4">Next: {nextStep.title}</p>
                                <button
                                    onClick={() => onStartVideo(nextStep, activeCourse.id)}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all flex items-center justify-center"
                                >
                                    <PlayCircle size={16} className="mr-2" /> Resume Learning
                                </button>
                            </div>
                        )}

                        {/* Daily Goals */}
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Star size={16} className="text-yellow-500" />
                                    <h3 className="font-semibold text-white">Daily Goals</h3>
                                </div>
                                <button
                                    onClick={() => setIsAddingGoal(!isAddingGoal)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            {/* Add Goal Form */}
                            <AnimatePresence>
                                {isAddingGoal && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mb-4"
                                    >
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newGoalTitle}
                                                onChange={(e) => setNewGoalTitle(e.target.value)}
                                                placeholder="Enter goal..."
                                                className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                            />
                                            <button
                                                onClick={handleAddGoalSubmit}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Goals List */}
                            <div className="space-y-3">
                                {goals.length === 0 ? (
                                    <p className="text-slate-500 text-sm text-center py-4">No active goals today.</p>
                                ) : (
                                    goals.map((goal) => (
                                        <div
                                            key={goal.id}
                                            onClick={() => onToggleGoal(goal.id)}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer ${goal.completed
                                                ? 'bg-green-500/5 border-green-500/20'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${goal.completed
                                                        ? 'bg-green-500 border-green-500'
                                                        : 'border-slate-600'
                                                        }`}>
                                                        {goal.completed && <CheckCircle size={12} className="text-black" />}
                                                    </div>
                                                    <span className={`text-sm ${goal.completed
                                                        ? 'text-slate-500 line-through'
                                                        : 'text-white'
                                                        }`}>
                                                        {goal.title}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-yellow-500">+{goal.xpReward || 20} XP</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDeleteGoal(goal.id); }}
                                                        className="text-slate-600 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
