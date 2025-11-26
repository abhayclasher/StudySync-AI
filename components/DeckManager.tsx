import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Play, BookOpen, Search, FolderOpen, MoreVertical, Edit2 } from 'lucide-react';
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
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Flashcard Decks
                    </h1>
                    <p className="text-neutral-400 mt-1">Master concepts with spaced repetition</p>
                </div>
                <motion.button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
                >
                    <Plus size={18} />
                    <span>Create Deck</span>
                </motion.button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                    type="text"
                    placeholder="Search decks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#111] border border-neutral-800 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-500 outline-none transition-all"
                />
            </div>

            {/* Deck Grid */}
            {loading ? (
                <SkeletonList items={3} />
            ) : filteredDecks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredDecks.map((deck) => (
                            <motion.div
                                key={deck.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="group relative bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-xl p-5 hover:border-blue-500/20 transition-all cursor-pointer shadow-sm hover:shadow-lg hover:shadow-black/40"
                                onClick={() => onSelectDeck(deck.id)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2.5 bg-neutral-900 rounded-lg text-blue-400 group-hover:bg-blue-500/10 group-hover:text-blue-300 transition-colors ring-1 ring-inset ring-white/5 group-hover:ring-blue-500/20">
                                        <BookOpen size={20} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs font-medium text-neutral-500 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800">
                                            {deck.card_count || 0} cards
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-1.5 line-clamp-1 group-hover:text-blue-400 transition-colors">
                                    {deck.title}
                                </h3>
                                <p className="text-neutral-400 text-sm mb-6 line-clamp-2 h-10 leading-relaxed">
                                    {deck.description || 'No description provided.'}
                                </p>

                                <div className="flex items-center gap-2 mt-auto">
                                    <button
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#151515] hover:bg-[#202020] text-white text-sm font-medium rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                                    >
                                        <Play size={14} />
                                        Study Now
                                    </button>
                                    <button
                                        className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Handle delete
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-[#111] border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <h2 className="text-xl font-bold text-white mb-6">Create New Deck</h2>
                            <form onSubmit={handleCreateDeck} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-1.5">Deck Title</label>
                                    <input
                                        type="text"
                                        value={newDeckTitle}
                                        onChange={(e) => setNewDeckTitle(e.target.value)}
                                        placeholder="e.g., React Hooks"
                                        className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white outline-none transition-all placeholder-neutral-600"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-1.5">Description (Optional)</label>
                                    <textarea
                                        value={newDeckDescription}
                                        onChange={(e) => setNewDeckDescription(e.target.value)}
                                        placeholder="What is this deck about?"
                                        className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white outline-none resize-none h-24 transition-all placeholder-neutral-600"
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newDeckTitle.trim() || isCreating}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCreating ? 'Creating...' : 'Create Deck'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
