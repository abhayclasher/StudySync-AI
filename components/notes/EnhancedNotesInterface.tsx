import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Calendar,
  Video,
  Trash2,
  Download,
  Eye,
  Plus,
  Filter,
  Grid3X3,
  List,
  Tag,
  Folder,
  Star,
  StarOff,
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
  priority?: 'low' | 'medium' | 'high';
  is_favorite?: boolean;
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
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFavoriteOnly, setIsFavoriteOnly] = useState(false);
  const [isArchivedOnly, setIsArchivedOnly] = useState(false);
  const [isPinnedOnly, setIsPinnedOnly] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

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

      // Priority filter
      const matchesPriority = !selectedPriority || note.priority === selectedPriority;

      // Favorite filter
      const matchesFavorite = !isFavoriteOnly || note.is_favorite;

      // Archived filter
      const matchesArchived = !isArchivedOnly || note.is_archived;

      // Pinned filter
      const matchesPinned = !isPinnedOnly || note.is_pinned;

      return matchesSearch && matchesTag && matchesFolder && matchesPriority && matchesFavorite && matchesArchived && matchesPinned;
    });
  }, [notes, searchQuery, selectedTags, selectedFolder, selectedPriority, isFavoriteOnly, isArchivedOnly, isPinnedOnly]);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Toggle note favorite status
  const toggleFavorite = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const updatedNotes = notes.map(n =>
      n.id === noteId ? { ...n, is_favorite: !n.is_favorite } : n
    );
    setNotes(updatedNotes);

    // Update in database
    if (supabase) {
      const table = type === 'video' ? 'video_notes' : 'custom_notes';
      await supabase
        .from(table)
        .update({ is_favorite: !note.is_favorite })
        .eq('id', noteId);
    }
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
            is_favorite: false,
            is_archived: false,
            tags: [],
            priority: 'medium'
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
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
      html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

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
        body { font-family: system-ui, sans-serif; padding: ${isMobile ? '20px' : '40px'}; line-height: 1.6; color: #000; max-width: ${isMobile ? '100%' : '800px'}; margin: 0 auto; background: #fff; }
        h1 { font-size: ${isMobile ? '24px' : '28px'}; margin-bottom: 10px; border-bottom: 3px solid #33; padding-bottom: 10px; color: #1a1a; }
        h2 { font-size: ${isMobile ? '20px' : '24px'}; margin-top: ${isMobile ? '20px' : '24px'}; margin-bottom: ${isMobile ? '10px' : '12px'}; color: #2a2a2a; border-bottom: 2px solid #666; padding-bottom: 6px; }
        h3 { font-size: ${isMobile ? '18px' : '20px'}; margin-top: ${isMobile ? '16px' : '20px'}; margin-bottom: ${isMobile ? '8px' : '10px'}; color: #3a3a3a; }
        h4 { font-size: ${isMobile ? '16px' : '18px'}; margin-top: ${isMobile ? '14px' : '16px'}; margin-bottom: ${isMobile ? '6px' : '8px'}; color: #4a4a4a; }
        .meta { color: #666; font-size: ${isMobile ? '13px' : '14px'}; margin-bottom: ${isMobile ? '20px' : '30px'}; padding: 10px; background: #f5f5f5; border-left: 4px solid #33; }
        .content { white-space: pre-wrap; word-wrap: break-word; }
        p { margin: ${isMobile ? '10px' : '12px'} 0; }
        strong { font-weight: 700; color: #000; }
        em { font-style: italic; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', Consolas, monospace; font-size: ${isMobile ? '13px' : '14px'}; color: #333; border: 1px solid #ddd; }
        pre { background: #f8f8; border: 1px solid #ddd; border-radius: 4px; padding: ${isMobile ? '12px' : '16px'}; overflow-x: auto; margin: ${isMobile ? '12px' : '16px'} 0; }
        pre code { background: none; padding: 0; color: #333; border: none; }
        ul, ol { margin: ${isMobile ? '10px' : '12px'} 0; padding-left: ${isMobile ? '25px' : '30px'}; }
        li { margin: ${isMobile ? '5px' : '6px'} 0; }
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
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
            >
              <List size={18} />
            </button>

            <div className="w-px h-6 bg-neutral-800 mx-1"></div>

            {/* Filter Toggle */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 rounded-lg transition-all ${isFilterOpen ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
            >
              <Filter size={18} />
            </button>
          </div>

          {/* Create Button */}
          {type === 'custom' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-900/20 whitespace-nowrap"
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
              className="overflow-hidden"
            >
              <div className="bg-[#111] border border-neutral-800 rounded-xl p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Tags Filter */}
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <Tag size={12} />
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${selectedTags.includes(tag)
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
                            }`}
                        >
                          {tag}
                        </button>
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
                      <button
                        onClick={() => setSelectedFolder(null)}
                        className={`block w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors ${selectedFolder === null
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
                          }`}
                      >
                        All Folders
                      </button>
                      {allFolders.map(folder => (
                        <button
                          key={folder}
                          onClick={() => setSelectedFolder(folder === selectedFolder ? null : folder)}
                          className={`block w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors ${selectedFolder === folder
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
                            }`}
                        >
                          {folder}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority Filter */}
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Priority</h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedPriority(null)}
                        className={`block w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors ${selectedPriority === null
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
                          }`}
                      >
                        All Priorities
                      </button>
                      {(['low', 'medium', 'high'] as const).map(priority => (
                        <button
                          key={priority}
                          onClick={() => setSelectedPriority(priority === selectedPriority ? null : priority)}
                          className={`block w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors ${selectedPriority === priority
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
                            }`}
                        >
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Special Filters */}
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Special</h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => setIsFavoriteOnly(!isFavoriteOnly)}
                        className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-sm rounded-md transition-colors ${isFavoriteOnly
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
                          }`}
                      >
                        {isFavoriteOnly ? <Star size={14} fill="currentColor" /> : <Star size={14} />}
                        Favorites
                      </button>

                      <button
                        onClick={() => setIsPinnedOnly(!isPinnedOnly)}
                        className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-sm rounded-md transition-colors ${isPinnedOnly
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
                          }`}
                      >
                        {isPinnedOnly ? <Pin size={14} fill="currentColor" /> : <Pin size={14} />}
                        Pinned
                      </button>

                      <button
                        onClick={() => setIsArchivedOnly(!isArchivedOnly)}
                        className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-sm rounded-md transition-colors ${isArchivedOnly
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
                          }`}
                      >
                        {isArchivedOnly ? <Archive size={14} /> : <ArchiveX size={14} />}
                        {isArchivedOnly ? 'Archived' : 'Unarchived'}
                      </button>

                      {/* Clear Filters */}
                      <button
                        onClick={() => {
                          setSelectedTags([]);
                          setSelectedFolder(null);
                          setSelectedPriority(null);
                          setIsFavoriteOnly(false);
                          setIsPinnedOnly(false);
                          setIsArchivedOnly(false);
                        }}
                        className="mt-2 w-full px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors text-left"
                      >
                        Clear Filters
                      </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow content-start">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group relative bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-xl p-5 hover:border-blue-500/20 transition-all shadow-sm hover:shadow-lg hover:shadow-black/40"
                >
                  <div className="relative z-10">
                    {/* Header with actions */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-neutral-900 rounded-lg text-blue-400 group-hover:bg-blue-500/10 group-hover:text-blue-300 transition-colors ring-1 ring-inset ring-white/5 group-hover:ring-blue-500/20">
                        <FileText size={18} />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {note.is_pinned ? (
                          <button
                            onClick={() => togglePinned(note.id)}
                            className="p-1.5 text-yellow-400 hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Unpin note"
                          >
                            <Pin size={14} fill="currentColor" />
                          </button>
                        ) : (
                          <button
                            onClick={() => togglePinned(note.id)}
                            className="p-1.5 text-neutral-500 hover:text-yellow-400 hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Pin note"
                          >
                            <Pin size={14} />
                          </button>
                        )}

                        {note.is_favorite ? (
                          <button
                            onClick={() => toggleFavorite(note.id)}
                            className="p-1.5 text-yellow-400 hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Remove from favorites"
                          >
                            <Star size={14} fill="currentColor" />
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleFavorite(note.id)}
                            className="p-1.5 text-neutral-500 hover:text-yellow-400 hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Add to favorites"
                          >
                            <Star size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedNote(note)}
                          className="p-1.5 text-neutral-500 hover:text-blue-400 hover:bg-neutral-800 rounded-lg transition-colors"
                          title="View Note"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={() => exportNote(note)}
                          className="p-1.5 text-neutral-500 hover:text-blue-400 hover:bg-neutral-800 rounded-lg transition-colors"
                          title="Export"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    {(note.title || note.video_title) && (
                      <div className="flex items-center gap-2 mb-2">
                        {type === 'video' && <Video size={12} className="text-neutral-500" />}
                        <h3 className="text-base font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                          {note.title || note.video_title}
                        </h3>
                      </div>
                    )}

                    {/* Tags */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {note.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-500 rounded-full">
                            +{note.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Content Preview */}
                    <p className="text-neutral-400 text-sm line-clamp-3 mb-4 leading-relaxed">
                      {note.content}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-neutral-500 mt-auto pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                      {note.timestamp && (
                        <span className="bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-400 flex items-center gap-1 border border-neutral-800">
                          <Clock size={10} />
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
          // List View
          <div className="bg-[#111] border border-neutral-800 rounded-xl overflow-hidden flex-grow">
            <table className="w-full">
              <thead className="bg-neutral-900/50 border-b border-neutral-800">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Title</th>
                  <th className="text-left p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tags</th>
                  <th className="text-left p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                  <th className="text-left p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredNotes.map((note) => (
                  <motion.tr
                    key={note.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-neutral-900/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePinned(note.id)}
                          className={`p-1 transition-colors ${note.is_pinned ? 'text-yellow-400' : 'text-neutral-600 group-hover:text-neutral-400'}`}
                        >
                          {note.is_pinned ? <Pin size={14} fill="currentColor" /> : <Pin size={14} />}
                        </button>
                        <div>
                          <div className="font-medium text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                            {note.title || note.video_title || 'Untitled Note'}
                          </div>
                          <div className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                            {note.content.substring(0, 60)}{note.content.length > 60 ? '...' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {note.tags && note.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 2 && (
                            <span className="px-2 py-0.5 text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-500 rounded-full">
                              +{note.tags.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 text-neutral-400 text-sm">
                      {new Date(note.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {note.priority && (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${note.priority === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          note.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}>
                          <div className={`w-1 h-1 rounded-full ${note.priority === 'high' ? 'bg-red-400' :
                            note.priority === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                            }`}></div>
                          <span className="capitalize">{note.priority}</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedNote(note)}
                          className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => exportNote(note)}
                          className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                          <Download size={14} />
                        </button>
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
          description={searchQuery || selectedTags.length > 0 || selectedFolder || selectedPriority || isFavoriteOnly || isPinnedOnly || isArchivedOnly
            ? "Try adjusting your search or filters"
            : type === 'video'
              ? "Start taking notes while watching videos!"
              : "Create your first study note!"}
          action={type === 'custom' && !searchQuery && selectedTags.length === 0 && !selectedFolder && !selectedPriority && !isFavoriteOnly && !isPinnedOnly && !isArchivedOnly ? {
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
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111] border border-neutral-800 rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{selectedNote.title || selectedNote.video_title || 'Note'}</h3>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Note metadata */}
              <div className="flex flex-wrap gap-4 mb-6 text-xs text-neutral-500 border-b border-neutral-800 pb-4">
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
                {selectedNote.priority && (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedNote.priority === 'high' ? 'bg-red-500' :
                      selectedNote.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                    <span className="capitalize">Priority: {selectedNote.priority}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedNote.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-xs bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="prose prose-invert max-w-none">
                <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">{selectedNote.content}</p>
              </div>

              {/* Attachments */}
              {selectedNote.attachments && selectedNote.attachments.length > 0 && (
                <div className="mt-8 pt-6 border-t border-neutral-800">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <Paperclip size={12} />
                    Attachments
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNote.attachments.map(attachment => (
                      <div key={attachment.id} className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-2 rounded-lg">
                        <FileText size={16} className="text-neutral-500" />
                        <span className="text-sm text-neutral-300 truncate max-w-xs">{attachment.name}</span>
                        <a
                          href={attachment.url}
                          download
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium ml-2"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
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
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111] border border-neutral-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-6">Create New Note</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white outline-none transition-all placeholder-neutral-600"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5">Content</label>
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Write your notes here..."
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white outline-none resize-none h-48 transition-all placeholder-neutral-600"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNote}
                    disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Note
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};