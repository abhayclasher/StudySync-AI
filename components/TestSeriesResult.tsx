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
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 md:space-y-6">
              <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-blue-700/20 ring-2 ring-blue-500/20 ring-offset-2 ring-offset-[#0a0a0a] mx-auto shadow-2xl shadow-blue-500/10"
              >
                  <Trophy className="text-blue-400 w-6 h-6 md:w-10 md:h-10" size={24} />
              </motion.div>

              <div>
                  <h1 className="text-xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent mb-2 md:mb-3">
                      Test Series Completed!
                  </h1>
                  <p className="text-neutral-400 text-sm md:text-xl">
                      Here are your results
                  </p>
              </div>
          </div>

          {/* Score Summary */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-[#111] via-[#0f0f0f] to-[#111] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl shadow-black/40"
          >
              <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-8">
                  <div className="text-center group">
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl md:rounded-2xl p-4 md:p-6 border border-blue-500/20 mb-3 md:mb-4 group-hover:scale-105 transition-transform duration-300 min-h-[100px] md:min-h-[140px] flex flex-col justify-center">
                          <div className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2 tabular-nums">
                              {testAttempt.score}/{testAttempt.total_questions}
                          </div>
                          <div className="text-blue-300 text-xs md:text-sm font-medium">Questions Correct</div>
                      </div>
                  </div>

                  <div className="text-center group">
                      <div className={`rounded-xl md:rounded-2xl p-4 md:p-6 border mb-3 md:mb-4 group-hover:scale-105 transition-transform duration-300 min-h-[100px] md:min-h-[140px] flex flex-col justify-center ${
                          percentage >= 80 ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20' :
                          percentage >= 60 ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20' :
                          'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20'
                      }`}>
                          <div className={`text-2xl md:text-4xl font-bold mb-1 md:mb-2 ${getScoreColor(percentage)} tabular-nums`}>
                              {percentage}%
                          </div>
                          <div className="text-neutral-300 text-xs md:text-sm font-medium">{getScoreLabel(percentage)}</div>
                      </div>
                  </div>

                  <div className="text-center group">
                      <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl md:rounded-2xl p-4 md:p-6 border border-purple-500/20 mb-3 md:mb-4 group-hover:scale-105 transition-transform duration-300 min-h-[100px] md:min-h-[140px] flex flex-col justify-center">
                          <div className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2 tabular-nums">
                              {Math.floor((testAttempt.time_taken || 0) / 60)}m {(testAttempt.time_taken || 0) % 60}s
                          </div>
                          <div className="text-purple-300 text-xs md:text-sm font-medium">Time Taken</div>
                      </div>
                  </div>
              </div>
          </motion.div>

      {/* Action Buttons */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-2"
      >
          <button
              onClick={onRetry}
              className="px-6 py-3 md:px-8 md:py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm md:text-base rounded-xl md:rounded-2xl hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 hover:scale-105 shadow-lg shadow-blue-500/30"
          >
              <RotateCw size={18} className="md:w-5 md:h-5" />
              <span className="text-sm md:text-base">Retake Test</span>
          </button>
          <button
              onClick={onBack}
              className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-[#111] to-[#0f0f0f] text-white font-bold text-sm md:text-base rounded-xl md:rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 hover:scale-105 shadow-lg shadow-black/20"
          >
              <ChevronLeft size={18} className="md:w-5 md:h-5" />
              <span className="text-sm md:text-base">Back to Practice</span>
          </button>
      </motion.div>

      {/* Question Review */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 md:space-y-6"
      >
          <div className="flex items-center gap-2 md:gap-3">
              <div className="w-1 h-6 md:h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
              <h2 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
                  <BookOpen size={18} className="md:w-6 md:h-6 text-blue-400" />
                  <span className="text-base md:text-lg">Question Review</span>
              </h2>
          </div>
        
        {loading ? (
            <div className="flex justify-center items-center h-32">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        ) : (
            <div className="space-y-4 md:space-y-6">
                {questions.map((question, index) => {
                    const userAnswer = testAttempt.answers.find(
                        (ans: any) => ans.questionId === question.id
                    );
                    const isCorrect = userAnswer?.isCorrect;
                    const selectedOption = userAnswer?.selectedOption;

                    return (
                        <motion.div
                            key={question.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`border rounded-xl md:rounded-2xl p-3 md:p-6 transition-all duration-300 hover:scale-[1.02] shadow-lg ${
                                isCorrect
                                  ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-emerald-600/5 shadow-emerald-500/10'
                                  : 'border-red-500/30 bg-gradient-to-r from-red-500/5 to-red-600/5 shadow-red-500/10'
                            }`}
                        >
                            <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                                <div className={`p-1.5 md:p-2 rounded-xl md:rounded-2xl ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'} shadow-lg`}>
                                    {isCorrect ? <CheckCircle2 size={16} className="md:w-5 md:h-5" /> : <XCircle size={16} className="md:w-5 md:h-5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 md:mb-3">
                                        <h3 className="font-semibold text-white text-sm md:text-lg leading-relaxed">
                                            Q{index + 1}: {question.question}
                                        </h3>
                                        <button
                                            onClick={() => toggleExplanation(index)}
                                            className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg md:rounded-xl transition-all duration-300 hover:scale-105 border border-blue-500/20 self-start"
                                        >
                                            {showExplanation === index ? 'Hide' : 'Show'} Explanation
                                        </button>
                                    </div>
                      
                       <div className="mt-3 md:mt-4 space-y-2 md:space-y-3">
                         {question.options.map((option, optIndex) => {
                           const isUserSelection = selectedOption === optIndex;
                           const isCorrectOption = question.correctAnswer === optIndex;

                           return (
                             <div
                               key={optIndex}
                               className={`p-3 md:p-4 rounded-lg md:rounded-xl border text-sm md:text-base transition-all duration-300 ${
                                 isUserSelection
                                   ? isCorrect
                                     ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/20'
                                     : 'border-red-400/60 bg-red-500/10 text-red-300 shadow-lg shadow-red-500/20'
                                   : isCorrectOption
                                   ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/20'
                                   : 'border-white/10 bg-gradient-to-r from-[#111] to-[#0f0f0f] text-neutral-300 hover:border-white/20'
                               }`}
                             >
                               <div className="flex items-start gap-2 md:gap-4">
                                 <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-300 ${
                                   isUserSelection
                                     ? isCorrect
                                       ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                       : 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30'
                                     : isCorrectOption
                                     ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                     : 'border-neutral-600 text-neutral-400'
                                 }`}>
                                   {String.fromCharCode(65 + optIndex)}
                                 </div>
                                 <span className="flex-1 leading-relaxed">{option}</span>
                                 <div className="flex flex-col gap-1">
                                   {isCorrectOption && (
                                     <span className="text-xs font-medium bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/30 whitespace-nowrap">
                                       Correct
                                     </span>
                                   )}
                                   {isUserSelection && !isCorrect && !isCorrectOption && (
                                     <span className="text-xs font-medium bg-red-500/20 text-red-300 px-2 py-1 rounded-full border border-red-500/30 whitespace-nowrap">
                                       Your Answer
                                     </span>
                                   )}
                                 </div>
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
                             transition={{ duration: 0.3 }}
                             className="mt-4 p-5 bg-gradient-to-r from-[#111] to-[#0f0f0f] border border-white/10 rounded-2xl text-base text-neutral-300 shadow-lg"
                           >
                             <div className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                               <div className="w-1 h-4 bg-blue-400 rounded-full"></div>
                               Explanation
                             </div>
                             <div className="leading-relaxed">{question.explanation}</div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                     </div>
                   </div>
               </motion.div>
             );
           })}
         </div>
       )}
     </motion.div>
   </div>
 );
};

export default TestSeriesResult;