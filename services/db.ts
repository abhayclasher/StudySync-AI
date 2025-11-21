import { supabase } from '../lib/supabase';
import { RoadmapStep, UserProfile, Goal, Achievement, ChatSession, Message, RoadmapCourse, WeeklyStat } from '../types';

// --- CONSTANTS ---
// Definition of all available achievements
export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Create your account and start learning',
    icon: '🌱',
    type: 'common',
    condition: { type: 'level', threshold: 1 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'streak_3',
    title: 'Dedicated',
    description: 'Reach a 3-day streak',
    icon: '🔥',
    type: 'common',
    condition: { type: 'streak', threshold: 3 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'streak_7',
    title: 'On Fire',
    description: 'Reach a 7-day streak',
    icon: '🔥🔥',
    type: 'rare',
    condition: { type: 'streak', threshold: 7 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'level_5',
    title: 'Scholar',
    description: 'Reach Level 5',
    icon: '🎓',
    type: 'rare',
    condition: { type: 'level', threshold: 5 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'focus_champion',
    title: 'Deep Worker',
    description: 'Complete 5 hours of focus time',
    icon: '⏰',
    type: 'epic',
    condition: { type: 'focus_hours', threshold: 5 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'course_finisher',
    title: 'Closer',
    description: 'Complete a Roadmap Course',
    icon: '🏁',
    type: 'rare',
    condition: { type: 'action', actionId: 'complete_course' },
    unlocked: false,
    progress: 0
  },
  {
    id: 'perfect_quiz',
    title: 'Perfectionist',
    description: 'Score 100% on a quiz',
    icon: '💯',
    type: 'epic',
    condition: { type: 'action', actionId: 'perfect_quiz' },
    unlocked: false,
    progress: 0
  },
];

const DEFAULT_WEEKLY_STATS: WeeklyStat[] = [
  { name: 'Mon', hours: 0, videos: 0, quizzes: 0 },
  { name: 'Tue', hours: 0, videos: 0, quizzes: 0 },
  { name: 'Wed', hours: 0, videos: 0, quizzes: 0 },
  { name: 'Thu', hours: 0, videos: 0, quizzes: 0 },
  { name: 'Fri', hours: 0, videos: 0, quizzes: 0 },
  { name: 'Sat', hours: 0, videos: 0, quizzes: 0 },
  { name: 'Sun', hours: 0, videos: 0, quizzes: 0 },
];

// Start empty for real data
const DEFAULT_SUBJECTS: any[] = [];

const DEFAULT_STATS = {
  videosCompleted: 0,
  quizzesCompleted: 0,
  flashcardsReviewed: 0,
  focusSessions: 0
};

// --- HELPERS ---
const getLocal = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch { return null; }
};

const setLocal = (key: string, value: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

// --- USER PROFILE ---

export const getUserProfile = async (): Promise<UserProfile> => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      if (error && error.code === 'PGRST116') {
        // Initialize new profile
        const newProfile: UserProfile = {
          id: user.id,
          name: user.user_metadata.full_name || 'Student',
          xp: 0,
          streak: 1,
          level: 1,
          total_study_hours: 0,
          achievements: ALL_ACHIEVEMENTS,
          weeklyStats: DEFAULT_WEEKLY_STATS,
          subjectMastery: DEFAULT_SUBJECTS,
          stats: DEFAULT_STATS
        };
        const { error: insertError } = await supabase.from('profiles').insert(newProfile);
        if (!insertError) return newProfile;
      }

      if (data) {
        // Merge remote achievements with local definitions
        const mergedAchievements = ALL_ACHIEVEMENTS.map(ach => {
          const existing = (data.achievements || []).find((a: Achievement) => a.id === ach.id);
          return existing || ach;
        });

        return {
          ...data,
          xp: Number(data.xp || 0),
          streak: Number(data.streak || 1),
          level: Number(data.level || 1),
          total_study_hours: Number(data.total_study_hours || 0),
          achievements: mergedAchievements,
          weeklyStats: data.weeklyStats || DEFAULT_WEEKLY_STATS,
          subjectMastery: data.subjectMastery || DEFAULT_SUBJECTS,
          stats: data.stats || DEFAULT_STATS
        } as UserProfile;
      }
    }
  }

  // Fallback
  const localProfile = getLocal('user_profile');
  if (localProfile) return {
    ...localProfile,
    xp: localProfile.xp ?? 0,
    streak: localProfile.streak ?? 1,
    level: localProfile.level ?? 1,
    total_study_hours: localProfile.total_study_hours ?? 0,
    achievements: localProfile.achievements || ALL_ACHIEVEMENTS,
    weeklyStats: localProfile.weeklyStats || DEFAULT_WEEKLY_STATS,
    subjectMastery: localProfile.subjectMastery || DEFAULT_SUBJECTS,
    stats: localProfile.stats || DEFAULT_STATS
  };

  return {
    name: 'Guest Student',
    xp: 0,
    streak: 1,
    level: 1,
    total_study_hours: 0,
    achievements: ALL_ACHIEVEMENTS,
    weeklyStats: DEFAULT_WEEKLY_STATS,
    subjectMastery: DEFAULT_SUBJECTS,
    stats: DEFAULT_STATS
  };
};

export const updateUserProfile = async (updates: Partial<UserProfile>) => {
  // Optimistic update locally
  const current = getLocal('user_profile') || {
    name: 'Guest',
    xp: 0,
    streak: 1,
    level: 1,
    total_study_hours: 0,
    achievements: ALL_ACHIEVEMENTS,
    weeklyStats: DEFAULT_WEEKLY_STATS,
    subjectMastery: DEFAULT_SUBJECTS,
    stats: DEFAULT_STATS
  };
  setLocal('user_profile', { ...current, ...updates });

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) console.error("Failed to sync profile", error);
    }
  }
};

// --- CHAT HISTORY ---

export const getChatSessions = async (): Promise<ChatSession[]> => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        return data.map((s: any) => ({
          id: s.id,
          title: s.title,
          lastMessage: s.last_message,
          updatedAt: new Date(s.updated_at),
          messages: []
        }));
      }
    }
  }

  // Local Fallback - Sort by updatedAt descending
  const local = getLocal('chat_sessions') || [];
  return local
    .map((s: any) => ({ ...s, updatedAt: new Date(s.updatedAt) }))
    .sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const createChatSession = async (title: string): Promise<string> => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ user_id: user.id, title, last_message: 'New Chat' })
        .select()
        .single();

      if (data) return data.id;
    }
  }

  // Local Fallback
  const newId = `session-${Date.now()}`;
  const sessions = getLocal('chat_sessions') || [];
  const newSession = { id: newId, title, lastMessage: 'New Chat', updatedAt: new Date() };
  setLocal('chat_sessions', [newSession, ...sessions]);
  return newId;
};

export const saveChatMessage = async (sessionId: string, message: Message, sessionTitle?: string) => {
  if (supabase && !sessionId.startsWith('session-')) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Insert Message
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: message.role,
        text: message.text,
        created_at: message.timestamp.toISOString()
      });

      // 2. Update Session
      const updatePayload: any = {
        last_message: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : ''),
        updated_at: new Date().toISOString()
      };
      if (sessionTitle) updatePayload.title = sessionTitle;

      await supabase.from('chat_sessions').update(updatePayload).eq('id', sessionId);
    }
  } else {
    // Local Fallback
    const msgs = getLocal(`chat_msgs_${sessionId}`) || [];
    setLocal(`chat_msgs_${sessionId}`, [...msgs, message]);

    const sessions = getLocal('chat_sessions') || [];
    const updatedSessions = sessions.map((s: any) =>
      s.id === sessionId ? {
        ...s,
        lastMessage: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : ''),
        updatedAt: new Date(),
        title: sessionTitle || s.title
      } : s
    );
    setLocal('chat_sessions', updatedSessions);
  }
};

export const getChatMessages = async (sessionId: string): Promise<Message[]> => {
  // HYBRID MODE: If ID starts with 'session-', it's definitely local
  if (sessionId.startsWith('session-')) {
    const msgs = getLocal(`chat_msgs_${sessionId}`) || [];
    return msgs.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      return data.map((m: any) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        timestamp: new Date(m.created_at)
      }));
    }
  }
  // Fallback
  const msgs = getLocal(`chat_msgs_${sessionId}`) || [];
  return msgs.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
};

// --- ROADMAPS ---

export const saveRoadmap = async (steps: RoadmapStep[], topic: string) => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { error } = await supabase.from('roadmaps').insert({
          user_id: user.id,
          topic,
          steps, // Supabase handles JSON serialization automatically
          progress: 0
        });

        if (error) {
          console.error('Supabase roadmaps insert error:', error);
          // Fallback to local storage if Supabase fails
        }
      } catch (err) {
        console.error('Error saving roadmap to Supabase, falling back to local storage:', err);
      }
    }
  }

  const current = getLocal('roadmaps') || [];
  setLocal('roadmaps', [...current, {
    id: `local-${Date.now()}`,
    topic,
    steps,
    created_at: new Date().toISOString(),
    progress: 0
  }]);
};

export const getRoadmaps = async (): Promise<RoadmapCourse[]> => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { data, error } = await supabase.from('roadmaps').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching roadmaps from Supabase:', error);
          // Fallback to local storage
        } else if (data) {
          return data;
        }
      } catch (err) {
        console.error('Error in getRoadmaps:', err);
      }
    }
  }
  return getLocal('roadmaps') || [];
};

export const deleteRoadmap = async (courseId: string): Promise<boolean> => {
  let isLocal = !supabase || (typeof courseId === 'string' && courseId.startsWith('local-'));

  if (!isLocal && supabase) {
    try {
      const { error } = await supabase.from('roadmaps').delete().eq('id', courseId);
      if (error) {
        console.error('Error deleting roadmap from Supabase:', error);
        isLocal = true; // Fallback to local
      } else {
        // Also remove from local storage
        const local = getLocal('roadmaps') || [];
        setLocal('roadmaps', local.filter((c: any) => c.id !== courseId));
        return true;
      }
    } catch (err) {
      console.error('Error in deleteRoadmap:', err);
      isLocal = true;
    }
  }

  if (isLocal) {
    const courses = getLocal('roadmaps') || [];
    const updated = courses.filter((c: any) => c.id !== courseId);
    setLocal('roadmaps', updated);
    return true;
  }

  return false;
};

export const updateCourseProgress = async (courseId: string, stepId: string, timestamp?: number): Promise<number> => {
  let course: RoadmapCourse | null = null;
  let isLocal = !supabase || (typeof courseId === 'string' && courseId.startsWith('local-'));

  if (!isLocal && supabase) {
    try {
      const { data, error } = await supabase.from('roadmaps').select('*').eq('id', courseId).single();
      if (error) {
        console.error('Error fetching roadmap for progress update:', error);
        // Try local storage as fallback
        isLocal = true;
      } else {
        course = data;
      }
    } catch (err) {
      console.error('Error in updateCourseProgress:', err);
      isLocal = true; // Use local storage as fallback
    }
  }

  if (!course && isLocal) {
    const courses = getLocal('roadmaps') || [];
    course = courses.find((c: any) => c.id === courseId);
  }

  if (!course) return 0;

  const updatedSteps = course.steps.map(s =>
    s.id === stepId ? {
      ...s,
      status: 'completed' as const,
      lastWatchedTimestamp: timestamp || s.lastWatchedTimestamp
    } : s
  );

  const completedCount = updatedSteps.filter(s => s.status === 'completed').length;
  const newProgress = Math.round((completedCount / updatedSteps.length) * 100);

  if (!isLocal && supabase) {
    try {
      const { error } = await supabase.from('roadmaps').update({
        steps: updatedSteps,
        progress: newProgress
      }).eq('id', courseId);

      if (error) {
        console.error('Error updating roadmap progress in Supabase:', error);
        // Still update local storage as fallback
      }
    } catch (err) {
      console.error('Error updating course progress in Supabase:', err);
    }
  } else {
    const courses = getLocal('roadmaps') || [];
    const updatedCourses = courses.map((c: any) =>
      c.id === courseId ? { ...c, steps: updatedSteps, progress: newProgress } : c
    );
    setLocal('roadmaps', updatedCourses);
  }

  return newProgress;
};

// Update video timestamp without marking as complete (for auto-save during playback)
export const updateVideoTimestamp = async (courseId: string, stepId: string, timestamp: number): Promise<void> => {
  let course: RoadmapCourse | null = null;
  let isLocal = !supabase || (typeof courseId === 'string' && courseId.startsWith('local-'));

  if (!isLocal && supabase) {
    try {
      const { data, error } = await supabase.from('roadmaps').select('*').eq('id', courseId).single();
      if (error) {
        console.error('Error fetching roadmap for timestamp update:', error);
        isLocal = true;
      } else {
        course = data;
      }
    } catch (err) {
      console.error('Error in updateVideoTimestamp:', err);
      isLocal = true;
    }
  }

  if (!course && isLocal) {
    const courses = getLocal('roadmaps') || [];
    course = courses.find((c: any) => c.id === courseId);
  }

  if (!course) return;

  // Update only the timestamp, don't change status
  const updatedSteps = course.steps.map(s =>
    s.id === stepId ? { ...s, lastWatchedTimestamp: timestamp } : s
  );

  if (!isLocal && supabase) {
    try {
      await supabase.from('roadmaps').update({
        steps: updatedSteps
      }).eq('id', courseId);
    } catch (err) {
      console.error('Error updating timestamp in Supabase:', err);
    }
  } else {
    const courses = getLocal('roadmaps') || [];
    const updatedCourses = courses.map((c: any) =>
      c.id === courseId ? { ...c, steps: updatedSteps } : c
    );
    setLocal('roadmaps', updatedCourses);
  }
};

// --- GOALS ---

export const saveGoals = async (goals: Goal[]) => {
  setLocal('daily_goals', goals);
};
