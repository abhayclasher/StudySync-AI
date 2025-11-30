import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  RotateCw,
  ChevronLeft,
  Clock,
  Target,
  Trophy,
  BookOpen,
  Share2,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
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
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!propsQuestions) {
        try {
          const testSeries = await getTestSeriesById(testAttempt.test_series_id);
          if (testSeries) {
            setQuestions(testSeries.questions);
          }
        } catch (error) {
          console.error('Error fetching test series questions:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (!propsQuestions) {
      fetchQuestions();
    }
  }, [testAttempt.test_series_id, propsQuestions]);

  const percentage = Math.round((testAttempt.score / testAttempt.total_questions) * 100);
  const timeTaken = testAttempt.time_taken || 0;
  const avgTimePerQ = Math.round(timeTaken / testAttempt.total_questions);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLabel = (percentage: number) => {
    if (percentage >= 80) return 'Excellent!';
    if (percentage >= 60) return 'Good Job!';
    return 'Keep Practicing!';
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const handleShare = () => {
    const text = `I just scored ${testAttempt.score}/${testAttempt.total_questions} (${percentage}%) in the AI Test Series! 🚀\nTime taken: ${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s\nCan you beat my score? #StudySyncAI`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 pb-24 space-y-6">
      {/* Compact Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Trophy className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Test Results</h1>
            <p className="text-slate-400 text-sm">Great effort! Here is your summary.</p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={onRetry}
            className="flex-1 md:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            <RotateCw size={16} /> Retake
          </button>
          <button
            onClick={handleShare}
            className="flex-1 md:flex-none px-5 py-2.5 bg-[#111] hover:bg-[#151515] text-white text-sm font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            {copied ? 'Copied' : 'Share'}
          </button>
          <button
            onClick={onBack}
            className="px-3 py-2.5 bg-[#111] hover:bg-[#151515] text-slate-300 rounded-xl border border-white/10 transition-all flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Score</span>
          <div className={`text-2xl md:text-3xl font-bold ${getScoreColor(percentage)}`}>{percentage}%</div>
          <div className="text-slate-400 text-xs">{testAttempt.score}/{testAttempt.total_questions} Correct</div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Time</span>
          <div className="text-2xl md:text-3xl font-bold text-blue-400">
            {Math.floor(timeTaken / 60)}<span className="text-sm text-slate-500">m</span> {timeTaken % 60}<span className="text-sm text-slate-500">s</span>
          </div>
          <div className="text-slate-400 text-xs">Total Duration</div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Speed</span>
          <div className="text-2xl md:text-3xl font-bold text-purple-400">{avgTimePerQ}<span className="text-sm text-slate-500">s</span></div>
          <div className="text-slate-400 text-xs">Avg per Question</div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Accuracy</span>
          <div className="text-2xl md:text-3xl font-bold text-white">{getScoreLabel(percentage)}</div>
          <div className="text-slate-400 text-xs">Performance</div>
        </div>
      </div>

      {/* Question Review List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <BookOpen size={18} className="text-blue-400" />
          <h2 className="text-lg font-bold text-white">Detailed Review</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid gap-3">
            {questions.map((question, index) => {
              const userAnswer = testAttempt.answers.find(
                (ans: any) => ans.questionId === question.id
              );
              const isCorrect = userAnswer?.isCorrect;
              const selectedOption = userAnswer?.selectedOption;
              const isExpanded = expandedQuestion === index;

              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`bg-[#0a0a0a] border rounded-2xl overflow-hidden transition-all ${isExpanded ? 'border-blue-500/30 ring-1 ring-blue-500/10' : 'border-white/5 hover:border-white/10'
                    }`}
                >
                  <div
                    onClick={() => toggleQuestion(index)}
                    className="p-4 flex items-start gap-3 cursor-pointer"
                  >
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                      {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4">
                        <h3 className={`text-sm font-medium leading-relaxed ${isExpanded ? 'text-white' : 'text-slate-300 line-clamp-2'}`}>
                          <span className="text-slate-500 mr-2">Q{index + 1}.</span>
                          {question.question}
                        </h3>
                        <div className="text-slate-500 shrink-0">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>

                      {!isExpanded && (
                        <div className="mt-2 flex items-center gap-3 text-xs">
                          <span className={`px-2 py-0.5 rounded-md border ${isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                          <span className="text-slate-500 truncate">
                            Ans: {question.options[question.correctAnswer]}
                          </span>
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
                        className="border-t border-white/5 bg-[#0f0f0f]"
                      >
                        <div className="p-4 space-y-3">
                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => {
                              const isUserSelection = selectedOption === optIndex;
                              const isCorrectOption = question.correctAnswer === optIndex;

                              let statusClass = "border-white/5 bg-[#111] text-slate-400";
                              if (isUserSelection && isCorrect) statusClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";
                              else if (isUserSelection && !isCorrect) statusClass = "border-red-500/50 bg-red-500/10 text-red-300";
                              else if (isCorrectOption) statusClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";

                              return (
                                <div
                                  key={optIndex}
                                  className={`p-3 rounded-xl border flex items-center gap-3 text-sm ${statusClass}`}
                                >
                                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${isUserSelection || isCorrectOption ? 'border-current' : 'border-slate-700'
                                    }`}>
                                    {String.fromCharCode(65 + optIndex)}
                                  </div>
                                  <span className="flex-1">{option}</span>
                                  {isCorrectOption && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                                  {isUserSelection && !isCorrect && <XCircle size={16} className="text-red-400 shrink-0" />}
                                </div>
                              );
                            })}
                          </div>

                          {question.explanation && (
                            <div className="mt-4 p-4 bg-blue-900/10 border border-blue-900/20 rounded-xl">
                              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">
                                <BookOpen size={12} /> Explanation
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed">
                                {question.explanation}
                              </p>
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
    </div>
  );
};

export default TestSeriesResult;