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
  BookOpen
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
  const [showExplanation, setShowExplanation] = useState<number | null>(null);
  
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

  const toggleExplanation = (index: number) => {
    setShowExplanation(showExplanation === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 ring-1 ring-white/10 mx-auto mb-4"
        >
          <Trophy className="text-blue-400" size={32} />
        </motion.div>
        
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Test Series Completed!
          </h1>
          <p className="text-neutral-400 mt-2">
            Here are your results
          </p>
        </div>
      </div>

      {/* Score Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {testAttempt.score}/{testAttempt.total_questions}
            </div>
            <div className="text-neutral-400 text-sm">Questions Correct</div>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold mb-1 ${getScoreColor(percentage)}`}>
              {percentage}%
            </div>
            <div className="text-neutral-400 text-sm">{getScoreLabel(percentage)}</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {Math.floor((testAttempt.time_taken || 0) / 60)}m {(testAttempt.time_taken || 0) % 60}s
            </div>
            <div className="text-neutral-400 text-sm">Time Taken</div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
        >
          <RotateCw size={18} />
          Retake Test
        </button>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-[#111] text-white font-bold rounded-xl border border-white/10 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
        >
          <ChevronLeft size={18} />
          Back to Practice
        </button>
      </motion.div>

      {/* Question Review */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen size={20} />
          Question Review
        </h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = testAttempt.answers.find(
                (ans: any) => ans.questionId === question.id
              );
              const isCorrect = userAnswer?.isCorrect;
              const selectedOption = userAnswer?.selectedOption;
              
              return (
                <div 
                  key={question.id}
                  className={`border rounded-xl p-4 transition-all ${
                    isCorrect 
                      ? 'border-emerald-500/30 bg-emerald-500/5' 
                      : 'border-red-50/30 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-1 rounded-full ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white">
                          Q{index + 1}: {question.question}
                        </h3>
                        <button
                          onClick={() => toggleExplanation(index)}
                          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {showExplanation === index ? 'Hide' : 'Show'} Explanation
                        </button>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        {question.options.map((option, optIndex) => {
                          const isUserSelection = selectedOption === optIndex;
                          const isCorrectOption = question.correctAnswer === optIndex;
                          
                          return (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-lg border text-sm ${
                                isUserSelection
                                  ? isCorrect
                                    ? 'border-emerald-50/50 bg-emerald-50/10 text-emerald-400'
                                    : 'border-red-500/50 bg-red-500/10 text-red-400'
                                  : isCorrectOption
                                  ? 'border-emerald-500/50 bg-emerald-50/10 text-emerald-400'
                                  : 'border-white/10 bg-[#111] text-neutral-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                                  isUserSelection
                                    ? isCorrect
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'bg-red-500 border-red-500 text-white'
                                    : isCorrectOption
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-neutral-600 text-neutral-500'
                                }`}>
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                                <span>{option}</span>
                                {isCorrectOption && (
                                  <span className="text-xs font-medium bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full ml-auto">
                                    Correct
                                  </span>
                                )}
                                {isUserSelection && !isCorrect && !isCorrectOption && (
                                  <span className="text-xs font-medium bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full ml-auto">
                                    Your Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <AnimatePresence>
                        {showExplanation === index && question.explanation && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 p-3 bg-[#111] border border-white/10 rounded-lg text-sm text-neutral-300"
                          >
                            <div className="font-medium text-neutral-400 mb-1">Explanation:</div>
                            <div>{question.explanation}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
 );
};

export default TestSeriesResult;