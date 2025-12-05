import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Sparkles, Upload, FileText, Image as ImageIcon, Loader2, Paperclip } from 'lucide-react';
import { performOCR } from '../../utils/ocr';

interface AIGeneratorModalProps {
    onClose: () => void;
    onGenerate: (prompt: string, context?: string) => void;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ onClose, onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedText, setExtractedText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setIsProcessing(true);

        try {
            if (selectedFile.type === 'application/pdf') {
                // Simple PDF text extraction simulation for now
                setExtractedText(`[PDF Content from ${selectedFile.name}]`);
            } else if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    if (event.target?.result) {
                        const text = await performOCR(event.target.result);
                        setExtractedText(text);
                    }
                };
                reader.readAsDataURL(selectedFile);
            }
        } catch (error) {
            console.error('File processing error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = () => {
        if (!prompt.trim() && !extractedText) return;
        onGenerate(prompt, extractedText);
    };

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="relative w-full max-w-lg bg-[#111] border-t md:border border-white/10 rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-bold text-white">Smart Note AI</h3>
                            <p className="text-[10px] md:text-xs text-neutral-400">Powered by Groq</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 md:p-6 space-y-4">
                    {/* Prompt Input */}
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="What do you want to learn about? (e.g. 'Explain Quantum Entanglement')"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 min-h-[120px] resize-none text-sm md:text-base"
                            autoFocus
                        />

                        {/* File Attachment Trigger */}
                        <div className="absolute bottom-3 right-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*,application/pdf"
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-2 rounded-lg transition-all flex items-center gap-2 ${file ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'}`}
                                title="Attach file for context"
                            >
                                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                                {file && <span className="text-xs max-w-[100px] truncate">{file.name}</span>}
                            </button>
                        </div>
                    </div>

                    {extractedText && (
                        <div className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                            <Sparkles size={12} />
                            Context extracted from {file?.name}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={(!prompt.trim() && !extractedText) || isProcessing}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        <Sparkles size={18} />
                        Generate Note
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};
