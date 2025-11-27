import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Zap,
    Brain,
    ChevronRight,
    Loader2,
    AlertCircle,
    BookOpen,
    Target
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
        <div className="max-w-4xl mx-auto pb-28 md:pb-8 px-4">
            {/* Header */}
            <div className="mb-6 md:mb-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-blue-600 mb-4 md:mb-6 shadow-lg shadow-blue-600/20">
                    <Brain className="text-white" size={24} />
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3">
                    AI Test Generator
                </h2>
                <p className="text-slate-400 text-sm md:text-lg mb-4 md:mb-6">Create a custom test series in seconds</p>

                {/* Progress Indicator */}
                <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-3 md:px-4 py-1.5 md:py-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-xs md:text-sm text-blue-200 font-medium">Enter topic → Choose settings → Generate AI test</span>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 md:gap-3 mb-6 md:mb-10">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2 md:gap-3">
                        <div className={`relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full transition-all duration-300 ${s <= step
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'bg-[#1a1a1a] text-slate-500 border border-white/10'
                            }`}>
                            <span className="text-xs md:text-sm font-bold">{s}</span>
                        </div>
                        {s < 3 && (
                            <div className={`h-0.5 w-8 md:w-12 rounded-full transition-all duration-300 ${s < step ? 'bg-blue-600' : 'bg-[#1a1a1a]'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-4 md:p-8 space-y-4 md:space-y-6"
                        >
                            <div className="space-y-2 md:space-y-3">
                                <label className="block text-sm md:text-base font-semibold text-white mb-2 md:mb-3">What do you want to practice?</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Thermodynamics, Indian History, Python..."
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all duration-300"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2 md:space-y-3">
                                <label className="block text-sm md:text-base font-semibold text-white mb-2 md:mb-3">Popular Topics <span className="text-slate-400 font-normal">(optional)</span></label>
                                <select
                                    onChange={(e) => {
                                        const selected = POPULAR_TOPICS.find(t => t.label === e.target.value);
                                        if (selected) {
                                            setTopic(selected.label);
                                            setExamType(selected.exam);
                                        }
                                    }}
                                    className="w-full appearance-none bg-[#1a1a1a] border border-white/10 rounded-xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all duration-300 cursor-pointer"
                                    defaultValue=""
                                >
                                    <option value="" disabled className="bg-[#111] text-slate-400">Select a popular topic...</option>
                                    {POPULAR_TOPICS.map((item) => (
                                        <option key={item.label} value={item.label} className="bg-[#111] text-white">
                                            {item.icon} {item.label} ({item.exam})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-4 md:p-8 space-y-6 md:space-y-8"
                        >
                            {/* Difficulty */}
                            <div className="space-y-3 md:space-y-4">
                                <label className="block text-sm md:text-base font-semibold text-white mb-4 md:mb-6">Difficulty Level</label>
                                <div className="grid grid-cols-3 gap-2 md:gap-3">
                                    {[
                                        { value: 'easy', label: 'Easy', icon: Zap, color: 'blue-400' },
                                        { value: 'medium', label: 'Medium', icon: Target, color: 'blue-500' },
                                        { value: 'hard', label: 'Hard', icon: Sparkles, color: 'blue-600' }
                                    ].map((level) => (
                                        <button
                                            key={level.value}
                                            onClick={() => setDifficulty(level.value as any)}
                                            className={`relative p-3 md:p-6 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 md:gap-3 group hover:scale-105 ${difficulty === level.value
                                                    ? `bg-blue-600/10 border-blue-600 ring-1 md:ring-2 ring-blue-600/20 shadow-lg`
                                                    : 'bg-[#1a1a1a] border-white/10 hover:bg-white/5 hover:border-blue-600/30'
                                                }`}
                                        >
                                            <level.icon size={20} className={`md:w-6 md:h-6 text-${level.color} transition-transform group-hover:scale-110`} />
                                            <span className={`text-xs md:text-sm font-semibold transition-colors ${difficulty === level.value ? 'text-white' : 'text-slate-300 group-hover:text-white'
                                                }`}>
                                                {level.label}
                                            </span>
                                            {difficulty === level.value && (
                                                <div className="absolute top-2 md:top-3 right-2 md:right-3 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-400 animate-pulse" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Question Count Slider */}
                            <div className="space-y-4 md:space-y-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm md:text-base font-semibold text-white">Number of Questions</label>
                                    <div className="bg-blue-600 px-3 md:px-4 py-1.5 md:py-2 rounded-xl shadow-lg shadow-blue-600/20">
                                        <span className="text-lg md:text-xl font-bold text-white tabular-nums">{questionCount}</span>
                                    </div>
                                </div>
                                <div className="relative h-10 md:h-12 flex items-center px-1 md:px-2">
                                    <input
                                        type="range"
                                        min="10"
                                        max="50"
                                        step="5"
                                        value={questionCount}
                                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                        className="w-full h-3 md:h-4 bg-[#1a1a1a] rounded-xl appearance-none cursor-pointer z-10 slider-thumb focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        style={{
                                            background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((questionCount - 10) / 40) * 100}%, #1a1a1a ${((questionCount - 10) / 40) * 100}%, #1a1a1a 100%)`
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs md:text-sm text-slate-400 font-medium">
                                    <span className="bg-[#1a1a1a] px-2 md:px-3 py-1 rounded-lg">10</span>
                                    <span className="bg-blue-600/20 text-blue-300 px-3 md:px-4 py-1 rounded-lg font-bold border border-blue-600/30">{questionCount}</span>
                                    <span className="bg-[#1a1a1a] px-2 md:px-3 py-1 rounded-lg">50</span>
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
                            className="p-4 md:p-8 space-y-4 md:space-y-6"
                        >
                            <div className="space-y-2 md:space-y-3">
                                <label className="block text-sm md:text-base font-semibold text-white mb-2 md:mb-3">Exam Type <span className="text-slate-400 font-normal">(Optional)</span></label>
                                <input
                                    type="text"
                                    value={examType}
                                    onChange={(e) => setExamType(e.target.value)}
                                    placeholder="e.g. NEET, JEE, UPSC..."
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all duration-300"
                                />
                            </div>

                            <div className="space-y-2 md:space-y-3">
                                <label className="block text-sm md:text-base font-semibold text-white mb-2 md:mb-3">Reference Material <span className="text-slate-400 font-normal">(Optional)</span></label>
                                <textarea
                                    value={referencePapers}
                                    onChange={(e) => setReferencePapers(e.target.value)}
                                    placeholder="Paste previous year questions or notes here to help AI understand the pattern..."
                                    rows={6}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all duration-300 resize-none"
                                />
                                <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-3 md:p-4">
                                    <p className="text-xs md:text-sm text-blue-200 font-medium flex items-start gap-2">
                                        <BookOpen size={16} className="flex-shrink-0 mt-0.5 md:w-4 md:h-4" />
                                        The AI will analyze this text to match the style and difficulty of your exam.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Actions */}
                <div className="p-4 md:p-6 border-t border-white/10 bg-[#0a0a0a] flex items-center justify-between gap-3 md:gap-4">
                    {step > 1 ? (
                        <button
                            onClick={prevStep}
                            className="px-4 md:px-8 py-2.5 md:py-4 rounded-xl text-xs md:text-base font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
                        >
                            <ChevronRight size={16} className="md:w-4 md:h-4 rotate-180" />
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            disabled={!topic.trim()}
                            className="px-6 md:px-10 py-2.5 md:py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs md:text-base hover:shadow-xl hover:shadow-blue-600/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 md:gap-3 hover:scale-105 disabled:hover:scale-100"
                        >
                            Next <ChevronRight size={16} className="md:w-4 md:h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-6 md:px-10 py-2.5 md:py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs md:text-base hover:shadow-xl hover:shadow-blue-600/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 md:gap-3 hover:scale-105 disabled:hover:scale-100 group"
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={16} className="md:w-4 md:h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} className="md:w-4 md:h-4 group-hover:animate-pulse" />
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
                    className="mt-4 md:mt-6 p-4 md:p-5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 md:gap-4 text-red-300 text-sm md:text-base shadow-lg"
                >
                    <div className="p-1.5 md:p-2 bg-red-500/20 rounded-xl">
                        <AlertCircle size={18} className="md:w-5 md:h-5" />
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
