
export enum ViewState {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  ROADMAP = 'ROADMAP',
  PRACTICE = 'PRACTICE',
  NOTES = 'NOTES',
  QUIZ_ANALYTICS = 'QUIZ_ANALYTICS',
  VIDEO_PLAYER = 'VIDEO_PLAYER',
  PROFILE = 'PROFILE'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
  attachments?: { name: string; type: 'file' | 'image' }[];
}

export interface Step {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'thinking' | 'completed' | 'error';
  details?: string;
  timestamp?: Date;
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
  resources?: { title: string; url: string; type: 'video' | 'article' | 'doc' }[];
  checklist?: { id: string; text: string; completed: boolean }[];
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
  email?: string;
  avatar_url?: string;
  bio?: string;
  social_links?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
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

// Base Question Interface
export interface BaseQuestion {
  id: string;
  examType?: 'NEET' | 'JEE-Main' | 'JEE-Advanced' | 'GATE' | 'CAT' | 'UPSC' | 'SSC' | 'General';
  subject?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  marks?: number;
  negativeMarks?: number;
  timeEstimate?: number; // seconds
  explanation?: string;
  hasLatex?: boolean;
}

// Single Correct MCQ
export interface SingleCorrectMCQ extends BaseQuestion {
  type: 'single-correct-mcq' | 'multiple-choice'; // multiple-choice for backward compatibility
  question: string;
  options: string[];
  correctAnswer: number;
}

// Diagram-Based Question
export interface DiagramQuestion extends BaseQuestion {
  type: 'diagram-mcq' | 'diagram-numerical';
  question: string;
  diagramDescription: string;
  diagramType: 'anatomical' | 'biological' | 'chemical-structure' | 'circuit' | 'mechanical' | 'graph';
  diagramData?: any; // For rendering
  options?: string[];
  correctAnswer?: number;
  numericalAnswer?: number;
}

// Numerical Questions
export interface NumericalQuestion extends BaseQuestion {
  type: 'numerical-integer' | 'numerical-decimal' | 'numerical-range' | 'numerical'; // numerical for backward compatibility
  question: string;
  answer: number;
  tolerance?: number;
  acceptableRange?: [number, number];
  unit?: string;
  decimalPlaces?: number;
  options?: string[]; // Optional for backward compatibility if needed
  correctAnswer?: number; // Optional for backward compatibility
}

// Assertion-Reason
export interface AssertionReasonQuestion extends BaseQuestion {
  type: 'assertion-reason';
  assertion: string;
  reason: string;
  options: string[]; // Standard 5 options for A-R questions
  correctAnswer: number;
  question: string; // Usually "Assertion-Reason" or combined text
}

// Multiple Correct
export interface MultipleCorrectQuestion extends BaseQuestion {
  type: 'multiple-correct-mcq' | 'multiple-select';
  question: string;
  options: string[];
  correctAnswers: number[];
  partialMarking?: boolean;
  partialMarks?: {
    allCorrect: number;
    someCorrect: number;
    anyIncorrect: number;
  };
}

// Matrix Matching
export interface MatrixMatchingQuestion extends BaseQuestion {
  type: 'matrix-matching';
  question: string;
  columnA: Array<{ id: string; text: string }>;
  columnB: Array<{ id: string; text: string }>;
  correctMatches: Record<string, string[]>;
  partialMarking?: boolean;
}

// Paragraph-Based
export interface ParagraphQuestion extends BaseQuestion {
  type: 'paragraph-based' | 'reading-comprehension';
  paragraph: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
}

// Data Interpretation
export interface DataInterpretationQuestion extends BaseQuestion {
  type: 'data-interpretation';
  dataDescription: string;
  dataType: 'table' | 'pie-chart' | 'bar-graph' | 'line-graph' | 'mixed';
  dataContent: any;
  questions: Array<{
    id: string;
    question: string;
    options?: string[];
    correctAnswer?: number;
    numericalAnswer?: number;
  }>;
}

// Statement-Based
export interface StatementQuestion extends BaseQuestion {
  type: 'statement-mcq';
  question: string;
  statements: string[];
  options: string[];
  correctAnswer: number;
}

// TITA (Type In The Answer)
export interface TITAQuestion extends BaseQuestion {
  type: 'tita';
  question: string;
  answer: string | number;
  answerType: 'integer' | 'decimal' | 'text';
}

// Legacy support wrapper
export interface LegacyQuizQuestion extends BaseQuestion {
  type: 'true-false';
  question: string;
  options: string[];
  correctAnswer: number;
}

// Union Type
export type QuizQuestion =
  | SingleCorrectMCQ
  | DiagramQuestion
  | NumericalQuestion
  | AssertionReasonQuestion
  | MultipleCorrectQuestion
  | MatrixMatchingQuestion
  | ParagraphQuestion
  | DataInterpretationQuestion
  | StatementQuestion
  | TITAQuestion
  | LegacyQuizQuestion;

// Enhanced Test Series Types
export interface QuestionFigure {
  description: string;
  type: 'graph' | 'diagram' | 'circuit' | 'chemical-structure' | 'table' | 'chart';
  url?: string; // Placeholder or actual image URL
}

export type EnhancedQuizQuestion = QuizQuestion & {
  figure?: QuestionFigure;
  hasLatex?: boolean;
  marks: number;
  negativeMarks: number;
  section?: string;
  questionType?: 'conceptual' | 'numerical' | 'analytical';
};

export interface TestSection {
  name: string;
  questionCount: number;
  timeLimit?: number; // in seconds
  questions: EnhancedQuizQuestion[];
}

export interface MarkingScheme {
  correct: number;
  incorrect: number;
  unattempted: number;
}

export type ExamPattern = 'JEE' | 'NEET' | 'UPSC' | 'SSC' | 'CAT' | 'GATE' | 'Custom';

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

// Test Series Types
export interface TestSeries {
  id: string;
  user_id: string;
  title: string;
  topic: string;
  exam_type?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  total_questions: number;
  time_limit: number;
  questions: any[];
  reference_papers?: string;
  negative_marking: boolean;
  created_at: string;
  // Enhanced fields for competitive exams
  sections?: TestSection[];
  has_figures?: boolean;
  marking_scheme?: MarkingScheme;
  exam_pattern?: ExamPattern;
  updated_at: string;
}

export interface TestAttempt {
  id: string;
  user_id: string;
  test_series_id: string;
  score: number;
  total_questions: number;
  time_taken?: number;
  answers: any[];
  completed_at: string;
  created_at: string;
  // Extended properties for UI
  topic?: string;
  examType?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface TestSeriesMetadata {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  examType?: string;
  totalQuestions: number;
  usedReferencePapers: boolean;
  generatedAt: string;
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
