import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Sparkles,
    Zap,
    Brain,
    ChevronRight,
    Loader2,
    Upload,
    X,
    AlertCircle
} from 'lucide-react';
import { generateTestSeries } from '../services/geminiService';
import { saveTestSeries } from '../services/testSeriesDb';
import { QuizQuestion } from '../types';

interface TestSeriesGeneratorProps {
    onTestGenerated?: (testId: string, questions: QuizQuestion[]) => void;
}

// Popular exam topics for quick selection
const POPULAR_TOPICS = [
    { label: 'NEET Biology - Reproduction', exam: 'NEET' },
    { label: 'NEET Biology - Genetics', exam: 'NEET' },
    { label: 'NEET Physics - Mechanics', exam: 'NEET' },
    { label: 'NEET Chemistry - Organic', exam: 'NEET' },
    { label: 'JEE Mathematics - Calculus', exam: 'JEE' },
    { label: 'JEE Physics - Electromagnetism', exam: 'JEE' },
    { label: 'JEE Chemistry - Physical', exam: 'JEE' },
    { label: 'Class 12 Physics', exam: 'CBSE' },
    { label: 'Class 12 Chemistry', exam: 'CBSE' },
    { label: 'Class 12 Mathematics', exam: 'CBSE' },
];

const TestSeriesGenerator: React.FC<TestSeriesGeneratorProps> = ({ onTestGenerated }) => {
    const [topic, setTopic] = useState('');
    const [examType, setExamType] = useState('');
    const [questionCount, setQuestionCount] = useState(50);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [referencePapers, setReferencePapers] = useState('');
    const [showReferencePapers, setShowReferencePapers] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    const handleQuickSelect = (selectedTopic: string, selectedExam: string) => {
        setTopic(selectedTopic);
        setExamType(selectedExam);
    };

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        setGenerating(true);
        setError('');

        try {
            // Generate test series using AI
            const questions = await generateTestSeries(
                topic,
                questionCount,
                difficulty,
                examType || undefined,
                referencePapers.trim() || undefined
            );

            if (!questions || questions.length === 0) {
                throw new Error('No questions were generated');
            }

            // Save to database
            const savedTest = await saveTestSeries(
                topic,
                examType || undefined,
                difficulty,
                questions,
                referencePapers.trim() || undefined
            );

            if (savedTest && onTestGenerated) {
                onTestGenerated(savedTest.id, questions);
            }
        } catch (err: any) {
            console.error('Test generation error:', err);
            setError(err.message || 'Failed to generate test series. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 ring-1 ring-purple-500/20">
                    <Brain className="text-purple-400" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">AI Test Series Generator</h2>
                    <p className="text-sm text-neutral-400">Create custom practice tests with AI</p>
                </div>
            </div>

            {/* Main Form */}
            <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-xl p-6 space-y-6">
                {/* Quick Topic Selection */}
                <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                        Quick Select Popular Topics
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        {POPULAR_TOPICS.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => handleQuickSelect(item.label, item.exam)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${topic === item.label
                                        ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/20'
                                        : 'bg-[#151515] text-neutral-400 hover:text-white border-white/5 hover:border-purple-500/30'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Topic Input */}
                <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                        Topic / Subject <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., NEET Biology - Reproduction"
                        className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                </div>

                {/* Exam Type */}
                <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                        Exam Type (Optional)
                    </label>
                    <input
                        type="text"
                        value={examType}
                        onChange={(e) => setExamType(e.target.value)}
                        placeholder="e.g., NEET, JEE, CBSE"
                        className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                </div>

                {/* Question Count Slider */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-white">
                            Number of Questions
                        </label>
                        <span className="text-lg font-bold text-purple-400">{questionCount}</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-[#0a0a0a] rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-neutral-500 mt-1">
                        <span>10</span>
                        <span>50</span>
                        <span>100</span>
                    </div>
                </div>

                {/* Difficulty Level */}
                <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                        Difficulty Level
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: 'easy', label: 'Easy', icon: Zap, color: 'green' },
                            { value: 'medium', label: 'Medium', icon: Brain, color: 'yellow' },
                            { value: 'hard', label: 'Hard', icon: Sparkles, color: 'red' }
                        ].map((level) => {
                            const Icon = level.icon;
                            return (
                                <button
                                    key={level.value}
                                    onClick={() => setDifficulty(level.value as any)}
                                    className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all border ${difficulty === level.value
                                            ? `bg-${level.color}-600 text-white border-${level.color}-500 shadow-lg shadow-${level.color}-900/20`
                                            : 'bg-[#151515] text-neutral-400 hover:text-white border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span className="text-sm">{level.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Reference Papers Toggle */}
                <div>
                    <button
                        onClick={() => setShowReferencePapers(!showReferencePapers)}
                        className="flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        <Upload size={16} />
                        {showReferencePapers ? 'Hide' : 'Add'} Previous Year Papers (Optional)
                    </button>
                </div>

                {/* Reference Papers Textarea */}
                {showReferencePapers && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <label className="block text-sm font-semibold text-white mb-2">
                            Paste Previous Year Questions
                        </label>
                        <textarea
                            value={referencePapers}
                            onChange={(e) => setReferencePapers(e.target.value)}
                            placeholder="Paste previous year questions here to help AI understand the pattern and style..."
                            rows={6}
                            className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                        />
                        <p className="text-xs text-neutral-500 mt-2">
                            💡 Tip: The AI will analyze these questions to understand patterns and generate similar (but original) questions
                        </p>
                    </motion.div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <AlertCircle className="text-red-400" size={16} />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={generating || !topic.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-neutral-700 disabled:to-neutral-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {generating ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Generating Test Series...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            Generate Test Series
                            <ChevronRight size={20} />
                        </>
                    )}
                </button>

                {/* Info Box */}
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <FileText className="text-blue-400 mt-0.5" size={18} />
                        <div className="text-xs text-neutral-400 space-y-1">
                            <p className="font-semibold text-blue-400">How it works:</p>
                            <ul className="list-disc list-inside space-y-1 ml-1">
                                <li>AI analyzes your topic and optional reference papers</li>
                                <li>Generates {questionCount} unique questions at {difficulty} difficulty</li>
                                <li>Questions are saved for you to attempt anytime</li>
                                <li>Track your progress and improve over time</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestSeriesGenerator;
