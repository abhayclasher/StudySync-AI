
import React, { useEffect, useState } from 'react';
import { UserProfile, RoadmapCourse, RoadmapStep, Goal, ViewState } from '../types';
import { getRoadmaps, getStudyStreakData, getQuizAnalytics, QuizAnalytics } from '../services/db';
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
import { Flame, Clock, Trophy, Target, Zap, Activity, PieChart as PieIcon, Crown, CheckCircle, PlayCircle, Lock, Star, Trash2, Plus, Pause, Play, RotateCcw, Sparkles, Brain, Rocket, BookOpen, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import ColourfulText from './ui/colourful-text';
import confetti from 'canvas-confetti';

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
    onNavigate: (view: ViewState) => void;
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
    onStartVideo,
    onNavigate
}) => {
    const [activeCourse, setActiveCourse] = useState<RoadmapCourse | null>(null);
    const [nextStep, setNextStep] = useState<RoadmapStep | null>(null);
    const [loadingActive, setLoadingActive] = useState(false);
    const [streakData, setStreakData] = useState<Record<string, number>>({});
    const [analytics, setAnalytics] = useState<QuizAnalytics[]>([]);

    // Local state for adding goals on mobile
    const [isAddingGoal, setIsAddingGoal] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [imageError, setImageError] = useState(false);

    // Smart Insight Logic
    const extractYouTubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Helper to find a matching course and its next incomplete step
    const findNextChallenge = (topic: string, courses: RoadmapCourse[]) => {
        // 1. Try exact topic match or substring match
        let course = courses.find(c => c.topic.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(c.topic.toLowerCase()));

        // 2. If topic is a URL, try to find it in the course steps by matching Video IDs
        if (!course) {
            const topicId = extractYouTubeId(topic);
            if (topicId) {
                course = courses.find(c => c.steps.some(s => {
                    const stepId = extractYouTubeId(s.videoUrl || '');
                    return stepId === topicId;
                }));
            }
        }

        if (!course) return null;

        const nextStep = course.steps.find(s => s.status !== 'completed') || course.steps[0];
        return { step: nextStep, courseId: course.id, courseTopic: course.topic };
    };

    const generateSmartInsight = (userData: UserProfile, quizData: QuizAnalytics[], courses: RoadmapCourse[]) => {
        if (!userData || !quizData) return { text: "Welcome back! Ready to learn something new today?", type: 'neutral' };

        // 1. Check Streak
        if (userData.streak && userData.streak >= 3) {
            return {
                text: `You're on a ${userData.streak}-day streak! 🔥 Consistency is key—keep it up!`,
                type: 'success'
            };
        }

        // 2. Check Weak Areas
        const weakArea = quizData.find(q => q.avg_score_percentage < 60 && q.attempts > 0);
        if (weakArea) {
            // Try to find a nice name for the weak area
            const courseMatch = findNextChallenge(weakArea.topic, courses);
            const displayTopic = courseMatch ? courseMatch.courseTopic : (weakArea.topic.startsWith('http') ? 'this topic' : weakArea.topic);

            return {
                text: `Improve your mastery in ${displayTopic}. 📉 A quick review could boost your score!`,
                type: 'warning',
                link: weakArea.topic // Track topic for potential linking
            };
        }

        // 3. Check Strong Areas
        const strongArea = quizData.find(q => q.avg_score_percentage > 85);
        if (strongArea) {
            const challenge = findNextChallenge(strongArea.topic, courses);

            if (challenge) {
                return {
                    text: `You're crushing it in ${challenge.courseTopic}! 🌟 Ready for a harder challenge?`,
                    type: 'success',
                    step: challenge.step,
                    courseId: challenge.courseId
                };
            }

            // Fallback if we can't find the course but want to show success
            const displayTopic = strongArea.topic.startsWith('http') ? 'your recent lessons' : strongArea.topic;
            return {
                text: `You're crushing it in ${displayTopic}! 🌟 Keep up the great work!`,
                type: 'success'
            };
        }

        // 4. Default Motivation
        return {
            text: "Consistency builds mastery. 🚀 Start a short session today to keep moving forward.",
            type: 'neutral'
        };
    };

    const [aiInsight, setAiInsight] = useState<{ text: string; type: string; step?: RoadmapStep; courseId?: string; link?: string }>({
        text: "Analyzing your learning patterns...",
        type: 'neutral'
    });

    useEffect(() => {
        const fetchInsights = async () => {
            const [analyticsData, coursesData] = await Promise.all([
                getQuizAnalytics(),
                getRoadmaps()
            ]);
            setAnalytics(analyticsData);
            setAiInsight(generateSmartInsight(user, analyticsData, coursesData));
        };
        fetchInsights();
    }, [user]);

    // Time-based Greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleGoalToggle = (id: string) => {
        onToggleGoal(id);
        const goal = goals.find(g => g.id === id);
        if (goal && !goal.completed) {
            // Trigger confetti if completing
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    };

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

            // 3. If still nothing and we have courses, just show the first one
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
    }, []);

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
                {/* WELCOME HEADER - Enhanced */}
                <header className="w-full">
                    <div className="relative w-full rounded-2xl bg-[#050505] border border-white/10 p-5 md:p-7 overflow-hidden shadow-2xl relative group">
                        {/* Animated Mesh Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
                        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
                        <div className="absolute top-40 left-10 w-40 h-40 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none" />

                        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-2 border-white/10 overflow-hidden shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 hidden md:flex items-center justify-center text-2xl font-bold text-white shrink-0">
                                        {user.avatar_url && !imageError ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                                onError={() => setImageError(true)}
                                            />
                                        ) : (
                                            user.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 hidden md:block">
                                        <div className="w-5 h-5 bg-green-500 rounded-full border-4 border-[#050505]" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight" style={{ textWrap: 'balance' }}>
                                        {getGreeting()}, <ColourfulText text={user.name.split(' ')[0]} />
                                    </h1>
                                    <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                                        <span className="inline-flex items-center justify-center align-text-bottom mr-1.5">
                                            <Flame size={16} className="text-orange-500 fill-orange-500" />
                                        </span>
                                        You're on a <span className="text-white font-bold whitespace-nowrap">{user.streak || 0} Day Streak</span>. Keep the momentum going!
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full lg:w-auto">
                                <button
                                    onClick={onToggleTimer}
                                    className={`flex-1 lg:flex-none px-6 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${isTimerActive
                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 hover:shadow-blue-600/30'
                                        }`}
                                >
                                    <Zap className={`w-4 h-4 ${isTimerActive ? 'animate-pulse' : 'fill-white'}`} />
                                    {isTimerActive ? `Stop Focus (${formatTime(timeLeft)})` : 'Quick Study'}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* DASHBOARD WIDGETS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 1. AI Insight Widget */}
                    <div className={`md:col-span-2 bg-gradient-to-br ${aiInsight.type === 'success' ? 'from-green-900/20 border-green-500/20 hover:border-green-500/40' : aiInsight.type === 'warning' ? 'from-red-900/20 border-red-500/20 hover:border-red-500/40' : 'from-purple-900/20 border-purple-500/20 hover:border-purple-500/40'} to-[#0a0a0a] border rounded-xl p-5 relative overflow-hidden shadow-lg group transition-all`}>
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${aiInsight.type === 'success' ? 'bg-green-500/10' : aiInsight.type === 'warning' ? 'bg-red-500/10' : 'bg-purple-500/10'}`} />
                        <div className="flex items-start gap-4 relative z-10 h-full">
                            <div className={`p-3 rounded-xl shrink-0 ${aiInsight.type === 'success' ? 'bg-green-500/20 text-green-400' : aiInsight.type === 'warning' ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                <Sparkles size={24} />
                            </div>
                            <div className="flex-1 flex flex-col justify-between h-full">
                                <div>
                                    <h3 className={`text-sm font-bold uppercase tracking-widest mb-1 flex items-center gap-2 ${aiInsight.type === 'success' ? 'text-green-300' : aiInsight.type === 'warning' ? 'text-red-300' : 'text-purple-300'}`}>
                                        AI Smart Insight <span className={`px-2 py-0.5 rounded text-[10px] text-white ${aiInsight.type === 'success' ? 'bg-green-500/20' : aiInsight.type === 'warning' ? 'bg-red-500/20' : 'bg-purple-500/20'}`}>BETA</span>
                                    </h3>

                                    {/* VIDEO CARD or TEXT */}
                                    {aiInsight.step ? (
                                        <div className="flex flex-col gap-2 mb-3">
                                            <p className="text-white text-sm font-medium">{aiInsight.text}</p>
                                            <div
                                                className="flex items-center gap-3 bg-black/40 p-2 rounded-lg border border-white/5 hover:border-white/20 transition-all cursor-pointer group/video"
                                                onClick={() => {
                                                    if (aiInsight.step && aiInsight.courseId) {
                                                        onStartVideo(aiInsight.step, aiInsight.courseId);
                                                    }
                                                }}
                                            >
                                                <div className="relative w-24 h-16 rounded-md overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={aiInsight.step.thumbnail || `https://img.youtube.com/vi/${aiInsight.step.videoUrl?.split('v=')[1]}/mqdefault.jpg`}
                                                        alt="Video Thumbnail"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/video:bg-black/10 transition-all">
                                                        <PlayCircle size={20} className="text-white/80" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-white/90 line-clamp-1">{aiInsight.step.title}</span>
                                                    <span className="text-[10px] text-slate-400">Tap to Start Lesson</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-white text-sm md:text-base leading-relaxed font-medium mb-3">
                                            "{aiInsight.text}"
                                        </p>
                                    )}
                                </div>
                                {aiInsight.type === 'warning' && (
                                    <button
                                        onClick={() => onNavigate(ViewState.QUIZ_ANALYTICS)}
                                        className="self-start px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Brain size={14} /> Review Weak Areas
                                    </button>
                                )}
                                {aiInsight.type !== 'warning' && (
                                    <button
                                        onClick={() => onNavigate(ViewState.PRACTICE)}
                                        className="self-start px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Rocket size={14} /> Start Practice
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* 2. Quick Actions Hub */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex flex-col justify-center">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-2 h-full">
                            <button
                                onClick={() => onNavigate(ViewState.PRACTICE)}
                                className="flex flex-col items-center justify-center p-3 text-center bg-white/5 hover:bg-white/10 rounded-lg group transition-all"
                            >
                                <Rocket size={20} className="mb-2 text-yellow-400 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold text-slate-300">Speed Blitz</span>
                            </button>
                            <button
                                onClick={() => onNavigate(ViewState.QUIZ_ANALYTICS)}
                                className="flex flex-col items-center justify-center p-3 text-center bg-white/5 hover:bg-white/10 rounded-lg group transition-all"
                            >
                                <Brain size={20} className="mb-2 text-pink-400 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold text-slate-300">Review Weak</span>
                            </button>
                            <button
                                onClick={() => onNavigate(ViewState.NOTES)}
                                className="flex flex-col items-center justify-center p-3 text-center bg-white/5 hover:bg-white/10 rounded-lg group transition-all"
                            >
                                <BookOpen size={20} className="mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold text-slate-300">Notes</span>
                            </button>
                            <button
                                onClick={() => onNavigate(ViewState.PRACTICE)}
                                className="flex flex-col items-center justify-center p-3 text-center bg-white/5 hover:bg-white/10 rounded-lg group transition-all"
                            >
                                <Target size={20} className="mb-2 text-emerald-400 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold text-slate-300">Mock Test</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* STATS GRID - Enhanced Visuals */}
                <section>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Level Progress', sub: `Level ${(user.level || 1)}`, val: progressToNext.toFixed(0), suffix: '%', icon: <Crown size={20} />, color: 'text-yellow-400', border: 'hover:border-yellow-500/50', bg: 'hover:shadow-yellow-500/10' },
                            { label: 'Total XP', sub: 'Lifetime Points', val: (user?.xp ?? 0), suffix: '', icon: <Trophy size={20} />, color: 'text-blue-400', border: 'hover:border-blue-500/50', bg: 'hover:shadow-blue-500/10' },
                            { label: 'Streak', sub: 'Consistency', val: (user.streak || 0), suffix: ' Days', icon: <Flame size={20} />, color: 'text-orange-400', border: 'hover:border-orange-500/50', bg: 'hover:shadow-orange-500/10' },
                            { label: 'Study Time', sub: 'Total Hours', val: (user.total_study_hours || 0), suffix: 'h', icon: <Clock size={20} />, color: 'text-emerald-400', decimals: 1, border: 'hover:border-emerald-500/50', bg: 'hover:shadow-emerald-500/10' }
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className={`bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 transition-all duration-300 group hover:shadow-lg ${stat.border} ${stat.bg}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-2.5 rounded-xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                                        {stat.icon}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {stat.label}
                                    </span>
                                </div>
                                <div className="text-3xl font-extrabold text-white mb-1 tracking-tight">
                                    <CountUp
                                        end={typeof stat.val === 'number' ? stat.val : parseFloat(stat.val)}
                                        duration={2}
                                        decimals={stat.decimals || 0}
                                        suffix={stat.suffix}
                                        separator=","
                                    />
                                </div>
                                <div className="text-xs text-slate-400 font-medium">
                                    {stat.sub}
                                </div>
                                {stat.label === 'Level Progress' && (
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-4">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
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
                        {/* Current Focus Card - Enhanced */}
                        {activeCourse && nextStep && (
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                            <Target size={14} className="text-blue-400" />
                                        </div>
                                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Current Focus</span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{activeCourse.topic}</h3>
                                    <p className="text-slate-400 text-sm mb-6 flex items-center gap-2">
                                        <ArrowRight size={14} /> {nextStep.title}
                                    </p>

                                    <button
                                        onClick={() => onStartVideo(nextStep, activeCourse.id)}
                                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:shadow-blue-900/40"
                                    >
                                        <PlayCircle size={18} className="mr-2 fill-white/20" /> Resume Learning
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Daily Goals - Interactive */}
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Star size={18} className="text-yellow-500 fill-yellow-500" />
                                    <h3 className="font-bold text-white">Daily Goals</h3>
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
                                    <p className="text-slate-500 text-sm text-center py-4 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                        No active goals today. <br /> <span className="text-xs opacity-50">Add one to get started!</span>
                                    </p>
                                ) : (
                                    goals.map((goal) => (
                                        <div
                                            key={goal.id}
                                            onClick={() => handleGoalToggle(goal.id)}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer group ${goal.completed
                                                ? 'bg-green-500/5 border-green-500/20'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${goal.completed
                                                        ? 'bg-green-500 border-green-500'
                                                        : 'border-slate-600 group-hover:border-slate-400'
                                                        }`}>
                                                        {goal.completed && <CheckCircle size={14} className="text-black" />}
                                                    </div>
                                                    <span className={`text-sm font-medium ${goal.completed
                                                        ? 'text-slate-500 line-through'
                                                        : 'text-white'
                                                        }`}>
                                                        {goal.title}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-bold ${goal.completed ? 'text-green-500/50' : 'text-yellow-500'}`}>+{goal.xpReward || 20} XP</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDeleteGoal(goal.id); }}
                                                        className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
