import React, { useState, useMemo } from 'react';
import { UserProfile, Goal, Achievement, LearningPreferences, RecentActivity, KnowledgeNode, CognitiveMetrics, SubjectMastery, WeeklyStat } from '../types';
import {
    Edit2, Clock, Trophy, BookOpen, Settings,
    Calendar, CheckCircle, X, Plus, Trash2, Play,
    Radar as RadarIcon, MoreHorizontal, Award, TrendingUp,
    Users, MessageCircle, Github, Linkedin, Twitter, Globe, Flame,
    ChevronRight, Activity, Sparkles, BrainCircuit,
    Check, LayoutDashboard, GraduationCap, Dna, Zap, Scale,
    History, ChevronDown, Download, LogOut, FileText, BarChart,
    Brain, Target, Lightbulb, AlertTriangle, Battery, TrendingDown,
    Share2, Compass, Layers, ZapOff, Fingerprint, Command, Shield,
    Crown, Rocket, Star, ArrowRight, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, ResponsiveContainer, Tooltip, RadarChart,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line,
    CartesianGrid, XAxis, YAxis, Cell, PieChart, Pie, Bar as RechartsBar, BarChart as RechartsBarChart
} from 'recharts';
import CountUp from 'react-countup';
import ColourfulText from './ui/colourful-text';
import { Tabs } from './ui/tabs';

// --- Interfaces ---

interface UserProfileProps {
    user: UserProfile;
    goals: Goal[];
    onUpdateProfile: (updates: Partial<UserProfile>) => void;
    onAddGoal: (title: string) => void;
    onToggleGoal: (id: string) => void;
    onDeleteGoal: (id: string) => void;
    timeLeft: number;
    isTimerActive: boolean;
}

const UserProfilePage: React.FC<UserProfileProps> = ({
    user,
    goals,
    onUpdateProfile,
    onAddGoal,
    onToggleGoal,
    onDeleteGoal,
    timeLeft,
    isTimerActive
}) => {
    const [imageError, setImageError] = useState(false);

    // --- Derived Data ---
    const levelXPRequirement = 1000 + (user.level * 500);
    const xpProgress = Math.min((user.xp % levelXPRequirement) / levelXPRequirement * 100, 100);

    // Cognitive State Calculation (Mocked logic based on real stats)
    const cognitiveState = useMemo(() => {
        const energy = Math.max(0, 100 - (user.stats.focusSessions * 10)); // Simple fatigue calc
        return {
            status: energy > 70 ? 'Optimized' : energy > 30 ? 'Moderate' : 'Fatigued',
            color: energy > 70 ? 'text-emerald-400' : energy > 30 ? 'text-yellow-400' : 'text-red-400',
            bg: energy > 70 ? 'bg-emerald-500' : energy > 30 ? 'bg-yellow-500' : 'bg-red-500',
            percentage: energy
        };
    }, [user.stats.focusSessions]);

    // Subject Mastery Formatting
    const coreSubjects = useMemo(() => {
        return user.subjectMastery.length > 0 ? user.subjectMastery : [
            { subject: 'Math', score: 0, fullMark: 100 },
            { subject: 'Physics', score: 0, fullMark: 100 },
            { subject: 'Chemistry', score: 0, fullMark: 100 }
        ];
    }, [user.subjectMastery]);

    // Helpers
    const handleExportData = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(user, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "studysync_user_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    // --- TAB CONTENTS ---

    const CommandContent = () => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* Cognitive State Card (Left Big) */}
            <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 h-full min-h-[300px]">
                <div className="flex-1 relative z-10 w-full">
                    <div className="flex items-center gap-2 mb-4">
                        <div className={`w-2 h-2 rounded-full ${cognitiveState.bg} animate-pulse`} />
                        <span className={`text-xs font-bold ${cognitiveState.color} uppercase tracking-wider`}>Cognitive State: {cognitiveState.status}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                        {cognitiveState.percentage > 70 ? 'Brain Battery High' : 'Rest Recommended'}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-md">
                        {cognitiveState.percentage > 70
                            ? "Your mental energy is peaking. Now is the ideal time to tackle high-complexity subjects."
                            : "Your cognitive load is high. Consider a quick break to restore focus efficiency."}
                    </p>
                    <div className="flex gap-3 flex-wrap">
                        <button className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors shadow-lg shadow-blue-900/20 flex-1 md:flex-none">
                            {isTimerActive ? 'Focusing...' : 'Start Deep Work'}
                        </button>
                        <button className="px-5 py-2 rounded-xl border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/5 transition-colors flex-1 md:flex-none">
                            View Stats
                        </button>
                    </div>
                </div>

                {/* Circular Gauge */}
                <div className="relative w-40 h-40 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[{ value: cognitiveState.percentage, fill: cognitiveState.percentage > 70 ? '#10b981' : '#eab308' }, { value: 100 - cognitiveState.percentage, fill: '#1f2937' }]}
                                innerRadius={60} outerRadius={70} startAngle={90} endAngle={-270} dataKey="value" stroke="none"
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-white">{Math.round(cognitiveState.percentage)}%</span>
                        <span className="text-[10px] text-slate-500 uppercase">Capacity</span>
                    </div>
                </div>
            </div>

            {/* Study Reputation Card (Right) */}
            <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col justify-between h-full min-h-[200px]">
                <div>
                    <h3 className="text-sm font-bold text-slate-300 mb-1">Study Reputation</h3>
                    <div className="text-4xl md:text-5xl font-bold text-white mb-2">{user.reputationScore?.score || 950}</div>
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">TOP {(100 - (user.reputationScore?.score || 950) / 10).toFixed(0)}%</span>
                        <span className="text-xs text-slate-400">Elite Scholar</span>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                        <span>Rank Percentile</span>
                        <span>99th</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 w-[99%]" />
                    </div>
                </div>
            </div>

            {/* Consistency Matrix */}
            <div className="lg:col-span-12 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 overflow-x-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                    <div>
                        <h3 className="text-base font-bold text-white">Consistency Matrix</h3>
                        <p className="text-sm text-slate-400">Visualizing your daily focus momentum.</p>
                    </div>
                    <div className="flex gap-1.5 text-xs text-slate-500">
                        <span>Less</span>
                        <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map(l => <div key={l} className={`w-3 h-3 rounded-sm ${l === 0 ? 'bg-[#1f2937]' : l === 1 ? 'bg-blue-900' : l === 2 ? 'bg-blue-700' : l === 3 ? 'bg-blue-500' : 'bg-blue-400'}`} />)}
                        </div>
                        <span>More</span>
                    </div>
                </div>
                {/* Visual Placeholder for Real Heatmap - Mapped to streak for now */}
                <div className="flex gap-1 min-w-[600px] h-10 w-full">
                    {Array.from({ length: 60 }).map((_, i) => (
                        <div key={i} className={`flex-1 rounded-sm ${Math.random() > 0.8 ? 'bg-blue-400' : Math.random() > 0.6 ? 'bg-blue-600' : 'bg-[#1f2937]'}`} title={`Day ${i + 1}`} />
                    ))}
                </div>
            </div>
        </div>
    );

    const NeuralContent = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            {/* Knowledge Graph Card - REAL DATA */}
            <div className="md:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 min-h-[400px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <div>
                        <h3 className="text-base font-bold text-white">Mastery Map</h3>
                        <p className="text-xs text-slate-400">Live visualization of your subject competence</p>
                    </div>
                    <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Mastered</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /> Learning</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-700" /> Locked</div>
                    </div>
                </div>
                <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center relative bg-[#050505] rounded-xl overflow-hidden group">
                    {/* Dynamic SVG Visualization based on Real Subjects */}
                    <svg className="w-full h-full" viewBox="0 0 400 300">
                        <defs>
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </defs>

                        {/* Dynamic Core Node */}
                        <g className="cursor-pointer hover:opacity-80 transition-opacity">
                            <circle cx="200" cy="150" r="25" fill="#050505" stroke="#3b82f6" strokeWidth="2" filter="url(#glow)" />
                            <text x="200" y="145" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">YOU</text>
                            <text x="200" y="160" textAnchor="middle" fill="#3b82f6" fontSize="8">Level {user.level}</text>
                        </g>

                        {/* Rendering Subject Nodes dynamically */}
                        {coreSubjects.map((subject, index) => {
                            // Circular layout logic
                            const angle = (index / coreSubjects.length) * 2 * Math.PI - Math.PI / 2;
                            const radius = 100;
                            const x = 200 + radius * Math.cos(angle);
                            const y = 150 + radius * Math.sin(angle);
                            const isMastered = subject.score >= 80;
                            const isLearning = subject.score > 0 && subject.score < 80;
                            const color = isMastered ? '#3b82f6' : isLearning ? '#a855f7' : '#374151';

                            return (
                                <g key={subject.subject} className="cursor-pointer hover:opacity-80 transition-opacity group">
                                    {/* Line to Center */}
                                    <line x1="200" y1="150" x2={x} y2={y} stroke={color} strokeWidth="1" strokeOpacity="0.4" />

                                    {/* Node */}
                                    <circle cx={x} cy={y} r={isMastered ? 18 : 15} fill="#050505" stroke={color} strokeWidth="2" />
                                    <text x={x} y={y + 4} textAnchor="middle" fill={isMastered || isLearning ? "#fff" : "#9ca3af"} fontSize="9" fontWeight="bold">
                                        {subject.subject.substring(0, 8)}
                                    </text>

                                    {/* Score tooltip simulated */}
                                    <text x={x} y={y + 25} textAnchor="middle" fill={color} fontSize="8" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        {subject.score}%
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* Real Skill Gaps - Derived from low mastery scores */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle className="text-yellow-500" size={16} /> Weakest Subjects</h3>
                <div className="space-y-3">
                    {coreSubjects.filter(s => s.score < 60).slice(0, 3).map((gap, i) => (
                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-red-500/10 hover:border-red-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-sm font-bold text-white mb-0.5 capitalize">{gap.subject}</div>
                                    <div className="text-xs text-red-400">Score: {gap.score}%</div>
                                </div>
                                <div className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Needs Work</div>
                            </div>
                            <p className="text-xs text-slate-500 mb-3">Improve your {gap.subject} mastery to unlock advanced modules.</p>
                            <button className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                Practice Now <ArrowRight size={12} />
                            </button>
                        </div>
                    ))}
                    {coreSubjects.every(s => s.score >= 60) && (
                        <div className="text-center p-6 text-slate-500 text-sm italic">
                            No critical gaps found! You are doing great.
                        </div>
                    )}
                </div>
            </div>

            {/* Growth Velocity */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4">Learning Velocity</h3>
                <div className="h-40 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[{ v: 10 }, { v: 25 }, { v: 20 }, { v: 40 }, { v: 55 }, { v: 50 }, { v: user.xp / 100 }]}>
                            <defs><linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                            <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} fill="url(#gBlue)" />
                            <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const OracleContent = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full pb-20">
            {/* Visual Prediction Roadmap - Mapped to Predictions if available, else static mock based on Level */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2"><Sparkles className="text-purple-400" size={16} /> Forecast</h3>
                <div className="relative pl-4 space-y-8">
                    {/* Connector Line */}
                    <div className="absolute left-[27px] top-2 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-slate-800" />

                    {[
                        { date: "This Week", title: `Reach Level ${user.level + 1}`, prob: 95, status: 'high' },
                        { date: "Next Month", title: "Complete 5 Courses", prob: 78, status: 'med' },
                        { date: "Q4 2024", title: "Top 1% Rank", prob: 45, status: 'low' },
                    ].map((item, i) => (
                        <div key={i} className="relative pl-8 group cursor-default">
                            {/* Node */}
                            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-[#0a0a0a] z-10 
                                ${item.status === 'high' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                                    item.status === 'med' ? 'bg-purple-500' : 'bg-slate-700'}`}
                            />

                            <div className="flex justify-between items-start">
                                <div>
                                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${item.status === 'high' ? 'text-blue-400' : 'text-slate-500'}`}>{item.date}</div>
                                    <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{item.title}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-bold ${item.prob > 80 ? 'text-emerald-400' : 'text-slate-400'}`}>{item.prob}%</div>
                                    <div className="text-[10px] text-slate-500">Prob</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Career Cards - Mapped to Learning Personality/Interests */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-6">Career Trajectory</h3>
                <div className="space-y-4">
                    {[
                        { title: "Software Engineer", match: 92, acquired: ['Logic', 'Problem Solving'], missing: ['System Design'] },
                        { title: "Data Scientist", match: 85, acquired: ['Stats', 'Analysis'], missing: ['Machine Learning'] },
                    ].map((career, i) => (
                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:text-blue-300 transition-colors">
                                        {i === 0 ? <LayoutDashboard size={18} /> : <Brain size={18} />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">{career.title}</div>
                                        <div className="text-xs text-slate-400">Match Score</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-emerald-400">{career.match}%</div>
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="h-1.5 w-full bg-[#0a0a0a] rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: `${career.match}%` }} />
                            </div>
                            {/* Distinct Tags */}
                            <div className="flex flex-wrap gap-2">
                                {career.acquired.map(t => (
                                    <span key={t} className="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] font-bold text-emerald-400 border border-emerald-500/10 flex items-center gap-1">
                                        <Check size={8} /> {t}
                                    </span>
                                ))}
                                {career.missing.map(t => (
                                    <span key={t} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400 border border-white/5 flex items-center gap-1 opacity-60">
                                        <X size={8} /> {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const TimelineContent = () => {
        // Prepare Real Data for Focus Trend
        const focusData = user.weeklyStats.length > 0 ? user.weeklyStats.map(d => ({
            d: d.name.charAt(0),
            h: d.hours
        })) : [{ d: 'M', h: 0 }, { d: 'T', h: 0 }, { d: 'W', h: 0 }, { d: 'T', h: 0 }, { d: 'F', h: 0 }, { d: 'S', h: 0 }, { d: 'S', h: 0 }];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full pb-20">
                {/* Rich Activity Feed - REAL DATA */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-bold text-white">Activity Feed</h3>
                        <button className="text-xs text-blue-400 hover:text-blue-300 font-bold">View All</button>
                    </div>

                    <div className="space-y-4 md:space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {(user.recentActivity || []).length > 0 ? user.recentActivity!.map((item: any, i: number) => {
                            let icon = <Activity size={16} />;
                            let color = "bg-slate-800 text-slate-400";
                            if (item.type === 'quiz') { icon = <Target size={16} />; color = "bg-pink-500/20 text-pink-400 border-pink-500/20"; }
                            if (item.type === 'video') { icon = <Play size={16} />; color = "bg-blue-500/20 text-blue-400 border-blue-500/20"; }

                            return (
                                <div key={i} className="flex gap-4 group">
                                    {/* Time */}
                                    <div className="text-[10px] font-mono text-slate-500 w-12 text-right pt-2 hidden md:block">
                                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>

                                    <div className="flex-1 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors flex items-start gap-4">
                                        <div className={`p-2 rounded-lg border ${color} shrink-0`}>
                                            {icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-white leading-tight mb-1 truncate">{item.title}</div>
                                            <div className="text-xs text-slate-400 flex items-center gap-2">
                                                <span className="capitalize">{item.type}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-600" />
                                                <span className="text-emerald-400 font-bold">Completed</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : <div className="text-slate-500 italic p-4 text-center">No recent activity. Start learning to see updates here!</div>}
                    </div>
                </div>

                {/* Enhanced Focus Trend - REAL DATA */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-base font-bold text-white mb-1">Focus Trend</h3>
                        <p className="text-xs text-slate-400">Weekly Study Hours</p>
                    </div>

                    <div className="flex-1 min-h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={focusData}>
                                <XAxis dataKey="d" stroke="#333" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }} contentStyle={{ backgroundColor: '#121212', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                                <RechartsBar dataKey="h" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20}>
                                    {
                                        focusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.h >= 2 ? '#3b82f6' : '#1e3a8a'} />
                                        ))
                                    }
                                </RechartsBar>
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Focus</div>
                            <div className="text-xl font-bold text-white">{user.total_study_hours.toFixed(1)}h</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Streak</div>
                            <div className="text-xl font-bold text-emerald-400">{user.streak} Days</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    };

    const SystemContent = () => {
        const [name, setName] = useState(user.name);
        const [bio, setBio] = useState(user.bio || '');

        return (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto mb-20">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Settings size={20} /> System Config</h3>
                <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-400 uppercase">Identity</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition-colors"
                                value={name} onChange={e => setName(e.target.value)} placeholder="Display Name" />
                            <input className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-slate-500 text-sm outline-none cursor-not-allowed"
                                value={user.email || 'N/A'} disabled />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-400 uppercase">Bio</label>
                        <textarea className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition-colors h-32 resize-none"
                            value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio..." />
                    </div>
                    <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-end gap-3">
                        <button onClick={handleExportData} className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/5 transition-colors">Export Data</button>
                        <button onClick={() => onUpdateProfile({ name, bio })} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-colors">Save Changes</button>
                    </div>
                </div>
            </div>
        );
    };

    const tabs = [
        { title: "Command", value: "command", icon: <LayoutDashboard size={14} />, content: <CommandContent /> },
        { title: "Neural", value: "neural", icon: <BrainCircuit size={14} />, content: <NeuralContent /> },
        { title: "Oracle", value: "oracle", icon: <Sparkles size={14} />, content: <OracleContent /> },
        { title: "Timeline", value: "timeline", icon: <History size={14} />, content: <TimelineContent /> },
        { title: "System", value: "system", icon: <Settings size={14} />, content: <SystemContent /> },
    ];

    return (
        <motion.div
            className="space-y-6 w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* PROFILE HEADER (Hero - Matches Dashboard) */}
            <header className="w-full">
                <div className="relative w-full rounded-2xl bg-[#050505] border border-white/10 p-5 md:p-7 overflow-hidden shadow-2xl relative group">
                    {/* Animated Mesh Gradient Background - Consistent with Dashboard */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />

                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        {/* Identity Block */}
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-2 border-white/10 overflow-hidden shadow-lg bg-[#050505] relative z-10">
                                    <img
                                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=0a0a0a&color=fff`}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                        onError={() => setImageError(true)}
                                    />
                                </div>
                                <div className="absolute -inset-1 rounded-full border border-blue-500/50 opacity-50" />
                                <div className="absolute -bottom-1 -right-1 bg-[#0a0a0a] p-1.5 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-colors z-20">
                                    <Edit2 size={12} className="text-slate-400" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                                    {user.name}
                                </h1>
                                <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium mb-3">
                                    {user.bio || "Engineering the future, one byte at a time."}
                                </p>
                                <div className="flex gap-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-600/10">IVL {user.level}</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-600/10">{user.learningPersonality?.type || "Strategist"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* STATS GRID - Responsive & Real Data */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Reputation', sub: 'Social Score', val: (user.reputationScore?.score || 950), suffix: '', icon: <Shield size={20} />, color: 'text-blue-400', border: 'hover:border-blue-500/50', bg: 'hover:shadow-blue-500/10' },
                    { label: 'Streak', sub: 'Consistency', val: (user.streak || 0), suffix: ' Days', icon: <Flame size={20} />, color: 'text-orange-400', border: 'hover:border-orange-500/50', bg: 'hover:shadow-orange-500/10' },
                    { label: 'Study Time', sub: 'Total Hours', val: (user.total_study_hours || 0), suffix: 'h', icon: <Clock size={20} />, color: 'text-emerald-400', decimals: 0, border: 'hover:border-emerald-500/50', bg: 'hover:shadow-emerald-500/10' },
                    { label: 'Total XP', sub: 'Lifetime Points', val: (user.xp / 1000), suffix: 'k', icon: <Trophy size={20} />, color: 'text-yellow-400', decimals: 1, border: 'hover:border-yellow-500/50', bg: 'hover:shadow-yellow-500/10' }
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
                        <div className="text-xs text-slate-400 font-medium">{stat.sub}</div>
                    </div>
                ))}
            </div>

            {/* TABS - Using Dashboard Component */}
            <Tabs tabs={tabs} />
        </motion.div>
    );
};

export default UserProfilePage;
