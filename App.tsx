
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, UserProfile, RoadmapStep, Notification, Goal, Achievement, RoadmapCourse } from './types';
import AppSidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import RoadmapGenerator from './components/RoadmapGenerator';
import QuizArena from './components/QuizArena';
import RightSidebar from './components/RightSidebar';
import VideoPlayer from './components/VideoPlayer';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import { Bell, Trophy } from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './lib/supabase';
import { getUserProfile, updateUserProfile, saveGoals, updateCourseProgress, ALL_ACHIEVEMENTS } from './services/db';
import { useOutsideClick } from './hooks/use-outside-click';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [session, setSession] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // --- APP STATE ---
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_view');
      return saved ? (saved as ViewState) : ViewState.LANDING;
    }
    return ViewState.LANDING;
  });

  const [activeVideo, setActiveVideo] = useState<RoadmapStep | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_active_video');
      try { return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
    }
    return null;
  });

  const [activeCourseId, setActiveCourseId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('app_active_course');
    return null;
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  useOutsideClick(notificationRef, () => {
    if (showNotifications) setShowNotifications(false);
  });

  // --- USER DATA ---
  const [user, setUser] = useState<UserProfile>({
    name: 'Student',
    xp: 0,
    streak: 1,
    level: 1,
    total_study_hours: 0,
    achievements: ALL_ACHIEVEMENTS,
    weeklyStats: [],
    subjectMastery: [],
    stats: { videosCompleted: 0, quizzesCompleted: 0, flashcardsReviewed: 0, focusSessions: 0 }
  });

  const [goals, setGoals] = useState<Goal[]>([]);

  // --- TIMER STATE ---
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const sessionStartTime = useRef<number | null>(null);

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => {
    if (currentView !== ViewState.LANDING) localStorage.setItem('app_view', currentView);
  }, [currentView]);

  useEffect(() => {
    if (activeVideo) localStorage.setItem('app_active_video', JSON.stringify(activeVideo));
    else localStorage.removeItem('app_active_video');
  }, [activeVideo]);

  useEffect(() => {
    if (activeCourseId) localStorage.setItem('app_active_course', activeCourseId);
    else localStorage.removeItem('app_active_course');
  }, [activeCourseId]);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!supabase) {
      initializeUserData();
      setCurrentView(prev => prev === ViewState.LANDING ? ViewState.DASHBOARD : prev);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        initializeUserData();
        setCurrentView(prev => prev === ViewState.LANDING ? ViewState.DASHBOARD : prev);
      } else {
        setCurrentView(ViewState.LANDING);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        initializeUserData();
        setCurrentView(prev => prev === ViewState.LANDING ? ViewState.DASHBOARD : prev);
      } else {
        setCurrentView(ViewState.LANDING);
        localStorage.removeItem('app_view');
        localStorage.removeItem('app_active_video');
        localStorage.removeItem('app_active_course');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeUserData = async () => {
    try {
      const profile = await getUserProfile();
      // Ensure xp and numeric fields are safe
      const safeProfile = {
        ...profile,
        xp: profile.xp || 0,
        streak: profile.streak || 1,
        level: profile.level || 1
      };
      setUser(safeProfile);
      checkDailyGoalsAndStreak(safeProfile);
    } catch (e) {
      console.error("Profile load error", e);
    }
  };

  const generateDailyGoals = () => {
    // Preserve existing course goals
    const userId = user.id || 'guest';
    const dailyGoalsKey = `daily_goals_${userId}`;
    const savedGoals = localStorage.getItem(dailyGoalsKey);
    let existingPersistentGoals: Goal[] = [];
    if (savedGoals) {
      try {
        const parsed = JSON.parse(savedGoals);
        existingPersistentGoals = parsed.filter((g: Goal) => g.id.startsWith('course-goal-') && !g.completed);
      } catch (e) { console.error(e); }
    }

    // Randomized Daily Goals to keep it fresh
    const possibleGoals: Goal[] = [
      { id: `g-${Date.now()}-1`, title: 'Complete 1 Lesson', current: 0, target: 1, unit: 'lesson', completed: false, type: 'video', xpReward: 50 },
      { id: `g-${Date.now()}-2`, title: 'Take a Quiz', current: 0, target: 1, unit: 'quiz', completed: false, type: 'quiz', xpReward: 30 },
      { id: `g-${Date.now()}-3`, title: 'Focus for 25m', current: 0, target: 1, unit: 'session', completed: false, type: 'focus', xpReward: 40 },
      { id: `g-${Date.now()}-4`, title: 'Create a Flashcard Deck', current: 0, target: 1, unit: 'deck', completed: false, type: 'task', xpReward: 30 },
    ];

    // Select 3 random goals
    const selectedGoals = possibleGoals.sort(() => 0.5 - Math.random()).slice(0, 3);

    const finalGoals = [...existingPersistentGoals, ...selectedGoals];
    setGoals(finalGoals);
    saveGoals(finalGoals);
  };

  const checkDailyGoalsAndStreak = (profile: UserProfile) => {
    // Use user-specific keys for tracking
    const userId = profile.id || 'guest';
    const lastLoginKey = `last_login_date_${userId}`;
    const dailyGoalsKey = `daily_goals_${userId}`;
    
    const lastLoginStr = localStorage.getItem(lastLoginKey);
    const now = new Date();
    // Reset time to midnight for accurate day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = today.toDateString();

    // Handle Daily Goals
    if (lastLoginStr !== todayStr) {
      localStorage.setItem(lastLoginKey, todayStr);
      generateDailyGoals();
    } else {
      const savedGoals = localStorage.getItem(dailyGoalsKey);
      if (savedGoals) setGoals(JSON.parse(savedGoals));
      else generateDailyGoals();
    }

    // Handle Streak Logic
    let newStreak = 1; // Default for new users

    if (lastLoginStr) {
      const lastLoginDate = new Date(lastLoginStr);

      // Calculate difference in days
      const diffTime = today.getTime() - lastLoginDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays === 0) {
        // Logged in today already, keep streak
        newStreak = profile.streak;
      } else if (diffDays === 1) {
        // Logged in yesterday, increment streak
        newStreak = (profile.streak || 0) + 1;
      } else {
        // Missed a day or more, reset streak
        newStreak = 1;
      }
    } else {
      // First ever login
      newStreak = 1;
    }

    if (newStreak !== profile.streak) {
      const updatedUser = { ...profile, streak: newStreak };
      setUser(updatedUser);
      updateUserProfile({ streak: newStreak });
      checkAchievements(updatedUser, { type: 'streak' });

      if (newStreak > profile.streak) {
        addNotification('Streak Updated', `You're on a ${newStreak} day streak!`, 'info');
      }
    }
  };



  // --- ACTION HANDLERS ---

  const handleAddXP = (amount: number) => {
    setUser(prev => {
      const safeXp = prev.xp || 0;
      const newXP = safeXp + amount;
      const newLevel = Math.floor(newXP / 1000) + 1;

      if (newLevel > prev.level) {
        addNotification('Level Up!', `Welcome to Level ${newLevel}!`, 'achievement');
      }

      const updated = { ...prev, xp: newXP, level: newLevel };
      updateUserProfile({ xp: newXP, level: newLevel });
      setTimeout(() => checkAchievements(updated, { type: 'level' }), 0);
      return updated;
    });
  };

  const addNotification = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'achievement') => {
    const newNotif: Notification = {
      id: Date.now().toString() + Math.random(),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // --- GOAL LOGIC ---
  const handleGoalUpdate = (type: 'quiz' | 'video' | 'reading' | 'task' | 'focus', amount: number = 1) => {
    setGoals(prev => {
      const updated = prev.map(g => {
        if (!g.completed && (g.type === type || g.type === 'task')) {
          const newCurrent = Math.min(g.current + amount, g.target);
          const isComplete = newCurrent >= g.target;

          if (isComplete && !g.completed) {
            addNotification('Goal Completed', `${g.title}`, 'success');
            handleAddXP(g.xpReward || 50);
          }
          return { ...g, current: newCurrent, completed: isComplete };
        }
        return g;
      });
      saveGoals(updated);
      return updated;
    });
  };

  const addNewGoal = (title: string) => {
    const newGoals = [...goals, {
      id: Date.now().toString(),
      title,
      current: 0,
      target: 1,
      unit: 'task',
      completed: false,
      type: 'task' as const,
      xpReward: 20
    }];
    setGoals(newGoals);
    saveGoals(newGoals);
  };

  const toggleGoal = (id: string) => {
    const updated = goals.map(g => {
      if (g.id === id) {
        const newState = !g.completed;
        if (newState) handleAddXP(g.xpReward || 10);
        return { ...g, completed: newState, current: newState ? g.target : 0 };
      }
      return g;
    });
    setGoals(updated);
    saveGoals(updated);
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    saveGoals(updated);
  };

  // --- SUBJECT MASTERY TRACKING ---
  const updateSubjectMastery = async (courseId: string, currentUser: UserProfile): Promise<UserProfile | null> => {
    try {
      const { getRoadmaps } = await import('./services/db');
      const courses = await getRoadmaps();
      const completedCourse = courses.find(c => c.id === courseId);

      if (!completedCourse) return null;

      // Extract subject from course topic (e.g., "Python Programming" -> "Python")
      const subject = completedCourse.topic.split(' ')[0];

      // Calculate mastery: count completed courses in this subject
      const subjectCourses = courses.filter(c => c.topic.toLowerCase().includes(subject.toLowerCase()));
      const completedInSubject = subjectCourses.filter(c => c.progress === 100).length;
      const totalInSubject = subjectCourses.length;

      // Calculate mastery percentage (0-100)
      const masteryLevel = totalInSubject > 0 ? Math.round((completedInSubject / totalInSubject) * 100) : 0;

      // Update or add subject mastery
      const existingMasteryIndex = currentUser.subjectMastery.findIndex(sm => sm.subject === subject);
      let newSubjectMastery = [...currentUser.subjectMastery];

      if (existingMasteryIndex >= 0) {
        newSubjectMastery[existingMasteryIndex] = { subject, score: masteryLevel, fullMark: 100 };
      } else {
        newSubjectMastery.push({ subject, score: masteryLevel, fullMark: 100 });
      }

      // Update user profile
      const updatedUser = { ...currentUser, subjectMastery: newSubjectMastery };
      setUser(updatedUser);
      updateUserProfile({ subjectMastery: newSubjectMastery });

      console.log(`Updated ${subject} mastery to ${masteryLevel}%`);
      return updatedUser;
    } catch (error) {
      console.error('Error updating subject mastery:', error);
      return null;
    }
  };

  // --- ACHIEVEMENT SYSTEM ---
  const checkAchievements = async (currentUser: UserProfile, trigger: { type: string; id?: string; value?: number }) => {
    const achievements: Achievement[] = [
      {
        id: 'first_video',
        title: 'First Steps',
        description: 'Complete your first video',
        icon: '🎬',
        type: 'common',
        condition: { type: 'action', actionId: 'first_video' },
        unlocked: false,
        progress: 0
      },
      {
        id: 'complete_course',
        title: 'Course Master',
        description: 'Complete an entire course',
        icon: '🎓',
        type: 'rare',
        condition: { type: 'action', actionId: 'complete_course' },
        unlocked: false,
        progress: 0
      },
      {
        id: 'streak_7',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        type: 'epic',
        condition: { type: 'streak', threshold: 7 },
        unlocked: false,
        progress: 0
      },
      {
        id: 'xp_1000',
        title: 'XP Collector',
        description: 'Earn 1000 XP',
        icon: '⭐',
        type: 'rare',
        condition: { type: 'xp', threshold: 1000 },
        unlocked: false,
        progress: 0
      },
      {
        id: 'quiz_master',
        title: 'Quiz Master',
        description: 'Complete 10 quizzes',
        icon: '🧠',
        type: 'epic',
        condition: { type: 'action', threshold: 10 },
        unlocked: false,
        progress: 0
      }
    ];

    let newAchievement: Achievement | null = null;

    // Check which achievement to award
    if (trigger.id === 'complete_course' && !currentUser.achievements.find(a => a.id === 'complete_course')) {
      newAchievement = achievements.find(a => a.id === 'complete_course') || null;
    } else if (trigger.id === 'first_video' && currentUser.stats.videosCompleted === 1 && !currentUser.achievements.find(a => a.id === 'first_video')) {
      newAchievement = achievements.find(a => a.id === 'first_video') || null;
    } else if (currentUser.streak >= 7 && !currentUser.achievements.find(a => a.id === 'streak_7')) {
      newAchievement = achievements.find(a => a.id === 'streak_7') || null;
    } else if (currentUser.xp >= 1000 && !currentUser.achievements.find(a => a.id === 'xp_1000')) {
      newAchievement = achievements.find(a => a.id === 'xp_1000') || null;
    } else if (currentUser.stats.quizzesCompleted >= 10 && !currentUser.achievements.find(a => a.id === 'quiz_master')) {
      newAchievement = achievements.find(a => a.id === 'quiz_master') || null;
    }

    // Award the achievement
    if (newAchievement) {
      const unlockedAchievement = {
        ...newAchievement,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        progress: 100
      };

      const updatedAchievements = [...currentUser.achievements, unlockedAchievement];
      const updatedUser = { ...currentUser, achievements: updatedAchievements };
      setUser(updatedUser);
      updateUserProfile({ achievements: updatedAchievements });

      addNotification('Achievement Unlocked!', unlockedAchievement.title, 'achievement');
      console.log('Achievement unlocked:', unlockedAchievement.title);
    }
  };

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval: any;
    if (isTimerActive && timeLeft > 0) {
      if (!sessionStartTime.current) sessionStartTime.current = Date.now();
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      finishFocusSession();
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  const finishFocusSession = () => {
    setIsTimerActive(false);
    const durationHours = 25 / 60;
    const newTotal = user.total_study_hours + durationHours;

    // Update Weekly Stats
    const todayAbbr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    const newWeeklyStats = user.weeklyStats.map(d =>
      d.name === todayAbbr ? { ...d, hours: parseFloat((d.hours + durationHours).toFixed(2)) } : d
    );

    // Update Profile Stats
    const newStats = { ...user.stats, focusSessions: (user.stats.focusSessions || 0) + 1 };

    const updatedUser = {
      ...user,
      total_study_hours: newTotal,
      weeklyStats: newWeeklyStats,
      stats: newStats
    };
    setUser(updatedUser);
    updateUserProfile({
      total_study_hours: newTotal,
      weeklyStats: newWeeklyStats,
      stats: newStats
    });

    addNotification('Focus Complete', '25 minutes recorded.', 'success');
    handleAddXP(100);
    handleGoalUpdate('focus', 1);
    checkAchievements(updatedUser, { type: 'focus_hours' });
  };

  const toggleTimer = () => {
    if (isTimerActive) setIsTimerActive(false);
    else setIsTimerActive(true);
  };

  const resetTimer = () => { setIsTimerActive(false); setTimeLeft(25 * 60); };

  // --- VIDEO / COURSE HANDLERS ---
  const handleStartVideo = (video: RoadmapStep, courseId?: string) => {
    setActiveVideo(video);
    if (courseId) setActiveCourseId(courseId);
    setCurrentView(ViewState.VIDEO_PLAYER);
  };

  const handleVideoComplete = async (timestamp?: number) => {
    // Estimate video duration (average YouTube tutorial is ~15 minutes = 0.25 hours)
    const videoDuration = 0.25;

    // Update Weekly Stats
    const todayAbbr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    const newWeeklyStats = user.weeklyStats.map(d =>
      d.name === todayAbbr ? {
        ...d,
        hours: parseFloat((d.hours + videoDuration).toFixed(2)),
        videos: (d.videos || 0) + 1
      } : d
    );

    // Update total study hours
    const newTotalHours = user.total_study_hours + videoDuration;

    // Update User Stats
    const updatedUser = {
      ...user,
      xp: user.xp + 20,
      total_study_hours: newTotalHours,
      weeklyStats: newWeeklyStats,
      stats: {
        ...user.stats,
        videosCompleted: (user.stats.videosCompleted || 0) + 1
      }
    };
    setUser(updatedUser);
    updateUserProfile(updatedUser);

    addNotification('Lesson Finished', '+20 XP', 'success');

    if (!activeVideo || !activeCourseId) return;

    // 1. Update Course Progress
    const newProgress = await updateCourseProgress(activeCourseId, activeVideo.id, timestamp);
    if (newProgress === 100) {
      // Update Subject Mastery when course is completed
      let currentUser = updatedUser;
      const masteryUser = await updateSubjectMastery(activeCourseId, currentUser);
      if (masteryUser) currentUser = masteryUser;

      addNotification('Course Mastered', 'You finished the course!', 'achievement');
      checkAchievements(currentUser, { type: 'action', id: 'complete_course' });
    }
  };

  // --- QUIZ HANDLERS ---
  const handleQuizComplete = (score: number, total: number, topic?: string) => {
    const xp = score * 10;
    handleAddXP(xp);
    handleGoalUpdate('quiz', 1);

    // Update Stats
    const newStats = { ...user.stats, quizzesCompleted: (user.stats.quizzesCompleted || 0) + 1 };
    setUser(prev => ({ ...prev, stats: newStats }));
    updateUserProfile({ stats: newStats });

    if (score === total) checkAchievements(user, { type: 'action', id: 'perfect_quiz' });
  };

  if (currentView === ViewState.LANDING) {
    return (
      <>
        <LandingPage onGetStarted={() => setIsAuthModalOpen(true)} />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    );
  }

  // Determine if main container should scroll or if child components handle it
  const isFixedView = currentView === ViewState.CHAT || currentView === ViewState.VIDEO_PLAYER;

  return (
    <div className={cn("flex flex-col md:flex-row w-full h-screen bg-black text-slate-200 font-sans selection:bg-primary/30 selection:text-white overflow-hidden")}>

      <AppSidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onSignOut={() => {
          if (supabase) supabase.auth.signOut();
          else {
            setCurrentView(ViewState.LANDING);
            localStorage.removeItem('app_view');
          }
        }}
        user={user}
      />

      <div className={cn("flex-1 flex flex-col h-full min-h-0 transition-all duration-300 relative", currentView !== ViewState.VIDEO_PLAYER ? "xl:pr-80" : "")}>

        {/* TOPBAR */}
        <header className="h-16 border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center pl-10 md:pl-0">
            <h2 className="font-semibold text-white capitalize block ml-2 md:ml-0">
              {currentView === ViewState.VIDEO_PLAYER ? 'Classroom' : currentView.toLowerCase().replace('_', ' ')}
            </h2>
          </div>

          <div className="flex items-center space-x-4 relative">
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  }
                }}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black animate-pulse"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="fixed top-20 right-4 md:absolute md:top-full md:right-0 w-80 md:mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-white/5 flex justify-between items-center bg-black/50">
                      <span className="text-xs font-bold text-white">Notifications</span>
                      <button onClick={() => setNotifications([])} className="text-[10px] text-slate-500 hover:text-white">Clear All</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-600 text-xs">No new notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3">
                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'achievement' ? 'bg-yellow-400' : 'bg-blue-400'
                              }`} />
                            <div>
                              <p className={`text-sm font-bold ${n.type === 'achievement' ? 'text-yellow-400' : 'text-white'}`}>{n.title}</p>
                              <p className="text-xs text-slate-400">{n.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Trophy size={14} className="text-yellow-400" />
              <span className="text-xs font-bold text-white">{(user?.xp ?? 0).toLocaleString()} XP</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white cursor-pointer shadow-[0_0_10px_rgba(124,58,237,0.3)]">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className={cn(
          "flex-1 custom-scrollbar",
          currentView === ViewState.VIDEO_PLAYER ? "p-0" : "p-3 md:p-5",
          isFixedView ? "overflow-hidden" : "overflow-y-auto"
        )}>
          {currentView === ViewState.DASHBOARD && (
            <Dashboard
              user={user}
              goals={goals}
              isTimerActive={isTimerActive}
              onToggleTimer={toggleTimer}
              timeLeft={timeLeft}
              onResetTimer={resetTimer}
              onAddGoal={addNewGoal}
              onToggleGoal={toggleGoal}
              onDeleteGoal={deleteGoal}
              onStartVideo={handleStartVideo}
            />
          )}
          {currentView === ViewState.CHAT && <ChatInterface user={user} />}
          {currentView === ViewState.ROADMAP && (
            <RoadmapGenerator
              onStartVideo={handleStartVideo}
              onPlaylistAdded={(t) => {
                addNotification('Course Created', t, 'success');
                handleGoalUpdate('task', 1); // Update task goal

                // Create a new goal specifically for this course if it doesn't exist
                const newGoal: Goal = {
                  id: `course-goal-${Date.now()}`,
                  title: `Start ${t}`,
                  current: 0,
                  target: 1,
                  unit: 'module',
                  completed: false,
                  type: 'video',
                  xpReward: 50
                };
                const updatedGoals = [newGoal, ...goals];
                setGoals(updatedGoals);
                saveGoals(updatedGoals);
              }}
            />
          )}
          {currentView === ViewState.QUIZ && (
            <QuizArena
              onQuizComplete={handleQuizComplete}
              onFlashcardsCreated={() => {
                handleGoalUpdate('task', 1);
                const newStats = { ...user.stats, flashcardsReviewed: (user.stats.flashcardsReviewed || 0) + 10 };
                setUser(prev => ({ ...prev, stats: newStats }));
                updateUserProfile({ stats: newStats });
              }}
            />
          )}
          {currentView === ViewState.VIDEO_PLAYER && activeVideo && (
            <VideoPlayer
              video={activeVideo}
              onBack={() => setCurrentView(ViewState.ROADMAP)}
              onComplete={handleVideoComplete}
              user={user}
              courseId={activeCourseId}
            />
          )}
        </main>
      </div>

      {/* RIGHT SIDEBAR */}
      {currentView !== ViewState.VIDEO_PLAYER && (
        <RightSidebar
          timeLeft={timeLeft}
          isTimerActive={isTimerActive}
          onToggleTimer={toggleTimer}
          onResetTimer={resetTimer}
          goals={goals}
          onAddGoal={addNewGoal}
          onToggleGoal={toggleGoal}
          onDeleteGoal={deleteGoal}
          streak={user.streak}
        />
      )}
    </div>
  );
};

export default App;
