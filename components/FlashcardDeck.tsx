import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Play, Brain, Clock, RotateCcw } from 'lucide-react';
import { FlashcardDeck as IFlashcardDeck, Flashcard, addCard, getDueCards } from '../services/db';
import { supabase } from '../lib/supabase';
import EmptyState from './common/EmptyState';

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

  useEffect(() => {
    loadCards();
  }, [deck.id]);

  const loadCards = async () => {
    setLoading(true);
    if (supabase) {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('❌ User not authenticated');
          setLoading(false);
          return;
        }

        // Fetch all cards for this deck
        const { data: allCards, error } = await supabase
          .from('flashcards')
          .select('*')
          .eq('deck_id', deck.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching cards:', error);
          // Check if it's an RLS policy error
          if (error.code === 'PGRST112') {
            console.log('🔍 RLS Policy Issue - checking deck ownership...');
            // Try to fetch the deck to verify ownership
            const { data: deckData, error: deckError } = await supabase
              .from('flashcard_decks')
              .select('*')
              .eq('id', deck.id)
              .eq('user_id', user.id)
              .single();
            
            if (deckError || !deckData) {
              console.error('❌ Deck not found or access denied');
            }
          }
          setLoading(false);
          return;
        }

        if (allCards) {
          console.log('✅ Successfully loaded', allCards.length, 'cards');
          setCards(allCards as Flashcard[]);

          // Filter due cards
          const now = new Date().toISOString();
          const due = allCards.filter((card: any) => card.next_review_date <= now);
          setDueCards(due as Flashcard[]);
        }
      } catch (error) {
        console.error('💥 Unexpected error in loadCards:', error);
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
      // New cards are due immediately
      setDueCards([newCard, ...dueCards]);
      setNewFront('');
      setNewBack('');
      // Keep modal open for rapid entry
      // setShowAddModal(false); 
    }
    setIsAdding(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">{deck.title}</h1>
          <p className="text-gray-400">{deck.description || 'No description'}</p>
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-blue-500/10 rounded-full text-blue-400 mb-3">
            <Brain size={24} />
          </div>
          <div className="text-2xl font-bold text-white">{cards.length}</div>
          <div className="text-sm text-gray-400">Total Cards</div>
        </div>

        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-amber-500/10 rounded-full text-amber-400 mb-3">
            <Clock size={24} />
          </div>
          <div className="text-2xl font-bold text-white">{dueCards.length}</div>
          <div className="text-sm text-gray-400">Due for Review</div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onStartStudy(dueCards)}
            disabled={dueCards.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={20} />
            Study Now ({dueCards.length})
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors border border-gray-700"
          >
            <Plus size={20} />
            Add Cards
          </button>
        </div>
      </div>

      {/* Card List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Cards</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading cards...</div>
        ) : cards.length > 0 ? (
          <div className="grid gap-4">
            {cards.map((card) => (
              <div key={card.id} className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 flex justify-between items-center group hover:border-gray-600 transition-colors">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="text-white font-medium">{card.front}</div>
                  <div className="text-gray-400">{card.back}</div>
                </div>
                <div className="text-xs text-gray-500 ml-4 flex flex-col items-end gap-1 min-w-[60px]">
                  <span className="text-center">Interval: {card.interval}d</span>
                  <span className="text-center">Ease: {card.ease_factor.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={RotateCcw}
            title="No cards yet"
            description="Add some flashcards to start learning!"
            action={{
                label: "Add First Card",
                onClick: () => setShowAddModal(true)
            }}
          />
        )}
      </div>

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Add Flashcard</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleAddCard} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Front (Question)</label>
                    <textarea
                      value={newFront}
                      onChange={(e) => setNewFront(e.target.value)}
                      placeholder="e.g., What is a React Hook?"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white outline-none resize-none h-40"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Back (Answer)</label>
                    <textarea
                      value={newBack}
                      onChange={(e) => setNewBack(e.target.value)}
                      placeholder="e.g., A function that lets you use state and other React features..."
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white outline-none resize-none h-40"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Done
                  </button>
                  <button
                    type="submit"
                    disabled={!newFront.trim() || !newBack.trim() || isAdding}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full flex items-center justify-center gap-2"
                  >
                    {isAdding ? 'Adding...' : 'Add & Next'}
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

export default FlashcardDeck;
