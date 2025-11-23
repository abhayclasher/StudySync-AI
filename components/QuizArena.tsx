import React, { useState, useEffect } from 'react';
import { QuizQuestion, Flashcard } from '../types';
import { generateQuiz, generateFlashcards } from '../services/geminiService';
import {
  Trophy, CheckCircle, XCircle, Brain, ArrowRight, Loader2, Youtube, Type,
  BrainCircuit, RefreshCw, ArrowLeft, RotateCw, Check, X, Sparkles, ChevronLeft, ChevronRight, X as CloseIcon, Bookmark, Shuffle, Zap, Target, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Mode = 'setup' | 'quiz' | 'flashcards' | 'quiz-result';

interface QuizArenaProps {
  onQuizComplete?: (score: number, total: number) => void;
  onFlashcardsCreated?: () => void;
}

const QuizArena: React.FC<QuizArenaProps> = ({ onQuizComplete, onFlashcardsCreated }) => {
  // View Management - Persisted
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('qa_mode') as Mode) || 'setup';
    }
    return 'setup';
  });

  const [inputMode, setInputMode] = useState<'topic' | 'youtube'>('topic');
  const [inputValue, setInputValue] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('qa_input') || '';
    return '';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // Quiz State - Persisted
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('qa_questions');
      try { return s ? JSON.parse(s) : []; } catch { return []; }
    }
    return [];
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    if (typeof window !== 'undefined') return parseInt(localStorage.getItem('qa_q_index') || '0');
    return 0;
  });

  const [score, setScore] = useState(() => {
    if (typeof window !== 'undefined') return parseInt(localStorage.getItem('qa_score') || '0');
    return 0;
  });

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // New State for Quiz Modes
  const [quizMode, setQuizMode] = useState<'standard' | 'blitz' | 'deep-dive'>('standard');
  const [timeLeft, setTimeLeft] = useState(15); // 15s for Blitz

  // Flashcard State
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('qa_flashcards');
      try { return s ? JSON.parse(s) : []; } catch { return []; }
    }
    return [];
  });

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0); // 0 = neutral, 1 = right, -1 = left

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => { localStorage.setItem('qa_mode', mode); }, [mode]);
  useEffect(() => { localStorage.setItem('qa_input', inputValue); }, [inputValue]);
  useEffect(() => { localStorage.setItem('qa_questions', JSON.stringify(quizQuestions)); }, [quizQuestions]);
  useEffect(() => { localStorage.setItem('qa_q_index', currentQuestionIndex.toString()); }, [currentQuestionIndex]);
  useEffect(() => { localStorage.setItem('qa_score', score.toString()); }, [score]);
  useEffect(() => { localStorage.setItem('qa_flashcards', JSON.stringify(flashcards)); }, [flashcards]);

  // --- TIMER EFFECT FOR BLITZ ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'quiz' && quizMode === 'blitz' && !isAnswerChecked && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleCheckAnswer(true); // Auto-submit on timeout
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, quizMode, isAnswerChecked, timeLeft]);

  // --- HANDLERS ---

  const handleGenerate = async (targetMode: 'quiz' | 'flashcards', difficulty: 'standard' | 'hard' | 'rapid' = 'standard') => {
    if (!inputValue) {
      alert("Please enter a topic or YouTube URL first!");
      return;
    }
    setIsLoading(true);
    setLoadingText(targetMode === 'quiz' ?
      (difficulty === 'rapid' ? "Preparing rapid-fire round..." : difficulty === 'hard' ? "Constructing complex problems..." : "Crafting challenging questions...")
      : "Generating active recall cards...");

    try {
      if (targetMode === 'quiz') {
        const questions = await generateQuiz(inputValue, inputMode === 'youtube', difficulty);
        setQuizQuestions(questions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswerChecked(false);
        setQuizMode(difficulty === 'rapid' ? 'blitz' : difficulty === 'hard' ? 'deep-dive' : 'standard');
        setTimeLeft(15); // Reset timer for Blitz
        setMode('quiz');
      } else {
        const cards = await generateFlashcards(inputValue, inputMode === 'youtube');
        setFlashcards(cards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setMode('flashcards');
        if (onFlashcardsCreated) onFlashcardsCreated();
      }
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(index);
  };

  const handleCheckAnswer = (autoSubmit = false) => {
    if (selectedAnswer === null && !autoSubmit) return;

    setIsAnswerChecked(true);
    // If autoSubmit (timeout) and no answer selected, it counts as wrong (selectedAnswer is null)
    if (selectedAnswer !== null && selectedAnswer === quizQuestions[currentQuestionIndex].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setTimeLeft(15); // Reset timer
    } else {
      setMode('quiz-result');
      if (onQuizComplete) {
        // Calculate final score logic if needed, but score is already updated
        onQuizComplete(score, quizQuestions.length);
      }
    }
  };

  // Flashcard Navigation
  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setDirection(1);
      setIsFlipped(false);
      setCurrentCardIndex(i => i + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setDirection(-1);
      setIsFlipped(false);
      setCurrentCardIndex(i => i - 1);
    }
  };

  const resetPractice = () => {
    setMode('setup');
    setInputValue('');
    setQuizQuestions([]);
    setFlashcards([]);
    setScore(0);
    setCurrentQuestionIndex(0);
    setTimeLeft(15);
  };

  // Variants for Sliding Animation
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.8
    })
  };

  // --- RENDER VIEWS ---

  // 1. Setup View - Redesigned Premium UI
  if (mode === 'setup') {
    return (
      <div className="flex flex-col items-center w-full max-w-5xl mx-auto px-4 py-4 md:py-6 xl:py-12 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-6 border border-white/10 shadow-2xl shadow-primary/10 backdrop-blur-sm">
              <BrainCircuit size={32} className="text-primary mr-3" />
              <h2 className="text-2xl md:text-3xl xl:text-5xl font-bold text-white tracking-tight">
                Knowledge <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">Arena</span>
              </h2>
            </div>
            <p className="text-slate-400 max-w-lg mx-auto text-base md:text-lg font-medium leading-relaxed">
              Master any subject with AI-powered active recall. Generate quizzes and flashcards instantly.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 p-1 md:p-2 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl relative overflow-hidden mx-auto max-w-3xl">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="bg-[#050505] rounded-[1.3rem] md:rounded-[1.8rem] p-4 md:p-6 xl:p-10 relative z-10">
              {/* Input Mode Toggles */}
              <div className="flex justify-center mb-8">
                <div className="bg-black/40 p-1.5 rounded-xl flex space-x-1 border border-white/5 backdrop-blur-md">
                  <button
                    onClick={() => setInputMode('topic')}
                    className={`flex items-center px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${inputMode === 'topic' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <Type size={16} className="mr-2" /> Topic
                  </button>
                  <button
                    onClick={() => setInputMode('youtube')}
                    className={`flex items-center px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${inputMode === 'youtube' ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <Youtube size={16} className="mr-2" /> YouTube
                  </button>
                </div>
              </div>

              {/* Input Field */}
              <div className="relative mb-10 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-2xl opacity-0 group-focus-within:opacity-100 transition duration-500 blur"></div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate('quiz')}
                    placeholder={inputMode === 'topic' ? "What do you want to master today?" : "Paste YouTube URL here..."}
                    className="w-full bg-black border border-white/10 rounded-2xl px-4 md:px-6 py-3 md:py-4 xl:py-6 text-white text-sm md:text-lg xl:text-xl focus:border-transparent focus:ring-0 focus:outline-none transition-all placeholder:text-slate-600 text-center font-medium"
                  />
                  {inputValue && (
                    <button
                      onClick={() => setInputValue('')}
                      className="absolute right-4 p-2 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <CloseIcon size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons (Premium Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 xl:gap-6">
                <button
                  onClick={() => handleGenerate('quiz')}
                  disabled={isLoading}
                  className="group relative w-full text-left bg-[#0a0a0a] border border-white/10 hover:border-purple-500/50 rounded-2xl p-5 md:p-6 h-auto transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl duration-500"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shadow-inner group-hover:shadow-lg group-hover:shadow-purple-500/40">
                        {isLoading && loadingText.includes('questions') ? <Loader2 className="animate-spin" /> : <Trophy size={24} className="md:w-7 md:h-7" />}
                      </div>
                      <div className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-purple-500/20">
                        Challenge
                      </div>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">Start Quiz</h3>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">Test your knowledge with AI-generated multiple choice questions.</p>
                    <div className="mt-auto flex items-center text-purple-400 text-sm font-bold group-hover:translate-x-2 transition-transform">
                      Begin Challenge <ArrowRight size={16} className="ml-2" />
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleGenerate('flashcards')}
                  disabled={isLoading}
                  className="group relative w-full text-left bg-[#0a0a0a] border border-white/10 hover:border-emerald-500/50 rounded-2xl p-5 md:p-6 h-auto transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl duration-500"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-inner group-hover:shadow-lg group-hover:shadow-emerald-500/40">
                        {isLoading && loadingText.includes('cards') ? <Loader2 className="animate-spin" /> : <BrainCircuit size={24} className="md:w-7 md:h-7" />}
                      </div>
                      <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-emerald-500/20">
                        Practice
                      </div>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-emerald-200 transition-colors">Flashcards</h3>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">Active recall practice with AI-generated spaced repetition cards.</p>
                    <div className="mt-auto flex items-center text-emerald-400 text-sm font-bold group-hover:translate-x-2 transition-transform">
                      Create Deck <ArrowRight size={16} className="ml-2" />
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleGenerate('quiz', 'rapid')}
                  disabled={isLoading}
                  className="group relative w-full text-left bg-[#0a0a0a] border border-white/10 hover:border-blue-500/50 rounded-2xl p-5 md:p-6 h-auto transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl duration-500"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-inner group-hover:shadow-lg group-hover:shadow-blue-500/40">
                        <Zap size={24} className="md:w-7 md:h-7" />
                      </div>
                      <div className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-blue-500/20">
                        Speed Blitz
                      </div>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">Speed Blitz</h3>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">Rapid-fire questions to test your quick thinking and reflexes.</p>
                    <div className="mt-auto flex items-center text-blue-400 text-sm font-bold group-hover:translate-x-2 transition-transform">
                      Start Blitz <ArrowRight size={16} className="ml-2" />
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleGenerate('quiz', 'hard')}
                  disabled={isLoading}
                  className="group relative w-full text-left bg-[#0a0a0a] border border-white/10 hover:border-orange-500/50 rounded-2xl p-5 md:p-6 h-auto transition-all hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl duration-500"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 shadow-inner group-hover:shadow-lg group-hover:shadow-orange-500/40">
                        <Target size={24} className="md:w-7 md:h-7" />
                      </div>
                      <div className="bg-orange-500/10 text-orange-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-orange-500/20">
                        Deep Dive
                      </div>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-orange-200 transition-colors">Deep Dive</h3>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">Complex, multi-step problems to master advanced concepts.</p>
                    <div className="mt-auto flex items-center text-orange-400 text-sm font-bold group-hover:translate-x-2 transition-transform">
                      Start Dive <ArrowRight size={16} className="ml-2" />
                    </div>
                  </div>
                </button>
              </div>

              {isLoading && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-[1.8rem]">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                    <Loader2 size={48} className="text-primary animate-spin relative z-10" />
                  </div>
                  <p className="text-white font-medium animate-pulse text-lg mt-6">{loadingText}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. Result View (Quiz)
  if (mode === 'quiz-result') {
    const percentage = quizQuestions.length > 0 ? Math.round((score / quizQuestions.length) * 100) : 0;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-10"
      >
        <div className="bg-[#050505] border border-white/5 p-8 md:p-12 rounded-[2rem] text-center max-w-lg w-full relative overflow-hidden shadow-2xl mx-4">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="inline-block p-6 rounded-full bg-yellow-500/10 mb-6"
            >
              <Trophy size={64} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h2>
            <p className="text-slate-400 mb-8 text-lg">You scored <span className="text-white font-bold">{score}</span> out of <span className="text-white font-bold">{quizQuestions.length}</span></p>

            <div className="w-full bg-white/5 rounded-full h-4 mb-8 overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full absolute top-0 left-0 ${percentage >= 70 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={resetPractice}
                className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
              >
                New Topic
              </button>
              <button
                onClick={() => handleGenerate('quiz')} // Retry same topic
                className="px-6 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-colors shadow-lg shadow-primary/20"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 3. Quiz View
  if (mode === 'quiz' && quizQuestions.length > 0) {
    const question = quizQuestions[currentQuestionIndex];
    return (
      <div className="flex flex-col justify-center h-full max-w-5xl mx-auto w-full px-4 py-2 md:py-2 xl:py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 md:mb-2 xl:mb-4 shrink-0">
          <button onClick={resetPractice} className="flex items-center text-slate-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg">
            <ArrowLeft size={16} className="mr-2" /> Exit
          </button>

          {/* Quiz Info / Timer */}
          <div className="flex items-center gap-4">
            {quizMode === 'blitz' && (
              <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                <Clock size={16} className={`${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`} />
                <span className={`font-mono font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-blue-400'}`}>{timeLeft}s</span>
              </div>
            )}

            {quizMode === 'deep-dive' && (
              <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                <Target size={16} className="text-orange-400" />
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Deep Dive</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-20 md:w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${quizMode === 'blitz' ? 'bg-blue-500' : quizMode === 'deep-dive' ? 'bg-orange-500' : 'bg-primary'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-500">
                {currentQuestionIndex + 1} / {quizQuestions.length}
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence mode='wait'>
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className={`bg-[#050505] border ${quizMode === 'deep-dive' ? 'border-orange-500/20' : quizMode === 'blitz' ? 'border-blue-500/20' : 'border-white/5'} p-4 md:p-4 xl:p-10 rounded-3xl shadow-2xl relative overflow-hidden min-h-[300px] xl:min-h-[400px] flex flex-col shrink-0`}
          >
            <h3 className="text-base md:text-lg xl:text-2xl font-bold text-white mb-3 md:mb-4 xl:mb-8 leading-relaxed">
              {question.question}
            </h3>

            <div className="space-y-2 md:space-y-3">
              {question.options.map((option, idx) => {
                let stateStyle = "border-white/10 hover:bg-white/5 hover:border-white/20 text-slate-300";
                if (isAnswerChecked) {
                  if (idx === question.correctAnswer) stateStyle = "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]";
                  else if (idx === selectedAnswer && selectedAnswer !== question.correctAnswer) stateStyle = "border-red-500 bg-red-500/10 text-red-400";
                  else stateStyle = "border-white/5 opacity-40";
                } else if (selectedAnswer === idx) {
                  stateStyle = "border-primary bg-primary/10 text-white shadow-[0_0_10px_rgba(124,58,237,0.2)]";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    disabled={isAnswerChecked}
                    className={`w-full text-left p-2 md:p-2 xl:p-5 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${stateStyle}`}
                  >
                    <div className="flex items-center w-full">
                      <div className={`w-8 h-8 rounded-full border-2 mr-4 flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${isAnswerChecked && idx === question.correctAnswer ? 'border-green-500 bg-green-500 text-black' :
                        selectedAnswer === idx ? 'border-primary bg-primary text-white' : 'border-white/20 text-slate-500'
                        }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-sm md:text-base flex-1">{option}</span>
                    </div>
                    {isAnswerChecked && idx === question.correctAnswer && <CheckCircle size={20} className="text-green-500 flex-shrink-0 ml-2" />}
                    {isAnswerChecked && idx === selectedAnswer && idx !== question.correctAnswer && <XCircle size={20} className="text-red-500 flex-shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-2 md:mt-2 xl:mt-4 flex justify-end shrink-0">
          {!isAnswerChecked ? (
            <button
              onClick={() => handleCheckAnswer()}
              disabled={selectedAnswer === null}
              className="bg-white text-black hover:bg-slate-200 px-6 py-3 md:px-8 md:py-3 lg:px-10 lg:py-4 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg shadow-white/10 text-sm md:text-base"
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 md:px-8 md:py-3 lg:px-10 lg:py-4 rounded-full font-bold flex items-center transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:scale-105 text-sm md:text-base"
            >
              {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'} <ArrowRight size={18} className="ml-2" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 4. Flashcards View - Redesigned Premium UI
  if (mode === 'flashcards' && flashcards.length > 0) {
    const currentCard = flashcards[currentCardIndex];
    const isBookmarked = flashcards[currentCardIndex].id ? (localStorage.getItem('qa_bookmarks')?.includes(flashcards[currentCardIndex].id) || false) : false;

    const toggleBookmark = (e: React.MouseEvent) => {
      e.stopPropagation();
      const bookmarks = JSON.parse(localStorage.getItem('qa_bookmarks') || '[]');
      const id = currentCard.id;
      if (bookmarks.includes(id)) {
        localStorage.setItem('qa_bookmarks', JSON.stringify(bookmarks.filter((b: string) => b !== id)));
      } else {
        localStorage.setItem('qa_bookmarks', JSON.stringify([...bookmarks, id]));
      }
    };

    return (
      <div className="max-w-4xl mx-auto w-full pt-4 md:pt-6 flex flex-col min-h-[calc(100vh-8rem)] px-4 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center">
            <button onClick={resetPractice} className="p-2 mr-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <BrainCircuit className="mr-2 text-emerald-500" size={24} />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">Flashcards</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">Mastery Deck • {flashcards.length} cards</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 ml-2 font-mono">
                {currentCardIndex + 1}/{flashcards.length}
              </span>
            </div>

            <button
              onClick={() => setFlashcards(prev => [...prev].sort(() => Math.random() - 0.5))}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
              title="Shuffle Deck"
            >
              <Shuffle size={18} />
            </button>
            <button
              onClick={() => handleGenerate('flashcards')}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-all hover:rotate-180 duration-500"
              title="Regenerate Deck"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="flex-1 flex items-center justify-center relative w-full max-w-2xl mx-auto perspective-1000 min-h-[350px]">
          {/* Prev Button - Desktop */}
          <button
            onClick={handlePrevCard}
            disabled={currentCardIndex === 0}
            className="hidden md:flex absolute -left-16 z-20 p-4 rounded-full bg-[#0a0a0a] border border-white/10 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-110 hover:border-emerald-500/50 shadow-xl"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Card Area */}
          <div className="relative w-full h-full md:aspect-[3/2] max-h-[500px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentCardIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 }
                }}
                className="absolute inset-0 w-full h-full cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Flipping Container */}
                <motion.div
                  className="w-full h-full relative transition-all duration-500 transform-style-3d"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                >
                  {/* Front Face */}
                  <div className="absolute inset-0 backface-hidden bg-[#0a0a0a] border border-white/10 p-6 md:p-10 rounded-3xl flex flex-col items-center justify-center text-center shadow-[0_0_40px_rgba(0,0,0,0.5)] hover:border-emerald-500/30 group transition-all">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />

                    <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-white/10 px-2 py-1 rounded bg-black/20 backdrop-blur-sm">Question</span>
                      <div className="flex gap-2">
                        <button
                          onClick={toggleBookmark}
                          className={`p-2 hover:bg-white/10 rounded-full transition-colors ${isBookmarked ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-400'}`}
                        >
                          <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center w-full overflow-y-auto custom-scrollbar py-8">
                      <h3 className="text-xl md:text-3xl font-medium text-white leading-relaxed select-none">
                        {currentCard.front}
                      </h3>
                    </div>

                    <div className="absolute bottom-6 text-xs text-slate-500 flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                      <RotateCw size={12} className="animate-spin-slow" /> Tap to flip
                    </div>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0a0a0a] border border-emerald-500/20 p-6 md:p-10 rounded-3xl flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 to-transparent rounded-3xl pointer-events-none" />

                    <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 rounded backdrop-blur-sm">Answer</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center w-full overflow-y-auto custom-scrollbar py-8">
                      <p className="text-slate-200 text-lg md:text-xl leading-relaxed select-none font-medium">
                        {currentCard.back}
                      </p>
                    </div>

                    <div className="flex gap-3 mt-4 w-full relative z-20">
                      <button
                        className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all text-sm font-bold flex items-center justify-center hover:scale-[1.02] active:scale-95"
                        onClick={(e) => { e.stopPropagation(); handleNextCard(); }}
                      >
                        <X size={16} className="mr-2" /> Hard
                      </button>
                      <button
                        className="flex-1 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all text-sm font-bold flex items-center justify-center hover:scale-[1.02] active:scale-95"
                        onClick={(e) => { e.stopPropagation(); handleNextCard(); }}
                      >
                        <Check size={16} className="mr-2" /> Easy
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Next Button - Desktop */}
          <button
            onClick={handleNextCard}
            disabled={currentCardIndex === flashcards.length - 1}
            className="hidden md:flex absolute -right-16 z-20 p-4 rounded-full bg-[#0a0a0a] border border-white/10 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-110 hover:border-emerald-500/50 shadow-xl"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Mobile Navigation Controls */}
        <div className="md:hidden flex items-center justify-between mt-6 gap-4">
          <button
            onClick={handlePrevCard}
            disabled={currentCardIndex === 0}
            className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 text-white disabled:opacity-20 flex-1 flex justify-center active:bg-white/5"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNextCard}
            disabled={currentCardIndex === flashcards.length - 1}
            className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 text-white disabled:opacity-20 flex-1 flex justify-center active:bg-white/5"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="h-6"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-64">
      <p className="text-slate-400 mb-4">No active session found.</p>
      <button onClick={resetPractice} className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm">Return to Setup</button>
    </div>
  );
};

export default QuizArena;
