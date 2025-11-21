
import React, { useEffect, useState } from 'react';
import { UserProfile, RoadmapCourse, RoadmapStep, Goal } from '../types';
import { getRoadmaps } from '../services/db';
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
    Cell
} from 'recharts';
import { Flame, Clock, Trophy, Target, Zap, Activity, PieChart as PieIcon, Crown, CheckCircle, PlayCircle, Lock, Star, Trash2, Plus, Pause, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ColourfulText from './ui/colourful-text';
import { Tabs } from './ui/tabs';
import { CardContainer, CardBody, CardItem } from './ui/3d-card';

interface DashboardProps {
    user: UserProfile;
    goals: Goal[];
    isTimerActive: boolean;
    timeLeft: number;
    onToggleTimer: () => void;
    onResetTimer: () => void;
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
    onAddGoal,
    onToggleGoal,
    onDeleteGoal,
    onStartVideo
}) => {
    const [activeCourse, setActiveCourse] = useState<RoadmapCourse | null>(null);
    const [nextStep, setNextStep] = useState<RoadmapStep | null>(null);
    const [loadingActive, setLoadingActive] = useState(true);

    // Local state for adding goals on mobile
    const [isAddingGoal, setIsAddingGoal] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');

    useEffect(() => {
        const loadActiveCourse = async () => {
            try {
                const courses = await getRoadmaps();
                console.log('Loaded courses for dashboard:', courses.length);

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

                console.log('Active course:', current?.topic);
                setActiveCourse(current);
                if (current) {
                    const next = current.steps.find(s => s.status !== 'completed') || current.steps[0];
                    console.log('Next step:', next?.title);
                    setNextStep(next);
                }
            } catch (error) {
                console.error('Error loading active course:', error);
            } finally {
                setLoadingActive(false);
            }
        };
        loadActiveCourse();
    }, [user.id]); // Reload when user changes

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
        { name: 'Tue', hours: 0, videos: 0, quizzes: 0 },
        { name: 'Wed', hours: 0, videos: 0, quizzes: 0 },
        { name: 'Thu', hours: 0, videos: 0, quizzes: 0 },
        { name: 'Fri', hours: 0, videos: 0, quizzes: 0 },
        { name: 'Sat', hours: 0, videos: 0, quizzes: 0 },
        { name: 'Sun', hours: 0, videos: 0, quizzes: 0 },
    ];

    const weeklyData = rawWeeklyData.map(d => ({
        ...d,
        videos: d.videos || 0,
        quizzes: d.quizzes || 0
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
            <div className="lg:col-span-2 h-full min-h-[300px]">
                <div className="bg-[#050505] border border-white/10 rounded-2xl p-6 relative w-full h-full flex flex-col shadow-lg hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-lg font-bold text-white flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-primary" /> Weekly Progress
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5">Completed Items</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} opacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#555"
                                    tick={{ fill: '#777', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#555"
                                    tick={{ fill: '#777', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' as any }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="videos" name="Videos" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="quizzes" name="Quizzes" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
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
                                <PieChart>
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
                                        itemStyle={{ fontSize: '12px', fontWeight: 600 }}
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
        <motion.div
            className="space-y-6 pb-10 w-full overflow-x-hidden"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* WELCOME HEADER - Flat Design */}
            <div className="w-full">
                <div className="relative w-full h-auto rounded-3xl bg-gradient-to-r from-indigo-950/80 to-blue-950/60 border border-white/10 p-6 md:p-8 overflow-hidden shadow-2xl group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                                Welcome back, <br className="md:hidden" />
                                <span className="inline-block"><ColourfulText text={user.name} /></span>
                            </h1>
                            <p className="text-slate-300 text-base md:text-lg max-w-lg">
                                You're on a <span className="text-white font-bold">{user.streak || 0} day streak</span>. Keep the momentum going!
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onToggleTimer}
                                className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center whitespace-nowrap transform hover:scale-105 active:scale-95"
                            >
                                <Zap className="w-4 h-4 mr-2" /> {isTimerActive ? 'Stop Focus' : 'Quick Study'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MOBILE ONLY FOCUS PANEL (xl:hidden) */}
            <div className="xl:hidden grid grid-cols-1 gap-4">
                {/* Timer Card */}
                <div className="bg-[#050505] border border-white/10 rounded-2xl p-5 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50"></div>
                    <div className="relative z-10">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center"><Clock size={12} className="mr-1" /> Focus Timer</div>
                        <div className="text-3xl font-bold text-white font-mono tabular-nums">{formatTime(timeLeft)}</div>
                    </div>
                    <div className="relative z-10 flex gap-2">
                        <button
                            onClick={onToggleTimer}
                            className={`p-3 rounded-xl transition-all ${isTimerActive ? 'bg-red-500/20 text-red-400' : 'bg-primary text-white'}`}
                        >
                            {isTimerActive ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button onClick={onResetTimer} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400"><RotateCcw size={20} /></button>
                    </div>
                </div>
            </div>

            {/* BENTO GRID STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Level', sub: `to Level ${(user.level || 1) + 1}`, val: `${progressToNext.toFixed(0)}%`, icon: <Crown size={20} />, color: 'yellow', bar: true },
                    { label: 'Total XP', sub: 'Points earned', val: (user?.xp ?? 0).toLocaleString(), icon: <Trophy size={20} />, color: 'blue' },
                    { label: 'Streak', sub: 'Keep it up!', val: `${user.streak || 0} days`, icon: <Flame size={20} />, color: 'orange' },
                    { label: 'Focus', sub: 'Lifetime logged', val: `${(user.total_study_hours || 0).toFixed(1)} hrs`, icon: <Clock size={20} />, color: 'emerald' }
                ].map((stat, idx) => (
                    <CardContainer key={idx} containerClassName="py-2 w-full h-full" className="w-full h-full">
                        <CardBody className="w-full h-auto min-h-[8rem] md:min-h-[9rem] bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 relative group/card hover:shadow-2xl hover:shadow-emerald-500/[0.1] border-white/[0.2] flex flex-col justify-between">
                            <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}></div>
                            <div className="flex justify-between items-start relative z-10">
                                <CardItem translateZ={30} className={`p-2 bg-${stat.color}-500/10 rounded-lg text-${stat.color}-400 group-hover:bg-${stat.color}-500/20 transition-colors`}>
                                    {stat.icon}
                                </CardItem>
                                <CardItem translateZ={20} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {stat.label}
                                </CardItem>
                            </div>
                            <div className="relative z-10 mt-4">
                                <CardItem translateZ={50} className="text-2xl font-bold text-white">
                                    {stat.val}
                                </CardItem>
                                <CardItem translateZ={30} className="text-xs text-slate-400 mt-1">
                                    {stat.sub}
                                </CardItem>
                            </div>
                            {stat.bar && (
                                <CardItem translateZ={40} className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-3 relative z-10">
                                    <div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: stat.val }}></div>
                                </CardItem>
                            )}
                        </CardBody>
                    </CardContainer>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN - CHARTS & ACTIVITY */}
                <div className="lg:col-span-2 min-h-[400px]">
                    <Tabs tabs={tabs} />
                </div>

                {/* RIGHT COLUMN - QUESTS & FOCUS */}
                <div className="space-y-6 lg:mt-20">
                    {/* Current Focus - Only shows if course exists */}
                    {activeCourse && nextStep && (
                        <div className="w-full">
                            <div className="bg-gradient-to-b from-indigo-950/40 to-[#050505] border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden group w-full h-auto hover:border-indigo-500/40 transition-all hover:shadow-[0_0_30px_rgba(79,70,229,0.1)]">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Target size={100} className="text-indigo-500" /></div>
                                <div className="flex items-center gap-2 mb-2 relative z-10">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Current Focus</span>
                                </div>
                                <div className="text-lg font-bold text-white mb-1 relative z-10 truncate">
                                    {activeCourse.topic}
                                </div>
                                <div className="text-sm text-indigo-200 mb-4 relative z-10 truncate">
                                    Next: {nextStep.title}
                                </div>
                                <div className="w-full relative z-10">
                                    <button
                                        onClick={() => onStartVideo(nextStep, activeCourse.id)}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm flex items-center justify-center transition-all shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40 active:scale-95"
                                    >
                                        <PlayCircle size={16} className="mr-2" /> Resume Learning
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
                                    className="xl:hidden p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
                                    <Plus size={16} />
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
                                                value={newGoalTitle}
                                                onChange={(e) => setNewGoalTitle(e.target.value)}
                                                placeholder="Enter goal..."
                                                className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-primary outline-none"
                                            />
                                            <button onClick={handleAddGoalSubmit} className="bg-primary text-white px-3 py-2 rounded-lg text-xs font-bold">Add</button>
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
                                            <span className={`text-sm truncate ${quest.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{quest.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-yellow-500 flex-shrink-0">+{quest.xpReward || 20} XP</span>
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
    );
};

export default Dashboard;
