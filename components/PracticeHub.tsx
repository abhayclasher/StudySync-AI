import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Target, History } from 'lucide-react';
import { SmartNotesLayout } from './notes/SmartNotesLayout';
import TestSeriesGenerator from './TestSeriesGenerator';
import TestSeriesArena from './TestSeriesArena';
import TestSeriesResult from './TestSeriesResult';
import PracticeHistory from './PracticeHistory';
import { QuizQuestion, TestAttempt } from '../types';

interface PracticeHubProps {
  user: any;
  onBack: () => void;
  onStartVideo?: (videoId: string, videoTitle: string) => void;
}

const PracticeHub: React.FC<PracticeHubProps> = ({ user, onBack, onStartVideo }) => {
  const [activeTab, setActiveTab] = useState<'testseries' | 'notes' | 'history'>('testseries');

  // Test Series State
  const [testSeriesId, setTestSeriesId] = useState<string | null>(null);
  const [testQuestions, setTestQuestions] = useState<QuizQuestion[]>([]);
  const [testTopic, setTestTopic] = useState('');
  const [testDifficulty, setTestDifficulty] = useState('medium');
  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);

  const tabs = [
    { id: 'testseries', label: 'Test Series', icon: Target },
    { id: 'notes', label: 'Smart Notes', icon: FileText },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white p-2 md:p-4 pb-20 md:pb-4 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-blue-900/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full space-y-4 relative z-10">

        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
              Practice Hub
            </h1>
            <p className="text-slate-400 text-xs md:text-sm font-medium tracking-wide uppercase">
              Master your subjects
            </p>
          </div>

          <div className="flex bg-[#050505] p-1 rounded-xl border border-white/5 shadow-lg backdrop-blur-xl overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-slate-300'
                  }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[#111] border border-white/10 rounded-lg shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <tab.icon size={14} className={activeTab === tab.id ? 'text-blue-400' : ''} />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-[#050505] border border-white/5 rounded-3xl min-h-[500px] p-1 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

          <div className="h-full w-full bg-black/40 backdrop-blur-sm rounded-[1.4rem] p-3 md:p-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === 'testseries' && (
                  <div className="h-full">
                    {testSeriesId && testQuestions.length > 0 && !testAttempt ? (
                      <TestSeriesArena
                        testId={testSeriesId}
                        questions={testQuestions}
                        topic={testTopic}
                        difficulty={testDifficulty}
                        onComplete={(result) => setTestAttempt(result)}
                        onBack={() => {
                          setTestSeriesId(null);
                          setTestQuestions([]);
                        }}
                        onExit={() => {
                          setTestSeriesId(null);
                          setTestQuestions([]);
                        }}
                      />
                    ) : testAttempt ? (
                      <TestSeriesResult
                        testAttempt={testAttempt}
                        questions={testQuestions}
                        onRetry={() => {
                          setTestAttempt(null);
                          setTestSeriesId(null);
                          setTestQuestions([]);
                        }}
                        onBack={() => {
                          setTestAttempt(null);
                          setTestSeriesId(null);
                          setTestQuestions([]);
                        }}
                      />
                    ) : (
                      <TestSeriesGenerator
                        onTestGenerated={(id, questions) => {
                          setTestSeriesId(id);
                          setTestQuestions(questions);
                          setTestTopic(questions[0]?.subtopic || 'Test Series');
                          setTestDifficulty(questions[0]?.difficulty || 'medium');
                        }}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <SmartNotesLayout onStartVideo={onStartVideo} />
                )}

                {activeTab === 'history' && (
                  <PracticeHistory
                    onRetry={(item) => {
                      setActiveTab('testseries');
                    }}
                    onViewAnalysis={(item) => {
                      // Construct TestAttempt from history item
                      const attempt: TestAttempt = {
                        id: item.id,
                        user_id: user.id,
                        test_series_id: item.test_series_id || '', // Ensure this is available
                        score: item.score,
                        total_questions: item.total_questions,
                        time_taken: item.time_taken || 0,
                        answers: item.answers || [], // Ensure answers are available in history item
                        completed_at: item.completed_at,
                        created_at: item.completed_at,
                        topic: item.topic,
                        difficulty: item.difficulty as any
                      };
                      setTestAttempt(attempt);
                      setTestQuestions([]); // Let TestSeriesResult fetch questions if needed
                      setActiveTab('testseries');
                    }}
                    onBack={() => setActiveTab('testseries')}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeHub;
