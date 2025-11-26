import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Zap,
    Brain,
    ChevronRight,
    Loader2,
    Upload,
    X,
    AlertCircle,
    BookOpen,
    Target,
    Clock,
    Check
} from 'lucide-react';
import { generateTestSeries } from '../services/geminiService';
import { saveTestSeries } from '../services/testSeriesDb';
import { QuizQuestion } from '../types';

interface TestSeriesGeneratorProps {
    onTestGenerated?: (testId: string, questions: QuizQuestion[]) => void;
}

// Popular exam topics for quick selection
const POPULAR_TOPICS = [
    { label: 'NEET Biology - Reproduction', exam: 'NEET', icon: '🧬' },
    { label: 'NEET Physics - Mechanics', exam: 'NEET', icon: '⚛️' },
    { label: 'JEE Math - Calculus', exam: 'JEE', icon: '📐' },
    { label: 'JEE Chemistry - Organic', exam: 'JEE', icon: '🧪' },
    { label: 'Class 12 Physics', exam: 'CBSE', icon: '⚡' },
];

const TestSeriesGenerator: React.FC<TestSeriesGeneratorProps> = ({ onTestGenerated }) => {
    const [step, setStep] = useState(1);
    const [topic, setTopic] = useState('');
    const [examType, setExamType] = useState('');
    const [questionCount, setQuestionCount] = useState(30);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [referencePapers, setReferencePapers] = useState('');
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        setGenerating(true);
        setError('');

        try {
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
            setGenerating(false);
        }
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    return (
        <div className="max-w-4xl mx-auto pb-24 md:pb-0 px-4">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 ring-1 ring-white/10 mb-4">
                    <Brain className="text-blue-400" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">AI Test Generator</h2>
                <p className="text-neutral-400 text-sm">Create a custom test series in seconds</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s <= step ? 'w-8 bg-blue-500' : 'w-2 bg-neutral-800'}`} />
                ))}
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-xl shadow-black/50">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-6 space-y-6"
                        >
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">What do you want to practice?</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Thermodynamics, Indian History, Python..."
                                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-3">Popular Topics <span className="text-neutral-500">(optional)</span></label>
                                <div className="relative group">
                                    <select
                                        onChange={(e) => {
                                            const selected = POPULAR_TOPICS.find(t => t.label === e.target.value);
                                            if (selected) {
                                                setTopic(selected.label);
                                                setExamType(selected.exam);
                                            }
                                        }}
                                        className="w-full appearance-none bg-[#111] border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-50/50 focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select a popular topic...</option>
                                        {POPULAR_TOPICS.map((item) => (
                                            <option key={item.label} value={item.label}>
                                                {item.icon} {item.label} ({item.exam})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                                        <ChevronRight size={16} className="rotate-90" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-6 space-y-8"
                        >
                            {/* Difficulty */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-3">Difficulty Level</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'easy', label: 'Easy', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                                        { value: 'medium', label: 'Medium', icon: Target, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
                                        { value: 'hard', label: 'Hard', icon: Sparkles, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
                                    ].map((level) => (
                                        <button
                                            key={level.value}
                                            onClick={() => setDifficulty(level.value as any)}
                                            className={`relative p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${difficulty === level.value
                                                ? `${level.bg} ${level.border} ring-1 ring-inset ring-white/10`
                                                : 'bg-[#111] border-white/5 hover:bg-white/5'
                                                }`}
                                        >
                                            <level.icon size={20} className={level.color} />
                                            <span className={`text-sm font-medium ${difficulty === level.value ? 'text-white' : 'text-neutral-400'}`}>
                                                {level.label}
                                            </span>
                                            {difficulty === level.value && (
                                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white animate-pulse" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Question Count Slider */}
                            <div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-neutral-400">Number of Questions</label>
                                        <span className="text-2xl font-bold text-blue-400 tabular-nums">{questionCount}</span>
                                    </div>
                                    <div className="relative h-10 flex items-center">
                                        <input
                                            type="range"
                                            min="10"
                                            max="50"
                                            step="5"
                                            value={questionCount}
                                            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                            className="w-full h-2 bg-[#111] rounded-lg appearance-none cursor-pointer accent-blue-500 z-10"
                                        />
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg" style={{ width: `${((questionCount - 10) / 40) * 100}%` }} />
                                        </div>
                                        <div className="absolute w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg -mt-2" style={{ left: `calc(${((questionCount - 10) / 40) * 100}% - 12px)` }} />
                                    </div>
                                    <div className="flex justify-between text-xs text-neutral-400 mt-2 font-medium">
                                        <span>10 Questions</span>
                                        <span className="text-blue-400 font-bold">{questionCount} Questions</span>
                                        <span>50 Questions</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-6 space-y-6"
                        >
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Exam Type (Optional)</label>
                                <input
                                    type="text"
                                    value={examType}
                                    onChange={(e) => setExamType(e.target.value)}
                                    placeholder="e.g. NEET, JEE, UPSC..."
                                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Reference Material (Optional)</label>
                                <div className="relative">
                                    <textarea
                                        value={referencePapers}
                                        onChange={(e) => setReferencePapers(e.target.value)}
                                        placeholder="Paste previous year questions or notes here to help AI understand the pattern..."
                                        rows={6}
                                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
                                    />
                                    <div className="absolute bottom-3 right-3 text-neutral-600">
                                        <BookOpen size={16} />
                                    </div>
                                </div>
                                <p className="text-xs text-neutral-500 mt-2">
                                    The AI will analyze this text to match the style and difficulty of your exam.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm flex items-center justify-between gap-4">
                    {step > 1 ? (
                        <button
                            onClick={prevStep}
                            className="px-6 py-3 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            disabled={!topic.trim()}
                            className="px-8 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Generate Test
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
                >
                    <AlertCircle size={16} />
                    {error}
                </motion.div>
            )}
        </div>
    );
};

export default TestSeriesGenerator;
