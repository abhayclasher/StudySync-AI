import React from 'react';
import {
    FolderOpen,
    Hash,
    Star,
    Archive,
    Video,
    FileText,
    Plus,
    Settings,
    ChevronDown,
    Search
} from 'lucide-react';


interface NoteSidebarProps {
    filter: { folder: string; tag: string | null; search: string };
    setFilter: React.Dispatch<React.SetStateAction<{ folder: string; tag: string | null; search: string }>>;
    onCreateNote: () => void;
    onOpenGenerator: () => void;
    allTags: string[];
}

export const NoteSidebar: React.FC<NoteSidebarProps> = ({
    filter,
    setFilter,
    onCreateNote,
    onOpenGenerator,
    allTags
}) => {
    const navItems = [
        { id: 'all', label: 'All Notes', icon: FileText },
        { id: 'favorites', label: 'Favorites', icon: Star },
        { id: 'video', label: 'Video Notes', icon: Video },
        { id: 'archived', label: 'Archived', icon: Archive },
    ];

    return (
        <div className="h-full flex flex-col p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <FileText className="text-white" size={18} />
                </div>
                <span className="font-bold text-lg text-white">Smart Notes</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mb-8">
                <button
                    onClick={onCreateNote}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                >
                    <Plus size={18} />
                    <span>New Note</span>
                </button>
                <button
                    onClick={onOpenGenerator}
                    className="w-full py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#222] text-neutral-300 hover:text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all border border-white/5 hover:border-white/10 active:scale-95"
                >
                    <span className="text-lg">✨</span>
                    <span>Generate with AI</span>
                </button>
            </div>

            {/* Navigation */}
            <div className="space-y-1 mb-8">
                <p className="px-2 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Library</p>
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setFilter({ ...filter, folder: item.id, tag: null })}
                        className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-all ${filter.folder === item.id && !filter.tag
                            ? 'bg-white/10 text-white'
                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <item.icon size={18} className={filter.folder === item.id && !filter.tag ? 'text-blue-400' : ''} />
                        <span className="text-sm font-medium">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Tags */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between px-2 mb-2">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Tags</p>
                </div>
                <div className="space-y-1">
                    {allTags.length > 0 ? (
                        allTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setFilter({ ...filter, tag: filter.tag === tag ? null : tag })}
                                className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-all ${filter.tag === tag
                                    ? 'bg-white/10 text-white'
                                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Hash size={16} className={filter.tag === tag ? 'text-purple-400' : 'text-neutral-600'} />
                                <span className="text-sm font-medium truncate">{tag}</span>
                            </button>
                        ))
                    ) : (
                        <p className="px-3 text-sm text-neutral-600 italic">No tags yet</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-white/5">
                {/* Settings button removed */}
            </div>
        </div>
    );
};
