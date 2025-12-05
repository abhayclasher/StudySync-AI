import React, { useState, useEffect } from 'react';
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
    CheckSquare,
    Layout,
    Settings,
    List
} from 'lucide-react';
import { generateTestSeries } from '../services/geminiService';
import { saveTestSeries } from '../services/testSeriesDb';
import { QuizQuestion } from '../types';
import { classifyTopic, TopicContext } from '../utils/topicClassifier';
import { useMediaQuery } from '../hooks/use-media-query';

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
    { id: 'multiple-choice', label: 'Single Correct MCQ', icon: CheckSquare },
    { id: 'multiple-correct', label: 'Multiple Correct MCQ', icon: CheckSquare },
    { id: 'numerical', label: 'Numerical Value', icon: Calculator },
    { id: 'assertion-reason', label: 'Assertion-Reason', icon: FileText },
    { id: 'matrix-matching', label: 'Matrix Matching', icon: Target },
    { id: 'paragraph-based', label: 'Paragraph Based', icon: BookOpen },
];

const TestSeriesGenerator: React.FC<TestSeriesGeneratorProps> = ({ onTestGenerated }) => {
    const isDesktop = useMediaQuery('(min-width: 768px)');
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
    const [topicContext, setTopicContext] = useState<TopicContext>({
        category: 'general',
        isCompetitive: false,
        suggestedModes: []
    });

    // Update context when topic changes
    const handleTopicChange = (newTopic: string) => {
        setTopic(newTopic);
        const context = classifyTopic(newTopic);
        setTopicContext(context);
        if (context.examType) {
            setExamType(context.examType);
        } else if (!context.isCompetitive) {
            setExamType('');
        }
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
            // Check for 500 error specifically if possible, or just give a helpful message
            if (err.message && err.message.includes('500')) {
                setError('Server Error (500). Please check if the backend server is running and configured correctly. You may need to restart it.');
            } else {
                setError(err.message || 'Failed to generate test series. Please ensure the backend server is running.');
            }
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

    // --- DESKTOP LAYOUT ---
    if (isDesktop) {
        return (
            <div className="w-full h-full p-2">
                <div className="grid grid-cols-12 gap-6 h-full">
                    {/* Left Column: Configuration */}
                    <div className="col-span-8 space-y-6">
                        {/* Topic Section */}
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-[1.5rem] p-6 relative overflow-hidden group hover:border-blue-500/20 transition-colors duration-300">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                    <Target className="text-blue-400" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">Topic & Exam</h3>
                                    <p className="text-blue-200/80 text-xs">Define what you want to practice</p>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="relative group/input">
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => handleTopicChange(e.target.value)}
                                        placeholder="Enter topic (e.g. Thermodynamics, Indian History)..."
                                        className="relative w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:bg-[#1a1a1a] transition-all shadow-inner"
                                    />
                                </div>

                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {POPULAR_TOPICS.map((item) => (
                                        <button
                                            key={item.label}
                                            onClick={() => {
                                                handleTopicChange(item.label);
                                                if (item.exam) setExamType(item.exam);
                                            }}
                                            className="group flex items-center gap-2 px-3 py-1.5 bg-[#151515] border border-white/10 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:border-blue-500/30 hover:bg-blue-500/10 whitespace-nowrap transition-all"
                                        >
                                            <span className="grayscale group-hover:grayscale-0 transition-all">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Settings Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Exam Type & Difficulty */}
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-[1.5rem] p-6 space-y-6 hover:border-blue-500/20 transition-colors duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <Settings className="text-purple-400" size={18} />
                                    <h3 className="text-base font-bold text-white">Configuration</h3>
                                </div>

                                {topicContext.isCompetitive ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] text-slate-300 uppercase font-bold mb-2 block tracking-wider">Exam Type</label>
                                            <div className="relative">
                                                <select
                                                    value={examType}
                                                    onChange={(e) => setExamType(e.target.value)}
                                                    className="w-full bg-[#151515] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    {EXAM_TYPES.map(type => (
                                                        <option key={type.value} value={type.value}>{type.label}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-300 uppercase font-bold mb-2 block tracking-wider">Syllabus Year</label>
                                            <div className="flex bg-[#151515] p-1 rounded-lg border border-white/5">
                                                {SYLLABUS_YEARS.map(year => (
                                                    <button
                                                        key={year}
                                                        onClick={() => setSyllabusYear(year)}
                                                        className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${syllabusYear === year ? 'bg-[#222] text-white shadow-sm border border-white/10' : 'text-slate-400 hover:text-slate-200'}`}
                                                    >
                                                        {year}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                        <p className="text-xs text-blue-200 leading-relaxed">Custom learning path optimized for concept building and fundamental understanding.</p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] text-slate-300 uppercase font-bold mb-2 block tracking-wider">Difficulty</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['easy', 'medium', 'hard'].map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setDifficulty(level as any)}
                                                className={`py-2 rounded-lg text-[10px] font-bold capitalize border transition-all ${difficulty === level
                                                    ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                                                    : 'bg-[#151515] border-transparent text-slate-400 hover:text-white hover:bg-[#222]'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Question Types */}
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-[1.5rem] p-6 hover:border-blue-500/20 transition-colors duration-300">
                                <div className="flex items-center gap-2 mb-4">
                                    <List className="text-emerald-400" size={18} />
                                    <h3 className="text-base font-bold text-white">Question Types</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                                    {QUESTION_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => toggleQuestionType(type.id)}
                                            className={`group flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedQuestionTypes.includes(type.id)
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                : 'bg-[#151515] border-transparent text-slate-400 hover:bg-[#1a1a1a] hover:text-slate-200'
                                                }`}
                                        >
                                            <div className={`p-1.5 rounded-md ${selectedQuestionTypes.includes(type.id) ? 'bg-emerald-500/20' : 'bg-black/20 group-hover:bg-black/40'}`}>
                                                <type.icon size={14} />
                                            </div>
                                            <span className="text-xs font-bold">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Summary & Action */}
                    <div className="col-span-4 flex flex-col gap-6">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-[1.5rem] p-6 flex-1 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-50" />

                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                Test Summary
                            </h3>

                            <div className="space-y-6 flex-1">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-xs font-medium text-slate-300">Total Questions</label>
                                        <span className="text-xl font-bold text-white">{questionCount}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="50"
                                        step="5"
                                        value={questionCount}
                                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-300">Reference Material</label>
                                    <textarea
                                        value={referencePapers}
                                        onChange={(e) => setReferencePapers(e.target.value)}
                                        placeholder="Paste any specific notes or text you want the test to be based on..."
                                        className="w-full h-32 bg-[#151515] border border-white/10 rounded-xl p-3 text-xs text-white resize-none focus:outline-none focus:border-blue-500/50 focus:bg-[#1a1a1a] transition-all placeholder-slate-400"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={generating || !topic.trim()}
                                className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        Start Test Series
                                    </>
                                )}
                            </button>

                            {error && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- MOBILE WIZARD LAYOUT ---
    return (
        <div className="w-full h-full pb-20 px-1">
            {/* Header */}
            <div className="mb-4 text-center relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-2 shadow-lg ring-1 ring-white/20 relative z-10">
                    <Brain className="text-white" size={20} />
                </div>
                <h2 className="text-lg font-bold text-white mb-2 relative z-10">AI Test Generator</h2>

                {/* Progress Indicator */}
                <div className="inline-flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded-full px-3 py-1.5 shadow-xl relative z-10">
                    <div className="flex gap-1">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s === step ? 'bg-blue-500 w-4' : s < step ? 'bg-blue-600 w-1' : 'bg-white/10 w-1'}`} />
                        ))}
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold border-l border-white/10 pl-2 uppercase tracking-wider">
                        Step {step}/3
                    </span>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-xl relative min-h-[300px]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

                <div className="p-4 space-y-4">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white flex items-center gap-2">
                                    <div className="p-1 bg-blue-500/10 rounded-lg">
                                        <Target className="text-blue-400" size={14} />
                                    </div>
                                    What to practice?
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => handleTopicChange(e.target.value)}
                                    placeholder="e.g. Thermodynamics..."
                                    className="w-full bg-[#151515] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:bg-[#1a1a1a] transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Popular Topics</label>
                                <div className="relative">
                                    <select
                                        onChange={(e) => {
                                            const selected = POPULAR_TOPICS.find(p => p.label === e.target.value);
                                            if (selected) {
                                                handleTopicChange(selected.label);
                                                if (selected.exam) setExamType(selected.exam);
                                            }
                                        }}
                                        className="w-full bg-[#151515] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                                        value={POPULAR_TOPICS.find(p => p.label === topic)?.label || ""}
                                    >
                                        <option value="" disabled>Select a popular topic...</option>
                                        {POPULAR_TOPICS.map((item) => (
                                            <option key={item.label} value={item.label}>
                                                {item.icon} {item.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            {topicContext.isCompetitive ? (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white block">Exam Type</label>
                                    <div className="relative">
                                        <select
                                            value={examType}
                                            onChange={(e) => setExamType(e.target.value)}
                                            className="w-full bg-[#151515] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                                        >
                                            {EXAM_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                    <p className="text-[10px] text-blue-300 leading-relaxed">Custom learning path optimized for concept building.</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white">Difficulty Level</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['easy', 'medium', 'hard'].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setDifficulty(level as any)}
                                            className={`p-2 rounded-lg border transition-all flex flex-col items-center gap-1 ${difficulty === level
                                                ? 'bg-white text-black border-white shadow-md'
                                                : 'bg-[#151515] border-transparent text-slate-400 hover:bg-[#1a1a1a]'
                                                }`}
                                        >
                                            <span className="text-[9px] font-bold capitalize">{level}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <label className="text-xs font-bold text-white">Number of Questions</label>
                                    <span className="text-xl font-bold text-blue-400">{questionCount}</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="50"
                                    step="5"
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>

                            <div className="bg-[#151515] border border-white/5 rounded-xl p-3 space-y-2">
                                <div className="flex justify-between text-[10px] border-b border-white/5 pb-2">
                                    <span className="text-slate-300">Topic</span>
                                    <span className="text-white font-medium truncate max-w-[150px]">{topic}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-300">Difficulty</span>
                                    <span className="text-white font-medium capitalize">{difficulty}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 flex items-center justify-between border-t border-white/5 mt-auto bg-[#0a0a0a]/80 backdrop-blur-sm absolute bottom-0 w-full">
                    {step > 1 ? (
                        <button onClick={prevStep} className="p-2.5 rounded-xl text-slate-300 hover:bg-white/5 transition-colors">
                            <ChevronRight size={18} className="rotate-180" />
                        </button>
                    ) : <div />}

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            disabled={!topic.trim()}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-sm"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-sm"
                        >
                            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            Start Test
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-4 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-[10px] flex items-center gap-2 shadow-lg">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}
        </div>
    );
};

export default TestSeriesGenerator;
