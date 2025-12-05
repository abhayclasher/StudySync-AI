import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Search,
    Calendar,
    Video,
    Download,
    Plus,
    Filter,
    Grid3X3,
    List,
    Tag,
    Folder,
    Clock,
    Pin,
    Archive,
    ArchiveX,
    MoreVertical,
    Edit3,
    Trash2,
    X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SkeletonList } from '../common/Skeleton';

interface Note {
    id: string;
    video_id?: string;
    video_title?: string;
    title?: string;
    content: string;
    timestamp?: number;
    created_at: string;
    updated_at?: string;
    tags?: string[];
    folder?: string;
    is_archived?: boolean;
    is_pinned?: boolean;
}

interface EnhancedNotesInterfaceProps {
    type: 'video' | 'custom';
}

export const EnhancedNotesInterface: React.FC<EnhancedNotesInterfaceProps> = ({ type }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isArchivedOnly, setIsArchivedOnly] = useState(false);
    const [isPinnedOnly, setIsPinnedOnly] = useState(false);

    const isLoadingNotes = useRef(false);

    // Function to strip markdown for plain text previews
    const stripMarkdown = (markdown: string) => {
        return markdown
            .replace(/^#{1,6}\s+/gm, '') // Remove headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/_(.*?)_/g, '$1') // Remove italic
            .replace(/`(.*?)`/g, '$1') // Remove inline code
            .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
            .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
            .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough
            .trim();
    };

    // Extract all unique tags from notes
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        notes.forEach(note => {
            if (note.tags) {
                note.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags);
    }, [notes]);

    // Extract all unique folders from notes
    const allFolders = useMemo(() => {
        const folders = new Set<string>();
        notes.forEach(note => {
            if (note.folder) {
                folders.add(note.folder);
            }
        });
        return Array.from(folders);
    }, [notes]);

    useEffect(() => {
        loadNotes();
    }, [type]);

    const loadNotes = async () => {
        if (isLoadingNotes.current) return;
        isLoadingNotes.current = true;
        setLoading(true);
        if (supabase) {
            const table = type === 'video' ? 'video_notes' : 'custom_notes';
            const { data } = await supabase
                .from(table)
                .select('*')
                .order('created_at', { ascending: false });
            if (data) setNotes(data as Note[]);
        }
        setLoading(false);
        isLoadingNotes.current = false;
    };

    // Filter notes based on search query and filters
    const filteredNotes = useMemo(() => {
        return notes.filter(note => {
            const matchesSearch =
                note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.video_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.title?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesTag = selectedTags.length === 0 ||
                (note.tags && selectedTags.some(tag => note.tags?.includes(tag)));

            const matchesFolder = !selectedFolder || note.folder === selectedFolder;
            const matchesArchived = !isArchivedOnly || note.is_archived;
            const matchesPinned = !isPinnedOnly || note.is_pinned;

            return matchesSearch && matchesTag && matchesFolder && matchesArchived && matchesPinned;
        });
    }, [notes, searchQuery, selectedTags, selectedFolder, isArchivedOnly, isPinnedOnly]);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const togglePinned = async (noteId: string) => {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        const updatedNotes = notes.map(n =>
            n.id === noteId ? { ...n, is_pinned: !n.is_pinned } : n
        );
        setNotes(updatedNotes);

        if (supabase) {
            const table = type === 'video' ? 'video_notes' : 'custom_notes';
            await supabase
                .from(table)
                .update({ is_pinned: !note.is_pinned })
                .eq('id', noteId);
        }
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
                        content: newNoteContent,
                        is_pinned: false,
                        is_archived: false,
                        tags: []
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

    const exportNote = (note: Note) => {
        // Simple export logic for now
        const text = `# ${note.title || note.video_title}\n\n${note.content}`;
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(note.title || note.video_title || 'note').replace(/[^a-z0-9]/gi, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full flex flex-col bg-[#050505] text-white">
            {/* Header with search and controls */}
            <div className="mb-8">
                <div className="flex flex-col xl:flex-row gap-4 mb-6">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                        <input
                            type="text"
                            placeholder={`Search ${type === 'video' ? 'video' : 'custom'} notes...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-[#0a0a0a] border border-white/5 rounded-2xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-600 outline-none transition-all text-lg"
                        />
                    </div>

                    <div className="flex gap-3">
                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-1 bg-[#0a0a0a] p-1.5 rounded-2xl border border-white/5">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setViewMode('grid')}
                                className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                            >
                                <Grid3X3 size={20} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setViewMode('list')}
                                className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                            >
                                <List size={20} />
                            </motion.button>
                        </div>

                        {/* Filter Toggle */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`px-5 py-3 rounded-2xl border transition-all flex items-center gap-2 font-medium ${isFilterOpen
                                ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                : 'bg-[#0a0a0a] border-white/5 text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'}`}
                        >
                            <Filter size={20} />
                            <span>Filters</span>
                        </motion.button>

                        {/* Create Button */}
                        {type === 'custom' && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap"
                            >
                                <Plus size={20} />
                                <span>New Note</span>
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Filters Panel */}
                <AnimatePresence>
                    {isFilterOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                                {/* Tags Filter */}
                                <div className="md:col-span-2">
                                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Tag size={14} /> Tags
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${selectedTags.includes(tag)
                                                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                                                    : 'bg-[#151515] border-white/5 text-neutral-400 hover:text-white hover:border-white/20'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                        {allTags.length === 0 && <span className="text-neutral-600 text-sm italic">No tags found</span>}
                                    </div>
                                </div>

                                {/* Special Filters */}
                                <div className="md:col-span-2 space-y-4">
                                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Filter size={14} /> Quick Filters
                                    </h4>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setIsPinnedOnly(!isPinnedOnly)}
                                            className={`flex-1 px-4 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${isPinnedOnly
                                                ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400'
                                                : 'bg-[#151515] border-white/5 text-neutral-400 hover:text-white'
                                                }`}
                                        >
                                            <Pin size={16} /> Pinned
                                        </button>
                                        <button
                                            onClick={() => setIsArchivedOnly(!isArchivedOnly)}
                                            className={`flex-1 px-4 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${isArchivedOnly
                                                ? 'bg-purple-500/10 border-purple-500/50 text-purple-400'
                                                : 'bg-[#151515] border-white/5 text-neutral-400 hover:text-white'
                                                }`}
                                        >
                                            <Archive size={16} /> Archived
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Notes Content */}
            {loading ? (
                <SkeletonList items={6} />
            ) : filteredNotes.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                        <AnimatePresence mode="popLayout">
                            {filteredNotes.map((note, index) => (
                                <motion.div
                                    key={note.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedNote(note)}
                                    className="group relative bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 cursor-pointer flex flex-col h-[280px]"
                                >
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); togglePinned(note.id); }}
                                            className={`p-2 rounded-lg transition-colors ${note.is_pinned ? 'text-yellow-400 bg-yellow-400/10' : 'text-neutral-500 hover:text-white hover:bg-[#1a1a1a]'}`}
                                        >
                                            <Pin size={16} fill={note.is_pinned ? "currentColor" : "none"} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); exportNote(note); }}
                                            className="p-2 text-neutral-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#151515] flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform border border-white/5">
                                            {type === 'video' ? <Video size={20} /> : <FileText size={20} />}
                                        </div>
                                        <h3 className="text-lg font-bold text-white line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
                                            {note.title || note.video_title || 'Untitled Note'}
                                        </h3>
                                        <p className="text-neutral-500 text-sm line-clamp-3 leading-relaxed">
                                            {stripMarkdown(note.content)}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-neutral-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={12} />
                                            <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {note.tags && note.tags.length > 0 && (
                                            <div className="flex gap-1">
                                                {note.tags.slice(0, 2).map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-[#151515] rounded border border-white/5 text-neutral-400">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-[#111] border-b border-white/5">
                                <tr>
                                    <th className="p-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Title</th>
                                    <th className="p-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Preview</th>
                                    <th className="p-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Date</th>
                                    <th className="p-6 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredNotes.map((note) => (
                                    <tr
                                        key={note.id}
                                        onClick={() => setSelectedNote(note)}
                                        className="hover:bg-[#111] transition-colors cursor-pointer group"
                                    >
                                        <td className="p-6 font-medium text-white group-hover:text-blue-400 transition-colors">
                                            <div className="flex items-center gap-3">
                                                {note.is_pinned && <Pin size={14} className="text-yellow-400 fill-yellow-400" />}
                                                {note.title || note.video_title || 'Untitled'}
                                            </div>
                                        </td>
                                        <td className="p-6 text-neutral-500 max-w-md truncate">
                                            {stripMarkdown(note.content)}
                                        </td>
                                        <td className="p-6 text-neutral-500 text-sm">
                                            {new Date(note.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-6 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); exportNote(note); }}
                                                className="p-2 text-neutral-500 hover:text-white hover:bg-[#222] rounded-lg transition-all"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-[#0a0a0a] rounded-full flex items-center justify-center mb-6 border border-white/5">
                        <FileText size={40} className="text-neutral-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No notes found</h3>
                    <p className="text-neutral-500 max-w-md mx-auto mb-8">
                        {searchQuery ? "Try adjusting your search or filters." : "Start taking notes to build your personal knowledge base."}
                    </p>
                    {type === 'custom' && !searchQuery && (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all"
                        >
                            Create First Note
                        </button>
                    )}
                </div>
            )}

            {/* Create Note Modal */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">Create New Note</h2>
                                <button onClick={() => setIsCreating(false)} className="text-neutral-500 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <input
                                    type="text"
                                    placeholder="Note Title"
                                    value={newNoteTitle}
                                    onChange={(e) => setNewNoteTitle(e.target.value)}
                                    className="w-full bg-transparent text-2xl font-bold text-white placeholder-neutral-600 outline-none"
                                    autoFocus
                                />
                                <textarea
                                    placeholder="Start typing your note..."
                                    value={newNoteContent}
                                    onChange={(e) => setNewNoteContent(e.target.value)}
                                    className="w-full h-64 bg-transparent text-lg text-neutral-300 placeholder-neutral-700 outline-none resize-none leading-relaxed"
                                />
                            </div>
                            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#050505]">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="px-6 py-3 rounded-xl font-bold text-neutral-400 hover:text-white hover:bg-[#111] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createNote}
                                    disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                                >
                                    Save Note
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};