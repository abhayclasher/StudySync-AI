import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Play, BookOpen, Search, FolderOpen } from 'lucide-react';
import { getDecks, createDeck, FlashcardDeck } from '../services/db';
import EmptyState from './common/EmptyState';
import { SkeletonList } from './common/Skeleton';

interface DeckManagerProps {
    onSelectDeck: (deckId: string) => void;
}

export const DeckManager: React.FC<DeckManagerProps> = ({ onSelectDeck }) => {
    const [decks, setDecks] = useState<FlashcardDeck[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newDeckTitle, setNewDeckTitle] = useState('');
    const [newDeckDescription, setNewDeckDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadDecks();
    }, []);

    const loadDecks = async () => {
        setLoading(true);
        const userDecks = await getDecks();
        setDecks(userDecks);
        setLoading(false);
    };

    const handleCreateDeck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeckTitle.trim()) return;

        setIsCreating(true);
        const newDeck = await createDeck(newDeckTitle, newDeckDescription);
        if (newDeck) {
            setDecks([newDeck, ...decks]);
            setShowCreateModal(false);
            setNewDeckTitle('');
            setNewDeckDescription('');
        }
        setIsCreating(false);
    };

    const filteredDecks = decks.filter(deck =>
        deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400">
                        Flashcard Decks
                    </h1>
                    <p className="text-gray-400 mt-2">Master concepts with spaced repetition</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl text-white font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                >
                    <Plus size={20} />
                    Create Deck
                </motion.button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                    type="text"
                    placeholder="Search decks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-500 outline-none transition-all"
                />
            </div>

            {/* Deck Grid */}
            {loading ? (
                <SkeletonList items={3} />
            ) : filteredDecks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredDecks.map((deck) => (
                            <motion.div
                                key={deck.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                whileHover={{ y: -5, scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="group relative bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-blue-500/40 transition-all hover:shadow-2xl hover:shadow-blue-500/20 overflow-hidden"
                            >
                                {/* Background Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                {/* Animated Border Glow */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <motion.div
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl text-blue-400 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all shadow-lg shadow-blue-500/10"
                                        >
                                            <BookOpen size={24} />
                                        </motion.div>
                                        <div className="text-gray-400 text-sm font-semibold bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                            {deck.card_count || 0} cards
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-300 transition-colors">{deck.title}</h3>
                                    <p className="text-gray-400 text-sm mb-6 line-clamp-2 h-10">
                                        {deck.description || 'No description provided.'}
                                    </p>

                                    <div className="flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onSelectDeck(deck.id)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                                        >
                                            <Play size={18} />
                                            Study
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-white/5 hover:border-red-500/30"
                                            title="Delete Deck"
                                        >
                                            <Trash2 size={18} />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <EmptyState
                    icon={FolderOpen}
                    title="No decks found"
                    description={searchQuery ? "Try a different search term" : "Create your first flashcard deck to start learning!"}
                    action={searchQuery ? undefined : {
                        label: "Create Deck",
                        onClick: () => setShowCreateModal(true)
                    }}
                />
            )}

            {/* Create Deck Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Create New Deck</h2>
                            <form onSubmit={handleCreateDeck} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Deck Title</label>
                                    <input
                                        type="text"
                                        value={newDeckTitle}
                                        onChange={(e) => setNewDeckTitle(e.target.value)}
                                        placeholder="e.g., React Hooks"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white outline-none transition-all"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Description (Optional)</label>
                                    <textarea
                                        value={newDeckDescription}
                                        onChange={(e) => setNewDeckDescription(e.target.value)}
                                        placeholder="What is this deck about?"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white outline-none resize-none h-24 transition-all"
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl font-medium transition-all"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={!newDeckTitle.trim() || isCreating}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                                    >
                                        {isCreating ? 'Creating...' : 'Create Deck'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
