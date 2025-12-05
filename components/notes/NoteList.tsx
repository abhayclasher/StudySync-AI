import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Pin, Video, FileText, MoreVertical, Trash2, Archive } from 'lucide-react';
import { Note } from './SmartNotesLayout';

interface NoteListProps {
    notes: Note[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    isLoading: boolean;
}

export const NoteList: React.FC<NoteListProps> = ({ notes, selectedId, onSelect, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-neutral-500">Loading notes...</p>
            </div>
        );
    }

    if (notes.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                    <FileText className="text-neutral-600" size={32} />
                </div>
                <h3 className="text-white font-medium mb-1">No notes found</h3>
                <p className="text-sm text-neutral-500">Create a new note or generate one with AI to get started.</p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {notes.map((note) => (
                <motion.button
                    key={note.id}
                    layoutId={`note-${note.id}`}
                    onClick={() => onSelect(note.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all group relative border ${selectedId === note.id
                            ? 'bg-blue-600/10 border-blue-500/50'
                            : 'bg-transparent border-transparent hover:bg-[#111] hover:border-white/5'
                        }`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-semibold truncate pr-4 ${selectedId === note.id ? 'text-blue-400' : 'text-white'}`}>
                            {note.title || 'Untitled Note'}
                        </h3>
                        <span className="text-xs text-neutral-500 shrink-0 whitespace-nowrap">
                            {formatDate(note.updated_at)}
                        </span>
                    </div>

                    <p className="text-sm text-neutral-400 line-clamp-2 mb-3 h-10">
                        {note.content.replace(/[#*`]/g, '') || 'No content...'}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {note.type === 'video' && (
                                <div className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">
                                    <Video size={10} /> Video
                                </div>
                            )}
                            {note.is_pinned && (
                                <div className="flex items-center gap-1 text-[10px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20">
                                    <Pin size={10} /> Pinned
                                </div>
                            )}
                            {note.tags && note.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[10px] bg-white/5 text-neutral-400 px-1.5 py-0.5 rounded border border-white/5">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.button>
            ))}
        </div>
    );
};
