import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NoteSidebar } from './NoteSidebar';
import { NoteList } from './NoteList';
import { NoteEditorModal } from './NoteEditor';
import { AIGeneratorModal } from './AIGeneratorModal';
import { supabase } from '../../lib/supabase';
import { generateSmartNote } from '../../services/geminiService';

export interface Note {
    id: string;
    title: string;
    content: string;
    tags: string[];
    folder?: string;
    is_pinned: boolean;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
    video_id?: string;
    video_title?: string;
    user_id: string;
    type: 'custom' | 'video';
}

export const SmartNotesLayout: React.FC<{ onStartVideo?: (videoId: string, videoTitle: string) => void }> = ({ onStartVideo }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [filter, setFilter] = useState({ folder: 'all', tag: null as string | null, search: '' });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load notes from both tables
    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [customNotes, videoNotes] = await Promise.all([
                supabase.from('custom_notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
                supabase.from('video_notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false })
            ]);

            const formattedCustom = (customNotes.data || []).map((n: any) => ({
                ...n,
                type: 'custom',
                tags: n.tags || [],
                is_pinned: n.is_pinned || false,
                is_archived: n.is_archived || false
            }));
            const formattedVideo = (videoNotes.data || []).map((n: any) => ({
                ...n,
                type: 'video',
                title: n.video_title || n.title || 'Video Note',
                tags: n.tags || [],
                is_pinned: n.is_pinned || false,
                is_archived: n.is_archived || false
            }));

            // Merge and sort
            const allNotes = [...formattedCustom, ...formattedVideo].sort((a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );

            setNotes(allNotes as Note[]);
            if (allNotes.length > 0 && !selectedNoteId) {
                // Optional: Auto-select first note on desktop
                // setSelectedNoteId(allNotes[0].id);
            }
        } catch (error) {
            console.error('Error loading notes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateNote = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newNote = {
            user_id: user.id,
            title: 'Untitled Note',
            content: '',
            // tags: [],
            // is_pinned: false,
            // is_archived: false
        };

        const { data, error } = await supabase.from('custom_notes').insert(newNote).select().single();

        if (data) {
            const formattedNote = {
                ...data,
                type: 'custom',
                tags: [],
                is_pinned: false,
                is_archived: false
            };
            setNotes([formattedNote, ...notes]);
            setSelectedNoteId(formattedNote.id);
            // On mobile, this would switch view
        }
    };

    const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
        // Optimistic update
        setNotes(notes.map(n => n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n));

        const note = notes.find(n => n.id === id);
        if (!note) return;

        const table = note.type === 'video' ? 'video_notes' : 'custom_notes';

        // Remove type and missing columns from updates
        const { type, tags, is_pinned, is_archived, ...dbUpdates } = updates as any;

        await supabase.from(table).update(dbUpdates).eq('id', id);
    };

    const handleDeleteNote = async (id: string) => {
        const note = notes.find(n => n.id === id);
        if (!note) return;

        const table = note.type === 'video' ? 'video_notes' : 'custom_notes';

        await supabase.from(table).delete().eq('id', id);
        setNotes(notes.filter(n => n.id !== id));
        if (selectedNoteId === id) setSelectedNoteId(null);
    };

    const handleGenerateNote = async (prompt: string, context?: string) => {
        setIsGeneratorOpen(false);

        // Create placeholder note
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const tempId = 'temp-' + Date.now();
        const tempNote: Note = {
            id: tempId,
            title: 'Generating...',
            content: 'AI is writing your note...',
            tags: ['AI Generated'],
            is_pinned: false,
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user.id,
            type: 'custom'
        };

        setNotes([tempNote, ...notes]);
        setSelectedNoteId(tempId);

        try {
            // Generate content
            const content = await generateSmartNote(prompt, context);

            // Extract title from first line if it's a header
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1] : 'AI Generated Note';

            // Save to DB
            // Note: tags, is_pinned, is_archived are not yet in the DB schema, so we exclude them for now
            const { data, error } = await supabase.from('custom_notes').insert({
                user_id: user.id,
                title,
                content,
                // tags: ['AI Generated'],
                // is_pinned: false,
                // is_archived: false
            }).select().single();

            if (error) throw error;

            if (data) {
                const finalNote = {
                    ...data,
                    type: 'custom',
                    tags: ['AI Generated'], // Default for UI
                    is_pinned: false,
                    is_archived: false
                };
                setNotes(prev => prev.map(n => n.id === tempId ? finalNote : n));
                setSelectedNoteId(finalNote.id);
            }
        } catch (error) {
            console.error("Failed to generate/save note:", error);
            // Update temp note to show error
            setNotes(prev => prev.map(n => n.id === tempId ? {
                ...n,
                title: 'Generation Failed',
                content: 'Sorry, AI could not generate your note. Please try again.'
            } : n));
        }
    };

    const filteredNotes = notes.filter(note => {
        if (filter.search && !note.title.toLowerCase().includes(filter.search.toLowerCase()) && !note.content.toLowerCase().includes(filter.search.toLowerCase())) return false;
        if (filter.tag && !note.tags.includes(filter.tag)) return false;
        if (filter.folder === 'favorites' && !note.is_pinned) return false;
        if (filter.folder === 'archived' && !note.is_archived) return false;
        if (filter.folder === 'video' && note.type !== 'video') return false;
        if (filter.folder === 'all' && note.is_archived) return false; // Hide archived in 'all'
        return true;
    });

    const selectedNote = notes.find(n => n.id === selectedNoteId);

    return (
        <div className="flex h-full bg-[#050505] text-white overflow-hidden relative">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="absolute inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar - Navigation */}
            <motion.div
                className={`fixed lg:relative z-50 h-full w-64 bg-[#0a0a0a] border-r border-white/5 flex-shrink-0 transform transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                <NoteSidebar
                    filter={filter}
                    setFilter={setFilter}
                    onCreateNote={handleCreateNote}
                    onOpenGenerator={() => setIsGeneratorOpen(true)}
                    allTags={Array.from(new Set(notes.flatMap(n => n.tags || []))).filter(Boolean)}
                />
            </motion.div>

            {/* Note List (Full Width on Mobile, Expanded on Desktop) */}
            <div className={`flex-1 flex flex-col transition-all duration-300 bg-[#050505]`}>
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                    <button onClick={() => setIsMobileSidebarOpen(true)} className="lg:hidden p-2 hover:bg-white/5 rounded-lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    <div className="relative flex-1 max-w-2xl">
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={filter.search}
                            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <NoteList
                        notes={filteredNotes}
                        selectedId={selectedNoteId}
                        onSelect={(id) => setSelectedNoteId(id)}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {/* Note Editor Modal */}
            <AnimatePresence>
                {selectedNoteId && selectedNote && (
                    <NoteEditorModal
                        note={selectedNote}
                        isOpen={!!selectedNoteId}
                        onClose={() => setSelectedNoteId(null)}
                        onUpdate={(updates) => handleUpdateNote(selectedNote.id, updates)}
                        onDelete={() => handleDeleteNote(selectedNote.id)}
                        onStartVideo={onStartVideo}
                    />
                )}
            </AnimatePresence>

            {/* AI Generator Modal */}
            <AnimatePresence>
                {isGeneratorOpen && (
                    <AIGeneratorModal
                        onClose={() => setIsGeneratorOpen(false)}
                        onGenerate={handleGenerateNote}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
