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
  Edit,
  Filter,
  Grid3X3,
 List,
  Tag,
  Folder,
  Star,
  StarOff,
  Clock,
  Image,
  Paperclip,
  X,
  MoreVertical
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
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}

interface EnhancedNotesManagerProps {
  type: 'video' | 'custom';
}

export const EnhancedNotesManager: React.FC<EnhancedNotesManagerProps> = ({ type }) => {
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

      return matchesSearch && matchesTag && matchesFolder && matchesPriority && matchesFavorite;
    });
  }, [notes, searchQuery, selectedTags, selectedFolder, selectedPriority, isFavoriteOnly]);

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
        h1 { font-size: ${isMobile ? '24px' : '28px'}; margin-bottom: 10px; border-bottom: 3px solid #333; padding-bottom: 10px; color: #1a1a; }
        h2 { font-size: ${isMobile ? '20px' : '24px'}; margin-top: ${isMobile ? '20px' : '24px'}; margin-bottom: ${isMobile ? '10px' : '12px'}; color: #2a2a2a; border-bottom: 2px solid #66; padding-bottom: 6px; }
        h3 { font-size: ${isMobile ? '18px' : '20px'}; margin-top: ${isMobile ? '16px' : '20px'}; margin-bottom: ${isMobile ? '8px' : '10px'}; color: #3a3a3a; }
        h4 { font-size: ${isMobile ? '16px' : '18px'}; margin-top: ${isMobile ? '14px' : '16px'}; margin-bottom: ${isMobile ? '6px' : '8px'}; color: #4a4a4a; }
        .meta { color: #666; font-size: ${isMobile ? '13px' : '14px'}; margin-bottom: ${isMobile ? '20px' : '30px'}; padding: 10px; background: #f5f5f5; border-left: 4px solid #333; }
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

  return (
    <div className="h-full flex flex-col">
      {/* Header with search and controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Search */}
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
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid3X3 size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <List size={20} />
            </button>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 rounded-lg ${isFilterOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Filter size={20} />
            </button>
          </div>
          
          {/* Create Button */}
          {type === 'custom' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-60 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/30 whitespace-nowrap"
            >
              <Plus size={20} />
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
              <div className="bg-[#0a0a0a]/50 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Tags Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                      <Tag size={14} />
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-2 py-1 text-xs rounded-full ${
                            selectedTags.includes(tag)
                              ? 'bg-emerald-60 text-white'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Folders Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                      <Folder size={14} />
                      Folders
                    </h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedFolder(null)}
                        className={`block w-full text-left px-2 py-1 text-sm rounded ${
                          selectedFolder === null
                            ? 'bg-emerald-600/20 text-emerald-400'
                            : 'text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        All Folders
                      </button>
                      {allFolders.map(folder => (
                        <button
                          key={folder}
                          onClick={() => setSelectedFolder(folder === selectedFolder ? null : folder)}
                          className={`block w-full text-left px-2 py-1 text-sm rounded ${
                            selectedFolder === folder
                              ? 'bg-emerald-600/20 text-emerald-400'
                              : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {folder}
                        </button>
                      ))}
                    </div>
                  
                  {/* Priority Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Priority</h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedPriority(null)}
                        className={`block w-full text-left px-2 py-1 text-sm rounded ${
                          selectedPriority === null
                            ? 'bg-emerald-600/20 text-emerald-400'
                            : 'text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        All Priorities
                      </button>
                      {(['low', 'medium', 'high'] as const).map(priority => (
                        <button
                          key={priority}
                          onClick={() => setSelectedPriority(priority === selectedPriority ? null : priority)}
                          className={`block w-full text-left px-2 py-1 text-sm rounded ${
                            selectedPriority === priority
                              ? 'bg-emerald-600/20 text-emerald-400'
                              : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Favorites Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Favorites</h4>
                    <button
                      onClick={() => setIsFavoriteOnly(!isFavoriteOnly)}
                      className={`flex items-center gap-2 w-full px-2 py-1 text-sm rounded ${
                        isFavoriteOnly
                          ? 'bg-emerald-600/20 text-emerald-400'
                          : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {isFavoriteOnly ? <Star size={14} /> : <StarOff size={14} />}
                      {isFavoriteOnly ? 'Show Favorites Only' : 'Show All Notes'}
                    </button>
                    
                    {/* Clear Filters */}
                    <button
                      onClick={() => {
                        setSelectedTags([]);
                        setSelectedFolder(null);
                        setSelectedPriority(null);
                        setIsFavoriteOnly(false);
                      }}
                      className="mt-2 w-full px-2 py-1 text-xs text-gray-400 hover:text-white rounded"
                    >
                      Clear Filters
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
        <SkeletonList items={3} />
      ) : filteredNotes.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 flex-grow">
            <AnimatePresence>
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  className="group relative bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-emerald-500/40 transition-all hover:shadow-2xl hover:shadow-emerald-50/20 overflow-hidden"
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative z-10">
                    {/* Header with actions */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <FileText size={20} />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleFavorite(note.id)}
                          className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                          title={note.is_favorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          {note.is_favorite ? <Star size={16} fill="currentColor" /> : <Star size={16} />}
                        </button>
                        <button
                          onClick={() => setSelectedNote(note)}
                          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="View Note"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => exportNote(note)}
                          className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                          title="Export"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-white/10 rounded-lg transition-all"
                          title="More options"
                        >
                          <MoreVertical size={16} />
                        </button>
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

                    {/* Tags */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {note.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag} 
                            className="px-2 py-0.5 text-xs bg-white/10 text-gray-300 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-xs bg-white/10 text-gray-400 rounded-full">
                            +{note.tags.length - 3}
                          </span>
                        )}
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
                        <span className="bg-white/5 px-2 py-1 rounded flex items-center gap-1">
                          <Clock size={10} />
                          {Math.floor(note.timestamp / 60)}:{String(note.timestamp % 60).padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    {/* Priority indicator */}
                    {note.priority && (
                      <div className="mt-2 flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          note.priority === 'high' ? 'bg-red-500' : 
                          note.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-50'
                        }`}></div>
                        <span className="text-xs text-gray-400 capitalize">{note.priority}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          // List View
          <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden flex-grow">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">Title</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Tags</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Priority</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotes.map((note) => (
                  <motion.tr
                    key={note.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleFavorite(note.id)}
                          className="p-1 text-gray-400 hover:text-yellow-400"
                        >
                          {note.is_favorite ? <Star size={16} fill="currentColor" /> : <Star size={16} />}
                        </button>
                        <div>
                          <div className="font-medium text-white">
                            {note.title || note.video_title || 'Untitled Note'}
                          </div>
                          <div className="text-sm text-gray-400 line-clamp-1">
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
                              className="px-2 py-0.5 text-xs bg-white/10 text-gray-300 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 2 && (
                            <span className="px-2 py-0.5 text-xs bg-white/10 text-gray-400 rounded-full">
                              +{note.tags.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">No tags</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-300">
                      {new Date(note.created_at).toLocaleDateString()}
                      {note.timestamp && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock size={10} />
                          {Math.floor(note.timestamp / 60)}:{String(note.timestamp % 60).padStart(2, '0')}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {note.priority && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          note.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          note.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            note.priority === 'high' ? 'bg-red-500' :
                            note.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}></div>
                          {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedNote(note)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-50/10 rounded-lg transition-all"
                          title="View Note"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => exportNote(note)}
                          className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                          title="Export"
                        >
                          <Download size={16} />
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
          description={searchQuery || selectedTags.length > 0 || selectedFolder || selectedPriority || isFavoriteOnly 
            ? "Try adjusting your search or filters" 
            : type === 'video' 
              ? "Start taking notes while watching videos!" 
              : "Create your first study note!"}
          action={type === 'custom' && !searchQuery && selectedTags.length === 0 && !selectedFolder && !selectedPriority && !isFavoriteOnly ? {
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
              className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{selectedNote.title || selectedNote.video_title || 'Note'}</h3>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Note metadata */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-400 border-b border-white/10 pb-4">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{new Date(selectedNote.created_at).toLocaleString()}</span>
                </div>
                {selectedNote.timestamp && (
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>Timestamp: {Math.floor(selectedNote.timestamp / 60)}:{String(selectedNote.timestamp % 60).padStart(2, '0')}</span>
                  </div>
                )}
                {selectedNote.priority && (
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      selectedNote.priority === 'high' ? 'bg-red-500' : 
                      selectedNote.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <span>Priority: {selectedNote.priority}</span>
                  </div>
                )}
              </div>
              
              {/* Tags */}
              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedNote.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-3 py-1 text-sm bg-white/10 text-gray-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Content */}
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{selectedNote.content}</p>
              </div>
              
              {/* Attachments */}
              {selectedNote.attachments && selectedNote.attachments.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                    <Paperclip size={14} />
                    Attachments
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNote.attachments.map(attachment => (
                      <div key={attachment.id} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-300 truncate max-w-xs">{attachment.name}</span>
                        <a 
                          href={attachment.url} 
                          download
                          className="text-emerald-400 hover:text-emerald-300 text-sm"
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
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-60 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30"
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