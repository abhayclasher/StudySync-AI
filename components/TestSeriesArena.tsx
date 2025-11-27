import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Menu,
    X,
    Flag,
} from 'lucide-react';
import { QuizQuestion, TestAttempt } from '../types';
import { saveTestAttempt } from '../services/testSeriesDb';

interface TestSeriesArenaProps {
    testId: string;
    questions: QuizQuestion[];
    duration?: number; // in seconds, optional now
    onComplete: (result: TestAttempt) => void;
    onExit?: () => void;
    onBack?: () => void;
    topic?: string;
    difficulty?: string;
}

const TestSeriesArena: React.FC<TestSeriesArenaProps> = ({
    testId,
    questions,
    duration,
    onComplete,
    onExit,
    onBack,
    topic,
    difficulty
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeLeft, setTimeLeft] = useState(duration || questions.length * 120); // Default to 2 minutes per question
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showQuestionList, setShowQuestionList] = useState(false);
    const [markedForReview, setMarkedForReview] = useState<number[]>([]);

    useEffect(() => {
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
    }, []);

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

    const handleSubmit = async () => {
        if (isSubmitting) return; // Prevent double submission
        
        setIsSubmitting(true);
        console.log('Starting test submission...');
        
        try {
            let score = 0;
            questions.forEach((q, idx) => {
                if (answers[idx] === q.correctAnswer) {
                    score++;
                }
            });

            console.log('Calculated score:', score, 'out of', questions.length);
            
            const timeTaken = (duration || questions.length * 120) - timeLeft;
            console.log('Time taken:', timeTaken, 'seconds');
            
            const attemptData = {
                testSeriesId: testId,
                score,
                totalQuestions: questions.length,
                timeTaken,
                answers: Object.entries(answers).map(([qIdx, aIdx]) => ({
                    questionId: questions[parseInt(qIdx)].id,
                    selectedOption: aIdx,
                    isCorrect: questions[parseInt(qIdx)].correctAnswer === aIdx
                }))
            };
            
            console.log('Saving test attempt with data:', attemptData);

            const attempt = await saveTestAttempt(
                testId,
                score,
                questions.length,
                timeTaken,
                attemptData.answers
            );

            if (attempt) {
                console.log('Test attempt saved successfully:', attempt);
                // Call onComplete immediately
                onComplete(attempt);
            } else {
                console.error('Failed to save test attempt - returned null');
                // Provide user feedback
                alert('There was an issue saving your test results. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting test:', error);
            alert('Failed to submit test. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const currentQuestion = questions[currentQuestionIndex];
    const isAnswered = answers[currentQuestionIndex] !== undefined;
    const isMarked = markedForReview.includes(currentQuestionIndex);

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0f0f0f] z-50 flex flex-col">
            {/* Top Bar */}
            <div className="h-20 border-b border-white/10 bg-gradient-to-r from-[#0f0f0f]/90 via-[#0a0a0a]/90 to-[#0d0d0d]/90 backdrop-blur-xl flex items-center justify-between px-6 z-20 shadow-2xl shadow-black/50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowQuestionList(!showQuestionList)}
                        className="p-3 hover:bg-white/10 rounded-2xl text-neutral-400 hover:text-white transition-all duration-300 hover:scale-105 md:hidden"
                    >
                        {showQuestionList ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="text-base font-bold text-white">
                            Q{currentQuestionIndex + 1}
                        </div>
                        <div className="text-neutral-500">/</div>
                        <div className="text-sm font-medium text-neutral-400">
                            {questions.length}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-xl font-mono font-bold text-sm flex items-center gap-2 shadow-lg ${
                        timeLeft < 300
                            ? 'bg-gradient-to-r from-red-500/20 to-red-600/10 text-red-300 border border-red-500/30 animate-pulse shadow-red-500/20'
                            : 'bg-gradient-to-r from-neutral-800/50 to-neutral-900/50 text-white border border-white/10'
                        }`}>
                        <Clock size={16} className={timeLeft < 300 ? 'text-red-400' : 'text-blue-400'} />
                        {formatTime(timeLeft)}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Submitting...
                            </>
                        ) : 'Submit'}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto relative">
                <div className="max-w-7xl mx-auto p-4 md:p-8 pb-32 flex gap-4 md:gap-8">
                    {/* Question Area */}
                    <div className="flex-1 max-w-5xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestionIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="space-y-8"
                            >
                                {/* Question Text */}
                                <div className="bg-gradient-to-br from-[#111] via-[#0f0f0f] to-[#111] border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl shadow-black/40">
                                    <div className="flex items-start justify-between gap-6 mb-6">
                                        <h3 className="text-lg md:text-2xl font-bold text-white leading-relaxed flex-1">
                                            {currentQuestion.question}
                                        </h3>
                                        <button
                                            onClick={toggleMarkForReview}
                                            className={`shrink-0 p-3 rounded-2xl transition-all duration-300 hover:scale-110 ${
                                                isMarked
                                                    ? 'text-yellow-400 bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 shadow-lg shadow-yellow-500/20'
                                                    : 'text-neutral-500 hover:bg-white/10 hover:text-white border border-white/10'
                                            }`}
                                        >
                                            <Flag size={22} fill={isMarked ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="space-y-4">
                                    {currentQuestion.options.map((option, idx) => {
                                        const isSelected = answers[currentQuestionIndex] === idx;
                                        return (
                                            <motion.button
                                                key={idx}
                                                onClick={() => handleAnswer(idx)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`w-full p-4 md:p-6 rounded-2xl text-left transition-all duration-300 border relative group shadow-lg ${
                                                    isSelected
                                                        ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 border-blue-400 text-white shadow-blue-500/20'
                                                        : 'bg-gradient-to-r from-[#111] to-[#0f0f0f] border-white/10 text-neutral-300 hover:bg-white/5 hover:border-white/20 hover:shadow-xl hover:shadow-black/20'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                                        isSelected
                                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                                                            : 'border-neutral-600 text-neutral-400 group-hover:border-neutral-400 group-hover:text-neutral-300'
                                                        }`}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <span className="flex-1 text-sm md:text-base leading-relaxed">{option}</span>
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-blue-600/5 animate-pulse" />
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Next/Previous Buttons - After Options */}
                                <div className="flex items-center justify-between gap-6 pt-6">
                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                        disabled={currentQuestionIndex === 0}
                                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#111] to-[#0f0f0f] hover:from-white/10 hover:to-white/5 text-white font-semibold rounded-2xl border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:hover:scale-100 shadow-lg shadow-black/20"
                                    >
                                        <ChevronLeft size={20} />
                                        <span className="hidden sm:inline">Previous</span>
                                        <span className="sm:hidden">Prev</span>
                                    </button>

                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                        disabled={currentQuestionIndex === questions.length - 1}
                                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:hover:scale-100 shadow-lg shadow-blue-500/30"
                                    >
                                        <span className="hidden sm:inline">Next</span>
                                        <span className="sm:hidden">Next</span>
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Question Map - Desktop */}
                    <div className="hidden md:block w-96 shrink-0">
                        <div className="bg-gradient-to-br from-[#111] via-[#0f0f0f] to-[#111] border border-white/10 rounded-3xl p-4 md:p-6 sticky top-6 shadow-2xl shadow-black/40">
                            <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                Question Map
                            </h3>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {questions.map((_, idx) => {
                                    const isAns = answers[idx] !== undefined;
                                    const isCurr = currentQuestionIndex === idx;
                                    const isMark = markedForReview.includes(idx);

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentQuestionIndex(idx)}
                                            className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 relative hover:scale-110 shadow-lg ${
                                                isCurr
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-[#111] shadow-blue-500/30'
                                                    : isAns
                                                        ? 'bg-gradient-to-r from-neutral-700 to-neutral-800 text-white shadow-neutral-800/30'
                                                        : 'bg-gradient-to-r from-neutral-900 to-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white shadow-black/20'
                                            }`}
                                        >
                                            {idx + 1}
                                            {isMark && (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 border-2 border-[#111] animate-pulse" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-neutral-300">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30" />
                                    <span className="font-medium">Current Question</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-neutral-300">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-neutral-700 to-neutral-800 shadow-lg shadow-neutral-800/30" />
                                    <span className="font-medium">Answered</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-neutral-300">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-neutral-900 to-neutral-800 shadow-lg shadow-black/20" />
                                    <span className="font-medium">Not Visited</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-neutral-300">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 ml-0.5 animate-pulse" />
                                    <span className="font-medium">Marked for Review</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Question List Overlay (Mobile Bottom Sheet / Desktop Sidebar) */}
            <AnimatePresence>
                {showQuestionList && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowQuestionList(false)}
                            className="absolute inset-0 bg-black/70 backdrop-blur-md z-30"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute top-0 left-0 bottom-0 w-96 bg-gradient-to-br from-[#111] via-[#0f0f0f] to-[#111] border-r border-white/10 z-40 flex flex-col shadow-2xl shadow-black/60"
                        >
                            <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                    Question Map
                                </h3>
                                <button
                                    onClick={() => setShowQuestionList(false)}
                                    className="p-3 hover:bg-white/10 rounded-2xl text-neutral-400 hover:text-white transition-all duration-300 hover:scale-110"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {questions.map((_, idx) => {
                                        const isAns = answers[idx] !== undefined;
                                        const isCurr = currentQuestionIndex === idx;
                                        const isMark = markedForReview.includes(idx);
    
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setCurrentQuestionIndex(idx);
                                                    setShowQuestionList(false);
                                                }}
                                                className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 relative hover:scale-110 shadow-lg ${
                                                    isCurr
                                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-[#111] shadow-blue-500/30'
                                                        : isAns
                                                            ? 'bg-gradient-to-r from-neutral-700 to-neutral-800 text-white shadow-neutral-800/30'
                                                            : 'bg-gradient-to-r from-neutral-900 to-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white shadow-black/20'
                                                }`}
                                            >
                                                {idx + 1}
                                                {isMark && (
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 border-2 border-[#111] animate-pulse" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-4 md:p-6 border-t border-white/10 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-neutral-300">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30" />
                                    <span className="font-medium">Current Question</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-neutral-300">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-neutral-700 to-neutral-800 shadow-lg shadow-neutral-800/30" />
                                    <span className="font-medium">Answered</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-neutral-300">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-neutral-900 to-neutral-800 shadow-lg shadow-black/20" />
                                    <span className="font-medium">Not Visited</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-neutral-300">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 ml-0.5 animate-pulse" />
                                    <span className="font-medium">Marked for Review</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TestSeriesArena;
