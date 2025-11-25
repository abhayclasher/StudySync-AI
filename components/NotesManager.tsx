import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Calendar, Video, Trash2, Download, Eye, Plus, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import EmptyState from './common/EmptyState';
import { SkeletonList } from './common/Skeleton';

interface Note {
    id: string;
    video_id?: string;
    video_title?: string;
    title?: string;
    content: string;
    timestamp?: number;
    created_at: string;
}

interface NotesManagerProps {
    type: 'video' | 'custom';
}

export const NotesManager: React.FC<NotesManagerProps> = ({ type }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');

    useEffect(() => {
        loadNotes();
    }, [type]);

    const loadNotes = async () => {
        setLoading(true);
        if (supabase) {
            if (type === 'video') {
                const { data } = await supabase
                    .from('video_notes')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (data) setNotes(data as Note[]);
            } else {
                const { data } = await supabase
                    .from('custom_notes')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (data) setNotes(data as Note[]);
            }
        }
        setLoading(false);
    };

    const createNote = async () => {
        if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

        if (supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase
                    .from('custom_notes')
                    .insert({
                        user_id: user.id,
                        title: newNoteTitle,
                        content: newNoteContent
                    });

                if (!error) {
                    setIsCreating(false);
                    setNewNoteTitle('');
                    setNewNoteContent('');
                    loadNotes();
                }
            }
        }
    };

    const filteredNotes = notes.filter(note =>
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.video_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const exportNote = (note: Note) => {
        const blob = new Blob([note.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `note-${note.title || note.video_title || 'untitled'}.md`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Search & Create */}
            <div className="flex gap-3 flex-col sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder={`Search ${type === 'video' ? 'video' : 'custom'} notes...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-500 outline-none transition-all"
                    />
                </div>
                {type === 'custom' && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/30"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Create Note</span>
                    </motion.button>
                )}
            </div>

            {/* Notes Grid */}
            {loading ? (
                <SkeletonList items={3} />
            ) : filteredNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <AnimatePresence>
                        {filteredNotes.map((note) => (
                            <motion.div
                                key={note.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -5 }}
                                className="group relative bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-emerald-500/40 transition-all hover:shadow-2xl hover:shadow-emerald-500/20 overflow-hidden"
                            >
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                <div className="relative z-10">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setSelectedNote(note)}
                                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                title="View Note"
                                            >
                                                <Eye size={16} />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => exportNote(note)}
                                                className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                                                title="Export"
                                            >
                                                <Download size={16} />
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    {(note.title || note.video_title) && (
                                        <div className="flex items-center gap-2 mb-2">
                                            {type === 'video' && <Video size={12} className="text-gray-500" />}
                                            <h3 className="text-sm font-semibold text-white truncate">
                                                {note.title || note.video_title}
                                            </h3>
                                        </div>
                                    )}

                                    {/* Content Preview */}
                                    <p className="text-gray-300 text-sm line-clamp-4 mb-3">
                                        {note.content}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {note.timestamp && (
                                            <span className="bg-white/5 px-2 py-1 rounded">
                                                {Math.floor(note.timestamp / 60)}:{String(note.timestamp % 60).padStart(2, '0')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <EmptyState
                    icon={FileText}
                    title={`No ${type === 'video' ? 'video' : 'custom'} notes yet`}
                    description={searchQuery ? "Try a different search term" : type === 'video' ? "Start taking notes while watching videos!" : "Create your first study note!"}
                    action={type === 'custom' && !searchQuery ? {
                        label: "Create Note",
                        onClick: () => setIsCreating(true)
                    } : undefined}
                />
            )}

            {/* Note Preview Modal */}
            <AnimatePresence>
                {selectedNote && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedNote(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white">{selectedNote.title || selectedNote.video_title || 'Note'}</h3>
                                <button
                                    onClick={() => setSelectedNote(null)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="prose prose-invert max-w-none">
                                <p className="text-gray-300 whitespace-pre-wrap">{selectedNote.content}</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Note Modal */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreating(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl"
                        >
                            <h3 className="text-2xl font-bold text-white mb-6">Create New Note</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={newNoteTitle}
                                        onChange={(e) => setNewNoteTitle(e.target.value)}
                                        placeholder="Note title..."
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white outline-none transition-all"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Content</label>
                                    <textarea
                                        value={newNoteContent}
                                        onChange={(e) => setNewNoteContent(e.target.value)}
                                        placeholder="Write your notes here..."
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white outline-none resize-none h-48 transition-all"
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl font-medium transition-all"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={createNote}
                                        disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30"
                                    >
                                        Create Note
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotesManager;
