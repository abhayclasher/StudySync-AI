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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600/20 ring-2 ring-blue-600/20 ring-offset-2 ring-offset-[#0a0a0a] mb-6 shadow-2xl shadow-blue-600/10">
                    <Brain className="text-blue-600" size={32} />
                </div>
                <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent mb-3">
                    AI Test Generator
                </h2>
                <p className="text-neutral-400 text-sm md:text-lg mb-6">Create a custom test series in seconds</p>

                {/* Simple How it Works Bubble */}
                <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-2 mb-6">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-200 font-medium">Enter topic → Choose settings → Generate AI test</span>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-3 mb-10">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-3">
                        <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 ${
                            s <= step
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'bg-neutral-800/50 text-neutral-500 border border-neutral-700/50'
                        }`}>
                            <span className="text-sm font-bold">{s}</span>
                            {s <= step && (
                                <div className="absolute inset-0 rounded-full bg-blue-600 animate-pulse opacity-20" />
                            )}
                        </div>
                        {s < 3 && (
                            <div className={`h-0.5 w-12 rounded-full transition-all duration-500 ${
                                s < step ? 'bg-blue-600' : 'bg-neutral-800'
                            }`} />
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-br from-[#0f0f0f] via-[#0a0a0a] to-[#0d0d0d] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 backdrop-blur-sm">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-4 md:p-8 space-y-6 md:space-y-8"
                        >
                            <div className="space-y-3">
                                <label className="block text-base font-semibold text-white mb-3">What do you want to practice?</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g. Thermodynamics, Indian History, Python..."
                                        className="w-full bg-gradient-to-r from-[#111] to-[#0f0f0f] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-600/20 transition-all duration-300 text-base shadow-lg shadow-black/20"
                                        autoFocus
                                    />
                                    <div className="absolute inset-0 rounded-2xl bg-blue-600/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-base font-semibold text-white mb-4">Popular Topics <span className="text-neutral-400 font-normal">(optional)</span></label>
                                <div className="relative group">
                                    <select
                                        onChange={(e) => {
                                            const selected = POPULAR_TOPICS.find(t => t.label === e.target.value);
                                            if (selected) {
                                                setTopic(selected.label);
                                                setExamType(selected.exam);
                                            }
                                        }}
                                        className="w-full appearance-none bg-gradient-to-r from-[#111] to-[#0f0f0f] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-600/20 transition-all duration-300 cursor-pointer shadow-lg shadow-black/20"
                                        defaultValue=""
                                    >
                                        <option value="" disabled className="bg-[#111] text-neutral-400">Select a popular topic...</option>
                                        {POPULAR_TOPICS.map((item) => (
                                            <option key={item.label} value={item.label} className="bg-[#111] text-white">
                                                {item.icon} {item.label} ({item.exam})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 group-focus-within:text-blue-600 transition-colors">
                                        <ChevronRight size={18} className="rotate-90" />
                                    </div>
                                    <div className="absolute inset-0 rounded-2xl bg-blue-600/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
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
                            className="p-4 md:p-8 space-y-6 md:space-y-10"
                        >
                            {/* Difficulty */}
                            <div className="space-y-4">
                                <label className="block text-base font-semibold text-white mb-6">Difficulty Level</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { value: 'easy', label: 'Easy', icon: Zap, color: 'text-emerald-400', bg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-500/30', shadow: 'shadow-emerald-500/10' },
                                        { value: 'medium', label: 'Medium', icon: Target, color: 'text-yellow-400', bg: 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/5', border: 'border-yellow-500/30', shadow: 'shadow-yellow-500/10' },
                                        { value: 'hard', label: 'Hard', icon: Sparkles, color: 'text-red-400', bg: 'bg-gradient-to-br from-red-500/10 to-red-600/5', border: 'border-red-500/30', shadow: 'shadow-red-500/10' }
                                    ].map((level) => (
                                        <button
                                            key={level.value}
                                            onClick={() => setDifficulty(level.value as any)}
                                            className={`relative p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-3 group hover:scale-105 ${
                                                difficulty === level.value
                                                    ? `${level.bg} ${level.border} ring-2 ring-inset ring-white/20 shadow-2xl ${level.shadow}`
                                                    : 'bg-gradient-to-br from-[#111] to-[#0f0f0f] border-white/10 hover:bg-white/5 hover:border-white/20 hover:shadow-lg hover:shadow-black/20'
                                                }`}
                                        >
                                            <level.icon size={24} className={`${level.color} transition-transform group-hover:scale-110`} />
                                            <span className={`text-sm font-semibold transition-colors ${difficulty === level.value ? 'text-white' : 'text-neutral-300 group-hover:text-white'}`}>
                                                {level.label}
                                            </span>
                                            {difficulty === level.value && (
                                                <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-white animate-pulse shadow-lg shadow-white/30" />
                                            )}
                                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${level.color.replace('text-', 'from-').replace('-400', '-500/5')} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Question Count Slider */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-base font-semibold text-white">Number of Questions</label>
                                    <div className="bg-blue-600 px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20">
                                        <span className="text-xl font-bold text-white tabular-nums">{questionCount}</span>
                                    </div>
                                </div>
                                <div className="relative h-12 flex items-center px-2">
                                    <input
                                        type="range"
                                        min="10"
                                        max="50"
                                        step="5"
                                        value={questionCount}
                                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                        className="w-full h-4 bg-gradient-to-r from-[#111] to-[#0f0f0f] rounded-xl appearance-none cursor-pointer z-10 slider-thumb focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="h-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-300" style={{ width: `${((questionCount - 10) / 40) * 100}%` }} />
                                    </div>
                                    <div className="absolute w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 border-4 border-white shadow-xl -mt-3 flex items-center justify-center transition-all duration-300 hover:scale-110" style={{ left: `calc(${((questionCount - 10) / 40) * 100}% - 20px)` }}>
                                        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm text-neutral-400 mt-4 font-medium">
                                    <span className="bg-[#111] px-3 py-1 rounded-lg">10 Questions</span>
                                    <span className="bg-blue-600/20 text-blue-300 px-4 py-1 rounded-lg font-bold border border-blue-600/30">{questionCount} Questions</span>
                                    <span className="bg-[#111] px-3 py-1 rounded-lg">50 Questions</span>
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
                            className="p-4 md:p-8 space-y-6 md:space-y-8"
                        >
                            <div className="space-y-3">
                                <label className="block text-base font-semibold text-white mb-3">Exam Type <span className="text-neutral-400 font-normal">(Optional)</span></label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={examType}
                                        onChange={(e) => setExamType(e.target.value)}
                                        placeholder="e.g. NEET, JEE, UPSC..."
                                        className="w-full bg-gradient-to-r from-[#111] to-[#0f0f0f] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-600/20 transition-all duration-300 text-base shadow-lg shadow-black/20"
                                    />
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-blue-600/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-base font-semibold text-white mb-3">Reference Material <span className="text-neutral-400 font-normal">(Optional)</span></label>
                                <div className="relative group">
                                    <textarea
                                        value={referencePapers}
                                        onChange={(e) => setReferencePapers(e.target.value)}
                                        placeholder="Paste previous year questions or notes here to help AI understand the pattern..."
                                        rows={8}
                                        className="w-full bg-gradient-to-r from-[#111] to-[#0f0f0f] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-600/20 transition-all duration-300 resize-none shadow-lg shadow-black/20"
                                    />
                                    <div className="absolute bottom-4 right-4 text-neutral-400 group-focus-within:text-blue-600 transition-colors">
                                        <BookOpen size={18} />
                                    </div>
                                    <div className="absolute inset-0 rounded-2xl bg-blue-600/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                </div>
                                <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4 mt-4">
                                    <p className="text-sm text-blue-200 font-medium">
                                        💡 The AI will analyze this text to match the style and difficulty of your exam.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Actions */}
                <div className="p-4 md:p-6 border-t border-white/10 bg-gradient-to-r from-[#0f0f0f] to-[#0a0a0a] backdrop-blur-sm flex items-center justify-between gap-4">
                    {step > 1 ? (
                        <button
                            onClick={prevStep}
                            className="px-6 md:px-8 py-3 md:py-4 rounded-2xl text-sm md:text-base font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-2 hover:scale-105"
                        >
                            <ChevronRight size={18} className="rotate-180" />
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            disabled={!topic.trim()}
                            className="px-6 md:px-10 py-3 md:py-4 rounded-2xl bg-gradient-to-r from-white to-neutral-200 text-black font-bold text-sm md:text-base hover:shadow-xl hover:shadow-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 md:gap-3 hover:scale-105 disabled:hover:shadow-none"
                        >
                            Next <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-6 md:px-10 py-3 md:py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm md:text-base hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 md:gap-3 hover:scale-105 disabled:hover:shadow-none group"
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} className="group-hover:animate-pulse" />
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
                    className="mt-6 p-5 bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/30 rounded-2xl flex items-center gap-4 text-red-300 text-base shadow-lg shadow-red-500/10"
                >
                    <div className="p-2 bg-red-500/20 rounded-xl">
                        <AlertCircle size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium">{error}</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default TestSeriesGenerator;
