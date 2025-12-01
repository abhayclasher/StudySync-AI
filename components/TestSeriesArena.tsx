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
import { QuizQuestion } from '../types';
import { saveTestAttempt } from '../services/testSeriesDb';

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
    const [answers, setAnswers] = useState<Record<number, number | string>>({});
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
        if (currentQuestion.type === 'numerical') {
            setNumericalInput(answers[currentQuestionIndex]?.toString() || '');
        }
    }, [currentQuestionIndex, answers, currentQuestion.type]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswer = (answer: number | string) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: answer
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
        setIsSubmitting(true);
        // Calculate score
        let score = 0;
        let correctCount = 0;
        let incorrectCount = 0;

        questions.forEach((q, index) => {
            const userAnswer = answers[index];
            if (userAnswer !== undefined) {
                if (q.type === 'numerical') {
                    // Numerical comparison with tolerance
                    const numUser = parseFloat(userAnswer as string);
                    const numCorrect = q.answer as number;
                    if (Math.abs(numUser - numCorrect) < 0.1) {
                        score += 4;
                        correctCount++;
                    } else {
                        score -= 1; // Negative marking
                        incorrectCount++;
                    }
                } else {
                    // MCQ comparison
                    if (userAnswer === q.correctAnswer) {
                        score += 4;
                        correctCount++;
                    } else {
                        score -= 1;
                        incorrectCount++;
                    }
                }
            }
        });

        const timeTaken = (questions.length * 90) - timeLeft;

        // Prepare answers array for DB
        const answersList = questions.map((q, index) => ({
            questionId: q.id,
            selectedOption: answers[index],
            isCorrect: q.type === 'numerical'
                ? Math.abs(parseFloat(answers[index] as string) - (q.answer as number)) < 0.1
                : answers[index] === q.correctAnswer
        }));

        const results = {
            testId,
            score,
            totalQuestions: questions.length,
            correctCount,
            incorrectCount,
            unattemptedCount: questions.length - (correctCount + incorrectCount),
            timeTaken,
            answers,
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
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-white overflow-hidden relative">
            {/* Header */}
            <header className="h-16 border-b border-white/10 bg-[#111] flex items-center justify-between px-4 z-20 shadow-md">
                <div className="flex items-center gap-4">
                    <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                    <h1 className="text-lg font-bold hidden md:block">Test Series Arena</h1>
                    <div className="flex items-center gap-2 bg-blue-900/30 px-3 py-1 rounded-full border border-blue-500/30">
                        <Clock size={16} className="text-blue-400" />
                        <span className={`font-mono font-bold ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-blue-100'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-green-900/20 flex items-center gap-2"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Test'} <CheckCircle size={16} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Main Question Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-white/5 rounded-full mb-6 overflow-hidden">
                            <motion.div
                                className="h-full bg-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestionIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {/* Question Card */}
                                <div className="bg-[#151515] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />

                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-1 rounded">
                                            Question {currentQuestionIndex + 1}
                                        </span>
                                        <div className="flex gap-2">
                                            <span className="text-xs font-medium text-slate-500 bg-white/5 px-2 py-1 rounded capitalize">
                                                {currentQuestion.difficulty}
                                            </span>
                                            <span className="text-xs font-medium text-slate-500 bg-white/5 px-2 py-1 rounded capitalize">
                                                {currentQuestion.type === 'numerical' ? '+4 / -1' : '+4 / -1'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-lg md:text-xl text-white font-medium leading-relaxed mb-6">
                                        {currentQuestion.question.includes('$') || currentQuestion.question.includes('\\') ? (
                                            <BlockMath>{currentQuestion.question}</BlockMath>
                                        ) : (
                                            currentQuestion.question
                                        )}
                                    </div>

                                    {/* Options / Input */}
                                    <div className="space-y-3">
                                        {currentQuestion.type === 'numerical' ? (
                                            <div className="mt-4">
                                                <label className="block text-sm text-slate-400 mb-2">Enter your numerical answer:</label>
                                                <div className="flex gap-3">
                                                    <input
                                                        type="number"
                                                        value={numericalInput}
                                                        onChange={(e) => {
                                                            setNumericalInput(e.target.value);
                                                            handleAnswer(parseFloat(e.target.value));
                                                        }}
                                                        placeholder="e.g. 42.5"
                                                        className="bg-[#0a0a0a] border border-white/20 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-blue-500 transition-all w-full md:w-1/2"
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                                    <Calculator size={12} /> Enter integer or decimal value
                                                </p>
                                            </div>
                                        ) : (
                                            currentQuestion.options?.map((option, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleAnswer(idx)}
                                                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 group ${answers[currentQuestionIndex] === idx
                                                        ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50'
                                                        : 'bg-[#0a0a0a] border-white/10 hover:bg-white/5 hover:border-white/20'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${answers[currentQuestionIndex] === idx
                                                        ? 'bg-blue-500 border-blue-500 text-white'
                                                        : 'border-white/20 text-slate-400 group-hover:border-white/40'
                                                        }`}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <div className="text-base text-slate-200 group-hover:text-white">
                                                        {option.includes('$') ? <BlockMath>{option}</BlockMath> : option}
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>

                {/* Navigation Sidebar (Desktop: Right, Mobile: Overlay) */}
                <aside className={`
                    fixed md:static inset-y-0 right-0 z-30 w-72 bg-[#111] border-l border-white/10 transform transition-transform duration-300
                    ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                `}>
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white">Question Palette</h3>
                            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((_, idx) => {
                                    const isAnswered = answers[idx] !== undefined;
                                    const isMarked = markedForReview.includes(idx);
                                    const isCurrent = currentQuestionIndex === idx;

                                    let bgClass = 'bg-[#1a1a1a] text-slate-400 border-white/10';
                                    if (isCurrent) bgClass = 'ring-2 ring-blue-500 bg-blue-500/20 text-white';
                                    else if (isMarked) bgClass = 'bg-purple-600 text-white border-purple-600';
                                    else if (isAnswered) bgClass = 'bg-green-600 text-white border-green-600';

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setCurrentQuestionIndex(idx);
                                                setIsSidebarOpen(false);
                                            }}
                                            className={`aspect-square rounded-lg border flex items-center justify-center text-sm font-bold transition-all ${bgClass}`}
                                        >
                                            {idx + 1}
                                            {isMarked && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/10 space-y-3 bg-[#0f0f0f]">
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-600" /> Answered</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-600" /> Review</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#1a1a1a] border border-white/20" /> Not Visited</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500/20 ring-1 ring-blue-500" /> Current</div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Bottom Navigation Bar */}
            <div className="h-16 border-t border-white/10 bg-[#111] flex items-center justify-between px-4 md:px-8 z-20">
                <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft size={20} /> Previous
                </button>

                <button
                    onClick={toggleMarkForReview}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${markedForReview.includes(currentQuestionIndex)
                        ? 'text-purple-400 bg-purple-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Flag size={18} fill={markedForReview.includes(currentQuestionIndex) ? "currentColor" : "none"} />
                    <span className="hidden md:inline">Mark for Review</span>
                </button>

                <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
                >
                    Next <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default TestSeriesArena;
