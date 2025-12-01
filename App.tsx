import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, Trophy } from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './lib/supabase';
import { HeroUIProvider } from '@heroui/react';
import { getUserProfile, updateUserProfile, saveGoals, updateCourseProgress, updateStudyTime, ALL_ACHIEVEMENTS } from './services/db';
import { useOutsideClick } from './hooks/use-outside-click';
import { ViewState, Goal, RoadmapStep, UserProfile, Achievement, Notification } from './types';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import RoadmapGenerator from './components/RoadmapGenerator';
import QuizArena from './components/QuizArena';
import PracticeHub from './components/PracticeHub';
import VideoPlayer from './components/VideoPlayer';
import ErrorBoundary from './components/ErrorBoundary';
import AppSidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import UserProfilePage from './components/UserProfile';
import QuizAnalytics from './components/QuizAnalytics';
import NotesManager from './components/NotesManager';
import MobileBottomNav from './components/MobileBottomNav';
import { Cpu } from 'lucide-react';

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
      // Only initialize user data if a profile exists (user is logged in)
      const existingProfile = localStorage.getItem('user_profile');
      if (existingProfile) {
        initializeUserData();
        setCurrentView(prev => prev === ViewState.LANDING ? ViewState.DASHBOARD : prev);
      }
      // If no profile exists, user is not logged in - stay on landing page
      return;
    }

    // Check for OAuth callback in URL
    const url = new URL(window.location.href);
    const hash = url.hash.substring(1); // Remove # from hash
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');
      const expires_in = hashParams.get('expires_in');
      const provider_token = hashParams.get('provider_token');
      const provider_refresh_token = hashParams.get('provider_refresh_token');
      const provider = hashParams.get('provider');
      const type = hashParams.get('type');

      if (access_token && refresh_token && type) {
        // This is likely an OAuth callback, update URL to clean it up
        window.history.replaceState({}, document.title, window.location.pathname);

        // Continue with session handling
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          if (session) {
            initializeUserData();
            setCurrentView(prev => prev === ViewState.LANDING ? ViewState.DASHBOARD : prev);
          } else {
            setCurrentView(ViewState.LANDING);
          }
        });
      } else {
        // Regular session handling
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          if (session) {
            initializeUserData();
            setCurrentView(prev => prev === ViewState.LANDING ? ViewState.DASHBOARD : prev);
          } else {
            setCurrentView(ViewState.LANDING);
          }
        });
      }
    } else {
      // Regular session handling
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) {
          initializeUserData();
          setCurrentView(prev => prev === ViewState.LANDING ? ViewState.DASHBOARD : prev);
        } else {
          setCurrentView(ViewState.LANDING);
        }
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        initializeUserData();
        setCurrentView(prev => prev === ViewState.LANDING ? ViewState.DASHBOARD : prev);
      } else {
        // User signed out - reset everything
        setUser({
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

        // Clear all localStorage items
        localStorage.removeItem('app_view');
        localStorage.removeItem('app_user');
        localStorage.removeItem('user_profile');
        localStorage.removeItem('app_goals');
        localStorage.removeItem('app_active_video');
        localStorage.removeItem('app_active_course');

        setCurrentView(ViewState.LANDING);
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
        // Prioritize profile name if it exists and isn't empty, otherwise keep existing or default
        name: profile.name || user.name || 'Student',
        xp: profile.xp || 0,
        streak: profile.streak || 1,
        level: profile.level || 1,
        avatar_url: session?.user?.user_metadata?.avatar_url || profile.avatar_url,
        email: session?.user?.email || profile.email
      };
      setUser(safeProfile);
      checkDailyGoalsAndStreak(safeProfile);
    } catch (e) {
      console.error("Profile load error:", e);
      // Fallback to default profile if database fails
      const defaultProfile = {
        name: 'Student',
        xp: 0,
        streak: 1,
        level: 1,
        total_study_hours: 0,
        achievements: ALL_ACHIEVEMENTS,
        weeklyStats: [],
        subjectMastery: [],
        stats: { videosCompleted: 0, quizzesCompleted: 0, flashcardsReviewed: 0, focusSessions: 0 }
      };
      setUser(defaultProfile);
      checkDailyGoalsAndStreak(defaultProfile);
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

    // Dynamic Goal Templates for Variety
    const templates = [
      { title: 'Quick Win', desc: 'Complete 1 Lesson', target: 1, type: 'video' as const, baseXP: 50, unit: 'lesson' },
      { title: 'Knowledge Seeker', desc: 'Complete 3 Lessons', target: 3, type: 'video' as const, baseXP: 150, unit: 'lessons' },
      { title: 'Quiz Whiz', desc: 'Take a Quiz', target: 1, type: 'quiz' as const, baseXP: 40, unit: 'quiz' },
      { title: 'Test Yourself', desc: 'Complete 2 Quizzes', target: 2, type: 'quiz' as const, baseXP: 100, unit: 'quizzes' },
      { title: 'Deep Work', desc: 'Focus for 50m', target: 2, type: 'focus' as const, baseXP: 100, unit: 'sessions' },
      { title: 'Stay Focused', desc: 'Focus for 25m', target: 1, type: 'focus' as const, baseXP: 50, unit: 'session' },
      { title: 'Active Recall', desc: 'Review Flashcards', target: 1, type: 'task' as const, baseXP: 30, unit: 'deck' },
      { title: 'Marathon', desc: 'Watch 5 Lessons', target: 5, type: 'video' as const, baseXP: 300, unit: 'lessons' },
    ];

    // Select 3 random unique templates
    const shuffled = templates.sort(() => 0.5 - Math.random());
    const selectedTemplates = shuffled.slice(0, 3);

    const newGoals: Goal[] = selectedTemplates.map((t, index) => ({
      id: `daily-${Date.now()}-${index}`,
      title: t.desc, // Use description as the main title for clarity
      current: 0,
      target: t.target,
      unit: t.unit,
      completed: false,
      type: t.type,
      xpReward: t.baseXP + Math.floor(Math.random() * 10) // Add slight XP variance
    }));

    const finalGoals = [...existingPersistentGoals, ...newGoals];
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

      // Normalize dates to midnight for accurate day comparison
      // Use local time to respect user's day boundary
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastLoginMidnight = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate());

      // Calculate difference in days (using midnight-normalized dates)
      const diffTime = todayMidnight.getTime() - lastLoginMidnight.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

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
      } else if (newStreak < profile.streak) {
        addNotification('Streak Reset', `Your streak was reset. Start a new one today!`, 'warning');
      }
    }
  };

  // --- AUTO-CLEANUP EFFECT ---
  useEffect(() => {
    const hasCompleted = goals.some(g => g.completed);
    if (hasCompleted) {
      const timer = setTimeout(() => {
        setGoals(prev => {
          const remaining = prev.filter(g => !g.completed);
          // Only update if changes are needed
          if (remaining.length !== prev.length) {
            saveGoals(remaining);
            if (remaining.length === 0) {
              // If all goals are cleared, generate new ones
              setTimeout(() => generateDailyGoals(), 500);
            }
            return remaining;
          }
          return prev;
        });
      }, 3000); // 3 seconds delay to show success state
      return () => clearTimeout(timer);
    }
  }, [goals]);

  // --- MANUAL SIGN OUT HANDLER ---
  const handleManualSignOut = () => {
    // Reset user to default unauthenticated state
    setUser({
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

    // Clear all localStorage - including user_profile which stores the user id
    localStorage.removeItem('app_view');
    localStorage.removeItem('app_user');
    localStorage.removeItem('user_profile'); // Critical: This stores the user id
    localStorage.removeItem('app_goals');
    localStorage.removeItem('app_active_video');
    localStorage.removeItem('app_active_course');

    // Go to landing page
    setCurrentView(ViewState.LANDING);
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
      const completedIds: string[] = [];

      const updated = prev.map(g => {
        if (!g.completed && (g.type === type || g.type === 'task')) {
          const newCurrent = Math.min(g.current + amount, g.target);
          const isComplete = newCurrent >= g.target;

          if (isComplete && !g.completed) {
            completedIds.push(g.id);
          }
          return { ...g, current: newCurrent, completed: isComplete };
        }
        return g;
      });

      // Handle completion side effects (Notifications, XP)
      if (completedIds.length > 0) {
        setTimeout(() => {
          completedIds.forEach(id => {
            const goal = updated.find(g => g.id === id);
            if (goal) {
              addNotification('Goal Completed', `${goal.title}`, 'success');
              handleAddXP(goal.xpReward || 50);
            }
          });
        }, 0);
      }

      saveGoals(updated);
      return updated;
    });
  };

  const addNewGoal = (title: string) => {
    setGoals(prev => {
      const newGoals = [...prev, {
        id: Date.now().toString(),
        title,
        current: 0,
        target: 1,
        unit: 'task',
        completed: false,
        type: 'task' as const,
        xpReward: 20
      }];
      saveGoals(newGoals);
      return newGoals;
    });
  };

  const toggleGoal = (id: string) => {
    setGoals(prev => {
      const updated = prev.map(g => {
        if (g.id === id) {
          const newState = !g.completed;
          if (newState) handleAddXP(g.xpReward || 10);
          return { ...g, completed: newState, current: newState ? g.target : 0 };
        }
        return g;
      });
      saveGoals(updated);
      return updated;
    });
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => {
      const updated = prev.filter(g => g.id !== id);
      saveGoals(updated);
      return updated;
    });
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

  const finishFocusSession = async () => {
    setIsTimerActive(false);
    const durationMinutes = 25;
    const durationHours = durationMinutes / 60;

    // Update study time and streak
    if (user.id) {
      await updateStudyTime(user.id, durationMinutes);
    }

    // Update Weekly Stats
    const todayAbbr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    const newWeeklyStats = user.weeklyStats.map(d =>
      d.name === todayAbbr ? {
        ...d,
        hours: parseFloat((d.hours + durationHours).toFixed(2)),
        deepDive: (d.deepDive || 0) + 1 // Track Focus Sessions as Deep Dive
      } : d
    );

    // Update Profile Stats
    const newStats = { ...user.stats, focusSessions: (user.stats.focusSessions || 0) + 1 };

    const updatedUser = {
      ...user,
      total_study_hours: user.total_study_hours + durationHours,
      weeklyStats: newWeeklyStats,
      stats: newStats
    };
    setUser(updatedUser);
    updateUserProfile({
      total_study_hours: user.total_study_hours + durationHours,
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

  const adjustTimer = (minutes: number) => {
    setTimeLeft(prev => Math.max(60, prev + minutes * 60));
  };

  // --- VIDEO / COURSE HANDLERS ---
  const handleStartVideo = (video: RoadmapStep, courseId?: string) => {
    setActiveVideo(video);
    if (courseId) setActiveCourseId(courseId);
    setCurrentView(ViewState.VIDEO_PLAYER);
  };

  const handleVideoComplete = async (timestamp?: number) => {
    // Estimate video duration (average YouTube tutorial is ~15 minutes = 0.25 hours)
    const videoDurationMinutes = 15;
    const videoDuration = videoDurationMinutes / 60;

    // Update study time and streak
    if (user.id) {
      await updateStudyTime(user.id, videoDurationMinutes);
    }

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
    handleGoalUpdate('video', 1);

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

    // Update Weekly Stats
    const todayAbbr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    const newWeeklyStats = user.weeklyStats.map(d =>
      d.name === todayAbbr ? {
        ...d,
        quizzes: (d.quizzes || 0) + 1,
        speedBlitz: (d.speedBlitz || 0) + 1 // Track Quizzes as Speed Blitz
      } : d
    );

    // Update Stats
    const newStats = { ...user.stats, quizzesCompleted: (user.stats.quizzesCompleted || 0) + 1 };

    const updatedUser = { ...user, stats: newStats, weeklyStats: newWeeklyStats };
    setUser(updatedUser);
    updateUserProfile({ stats: newStats, weeklyStats: newWeeklyStats });

    if (score === total) checkAchievements(user, { type: 'action', id: 'perfect_quiz' });
  };

  // --- FLASHCARD HANDLERS ---
  const handleFlashcardReview = () => {
    // Update Weekly Stats
    const todayAbbr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    const newWeeklyStats = user.weeklyStats.map(d =>
      d.name === todayAbbr ? {
        ...d,
        flashcards: (d.flashcards || 0) + 1
      } : d
    );

    // Update Stats
    const newStats = { ...user.stats, flashcardsReviewed: (user.stats.flashcardsReviewed || 0) + 1 };

    const updatedUser = { ...user, stats: newStats, weeklyStats: newWeeklyStats };
    setUser(updatedUser);
    updateUserProfile({ stats: newStats, weeklyStats: newWeeklyStats });

    handleGoalUpdate('task', 1); // Flashcards count as tasks
  };

  if (currentView === ViewState.LANDING) {
    // If user is logged in, show landing page with option to go to dashboard
    const handleGetStarted = () => {
      if (user.id) {
        // User is logged in, go to dashboard
        setCurrentView(ViewState.DASHBOARD);
      } else {
        // User not logged in, show auth modal
        setIsAuthModalOpen(true);
      }
    };

    return (
      <>
        <LandingPage onGetStarted={handleGetStarted} />
        {!user.id && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
      </>
    );
  }

  // Determine if main container should scroll or if child components handle it


  // Determine if main container should scroll or if child components handle it
  const isFixedView = currentView === ViewState.CHAT || currentView === ViewState.VIDEO_PLAYER;

  return (
    <HeroUIProvider>
      <div className={cn("flex flex-col md:flex-row w-full h-screen bg-black text-slate-200 font-sans selection:bg-primary/30 selection:text-white")}>

        {/* Sidebar - Hidden on mobile, visible on md+ */}
        <div className="hidden md:flex h-full shrink-0">
          <AppSidebar
            currentView={currentView}
            onNavigate={setCurrentView}
            onSignOut={async () => {
              if (supabase) {
                try {
                  await supabase.auth.signOut();
                  setTimeout(() => {
                    const isNotLandingView = Object.values(ViewState).filter(v => v !== ViewState.LANDING).includes(currentView);
                    if (isNotLandingView) {
                      setCurrentView(ViewState.LANDING);
                    }
                  }, 100);
                } catch (error) {
                  console.error('Sign out error:', error);
                  handleManualSignOut();
                }
              } else {
                handleManualSignOut();
              }
            }}
            user={user}
          />
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          currentView={currentView}
          onNavigate={setCurrentView}
          onMenuClick={() => setIsAuthModalOpen(true)}
        />

        {/* Main Content Area */}
        <div className={cn("flex-1 flex flex-col h-full min-h-0 transition-all duration-300 relative", currentView !== ViewState.VIDEO_PLAYER ? "" : "")}>

          {/* Mobile Header (Logo) - Visible only on mobile */}
          <div className={cn(
            "md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl absolute top-0 left-0 right-0 z-40",
            currentView === ViewState.VIDEO_PLAYER ? "hidden" : "flex"
          )}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                <Cpu className="text-white h-4 w-4" />
              </div>
              <span className="font-bold text-white text-sm">StudySync AI</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* TOPBAR (Desktop) */}
          <header className={cn(
            "h-14 md:h-16 border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-30 items-center justify-between px-4 md:px-6 flex-shrink-0 hidden md:flex",
            currentView === ViewState.CHAT ? "hidden md:flex" : "hidden md:flex"
          )}>
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
                  <Bell size={16} />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-black animate-pulse"></span>
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
                              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'achievement' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
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

              <div className="flex items-center gap-2 bg-white/5 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-white/5">
                <Trophy size={12} className="text-yellow-400" />
                <span className="text-xs md:text-sm font-bold text-white">{(user?.xp ?? 0).toLocaleString()} XP</span>
              </div>
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white cursor-pointer shadow-[0_0_10px_rgba(124,58,237,0.3)]">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className={cn(
            "flex-1 custom-scrollbar md:pt-0 md:pb-0",
            currentView === ViewState.VIDEO_PLAYER ? "p-0" :
              currentView === ViewState.CHAT ? "p-0" : "p-3 md:p-4 laptop:p-6 pt-20 pb-24",
            isFixedView ? "overflow-hidden" : "overflow-y-auto"
          )}>
            {currentView === ViewState.DASHBOARD && (
              <ErrorBoundary>
                <Dashboard
                  user={user}
                  goals={goals}
                  isTimerActive={isTimerActive}
                  onToggleTimer={toggleTimer}
                  timeLeft={timeLeft}
                  onResetTimer={resetTimer}
                  onAdjustTimer={adjustTimer}
                  onAddGoal={addNewGoal}
                  onToggleGoal={toggleGoal}
                  onDeleteGoal={deleteGoal}
                  onStartVideo={handleStartVideo}
                />
              </ErrorBoundary>
            )}
            {currentView === ViewState.CHAT && (
              <ErrorBoundary>
                <ChatInterface user={user} />
              </ErrorBoundary>
            )}
            {currentView === ViewState.ROADMAP && (
              <ErrorBoundary>
                <RoadmapGenerator
                  onStartVideo={handleStartVideo}
                  onPlaylistAdded={(t) => {
                    addNotification('Course Created', t, 'success');
                    handleGoalUpdate('task', 1);
                    setGoals(prevGoals => {
                      if (prevGoals.some(g => g.title === `Master ${t}`)) return prevGoals;
                      const newGoal: Goal = {
                        id: `course-goal-${Date.now()}`,
                        title: `Master ${t}`,
                        current: 0,
                        target: 3,
                        unit: 'lessons',
                        completed: false,
                        type: 'video',
                        xpReward: 150
                      };
                      const updatedGoals = [newGoal, ...prevGoals];
                      saveGoals(updatedGoals);
                      return updatedGoals;
                    });
                  }}
                />
              </ErrorBoundary>
            )}
            {currentView === ViewState.PRACTICE && (
              <ErrorBoundary>
                <PracticeHub
                  onQuizComplete={handleQuizComplete}
                  onFlashcardsCreated={() => {
                    handleGoalUpdate('task', 1);
                    const newStats = { ...user.stats, flashcardsReviewed: (user.stats.flashcardsReviewed || 0) + 10 };
                    setUser(prev => ({ ...prev, stats: newStats }));
                    updateUserProfile({ stats: newStats });
                  }}
                />
              </ErrorBoundary>
            )}
            {currentView === ViewState.NOTES && (
              <ErrorBoundary>
                <NotesManager type="video" />
              </ErrorBoundary>
            )}
            {currentView === ViewState.QUIZ_ANALYTICS && (
              <ErrorBoundary>
                <QuizAnalytics />
              </ErrorBoundary>
            )}
            {currentView === ViewState.VIDEO_PLAYER && activeVideo && (
              <ErrorBoundary>
                <VideoPlayer
                  video={activeVideo}
                  onBack={() => setCurrentView(ViewState.ROADMAP)}
                  onComplete={handleVideoComplete}
                  user={user}
                  courseId={activeCourseId}
                />
              </ErrorBoundary>
            )}
          </main>
        </div>

        {/* Right Sidebar - Visible on large screens, hidden on Profile and Video Player views */}
        {currentView !== ViewState.PROFILE && currentView !== ViewState.VIDEO_PLAYER && (
          <RightSidebar
            timeLeft={timeLeft}
            isTimerActive={isTimerActive}
            onToggleTimer={toggleTimer}
            onResetTimer={resetTimer}
            onAdjustTimer={adjustTimer}
            goals={goals}
            onAddGoal={addNewGoal}
            onToggleGoal={toggleGoal}
            onDeleteGoal={deleteGoal}
            streak={user.streak}
          />
        )}

        {currentView === ViewState.PROFILE ? (
          <div className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto">
            <div className="flex h-full">
              <AppSidebar
                currentView={currentView}
                onNavigate={setCurrentView}
                onSignOut={handleManualSignOut}
                user={user}
              />
              <main className="flex-1 overflow-y-auto">
                <UserProfilePage
                  user={user}
                  goals={goals}
                  onUpdateProfile={(updates) => {
                    const updated = { ...user, ...updates };
                    setUser(updated);
                    updateUserProfile(updates);
                  }}
                  onAddGoal={addNewGoal}
                  onToggleGoal={toggleGoal}
                  onDeleteGoal={deleteGoal}
                  timeLeft={timeLeft}
                  isTimerActive={isTimerActive}
                  onToggleTimer={toggleTimer}
                  onResetTimer={resetTimer}
                  onAdjustTimer={adjustTimer}
                />
              </main>
            </div>
          </div>
        ) : null}
      </div>
    </HeroUIProvider>
  );
};

export default App;
