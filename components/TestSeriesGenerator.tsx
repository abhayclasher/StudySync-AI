import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@heroui/react';
import {
    Sparkles,
    Zap,
    Brain,
    ChevronRight,
    Loader2,
    AlertCircle,
    BookOpen,
    Target,
    GraduationCap,
    ChevronDown
} from 'lucide-react';
import { generateTestSeries } from '../services/geminiService';
import { saveTestSeries } from '../services/testSeriesDb';
import { QuizQuestion } from '../types';

interface TestSeriesGeneratorProps {
    onTestGenerated?: (testId: string, questions: QuizQuestion[]) => void;
}

// Exam types for competitive exams
const EXAM_TYPES = [
    { value: '', label: 'Custom / General', desc: 'No specific exam pattern', icon: '📝' },
    { value: 'NEET', label: 'NEET', desc: 'Medical Entrance | +4/-1', icon: '🏥' },
    { value: 'JEE Main', label: 'JEE Main', desc: 'Engineering | +4/-1', icon: '⚙️' },
    { value: 'JEE Advanced', label: 'JEE Advanced', desc: 'IIT Entrance | +4/-1', icon: '🎓' },
    { value: 'UPSC', label: 'UPSC', desc: 'Civil Services | +2/-0.66', icon: '🏛️' },
    { value: 'SSC CGL', label: 'SSC CGL', desc: 'Staff Selection | +2/-0.5', icon: '📊' },
    { value: 'CAT', label: 'CAT', desc: 'MBA Entrance | +3/-1', icon: '💼' },
    { value: 'GATE', label: 'GATE', desc: 'Engineering PG | +1 or +2', icon: '🔬' },
];

// Popular exam topics for quick selection
const POPULAR_TOPICS = [
    { label: 'NEET Biology - Reproduction', exam: 'NEET', icon: '🧬' },
    { label: 'NEET Physics - Mechanics', exam: 'NEET', icon: '⚛️' },
    { label: 'JEE Math - Calculus', exam: 'JEE Main', icon: '📐' },
    { label: 'JEE Chemistry - Organic', exam: 'JEE Main', icon: '🧪' },
    { label: 'Class 12 Physics', exam: '', icon: '⚡' },
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
    const [direction, setDirection] = useState(0);

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0
        })
    };

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

    const nextStep = () => {
        setDirection(1);
        setStep(s => Math.min(s + 1, 3));
    };
    const prevStep = () => {
        setDirection(-1);
        setStep(s => Math.max(s - 1, 1));
    };

    const selectedExam = EXAM_TYPES.find(e => e.value === examType);

    return (
        <div className="w-full h-full pb-28 md:pb-8 px-4">
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
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="p-4 md:p-8 space-y-4 md:space-y-6"
                        >
                            <div className="space-y-2 md:space-y-3">
                                <label className="block text-sm md:text-base font-semibold text-white mb-2 md:mb-3">What do you want to practice?</label>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-30 transition duration-500 blur"></div>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g. Thermodynamics, Indian History, Python..."
                                        className="relative w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all duration-300"
                                        autoFocus
                                    />
                                </div>
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
                                            {item.icon} {item.label} {item.exam && `(${item.exam})`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="p-4 md:p-8 space-y-6 md:space-y-8"
                        >
                            {/* Exam Type Selection */}
                            <div className="space-y-3 md:space-y-4">
                                <label className="block text-sm md:text-base font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
                                    <GraduationCap size={20} className="text-blue-400" />
                                    Exam Type
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                                    {EXAM_TYPES.map((exam) => (
                                        <button
                                            key={exam.value}
                                            onClick={() => setExamType(exam.value)}
                                            className={`relative p-3 md:p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 group hover:scale-105 ${examType === exam.value
                                                ? 'bg-blue-600/10 border-blue-600 ring-1 md:ring-2 ring-blue-600/20 shadow-lg'
                                                : 'bg-[#1a1a1a] border-white/10 hover:bg-white/5 hover:border-blue-600/30'
                                                }`}
                                        >
                                            <span className="text-2xl">{exam.icon}</span>
                                            <span className={`text-xs md:text-sm font-semibold transition-colors ${examType === exam.value ? 'text-white' : 'text-slate-300 group-hover:text-white'
                                                }`}>
                                                {exam.label}
                                            </span>
                                            {examType === exam.value && (
                                                <div className="absolute top-2 right-2 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-400 animate-pulse" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {selectedExam && selectedExam.value && (
                                    <div className="p-3 md:p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                        <p className="text-xs md:text-sm text-blue-300">
                                            <strong>{selectedExam.label}:</strong> {selectedExam.desc}
                                        </p>
                                    </div>
                                )}
                            </div>

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
                                <div className="max-w-md">
                                    <Slider
                                        value={questionCount}
                                        onChange={(value) => setQuestionCount(value as number)}
                                        formatOptions={{ style: "decimal" }}
                                        label="Select number of questions"
                                        maxValue={50}
                                        minValue={10}
                                        showTooltip={true}
                                        step={5}
                                        size="md"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="p-4 md:p-8 space-y-4 md:space-y-6"
                        >
                            <div className="space-y-2 md:space-y-3">
                                <label className="block text-sm md:text-base font-semibold text-white mb-2 md:mb-3">Reference Material <span className="text-slate-400 font-normal">(optional)</span></label>
                                <textarea
                                    value={referencePapers}
                                    onChange={(e) => setReferencePapers(e.target.value)}
                                    placeholder="Paste previous year questions, notes, or any reference material here..."
                                    rows={6}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all duration-300 resize-none"
                                />
                                <p className="text-xs text-slate-500">AI will analyze this material to generate similar questions</p>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 md:p-6 space-y-3">
                                <h3 className="text-sm font-semibold text-white mb-3">Test Summary</h3>
                                <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
                                    <div>
                                        <p className="text-slate-500">Topic</p>
                                        <p className="text-white font-medium truncate">{topic || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Exam Type</p>
                                        <p className="text-white font-medium">{selectedExam?.label || 'Custom'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Difficulty</p>
                                        <p className="text-white font-medium capitalize">{difficulty}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Questions</p>
                                        <p className="text-white font-medium">{questionCount}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Actions */}
                <div className="p-4 md:p-8 pt-0 flex items-center justify-between">
                    {step > 1 ? (
                        <button
                            onClick={prevStep}
                            className="px-4 md:px-6 py-2 md:py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm md:text-base font-medium flex items-center gap-2"
                        >
                            <ChevronRight size={16} className="rotate-180" /> Back
                        </button>
                    ) : <div />}

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            disabled={!topic.trim()}
                            className="px-6 md:px-8 py-3 md:py-4 rounded-xl bg-white text-black text-sm md:text-base font-bold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-white/5"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-8 md:px-12 py-3 md:py-4 rounded-xl bg-blue-600 text-white text-sm md:text-base font-bold hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-600/30 group"
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} className="group-hover:animate-pulse" />
                                    Start Test
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
                    className="mt-4 md:mt-6 p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-300 shadow-lg text-sm md:text-base"
                >
                    <AlertCircle size={16} />
                    <p className="font-medium">{error}</p>
                </motion.div>
            )}
        </div>
    );
};

export default TestSeriesGenerator;
