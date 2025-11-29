import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Search,
    Calendar,
    Video,
    Trash2,
    Download,
    Plus,
    Filter,
    Grid3X3,
    List,
    Tag,
    Folder,
    Clock,
    Paperclip,
    X,
    MoreVertical,
    ChevronDown,
    ChevronRight,
    Edit3,
    Archive,
    ArchiveX,
    Pin,
    PinOff
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import EmptyState from '../common/EmptyState';
import { SkeletonList } from '../common/Skeleton';
import MarkdownRenderer from '../MarkdownRenderer';

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
    attachments?: Array<{
        id: string;
        name: string;
        type: string;
        url: string;
    }>;
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
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

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
        isLoadingNotes.current = false;
    };

    // Filter notes based on search query and filters
    const filteredNotes = useMemo(() => {
        return notes.filter(note => {
            // Search query filter
            const matchesSearch =
                note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.video_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.title?.toLowerCase().includes(searchQuery.toLowerCase());

            // Tag filter
            const matchesTag = selectedTags.length === 0 ||
                (note.tags && selectedTags.some(tag => note.tags?.includes(tag)));

            // Folder filter
            const matchesFolder = !selectedFolder || note.folder === selectedFolder;

            // Archived filter
            const matchesArchived = !isArchivedOnly || note.is_archived;

            // Pinned filter
            const matchesPinned = !isPinnedOnly || note.is_pinned;

            return matchesSearch && matchesTag && matchesFolder && matchesArchived && matchesPinned;
        });
    }, [notes, searchQuery, selectedTags, selectedFolder, isArchivedOnly, isPinnedOnly]);

    // Toggle tag selection
    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    // Toggle note pinned status
    const togglePinned = async (noteId: string) => {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        const updatedNotes = notes.map(n =>
            n.id === noteId ? { ...n, is_pinned: !n.is_pinned } : n
        );
        setNotes(updatedNotes);

        // Update in database
        if (supabase) {
            const table = type === 'video' ? 'video_notes' : 'custom_notes';
            await supabase
                .from(table)
                .update({ is_pinned: !note.is_pinned })
                .eq('id', noteId);
        }
    };

    // Toggle note archived status
    const toggleArchived = async (noteId: string) => {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        const updatedNotes = notes.map(n =>
            n.id === noteId ? { ...n, is_archived: !n.is_archived } : n
        );
        setNotes(updatedNotes);

        // Update in database
        if (supabase) {
            const table = type === 'video' ? 'video_notes' : 'custom_notes';
            await supabase
                .from(table)
                .update({ is_archived: !note.is_archived })
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
        // Convert markdown to HTML for better formatting
        const formatMarkdownToHtml = (markdown: string): string => {
            let html = markdown;

            // Convert headers
            html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
            html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
            html = html.replace(/^## (.*$)/gim, '<h2>$2</h2>');
            html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

            // Convert bold and italic
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
            html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
            html = html.replace(/_(.*?)_/g, '<em>$1</em>');

            // Convert code
            html = html.replace(/`(.*?)`/g, '<code>$1</code>');
            html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

            // Convert blockquotes
            html = html.replace(/^>\s(.*$)/gim, '<blockquote>$1</blockquote>');

            // Convert lists
            html = html.replace(/^[\*\-] (.*$)/gim, '<li>$1</li>');
            html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
            html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

            // Convert line breaks
            html = html.replace(/\n\n/g, '</p><p>');
            html = html.replace(/\n/g, '<br>');

            return `<p>${html}</p>`;
        };

        const formattedContent = formatMarkdownToHtml(note.content);
        const noteTitle = note.title || note.video_title || 'Untitled Note';
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${noteTitle}</title>
     <style>
         body { font-family: system-ui, sans-serif; padding: ${isMobile ? '20px' : '40px'}; line-height: 1.6; color: #374151; max-width: ${isMobile ? '100%' : '800px'}; margin: 0 auto; background: #fff; }
         h1 { font-size: ${isMobile ? '24px' : '28px'}; margin-bottom: 10px; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; color: #111827; }
         h2 { font-size: ${isMobile ? '20px' : '24px'}; margin-top: ${isMobile ? '20px' : '24px'}; margin-bottom: ${isMobile ? '10px' : '12px'}; color: #111827; border-bottom: 2px solid #93c5fd; padding-bottom: 6px; }
         h3 { font-size: ${isMobile ? '18px' : '20px'}; margin-top: ${isMobile ? '16px' : '20px'}; margin-bottom: ${isMobile ? '8px' : '10px'}; color: #111827; }
         h4 { font-size: ${isMobile ? '16px' : '18px'}; margin-top: ${isMobile ? '14px' : '16px'}; margin-bottom: ${isMobile ? '6px' : '8px'}; color: #111827; }
         .meta { color: #64748b; font-size: ${isMobile ? '13px' : '14px'}; margin-bottom: ${isMobile ? '20px' : '30px'}; padding: 10px; background: #f1f5f9; border-left: 4px solid #3b82f6; }
         .content { white-space: pre-wrap; word-wrap: break-word; }
         p { margin: ${isMobile ? '8px' : '10px'} 0; color: #374151; }
         strong { font-weight: 700; color: #111827; }
         em { font-style: italic; color: #111827; }
         code { background: #1f2937; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', Consolas, monospace; font-size: ${isMobile ? '13px' : '14px'}; color: #f9fafb; border: 1px solid #374151; }
         pre { background: #111827; border: 1px solid #374151; border-radius: 4px; padding: ${isMobile ? '12px' : '16px'}; overflow-x: auto; margin: ${isMobile ? '12px' : '16px'} 0; }
         pre code { background: none; padding: 0; color: #f9fafb; border: none; }
         blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; margin: 16px 0; background: #eff6ff; color: #374151; font-style: italic; }
         ul, ol { margin: ${isMobile ? '8px' : '10px'} 0; padding-left: ${isMobile ? '25px' : '30px'}; color: #374151; }
         li { margin: ${isMobile ? '4px' : '5px'} 0; }
         a { color: #2563eb; text-decoration: underline; }
     </style>
</head>
<body>
    <h1>${noteTitle}</h1>
    <div class="meta">
        <strong>Created:</strong> ${new Date(note.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        ${note.timestamp ? ` | <strong>Timestamp:</strong> ${Math.floor(note.timestamp / 60)}:${String(note.timestamp % 60).padStart(2, '0')}` : ''}
    </div>
    <div class="content">${formattedContent}</div>
</body>
</html>`;

        if (isMobile) {
            // Mobile: Download HTML file
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${noteTitle.replace(/[^a-z0-9]/gi, '_')}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            // Desktop: Open print dialog
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(htmlContent + '<script>window.onload = function() { window.print(); }</script>');
                printWindow.document.close();
            }
        }
    };

    // Toggle folder expansion
    const toggleFolder = (folder: string) => {
        setExpandedFolders(prev => ({
            ...prev,
            [folder]: !prev[folder]
        }));
    };

    return (
        <div className="h-full flex flex-col bg-[#0A0A0A]">
            {/* Header with search and controls */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${type === 'video' ? 'video' : 'custom'} notes...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-[#111] border border-neutral-800 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-500 outline-none transition-all"
                        />
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2 bg-[#111] p-1 rounded-xl border border-neutral-800">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
                        >
                            <Grid3X3 size={18} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
                        >
                            <List size={18} />
                        </motion.button>

                        <div className="w-px h-6 bg-neutral-800 mx-1"></div>

                        {/* Filter Toggle */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`p-2 rounded-xl transition-all ${isFilterOpen ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
                        >
                            <Filter size={18} />
                        </motion.button>
                    </div>

                    {/* Create Button */}
                    {type === 'custom' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-medium transition-all shadow-lg shadow-indigo-900/20 whitespace-nowrap"
                        >
                            <Plus size={18} />
                            <span>Create Note</span>
                        </motion.button>
                    )}
                </div>

                {/* Filters Panel */}
                <AnimatePresence>
                    {isFilterOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="bg-[#111] border border-neutral-800 rounded-xl p-6 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Tags Filter */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                            <Tag size={12} />
                                            Tags
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {allTags.map(tag => (
                                                <motion.button
                                                    key={tag}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => toggleTag(tag)}
                                                    className={`px-3 py-1.5 text-sm rounded-md border transition-all ${selectedTags.includes(tag)
                                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-md shadow-blue-500/10'
                                                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300 hover:shadow-md hover:shadow-neutral-700/10'
                                                        }`}
                                                >
                                                    {tag}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Folders Filter */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                            <Folder size={12} />
                                            Folders
                                        </h4>
                                        <div className="space-y-1">
                                            <motion.button
                                                whileHover={{ x: 2 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedFolder(null)}
                                                className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-all ${selectedFolder === null
                                                    ? 'bg-blue-500/10 text-blue-400'
                                                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
                                                    }`}
                                            >
                                                All Folders
                                            </motion.button>
                                            {allFolders.map(folder => (
                                                <motion.button
                                                    key={folder}
                                                    whileHover={{ x: 2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setSelectedFolder(folder === selectedFolder ? null : folder)}
                                                    className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-all ${selectedFolder === folder
                                                        ? 'bg-blue-500/10 text-blue-400'
                                                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
                                                        }`}
                                                >
                                                    {folder}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Special Filters */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Special</h4>
                                        <div className="space-y-1">
                                            {/* Favorites filter removed as per requirements */}

                                            <motion.button
                                                whileHover={{ x: 2 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setIsPinnedOnly(!isPinnedOnly)}
                                                className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-all ${isPinnedOnly
                                                    ? 'bg-blue-500/10 text-blue-400'
                                                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
                                                    }`}
                                            >
                                                {isPinnedOnly ? <Pin size={14} fill="currentColor" /> : <Pin size={14} />}
                                                Pinned
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ x: 2 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setIsArchivedOnly(!isArchivedOnly)}
                                                className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-all ${isArchivedOnly
                                                    ? 'bg-blue-500/10 text-blue-400'
                                                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
                                                    }`}
                                            >
                                                {isArchivedOnly ? <Archive size={14} /> : <ArchiveX size={14} />}
                                                {isArchivedOnly ? 'Archived' : 'Unarchived'}
                                            </motion.button>

                                            {/* Clear Filters */}
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    setSelectedTags([]);
                                                    setSelectedFolder(null);
                                                    // setIsFavoriteOnly(false); // Removed as per requirements
                                                    setIsPinnedOnly(false);
                                                    setIsArchivedOnly(false);
                                                }}
                                                className="mt-2 w-full px-3 py-2 text-sm text-neutral-500 hover:text-neutral-300 transition-all text-left"
                                            >
                                                Clear Filters
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Notes Content */}
            {loading ? (
                <SkeletonList items={3} />
            ) : filteredNotes.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 flex-grow content-start">
                        <AnimatePresence mode="popLayout">
                            {filteredNotes.map((note) => (
                                <motion.div
                                    key={note.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.98 }}
                                    transition={{ duration: 0.4, ease: "easeOut", stiffness: 100, damping: 15 }}
                                    onClick={() => setSelectedNote(note)}
                                    className="group relative bg-gradient-to-br from-[#0f0f0f] via-[#111] to-[#0a0a0a] border border-white/5 rounded-2xl p-4 md:p-6 hover:border-blue-500/20 transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] backdrop-blur-sm overflow-hidden"
                                >
                                    {/* Enhanced background gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                                    {/* Animated border effect */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />

                                    <div className="relative z-10">
                                        {/* Header with enhanced actions */}
                                        <div className="flex items-start justify-between mb-4">
                                            <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                transition={{ type: "spring", stiffness: 300 }}
                                                className="p-3 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl text-blue-400 group-hover:bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:text-blue-300 transition-all duration-300 ring-1 ring-inset ring-white/5 group-hover:ring-blue-500/40 shadow-lg"
                                            >
                                                <FileText size={20} />
                                            </motion.div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                {note.is_pinned ? (
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => togglePinned(note.id)}
                                                        className="p-2 text-yellow-400 bg-yellow-400/10 rounded-lg transition-all duration-200 hover:bg-yellow-400/20 shadow-lg"
                                                        title="Unpin note"
                                                    >
                                                        <Pin size={16} fill="currentColor" />
                                                    </motion.button>
                                                ) : (
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, rotate: -5 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => togglePinned(note.id)}
                                                        className="p-2 text-neutral-500 bg-neutral-900/50 rounded-lg transition-all duration-200 hover:text-yellow-400 hover:bg-yellow-400/10 shadow-lg"
                                                        title="Pin note"
                                                    >
                                                        <Pin size={16} />
                                                    </motion.button>
                                                )}

                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => exportNote(note)}
                                                    className="p-2 text-neutral-500 bg-neutral-900/50 rounded-lg transition-all duration-200 hover:text-blue-400 hover:bg-blue-500/10 shadow-lg"
                                                    title="Export"
                                                >
                                                    <Download size={16} />
                                                </motion.button>
                                            </div>
                                        </div>

                                        {/* Enhanced Title */}
                                        {(note.title || note.video_title) && (
                                            <div className="flex items-center gap-3 mb-3">
                                                <motion.div
                                                    whileHover={{ scale: 1.05 }}
                                                    transition={{ type: "spring", stiffness: 300 }}
                                                >
                                                    {type === 'video' && <Video size={16} className="text-neutral-500" />}
                                                </motion.div>
                                                <motion.h3
                                                    whileHover={{ x: 5 }}
                                                    transition={{ type: "spring", stiffness: 300 }}
                                                    className="text-base md:text-lg font-semibold text-white truncate group-hover:text-blue-400 transition-colors duration-300"
                                                >
                                                    {note.title || note.video_title}
                                                </motion.h3>
                                            </div>
                                        )}

                                        {/* Enhanced Tags */}
                                        {note.tags && note.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {note.tags.slice(0, 3).map(tag => (
                                                    <motion.span
                                                        key={tag}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.1 }}
                                                        className="px-3 py-1 text-xs bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700/50 text-neutral-300 rounded-full transition-all duration-300 hover:bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:border-blue-500/30 hover:text-blue-300 shadow-sm"
                                                    >
                                                        {tag}
                                                    </motion.span>
                                                ))}
                                                {note.tags.length > 3 && (
                                                    <motion.span
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.1 }}
                                                        className="px-3 py-1 text-xs bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700/50 text-neutral-400 rounded-full transition-all duration-300 hover:bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:border-blue-500/30 hover:text-blue-300 shadow-sm"
                                                    >
                                                        +{note.tags.length - 3}
                                                    </motion.span>
                                                )}
                                            </div>
                                        )}

                                        {/* Enhanced Content Preview */}
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-neutral-400 text-sm line-clamp-3 mb-6 leading-relaxed group-hover:text-neutral-300 transition-colors duration-300"
                                        >
                                            {stripMarkdown(note.content)}
                                        </motion.p>

                                        {/* Enhanced Footer */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex items-center justify-between text-xs text-neutral-500 border-t border-white/5 pt-4"
                                        >
                                            <motion.div
                                                whileHover={{ x: -5 }}
                                                transition={{ type: "spring", stiffness: 300 }}
                                                className="flex items-center gap-2"
                                            >
                                                <Calendar size={14} />
                                                <span className="font-medium">{new Date(note.created_at).toLocaleDateString()}</span>
                                            </motion.div>
                                            {note.timestamp && (
                                                <motion.span
                                                    whileHover={{ scale: 1.05 }}
                                                    transition={{ type: "spring", stiffness: 300 }}
                                                    className="bg-gradient-to-r from-neutral-900 to-neutral-800 px-2 py-1 rounded text-neutral-400 flex items-center gap-2 border border-neutral-700/50 transition-all duration-300 hover:bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                                                >
                                                    <Clock size={12} />
                                                    <span className="font-medium">{Math.floor(note.timestamp / 60)}:{String(note.timestamp % 60).padStart(2, '0')}</span>
                                                </motion.span>
                                            )}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    // Enhanced List View
                    <div className="bg-[#111] border border-neutral-800 rounded-xl overflow-hidden flex-grow">
                        <table className="w-full">
                            <thead className="bg-neutral-900/50 border-b border-neutral-800">
                                <tr>
                                    <th className="text-left p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Title</th>
                                    <th className="text-left p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tags</th>
                                    <th className="text-left p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                                    <th className="text-left p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {filteredNotes.map((note) => (
                                    <motion.tr
                                        key={note.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className="group hover:bg-neutral-900/50 transition-colors cursor-pointer"
                                        onClick={() => setSelectedNote(note)}
                                    >
                                        <td className="p-4">
                                            <motion.div
                                                whileHover={{ x: 2 }}
                                                transition={{ type: "spring", stiffness: 300 }}
                                                className="flex items-center gap-3"
                                            >
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => togglePinned(note.id)}
                                                    className={`p-1.5 transition-all ${note.is_pinned ? 'text-yellow-400' : 'text-neutral-600 group-hover:text-neutral-400'}`}
                                                >
                                                    {note.is_pinned ? <Pin size={16} fill="currentColor" /> : <Pin size={16} />}
                                                </motion.button>
                                                <div>
                                                    <motion.div
                                                        whileHover={{ color: "#60a5fa" }}
                                                        transition={{ type: "spring", stiffness: 300 }}
                                                        className="font-medium text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors"
                                                    >
                                                        {note.title || note.video_title || 'Untitled Note'}
                                                    </motion.div>
                                                    <motion.div
                                                        whileHover={{ x: 2 }}
                                                        transition={{ type: "spring", stiffness: 300 }}
                                                        className="text-xs text-neutral-500 line-clamp-1 mt-0.5"
                                                    >
                                                        {stripMarkdown(note.content).substring(0, 60)}{stripMarkdown(note.content).length > 60 ? '...' : ''}
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        </td>
                                        <td className="p-4">
                                            {note.tags && note.tags.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {note.tags.slice(0, 2).map(tag => (
                                                        <motion.span
                                                            key={tag}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="px-2 py-1 text-xs bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700/50 text-neutral-300 rounded-full transition-all duration-200 hover:bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:border-blue-500/30 hover:text-blue-300"
                                                        >
                                                            {tag}
                                                        </motion.span>
                                                    ))}
                                                    {note.tags.length > 2 && (
                                                        <motion.span
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="px-2 py-1 text-xs bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700/50 text-neutral-400 rounded-full transition-all duration-200 hover:bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:border-blue-500/30 hover:text-blue-300"
                                                        >
                                                            +{note.tags.length - 2}
                                                        </motion.span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-neutral-600 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-neutral-400 text-sm">
                                            <motion.span
                                                whileHover={{ color: "#60a5fa" }}
                                                transition={{ type: "spring", stiffness: 300 }}
                                            >
                                                {new Date(note.created_at).toLocaleDateString()}
                                            </motion.span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                {/* Eye button removed as per requirements */}
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => exportNote(note)}
                                                    className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded-lg transition-colors"
                                                >
                                                    <Download size={16} />
                                                </motion.button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <EmptyState
                    icon={FileText}
                    title={`No ${type === 'video' ? 'video' : 'custom'} notes yet`}
                    description={searchQuery || selectedTags.length > 0 || selectedFolder || isPinnedOnly || isArchivedOnly
                        ? "Try adjusting your search or filters"
                        : type === 'video'
                            ? "Start taking notes while watching videos!"
                            : "Create your first study note!"}
                    action={type === 'custom' && !searchQuery && selectedTags.length === 0 && !selectedFolder && !isPinnedOnly && !isArchivedOnly ? {
                        label: "Create Note",
                        onClick: () => setIsCreating(true)
                    } : undefined}
                />
            )}

            {/* Note Preview Modal */}
            <AnimatePresence>
                {selectedNote && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90" onClick={() => setSelectedNote(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.3, ease: "easeOut", stiffness: 120, damping: 18 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#111] border border-neutral-800 rounded-2xl p-4 md:p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <motion.h3
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-xl font-bold text-white"
                                >
                                    {selectedNote.title || selectedNote.video_title || 'Note'}
                                </motion.h3>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedNote(null)}
                                    className="text-neutral-500 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </motion.button>
                            </div>

                            {/* Note metadata */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-wrap gap-4 mb-6 text-xs text-neutral-500 border-b border-neutral-800 pb-4"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    <span>{new Date(selectedNote.created_at).toLocaleString()}</span>
                                </div>
                                {selectedNote.timestamp && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={14} />
                                        <span>Timestamp: {Math.floor(selectedNote.timestamp / 60)}:{String(selectedNote.timestamp % 60).padStart(2, '0')}</span>
                                    </div>
                                )}
                            </motion.div>

                            {/* Tags */}
                            {selectedNote.tags && selectedNote.tags.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-wrap gap-2 mb-6"
                                >
                                    {selectedNote.tags.map(tag => (
                                        <motion.span
                                            key={tag}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="px-3 py-1 text-xs bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700/50 text-neutral-300 rounded-full transition-all duration-300 hover:bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:border-blue-500/30 hover:text-blue-300"
                                        >
                                            {tag}
                                        </motion.span>
                                    ))}
                                </motion.div>
                            )}

                            {/* Content */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="prose prose-invert max-w-none"
                            >
                                <MarkdownRenderer content={selectedNote.content} />
                            </motion.div>

                            {/* Attachments */}
                            {selectedNote.attachments && selectedNote.attachments.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-8 pt-6 border-t border-neutral-800"
                                >
                                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                        <Paperclip size={12} />
                                        Attachments
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedNote.attachments.map(attachment => (
                                            <motion.div
                                                key={attachment.id}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-2 rounded-lg"
                                            >
                                                <FileText size={16} className="text-neutral-500" />
                                                <span className="text-sm text-neutral-300 truncate max-w-xs">{attachment.name}</span>
                                                <motion.a
                                                    whileHover={{ x: 2 }}
                                                    href={attachment.url}
                                                    download
                                                    className="text-blue-400 hover:text-blue-300 text-sm font-medium ml-2"
                                                >
                                                    Download
                                                </motion.a>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Note Modal */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90" onClick={() => setIsCreating(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.3, ease: "easeOut", stiffness: 120, damping: 18 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#111] border border-neutral-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl"
                        >
                            <motion.h3
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-xl font-bold text-white mb-6"
                            >
                                Create New Note
                            </motion.h3>
                            <div className="space-y-4">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <label className="block text-sm font-medium text-neutral-400 mb-1.5">Title</label>
                                    <input
                                        type="text"
                                        value={newNoteTitle}
                                        onChange={(e) => setNewNoteTitle(e.target.value)}
                                        placeholder="Note title..."
                                        className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white outline-none transition-all placeholder-neutral-600"
                                        autoFocus
                                    />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <label className="block text-sm font-medium text-neutral-400 mb-1.5">Content</label>
                                    <textarea
                                        value={newNoteContent}
                                        onChange={(e) => setNewNoteContent(e.target.value)}
                                        placeholder="Write your notes here..."
                                        className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white outline-none resize-none h-48 transition-all placeholder-neutral-600"
                                    />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex gap-3 mt-6"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-xl font-medium transition-colors"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={createNote}
                                        disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Create Note
                                    </motion.button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};