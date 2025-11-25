import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, BookOpen, Plus, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import EmptyState from './common/EmptyState';
import { SkeletonList } from './common/Skeleton';

interface GeneratedItem {
    id: string;
    type: 'flashcard' | 'note';
    source: 'quiz' | 'video';
    source_title: string;
    content: string;
    metadata?: any;
    created_at: string;
}

export const GeneratedContent: React.FC = () => {
    const [items, setItems] = useState<GeneratedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'flashcard' | 'note'>('all');

    useEffect(() => {
        loadGeneratedContent();
    }, []);

    const loadGeneratedContent = async () => {
        setLoading(true);
        if (supabase) {
            const { data } = await supabase
                .from('generated_content')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setItems(data as GeneratedItem[]);
        }
        setLoading(false);
    };

    const filteredItems = items.filter(item =>
        filter === 'all' || item.type === filter
    );

    const addToDeck = async (item: GeneratedItem) => {
        if (item.type !== 'flashcard' || !supabase) return;

        // Get or create "Generated" deck
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if "Generated" deck exists
        let { data: deck } = await supabase
            .from('flashcard_decks')
            .select('id')
            .eq('title', 'AI Generated')
            .single();

        if (!deck) {
            const { data: newDeck } = await supabase
                .from('flashcard_decks')
                .insert({
                    user_id: user.id,
                    title: 'AI Generated',
                    description: 'Flashcards generated from quizzes and videos'
                })
                .select()
                .single();
            deck = newDeck;
        }

        if (deck) {
            // Add card to deck
            const front = item.metadata?.front || item.content;
            const back = item.metadata?.back || 'Answer not available';

            await supabase
                .from('flashcards')
                .insert({
                    deck_id: deck.id,
                    front: front,
                    back: back
                });

            alert('Added to "AI Generated" deck!');
        }
    };

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {[
                    { value: 'all', label: 'All', icon: <Sparkles size={16} /> },
                    { value: 'flashcard', label: 'Flashcards', icon: <BookOpen size={16} /> },
                    { value: 'note', label: 'Notes', icon: <Zap size={16} /> }
                ].map((tab) => (
                    <motion.button
                        key={tab.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFilter(tab.value as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${filter === tab.value
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                            }`}
                    >
                        {tab.icon}
                        <span className="text-sm">{tab.label}</span>
                    </motion.button>
                ))}
            </div>

            {/* Content Grid */}
            {loading ? (
                <SkeletonList items={3} />
            ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <AnimatePresence>
                        {filteredItems.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -5 }}
                                className="group relative bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-pink-500/40 transition-all hover:shadow-2xl hover:shadow-pink-500/20 overflow-hidden"
                            >
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                <div className="relative z-10">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg text-pink-400">
                                                {item.type === 'flashcard' ? <BookOpen size={20} /> : <Zap size={20} />}
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wider">
                                                    {item.type}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    from {item.source}
                                                </div>
                                            </div>
                                        </div>
                                        <Sparkles className="text-pink-400" size={16} />
                                    </div>

                                    {/* Source */}
                                    <div className="text-sm font-semibold text-white mb-2 truncate">
                                        {item.source_title}
                                    </div>

                                    {/* Content Preview */}
                                    <p className="text-gray-300 text-sm line-clamp-3 mb-4">
                                        {item.content}
                                    </p>

                                    {/* Action Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => addToDeck(item)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-pink-500/30"
                                    >
                                        <Plus size={16} />
                                        Add to Deck
                                        <ArrowRight size={16} />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <EmptyState
                    icon={Sparkles}
                    title="No generated content yet"
                    description="Complete quizzes and watch videos to generate AI-powered flashcards and notes!"
                />
            )}
        </div>
    );
};

export default GeneratedContent;
