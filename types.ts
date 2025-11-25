
export enum ViewState {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  ROADMAP = 'ROADMAP',
  PRACTICE = 'PRACTICE',
  QUIZ_ANALYTICS = 'QUIZ_ANALYTICS',
  VIDEO_PLAYER = 'VIDEO_PLAYER'
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

export type Roadmap = RoadmapCourse;

export interface QuizResult {
  id?: string;
  user_id?: string;
  quiz_id?: string;
  score: number;
  total_questions: number;
  topic: string;
  mode: 'speed_blitz' | 'deep_dive' | 'standard' | 'blitz' | 'deep-dive'; // Union of all used modes
  time_taken?: number;
  questions: any[];
  created_at?: string;
  completed_at?: string;
}

export interface FlashcardDeck {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  course_id?: string;
  created_at: string;
  updated_at: string;
  card_count?: number;
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
  speedBlitz?: number;
  deepDive?: number;
  flashcards?: number;
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

// Web Speech API Type Definitions
export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Canvas-confetti type declarations
// Note: Disabled because canvas-confetti is not installed as a dependency
// To use canvas-confetti, install it: npm install canvas-confetti
// Then uncomment this module declaration
/*
declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    flat?: boolean;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
    resize?: boolean;
    useWorker?: boolean;
  }

  function confetti(options?: ConfettiOptions): Promise<void> | void;
  export = confetti;
}
*/
