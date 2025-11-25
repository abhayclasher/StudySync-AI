
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
import { CardContainer, CardBody, CardItem } from './ui/3d-card';
import { Particles } from './ui/particles';
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
                            <span className="text-3xl font-bold text-white block">{(user.total_study_hours || 0).toFixed(1)}</span>
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
        <div className="relative w-full min-h-screen">
            {/* Particles Background */}
            <Particles
                className="absolute inset-0 z-0"
                quantity={200}
                ease={60}
                color="#ffffff"
                size={1.2}
                staticity={50}
            />

            <motion.div
                className="space-y-6 pb-10 w-full relative z-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* WELCOME HEADER - Flat Design */}
                <header className="w-full">
                  <div className="relative w-full h-auto rounded-3xl bg-gradient-to-r from-indigo-950/80 to-blue-950/60 border border-white/10 p-6 md:p-8 overflow-hidden shadow-2xl group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" role="presentation" aria-hidden="true"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                      <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl laptop:text-4xl font-bold text-white tracking-tight mb-2">
                          Welcome back, <br className="md:hidden" />
                          <span className="inline-block"><ColourfulText text={user.name} /></span>
                        </h1>
                        <p className="text-slate-300 text-xs md:text-sm lg:text-base laptop:text-lg max-w-lg">
                          You're on a <span className="text-white font-bold">{user.streak || 0} day streak</span>. Keep the momentum going!
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={onToggleTimer}
                          aria-label={isTimerActive ? 'Stop focus timer' : 'Start focus timer'}
                          className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center whitespace-nowrap transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                        >
                          <Zap className="w-3 h-3 mr-2" aria-hidden="true" /> {isTimerActive ? 'Stop Focus' : 'Quick Study'}
                        </button>
                      </div>
                    </div>
                  </div>
                </header>

                {/* QUICK ACTION CARDS */}
                <section aria-labelledby="quick-actions-heading">
                  <h2 id="quick-actions-heading" className="sr-only">Quick Actions</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {[
                      {
                        title: 'Start Quiz',
                        description: 'Test your knowledge',
                        icon: <Target size={20} />,
                        color: 'from-blue-500/20 to-blue-600/10',
                        borderColor: 'border-blue-500/30 hover:border-blue-500/50',
                        iconBg: 'bg-blue-500/10',
                        iconColor: 'text-blue-400',
                        onClick: () => {
                          const event = new CustomEvent('navigate', { detail: 'quiz' });
                          window.dispatchEvent(event);
                        }
                      },
                      {
                        title: 'Resume Video',
                        description: 'Continue learning',
                        icon: <PlayCircle size={20} />,
                        color: 'from-purple-500/20 to-purple-600/10',
                        borderColor: 'border-purple-500/30 hover:border-purple-500/50',
                        iconBg: 'bg-purple-500/10',
                        iconColor: 'text-purple-400',
                        onClick: () => {
                          if (activeCourse && nextStep) {
                            onStartVideo(nextStep, activeCourse.id);
                          }
                        },
                        disabled: !activeCourse || !nextStep
                      },
                      {
                        title: 'Review Cards',
                        description: 'Practice flashcards',
                        icon: <Zap size={20} />,
                        color: 'from-yellow-500/20 to-yellow-600/10',
                        borderColor: 'border-yellow-500/30 hover:border-yellow-500/50',
                        iconBg: 'bg-yellow-500/10',
                        iconColor: 'text-yellow-400',
                        onClick: () => {
                          const event = new CustomEvent('navigate', { detail: 'quiz' });
                          window.dispatchEvent(event);
                        }
                      },
                      {
                        title: 'Ask AI',
                        description: 'Get instant help',
                        icon: <Star size={20} />,
                        color: 'from-emerald-500/20 to-emerald-600/10',
                        borderColor: 'border-emerald-500/30 hover:border-emerald-500/50',
                        iconBg: 'bg-emerald-500/10',
                        iconColor: 'text-emerald-400',
                        onClick: () => {
                          const event = new CustomEvent('navigate', { detail: 'chat' });
                          window.dispatchEvent(event);
                        }
                      }
                    ].map((action, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: action.disabled ? 1 : 1.02, y: action.disabled ? 0 : -2 }}
                        whileTap={{ scale: action.disabled ? 1 : 0.98 }}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        aria-label={action.disabled ? `${action.title} - Currently unavailable` : action.title}
                        className={`
                          relative p-4 md:p-5 rounded-2xl border bg-gradient-to-br backdrop-blur-sm
                          transition-all text-left group overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50
                          ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          ${action.color} ${action.borderColor}
                        `}
                      >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" role="presentation" aria-hidden="true" />

                        <div className="relative z-10">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${action.iconBg} ${action.iconColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`} role="presentation">
                            {React.cloneElement(action.icon, { 'aria-hidden': true })}
                          </div>
                          <h3 className="text-white font-bold text-sm md:text-base mb-1">
                            {action.title}
                          </h3>
                          <p className="text-slate-400 text-xs">
                            {action.description}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </section>

                {/* MOBILE ONLY FOCUS PANEL (xl:hidden) */}
                <div className="xl:hidden grid grid-cols-1 gap-4">
                    {/* Enhanced Timer Card */}
                    <div className="w-full">
                        <div className={`
                        relative rounded-2xl p-6 w-full overflow-hidden transition-all duration-500
                        ${isTimerActive
                                ? 'bg-[#050505] border border-primary/30 shadow-[0_0_30px_rgba(124,58,237,0.15)]'
                                : 'bg-[#050505] border border-white/10 shadow-lg'}
                    `}>
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 opacity-50"></div>

                            <div className="relative z-10 flex flex-col items-center justify-center text-center mb-4">
                                <div className="flex items-center justify-center mb-2">
                                    <div className={`p-2 rounded-full ${isTimerActive ? 'bg-primary/10 text-primary' : 'bg-white/5 text-slate-400'}`}>
                                        <Clock size={16} className={isTimerActive ? 'animate-pulse' : ''} />
                                    </div>
                                </div>
                                <div className="text-2xl md:text-3xl lg:text-4xl laptop:text-5xl font-bold text-white font-mono tracking-wider tabular-nums mb-1 drop-shadow-lg">
                                    {formatTime(timeLeft)}
                                </div>
                                <p className="text-xs md:text-xs lg:text-sm laptop:text-xs uppercase tracking-widest font-medium">
                                    {isTimerActive ? 'Focus Mode On' : 'Ready to Focus'}
                                </p>
                            </div>

                            <div className="relative z-10 flex items-center justify-center gap-3 mb-4">
                              <button
                                onClick={onToggleTimer}
                                aria-label={isTimerActive ? 'Pause focus session' : 'Start focus session'}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-all shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${isTimerActive ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' : 'bg-white text-black hover:bg-slate-200'}`}
                              >
                                {isTimerActive ? <><Pause size={14} className="mr-2" aria-hidden="true" /> Pause Session</> : <><Play size={14} className="mr-2" aria-hidden="true" /> Start Focus</>}
                              </button>
                              <button
                                onClick={onResetTimer}
                                aria-label="Reset timer"
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                              >
                                <RotateCcw size={16} aria-hidden="true" />
                              </button>
                            </div>

                            <div className="relative z-10 flex justify-center gap-2">
                              <button
                                onClick={() => onAdjustTimer(-5)}
                                aria-label="Decrease timer by 5 minutes"
                                className="px-3 py-1 md:px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                              >-5m</button>
                              <button
                                onClick={() => onAdjustTimer(5)}
                                aria-label="Increase timer by 5 minutes"
                                className="px-3 py-1 md:px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                              >+5m</button>
                              <button
                                onClick={() => onAdjustTimer(15)}
                                aria-label="Increase timer by 15 minutes"
                                className="px-3 py-1 md:px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                              >+15m</button>
                            </div>
                        </div>
                    </div>

                    {/* Current Focus (Mobile Position) */}
                    {activeCourse && nextStep && (
                        <div className="w-full">
                            <div className="bg-gradient-to-b from-indigo-950/40 to-[#050505] border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden group w-full h-auto hover:border-indigo-500/40 transition-all hover:shadow-[0_0_30px_rgba(79,70,229,0.1)]">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Target size={80} className="text-indigo-500" /></div>
                                <div className="flex items-center gap-2 mb-2 relative z-10">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                    <span className="text-xs md:text-sm laptop:text-xs font-bold text-indigo-400 uppercase tracking-wider">Current Focus</span>
                                </div>
                                <div className="text-base md:text-lg font-bold text-white mb-1 relative z-10 truncate">
                                    {activeCourse.topic}
                                </div>
                                <div className="text-sm text-indigo-200 mb-4 relative z-10 truncate">
                                    Next: {nextStep.title}
                                </div>
                                <div className="w-full relative z-10">
                                  <button
                                    onClick={() => onStartVideo(nextStep, activeCourse.id)}
                                    aria-label={`Resume learning: ${nextStep.title}`}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm flex items-center justify-center transition-all shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                  >
                                    <PlayCircle size={16} className="mr-2" aria-hidden="true" /> Resume Learning
                                  </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* BENTO GRID STATS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Level', sub: `to Lvl ${(user.level || 1) + 1}`, val: progressToNext.toFixed(0), suffix: '%', icon: <Crown size={14} />, color: 'yellow', bar: true, isNumber: true },
                        { label: 'Total XP', sub: 'Points', val: (user?.xp ?? 0), suffix: '', icon: <Trophy size={14} />, color: 'blue', isNumber: true },
                        { label: 'Streak', sub: 'Days', val: (user.streak || 0), suffix: '', icon: <Flame size={14} />, color: 'orange', isNumber: true },
                        { label: 'Focus', sub: 'Hours', val: (user.total_study_hours || 0), suffix: '', icon: <Clock size={14} />, color: 'emerald', decimals: 1, isNumber: true }
                    ].map((stat, idx) => (
                        <CardContainer key={idx} containerClassName="py-1 w-full h-full" className="w-full h-full">
                            <CardBody className="w-full h-auto min-h-[7rem] md:min-h-[9rem] bg-[#0a0a0a] border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-5 relative group/card hover:shadow-2xl hover:shadow-emerald-500/[0.1] border-white/[0.2] flex flex-col justify-between">
                                <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl md:rounded-2xl`}></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <CardItem translateZ={30} className={`p-1.5 md:p-2 bg-${stat.color}-500/10 rounded-lg text-${stat.color}-400 group-hover:bg-${stat.color}-500/20 transition-colors`}>
                                        {stat.icon}
                                    </CardItem>
                                    <CardItem translateZ={20} className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {stat.label}
                                    </CardItem>
                                </div>
                                <div className="relative z-10 mt-2 md:mt-4">
                                    <CardItem translateZ={50} className="text-base md:text-lg laptop:text-2xl font-bold text-white">
                                        {stat.isNumber ? (
                                            <CountUp
                                                end={typeof stat.val === 'number' ? stat.val : parseFloat(stat.val)}
                                                duration={2}
                                                decimals={stat.decimals || 0}
                                                suffix={stat.suffix}
                                                separator=","
                                            />
                                        ) : (
                                            stat.val
                                        )}
                                    </CardItem>
                                    <CardItem translateZ={30} className="text-[10px] md:text-xs lg:text-xs laptop:text-xs text-slate-400 mt-0.5 md:mt-1 truncate">
                                        {stat.sub}
                                    </CardItem>
                                </div>
                                {stat.bar && (
                                    <CardItem translateZ={40} className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-3 relative z-10">
                                        <motion.div
                                            className="h-full bg-yellow-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stat.val}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                        />
                                    </CardItem>
                                )}
                            </CardBody>
                        </CardContainer>
                    ))}
                </div>

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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COLUMN - CHARTS & ACTIVITY */}
                    <div className="lg:col-span-2 min-h-[400px] flex flex-col h-full">
                        <Tabs tabs={tabs} contentClassName="flex-1" />
                    </div>

                    {/* RIGHT COLUMN - QUESTS & FOCUS */}
                    <div className="space-y-6 lg:mt-20">
                        {/* Current Focus - Only shows if course exists (Desktop Only) */}
                        {activeCourse && nextStep && (
                            <div className="w-full hidden xl:block">
                                <div className="bg-gradient-to-b from-indigo-950/40 to-[#050505] border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden group w-full h-auto hover:border-indigo-500/40 transition-all hover:shadow-[0_0_30px_rgba(79,70,229,0.1)]">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Target size={100} className="text-indigo-500" /></div>
                                    <div className="flex items-center gap-2 mb-2 relative z-10">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                        <span className="text-xs md:text-sm laptop:text-xs font-bold text-indigo-400 uppercase tracking-wider">Current Focus</span>
                                    </div>
                                    <div className="text-base md:text-lg font-bold text-white mb-1 relative z-10 truncate">
                                        {activeCourse.topic}
                                    </div>
                                    <div className="text-sm text-indigo-200 mb-4 relative z-10 truncate">
                                        Next: {nextStep.title}
                                    </div>
                                    <div className="w-full relative z-10">
                                        <button
                                          onClick={() => onStartVideo(nextStep, activeCourse.id)}
                                          aria-label={`Resume learning: ${nextStep.title}`}
                                          className="w-full py-2 md:py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs md:text-sm laptop:text-sm flex items-center justify-center transition-all shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        >
                                          <PlayCircle size={16} className="mr-2" aria-hidden="true" /> Resume Learning
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dynamic Daily Quests */}
                        <div className="w-full">
                            <div className="bg-[#050505] border border-white/10 rounded-2xl p-6 w-full h-auto shadow-lg hover:border-white/20 transition-colors">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="font-bold text-white flex items-center">
                                        <Star className="w-4 h-4 mr-2 text-yellow-500" /> Daily Quests
                                    </div>
                                    {/* Add Goal Button (Mobile Only) */}
                                    <button
                                      onClick={() => setIsAddingGoal(!isAddingGoal)}
                                      aria-label={isAddingGoal ? 'Cancel adding goal' : 'Add new goal'}
                                      aria-expanded={isAddingGoal}
                                      className="xl:hidden p-1 md:p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                      <Plus size={16} aria-hidden="true" />
                                    </button>
                                </div>

                                {/* Add Goal Form (Mobile Only) */}
                                <AnimatePresence>
                                    {isAddingGoal && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                                            animate={{ height: 'auto', opacity: 1, marginBottom: 12 }}
                                            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="flex gap-2">
                                                <input
                                                  type="text"
                                                  id="new-goal-input"
                                                  value={newGoalTitle}
                                                  onChange={(e) => setNewGoalTitle(e.target.value)}
                                                  placeholder="Enter goal..."
                                                  className="flex-1 bg-black border border-white/10 rounded-lg px-2 md:px-3 py-1 md:py-2 text-xs text-white focus:border-primary outline-none"
                                                  aria-label="New goal title"
                                                />
                                                <button
                                                  onClick={handleAddGoalSubmit}
                                                  aria-label="Add goal"
                                                  className="bg-primary text-white px-2 md:px-3 py-1 md:py-2 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                >Add</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-3">
                                    {goals.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No active quests today.</p>}
                                    {goals.map((quest, i) => (
                                        <div
                                            key={i}
                                            onClick={() => onToggleGoal(quest.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group ${quest.completed ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${quest.completed ? 'bg-green-500 border-green-500 text-black' : 'border-slate-600 text-transparent group-hover:border-white/50'}`}>
                                                    <CheckCircle size={12} />
                                                </div>
                                                <span className={`text-sm md:text-base truncate ${quest.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{quest.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs md:text-sm font-bold text-yellow-500 flex-shrink-0">+{quest.xpReward || 20} XP</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteGoal(quest.id); }}
                                                    className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity xl:hidden"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                {/* Show delete on desktop hover too if we want uniform functionality, but sidebar handles it there. keeping dashboard clean for desktop. */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteGoal(quest.id); }}
                                                    className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block xl:hidden"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
