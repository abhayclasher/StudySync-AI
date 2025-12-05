import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    ChevronLeft,
    Clock,
    Flag,
    CheckCircle,
    X,
    Menu,
    Calculator
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import BlockMath from 'react-katex';
import {
    QuizQuestion,
    NumericalQuestion,
    AssertionReasonQuestion,
    SingleCorrectMCQ,
    MultipleCorrectQuestion,
    MatrixMatchingQuestion,
    ParagraphQuestion
} from '../types';
import { saveTestAttempt } from '../services/testSeriesDb';
import SingleCorrectMCQRenderer from './question-types/SingleCorrectMCQRenderer';
import NumericalQuestionRenderer from './question-types/NumericalQuestionRenderer';
import AssertionReasonRenderer from './question-types/AssertionReasonRenderer';
import MultipleCorrectMCQRenderer from './question-types/MultipleCorrectMCQRenderer';
import MatrixMatchingRenderer from './question-types/MatrixMatchingRenderer';
import ParagraphQuestionRenderer from './question-types/ParagraphQuestionRenderer';

interface TestSeriesArenaProps {
    testId: string;
    questions: QuizQuestion[];
    onComplete: (results: any) => void;
    onExit: () => void;
    // Restored props
    topic?: string;
    difficulty?: string;
    onBack?: () => void;
}

const TestSeriesArena: React.FC<TestSeriesArenaProps> = ({
    testId,
    questions,
    onComplete,
    onExit,
    topic,
    difficulty,
    onBack
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    // Answers can now be number, string, array of numbers, or object (for matrix/paragraph)
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [markedForReview, setMarkedForReview] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState(questions.length * 90); // 1.5 mins per question
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [numericalInput, setNumericalInput] = useState('');

    const currentQuestion = questions[currentQuestionIndex];

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

    // Reset numerical input when question changes
    useEffect(() => {
        if (currentQuestion.type === 'numerical' || currentQuestion.type === 'numerical-integer' || currentQuestion.type === 'numerical-decimal') {
            setNumericalInput(answers[currentQuestionIndex]?.toString() || '');
        }
    }, [currentQuestionIndex, answers, currentQuestion.type]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswer = (answer: any) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: answer
        }));
    };

    // Special handler for paragraph questions which have sub-questions
    const handleParagraphAnswer = (subQuestionId: string, optionIndex: number) => {
        setAnswers(prev => {
            const currentAns = prev[currentQuestionIndex] || {};
            return {
                ...prev,
                [currentQuestionIndex]: {
                    ...currentAns,
                    [subQuestionId]: optionIndex
                }
            };
        });
    };

    const toggleMarkForReview = () => {
        setMarkedForReview(prev =>
            prev.includes(currentQuestionIndex)
                ? prev.filter(i => i !== currentQuestionIndex)
                : [...prev, currentQuestionIndex]
        );
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Calculate score
            let score = 0;
            let correctCount = 0;
            let incorrectCount = 0;

            questions.forEach((q, index) => {
                const userAnswer = answers[index];

                // Skip unattempted
                if (userAnswer === undefined || userAnswer === null || userAnswer === '') return;

                let isCorrect = false;

                switch (q.type) {
                    case 'numerical':
                    case 'numerical-integer':
                    case 'numerical-decimal': {
                        const numUser = parseFloat(userAnswer as string);
                        const numCorrect = (q as NumericalQuestion).answer;
                        if (!isNaN(numUser) && !isNaN(numCorrect)) {
                            if (Math.abs(numUser - numCorrect) < 0.1) {
                                score += 4;
                                correctCount++;
                                isCorrect = true;
                            } else {
                                score -= 0; // Usually no negative marking for numericals in JEE Main (check pattern)
                                incorrectCount++;
                            }
                        }
                        break;
                    }
                    case 'multiple-correct-mcq': {
                        // Array comparison
                        const userArr = (userAnswer as number[]).sort();
                        const correctArr = (q as MultipleCorrectQuestion).correctAnswers.sort();
                        if (JSON.stringify(userArr) === JSON.stringify(correctArr)) {
                            score += 4;
                            correctCount++;
                            isCorrect = true;
                        } else {
                            // TODO: Implement partial marking logic if needed
                            score -= 1;
                            incorrectCount++;
                        }
                        break;
                    }
                    case 'matrix-matching': {
                        // Object comparison
                        const userMatch = userAnswer as Record<string, string[]>;
                        const correctMatch = (q as MatrixMatchingQuestion).correctMatches;
                        // Simplified scoring: All matches must be correct for full marks
                        // Real JEE has complex partial marking
                        let allCorrect = true;
                        for (const key in correctMatch) {
                            const u = userMatch[key]?.sort();
                            const c = correctMatch[key]?.sort();
                            if (JSON.stringify(u) !== JSON.stringify(c)) {
                                allCorrect = false;
                                break;
                            }
                        }
                        if (allCorrect) {
                            score += 4;
                            correctCount++;
                            isCorrect = true;
                        } else {
                            score -= 1;
                            incorrectCount++;
                        }
                        break;
                    }
                    case 'paragraph-based': {
                        // Score each sub-question individually
                        const paraQ = q as ParagraphQuestion;
                        const userSubAns = userAnswer as Record<string, number>;
                        let subCorrect = 0;
                        paraQ.questions.forEach(subQ => {
                            if (userSubAns[subQ.id] === subQ.correctAnswer) {
                                score += 3; // Usually 3 marks per sub-question
                                subCorrect++;
                            } else if (userSubAns[subQ.id] !== undefined) {
                                score -= 1;
                            }
                        });
                        if (subCorrect === paraQ.questions.length) correctCount++;
                        else incorrectCount++; // Simplified counting
                        break;
                    }
                    default: {
                        // Single correct / Assertion-Reason
                        if (userAnswer === (q as any).correctAnswer) {
                            score += 4;
                            correctCount++;
                            isCorrect = true;
                        } else {
                            score -= 1;
                            incorrectCount++;
                        }
                    }
                }
            });

            const timeTaken = (questions.length * 90) - timeLeft;

            // Prepare answers array for DB
            const answersList = questions.map((q, index) => {
                const userAnswer = answers[index];
                // Note: isCorrect logic duplicated here for DB storage, ideally refactor to utility
                return {
                    questionId: q.id,
                    selectedOption: userAnswer, // Stores complex objects too
                    isCorrect: false // Simplified, backend/result view re-calculates often
                };
            });

            const results = {
                testId,
                score,
                totalQuestions: questions.length,
                correctCount,
                incorrectCount,
                unattemptedCount: questions.length - (correctCount + incorrectCount),
                timeTaken,
                answers: answersList,
                questions // Pass questions back for review
            };

            // Save attempt with correct signature
            await saveTestAttempt(
                testId,
                score,
                questions.length,
                timeTaken,
                answersList
            );

            onComplete(results);
        } catch (error) {
            console.error('Error submitting test:', error);
            setIsSubmitting(false);
        }
    };

    const renderQuestion = () => {
        switch (currentQuestion.type) {
            case 'numerical':
            case 'numerical-integer':
            case 'numerical-decimal':
                return (
                    <NumericalQuestionRenderer
                        question={currentQuestion as NumericalQuestion}
                        currentAnswer={answers[currentQuestionIndex] as string}
                        onAnswer={handleAnswer}
                    />
                );
            case 'assertion-reason':
                return (
                    <AssertionReasonRenderer
                        question={currentQuestion as AssertionReasonQuestion}
                        selectedOption={answers[currentQuestionIndex] as number}
                        onAnswer={handleAnswer}
                    />
                );
            case 'multiple-correct-mcq':
                return (
                    <MultipleCorrectMCQRenderer
                        question={currentQuestion as MultipleCorrectQuestion}
                        selectedOptions={answers[currentQuestionIndex] as number[]}
                        onAnswer={handleAnswer}
                    />
                );
            case 'matrix-matching':
                return (
                    <MatrixMatchingRenderer
                        question={currentQuestion as MatrixMatchingQuestion}
                        currentMatches={answers[currentQuestionIndex] as Record<string, string[]>}
                        onAnswer={handleAnswer}
                    />
                );
            case 'paragraph-based':
                return (
                    <ParagraphQuestionRenderer
                        question={currentQuestion as ParagraphQuestion}
                        answers={answers[currentQuestionIndex] as Record<string, number>}
                        onAnswer={handleParagraphAnswer}
                    />
                );
            default:
                return (
                    <SingleCorrectMCQRenderer
                        question={currentQuestion as SingleCorrectMCQ}
                        selectedOption={answers[currentQuestionIndex] as number}
                        onAnswer={handleAnswer}
                    />
                );
        }
    };

    return (
        <div className="flex flex-col h-full bg-black text-white overflow-hidden relative selection:bg-blue-500/30">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-32 bg-blue-900/10 blur-[80px] rounded-full pointer-events-none" />

            {/* Header - Floating & Glassmorphic */}
            <header className="hidden md:flex h-16 items-center justify-between px-6 z-20 absolute top-0 left-0 right-0 bg-gradient-to-b from-black via-black/80 to-transparent">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onExit}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                        title="Exit Test"
                    >
                        <X size={20} className="text-slate-300 group-hover:text-white transition-colors" />
                    </button>

                    <div className="h-8 w-[1px] bg-white/10" />

                    <div className="flex items-center gap-3 bg-[#0a0a0a]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 shadow-lg">
                        <Clock size={16} className={timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-blue-400'} />
                        <span className={`font-mono font-bold tracking-wider ${timeLeft < 300 ? 'text-red-400' : 'text-white'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-white text-black hover:bg-slate-200 px-6 py-2 rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Test'} <CheckCircle size={16} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative pt-16 md:pt-20">
                {/* Main Question Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-0 pb-24 custom-scrollbar">
                    <div className="max-w-5xl mx-auto h-full flex flex-col">
                        {/* Progress Bar - Minimalist */}
                        <div className="hidden md:block w-full h-1 bg-white/5 mb-8 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestionIndex}
                                initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                                transition={{ duration: 0.3, ease: "circOut" }}
                                className="flex-1 flex flex-col md:px-8"
                            >
                                {/* Question Card */}
                                <div className="bg-[#050505] border border-white/5 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden flex-1 flex flex-col">
                                    {/* Subtle noise texture */}
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>

                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-black bg-white px-3 py-1 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                                Q{currentQuestionIndex + 1}
                                            </span>
                                            <div className="h-6 w-[1px] bg-white/10" />
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                {currentQuestion.type.replace(/-/g, ' ')}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${currentQuestion.difficulty === 'hard' ? 'text-red-400 border-red-500/20 bg-red-500/5' :
                                                currentQuestion.difficulty === 'medium' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' :
                                                    'text-green-400 border-green-500/20 bg-green-500/5'
                                                }`}>
                                                {currentQuestion.difficulty}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Question Renderer */}
                                    <div className="relative z-10 flex-1">
                                        {renderQuestion()}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>

                {/* Navigation Sidebar (Desktop: Right, Mobile: Overlay) */}
                <aside className={`
                    fixed md:static inset-y-0 right-0 z-30 w-80 bg-[#050505] border-l border-white/5 transform transition-transform duration-300 shadow-2xl
                    ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                `}>
                    <div className="h-full flex flex-col bg-[#050505]">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                            <h3 className="font-bold text-white text-lg tracking-tight">Question Palette</h3>
                            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/5 rounded-full text-slate-300">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="grid grid-cols-5 gap-3">
                                {questions.map((_, idx) => {
                                    const isAnswered = answers[idx] !== undefined;
                                    const isMarked = markedForReview.includes(idx);
                                    const isCurrent = currentQuestionIndex === idx;

                                    let bgClass = 'bg-[#111] text-slate-400 border-transparent hover:bg-[#1a1a1a] hover:text-slate-200';
                                    if (isCurrent) bgClass = 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110 z-10 font-extrabold';
                                    else if (isMarked) bgClass = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
                                    else if (isAnswered) bgClass = 'bg-green-500/20 text-green-400 border-green-500/30';

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setCurrentQuestionIndex(idx);
                                                setIsSidebarOpen(false);
                                            }}
                                            className={`aspect-square rounded-xl border flex items-center justify-center text-sm font-bold transition-all relative ${bgClass}`}
                                        >
                                            {idx + 1}
                                            {isMarked && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_5px_rgba(192,132,252,0.8)]" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5 space-y-4 bg-black/40 backdrop-blur-sm">
                            <div className="grid grid-cols-2 gap-3 text-xs font-medium text-slate-300">
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> Answered</div>
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" /> Review</div>
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#333]" /> Not Visited</div>
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" /> Current</div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Bottom Navigation Bar */}
            <div className="h-20 border-t border-white/5 bg-[#050505]/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-10 z-20 absolute bottom-0 left-0 right-0 md:right-80">
                <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-3 px-6 py-3 rounded-full text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium"
                >
                    <ChevronLeft size={20} /> <span className="hidden md:inline">Previous</span>
                </button>

                {/* Desktop: Mark for Review */}
                <button
                    onClick={toggleMarkForReview}
                    className={`hidden md:flex items-center gap-2 px-6 py-3 rounded-full transition-all font-bold ${markedForReview.includes(currentQuestionIndex)
                        ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                        : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                >
                    <Flag size={18} fill={markedForReview.includes(currentQuestionIndex) ? "currentColor" : "none"} />
                    <span>{markedForReview.includes(currentQuestionIndex) ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>

                {/* Mobile: Submit Button (Floating) */}
                <button
                    onClick={handleSubmit}
                    className="md:hidden flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-sm font-bold shadow-lg"
                >
                    Submit
                </button>

                <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="flex items-center gap-3 px-8 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] font-bold"
                >
                    <span className="hidden md:inline">Next Question</span> <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default TestSeriesArena;
