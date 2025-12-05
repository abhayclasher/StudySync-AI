import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save, X, Eye, PenLine, Maximize2, Minimize2,
    Clock, Sparkles, Check, ChevronDown, Trash2,
    Bold, Italic, Strikethrough, Code, List, ListOrdered,
    Quote, Heading1, Heading2, Link as LinkIcon, Image as ImageIcon,
    Undo, Redo, ExternalLink
} from 'lucide-react';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

import TurndownService from 'turndown';
import { marked } from 'marked';
import { Note } from './SmartNotesLayout';
import { editNoteContent } from '../../services/geminiService';

// Initialize Lowlight for syntax highlighting
const lowlight = createLowlight(common);

// Initialize Turndown service
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
});

interface NoteEditorModalProps {
    note: Note | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updates: Partial<Note>) => void;
    onDelete: () => void;
    onStartVideo?: (videoId: string, videoTitle: string) => void;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
    note,
    isOpen,
    onClose,
    onUpdate,
    onDelete,
    onStartVideo
}) => {
    const [title, setTitle] = useState('');
    const [isPreviewMode, setIsPreviewMode] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
    const [isProcessingAi, setIsProcessingAi] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    // Editor Setup - Memoize extensions to prevent duplicate extension warning
    const extensions = React.useMemo(() => [
        StarterKit.configure({
            codeBlock: false, // Disable default codeBlock to use lowlight
        }),
        Image,
        // Link is likely included in StarterKit or causing duplicates, removing explicit addition for now
        // If links break, we might need to re-add it or check StarterKit config
        Placeholder.configure({
            placeholder: 'Start writing your amazing notes...',
        }),
        CodeBlockLowlight.configure({
            lowlight,
        }),
    ], []);

    const editor = useEditor({
        extensions,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-2',
            },
        },
        onUpdate: ({ editor }) => {
            // Auto-save logic handled in useEffect
        },
    });

    // Handle Read-Only Mode
    useEffect(() => {
        if (editor) {
            editor.setEditable(!isPreviewMode);
        }
    }, [editor, isPreviewMode]);

    // Load Note Content & Handle Typewriter
    useEffect(() => {
        if (note && editor) {
            setTitle(note.title);
            setLastSaved(new Date(note.updated_at));

            const fullContent = marked.parse(note.content) as string;
            const currentContent = editor.getHTML();

            // Check if we should trigger typewriter effect
            // Trigger if:
            // 1. We are not currently typing
            // 2. The new content is different from current
            // 3. The previous content was the "AI is writing" placeholder OR we just opened the modal with AI content
            // 4. The new content is NOT the placeholder
            const isPlaceholder = currentContent.includes('AI is writing') || note.content === 'AI is writing your note...';
            const isNewContentValid = note.content !== 'AI is writing your note...' && note.content.length > 20;

            if (isNewContentValid && (isPlaceholder)) {
                startTypewriter(fullContent);
            } else if (currentContent !== fullContent && !isTyping && !isProcessingAi) {
                // Normal update without animation (e.g. loading existing note)
                editor.commands.setContent(fullContent);
            }
        }
    }, [note, editor, isProcessingAi]);

    const startTypewriter = async (htmlContent: string) => {
        if (!editor) return;
        setIsTyping(true);
        editor.setEditable(false); // Disable editing during animation
        editor.commands.setContent('');

        // "Stream" simulation:
        // Split by words, but we must be careful with HTML tags.
        const tokens = htmlContent.split(/(<[^>]+>| )/g).filter(Boolean);

        let currentBuffer = '';

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            currentBuffer += token;

            if (i % 5 === 0 || i === tokens.length - 1) {
                editor.commands.setContent(currentBuffer);
                // Scroll to bottom
                editor.commands.scrollIntoView();
                await new Promise(r => setTimeout(r, 10)); // Fast typing
            }
        }

        editor.commands.setContent(htmlContent); // Ensure final state is perfect
        editor.setEditable(!isPreviewMode);
        setIsTyping(false);
    };

    // Auto-save effect
    useEffect(() => {
        if (!note || !isOpen || !editor || isProcessingAi) return;

        const timer = setTimeout(() => {
            const html = editor.getHTML();
            const markdownContent = turndownService.turndown(html);

            // Don't save if it's the placeholder text
            if (markdownContent.includes('AI is writing your note')) return;

            if (title !== note.title || markdownContent !== note.content) {
                onUpdate({ title, content: markdownContent });
                setLastSaved(new Date());
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [title, note, isOpen, editor?.getHTML(), isProcessingAi]);

    const handleAiEdit = async (instruction: 'shorten' | 'simplify' | 'fix_grammar' | 'expand') => {
        if (!editor) return;

        setIsProcessingAi(true);
        setIsAiMenuOpen(false);
        try {
            // Get selected text or full document
            const { from, to, empty } = editor.state.selection;
            const textToEdit = empty ? editor.getHTML() : editor.state.doc.textBetween(from, to, ' ');

            // Convert to Markdown for AI
            const markdownInput = turndownService.turndown(textToEdit);

            // Send to AI
            const newMarkdown = await editNoteContent(markdownInput, instruction);

            // Convert back to HTML
            const newHtml = marked.parse(newMarkdown) as string;

            if (empty) {
                editor.commands.setContent(newHtml);
            } else {
                editor.commands.insertContent(newHtml);
            }
        } catch (error) {
            console.error("AI Edit Failed", error);
        } finally {
            setIsProcessingAi(false);
        }
    };

    const addImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            if (input.files?.length) {
                const file = input.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (typeof e.target?.result === 'string') {
                        editor?.chain().focus().setImage({ src: e.target.result }).run();
                    }
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const setLink = () => {
        const previousUrl = editor?.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // update
        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    if (!isOpen || !note) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0
                }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`relative bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden flex flex-col
                    ${isFullscreen ? 'rounded-none h-full w-full' : 'rounded-2xl w-full max-w-5xl h-[85vh] md:h-[85vh]'}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center flex-1 mr-4 overflow-hidden">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-transparent text-lg md:text-xl font-bold text-white focus:outline-none placeholder-neutral-600 flex-1 min-w-0"
                            placeholder="Note Title"
                            readOnly={isPreviewMode}
                        />
                        {/* Video Link */}
                        {note.video_id && (
                            <button
                                onClick={() => onStartVideo?.(note.video_id!, note.video_title || 'Video')}
                                className="ml-3 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded-full whitespace-nowrap transition-colors"
                            >
                                <ExternalLink size={12} />
                                <span className="hidden sm:inline">{note.video_title || 'Watch Video'}</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-neutral-500 hidden md:flex items-center gap-1 mr-2">
                            <Clock size={12} />
                            {lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Unsaved'}
                        </span>

                        {/* AI Edit Button */}
                        {!isPreviewMode && (
                            <div className="relative">
                                <button
                                    onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
                                    className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${isAiMenuOpen ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-neutral-400 hover:text-white'}`}
                                    title="AI Edit"
                                >
                                    <Sparkles size={16} />
                                    <span className="hidden md:inline text-xs font-medium">AI Edit</span>
                                    <ChevronDown size={12} />
                                </button>
                                <AnimatePresence>
                                    {isAiMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full right-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                                        >
                                            <div className="p-1">
                                                {['shorten', 'simplify', 'fix_grammar', 'expand'].map((action) => (
                                                    <button
                                                        key={action}
                                                        onClick={() => handleAiEdit(action as any)}
                                                        className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 hover:text-white rounded-lg flex items-center gap-2 capitalize"
                                                    >
                                                        {action.replace('_', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        <button
                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2 ${!isPreviewMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-[#111] border border-white/10 text-neutral-400 hover:text-white'}`}
                        >
                            {isPreviewMode ? <PenLine size={16} /> : <Eye size={16} />}
                            <span className="hidden md:inline text-xs font-medium">{isPreviewMode ? 'Edit' : 'Preview'}</span>
                        </button>

                        <div className="h-6 w-px bg-white/10 mx-1" />

                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="hidden md:block p-2 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-all"
                        >
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-neutral-400 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                {!isPreviewMode && editor && (
                    <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5 bg-[#111] overflow-x-auto scrollbar-hide">
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            isActive={editor.isActive('bold')}
                            icon={<Bold size={16} />}
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            isActive={editor.isActive('italic')}
                            icon={<Italic size={16} />}
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            isActive={editor.isActive('strike')}
                            icon={<Strikethrough size={16} />}
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleCode().run()}
                            isActive={editor.isActive('code')}
                            icon={<Code size={16} />}
                        />
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            isActive={editor.isActive('heading', { level: 1 })}
                            icon={<Heading1 size={16} />}
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            isActive={editor.isActive('heading', { level: 2 })}
                            icon={<Heading2 size={16} />}
                        />
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            isActive={editor.isActive('bulletList')}
                            icon={<List size={16} />}
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            isActive={editor.isActive('orderedList')}
                            icon={<ListOrdered size={16} />}
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            isActive={editor.isActive('blockquote')}
                            icon={<Quote size={16} />}
                        />
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <ToolbarButton
                            onClick={setLink}
                            isActive={editor.isActive('link')}
                            icon={<LinkIcon size={16} />}
                        />
                        <ToolbarButton
                            onClick={addImage}
                            isActive={false}
                            icon={<ImageIcon size={16} />}
                        />
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().undo().run()}
                            isActive={false}
                            icon={<Undo size={16} />}
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().redo().run()}
                            isActive={false}
                            icon={<Redo size={16} />}
                        />
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col relative bg-[#050505]">
                    {/* Loading Overlay for AI */}
                    {isProcessingAi && (
                        <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <div className="bg-[#111] border border-white/10 rounded-xl p-4 flex items-center gap-3 shadow-2xl">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                <span className="text-sm font-medium text-white">AI is refining your note...</span>
                            </div>
                        </div>
                    )}

                    {/* Editor */}
                    {/* Fixed: Removed pointer-events-none to allow scrolling in preview mode */}
                    <div className={`flex-1 h-full overflow-y-auto custom-scrollbar`}>
                        <EditorContent editor={editor} className="h-full" />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/5 bg-[#0a0a0a] flex justify-between items-center text-xs text-neutral-500">
                    <div>
                        {editor?.storage.characterCount?.characters() || 0} characters
                    </div>
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this note?')) {
                                onDelete();
                                onClose();
                            }
                        }}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 size={14} /> Delete Note
                    </button>
                </div>
            </motion.div>

            {/* Tiptap Styles */}
            <style>{`
                .ProseMirror {
                    min-height: 100%;
                    outline: none;
                    color: #e5e5e5;
                }
                .ProseMirror p {
                    margin-bottom: 1em;
                    line-height: 1.6;
                }
                .ProseMirror h1 {
                    font-size: 2em;
                    font-weight: bold;
                    margin-top: 1em;
                    margin-bottom: 0.5em;
                    color: #fff;
                }
                .ProseMirror h2 {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin-top: 1em;
                    margin-bottom: 0.5em;
                    color: #fff;
                }
                .ProseMirror ul, .ProseMirror ol {
                    padding-left: 1.5em;
                    margin-bottom: 1em;
                }
                .ProseMirror ul {
                    list-style-type: disc;
                }
                .ProseMirror ol {
                    list-style-type: decimal;
                }
                .ProseMirror blockquote {
                    border-left: 3px solid #3b82f6;
                    padding-left: 1em;
                    margin-left: 0;
                    font-style: italic;
                    color: #a3a3a3;
                }
                .ProseMirror pre {
                    background: #161616;
                    padding: 1em;
                    border-radius: 0.5em;
                    overflow-x: auto;
                    font-family: monospace;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .ProseMirror code {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 0.2em 0.4em;
                    border-radius: 0.25em;
                    font-family: monospace;
                    font-size: 0.9em;
                    color: #60a5fa;
                }
                .ProseMirror pre code {
                    background: none;
                    padding: 0;
                    color: inherit;
                }
                .ProseMirror img {
                    max-width: 100%;
                    border-radius: 0.5em;
                    margin: 1em 0;
                }
                .ProseMirror a {
                    color: #60a5fa;
                    text-decoration: underline;
                    cursor: pointer;
                }
                /* Placeholder */
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #525252;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
            `}</style>
        </div>,
        document.body
    );
};

const ToolbarButton = ({ onClick, isActive, icon }: { onClick: () => void, isActive: boolean, icon: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`p-2 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
    >
        {icon}
    </button>
);
