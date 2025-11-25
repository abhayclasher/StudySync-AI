import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, BookOpen, FileText, Zap, History, Sparkles, Plus, FolderOpen, ChevronDown } from 'lucide-react';
import { Tabs } from './ui/tabs';
import QuizArena from './QuizArena';
import QuizHistory from './QuizHistory';
import { DeckManager } from './DeckManager';
import { FlashcardDeck } from './FlashcardDeck';
import { StudyMode } from './StudyMode';
import NotesManager from './NotesManager';
import GeneratedContent from './GeneratedContent';
import { FlashcardDeck as FlashcardDeckType, Flashcard } from '../types';

interface PracticeHubProps {
    onQuizComplete: (score: number, total: number, topic?: string) => void;
    onFlashcardsCreated: () => void;
}

export const PracticeHub: React.FC<PracticeHubProps> = ({ onQuizComplete, onFlashcardsCreated }) => {
    const [activeTab, setActiveTab] = useState('practice');
    const [practiceView, setPracticeView] = useState<'arena' | 'history'>('arena');
    const [flashcardView, setFlashcardView] = useState<'generated' | 'decks'>('decks');
    const [notesView, setNotesView] = useState<'video' | 'custom'>('video');

    // Flashcard deck state
    const [selectedDeck, setSelectedDeck] = useState<FlashcardDeckType | null>(null);
    const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
    const [isStudying, setIsStudying] = useState(false);

    // Practice Tab Content
    const PracticeContent = () => (
        <div className="space-y-6">
            {/* Toggle between Arena and History */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPracticeView('arena')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap relative overflow-hidden ${practiceView === 'arena'
                            ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg shadow-blue-900/30'
                            : 'bg-white/5 text-gray-400 hover:bg-gradient-to-r hover:from-blue-700/20 hover:to-blue-800/20 hover:text-white border-white/10 hover:border-white/20'
                        }`}
                >
                    <Zap size={18} />
                    <span>Quiz Arena</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPracticeView('history')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap relative overflow-hidden ${practiceView === 'history'
                            ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg shadow-blue-900/30'
                            : 'bg-white/5 text-gray-400 hover:bg-gradient-to-r hover:from-blue-700/20 hover:to-blue-800/20 hover:text-white border-white/10 hover:border-white/20'
                        }`}
                >
                    <History size={18} />
                    <span>History</span>
                </motion.button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {practiceView === 'arena' ? (
                    <motion.div
                        key="arena"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <QuizArena
                            onQuizComplete={onQuizComplete}
                            onFlashcardsCreated={onFlashcardsCreated}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <QuizHistory
                            onRetry={() => setPracticeView('arena')}
                            onBack={() => { }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    // Flashcards Tab Content
    const FlashcardsContent = () => (
        <div className="space-y-6">
            {/* Toggle between Generated and My Decks */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFlashcardView('generated')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap relative overflow-hidden ${flashcardView === 'generated'
                            ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg shadow-blue-900/30'
                            : 'bg-white/5 text-gray-40 hover:bg-gradient-to-r hover:from-blue-700/20 hover:to-blue-800/20 hover:text-white border border-white/10 hover:border-white/20'
                        }`}
                >
                    <Sparkles size={18} />
                    <span>Generated</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFlashcardView('decks')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap relative overflow-hidden ${flashcardView === 'decks'
                            ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg shadow-blue-900/30'
                            : 'bg-white/5 text-gray-400 hover:bg-gradient-to-r hover:from-blue-700/20 hover:to-blue-800/20 hover:text-white border border-white/10 hover:border-white/20'
                        }`}
                >
                    <FolderOpen size={18} />
                    <span>My Decks</span>
                </motion.button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {flashcardView === 'generated' ? (
                    <motion.div
                        key="generated"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <GeneratedContent />
                    </motion.div>
                ) : selectedDeck ? (
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
                    <motion.div
                        key="decks"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <DeckManager onSelectDeck={async (deckId) => {
                            const { supabase } = await import('../lib/supabase');
                            if (supabase) {
                                const { data: deck } = await supabase
                                    .from('flashcard_decks')
                                    .select('*')
                                    .eq('id', deckId)
                                    .single();
                                if (deck) setSelectedDeck(deck);
                            }
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    // Notes Tab Content
    const NotesContent = () => (
        <div className="space-y-6">
            {/* Toggle between Video Notes and My Notes */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setNotesView('video')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap relative overflow-hidden ${notesView === 'video'
                            ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg shadow-blue-900/30'
                            : 'bg-white/5 text-gray-400 hover:bg-gradient-to-r hover:from-blue-700/20 hover:to-blue-800/20 hover:text-white border border-white/10 hover:border-white/20'
                        }`}
                >
                    <FileText size={18} />
                    <span>Video Notes</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setNotesView('custom')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap relative overflow-hidden ${notesView === 'custom'
                            ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg shadow-blue-900/30'
                            : 'bg-white/5 text-gray-400 hover:bg-gradient-to-r hover:from-blue-700/20 hover:to-blue-800/20 hover:text-white border border-white/10 hover:border-white/20'
                        }`}
                >
                    <Plus size={18} />
                    <span>My Notes</span>
                </motion.button>
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

    const tabs = [
        {
            title: 'Practice',
            value: 'practice',
            icon: <Brain className="w-4 h-4" />,
            content: <PracticeContent />
        },
        {
            title: 'Flashcards',
            value: 'flashcards',
            icon: <BookOpen className="w-4 h-4" />,
            content: <FlashcardsContent />
        },
        {
            title: 'Notes',
            value: 'notes',
            icon: <FileText className="w-4 h-4" />,
            content: <NotesContent />
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#020202] to-[#0a0a0a] p-4 md:p-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 md:mb-8"
            >
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
                    Practice Hub
                </h1>
                <p className="text-gray-400 text-sm md:text-base">
                    Master your knowledge through quizzes, flashcards, and notes
                </p>
            </motion.div>

            {/* Mobile: Horizontal Scroll Tabs */}
            <div className="md:hidden mb-6 -mx-4 px-4 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 min-w-max pb-2">
                    {tabs.map((tab) => (
                        <motion.button
                            key={tab.value}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveTab(tab.value)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap relative overflow-hidden ${activeTab === tab.value
                                    ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg shadow-blue-900/30'
                                    : 'bg-white/5 text-gray-400 hover:bg-gradient-to-r hover:from-blue-700/20 hover:to-blue-800/20 hover:text-white border border-white/10 hover:border-white/20'
                                }`}
                        >
                            {tab.icon}
                            <span>{tab.title}</span>
                        </motion.button>
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
            
            {/* Add subtle background elements for visual enhancement */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
};

export default PracticeHub;
