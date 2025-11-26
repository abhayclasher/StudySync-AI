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
        <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col">
            {/* Top Bar */}
            <div className="h-16 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md flex items-center justify-between px-4 z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowQuestionList(!showQuestionList)}
                        className="p-2 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-colors md:hidden"
                    >
                        {showQuestionList ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <div className="text-sm font-medium text-neutral-400">
                        Q{currentQuestionIndex + 1} <span className="text-neutral-600">/ {questions.length}</span>
                    </div>
                </div>

                <div className={`px-4 py-1.5 rounded-full font-mono font-bold text-sm flex items-center gap-2 ${timeLeft < 300 ? 'bg-red-500/10 text-red-400 animate-pulse' : 'bg-neutral-900 text-white'
                    }`}>
                    <Clock size={14} />
                    {formatTime(timeLeft)}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Submitting...
                        </>
                    ) : 'Submit'}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto relative">
                <div className="max-w-6xl mx-auto p-6 pb-32 flex gap-6">
                    {/* Question Area */}
                    <div className="flex-1 max-w-4xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestionIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* Question Text */}
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="text-lg md:text-xl font-medium text-white leading-relaxed">
                                            {currentQuestion.question}
                                        </h3>
                                        <button
                                            onClick={toggleMarkForReview}
                                            className={`shrink-0 p-2 rounded-lg transition-colors ${isMarked ? 'text-yellow-400 bg-yellow-400/10' : 'text-neutral-600 hover:bg-white/5'}`}
                                        >
                                            <Flag size={20} fill={isMarked ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, idx) => {
                                        const isSelected = answers[currentQuestionIndex] === idx;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswer(idx)}
                                                className={`w-full p-4 rounded-xl text-left transition-all border relative group ${isSelected
                                                    ? 'bg-blue-600/10 border-blue-500 text-white'
                                                    : 'bg-[#111] border-white/5 text-neutral-300 hover:bg-white/5 hover:border-white/10'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${isSelected
                                                        ? 'bg-blue-500 border-blue-500 text-white'
                                                        : 'border-neutral-600 text-neutral-500 group-hover:border-neutral-400'
                                                        }`}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <span className="flex-1">{option}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Next/Previous Buttons - After Options */}
                                <div className="flex items-center justify-between gap-4 pt-4">
                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                        disabled={currentQuestionIndex === 0}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#111] hover:bg-white/5 text-white font-medium rounded-xl border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <span className="hidden sm:inline">Previous</span>
                                        <span className="sm:hidden">Prev</span>
                                    </button>

                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                        disabled={currentQuestionIndex === questions.length - 1}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <span className="hidden sm:inline">Next</span>
                                        <span className="sm:hidden">Next</span>
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Question Map - Desktop */}
                    <div className="hidden md:block w-80 shrink-0">
                        <div className="bg-[#111] border border-white/5 rounded-xl p-4 sticky top-6">
                            <h3 className="font-bold text-white mb-4">Question Map</h3>
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((_, idx) => {
                                    const isAns = answers[idx] !== undefined;
                                    const isCurr = currentQuestionIndex === idx;
                                    const isMark = markedForReview.includes(idx);

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentQuestionIndex(idx)}
                                            className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all relative ${isCurr ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-[#111]' :
                                                    isAns ? 'bg-neutral-800 text-white' :
                                                        'bg-neutral-900 text-neutral-500 hover:bg-neutral-800'
                                                }`}
                                        >
                                            {idx + 1}
                                            {isMark && (
                                                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <div className="w-3 h-3 rounded bg-blue-600" /> Current
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <div className="w-3 h-3 rounded bg-neutral-800" /> Answered
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <div className="w-3 h-3 rounded bg-neutral-900" /> Not Visited
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 ml-0.5 mr-1" /> Marked for Review
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
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute top-0 left-0 bottom-0 w-80 bg-[#111] border-r border-white/5 z-40 flex flex-col"
                        >
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-bold text-white">Question Map</h3>
                                <button onClick={() => setShowQuestionList(false)} className="p-2 hover:bg-white/5 rounded-lg text-neutral-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="grid grid-cols-5 gap-2">
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
                                                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all relative ${isCurr ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-[#111]' :
                                                        isAns ? 'bg-neutral-800 text-white' :
                                                            'bg-neutral-900 text-neutral-500 hover:bg-neutral-800'
                                                    }`}
                                            >
                                                {idx + 1}
                                                {isMark && (
                                                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-4 border-t border-white/5 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <div className="w-3 h-3 rounded bg-blue-600" /> Current
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <div className="w-3 h-3 rounded bg-neutral-800" /> Answered
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <div className="w-3 h-3 rounded bg-neutral-900" /> Not Visited
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 ml-0.5 mr-1" /> Marked for Review
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
