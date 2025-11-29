import React, { useState } from 'react';
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
    TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import CountUp from 'react-countup';

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
    onAdjustTimer
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedBio, setEditedBio] = useState(user.bio || '');
    const [editedSocials, setEditedSocials] = useState(user.social_links || {});
    const [isAddingGoal, setIsAddingGoal] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');

    // --- REAL DATA ONLY ---
    const radarData = user.subjectMastery || [];

    // We only show the heatmap if we have actual data. 
    // Assuming user.stats.dailyActivity or similar exists, otherwise we show a placeholder message.
    // For now, since we don't have a daily activity log in the UserProfile type, we'll hide the heatmap 
    // or show a "No activity data" state if we can't derive it. 
    // However, to keep the UI looking good without lying, we will use the 'weeklyStats' if available to populate a small chart,
    // or just show the 'Study Consistency' block as "No recent activity" if empty.
    const hasActivityData = false; // Set to true when we have real daily logs

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

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-6 overflow-y-auto pb-24">
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-[1920px] mx-auto">

                {/* --- PROFILE CARD (Large, spans 2 cols, 2 rows) --- */}
                <div className="md:col-span-2 md:row-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-[#0a0a0a] shadow-xl overflow-hidden bg-zinc-900">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-2xl font-bold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-[#0a0a0a] p-1 rounded-full">
                                    <div className="bg-green-500 w-4 h-4 rounded-full border-2 border-[#0a0a0a]" title="Online"></div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <Edit2 size={16} className="text-slate-400" />
                            </button>
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-1">{user.name}</h1>
                        <p className="text-slate-400 text-sm mb-4 flex items-center gap-2">
                            Lvl {user.level} • {user.xp.toLocaleString()} XP
                        </p>

                        {isEditing ? (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <textarea
                                    value={editedBio}
                                    onChange={(e) => setEditedBio(e.target.value)}
                                    placeholder="Bio..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none resize-none h-20"
                                />
                                <div className="flex gap-2">
                                    <input
                                        value={editedSocials.github || ''}
                                        onChange={(e) => setEditedSocials({ ...editedSocials, github: e.target.value })}
                                        placeholder="GitHub"
                                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs"
                                    />
                                    <input
                                        value={editedSocials.linkedin || ''}
                                        onChange={(e) => setEditedSocials({ ...editedSocials, linkedin: e.target.value })}
                                        placeholder="LinkedIn"
                                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs"
                                    />
                                </div>
                                <button onClick={handleSaveProfile} className="w-full py-2 bg-blue-600 rounded-lg text-xs font-bold">Save</button>
                            </div>
                        ) : (
                            <>
                                <p className="text-slate-300 text-sm leading-relaxed mb-6 line-clamp-3">
                                    {user.bio || "No bio added yet."}
                                </p>
                                <div className="flex gap-3">
                                    {user.social_links?.github && (
                                        <a href={`https://github.com/${user.social_links.github}`} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                            <Github size={18} className="text-slate-300" />
                                        </a>
                                    )}
                                    {user.social_links?.linkedin && (
                                        <a href={`https://linkedin.com/in/${user.social_links.linkedin}`} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                            <Linkedin size={18} className="text-slate-300" />
                                        </a>
                                    )}
                                    {user.social_links?.twitter && (
                                        <a href={`https://twitter.com/${user.social_links.twitter}`} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                            <Twitter size={18} className="text-slate-300" />
                                        </a>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* --- STATS GRID (Small cards) --- */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 flex flex-col justify-between group hover:border-blue-500/30 transition-colors">
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
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 flex flex-col justify-between group hover:border-orange-500/30 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400"><Flame size={20} /></div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{user.streak}</div>
                            <div className="text-xs text-slate-400">Day Streak</div>
                        </div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 flex flex-col justify-between group hover:border-purple-500/30 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400"><BookOpen size={20} /></div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{user.stats.videosCompleted}</div>
                            <div className="text-xs text-slate-400">Lessons Done</div>
                        </div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 flex flex-col justify-between group hover:border-yellow-500/30 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400"><Trophy size={20} /></div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{user.achievements.filter(a => a.unlocked).length}</div>
                            <div className="text-xs text-slate-400">Badges</div>
                        </div>
                    </div>
                </div>

                {/* --- FOCUS TIMER (Medium) --- */}
                <div className="md:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-center items-center text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent pointer-events-none" />
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2 relative z-10">
                        <Zap size={16} className="text-blue-400" /> Focus Session
                    </h3>
                    <div className="text-6xl font-mono font-bold text-white mb-6 tracking-tighter relative z-10">
                        {formatTime(timeLeft)}
                    </div>
                    <div className="flex gap-3 w-full max-w-[200px] relative z-10">
                        <button
                            onClick={onToggleTimer}
                            className={`flex-1 py-2 rounded-xl font-semibold text-sm flex items-center justify-center transition-all ${isTimerActive
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                                }`}
                        >
                            {isTimerActive ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button
                            onClick={onResetTimer}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>
                </div>

                {/* --- SKILL RADAR (Square) --- */}
                <div className="md:col-span-2 md:row-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col">
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
                </div>

                {/* --- GOALS LIST (Tall) --- */}
                <div className="md:col-span-2 md:row-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col">
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
                </div>

                {/* --- ACTIVITY HEATMAP (Wide) --- */}
                <div className="md:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6">
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                        <Calendar size={16} className="text-green-400" /> Consistency
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
                </div>

            </div>
        </div>
    );
};

export default UserProfilePage;
