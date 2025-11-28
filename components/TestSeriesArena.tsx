import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Menu,
    X,
    Flag,
    Pause,
    Play,
    HelpCircle,
    Zap,
    AlertTriangle,
    Info,
    Image as ImageIcon
} from 'lucide-react';
import { QuizQuestion, TestAttempt, EnhancedQuizQuestion } from '../types';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { saveTestAttempt } from '../services/testSeriesDb';

// Helper component to render text with LaTeX formulas
const QuestionText: React.FC<{ text: string }> = ({ text }) => {
    // Split text by LaTeX delimiters $ ... $
    const parts = text.split(/(\$[^$]+\$)/g);

    return (
        <>
            {parts.map((part, index) => {
                // Check if this part is a LaTeX formula
                if (part.startsWith('$') && part.endsWith('$')) {
                    const formula = part.slice(1, -1); // Remove $ delimiters
                    return <InlineMath key={index} math={formula} />;
                }
                // Regular text
                return <span key={index}>{part}</span>;
            })}
        </>
    );
};

interface TestSeriesArenaProps {
    testId: string;
    questions: QuizQuestion[];
    duration?: number; // in seconds
    onComplete: (result: TestAttempt) => void;
    onExit?: () => void;
    onBack?: () => void;
    topic?: string;
    difficulty?: string;
    negativeMarking?: boolean;
}

const TestSeriesArena: React.FC<TestSeriesArenaProps> = ({
    testId,
    questions,
    duration,
    onComplete,
    onExit,
    onBack,
    topic,
    difficulty,
    negativeMarking = false
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeLeft, setTimeLeft] = useState(duration || questions.length * 120);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showQuestionList, setShowQuestionList] = useState(false);
    const [markedForReview, setMarkedForReview] = useState<number[]>([]);

    // New Features State
    const [isPaused, setIsPaused] = useState(false);
    const [lifelineUsed, setLifelineUsed] = useState<Record<number, boolean>>({});
    const [eliminatedOptions, setEliminatedOptions] = useState<Record<number, number[]>>({});
    const [showGuide, setShowGuide] = useState(true);

    useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPaused]);

    const handleAnswer = (optionIndex: number) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: optionIndex
        }));
    };

    const toggleMarkForReview = () => {
        setMarkedForReview(prev =>
            prev.includes(currentQuestionIndex)
                ? prev.filter(i => i !== currentQuestionIndex)
                : [...prev, currentQuestionIndex]
        );
    };

    const useLifeline = () => {
        if (lifelineUsed[currentQuestionIndex]) return;

        const currentQ = questions[currentQuestionIndex];
        const correct = currentQ.correctAnswer;
        const wrongOptions = currentQ.options
            .map((_, idx) => idx)
            .filter(idx => idx !== correct);

        // Randomly select 2 wrong options to eliminate
        const shuffled = wrongOptions.sort(() => 0.5 - Math.random());
        const toEliminate = shuffled.slice(0, 2);

        setEliminatedOptions(prev => ({
            ...prev,
            [currentQuestionIndex]: toEliminate
        }));
        setLifelineUsed(prev => ({
            ...prev,
            [currentQuestionIndex]: true
        }));
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        let score = 0;
        const answersList = questions.map((q, index) => {
            const selectedOption = answers[index];
            const isCorrect = selectedOption === q.correctAnswer;
            if (isCorrect) score++;
            // Negative marking logic
            if (!isCorrect && selectedOption !== undefined && negativeMarking) {
                score -= 0.25; // Deduct 0.25 for wrong answer
            }
            return {
                questionId: q.id,
                selectedOption,
                isCorrect
            };
        });

        // Ensure score isn't negative
        score = Math.max(0, score);

        const attemptData = {
            test_series_id: testId,
            score,
            total_questions: questions.length,
            time_taken: (duration || questions.length * 120) - timeLeft,
            answers: answersList
        };

        try {
            const savedAttempt = await saveTestAttempt(
                attemptData.test_series_id,
                attemptData.score,
                attemptData.total_questions,
                attemptData.time_taken,
                attemptData.answers
            );

            if (savedAttempt) {
                onComplete(savedAttempt);
            }
        } catch (error) {
            console.error('Failed to submit test:', error);
            // Fallback for demo/offline mode
            onComplete({
                id: 'temp-id',
                user_id: 'current-user',
                created_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
                ...attemptData
            });
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const currentQuestion = questions[currentQuestionIndex];
    const isMarked = markedForReview.includes(currentQuestionIndex);
    const isAnswered = answers[currentQuestionIndex] !== undefined;

    return (
        <div className="fixed inset-0 bg-[#050505] z-50 flex flex-col">
            {/* Header */}
            <div className="bg-[#0a0a0a] border-b border-white/10 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onExit || onBack}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold text-white hidden sm:block">{topic || 'Test Series'}</h1>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                                {difficulty || 'Medium'}
                            </span>
                            <span>Q{currentQuestionIndex + 1}/{questions.length}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Timer */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${timeLeft < 60 ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-[#111] border-white/10 text-blue-400'}`}>
                        <Clock size={16} />
                        <span className="font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
                    </div>

                    {/* Pause Button */}
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title={isPaused ? "Resume" : "Pause"}
                    >
                        {isPaused ? <Play size={20} /> : <Pause size={20} />}
                    </button>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-600/20"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>

                    {/* Menu Toggle (Mobile) */}
                    <button
                        onClick={() => setShowQuestionList(!showQuestionList)}
                        className="sm:hidden p-2 hover:bg-white/5 rounded-lg text-slate-400"
                    >
                        <Menu size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Pause Overlay */}
                <AnimatePresence>
                    {isPaused && (
                        <motion.div
                            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
                            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            className="absolute inset-0 z-40 bg-black/60 flex items-center justify-center"
                        >
                            <div className="bg-[#111] border border-white/10 p-8 rounded-3xl text-center shadow-2xl">
                                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Pause size={32} className="text-blue-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Test Paused</h2>
                                <p className="text-slate-400 mb-6">Take a break! Your timer is stopped.</p>
                                <button
                                    onClick={() => setIsPaused(false)}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 mx-auto"
                                >
                                    <Play size={18} /> Resume Test
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Question Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
                    <div className="w-full max-w-3xl space-y-6">
                        {/* Question Card */}
                        <motion.div
                            key={currentQuestionIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Question Header */}
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h2 className="text-lg md:text-xl font-medium text-white leading-relaxed">
                                        <span className="text-slate-500 mr-2 text-base">Q{currentQuestionIndex + 1}.</span>
                                        <QuestionText text={currentQuestion.question} />
                                    </h2>
                                    {/* Enhanced Question Info */}
                                    {(currentQuestion as EnhancedQuizQuestion).questionType && (
                                        <div className="flex gap-2 mt-2">
                                            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs rounded-full">
                                                {(currentQuestion as EnhancedQuizQuestion).questionType}
                                            </span>
                                            {(currentQuestion as EnhancedQuizQuestion).marks && (
                                                <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-full">
                                                    +{(currentQuestion as EnhancedQuizQuestion).marks} marks
                                                </span>
                                            )}
                                            {negativeMarking && (currentQuestion as EnhancedQuizQuestion).negativeMarks && (
                                                <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-full">
                                                    {(currentQuestion as EnhancedQuizQuestion).negativeMarks} marks
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {/* Figure Description */}
                                    {(currentQuestion as EnhancedQuizQuestion).figure && (
                                        <div className="mt-4 p-4 bg-[#0a0a0a] border border-white/10 rounded-xl">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                                                    <ImageIcon size={20} className="text-blue-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                                                        {(currentQuestion as EnhancedQuizQuestion).figure!.type}
                                                    </div>
                                                    <p className="text-sm text-slate-300 leading-relaxed">
                                                        {(currentQuestion as EnhancedQuizQuestion).figure!.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={useLifeline}
                                        disabled={lifelineUsed[currentQuestionIndex]}
                                        className={`p-2 rounded-lg border transition-all ${lifelineUsed[currentQuestionIndex]
                                            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500/50 cursor-not-allowed'
                                            : 'bg-[#111] border-white/10 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/50'
                                            }`}
                                        title="50/50 Lifeline"
                                    >
                                        <Zap size={18} />
                                    </button>
                                    <button
                                        onClick={toggleMarkForReview}
                                        className={`p-2 rounded-lg border transition-all ${isMarked
                                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                                            : 'bg-[#111] border-white/10 text-slate-400 hover:text-white hover:border-white/30'
                                            }`}
                                        title="Mark for Review"
                                    >
                                        <Flag size={18} fill={isMarked ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = answers[currentQuestionIndex] === idx;
                                    const isEliminated = eliminatedOptions[currentQuestionIndex]?.includes(idx);

                                    if (isEliminated) return null;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(idx)}
                                            className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 group ${isSelected
                                                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20'
                                                : 'bg-[#111] border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/10'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold transition-colors ${isSelected ? 'border-white text-white' : 'border-slate-600 text-slate-500 group-hover:border-slate-400'
                                                }`}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="text-sm md:text-base">
                                                <QuestionText text={option} />
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Navigation */}
                        <div className="flex justify-between pt-6">
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="px-4 py-2 rounded-lg bg-[#111] border border-white/10 text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                disabled={currentQuestionIndex === questions.length - 1}
                                className="px-4 py-2 rounded-lg bg-[#111] border border-white/10 text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Question Map Sidebar (Desktop) */}
                <div className="hidden lg:flex w-72 bg-[#0a0a0a] border-l border-white/10 flex-col">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="font-bold text-white mb-1">Question Map</h3>
                        <div className="flex gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Answered</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Marked</div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((_, idx) => {
                                const status = answers[idx] !== undefined ? 'answered' : markedForReview.includes(idx) ? 'marked' : idx === currentQuestionIndex ? 'current' : 'unvisited';
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${status === 'current' ? 'ring-2 ring-white bg-transparent text-white' :
                                            status === 'answered' ? 'bg-blue-600 text-white' :
                                                status === 'marked' ? 'bg-purple-600 text-white' :
                                                    'bg-[#111] text-slate-500 hover:bg-white/10'
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {negativeMarking && (
                        <div className="p-4 bg-red-500/5 border-t border-red-500/10">
                            <div className="flex items-start gap-2 text-xs text-red-300">
                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                <p>Negative marking is active. -0.25 for incorrect answers.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Question List Overlay */}
                <AnimatePresence>
                    {showQuestionList && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute inset-y-0 right-0 w-64 bg-[#0a0a0a] border-l border-white/10 z-30 flex flex-col lg:hidden shadow-2xl"
                        >
                            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                <h3 className="font-bold text-white">Questions</h3>
                                <button onClick={() => setShowQuestionList(false)} className="p-1 hover:bg-white/10 rounded">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="grid grid-cols-4 gap-2">
                                    {questions.map((_, idx) => {
                                        const status = answers[idx] !== undefined ? 'answered' : markedForReview.includes(idx) ? 'marked' : idx === currentQuestionIndex ? 'current' : 'unvisited';
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setCurrentQuestionIndex(idx);
                                                    setShowQuestionList(false);
                                                }}
                                                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${status === 'current' ? 'ring-2 ring-white bg-transparent text-white' :
                                                    status === 'answered' ? 'bg-blue-600 text-white' :
                                                        status === 'marked' ? 'bg-purple-600 text-white' :
                                                            'bg-[#111] text-slate-500 hover:bg-white/10'
                                                    }`}
                                            >
                                                {idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TestSeriesArena;
