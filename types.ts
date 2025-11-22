
export enum ViewState {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  ROADMAP = 'ROADMAP',
  QUIZ = 'QUIZ',
  VIDEO_PLAYER = 'VIDEO_PLAYER',
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
  attachments?: { name: string; type: 'file' | 'image' }[];
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Date;
  messages?: Message[];
}

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: 'pending' | 'in-progress' | 'completed' | 'live' | 'upcoming';
  videoUrl?: string;
  thumbnail?: string;
  lastWatchedTimestamp?: number;
  // Live stream specific fields
  isLive?: boolean;
  isUpcoming?: boolean;
  isCompleted?: boolean;
  liveStreamingDetails?: {
    actualStartTime?: string;
    scheduledStartTime?: string;
    actualEndTime?: string;
    concurrentViewers?: string;
  } | null;
}

export interface RoadmapCourse {
  id: string;
  topic: string;
  steps: RoadmapStep[];
  created_at: string;
  thumbnail?: string;
  progress: number;
  totalDuration?: string;
  user_id?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  masteryLevel: number; // 0-5
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'common' | 'rare' | 'epic' | 'legendary';
  condition: {
    type: 'xp' | 'streak' | 'level' | 'action' | 'focus_hours';
    threshold?: number;
    actionId?: string;
  };
  // User specific state
  unlocked: boolean;
  unlockedAt?: string; // ISO Date string for JSONB compatibility
  progress: number; // 0 to 100
}

export interface WeeklyStat {
  name: string;
  hours: number;
  videos: number;
  quizzes: number;
}

export interface SubjectMastery {
  subject: string;
  score: number;
  fullMark: number;
}

export interface UserStats {
  videosCompleted: number;
  quizzesCompleted: number;
  flashcardsReviewed: number;
  focusSessions: number;
}

export interface UserProfile {
  id?: string;
  name: string;
  xp: number;
  streak: number;
  level: number;
  total_study_hours: number;
  achievements: Achievement[]; // Stored as JSONB
  joinedAt?: Date;
  weeklyStats: WeeklyStat[];
  subjectMastery: SubjectMastery[];
  stats: UserStats;
}

export interface DocumentData {
  id: string;
  name: string;
  size: string;
  content: string;
  summary?: string;
  uploadDate: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  type: 'multiple-choice' | 'true-false';
}

export interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  completed: boolean;
  type?: 'quiz' | 'video' | 'reading' | 'task' | 'focus';
  xpReward: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'achievement';
  timestamp: Date;
  read: boolean;
}
