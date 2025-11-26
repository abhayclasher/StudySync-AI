import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Flag,
    Trophy,
    Target,
    Brain,
    Zap,
    ArrowLeft
} from 'lucide-react';
import { QuizQuestion } from '../types';
import { saveTestAttempt } from '../services/testSeriesDb';

interface TestSeriesArenaProps {
    testId: string;
    questions: QuizQuestion[];
    topic: string;
    difficulty: string;
    onComplete?: () => void;
    onBack?: () => void;
}

const TestSeriesArena: React.FC<TestSeriesArenaProps> = ({
    testId,
    questions,
    topic,
    difficulty,
    onComplete,
    onBack
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
        new Array(questions.length).fill(null)
    );
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const answeredCount = selectedAnswers.filter(a => a !== null).length;

    // Timer
    useEffect(() => {
        if (isSubmitted) return;

        const timer = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isSubmitted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (optionIndex: number) => {
        if (isSubmitted) return;

        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setSelectedAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        // Calculate score
        let correctCount = 0;
        const answersWithCorrectness = selectedAnswers.map((answer, index) => {
            const isCorrect = answer === questions[index].correctAnswer;
            if (isCorrect) correctCount++;
            return {
                questionIndex: index,
                selectedAnswer: answer,
                correctAnswer: questions[index].correctAnswer,
                isCorrect
            };
        });

        setScore(correctCount);
        setIsSubmitted(true);
        setShowResults(true);

        // Save attempt to database
        await saveTestAttempt(
            testId,
            correctCount,
            totalQuestions,
            timeElapsed,
            answersWithCorrectness
        );
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'easy': return 'text-green-400';
            case 'medium': return 'text-yellow-400';
            case 'hard': return 'text-red-400';
            default: return 'text-neutral-400';
        }
    };

    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-400';
        if (percentage >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    if (showResults) {
        const percentage = Math.round((score / totalQuestions) * 100);

        return (
            <div className="space-y-6">
                {/* Results Header */}
                <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-xl p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 ring-1 ring-purple-500/20">
                            <Trophy className="text-purple-400" size={48} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Test Completed!</h2>
                    <p className="text-neutral-400 mb-6">{topic}</p>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4">
                            <div className={`text-3xl font-bold ${getScoreColor(percentage)} mb-1`}>
                                {percentage}%
                            </div>
                            <div className="text-xs text-neutral-500">Score</div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4">
                            <div className="text-3xl font-bold text-blue-400 mb-1">
                                {score}/{totalQuestions}
                            </div>
                            <div className="text-xs text-neutral-500">Correct</div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4">
                            <div className="text-3xl font-bold text-purple-400 mb-1">
                                {formatTime(timeElapsed)}
                            </div>
                            <div className="text-xs text-neutral-500">Time</div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setCurrentQuestionIndex(0);
                                setShowResults(false);
                            }}
                            className="flex-1 px-6 py-3 bg-[#151515] hover:bg-[#202020] text-white font-medium rounded-lg transition-all border border-white/5 hover:border-white/10"
                        >
                            Review Answers
                        </button>
                        <button
                            onClick={() => {
                                if (onComplete) onComplete();
                                if (onBack) onBack();
                            }}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-900/30"
                        >
                            Done
                        </button>
                    </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white mb-4">Question Review</h3>
                    {questions.map((question, index) => {
                        const userAnswer = selectedAnswers[index];
                        const isCorrect = userAnswer === question.correctAnswer;

                        return (
                            <div
                                key={question.id}
                                className={`bg-gradient-to-br from-[#111] to-[#0a0a0a] border rounded-lg p-4 ${isCorrect ? 'border-green-500/20' : 'border-red-500/20'
                                    }`}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`p-2 rounded-lg ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                        {isCorrect ? (
                                            <CheckCircle2 className="text-green-400" size={20} />
                                        ) : (
                                            <XCircle className="text-red-400" size={20} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-white mb-2">
                                            Q{index + 1}. {question.question}
                                        </div>
                                        <div className="space-y-1">
                                            {question.options.map((option, optIndex) => (
                                                <div
                                                    key={optIndex}
                                                    className={`text-xs px-3 py-2 rounded ${optIndex === question.correctAnswer
                                                            ? 'bg-green-500/10 text-green-400 font-medium'
                                                            : optIndex === userAnswer && !isCorrect
                                                                ? 'bg-red-500/10 text-red-400'
                                                                : 'text-neutral-500'
                                                        }`}
                                                >
                                                    {option}
                                                    {optIndex === question.correctAnswer && ' ✓'}
                                                    {optIndex === userAnswer && !isCorrect && ' ✗'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#151515] text-neutral-400 hover:text-white rounded-lg transition-all border border-white/5"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-white/5 rounded-lg">
                        <Clock className="text-blue-400" size={18} />
                        <span className="text-white font-mono font-bold">{formatTime(timeElapsed)}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-white/5 rounded-lg">
                        <Target className="text-purple-400" size={18} />
                        <span className="text-white font-bold">
                            {answeredCount}/{totalQuestions}
                        </span>
                    </div>
                </div>
            </div>

            {/* Topic Info */}
            <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">{topic}</h3>
                        <p className="text-sm text-neutral-400">
                            Question {currentQuestionIndex + 1} of {totalQuestions}
                        </p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg bg-[#0a0a0a] border border-white/5 ${getDifficultyColor(difficulty)} font-semibold text-sm`}>
                        {difficulty.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-xl p-6"
                >
                    <div className="mb-6">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-purple-500/10 ring-1 ring-purple-500/20">
                                <Brain className="text-purple-400" size={20} />
                            </div>
                            <h4 className="text-lg font-semibold text-white leading-relaxed">
                                {currentQuestion.question}
                            </h4>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                className={`w-full text-left px-5 py-4 rounded-lg font-medium transition-all border ${selectedAnswers[currentQuestionIndex] === index
                                        ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/20'
                                        : 'bg-[#0a0a0a] text-neutral-300 hover:text-white border-white/5 hover:border-purple-500/30 hover:bg-[#111]'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedAnswers[currentQuestionIndex] === index
                                            ? 'border-white bg-white'
                                            : 'border-neutral-600'
                                        }`}>
                                        {selectedAnswers[currentQuestionIndex] === index && (
                                            <CheckCircle2 className="text-purple-600" size={16} />
                                        )}
                                    </div>
                                    <span>{option}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
                <button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-[#111] hover:bg-[#151515] disabled:bg-[#0a0a0a] text-white disabled:text-neutral-600 font-medium rounded-lg transition-all border border-white/5 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={20} />
                    Previous
                </button>

                {currentQuestionIndex === totalQuestions - 1 ? (
                    <button
                        onClick={handleSubmit}
                        disabled={answeredCount < totalQuestions}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-neutral-700 disabled:to-neutral-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-green-900/30 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        <Flag size={20} />
                        Submit Test
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-purple-900/20"
                    >
                        Next
                        <ChevronRight size={20} />
                    </button>
                )}
            </div>

            {/* Question Grid */}
            <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-white mb-4">Question Navigator</h4>
                <div className="grid grid-cols-10 gap-2">
                    {questions.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentQuestionIndex(index)}
                            className={`aspect-square rounded-lg text-xs font-bold transition-all ${index === currentQuestionIndex
                                    ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                                    : selectedAnswers[index] !== null
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-[#0a0a0a] text-neutral-500 border border-white/5 hover:border-white/10'
                                }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TestSeriesArena;
