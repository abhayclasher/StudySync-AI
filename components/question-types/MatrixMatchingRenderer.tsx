import React, { useState, useEffect } from 'react';
import BlockMath from 'react-katex';
import { MatrixMatchingQuestion } from '../../types';
import { ArrowRight, X } from 'lucide-react';

interface MatrixMatchingRendererProps {
    question: MatrixMatchingQuestion;
    currentMatches?: Record<string, string[]>;
    onAnswer: (matches: Record<string, string[]>) => void;
}

const MatrixMatchingRenderer: React.FC<MatrixMatchingRendererProps> = ({
    question,
    currentMatches = {},
    onAnswer
}) => {
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

    // Initialize matches if empty
    useEffect(() => {
        if (Object.keys(currentMatches).length === 0) {
            const initialMatches: Record<string, string[]> = {};
            question.columnA.forEach(item => {
                initialMatches[item.id] = [];
            });
            // Don't call onAnswer here to avoid infinite loops or premature updates
        }
    }, []);

    const handleMatch = (rightId: string) => {
        if (!selectedLeft) return;

        const newMatches = { ...currentMatches };
        const currentLeftMatches = newMatches[selectedLeft] || [];

        if (currentLeftMatches.includes(rightId)) {
            // Unmatch
            newMatches[selectedLeft] = currentLeftMatches.filter(id => id !== rightId);
        } else {
            // Match
            newMatches[selectedLeft] = [...currentLeftMatches, rightId];
        }

        onAnswer(newMatches);
        setSelectedLeft(null); // Deselect after matching
    };

    const removeMatch = (leftId: string, rightId: string) => {
        const newMatches = { ...currentMatches };
        if (newMatches[leftId]) {
            newMatches[leftId] = newMatches[leftId].filter(id => id !== rightId);
            onAnswer(newMatches);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-lg md:text-xl text-white font-medium leading-relaxed mb-4">
                <span className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                    Matrix Match
                </span>
                {question.question}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                {/* Column A (Left) */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-400 uppercase border-b border-white/10 pb-2">Column I</h4>
                    {question.columnA.map((item) => {
                        const isSelected = selectedLeft === item.id;
                        const matches = currentMatches[item.id] || [];

                        return (
                            <div key={item.id} className="relative">
                                <button
                                    onClick={() => setSelectedLeft(isSelected ? null : item.id)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${isSelected
                                            ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50'
                                            : 'bg-[#0a0a0a] border-white/10 hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400">
                                            {item.id}
                                        </span>
                                        <span className="text-sm text-slate-200">
                                            {item.text.includes('$') ? <BlockMath>{item.text}</BlockMath> : item.text}
                                        </span>
                                    </div>
                                    {isSelected && <ArrowRight size={16} className="text-indigo-400 animate-pulse" />}
                                </button>

                                {/* Display active matches for this item */}
                                {matches.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2 ml-2">
                                        {matches.map(matchId => {
                                            const matchText = question.columnB.find(b => b.id === matchId)?.text; // Or just ID
                                            return (
                                                <span key={matchId} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs border border-indigo-500/30">
                                                    {matchId}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeMatch(item.id, matchId); }}
                                                        className="hover:text-white"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Column B (Right) */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-400 uppercase border-b border-white/10 pb-2">Column II</h4>
                    {question.columnB.map((item) => {
                        const isTarget = selectedLeft !== null;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleMatch(item.id)}
                                disabled={!isTarget}
                                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${isTarget
                                        ? 'bg-[#0a0a0a] border-indigo-500/50 hover:bg-indigo-500/10 cursor-pointer'
                                        : 'bg-[#0a0a0a] border-white/10 opacity-70 cursor-default'
                                    }`}
                            >
                                <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400">
                                    {item.id}
                                </span>
                                <span className="text-sm text-slate-200">
                                    {item.text.includes('$') ? <BlockMath>{item.text}</BlockMath> : item.text}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <p className="text-xs text-slate-500 mt-4">
                * Click an item in Column I, then select corresponding item(s) in Column II.
            </p>
        </div>
    );
};

export default MatrixMatchingRenderer;
