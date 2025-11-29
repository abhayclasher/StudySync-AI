import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, BookOpen, FileText, Zap, History, Sparkles, Plus, FolderOpen, ChevronDown, Target,
  Search, Star, TrendingUp, Calendar, Award, Settings, Grid3X3, List, Filter,
  Bookmark, Clock, BookmarkCheck, ArrowRight, BookmarkX, Trophy, BarChart3,
  ChevronRight, Home, BookmarkPlus, FilterX, Sparkle, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tabs } from './ui/tabs';
import QuizArena from './QuizArena';
import QuizHistory from './QuizHistory';
import { DeckManager } from './DeckManager';
import { FlashcardDeck } from './FlashcardDeck';
import { StudyMode } from './StudyMode';
import NotesManager from './NotesManager';
import GeneratedContent from './GeneratedContent';
import TestSeriesGenerator from './TestSeriesGenerator';
import TestSeriesArena from './TestSeriesArena';
import TestSeriesResult from './TestSeriesResult';
import { FlashcardDeck as FlashcardDeckType, Flashcard, QuizQuestion, TestAttempt } from '../types';

interface PracticeHubProps {
  onQuizComplete: (score: number, total: number, topic?: string) => void;
  onFlashcardsCreated: () => void;
}

export const PracticeHub: React.FC<PracticeHubProps> = ({ onQuizComplete, onFlashcardsCreated }) => {
  // Main UI state
  const [activeTab, setActiveTab] = useState('practice');
  const [practiceView, setPracticeView] = useState<'arena' | 'flashcards' | 'deepdive' | 'history' | 'testseries'>('arena');
  const [flashcardView, setFlashcardView] = useState<'generated' | 'decks'>('decks');
  const [notesView, setNotesView] = useState<'video' | 'custom'>('video');

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Quick access shortcuts state
  const [quickAccessOpen, setQuickAccessOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [starredItems, setStarredItems] = useState<any[]>([]);

  // Data state
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sliding tabs animation state
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [tabUnderlineWidth, setTabUnderlineWidth] = useState(0);
  const [tabUnderlineLeft, setTabUnderlineLeft] = useState(0);

  // Progress tracking state
  const [weeklyProgress, setWeeklyProgress] = useState<any[]>([]);

  // Navigation tabs configuration
  const tabs = [
    { value: 'practice', title: 'Practice', icon: <Zap size={16} /> },
    { value: 'notes', title: 'Notes', icon: <FileText size={16} /> },
    { value: 'flashcards', title: 'Flashcards', icon: <BookOpen size={16} /> }
  ];

  // Flashcard deck state
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeckType | null>(null);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [isStudying, setIsStudying] = useState(false);

  // Test Series state
  const [testSeriesId, setTestSeriesId] = useState<string | null>(null);
  const [testQuestions, setTestQuestions] = useState<QuizQuestion[]>([]);
  const [testTopic, setTestTopic] = useState('');
  const [testDifficulty, setTestDifficulty] = useState('medium');
  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase!.auth.getUser();

      if (!user) return;

      // Fetch profile and stats
      const { data: profile } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        // Parse weekly stats if it's a string, otherwise use as is
        const stats = typeof profile.weekly_stats === 'string'
          ? JSON.parse(profile.weekly_stats)
          : profile.weekly_stats || [];
        setWeeklyProgress(stats);
      }

      // Fetch recent activity (quizzes)
      const { data: quizzes } = await supabase!
        .from('quiz_history')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      // Fetch recent flashcard decks
      const { data: decks } = await supabase!
        .from('flashcard_decks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      // Combine and format activities
      const quizActivities = (quizzes || []).map((q: any) => ({
        id: q.id,
        type: 'quiz',
        title: q.topic || 'Quiz',
        score: q.score,
        total: q.total_questions,
        date: new Date(q.completed_at).toLocaleDateString(),
        timestamp: new Date(q.completed_at).getTime(),
        topic: q.topic
      }));

      const deckActivities = (decks || []).map((d: any) => ({
        id: d.id,
        type: 'flashcard',
        title: d.title,
        cards: d.card_count || 0,
        date: new Date(d.created_at).toLocaleDateString(),
        timestamp: new Date(d.created_at).getTime(),
        topic: 'Flashcards'
      }));

      const allActivities = [...quizActivities, ...deckActivities]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);

      setRecentActivity(allActivities);

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Test Series state


  // Components for main content sections

  // Flashcards Tab Content - My Decks Only
  const FlashcardsContent = () => (
    <div className="space-y-6">
      {/* Category Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-medium transition-all whitespace-nowrap ${selectedCategory === null
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#111] text-neutral-400 border border-white/5'
              }`}
          >
            All Decks
          </button>
          <button
            onClick={() => setSelectedCategory('review')}
            className={`px-3 py-1.5 rounded-2xl text-xs font-medium transition-all whitespace-nowrap ${selectedCategory === 'review'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#111] text-neutral-400 border border-white/5'
              }`}
          >
            Due for Review
          </button>
          <button
            onClick={() => setSelectedCategory('created')}
            className={`px-3 py-1.5 rounded-2xl text-xs font-medium transition-all whitespace-nowrap ${selectedCategory === 'created'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#111] text-neutral-400 border border-white/5'
              }`}
          >
            Recently Created
          </button>
        </div>

        <button
          onClick={() => setFlashcardView(flashcardView === 'decks' ? 'generated' : 'decks')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#111] border border-white/5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:border-white/20 transition-all"
        >
          {flashcardView === 'decks' ? <Sparkles size={14} /> : <BookOpen size={14} />}
          <span>{flashcardView === 'decks' ? 'AI Generated' : 'My Decks'}</span>
        </button>
      </div>

      {selectedDeck ? (
        isStudying ? (
          <StudyMode
            cards={studyCards}
            onClose={() => {
              setIsStudying(false);
              setStudyCards([]);
            }}
          />
        ) : (
          <FlashcardDeck
            deck={selectedDeck}
            onBack={() => setSelectedDeck(null)}
            onStartStudy={(cards) => {
              setStudyCards(cards);
              setIsStudying(true);
            }}
          />
        )
      ) : (
        <DeckManager onSelectDeck={async (deckId) => {
          if (supabase) {
            const { data: deck } = await supabase
              .from('flashcard_decks')
              .select('*')
              .eq('id', deckId)
              .single();
            if (deck) setSelectedDeck(deck);
          }
        }} />
      )}
    </div>
  );

  // Notes Tab Content
  const NotesContent = () => (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="bg-[#111] p-1.5 rounded-2xl flex space-x-1 border border-neutral-800">
          <button
            onClick={() => setNotesView('video')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${notesView === 'video'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
          >
            <FileText size={18} />
            <span>Video Notes</span>
          </button>
          <button
            onClick={() => setNotesView('custom')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${notesView === 'custom'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
          >
            <Plus size={18} />
            <span>My Notes</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {notesView === 'video' ? (
          <motion.div
            key="video"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <NotesManager type="video" />
          </motion.div>
        ) : (
          <motion.div
            key="custom"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <NotesManager type="custom" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Practice Tab Content
  const PracticeContent = () => (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="bg-[#111] p-1.5 rounded-2xl flex space-x-1 border border-neutral-800">
          <button
            onClick={() => setPracticeView('arena')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-sm transition-all ${practiceView === 'arena'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
          >
            <Zap size={16} />
            <span>Quiz Arena</span>
          </button>
          <button
            onClick={() => setPracticeView('testseries')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-sm transition-all ${practiceView === 'testseries'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
          >
            <Target size={16} />
            <span>AI Test Series</span>
          </button>
          <button
            onClick={() => setPracticeView('history')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-sm transition-all ${practiceView === 'history'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
          >
            <History size={16} />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {practiceView === 'arena' && (
        <QuizArena
          onQuizComplete={onQuizComplete}
          onFlashcardsCreated={onFlashcardsCreated}
        />
      )}
      {practiceView === 'testseries' && (
        testSeriesId && testQuestions.length > 0 && !testAttempt ? (
          <TestSeriesArena
            testId={testSeriesId}
            questions={testQuestions}
            topic={testTopic}
            difficulty={testDifficulty}
            onComplete={(result) => {
              // Store the test attempt result to show the results
              setTestAttempt(result);
            }}
            onBack={() => {
              setTestSeriesId(null);
              setTestQuestions([]);
              setTestTopic('');
              setTestDifficulty('medium');
            }}
          />
        ) : testAttempt ? (
          // Show test results when available
          <TestSeriesResult
            testAttempt={testAttempt}
            questions={testQuestions}
            onRetry={() => {
              // Reset the test attempt to go back to the generator
              setTestAttempt(null);
              // Reset other states if needed
              setTestSeriesId(null);
              setTestQuestions([]);
            }}
            onBack={() => {
              // Reset everything to go back to the main practice view
              setTestAttempt(null);
              setTestSeriesId(null);
              setTestQuestions([]);
              setTestTopic('');
              setTestDifficulty('medium');
              setPracticeView('arena'); // Go back to quiz arena
            }}
          />
        ) : (
          <TestSeriesGenerator
            onTestGenerated={(id, questions) => {
              setTestSeriesId(id);
              setTestQuestions(questions);
              // Extract topic and difficulty from the first question or use defaults
              setTestTopic(questions[0]?.subtopic || 'Test Series');
              setTestDifficulty(questions[0]?.difficulty || 'medium');
            }}
          />
        )
      )}
      {practiceView === 'history' && (
        <QuizHistory
          onRetry={() => setPracticeView('arena')}
          onBack={() => { }}
        />
      )}
    </div>
  );

  // Recent Activity Component - Redesigned as Dashboard Widget
  const RecentActivity = () => {
    if (loading) {
      return (
        <div className="bg-[#111] border border-white/5 rounded-[2rem] p-6 h-full">
          <h3 className="text-lg font-semibold text-white flex items-center mb-4">
            <Clock size={20} className="mr-2 text-blue-500" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-[#1a1a1a] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-[#111] border border-white/5 rounded-[2rem] p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Clock size={20} className="mr-2 text-blue-500" />
            Recent Activity
          </h3>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-neutral-400 hover:text-white">
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <History size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-[#1a1a1a] transition-all border border-transparent hover:border-white/5"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${activity.type === 'quiz' ? 'bg-blue-500/10 text-blue-400 shadow-blue-500/10' :
                  activity.type === 'test' ? 'bg-purple-500/10 text-purple-400 shadow-purple-500/10' :
                    'bg-emerald-500/10 text-emerald-400 shadow-emerald-500/10'
                  }`}>
                  {activity.type === 'quiz' && <Zap size={20} />}
                  {activity.type === 'test' && <Target size={20} />}
                  {activity.type === 'flashcard' && <BookOpen size={20} />}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">{activity.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                    <span className="capitalize">{activity.type}</span>
                    <span className="w-1 h-1 rounded-full bg-neutral-700" />
                    <span>{activity.date}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  {activity.type === 'quiz' || activity.type === 'test' ? (
                    <span className={`text-sm font-bold ${(activity.score / activity.total) >= 0.8 ? 'text-emerald-400' :
                      (activity.score / activity.total) >= 0.5 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                      {Math.round((activity.score / activity.total) * 100)}%
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-blue-400">
                      {activity.cards}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Progress Tracking Component - Redesigned as Dashboard Widget
  const ProgressTracking = () => {
    const stats = userProfile?.stats || { quizzesCompleted: 0, flashcardsReviewed: 0, focusSessions: 0 };

    return (
      <div className="bg-[#111] border border-white/5 rounded-[2rem] p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <TrendingUp size={20} className="mr-2 text-blue-500" />
            Your Progress
          </h3>
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#1a1a1a] rounded-2xl p-3 text-center border border-white/5">
            <div className="text-2xl font-bold text-white mb-1">{stats.quizzesCompleted}</div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Quizzes</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-3 text-center border border-white/5">
            <div className="text-2xl font-bold text-white mb-1">{stats.flashcardsReviewed}</div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Cards</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-3 text-center border border-white/5">
            <div className="text-2xl font-bold text-white mb-1">{Math.round(userProfile?.total_study_hours || 0)}h</div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Hours</div>
          </div>
        </div>

        {/* Weekly Chart Placeholder (Visual only for now) */}
        <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2">
          {[40, 65, 30, 85, 50, 95, 60].map((h, i) => (
            <div key={i} className="w-full bg-[#1a1a1a] rounded-t-lg relative group h-full flex items-end">
              <div
                className="w-full bg-gradient-to-t from-blue-900/40 to-blue-500 rounded-t-lg transition-all duration-500 hover:to-blue-400"
                style={{ height: `${h}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between px-2 mt-2 text-[10px] text-neutral-500 font-medium">
          <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
        </div>
      </div>
    );
  };

  // Quick Access Component - Redesigned as Horizontal Cards
  const QuickAccess = () => {
    const shortcuts = [
      { id: 1, title: 'Quick Quiz', subtitle: 'Test your knowledge', icon: <Zap size={20} />, color: 'bg-blue-500', action: () => setPracticeView('arena') },
      { id: 2, title: 'New Test', subtitle: 'Create custom exam', icon: <Target size={20} />, color: 'bg-purple-500', action: () => setPracticeView('testseries') },
      { id: 3, title: 'Flashcards', subtitle: 'Review deck', icon: <BookOpen size={20} />, color: 'bg-emerald-500', action: () => setActiveTab('flashcards') },
      { id: 4, title: 'Notes', subtitle: 'Capture ideas', icon: <FileText size={20} />, color: 'bg-orange-500', action: () => setNotesView('custom') },
    ];

    return (
      <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {shortcuts.map((shortcut) => (
          <motion.button
            key={shortcut.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={shortcut.action}
            className="flex items-center gap-4 bg-[#111] border border-white/5 p-4 rounded-[1.5rem] hover:border-white/10 hover:bg-[#161616] transition-all text-left group"
          >
            <div className={`w-12 h-12 rounded-2xl ${shortcut.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
              {shortcut.icon}
            </div>
            <div>
              <div className="font-semibold text-white text-sm">{shortcut.title}</div>
              <div className="text-xs text-neutral-500">{shortcut.subtitle}</div>
            </div>
          </motion.button>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#050505] text-white flex flex-col overflow-hidden">
      {/* Header Section */}
      <header className="hidden md:flex w-full px-8 py-6 items-center justify-between bg-[#050505]/80 backdrop-blur-xl z-20 sticky top-0 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Good morning, {userProfile?.name?.split(' ')[0] || 'Scholar'}
          </h1>
          <p className="text-neutral-400 text-sm">Ready to continue your learning journey?</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search topics, quizzes..."
              className="bg-[#111] border border-white/5 text-sm rounded-full pl-12 pr-4 py-3 w-64 focus:outline-none focus:border-blue-500/50 focus:bg-[#161616] transition-all text-white placeholder-neutral-600"
            />
          </div>
          <button className="w-12 h-12 rounded-full bg-[#111] border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#161616] transition-all relative">
            <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-[#111]"></div>
            <Bookmark size={20} />
          </button>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">
            {userProfile?.name?.[0] || 'U'}
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pt-4">
        <div className="max-w-[1920px] mx-auto">

          {/* Quick Access Row */}
          <QuickAccess />

          <div className="grid grid-cols-12 gap-8 h-full">
            {/* Left Column - Main Study Area (Span 8) */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

              {/* Navigation Tabs */}
              <div className="relative flex items-center bg-[#111] p-1.5 rounded-2xl w-fit border border-white/5">
                {tabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === tab.value ? 'text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                  >
                    {activeTab === tab.value && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/20"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {tab.icon}
                      {tab.title}
                    </span>
                  </button>
                ))}
              </div>

              {/* Dynamic Content Area */}
              <div className="flex-1 min-h-[500px] bg-[#111] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {activeTab === 'practice' && <PracticeContent />}
                    {activeTab === 'notes' && <NotesContent />}
                    {activeTab === 'flashcards' && <FlashcardsContent />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column - Widgets (Span 4) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="h-[400px]">
                <ProgressTracking />
              </div>
              <div className="flex-1 min-h-[400px]">
                <RecentActivity />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PracticeHub;
