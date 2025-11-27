import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Play, Brain, Clock, RotateCcw, X, Search, ChevronRight } from 'lucide-react';
import { FlashcardDeck as IFlashcardDeck, Flashcard, addCard } from '../services/db';
import { supabase } from '../lib/supabase';
import EmptyState from './common/EmptyState';
import { SkeletonList } from './common/Skeleton';

interface FlashcardDeckProps {
  deck: IFlashcardDeck;
  onBack: () => void;
  onStartStudy: (cards: Flashcard[]) => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ deck, onBack, onStartStudy }) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadCards();
  }, [deck.id]);

  const loadCards = async () => {
    setLoading(true);
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: allCards, error } = await supabase
          .from('flashcards')
          .select('*')
          .eq('deck_id', deck.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching cards:', error);
          setLoading(false);
          return;
        }

        if (allCards) {
          setCards(allCards as Flashcard[]);
          const now = new Date().toISOString();
          const due = allCards.filter((card: any) => card.next_review_date <= now);
          setDueCards(due as Flashcard[]);
        }
      } catch (error) {
        console.error('Unexpected error in loadCards:', error);
      }
    }
    setLoading(false);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    setIsAdding(true);
    const newCard = await addCard(deck.id, newFront, newBack);
    if (newCard) {
      setCards([newCard, ...cards]);
      setDueCards([newCard, ...dueCards]);
      setNewFront('');
      setNewBack('');
    }
    setIsAdding(false);
  };

  const filteredCards = cards.filter(card =>
    card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.back.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCardFlip = (cardId: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onBack}
              className="p-3 bg-[#111] border border-neutral-800 rounded-2xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
            >
              <ArrowLeft size={20} />
            </motion.button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                {deck.title}
              </h1>
              <p className="text-neutral-400 mt-1">{deck.description || 'No description'}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              onClick={() => onStartStudy(dueCards)}
              disabled={dueCards.length === 0}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={20} />
              Study Now ({dueCards.length})
            </motion.button>
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-[#111] hover:bg-neutral-800 border border-neutral-800 text-white rounded-2xl font-semibold transition-all"
            >
              <Plus size={20} />
              Add Cards
            </motion.button>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 mb-3 ring-1 ring-inset ring-blue-500/20">
              <Brain size={24} />
            </div>
            <div className="text-2xl font-bold text-white">{cards.length}</div>
            <div className="text-sm text-neutral-500 font-medium">Total Cards</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400 mb-3 ring-1 ring-inset ring-orange-500/20">
              <Clock size={24} />
            </div>
            <div className="text-2xl font-bold text-white">{dueCards.length}</div>
            <div className="text-sm text-neutral-500 font-medium">Due for Review</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <div className="text-2xl font-bold text-white mb-1">{deck.card_count || 0}</div>
            <div className="text-sm text-neutral-500 font-medium">Cards in Deck</div>
          </motion.div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#111] border border-neutral-800 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-500 outline-none transition-all"
          />
        </div>

        {/* Card List */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Cards</h2>
            <div className="text-sm text-neutral-500">
              Showing {filteredCards.length} of {cards.length} cards
            </div>
          </div>

          {loading ? (
            <SkeletonList items={3} />
          ) : filteredCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="relative bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-2xl p-6 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-black/40 transition-all"
                  >
                    {/* Card Content - 3D Flip Effect */}
                    <div
                      className="relative w-full h-64 cursor-pointer perspective-1000"
                      onClick={() => toggleCardFlip(card.id)}
                    >
                      <div
                        className="relative w-full h-full transition-transform duration-700 transform-style-3d"
                        style={{
                          transform: flippedCards[card.id] ? 'rotateY(180deg)' : 'rotateY(0deg)'
                        }}
                      >
                        {/* Front of Card */}
                        <div
                          className="absolute inset-0 backface-hidden bg-[#151515] rounded-xl p-6 border border-white/5 flex flex-col justify-between"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 ring-1 ring-inset ring-blue-500/20">
                              <Brain size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-[#0a0a0a] px-2 py-1 rounded border border-neutral-800">
                              Question
                            </span>
                          </div>

                          <div className="text-white text-lg font-medium h-24 overflow-y-auto custom-scrollbar">
                            {card.front}
                          </div>

                          <div className="text-xs text-neutral-500 text-center flex items-center justify-center gap-2 mt-auto pt-4 border-t border-white/5">
                            <RotateCcw size={12} /> Click to flip
                          </div>
                        </div>

                        {/* Back of Card */}
                        <div
                          className="absolute inset-0 backface-hidden bg-[#151515] rounded-xl p-6 border border-emerald-500/20 flex flex-col justify-between rotate-y-180"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                              <Brain size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                              Answer
                            </span>
                          </div>

                          <div className="text-neutral-200 text-lg font-medium h-24 overflow-y-auto custom-scrollbar">
                            {card.back}
                          </div>

                          <div className="text-xs text-neutral-500 text-center flex items-center justify-center gap-2 mt-auto pt-4 border-t border-white/5">
                            <RotateCcw size={12} /> Click to flip back
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                      <div className="text-xs text-neutral-500 font-mono">
                        <div>Interval: {card.interval}d</div>
                        <div>Factor: {card.ease_factor.toFixed(2)}</div>
                      </div>
                      <div className="text-xs text-neutral-500">
                        {new Date(card.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState
              icon={RotateCcw}
              title="No cards found"
              description={searchQuery ? "Try a different search term" : "Add some flashcards to start learning!"}
              action={searchQuery ? undefined : {
                label: "Add First Card",
                onClick: () => setShowAddModal(true)
              }}
            />
          )}
        </div>

        {/* Add Card Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#111] border border-neutral-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Add Flashcard
                  </h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-neutral-500 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddCard} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-neutral-400">Front (Question)</label>
                      <textarea
                        value={newFront}
                        onChange={(e) => setNewFront(e.target.value)}
                        placeholder="e.g., What is a React Hook?"
                        className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white outline-none resize-none h-40 transition-all placeholder-neutral-600"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-neutral-400">Back (Answer)</label>
                      <textarea
                        value={newBack}
                        onChange={(e) => setNewBack(e.target.value)}
                        placeholder="e.g., A function that lets you use state and other React features..."
                        className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white outline-none resize-none h-40 transition-all placeholder-neutral-600"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-2xl font-medium transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={!newFront.trim() || !newBack.trim() || isAdding}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isAdding ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Adding...
                        </>
                      ) : (
                        'Add & Next'
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FlashcardDeck;
