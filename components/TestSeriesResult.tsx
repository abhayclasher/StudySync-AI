import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  RotateCw,
  ChevronLeft,
  Trophy,
  BookOpen,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
  BarChart2,
  PieChart as PieChartIcon,
  Target,
  AlertCircle,
  ImageIcon
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import BlockMath from 'react-katex';
import 'katex/dist/katex.min.css';
import { QuizQuestion, TestAttempt } from '../types';
import { getTestSeriesById } from '../services/testSeriesDb';

interface TestSeriesResultProps {
  testAttempt: TestAttempt;
  questions?: QuizQuestion[];
  onRetry: () => void;
  onBack: () => void;
}

const TestSeriesResult: React.FC<TestSeriesResultProps> = ({
  testAttempt,
  questions: propsQuestions,
  onRetry,
  onBack
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(propsQuestions || []);
  const [loading, setLoading] = useState(!propsQuestions);
  const [activeTab, setActiveTab] = useState<'overview' | 'solutions'>('overview');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!propsQuestions && testAttempt.test_series_id) {
      getTestSeriesById(testAttempt.test_series_id).then(test => {
        if (test) {
          setQuestions(test.questions);
          setLoading(false);
        }
      });
    }
  }, [propsQuestions, testAttempt.test_series_id]);

  const timeTaken = testAttempt.time_taken || 0;
  const totalQuestions = questions.length;
  const avgTimePerQ = totalQuestions > 0 ? Math.round(timeTaken / totalQuestions) : 0;
  const percentage = (testAttempt.score / (totalQuestions * 4)) * 100;

  const stats = {
    correct: 0,
    incorrect: 0,
    unattempted: 0
  };

  testAttempt.answers.forEach((ans: any) => {
    if (ans.isCorrect) stats.correct++;
    else if (ans.selectedOption !== undefined && ans.selectedOption !== null) stats.incorrect++;
    else stats.unattempted++;
  });

  const pieData = [
    { name: 'Correct', value: stats.correct, color: '#10b981' },
    { name: 'Incorrect', value: stats.incorrect, color: '#ef4444' },
    { name: 'Unattempted', value: stats.unattempted, color: '#64748b' }
  ];

  const topicData = questions.reduce((acc: any[], q: any) => {
    const topic = q.topic || 'General';
    const existing = acc.find(t => t.name === topic);
    const userAnswer = testAttempt.answers.find((ans: any) => ans.questionId === q.id);
    const score = userAnswer?.isCorrect ? 4 : (userAnswer?.selectedOption !== undefined ? -1 : 0);

    if (existing) {
      existing.score += score;
    } else {
      acc.push({ name: topic, score });
    }
    return acc;
  }, []);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-400';
    if (percentage >= 60) return 'text-blue-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreLabel = (percentage: number) => {
    if (percentage >= 80) return '🎉 Excellent Performance!';
    if (percentage >= 60) return '👍 Good Job!';
    if (percentage >= 40) return '📈 Keep Practicing!';
    return '💪 Room for Improvement';
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const handleShare = () => {
    const text = `I just scored ${testAttempt.score} in the AI Test Series! 🚀\nTime taken: ${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s\nCan you beat my score? #StudySyncAI`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Score</span>
          <div className={`text-3xl md:text-4xl font-bold relative z-10 ${getScoreColor(percentage)}`}>{testAttempt.score}</div>
          <div className="text-slate-400 text-xs relative z-10">Total Marks</div>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Time</span>
          <div className="text-2xl md:text-3xl font-bold text-purple-400 relative z-10">
            {Math.floor(timeTaken / 60)}<span className="text-sm text-slate-500">m</span> {timeTaken % 60}<span className="text-sm text-slate-500">s</span>
          </div>
          <div className="text-slate-400 text-xs relative z-10">Total Duration</div>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Speed</span>
          <div className="text-2xl md:text-3xl font-bold text-orange-400 relative z-10">{avgTimePerQ}<span className="text-sm text-slate-500">s</span></div>
          <div className="text-slate-400 text-xs relative z-10">Avg per Question</div>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Accuracy</span>
          <div className="text-2xl md:text-3xl font-bold text-emerald-400 relative z-10">
            {Math.round((stats.correct / (stats.correct + stats.incorrect || 1)) * 100)}%
          </div>
          <div className="text-slate-400 text-xs relative z-10">Precision</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <PieChartIcon size={20} className="text-blue-400" /> Performance Distribution
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <BarChart2 size={20} className="text-purple-400" /> Topic Analysis
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="score" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSolutions = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {questions.map((q, index) => {
            const question = q as any;
            const userAnswer = testAttempt.answers.find(
              (ans: any) => ans.questionId === question.id
            );
            const isCorrect = userAnswer?.isCorrect;
            const selectedOption = userAnswer?.selectedOption;
            const isExpanded = expandedQuestion === index;
            const isSkipped = selectedOption === undefined || selectedOption === null;

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`bg-[#111] border rounded-2xl overflow-hidden transition-all ${isExpanded ? 'border-blue-500/30 ring-1 ring-blue-500/10' : 'border-white/5 hover:border-white/10'
                  }`}
              >
                <div
                  onClick={() => toggleQuestion(index)}
                  className="p-4 flex items-start gap-4 cursor-pointer"
                >
                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    isSkipped ? 'bg-slate-500/10 border-slate-500/20 text-slate-400' :
                      'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {isCorrect ? <CheckCircle2 size={16} /> : isSkipped ? <AlertCircle size={16} /> : <XCircle size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question {index + 1}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-slate-400 capitalize">{question.type}</span>
                        </div>
                        <h3 className={`text-sm md:text-base font-medium leading-relaxed ${isExpanded ? 'text-white' : 'text-slate-300 line-clamp-2'}`}>
                          {question.question?.includes('$') ? <BlockMath>{question.question}</BlockMath> : question.question}
                        </h3>
                      </div>
                      <div className="text-slate-500 shrink-0 pt-1">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    {!isExpanded && (
                      <div className="mt-3 flex items-center gap-3 text-xs">
                        <span className={`px-2 py-1 rounded-md border ${isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : isSkipped
                            ? 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                          {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                        </span>
                        {question.type === 'numerical' && (
                          <span className="text-slate-400">
                            Correct: {question.answer}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 bg-[#0a0a0a]"
                    >
                      <div className="p-4 md:p-6 space-y-6">
                        {/* Image/Figure if present */}
                        {question.imageDescription && (
                          <div className="p-4 bg-[#151515] rounded-xl border border-white/10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                              <ImageIcon size={24} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-blue-400 font-bold uppercase mb-1">Visual Context</p>
                              <p className="text-sm text-slate-300 italic">{question.imageDescription}</p>
                            </div>
                          </div>
                        )}

                        {/* Options / Answer Display */}
                        <div className="space-y-3">
                          {question.type === 'numerical' || question.type === 'numerical-integer' || question.type === 'numerical-decimal' ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
                                }`}>
                                <p className="text-xs text-slate-400 mb-1">Your Answer</p>
                                <p className={`text-lg font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {selectedOption ?? 'Not Attempted'}
                                </p>
                              </div>
                              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/10">
                                <p className="text-xs text-blue-400 mb-1">Correct Answer</p>
                                <p className="text-lg font-bold text-blue-300">{question.answer}</p>
                              </div>
                            </div>
                          ) : question.type === 'matrix-matching' ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase">Column I</h4>
                                  {question.columnA?.map((item: any) => (
                                    <div key={item.id} className="p-2 bg-white/5 rounded border border-white/10 text-sm">
                                      <span className="font-bold text-slate-400 mr-2">{item.id}.</span> {item.text}
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase">Column II</h4>
                                  {question.columnB?.map((item: any) => (
                                    <div key={item.id} className="p-2 bg-white/5 rounded border border-white/10 text-sm">
                                      <span className="font-bold text-slate-400 mr-2">{item.id}.</span> {item.text}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <p className="text-xs text-blue-400 font-bold mb-2 uppercase">Correct Matches</p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(question.correctMatches || {}).map(([key, values]: [string, any]) => (
                                    <span key={key} className="px-2 py-1 bg-blue-500/20 rounded text-blue-300 text-sm border border-blue-500/30">
                                      {key} → {Array.isArray(values) ? values.join(', ') : values}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : question.type === 'paragraph-based' ? (
                            <div className="space-y-4">
                              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
                                {question.paragraph}
                              </div>
                              <div className="space-y-4">
                                {question.questions?.map((subQ: any, idx: number) => {
                                  const subAns = selectedOption?.[subQ.id];
                                  const subCorrect = subAns === subQ.correctAnswer;
                                  return (
                                    <div key={subQ.id} className="p-3 rounded-lg border border-white/10 bg-[#0a0a0a]">
                                      <p className="text-sm font-medium text-white mb-2">{idx + 1}. {subQ.question}</p>
                                      <div className="flex justify-between text-xs">
                                        <span className={subCorrect ? 'text-emerald-400' : 'text-red-400'}>
                                          Your: {subQ.options?.[subAns] || 'Skipped'}
                                        </span>
                                        <span className="text-blue-400">
                                          Correct: {subQ.options?.[subQ.correctAnswer]}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            question.options?.map((option: string, optIndex: number) => {
                              const isUserSelection = Array.isArray(selectedOption)
                                ? selectedOption.includes(optIndex)
                                : selectedOption === optIndex;

                              const isCorrectOption = Array.isArray(question.correctAnswers)
                                ? question.correctAnswers.includes(optIndex)
                                : question.correctAnswer === optIndex;

                              let statusClass = "border-white/5 bg-[#151515] text-slate-400";
                              if (isUserSelection && isCorrectOption) statusClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";
                              else if (isUserSelection && !isCorrectOption) statusClass = "border-red-500/50 bg-red-500/10 text-red-300";
                              else if (isCorrectOption) statusClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";

                              return (
                                <div
                                  key={optIndex}
                                  className={`p-4 rounded-xl border flex items-center gap-4 text-sm transition-colors ${statusClass}`}
                                >
                                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${isUserSelection || isCorrectOption ? 'border-current' : 'border-slate-700'
                                    }`}>
                                    {String.fromCharCode(65 + optIndex)}
                                  </div>
                                  <span className="flex-1">
                                    {option.includes('$') ? <BlockMath>{option}</BlockMath> : option}
                                  </span>
                                  {isCorrectOption && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
                                  {isUserSelection && !isCorrectOption && <XCircle size={18} className="text-red-400 shrink-0" />}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Explanation */}
                        {question.explanation && (
                          <div className="mt-4 p-5 bg-blue-900/10 border border-blue-900/20 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-2 uppercase tracking-wider">
                              <BookOpen size={14} /> Explanation
                            </div>
                            <div className="text-sm text-slate-300 leading-relaxed">
                              {question.explanation.includes('$') ? <BlockMath>{question.explanation}</BlockMath> : question.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 pb-24 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Trophy className="text-white w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Test Results</h1>
            <p className="text-slate-400 flex items-center gap-2">
              {getScoreLabel(percentage)}
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-slate-500 text-sm">Attempted on {new Date().toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto relative z-10">
          <button
            onClick={onRetry}
            className="flex-1 md:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            <RotateCw size={18} /> Retake
          </button>
          <button
            onClick={handleShare}
            className="flex-1 md:flex-none px-6 py-3 bg-[#1a1a1a] hover:bg-[#222] text-white text-sm font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
            {copied ? 'Copied' : 'Share'}
          </button>
          <button
            onClick={onBack}
            className="px-4 py-3 bg-[#1a1a1a] hover:bg-[#222] text-slate-300 rounded-xl border border-white/10 transition-all flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[#111] border border-white/10 rounded-xl w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: Target },
          { id: 'solutions', label: 'Detailed Solutions', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === tab.id
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' ? renderOverview() : renderSolutions()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TestSeriesResult;