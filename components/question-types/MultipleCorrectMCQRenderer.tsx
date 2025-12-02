import React from 'react';
import BlockMath from 'react-katex';
import { MultipleCorrectQuestion } from '../../types';
import { CheckSquare, Square } from 'lucide-react';

interface MultipleCorrectMCQRendererProps {
    question: MultipleCorrectQuestion;
    selectedOptions?: number[];
    onAnswer: (indices: number[]) => void;
}

const MultipleCorrectMCQRenderer: React.FC<MultipleCorrectMCQRendererProps> = ({
    question,
    selectedOptions = [],
    onAnswer
}) => {
    const toggleOption = (index: number) => {
        if (selectedOptions.includes(index)) {
            onAnswer(selectedOptions.filter(i => i !== index));
        } else {
            onAnswer([...selectedOptions, index].sort());
        }
    };

    return (
        <div className="space-y-4">
            <div className="text-lg md:text-xl text-white font-medium leading-relaxed mb-6">
                <span className="block text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                    Multiple Correct Options
                </span>
                {question.question.includes('$') || question.question.includes('\\') ? (
                    <BlockMath>{question.question}</BlockMath>
                ) : (
                    question.question
                )}
            </div>

            <div className="space-y-3">
                {question.options.map((option, idx) => {
                    const isSelected = selectedOptions.includes(idx);
                    return (
                        <button
                            key={idx}
                            onClick={() => toggleOption(idx)}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 group ${isSelected
                                ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500/50'
                                : 'bg-[#0a0a0a] border-white/10 hover:bg-white/5 hover:border-white/20'
                                }`}
                        >
                            <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${isSelected
                                ? 'bg-purple-500 text-white'
                                : 'bg-transparent border border-slate-500 text-transparent group-hover:border-slate-400'
                                }`}>
                                <CheckSquare size={16} />
                            </div>
                            <div className="text-base text-slate-200 group-hover:text-white flex-1">
                                {option.includes('$') ? <BlockMath>{option}</BlockMath> : option}
                            </div>
                        </button>
                    );
                })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
                * Select all correct options. Partial marking may apply.
            </p>
        </div>
    );
};

export default MultipleCorrectMCQRenderer;
