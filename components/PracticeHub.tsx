import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, BookOpen, FileText, Zap, History, Sparkles, Plus, FolderOpen, ChevronDown, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tabs } from './ui/tabs';
import QuizArena from './QuizArena';
import QuizHistory from './QuizHistory';
import { DeckManager } from './DeckManager';
import { FlashcardDeck } from './FlashcardDeck';
import { StudyMode } from './StudyMode';
import NotesManager from './NotesManager';
import GeneratedContent from './GeneratedContent';
import TestSeriesGenerator from './TestSeriesGenerator';
import TestSeriesArena from './TestSeriesArena';
import TestSeriesResult from './TestSeriesResult';
import { FlashcardDeck as FlashcardDeckType, Flashcard, QuizQuestion, TestAttempt } from '../types';

interface PracticeHubProps {
    onQuizComplete: (score: number, total: number, topic?: string) => void;
    onFlashcardsCreated: () => void;
}

export const PracticeHub: React.FC<PracticeHubProps> = ({ onQuizComplete, onFlashcardsCreated }) => {
    const [activeTab, setActiveTab] = useState('practice');
    const [practiceView, setPracticeView] = useState<'arena' | 'flashcards' | 'deepdive' | 'history' | 'testseries'>('arena');
    const [flashcardView, setFlashcardView] = useState<'generated' | 'decks'>('decks');
    const [notesView, setNotesView] = useState<'video' | 'custom'>('video');

    // Flashcard deck state
    const [selectedDeck, setSelectedDeck] = useState<FlashcardDeckType | null>(null);
    const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
    const [isStudying, setIsStudying] = useState(false);

    // Test Series state
    const [testSeriesId, setTestSeriesId] = useState<string | null>(null);
    const [testQuestions, setTestQuestions] = useState<QuizQuestion[]>([]);
    const [testTopic, setTestTopic] = useState('');
    const [testDifficulty, setTestDifficulty] = useState('medium');
    const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);

    // Flashcards Tab Content - My Decks Only
    const FlashcardsContent = () => (
        <div className="space-y-6">
            {selectedDeck ? (
                isStudying ? (
                    <StudyMode
                        cards={studyCards}
                        onClose={() => {
                            setIsStudying(false);
                            setStudyCards([]);
                        }}
                    />
                ) : (
                    <FlashcardDeck
                        deck={selectedDeck}
                        onBack={() => setSelectedDeck(null)}
                        onStartStudy={(cards) => {
                            setStudyCards(cards);
                            setIsStudying(true);
                        }}
                    />
                )
            ) : (
                <DeckManager onSelectDeck={async (deckId) => {
                    if (supabase) {
                        const { data: deck } = await supabase
                            .from('flashcard_decks')
                            .select('*')
                            .eq('id', deckId)
                            .single();
                        if (deck) setSelectedDeck(deck);
                    }
                }} />
            )}
        </div>
    );

    // Notes Tab Content
    const NotesContent = () => (
        <div className="space-y-6">
            {/* Toggle between Video Notes and My Notes */}
            <div className="flex gap-2 md:gap-4 overflow-x-auto scrollbar-hide pb-2">
                <button
                    onClick={() => setNotesView('video')}
                    className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3 rounded-2xl md:rounded-3xl font-semibold md:font-bold text-sm md:text-base transition-all duration-300 whitespace-nowrap hover:scale-105 ${notesView === 'video'
                            ? 'bg-blue-600 text-white shadow-lg md:shadow-2xl shadow-blue-500/30 border border-blue-500/20'
                            : 'bg-gradient-to-r from-[#111] to-[#0f0f0f] text-neutral-400 hover:bg-white/10 hover:text-white border border-white/10'
                        }`}
                >
                    <FileText size={18} className="md:w-5 md:h-5" />
                    <span>Video Notes</span>
                </button>
                <button
                    onClick={() => setNotesView('custom')}
                    className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3 rounded-2xl md:rounded-3xl font-semibold md:font-bold text-sm md:text-base transition-all duration-300 whitespace-nowrap hover:scale-105 ${notesView === 'custom'
                            ? 'bg-blue-600 text-white shadow-lg md:shadow-2xl shadow-blue-500/30 border border-blue-500/20'
                            : 'bg-gradient-to-r from-[#111] to-[#0f0f0f] text-neutral-400 hover:bg-white/10 hover:text-white border border-white/10'
                        }`}
                >
                    <Plus size={18} className="md:w-5 md:h-5" />
                    <span>My Notes</span>
                </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {notesView === 'video' ? (
                    <motion.div
                        key="video"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <NotesManager type="video" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="custom"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <NotesManager type="custom" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    // Practice Tab Content
    const PracticeContent = () => (
        <div className="space-y-6">
            {/* Toggle between Arena, Test Series, and History */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                <button
                    onClick={() => setPracticeView('arena')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all duration-300 whitespace-nowrap ${practiceView === 'arena'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-500/20'
                            : 'bg-[#111] text-neutral-400 border border-white/5'
                        }`}
                >
                    <Zap size={14} />
                    <span>Quiz Arena</span>
                </button>
                <button
                    onClick={() => setPracticeView('testseries')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all duration-300 whitespace-nowrap ${practiceView === 'testseries'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-500/20'
                            : 'bg-[#111] text-neutral-400 border border-white/5'
                        }`}
                >
                    <Target size={14} />
                    <span>AI Test Series</span>
                </button>
                <button
                    onClick={() => setPracticeView('history')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all duration-300 whitespace-nowrap ${practiceView === 'history'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-500/20'
                            : 'bg-[#111] text-neutral-400 border border-white/5'
                        }`}
                >
                    <History size={14} />
                    <span>History</span>
                </button>
            </div>

            {/* Content */}
            {practiceView === 'arena' && (
                <QuizArena
                    onQuizComplete={onQuizComplete}
                    onFlashcardsCreated={onFlashcardsCreated}
                />
            )}
            {practiceView === 'testseries' && (
                testSeriesId && testQuestions.length > 0 && !testAttempt ? (
                    <TestSeriesArena
                        testId={testSeriesId}
                        questions={testQuestions}
                        topic={testTopic}
                        difficulty={testDifficulty}
                        onComplete={(result) => {
                            // Store the test attempt result to show the results
                            setTestAttempt(result);
                        }}
                        onBack={() => {
                            setTestSeriesId(null);
                            setTestQuestions([]);
                            setTestTopic('');
                            setTestDifficulty('medium');
                        }}
                    />
                ) : testAttempt ? (
                    // Show test results when available
                    <TestSeriesResult
                        testAttempt={testAttempt}
                        questions={testQuestions}
                        onRetry={() => {
                            // Reset the test attempt to go back to the generator
                            setTestAttempt(null);
                            // Reset other states if needed
                            setTestSeriesId(null);
                            setTestQuestions([]);
                        }}
                        onBack={() => {
                            // Reset everything to go back to the main practice view
                            setTestAttempt(null);
                            setTestSeriesId(null);
                            setTestQuestions([]);
                            setTestTopic('');
                            setTestDifficulty('medium');
                            setPracticeView('arena'); // Go back to quiz arena
                        }}
                    />
                ) : (
                    <TestSeriesGenerator
                        onTestGenerated={(id, questions) => {
                            setTestSeriesId(id);
                            setTestQuestions(questions);
                            // Extract topic and difficulty from the first question or use defaults
                            setTestTopic(questions[0]?.subtopic || 'Test Series');
                            setTestDifficulty(questions[0]?.difficulty || 'medium');
                        }}
                    />
                )
            )}
            {practiceView === 'flashcards' && (
                <FlashcardsContent />
            )}
            {practiceView === 'deepdive' && (
                <NotesManager type="video" />
            )}
            {practiceView === 'history' && (
                <QuizHistory
                    onRetry={() => setPracticeView('arena')}
                    onBack={() => { }}
                />
            )}
        </div>
    );

    const tabs = [
        {
            title: 'Practice',
            value: 'practice',
            icon: <Brain className="w-4 h-4" />,
            content: <PracticeContent />
        },
        {
            title: 'Notes',
            value: 'notes',
            icon: <FileText className="w-4 h-4" />,
            content: <NotesContent />
        },
        {
            title: 'Flashcards',
            value: 'flashcards',
            icon: <BookOpen className="w-4 h-4" />,
            content: <FlashcardsContent />
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0f0f0f] p-6 md:p-8">

            {/* Mobile: Horizontal Scroll Tabs */}
            <div className="md:hidden mb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 min-w-max pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-xs transition-all duration-300 whitespace-nowrap ${activeTab === tab.value
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-500/20'
                                    : 'bg-[#111] text-neutral-400 border border-white/5'
                                }`}
                        >
                            {React.cloneElement(tab.icon as React.ReactElement, { size: 14 })}
                            <span>{tab.title}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Desktop: Tabs Component */}
            <div className="hidden md:block">
                <Tabs
                    tabs={tabs}
                    containerClassName="mb-6"
                    tabClassName="text-sm font-medium"
                    contentClassName="mt-6"
                />
            </div>

            {/* Mobile: Content */}
            <div className="md:hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="w-full"
                    >
                        {tabs.find(t => t.value === activeTab)?.content}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PracticeHub;
