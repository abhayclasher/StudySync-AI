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
                    <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${filter === tab.value
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                            : 'bg-[#111] text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800'
                            }`}
                    >
                        {tab.icon}
                        <span className="text-sm">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Grid */}
            {loading ? (
                <SkeletonList items={3} />
            ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="group relative bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-xl p-5 hover:border-blue-500/20 transition-all shadow-sm hover:shadow-lg hover:shadow-black/40"
                            >
                                <div className="relative z-10">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${item.type === 'flashcard' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'} ring-1 ring-inset ${item.type === 'flashcard' ? 'ring-blue-500/20' : 'ring-purple-500/20'}`}>
                                                {item.type === 'flashcard' ? <BookOpen size={18} /> : <Zap size={18} />}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                                                    {item.type}
                                                </div>
                                                <div className="text-xs text-neutral-400 font-medium">
                                                    from {item.source}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <Sparkles className="text-neutral-600 group-hover:text-yellow-400 transition-colors" size={16} />
                                        </div>
                                    </div>

                                    {/* Source */}
                                    <div className="text-sm font-semibold text-white mb-2.5 truncate group-hover:text-blue-400 transition-colors">
                                        {item.source_title}
                                    </div>

                                    {/* Content Preview */}
                                    <p className="text-neutral-400 text-sm line-clamp-3 mb-5 leading-relaxed">
                                        {item.content}
                                    </p>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => addToDeck(item)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#151515] hover:bg-[#202020] text-neutral-300 hover:text-white rounded-lg font-medium transition-colors border border-white/5 hover:border-white/10"
                                    >
                                        <Plus size={16} />
                                        Add to Deck
                                    </button>
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
