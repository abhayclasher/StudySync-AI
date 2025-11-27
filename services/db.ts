import { supabase } from '../lib/supabase';
import { UserProfile, Roadmap, RoadmapStep, QuizResult, QuizQuestion, Goal, Achievement, ChatSession, Message, RoadmapCourse, WeeklyStat } from '../types';
import { calculateSM2, SM2Item, getInitialSM2State } from '../utils/sm2';

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
  { name: 'Mon', hours: 0, videos: 0, quizzes: 0, speedBlitz: 0, deepDive: 0, flashcards: 0 },
  { name: 'Tue', hours: 0, videos: 0, quizzes: 0, speedBlitz: 0, deepDive: 0, flashcards: 0 },
  { name: 'Wed', hours: 0, videos: 0, quizzes: 0, speedBlitz: 0, deepDive: 0, flashcards: 0 },
  { name: 'Thu', hours: 0, videos: 0, quizzes: 0, speedBlitz: 0, deepDive: 0, flashcards: 0 },
  { name: 'Fri', hours: 0, videos: 0, quizzes: 0, speedBlitz: 0, deepDive: 0, flashcards: 0 },
  { name: 'Sat', hours: 0, videos: 0, quizzes: 0, speedBlitz: 0, deepDive: 0, flashcards: 0 },
  { name: 'Sun', hours: 0, videos: 0, quizzes: 0, speedBlitz: 0, deepDive: 0, flashcards: 0 },
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
          // Prioritize name from DB, then metadata, then fallback
          name: data.name || user.user_metadata.full_name || 'Student',
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
  let roadmapId: string | null = null;

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { data, error } = await supabase
          .from('roadmaps')
          .insert({
            user_id: user.id,
            topic,
            steps, // Supabase handles JSON serialization automatically
            progress: 0
          })
          .select('id') // Get the ID of the inserted record
          .single();

        if (error) {
          console.error('Supabase roadmaps insert error:', error);
          // Fallback to local storage if Supabase fails
        } else if (data) {
          roadmapId = data.id.toString(); // Use the actual database ID
        }
      } catch (err) {
        console.error('Error saving roadmap to Supabase, falling back to local storage:', err);
      }
    }
  }

  const current = getLocal('roadmaps') || [];

  // Use the database ID if available, otherwise use local ID
  const idToUse = roadmapId || `local-${Date.now()}`;

  setLocal('roadmaps', [...current, {
    id: idToUse,
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
          // Ensure IDs are strings for consistency
          return data.map((item: any) => ({
            ...item,
            id: item.id.toString() // Convert numeric ID to string for consistency
          }));
        }
      } catch (err) {
        console.error('Error in getRoadmaps:', err);
      }
    }
  }
  return getLocal('roadmaps') || [];
};

export const deleteRoadmap = async (courseId: string): Promise<boolean> => {
  console.log('Attempting to delete roadmap:', courseId);

  // Determine if this is a local ID (starts with 'local-') or a database ID
  const isLocalId = courseId.startsWith('local-');

  // Check if Supabase is available and user is authenticated
  if (supabase && !isLocalId) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current user:', user?.id, 'Auth error:', authError);

      if (user) {
        // Try to delete from Supabase first
        console.log('Attempting Supabase deletion for ID:', courseId);
        // Convert courseId to number since Supabase uses numeric IDs
        const numericId = parseInt(courseId);
        if (isNaN(numericId)) {
          console.error('Invalid numeric ID for Supabase deletion:', courseId);
          return false;
        }

        // First, let's check if the record exists
        const { data: existingRecord, error: fetchError } = await supabase
          .from('roadmaps')
          .select('id, user_id')
          .eq('id', numericId)
          .eq('user_id', user.id)
          .single();

        console.log('Existing record check:', existingRecord, 'Error:', fetchError);

        if (fetchError) {
          console.error('Error fetching roadmap for deletion check:', fetchError);
        } else if (existingRecord) {
          console.log('Record exists, proceeding with deletion');
        }

        const { error, count } = await supabase
          .from('roadmaps')
          .delete()
          .eq('id', numericId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting roadmap from Supabase:', error);
          // Log additional details for debugging
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            hint: error.hint,
            details: error.details
          });
          // Fall back to local storage deletion
          const local = getLocal('roadmaps') || [];
          const updated = local.filter((c: any) => c.id !== courseId);
          setLocal('roadmaps', updated);
          return updated.length < local.length; // Return true if item was removed
        } else {
          console.log('Successfully deleted from Supabase, count:', count);
          // Successfully deleted from Supabase, also remove from local storage
          const local = getLocal('roadmaps') || [];
          const updated = local.filter((c: any) => c.id !== courseId);
          setLocal('roadmaps', updated);
          return true;
        }
      } else {
        console.log('No authenticated user, falling back to local storage');
        // No authenticated user, use local storage
        const local = getLocal('roadmaps') || [];
        const updated = local.filter((c: any) => c.id !== courseId);
        setLocal('roadmaps', updated);
        return updated.length < local.length; // Return true if item was removed
      }
    } catch (err) {
      console.error('Error in deleteRoadmap:', err);
      // Fall back to local storage deletion
      const local = getLocal('roadmaps') || [];
      const updated = local.filter((c: any) => c.id !== courseId);
      setLocal('roadmaps', updated);
      return updated.length < local.length; // Return true if item was removed
    }
  } else {
    // Handle local storage deletion when Supabase is not available or for local IDs
    console.log('Using local storage deletion for ID:', courseId);
    const courses = getLocal('roadmaps') || [];
    const updated = courses.filter((c: any) => c.id === courseId || c.id === parseInt(courseId));
    setLocal('roadmaps', updated);
    return updated.length < courses.length; // Return true if item was removed
  }
};

export const updateCourseProgress = async (courseId: string, stepId: string, timestamp?: number): Promise<number> => {
  let course: RoadmapCourse | null = null;
  const isLocalId = courseId.startsWith('local-');
  let isLocal = !supabase || isLocalId;

  if (!isLocal && supabase) {
    try {
      // Convert courseId to number for Supabase since it uses numeric IDs
      const numericId = parseInt(courseId);
      if (isNaN(numericId)) {
        console.error('Invalid numeric ID for Supabase query:', courseId);
        isLocal = true;
      } else {
        const { data, error } = await supabase.from('roadmaps').select('*').eq('id', numericId).single();
        if (error) {
          console.error('Error fetching roadmap for progress update:', error);
          // Try local storage as fallback
          isLocal = true;
        } else {
          course = data ? { ...data, id: data.id.toString() } : null; // Ensure ID is string
        }
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
      const numericId = parseInt(courseId);
      if (isNaN(numericId)) {
        console.error('Invalid numeric ID for Supabase update:', courseId);
      } else {
        const { error } = await supabase.from('roadmaps').update({
          steps: updatedSteps,
          progress: newProgress
        }).eq('id', numericId);

        if (error) {
          console.error('Error updating roadmap progress in Supabase:', error);
          // Still update local storage as fallback
        }
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
  const isLocalId = courseId.startsWith('local-');
  let isLocal = !supabase || isLocalId;

  if (!isLocal && supabase) {
    try {
      // Convert courseId to number for Supabase since it uses numeric IDs
      const numericId = parseInt(courseId);
      if (isNaN(numericId)) {
        console.error('Invalid numeric ID for Supabase query:', courseId);
        isLocal = true;
      } else {
        const { data, error } = await supabase.from('roadmaps').select('*').eq('id', numericId).single();
        if (error) {
          console.error('Error fetching roadmap for timestamp update:', error);
          isLocal = true;
        } else {
          course = data ? { ...data, id: data.id.toString() } : null; // Ensure ID is string
        }
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
      const numericId = parseInt(courseId);
      if (isNaN(numericId)) {
        console.error('Invalid numeric ID for Supabase update:', courseId);
      } else {
        await supabase.from('roadmaps').update({
          steps: updatedSteps
        }).eq('id', numericId);
      }
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
  // Get the current user from localStorage or session to create user-specific key
  // We'll use the same pattern as in App.tsx
  const profile = getLocal('user_profile');
  const userId = profile?.id || 'guest';
  const dailyGoalsKey = `daily_goals_${userId}`;
  setLocal(dailyGoalsKey, goals);
};

// --- QUIZ HISTORY ---



export interface QuizAnalytics {
  topic: string;
  mode: string;
  attempts: number;
  avg_score_percentage: number;
  best_score_percentage: number;
  worst_score_percentage: number;
  avg_time_seconds: number;
  first_attempt: string;
  last_attempt: string;
}

export const saveQuizResult = async (result: QuizResult): Promise<boolean> => {
  // Save to Supabase if available
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { error } = await supabase.from('quiz_history').insert({
          user_id: user.id,
          topic: result.topic,
          mode: result.mode,
          score: result.score,
          total_questions: result.total_questions,
          time_taken: result.time_taken,
          questions: result.questions,
          created_at: new Date().toISOString()
        });

        if (error) {
          console.error('Error saving quiz result to Supabase:', error);
          // Fall back to localStorage
        } else {
          console.log('✅ Quiz result saved to Supabase ONLY (not localStorage)');
          // DO NOT save to localStorage when Supabase succeeds to avoid duplicates
          return true;
        }
      } catch (err) {
        console.error('Error in saveQuizResult:', err);
      }
    }
  }

  // Fallback to localStorage ONLY if Supabase failed or is unavailable
  const localHistory = getLocal('quiz_history') || [];
  const newResult = {
    ...result,
    id: `local-${Date.now()}`,
    created_at: new Date().toISOString()
  };
  setLocal('quiz_history', [newResult, ...localHistory]);
  console.log('✅ Quiz result saved to localStorage (fallback)');
  return true;
};

export const getQuizHistoryCached = (): QuizResult[] => {
  return getLocal('cached_quiz_history') || [];
};

export const getQuizHistory = async (limit: number = 50): Promise<QuizResult[]> => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { data, error } = await supabase
          .from('quiz_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          // Cache the fresh data
          setLocal('cached_quiz_history', data);
          console.log(`✅ Loaded ${data.length} quiz results from Supabase and cached`);
          return data as QuizResult[];
        }
      } catch (err) {
        console.error('Error fetching quiz history:', err);
      }
    }
  }

  // Fallback to localStorage
  const localHistory = getLocal('quiz_history') || [];
  return localHistory.slice(0, limit);
};

export const getQuizAnalytics = async (): Promise<QuizAnalytics[]> => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { data, error } = await supabase
          .from('quiz_analytics')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data) {
          return data as QuizAnalytics[];
        }
      } catch (err) {
        console.error('Error fetching quiz analytics:', err);
      }
    }
  }

  // Calculate analytics from localStorage
  const localHistory = getLocal('quiz_history') || [];
  const analyticsMap = new Map<string, QuizAnalytics>();

  localHistory.forEach((quiz: QuizResult) => {
    const key = `${quiz.topic}-${quiz.mode}`;
    const existing = analyticsMap.get(key);
    const percentage = (quiz.score / quiz.total_questions) * 100;

    if (existing) {
      existing.attempts += 1;
      existing.avg_score_percentage =
        (existing.avg_score_percentage * (existing.attempts - 1) + percentage) / existing.attempts;
      existing.best_score_percentage = Math.max(existing.best_score_percentage, percentage);
      existing.worst_score_percentage = Math.min(existing.worst_score_percentage, percentage);
      existing.avg_time_seconds =
        ((existing.avg_time_seconds * (existing.attempts - 1)) + (quiz.time_taken || 0)) / existing.attempts;
      existing.last_attempt = quiz.created_at || new Date().toISOString();
    } else {
      analyticsMap.set(key, {
        topic: quiz.topic,
        mode: quiz.mode,
        attempts: 1,
        avg_score_percentage: percentage,
        best_score_percentage: percentage,
        worst_score_percentage: percentage,
        avg_time_seconds: quiz.time_taken || 0,
        first_attempt: quiz.created_at || new Date().toISOString(),
        last_attempt: quiz.created_at || new Date().toISOString()
      });
    }
  });

  return Array.from(analyticsMap.values());
};

export const getQuizSummaryCached = () => {
  return getLocal('cached_quiz_summary');
};

export const getQuizSummary = async () => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { data, error } = await supabase
          .from('user_quiz_summary')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setLocal('cached_quiz_summary', data);
          return data;
        }
      } catch (err) {
        console.error('Error fetching quiz summary:', err);
      }
    }
  }

  // Calculate summary from localStorage
  const localHistory = getLocal('quiz_history') || [];
  if (localHistory.length === 0) {
    return {
      total_quizzes: 0,
      unique_topics: 0,
      overall_avg_score: 0,
      total_correct: 0,
      total_attempted: 0,
      last_quiz_date: null
    };
  }

  const uniqueTopics = new Set(localHistory.map((q: QuizResult) => q.topic));
  const totalCorrect = localHistory.reduce((sum: number, q: QuizResult) => sum + q.score, 0);
  const totalAttempted = localHistory.reduce((sum: number, q: QuizResult) => sum + q.total_questions, 0);

  return {
    total_quizzes: localHistory.length,
    unique_topics: uniqueTopics.size,
    overall_avg_score: totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0,
    total_correct: totalCorrect,
    total_attempted: totalAttempted,
    last_quiz_date: localHistory[0]?.created_at || null
  };
};


// --- STUDY STREAK DATA ---
export const getStudyStreakData = async (userId: string): Promise<Record<string, number>> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('daily_study_minutes')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Error fetching study streak data:', error);
      return {};
    }
    // daily_study_minutes is stored as JSONB mapping date strings to minutes
    const streakData = data?.daily_study_minutes as Record<string, number> | null;
    return streakData ?? {};
  } catch (err) {
    console.error('Exception fetching study streak data:', err);
    return {};
  }
};

// Calculate current streak from daily study minutes
const calculateStreak = (dailyMinutes: Record<string, number>): number => {
  if (!dailyMinutes || Object.keys(dailyMinutes).length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);

  // Check consecutive days backwards from today
  while (true) {
    const dateKey = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const minutes = dailyMinutes[dateKey] || 0;

    if (minutes > 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// Update study time and recalculate streak
export const updateStudyTime = async (userId: string, minutes: number): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Get current data
    const { data: currentData, error: fetchError } = await supabase
      .from('profiles')
      .select('daily_study_minutes, total_study_hours')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching current study data:', fetchError);
      return;
    }

    const dailyMinutes = (currentData?.daily_study_minutes as Record<string, number>) || {};
    const currentMinutes = dailyMinutes[today] || 0;
    dailyMinutes[today] = currentMinutes + minutes;

    // Calculate new streak
    const newStreak = calculateStreak(dailyMinutes);

    // Update both daily minutes and streak
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        daily_study_minutes: dailyMinutes,
        streak: newStreak,
        total_study_hours: (currentData?.total_study_hours || 0) + (minutes / 60)
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating study time:', updateError);
    }
  } catch (err) {
    console.error('Exception updating study time:', err);
  }
};

// --- QUIZ ANALYTICS ---

export const getQuizTrendData = async (days: number = 30) => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
          .from('quiz_history')
          .select('created_at, score, total_questions')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        if (!error && data) {
          return data.map(quiz => ({
            date: new Date(quiz.created_at).toLocaleDateString(),
            score: Math.round((quiz.score / quiz.total_questions) * 100)
          }));
        }
      } catch (err) {
        console.error('Error fetching quiz trend:', err);
      }
    }
  }

  // Fallback to localStorage
  const localHistory = getLocal('quiz_history') || [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return localHistory
    .filter((q: QuizResult) => new Date(q.created_at) >= startDate)
    .map((q: QuizResult) => ({
      date: new Date(q.created_at).toLocaleDateString(),
      score: Math.round((q.score / q.total_questions) * 100)
    }));
};

export const getTopicPerformance = async () => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { data, error } = await supabase
          .from('quiz_analytics')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data) {
          return data.map(item => ({
            topic: item.topic,
            avgScore: Math.round(item.avg_score),
            totalQuizzes: item.total_quizzes,
            accuracy: Math.round((item.total_correct / item.total_attempted) * 100)
          }));
        }
      } catch (err) {
        console.error('Error fetching topic performance:', err);
      }
    }
  }

  // Fallback to localStorage
  const localHistory = getLocal('quiz_history') || [];
  const topicMap: Record<string, { correct: number; total: number; count: number }> = {};

  localHistory.forEach((q: QuizResult) => {
    if (!topicMap[q.topic]) {
      topicMap[q.topic] = { correct: 0, total: 0, count: 0 };
    }
    topicMap[q.topic].correct += q.score;
    topicMap[q.topic].total += q.total_questions;
    topicMap[q.topic].count += 1;
  });

  return Object.entries(topicMap).map(([topic, stats]) => ({
    topic,
    avgScore: Math.round((stats.correct / stats.total) * 100),
    totalQuizzes: stats.count,
    accuracy: Math.round((stats.correct / stats.total) * 100)
  }));
};

export const getModeComparison = async () => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { data, error } = await supabase
          .from('quiz_history')
          .select('mode, score, total_questions')
          .eq('user_id', user.id);

        if (!error && data) {
          const modeMap: Record<string, { count: number; totalScore: number; totalQuestions: number }> = {};

          data.forEach(quiz => {
            if (!modeMap[quiz.mode]) {
              modeMap[quiz.mode] = { count: 0, totalScore: 0, totalQuestions: 0 };
            }
            modeMap[quiz.mode].count += 1;
            modeMap[quiz.mode].totalScore += quiz.score;
            modeMap[quiz.mode].totalQuestions += quiz.total_questions;
          });

          return Object.entries(modeMap).map(([mode, stats]) => ({
            mode,
            count: stats.count,
            avgScore: Math.round((stats.totalScore / stats.totalQuestions) * 100)
          }));
        }
      } catch (err) {
        console.error('Error fetching mode comparison:', err);
      }
    }
  }

  // Fallback to localStorage
  const localHistory = getLocal('quiz_history') || [];
  const modeMap: Record<string, { count: number; totalScore: number; totalQuestions: number }> = {};

  localHistory.forEach((q: QuizResult) => {
    if (!modeMap[q.mode]) {
      modeMap[q.mode] = { count: 0, totalScore: 0, totalQuestions: 0 };
    }
    modeMap[q.mode].count += 1;
    modeMap[q.mode].totalScore += q.score;
    modeMap[q.mode].totalQuestions += q.total_questions;
  });

  return Object.entries(modeMap).map(([mode, stats]) => ({
    mode,
    count: stats.count,
    avgScore: Math.round((stats.totalScore / stats.totalQuestions) * 100)
  }));
};

export const getWeakTopics = async (threshold: number = 70) => {
  const topicPerformance = await getTopicPerformance();
  return topicPerformance
    .filter(topic => topic.avgScore < threshold)
    .sort((a, b) => a.avgScore - b.avgScore);
};

// --- VIDEO NOTES ---

interface VideoNote {
  id: string;
  user_id: string;
  video_id: string;
  course_id?: string;
  content: string;
  timestamp?: number;
  created_at: string;
  updated_at: string;
}

export const saveVideoNote = async (
  videoId: string,
  courseId: string | undefined,
  content: string,
  timestamp?: number,
  noteId?: string,
  videoTitle?: string
): Promise<VideoNote | null> => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        if (noteId) {
          // Update existing note
          const updateData: any = { content, timestamp };
          if (videoTitle) updateData.video_title = videoTitle;

          const { data, error } = await supabase
            .from('video_notes')
            .update(updateData)
            .eq('id', noteId)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) {
            console.error('❌ Supabase update error:', error);
            return null;
          }

          if (data) {
            console.log('✅ Note updated');
            return data as VideoNote;
          }
        } else {
          // Create new note
          const insertData = {
            user_id: user.id,
            video_id: videoId,
            course_id: courseId || null,
            content,
            timestamp: timestamp || null,
            video_title: videoTitle || null
          };

          console.log('📤 Inserting note:', insertData);

          const { data, error } = await supabase
            .from('video_notes')
            .insert(insertData)
            .select()
            .single();

          if (error) {
            console.error('❌ Supabase insert error:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            return null;
          }

          if (data) {
            console.log('✅ Note saved to Supabase');
            return data as VideoNote;
          }
        }
      } catch (err) {
        console.error('❌ Exception in saveVideoNote:', err);
        return null;
      }
    }
  }

  // Fallback to localStorage
  const localNotes = getLocal(`video_notes_${videoId}`) || [];
  const note: VideoNote & { video_title?: string } = {
    id: noteId || `note_${Date.now()}`,
    user_id: 'local',
    video_id: videoId,
    course_id: courseId,
    content,
    timestamp,
    video_title: videoTitle,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (noteId) {
    const index = localNotes.findIndex((n: VideoNote) => n.id === noteId);
    if (index !== -1) {
      localNotes[index] = { ...localNotes[index], ...note };
    }
  } else {
    localNotes.push(note);
  }

  setLocal(`video_notes_${videoId}`, localNotes);
  console.log('✅ Note saved to localStorage');
  return note;
};

export const getVideoNotes = async (videoId: string): Promise<VideoNote[]> => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { data, error } = await supabase
          .from('video_notes')
          .select('*')
          .eq('user_id', user.id)
          .eq('video_id', videoId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as VideoNote[];
        }
      } catch (err) {
        console.error('Error fetching notes:', err);
      }
    }
  }

  // Fallback to localStorage
  return getLocal(`video_notes_${videoId}`) || [];
};

export const deleteVideoNote = async (noteId: string, videoId: string): Promise<boolean> => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { error } = await supabase
          .from('video_notes')
          .delete()
          .eq('id', noteId)
          .eq('user_id', user.id);

        if (!error) {
          console.log('✅ Note deleted');
          return true;
        }
      } catch (err) {
        console.error('Error deleting note:', err);
      }
    }
  }

  // Fallback to localStorage
  const localNotes = getLocal(`video_notes_${videoId}`) || [];
  const filtered = localNotes.filter((n: VideoNote) => n.id !== noteId);
  setLocal(`video_notes_${videoId}`, filtered);
  return true;
};

export const exportNotesAsMarkdown = (notes: VideoNote[], videoTitle: string): string => {
  let markdown = `# Notes for: ${videoTitle}\n\n`;
  markdown += `Generated: ${new Date().toLocaleString()}\n\n---\n\n`;

  notes.forEach((note, index) => {
    markdown += `## Note ${index + 1}\n\n`;
    if (note.timestamp !== undefined) {
      const minutes = Math.floor(note.timestamp / 60);
      const seconds = note.timestamp % 60;
      markdown += `**Timestamp**: ${minutes}:${seconds.toString().padStart(2, '0')}\n\n`;
    }
    markdown += `${note.content}\n\n`;
    markdown += `*Created: ${new Date(note.created_at).toLocaleString()}*\n\n---\n\n`;
  });

  return markdown;
};

// --- FLASHCARD SYSTEM ---

export interface FlashcardDeck {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  course_id?: string;
  created_at: string;
  updated_at: string;
  card_count?: number; // Computed field
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  interval: number;
  ease_factor: number;
  repetitions: number;
  next_review_date: string;
  created_at: string;
  updated_at: string;
}

export const createDeck = async (title: string, description?: string, courseId?: string): Promise<FlashcardDeck | null> => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { data, error } = await supabase
          .from('flashcard_decks')
          .insert({
            user_id: user.id,
            title,
            description,
            course_id: courseId
          })
          .select()
          .single();

        if (!error && data) {
          return data as FlashcardDeck;
        }
      } catch (err) {
        console.error('Error creating deck:', err);
      }
    }
  }
  return null;
};

export const getDecks = async (): Promise<FlashcardDeck[]> => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { data, error } = await supabase
          .from('flashcard_decks')
          .select('*, flashcards(count)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map(deck => ({
            ...deck,
            card_count: deck.flashcards?.[0]?.count || 0
          })) as FlashcardDeck[];
        }
      } catch (err) {
        console.error('Error fetching decks:', err);
      }
    }
  }
  return [];
};

export const addCard = async (deckId: string, front: string, back: string): Promise<Flashcard | null> => {
  if (supabase) {
    try {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Authentication error:', authError);
        return null;
      }

      // Verify deck ownership
      const { data: deckData, error: deckError } = await supabase
        .from('flashcard_decks')
        .select('id, user_id')
        .eq('id', deckId)
        .eq('user_id', user.id)
        .single();

      if (deckError || !deckData) {
        console.error('❌ Deck not found or access denied:', deckError);
        return null;
      }

      const initialState = getInitialSM2State();

      console.log('📝 Attempting to add card to deck:', deckId);
      const { data, error } = await supabase
        .from('flashcards')
        .insert({
          deck_id: deckId,
          front,
          back,
          interval: initialState.interval,
          ease_factor: initialState.easeFactor,
          repetitions: initialState.repetitions,
          next_review_date: new Date().toISOString() // Due immediately
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding card:', error);
        return null;
      }

      if (data) {
        console.log('✅ Card added successfully:', data.id);
        return data as Flashcard;
      }
    } catch (err) {
      console.error('💥 Unexpected error adding card:', err);
    }
  }
  return null;
};

export const getDueCards = async (): Promise<Flashcard[]> => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        // We need to join with decks to ensure user ownership
        // But for simplicity, we'll fetch decks first then cards, or use RLS
        // Since RLS enforces ownership, we can just query flashcards where deck.user_id is current user
        // However, standard Supabase query on 'flashcards' won't filter by deck owner unless we join

        // Better approach: Get all user decks, then get due cards for those decks
        const { data: decks } = await supabase
          .from('flashcard_decks')
          .select('id')
          .eq('user_id', user.id);

        if (decks && decks.length > 0) {
          const deckIds = decks.map(d => d.id);

          const { data, error } = await supabase
            .from('flashcards')
            .select('*')
            .in('deck_id', deckIds)
            .lte('next_review_date', new Date().toISOString())
            .order('next_review_date', { ascending: true });

          if (!error && data) {
            return data as Flashcard[];
          }
        }
      } catch (err) {
        console.error('Error fetching due cards:', err);
      }
    }
  }
  return [];
};

export const updateCardProgress = async (cardId: string, grade: number): Promise<Flashcard | null> => {
  if (supabase) {
    try {
      // 1. Get current card state
      const { data: currentCard, error: fetchError } = await supabase
        .from('flashcards')
        .select('interval, repetitions, ease_factor')
        .eq('id', cardId)
        .single();

      if (fetchError || !currentCard) {
        console.error('Error fetching card for update:', fetchError);
        return null;
      }

      // 2. Calculate new state using SM-2
      const currentSM2: SM2Item = {
        interval: currentCard.interval,
        repetitions: currentCard.repetitions,
        easeFactor: currentCard.ease_factor
      };

      const newState = calculateSM2(grade, currentSM2);

      // 3. Calculate next review date
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + newState.interval);

      // 4. Update database
      const { data, error } = await supabase
        .from('flashcards')
        .update({
          interval: newState.interval,
          repetitions: newState.repetitions,
          ease_factor: newState.easeFactor,
          next_review_date: nextReviewDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId)
        .select()
        .single();

      if (!error && data) {
        return data as Flashcard;
      }
    } catch (err) {
      console.error('Error updating card progress:', err);
    }
  }
  return null;
};
