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
    ChevronDown,
    Calendar,
    Calculator,
    Image as ImageIcon,
    FileText,
    CheckSquare
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

const SYLLABUS_YEARS = ['2025', '2024', '2023'];

const QUESTION_TYPES = [
    { id: 'multiple-choice', label: 'Multiple Choice', icon: CheckSquare },
    { id: 'numerical', label: 'Numerical', icon: Calculator },
    { id: 'assertion-reason', label: 'Assertion-Reason', icon: FileText },
    // { id: 'image-based', label: 'Image Based', icon: ImageIcon }, // Future support
];

const TestSeriesGenerator: React.FC<TestSeriesGeneratorProps> = ({ onTestGenerated }) => {
    const [step, setStep] = useState(1);
    const [topic, setTopic] = useState('');
    const [examType, setExamType] = useState('');
    const [questionCount, setQuestionCount] = useState(30);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [referencePapers, setReferencePapers] = useState('');
    const [syllabusYear, setSyllabusYear] = useState('2025');
    const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(['multiple-choice']);
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

    const toggleQuestionType = (typeId: string) => {
        setSelectedQuestionTypes(prev =>
            prev.includes(typeId)
                ? prev.length > 1 ? prev.filter(t => t !== typeId) : prev // Prevent empty selection
                : [...prev, typeId]
        );
    };

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        setGenerating(true);
        setError('');

        try {
            // Pass new parameters to service
            const questions = await generateTestSeries(
                topic,
                questionCount,
                difficulty,
                examType || undefined,
                referencePapers.trim() || undefined,
                syllabusYear,
                selectedQuestionTypes
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
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 mb-4 md:mb-6 shadow-lg shadow-blue-600/30 ring-4 ring-blue-600/10">
                    <Brain className="text-white" size={28} />
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3 tracking-tight">
                    AI Test Generator
                </h2>
                <p className="text-slate-400 text-sm md:text-lg mb-4 md:mb-6 max-w-lg mx-auto">
                    Create custom, syllabus-aligned test series with advanced question types.
                </p>

                {/* Progress Indicator */}
                <div className="inline-flex items-center gap-3 bg-[#0a0a0a] border border-white/10 rounded-full px-4 py-2 shadow-xl">
                    <div className="flex gap-1.5">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`w-2 h-2 rounded-full transition-all duration-300 ${s === step ? 'bg-blue-500 w-6' : s < step ? 'bg-blue-600' : 'bg-slate-700'
                                }`} />
                        ))}
                    </div>
                    <span className="text-xs text-slate-400 font-medium border-l border-white/10 pl-3">
                        Step {step} of 3
                    </span>
                </div>
            </div>

            <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                            className="p-6 md:p-10 space-y-8"
                        >
                            <div className="space-y-4">
                                <label className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                                    <Target className="text-blue-400" size={20} />
                                    What do you want to practice?
                                </label>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-40 transition duration-500 blur"></div>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g. Thermodynamics, Indian History, Python..."
                                        className="relative w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-5 py-4 text-base md:text-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all duration-300"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Popular Topics</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {POPULAR_TOPICS.map((item) => (
                                        <button
                                            key={item.label}
                                            onClick={() => {
                                                setTopic(item.label);
                                                setExamType(item.exam);
                                            }}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a1a] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all text-left group"
                                        >
                                            <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-white truncate">{item.label}</div>
                                                {item.exam && <div className="text-xs text-slate-500">{item.exam}</div>}
                                            </div>
                                            <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
                                        </button>
                                    ))}
                                </div>
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
                            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                            className="p-6 md:p-10 space-y-8"
                        >
                            {/* Exam Type & Syllabus */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-white flex items-center gap-2">
                                        <GraduationCap size={18} className="text-blue-400" /> Exam Type
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={examType}
                                            onChange={(e) => setExamType(e.target.value)}
                                            className="w-full appearance-none bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                                        >
                                            {EXAM_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Calendar size={18} className="text-purple-400" /> Syllabus Year
                                    </label>
                                    <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-white/10">
                                        {SYLLABUS_YEARS.map(year => (
                                            <button
                                                key={year}
                                                onClick={() => setSyllabusYear(year)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${syllabusYear === year
                                                        ? 'bg-blue-600 text-white shadow-lg'
                                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {year}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Question Types */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-white">Question Types</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {QUESTION_TYPES.map(type => {
                                        const isSelected = selectedQuestionTypes.includes(type.id);
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => toggleQuestionType(type.id)}
                                                className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${isSelected
                                                        ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                                        : 'bg-[#1a1a1a] border-white/10 text-slate-400 hover:border-white/20'
                                                    }`}
                                            >
                                                <type.icon size={18} />
                                                <span className="text-sm font-medium">{type.label}</span>
                                                {isSelected && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Difficulty */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-white">Difficulty Level</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'easy', label: 'Easy', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                                        { value: 'medium', label: 'Medium', icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                                        { value: 'hard', label: 'Hard', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
                                    ].map((level) => (
                                        <button
                                            key={level.value}
                                            onClick={() => setDifficulty(level.value as any)}
                                            className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${difficulty === level.value
                                                    ? `${level.bg} ${level.border} ring-1 ring-inset ring-white/10`
                                                    : 'bg-[#1a1a1a] border-white/10 hover:bg-white/5'
                                                }`}
                                        >
                                            <level.icon size={24} className={difficulty === level.value ? level.color : 'text-slate-500'} />
                                            <span className={`text-sm font-medium ${difficulty === level.value ? 'text-white' : 'text-slate-400'}`}>
                                                {level.label}
                                            </span>
                                        </button>
                                    ))}
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
                            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                            className="p-6 md:p-10 space-y-8"
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-white">Number of Questions</label>
                                    <span className="text-2xl font-bold text-blue-400">{questionCount}</span>
                                </div>
                                <Slider
                                    value={questionCount}
                                    onChange={(value) => setQuestionCount(value as number)}
                                    maxValue={50}
                                    minValue={10}
                                    step={5}
                                    size="lg"
                                    className="max-w-full"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-white flex items-center gap-2">
                                    <BookOpen size={18} className="text-slate-400" />
                                    Reference Material <span className="text-slate-500 font-normal">(Optional)</span>
                                </label>
                                <textarea
                                    value={referencePapers}
                                    onChange={(e) => setReferencePapers(e.target.value)}
                                    placeholder="Paste notes, previous questions, or specific topics here..."
                                    rows={5}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all resize-none"
                                />
                            </div>

                            {/* Summary Card */}
                            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-white/10 rounded-2xl p-6">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Test Configuration</h3>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                    <div>
                                        <div className="text-xs text-slate-500 mb-1">Topic</div>
                                        <div className="text-white font-medium truncate">{topic}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 mb-1">Exam & Year</div>
                                        <div className="text-white font-medium">{selectedExam?.label || 'General'} ({syllabusYear})</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 mb-1">Format</div>
                                        <div className="text-white font-medium">{selectedQuestionTypes.length} Types Selected</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 mb-1">Difficulty</div>
                                        <div className="text-white font-medium capitalize">{difficulty}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Actions */}
                <div className="p-6 md:p-10 pt-0 flex items-center justify-between border-t border-white/5 mt-4">
                    {step > 1 ? (
                        <button
                            onClick={prevStep}
                            className="px-6 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium flex items-center gap-2"
                        >
                            <ChevronRight size={18} className="rotate-180" /> Back
                        </button>
                    ) : <div />}

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            disabled={!topic.trim()}
                            className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-white/5"
                        >
                            Next <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-10 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Generating Test...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} className="group-hover:animate-pulse" />
                                    Start Test Series
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
                    className="mt-6 max-w-4xl mx-auto p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-300 shadow-lg"
                >
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="font-medium">{error}</p>
                </motion.div>
            )}
        </div>
    );
};

export default TestSeriesGenerator;
