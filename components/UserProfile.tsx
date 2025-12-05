
import React, { useState, useEffect } from 'react';
import { UserProfile, Goal, Achievement } from '../types';
import {
    User,
    MapPin,
    Link as LinkIcon,
    Github,
    Linkedin,
    Twitter,
    Globe,
    Edit2,
    Camera,
    Flame,
    Clock,
    Trophy,
    Target,
    Zap,
    BookOpen,
    Share2,
    Settings,
    Calendar,
    CheckCircle,
    X,
    Plus,
    Trash2,
    Play,
    Pause,
    RotateCcw,
    Radar as RadarIcon,
    MoreHorizontal,
    Award,
    TrendingUp,
    BarChart2,
    LineChart,
    Users,
    MessageCircle,
    Bell,
    ChevronDown,
    ChevronUp,
    Star,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
    LineChart as RechartsLineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import CountUp from 'react-countup';

// Enhanced UserProfileProps with new features
interface UserProfileProps {
    user: UserProfile;
    goals: Goal[];
    onUpdateProfile: (updates: Partial<UserProfile>) => void;
    onAddGoal: (title: string) => void;
    onToggleGoal: (id: string) => void;
    onDeleteGoal: (id: string) => void;
    timeLeft: number;
    isTimerActive: boolean;
    onToggleTimer: () => void;
    onResetTimer: () => void;
    onAdjustTimer: (minutes: number) => void;
    // New social features
    friends?: any[];
    studyGroups?: any[];
    notifications?: any[];
}

const UserProfilePage: React.FC<UserProfileProps> = ({
    user,
    goals,
    onUpdateProfile,
    onAddGoal,
    onToggleGoal,
    onDeleteGoal,
    timeLeft,
    isTimerActive,
    onToggleTimer,
    onResetTimer,
    onAdjustTimer,
    friends = [],
    studyGroups = [],
    notifications = []
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedBio, setEditedBio] = useState(user.bio || '');
    const [editedSocials, setEditedSocials] = useState(user.social_links || {});
    const [isAddingGoal, setIsAddingGoal] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [activeSection, setActiveSection] = useState<'progress' | 'achievements' | 'social' | 'settings'>('progress');
    const [expandedSections, setExpandedSections] = useState({
        bio: true,
        stats: true,
        activity: false,
        settings: false
    });
    const [imageError, setImageError] = useState(false);

    // --- REAL DATA ONLY ---
    const radarData = user.subjectMastery || [];
    const hasActivityData = false; // Set to true when we have real daily logs

    // Calculate XP progress for level
    const levelXPRequirement = 1000 + (user.level * 500);
    const xpProgress = Math.min((user.xp % levelXPRequirement) / levelXPRequirement * 100, 100);

    // Sample data for new charts
    const weeklyStudyData = [
        { day: 'Mon', hours: 2.5, videos: 3 },
        { day: 'Tue', hours: 3.8, videos: 5 },
        { day: 'Wed', hours: 1.2, videos: 2 },
        { day: 'Thu', hours: 4.7, videos: 6 },
        { day: 'Fri', hours: 3.1, videos: 4 },
        { day: 'Sat', hours: 5.9, videos: 8 },
        { day: 'Sun', hours: 2.3, videos: 3 }
    ];

    const subjectDistribution = [
        { subject: 'Math', value: 35, fill: '#3b82f6' },
        { subject: 'Physics', value: 25, fill: '#8b5cf6' },
        { subject: 'Chemistry', value: 20, fill: '#10b981' },
        { subject: 'Biology', value: 15, fill: '#f59e0b' },
        { subject: 'Other', value: 5, fill: '#64748b' }
    ];

    const handleSaveProfile = () => {
        onUpdateProfile({
            bio: editedBio,
            social_links: editedSocials
        });
        setIsEditing(false);
    };

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

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    const sectionVariants = {
        open: { height: 'auto', opacity: 1 },
        closed: { height: 0, opacity: 0 }
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white p-4 md:p-6 overflow-y-auto pb-24" role="main" aria-label="User Profile">
            {/* Enhanced Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-[1920px] mx-auto" role="grid" aria-label="Profile Dashboard">

                {/* --- ENHANCED PROFILE CARD (Large, spans 2 cols, 2 rows) --- */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-[#0a0a0a] to-[#1e293b] border border-white/5 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group shadow-2xl shadow-blue-900/5"
                >
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(99,102,241,0.05),_transparent_70%)] pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                            <div className="relative">
                                <div className="w-28 h-28 rounded-full border-4 border-[#0a0a0a] shadow-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 p-1">
                                    {user.avatar_url && !imageError ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.name}
                                            className="w-full h-full object-cover rounded-full"
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#050505] text-3xl font-bold text-white">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -bottom-3 -right-3 bg-[#0a0a0a] p-1.5 rounded-full border-2 border-blue-500/20"
                                >
                                    <div className="bg-green-500 w-5 h-5 rounded-full border-2 border-[#0a0a0a] shadow-lg shadow-green-500/30" title="Online"></div>
                                </motion.div>
                            </div>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#050505]"
                                aria-label={isEditing ? "Cancel editing profile" : "Edit profile"}
                            >
                                <Edit2 size={18} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                {user.name}
                                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-xs font-bold px-3 py-1 rounded-full">
                                    LVL {user.level}
                                </span>
                            </h1>

                            {/* XP Progress Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>XP: {user.xp.toLocaleString()}</span>
                                    <span>{Math.floor(xpProgress)}% to next level</span>
                                </div>
                                <div className="w-full bg-black/30 rounded-full h-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${xpProgress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full relative"
                                    >
                                        <div className="absolute -top-3 right-0 text-xs bg-black/80 px-2 py-0.5 rounded-full">
                                            {user.xp.toLocaleString()} XP
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>

                        {isEditing ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-4 animate-in fade-in slide-in-from-top-2"
                            >
                                <textarea
                                    value={editedBio}
                                    onChange={(e) => setEditedBio(e.target.value)}
                                    placeholder="Tell the world about your learning journey..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm focus:border-blue-500 outline-none resize-none h-24"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        value={editedSocials.github || ''}
                                        onChange={(e) => setEditedSocials({ ...editedSocials, github: e.target.value })}
                                        placeholder="GitHub"
                                        className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm"
                                    />
                                    <input
                                        value={editedSocials.linkedin || ''}
                                        onChange={(e) => setEditedSocials({ ...editedSocials, linkedin: e.target.value })}
                                        placeholder="LinkedIn"
                                        className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm"
                                    />
                                    <input
                                        value={editedSocials.twitter || ''}
                                        onChange={(e) => setEditedSocials({ ...editedSocials, twitter: e.target.value })}
                                        placeholder="Twitter"
                                        className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm"
                                    />
                                    <input
                                        value={editedSocials.website || ''}
                                        onChange={(e) => setEditedSocials({ ...editedSocials, website: e.target.value })}
                                        placeholder="Website"
                                        className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm"
                                    />
                                </div>
                                <button
                                    onClick={handleSaveProfile}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                                >
                                    Save Profile
                                </button>
                            </motion.div>
                        ) : (
                            <>
                                <p className="text-slate-300 text-sm leading-relaxed mb-6 line-clamp-4">
                                    {user.bio || "No bio added yet. Click edit to share your learning journey!"}
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    {user.social_links?.github && (
                                        <motion.a
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            href={`https://github.com/${user.social_links.github}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            <Github size={20} className="text-slate-300" />
                                        </motion.a>
                                    )}
                                    {user.social_links?.linkedin && (
                                        <motion.a
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            href={`https://linkedin.com/in/${user.social_links.linkedin}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            <Linkedin size={20} className="text-slate-300" />
                                        </motion.a>
                                    )}
                                    {user.social_links?.twitter && (
                                        <motion.a
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            href={`https://twitter.com/${user.social_links.twitter}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            <Twitter size={20} className="text-slate-300" />
                                        </motion.a>
                                    )}
                                    {user.social_links?.website && (
                                        <motion.a
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            href={user.social_links.website}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            <Globe size={20} className="text-slate-300" />
                                        </motion.a>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* --- ENHANCED STATS GRID (Small cards) --- */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="md:col-span-2 grid grid-cols-2 gap-4"
                >
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400"><Clock size={20} /></div>
                            <span className="text-xs text-slate-500 font-medium">+2.5%</span>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">
                                <CountUp end={user.total_study_hours} decimals={1} duration={2} />h
                            </div>
                            <div className="text-xs text-slate-400">Study Time</div>
                        </div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 flex flex-col justify-between group hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400"><Flame size={20} /></div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{user.streak}</div>
                            <div className="text-xs text-slate-400">Day Streak</div>
                        </div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 flex flex-col justify-between group hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400"><BookOpen size={20} /></div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{user.stats.videosCompleted}</div>
                            <div className="text-xs text-slate-400">Lessons Done</div>
                        </div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 flex flex-col justify-between group hover:border-yellow-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400"><Trophy size={20} /></div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{user.achievements.filter(a => a.unlocked).length}</div>
                            <div className="text-xs text-slate-400">Badges</div>
                        </div>
                    </div>
                </motion.div>

                {/* --- ENHANCED FOCUS TIMER (Medium) --- */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="md:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-center items-center text-center group hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent pointer-events-none" />
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2 relative z-10">
                        <Zap size={16} className="text-blue-400" /> Focus Session
                    </h3>
                    <div className="text-4xl md:text-5xl font-mono font-bold text-white mb-6 tracking-tighter relative z-10">
                        {formatTime(timeLeft)}
                    </div>
                    <div className="flex gap-3 w-full max-w-[200px] relative z-10">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={onToggleTimer}
                            className={`flex-1 py-2 rounded-xl font-semibold text-sm flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] ${isTimerActive
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                                }`}
                            aria-label={isTimerActive ? "Pause focus session" : "Start focus session"}
                        >
                            {isTimerActive ? <Pause size={16} /> : <Play size={16} />}
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={onResetTimer}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
                            aria-label="Reset focus timer"
                        >
                            <RotateCcw size={16} />
                        </motion.button>
                    </div>
                </motion.div>

                {/* --- ENHANCED SKILL RADAR (Square) --- */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="md:col-span-2 md:row-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col group hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
                >
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                        <RadarIcon size={16} className="text-purple-400" /> Skill Mastery
                    </h3>
                    <div className="flex-1 min-h-[250px] flex items-center justify-center">
                        {radarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="#ffffff10" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Mastery"
                                        dataKey="score"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        fill="#8b5cf6"
                                        fillOpacity={0.2}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-slate-500 text-sm">
                                <RadarIcon size={32} className="mx-auto mb-2 opacity-20" />
                                <p>No mastery data yet.</p>
                                <p className="text-xs opacity-50">Complete quizzes to build your chart.</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* --- ENHANCED PROGRESS DASHBOARD --- */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="md:col-span-4 md:row-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col group hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-400" /> Progress Dashboard
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveSection('progress')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] ${activeSection === 'progress' ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                aria-pressed={activeSection === 'progress'}
                                aria-label="View progress overview"
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveSection('achievements')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] ${activeSection === 'achievements' ? 'bg-purple-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                aria-pressed={activeSection === 'achievements'}
                                aria-label="View achievements"
                            >
                                Achievements
                            </button>
                            <button
                                onClick={() => setActiveSection('social')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] ${activeSection === 'social' ? 'bg-green-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                aria-pressed={activeSection === 'social'}
                                aria-label="View social features"
                            >
                                Social
                            </button>
                        </div>
                    </div>

                    {activeSection === 'progress' && (
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Weekly Study Progress</h4>
                                <div className="flex gap-2 text-xs">
                                    <span className="flex items-center gap-1 text-blue-400"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Study Hours</span>
                                    <span className="flex items-center gap-1 text-purple-400"><div className="w-2 h-2 rounded-full bg-purple-400"></div> Videos Watched</span>
                                </div>
                            </div>

                            <div className="flex-1 min-h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsLineChart data={weeklyStudyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                        <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                                        <YAxis stroke="#64748b" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="hours"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="videos"
                                            stroke="#8b5cf6"
                                            strokeWidth={3}
                                            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </RechartsLineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="bg-black/20 rounded-xl p-3">
                                    <div className="text-xs text-slate-400 mb-1">Subject Distribution</div>
                                    <div className="flex-1 min-h-[100px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={subjectDistribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={20}
                                                    outerRadius={30}
                                                    fill="#8884d8"
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {subjectDistribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-black/20 rounded-xl p-3">
                                    <div className="text-xs text-slate-400 mb-1">Study Milestones</div>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            <span>50 hours completed</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <span>30 videos watched</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                            <span>10 quizzes passed</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'achievements' && (
                        <div className="flex-1">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {user.achievements.map((achievement) => (
                                    <motion.div
                                        key={achievement.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`p-3 rounded-xl border transition-all ${achievement.unlocked ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30' : 'bg-black/20 border-white/10'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/10'}`}>
                                                <Award size={16} className={achievement.unlocked ? 'text-white' : 'text-slate-500'} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs font-medium truncate">{achievement.title}</div>
                                                <div className="text-xs text-slate-400 truncate">{achievement.type}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-400 line-clamp-2 mb-2">
                                            {achievement.description}
                                        </div>
                                        <div className="w-full bg-black/30 rounded-full h-1">
                                            <div
                                                className={`h-1 rounded-full ${achievement.unlocked ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/20'}`}
                                                style={{ width: `${achievement.progress}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {achievement.unlocked ? 'Unlocked!' : `${achievement.progress}%`}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'social' && (
                        <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-black/20 rounded-xl p-3">
                                    <div className="text-xs font-medium text-slate-400 mb-3">Study Groups</div>
                                    <div className="space-y-2">
                                        {studyGroups.length > 0 ? studyGroups.map((group, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {group.name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 text-xs truncate">{group.name}</div>
                                                <div className="text-xs text-slate-400">{group.members} members</div>
                                            </div>
                                        )) : (
                                            <div className="text-xs text-slate-500 text-center py-4">
                                                No study groups yet. Join or create one!
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-black/20 rounded-xl p-3">
                                    <div className="text-xs font-medium text-slate-400 mb-3">Friends</div>
                                    <div className="space-y-2">
                                        {friends.length > 0 ? friends.map((friend, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {friend.name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 text-xs truncate">{friend.name}</div>
                                                <div className={`text-xs ${friend.online ? 'text-green-400' : 'text-slate-500'}`}>
                                                    {friend.online ? 'Online' : 'Offline'}
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-xs text-slate-500 text-center py-4">
                                                No friends yet. Connect with other learners!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* --- MODULAR PROFILE SECTIONS --- */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="md:col-span-2 md:row-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col group hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
                >
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                        <Settings size={16} className="text-purple-400" /> Profile Settings
                    </h3>

                    <div className="space-y-2">
                        {/* Bio Section */}
                        <div className="bg-black/20 rounded-xl">
                            <button
                                onClick={() => toggleSection('bio')}
                                className="w-full p-3 flex items-center justify-between text-left"
                            >
                                <span className="text-xs font-medium text-slate-300">Bio & Information</span>
                                {expandedSections.bio ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <AnimatePresence>
                                {expandedSections.bio && (
                                    <motion.div
                                        initial="closed"
                                        animate="open"
                                        exit="closed"
                                        variants={sectionVariants}
                                        className="overflow-hidden px-3 pb-3"
                                    >
                                        <div className="text-xs text-slate-400">
                                            Manage your profile information and social links.
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Stats Section */}
                        <div className="bg-black/20 rounded-xl">
                            <button
                                onClick={() => toggleSection('stats')}
                                className="w-full p-3 flex items-center justify-between text-left"
                            >
                                <span className="text-xs font-medium text-slate-300">Statistics & Analytics</span>
                                {expandedSections.stats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <AnimatePresence>
                                {expandedSections.stats && (
                                    <motion.div
                                        initial="closed"
                                        animate="open"
                                        exit="closed"
                                        variants={sectionVariants}
                                        className="overflow-hidden px-3 pb-3"
                                    >
                                        <div className="text-xs text-slate-400">
                                            View detailed statistics about your learning progress.
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Activity Section */}
                        <div className="bg-black/20 rounded-xl">
                            <button
                                onClick={() => toggleSection('activity')}
                                className="w-full p-3 flex items-center justify-between text-left"
                            >
                                <span className="text-xs font-medium text-slate-300">Activity Log</span>
                                {expandedSections.activity ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <AnimatePresence>
                                {expandedSections.activity && (
                                    <motion.div
                                        initial="closed"
                                        animate="open"
                                        exit="closed"
                                        variants={sectionVariants}
                                        className="overflow-hidden px-3 pb-3"
                                    >
                                        <div className="text-xs text-slate-400">
                                            Review your recent learning activities and sessions.
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Settings Section */}
                        <div className="bg-black/20 rounded-xl">
                            <button
                                onClick={() => toggleSection('settings')}
                                className="w-full p-3 flex items-center justify-between text-left"
                            >
                                <span className="text-xs font-medium text-slate-300">Preferences</span>
                                {expandedSections.settings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <AnimatePresence>
                                {expandedSections.settings && (
                                    <motion.div
                                        initial="closed"
                                        animate="open"
                                        exit="closed"
                                        variants={sectionVariants}
                                        className="overflow-hidden px-3 pb-3"
                                    >
                                        <div className="text-xs text-slate-400">
                                            Customize your profile appearance and notification settings.
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* --- GOALS LIST (Tall) --- */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="md:col-span-2 md:row-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col group hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                            <Target size={16} className="text-red-400" /> Daily Goals
                        </h3>
                        <button
                            onClick={() => setIsAddingGoal(!isAddingGoal)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        <AnimatePresence>
                            {isAddingGoal && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden mb-2"
                                >
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newGoalTitle}
                                            onChange={(e) => setNewGoalTitle(e.target.value)}
                                            placeholder="New goal..."
                                            className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddGoalSubmit()}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {goals.length === 0 ? (
                            <div className="text-center py-8 text-slate-600 text-xs italic">
                                No goals set for today.
                            </div>
                        ) : (
                            goals.map((goal) => (
                                <div
                                    key={goal.id}
                                    onClick={() => onToggleGoal(goal.id)}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer group ${goal.completed
                                        ? 'bg-green-500/5 border-green-500/20'
                                        : 'bg-white/5 border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${goal.completed
                                            ? 'bg-green-500 border-green-500'
                                            : 'border-slate-600 group-hover:border-blue-500'
                                            }`}>
                                            {goal.completed && <CheckCircle size={10} className="text-black" />}
                                        </div>
                                        <span className={`text-xs font-medium truncate flex-1 ${goal.completed
                                            ? 'text-slate-500 line-through'
                                            : 'text-slate-300'
                                            }`}>
                                            {goal.title}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteGoal(goal.id); }}
                                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* --- ACTIVITY HEATMAP (Wide) --- */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="md:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 group hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300"
                >
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                        <Calendar size={16} className="text-green-400" /> Study Consistency
                    </h3>
                    {hasActivityData ? (
                        <div className="flex flex-wrap gap-1 justify-center opacity-50">
                            {/* Placeholder for real heatmap implementation */}
                            <div className="text-xs text-slate-500">Activity data visualization would go here.</div>
                        </div>
                    ) : (
                        <div className="h-24 flex flex-col items-center justify-center text-slate-500 text-xs">
                            <TrendingUp size={24} className="mb-2 opacity-20" />
                            <p>Start studying to track your consistency!</p>
                        </div>
                    )}
                </motion.div>

            </div>
        </main>
    );
};

export default UserProfilePage;
