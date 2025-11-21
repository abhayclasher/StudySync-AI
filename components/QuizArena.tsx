
import React, { useState, useEffect } from 'react';
import { QuizQuestion, Flashcard } from '../types';
import { generateQuiz, generateFlashcards } from '../services/geminiService';
import { 
  Trophy, CheckCircle, XCircle, Brain, ArrowRight, Loader2, Youtube, Type, 
  BrainCircuit, RefreshCw, ArrowLeft, RotateCw, Check, X, Sparkles, ChevronLeft, ChevronRight, X as CloseIcon 
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

  // --- HANDLERS ---

  const handleGenerate = async (targetMode: 'quiz' | 'flashcards') => {
    if (!inputValue) {
        alert("Please enter a topic or YouTube URL first!");
        return;
    }
    setIsLoading(true);
    setLoadingText(targetMode === 'quiz' ? "Crafting challenging questions..." : "Generating active recall cards...");

    try {
      if (targetMode === 'quiz') {
        const questions = await generateQuiz(inputValue, inputMode === 'youtube');
        setQuizQuestions(questions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswerChecked(false);
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

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;
    setIsAnswerChecked(true);
    if (selectedAnswer === quizQuestions[currentQuestionIndex].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } else {
      setMode('quiz-result');
      if (onQuizComplete) {
        const finalScore = (selectedAnswer === quizQuestions[currentQuestionIndex].correctAnswer) ? score + 1 : score;
        onQuizComplete(finalScore, quizQuestions.length);
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

  // 1. Setup View
  if (mode === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] w-full max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full px-4"
        >
          <div className="text-center mb-12">
             <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Knowledge <span className="text-primary">Arena</span>
             </h2>
             <p className="text-slate-400 max-w-lg mx-auto text-base md:text-lg">
                Generate interactive quizzes or flashcards instantly from any topic or YouTube video.
             </p>
          </div>

          <div className="bg-[#050505] border border-white/5 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden max-w-3xl mx-auto">
            {/* Input Mode Toggles */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/5 p-1 rounded-xl flex space-x-1">
                <button 
                  onClick={() => setInputMode('topic')}
                  className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${inputMode === 'topic' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  <Type size={16} className="mr-2" /> Topic
                </button>
                <button 
                  onClick={() => setInputMode('youtube')}
                  className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${inputMode === 'youtube' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  <Youtube size={16} className="mr-2" /> YouTube
                </button>
              </div>
            </div>

            {/* Input Field */}
            <div className="relative mb-10">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate('quiz')}
                placeholder={inputMode === 'topic' ? "e.g., Organic Chemistry, React Hooks..." : "Paste YouTube URL here..."}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white text-lg focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder:text-slate-500 text-center"
              />
              {inputValue && (
                <button 
                  onClick={() => setInputValue('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
                >
                  <CloseIcon size={16} />
                </button>
              )}
            </div>

            {/* Action Buttons (Standard Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
               <button 
                  onClick={() => handleGenerate('quiz')}
                  disabled={isLoading}
                  className="group relative w-full text-left bg-[#0a0a0a] border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 h-auto transition-all hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02] active:scale-95"
               >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center mb-4 text-white shadow-lg shadow-purple-600/30 group-hover:scale-110 transition-transform">
                        {isLoading && loadingText.includes('questions') ? <Loader2 className="animate-spin" /> : <Trophy size={24} />}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Start Quiz</h3>
                    <p className="text-sm text-slate-300 mb-4">Test your knowledge with AI-generated multiple choice questions.</p>
                    <div className="mt-auto flex items-center text-purple-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                        Begin Challenge <ArrowRight size={16} className="ml-2" />
                    </div>
                  </div>
               </button>

               <button 
                  onClick={() => handleGenerate('flashcards')}
                  disabled={isLoading}
                  className="group relative w-full text-left bg-[#0a0a0a] border border-white/10 hover:border-emerald-500/50 rounded-2xl p-6 h-auto transition-all hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.02] active:scale-95"
               >
                   <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                   <div className="relative z-10 flex flex-col h-full">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center mb-4 text-white shadow-lg shadow-emerald-600/30 group-hover:scale-110 transition-transform">
                            {isLoading && loadingText.includes('cards') ? <Loader2 className="animate-spin" /> : <BrainCircuit size={24} />}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Flashcards</h3>
                        <p className="text-sm text-slate-300 mb-4">Active recall practice with AI-generated spaced repetition cards.</p>
                        <div className="mt-auto flex items-center text-emerald-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                            Create Deck <ArrowRight size={16} className="ml-2" />
                        </div>
                   </div>
               </button>
            </div>
            
            {isLoading && (
               <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-3xl">
                  <Loader2 size={48} className="text-primary animate-spin mb-4" />
                  <p className="text-white font-medium animate-pulse text-lg">{loadingText}</p>
               </div>
            )}
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
        className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]"
      >
        <div className="bg-[#050505] border border-white/5 p-12 rounded-[2rem] text-center max-w-lg w-full relative overflow-hidden shadow-2xl">
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
      <div className="max-w-4xl mx-auto w-full pt-10 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={resetPractice} className="flex items-center text-slate-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg">
             <ArrowLeft size={16} className="mr-2" /> Exit
          </button>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                />
            </div>
            <span className="text-xs font-bold text-slate-500">
                {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
          </div>
        </div>

        <AnimatePresence mode='wait'>
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-[#050505] border border-white/5 p-6 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col justify-center"
          >
            <h3 className="text-xl md:text-2xl font-bold text-white mb-8 leading-relaxed">
              {question.question}
            </h3>

            <div className="space-y-3">
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
                    className={`w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${stateStyle}`}
                  >
                    <div className="flex items-center w-full">
                       <div className={`w-8 h-8 rounded-full border-2 mr-4 flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                           isAnswerChecked && idx === question.correctAnswer ? 'border-green-500 bg-green-500 text-black' :
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

        <div className="mt-8 flex justify-end">
            {!isAnswerChecked ? (
              <button
                onClick={handleCheckAnswer}
                disabled={selectedAnswer === null}
                className="bg-white text-black hover:bg-slate-200 px-10 py-4 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg shadow-white/10"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-full font-bold flex items-center transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:scale-105"
              >
                {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'} <ArrowRight size={18} className="ml-2" />
              </button>
            )}
        </div>
      </div>
    );
  }

  // 4. Flashcards View - Redesigned Carousel
  if (mode === 'flashcards' && flashcards.length > 0) {
    const currentCard = flashcards[currentCardIndex];

    return (
      <div className="max-w-4xl mx-auto w-full pt-6 flex flex-col h-[calc(100vh-10rem)] px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center">
             <button onClick={resetPractice} className="p-2 mr-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
                <ArrowLeft size={20} />
             </button>
             <div>
               <h2 className="text-xl font-bold text-white flex items-center">
                 <BrainCircuit className="mr-2 text-emerald-500" size={24} /> Flashcards
               </h2>
               <p className="text-xs text-slate-500">Deck size: {flashcards.length} cards</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-white/5 px-3 py-1 rounded-full text-xs text-slate-400 font-mono">
                {currentCardIndex + 1} / {flashcards.length}
             </div>
             <button onClick={() => handleGenerate('flashcards')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white flex items-center transition-colors">
               <RefreshCw size={14} className="mr-2" /> Regenerate
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="flex-1 flex items-center justify-center relative w-full max-w-2xl mx-auto perspective-1000">
           {/* Prev Button */}
           <button 
             onClick={handlePrevCard} 
             disabled={currentCardIndex === 0}
             className="absolute left-0 md:-left-16 z-20 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-110"
           >
              <ChevronLeft size={32} />
           </button>

           {/* Card Area */}
           <div className="relative w-full aspect-[4/3] md:aspect-[3/2]">
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
                    opacity: { duration: 0.2 }
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
                      <div className="absolute inset-0 backface-hidden bg-[#050505] border border-white/10 p-8 md:p-12 rounded-3xl flex flex-col items-center justify-center text-center shadow-2xl hover:border-emerald-500/30 group">
                          <span className="absolute top-6 left-6 text-xs font-bold text-slate-500 uppercase tracking-widest border border-white/5 px-2 py-1 rounded">Question</span>
                          
                          <h3 className="text-xl md:text-3xl font-medium text-white leading-relaxed select-none">
                            {currentCard.front}
                          </h3>
                          
                          <div className="absolute bottom-6 text-xs text-slate-500 flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                             <RotateCw size={14} /> Click to flip
                          </div>
                      </div>

                      {/* Back Face */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0a0a0a] border border-emerald-500/30 p-8 md:p-12 rounded-3xl flex flex-col items-center justify-center text-center shadow-2xl shadow-emerald-900/10">
                          <span className="absolute top-6 left-6 text-xs font-bold text-emerald-500 uppercase tracking-widest border border-emerald-900/30 bg-emerald-900/10 px-2 py-1 rounded">Answer</span>
                          
                          <p className="text-slate-200 text-lg md:text-xl leading-relaxed select-none">
                            {currentCard.back}
                          </p>

                          <div className="flex gap-4 mt-8 absolute bottom-8">
                            <button 
                                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-bold flex items-center"
                                onClick={(e) => { e.stopPropagation(); handleNextCard(); }}
                            >
                                <X size={16} className="mr-2" /> Hard
                            </button>
                            <button 
                                className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm font-bold flex items-center"
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

           {/* Next Button */}
           <button 
             onClick={handleNextCard} 
             disabled={currentCardIndex === flashcards.length - 1}
             className="absolute right-0 md:-right-16 z-20 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-110"
           >
              <ChevronRight size={32} />
           </button>
        </div>

        <div className="h-12"></div> {/* Spacer */}
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
