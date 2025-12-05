import React, { useState, useEffect, useMemo } from 'react';
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
  BarChart2,
  PieChart as PieChartIcon,
  Target,
  AlertCircle,
  ImageIcon,
  Lightbulb,
  Quote,
  Zap,
  Activity,
  Clock
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

const MOTIVATIONAL_QUOTES = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "Don't watch the clock; do what it does. Keep going.",
  "The future belongs to those who believe in the beauty of their dreams."
];

const TestSeriesResult: React.FC<TestSeriesResultProps> = ({
  testAttempt,
  questions: propsQuestions,
  onRetry,
  onBack
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(propsQuestions || []);
  const [loading, setLoading] = useState((!propsQuestions || propsQuestions.length === 0) && !!testAttempt.test_series_id);
  const [activeTab, setActiveTab] = useState<'overview' | 'solutions'>('overview');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [quote, setQuote] = useState('');

  useEffect(() => {
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

    if ((!propsQuestions || propsQuestions.length === 0) && testAttempt.test_series_id) {
      setLoading(true);
      getTestSeriesById(testAttempt.test_series_id).then(test => {
        if (test) {
          setQuestions(test.questions);
        }
        setLoading(false);
      }).catch(err => {
        console.error("Failed to load test series:", err);
        setLoading(false);
      });
    } else if (propsQuestions && propsQuestions.length > 0) {
      setLoading(false);
    }
  }, [propsQuestions, testAttempt.test_series_id]);

  // Robust Stats Calculation
  const stats = useMemo(() => {
    if (questions.length === 0) return { correct: 0, incorrect: 0, unattempted: 0, accuracy: 0 };

    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    questions.forEach(q => {
      const ans = testAttempt.answers.find((a: any) => a.questionId === q.id);

      if (ans) {
        if (ans.isCorrect !== undefined) {
          if (ans.isCorrect) correct++;
          else if (ans.selectedOption !== undefined && ans.selectedOption !== null) incorrect++;
          else unattempted++;
        } else {
          const isCorrectOption = Array.isArray((q as any).correctAnswers)
            ? (q as any).correctAnswers.includes(ans.selectedOption)
            : (q as any).correctAnswer === ans.selectedOption;

          if (ans.selectedOption !== undefined && ans.selectedOption !== null) {
            if (isCorrectOption) correct++;
            else incorrect++;
          } else {
            unattempted++;
          }
        }
      } else {
        unattempted++;
      }
    });

    const totalAttempted = correct + incorrect;
    const accuracy = totalAttempted > 0 ? Math.round((correct / totalAttempted) * 100) : 0;

    return { correct, incorrect, unattempted, accuracy };
  }, [questions, testAttempt.answers]);

  const timeTaken = testAttempt.time_taken || 0;
  const totalQuestions = questions.length || testAttempt.total_questions || 1;
  const avgTimePerQ = totalQuestions > 0 ? Math.round(timeTaken / totalQuestions) : 0;
  const currentScore = testAttempt.score !== undefined ? testAttempt.score : (stats.correct * 4 - stats.incorrect);
  const maxScore = totalQuestions * 4;
  const percentage = Math.round((currentScore / maxScore) * 100) || 0;

  const pieData = [
    { name: 'Correct', value: stats.correct, color: '#10b981' },
    { name: 'Incorrect', value: stats.incorrect, color: '#ef4444' },
    { name: 'Unattempted', value: stats.unattempted, color: '#64748b' }
  ];

  const topicData = questions.reduce((acc: any[], q: any) => {
    const topic = q.topic || 'General';
    const existing = acc.find(t => t.name === topic);
    const userAnswer = testAttempt.answers.find((ans: any) => ans.questionId === q.id);

    let score = 0;
    if (userAnswer) {
      if (userAnswer.isCorrect) score = 4;
      else if (userAnswer.selectedOption !== undefined && userAnswer.selectedOption !== null) score = -1;
    }

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
    if (percentage >= 80) return 'Excellent!';
    if (percentage >= 60) return 'Good Job!';
    if (percentage >= 40) return 'Keep Going!';
    return 'Needs Work';
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const handleShare = () => {
    const text = `I just scored ${currentScore} in the AI Test Series! 🚀\nTime taken: ${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s\nCan you beat my score? #StudySyncAI`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Stats Grid - Ultra Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-lg">
          <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-500" />
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2 text-blue-400 group-hover:scale-110 transition-transform duration-500">
            <Trophy size={16} />
          </div>
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 relative z-10">Score</span>
          <div className={`text-2xl md:text-3xl font-bold relative z-10 ${getScoreColor(percentage)}`}>{currentScore}</div>
          <div className="text-slate-500 text-[10px] relative z-10">/ {maxScore} Marks</div>
        </div>

        <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-lg">
          <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors duration-500" />
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2 text-purple-400 group-hover:scale-110 transition-transform duration-500">
            <Clock size={16} />
          </div>
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 relative z-10">Time</span>
          <div className="text-xl md:text-2xl font-bold text-purple-400 relative z-10">
            {Math.floor(timeTaken / 60)}<span className="text-[10px] text-slate-500">m</span> {timeTaken % 60}<span className="text-[10px] text-slate-500">s</span>
          </div>
          <div className="text-slate-500 text-[10px] relative z-10">Total Duration</div>
        </div>

        <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-lg">
          <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors duration-500" />
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2 text-orange-400 group-hover:scale-110 transition-transform duration-500">
            <Zap size={16} />
          </div>
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 relative z-10">Speed</span>
          <div className="text-xl md:text-2xl font-bold text-orange-400 relative z-10">{avgTimePerQ}<span className="text-[10px] text-slate-500">s</span></div>
          <div className="text-slate-500 text-[10px] relative z-10">Avg per Question</div>
        </div>

        <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-lg">
          <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors duration-500" />
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2 text-emerald-400 group-hover:scale-110 transition-transform duration-500">
            <Target size={16} />
          </div>
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 relative z-10">Accuracy</span>
          <div className="text-xl md:text-2xl font-bold text-emerald-400 relative z-10">
            {stats.accuracy}%
          </div>
          <div className="text-slate-500 text-[10px] relative z-10">{stats.correct} Correct</div>
        </div>
      </div>

      {/* Advanced Analytics Section - Compact */}
      <div className="grid md:grid-cols-2 gap-3">
        {/* Improvement Suggestions */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-4 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-yellow-400" /> Analysis & Insights
          </h3>
          <div className="space-y-2">
            {stats.incorrect > 0 ? (
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex gap-3 items-start hover:bg-red-500/10 transition-colors">
                <div className="p-1.5 bg-red-500/10 rounded-lg text-red-400 shrink-0">
                  <AlertCircle size={14} />
                </div>
                <div>
                  <p className="text-xs text-red-200 font-bold mb-0.5">Attention Needed</p>
                  <p className="text-[10px] text-red-400/70 leading-relaxed">You made {stats.incorrect} incorrect attempts. Focusing on these specific topics could significantly boost your score.</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex gap-3 items-start hover:bg-emerald-500/10 transition-colors">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <p className="text-xs text-emerald-200 font-bold mb-0.5">Perfect Precision</p>
                  <p className="text-[10px] text-emerald-400/70 leading-relaxed">Outstanding accuracy! You didn't make any errors. Challenge yourself with harder questions next time.</p>
                </div>
              </div>
            )}

            {avgTimePerQ > 120 ? (
              <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl flex gap-3 items-start hover:bg-orange-500/10 transition-colors">
                <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-400 shrink-0">
                  <Activity size={14} />
                </div>
                <div>
                  <p className="text-xs text-orange-200 font-bold mb-0.5">Speed Optimization</p>
                  <p className="text-[10px] text-orange-400/70 leading-relaxed">Your average time per question is {avgTimePerQ}s. Try to improve your reading speed and quick recall.</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3 items-start hover:bg-blue-500/10 transition-colors">
                <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
                  <Zap size={14} />
                </div>
                <div>
                  <p className="text-xs text-blue-200 font-bold mb-0.5">Great Pace</p>
                  <p className="text-[10px] text-blue-400/70 leading-relaxed">You are maintaining a good speed. This will give you ample time for revision in actual exams.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden shadow-lg min-h-[120px]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10" />
          <Quote size={24} className="text-white/5 absolute top-3 right-3" />
          <div className="relative z-10">
            <p className="text-sm text-slate-200 italic font-serif leading-relaxed mb-3">
              "{quote}"
            </p>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              <Target size={12} /> AI Motivation
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section - Compact */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-4 shadow-lg">
          <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <PieChartIcon size={14} className="text-blue-400" /> Performance Distribution
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-4 shadow-lg">
          <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <BarChart2 size={14} className="text-purple-400" /> Topic Analysis
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicData} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="score" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={12}>
                  {topicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score > 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSolutions = () => (
    <div className="space-y-3">
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-xs animate-pulse">Loading detailed solutions...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {questions.map((q, index) => {
            const question = q as any;
            const userAnswer = testAttempt.answers.find(
              (ans: any) => ans.questionId === question.id
            );

            let isCorrect = false;
            let selectedOption = undefined;

            if (userAnswer) {
              selectedOption = userAnswer.selectedOption;
              if (userAnswer.isCorrect !== undefined) {
                isCorrect = userAnswer.isCorrect;
              } else if (selectedOption !== undefined && selectedOption !== null) {
                const isCorrectOption = Array.isArray(question.correctAnswers)
                  ? question.correctAnswers.includes(selectedOption)
                  : question.correctAnswer === selectedOption;
                isCorrect = isCorrectOption;
              }
            }

            const isExpanded = expandedQuestion === index;
            const isSkipped = selectedOption === undefined || selectedOption === null;

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`bg-[#111] border rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-blue-500/30 ring-1 ring-blue-500/10 shadow-lg' : 'border-white/5 hover:border-white/10'
                  }`}
              >
                <div
                  onClick={() => toggleQuestion(index)}
                  className="p-3 flex items-start gap-3 cursor-pointer"
                >
                  <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    isSkipped ? 'bg-slate-500/10 border-slate-500/20 text-slate-400' :
                      'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {isCorrect ? <CheckCircle2 size={14} /> : isSkipped ? <AlertCircle size={14} /> : <XCircle size={14} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Q{index + 1}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-300 capitalize border border-white/5">{question.type}</span>
                        </div>
                        <h3 className={`text-xs font-medium leading-relaxed ${isExpanded ? 'text-white' : 'text-slate-300 line-clamp-2'}`}>
                          {question.question?.includes('$') ? <BlockMath>{question.question}</BlockMath> : question.question}
                        </h3>
                      </div>
                      <div className={`text-slate-400 shrink-0 pt-0.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={16} />
                      </div>
                    </div>

                    {!isExpanded && (
                      <div className="mt-2 flex items-center gap-2 text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wide ${isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : isSkipped
                            ? 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                          {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                        </span>
                        {question.type === 'numerical' && (
                          <span className="text-slate-500 ml-2">
                            Ans: {question.answer}
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
                      <div className="p-4 space-y-4">
                        {/* Image/Figure if present */}
                        {question.imageDescription && (
                          <div className="p-3 bg-[#151515] rounded-xl border border-white/10 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                              <ImageIcon size={20} />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] text-blue-400 font-bold uppercase mb-0.5">Visual Context</p>
                              <p className="text-xs text-slate-300 italic">{question.imageDescription}</p>
                            </div>
                          </div>
                        )}

                        {/* Options / Answer Display */}
                        <div className="space-y-3">
                          {question.type === 'numerical' || question.type === 'numerical-integer' || question.type === 'numerical-decimal' ? (
                            <div className="grid grid-cols-2 gap-3">
                              <div className={`p-3 rounded-xl border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
                                }`}>
                                <p className="text-[10px] text-slate-400 mb-0.5 uppercase font-bold tracking-wider">Your Answer</p>
                                <p className={`text-base font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {selectedOption ?? 'NA'}
                                </p>
                              </div>
                              <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/10">
                                <p className="text-[10px] text-blue-400 mb-0.5 uppercase font-bold tracking-wider">Correct Answer</p>
                                <p className="text-base font-bold text-blue-300">{question.answer}</p>
                              </div>
                            </div>
                          ) : question.type === 'matrix-matching' ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Column I</h4>
                                  {question.columnA?.map((item: any) => (
                                    <div key={item.id} className="p-2 bg-white/5 rounded-lg border border-white/10 text-xs">
                                      <span className="font-bold text-slate-300 mr-2">{item.id}.</span> {item.text}
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Column II</h4>
                                  {question.columnB?.map((item: any) => (
                                    <div key={item.id} className="p-2 bg-white/5 rounded-lg border border-white/10 text-xs">
                                      <span className="font-bold text-slate-300 mr-2">{item.id}.</span> {item.text}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <p className="text-[10px] text-blue-400 font-bold mb-2 uppercase tracking-wider">Correct Matches</p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(question.correctMatches || {}).map(([key, values]: [string, any]) => (
                                    <span key={key} className="px-2 py-1 bg-blue-500/20 rounded-lg text-blue-300 text-xs border border-blue-500/30 font-medium">
                                      {key} → {Array.isArray(values) ? values.join(', ') : values}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : question.type === 'paragraph-based' ? (
                            <div className="space-y-3">
                              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                                {question.paragraph}
                              </div>
                              <div className="space-y-2">
                                {question.questions?.map((subQ: any, idx: number) => {
                                  const subAns = selectedOption?.[subQ.id];
                                  const subCorrect = subAns === subQ.correctAnswer;
                                  return (
                                    <div key={subQ.id} className="p-3 rounded-xl border border-white/10 bg-[#0a0a0a]">
                                      <p className="text-xs font-medium text-white mb-2">{idx + 1}. {subQ.question}</p>
                                      <div className="flex justify-between text-[10px]">
                                        <span className={`font-bold ${subCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                          Your: {subQ.options?.[subAns] || 'Skipped'}
                                        </span>
                                        <span className="text-blue-400 font-bold">
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

                              let statusClass = "border-white/5 bg-[#151515] text-slate-300";
                              if (isUserSelection && isCorrectOption) statusClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";
                              else if (isUserSelection && !isCorrectOption) statusClass = "border-red-500/50 bg-red-500/10 text-red-300";
                              else if (isCorrectOption) statusClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";

                              return (
                                <div
                                  key={optIndex}
                                  className={`p-3 rounded-xl border flex items-center gap-3 text-xs transition-all duration-300 ${statusClass}`}
                                >
                                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${isUserSelection || isCorrectOption ? 'border-current' : 'border-slate-700'
                                    }`}>
                                    {String.fromCharCode(65 + optIndex)}
                                  </div>
                                  <span className="flex-1 leading-relaxed">
                                    {option.includes('$') ? <BlockMath>{option}</BlockMath> : option}
                                  </span>
                                  {isCorrectOption && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                                  {isUserSelection && !isCorrectOption && <XCircle size={16} className="text-red-400 shrink-0" />}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Explanation */}
                        {question.explanation && (
                          <div className="mt-3 p-4 bg-blue-900/10 border border-blue-900/20 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 mb-2 uppercase tracking-wider">
                              <BookOpen size={14} /> Explanation
                            </div>
                            <div className="text-xs text-slate-300 leading-relaxed">
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
    <div className="w-full max-w-none p-2 md:p-4 pb-24 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111] border border-white/10 rounded-2xl p-4 md:p-5 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
            <Trophy className="text-white w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight mb-1">Test Results</h1>
            <p className="text-slate-300 flex items-center gap-2 text-xs font-medium">
              <span className={`${getScoreColor(percentage)}`}>{getScoreLabel(percentage)}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-slate-400">Attempted on {new Date().toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto relative z-10">
          <button
            onClick={onRetry}
            className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            <RotateCw size={14} /> Retake
          </button>
          <button
            onClick={handleShare}
            className="flex-1 md:flex-none px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] text-white text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
            {copied ? 'Copied' : 'Share'}
          </button>
          <button
            onClick={onBack}
            className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#222] text-slate-300 rounded-xl border border-white/10 transition-all flex items-center justify-center"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[#111] border border-white/10 rounded-xl w-full md:w-fit overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Target },
          { id: 'solutions', label: 'Detailed Solutions', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <tab.icon size={14} /> {tab.label}
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