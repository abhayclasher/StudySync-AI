import React from 'react';
import BlockMath from 'react-katex';
import { SingleCorrectMCQ } from '../../types';

interface SingleCorrectMCQRendererProps {
    question: SingleCorrectMCQ;
    selectedOption?: number;
    onAnswer: (index: number) => void;
}

const SingleCorrectMCQRenderer: React.FC<SingleCorrectMCQRendererProps> = ({
    question,
    selectedOption,
    onAnswer
}) => {
    return (
        <div className="space-y-4">
            <div className="text-lg md:text-xl text-white font-medium leading-relaxed mb-6">
                {question.question.includes('$') || question.question.includes('\\') ? (
                    <BlockMath>{question.question}</BlockMath>
                ) : (
                    question.question
                )}
            </div>

            <div className="space-y-3">
                {question.options.map((option, idx) => (
                    <button
                        key={idx}
                        onClick={() => onAnswer(idx)}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 group ${selectedOption === idx
                            ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50'
                            : 'bg-[#0a0a0a] border-white/10 hover:bg-white/5 hover:border-white/20'
                            }`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${selectedOption === idx
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-white/20 text-slate-400 group-hover:border-white/40'
                            }`}>
                            {String.fromCharCode(65 + idx)}
                        </div>
                        <div className="text-base text-slate-200 group-hover:text-white">
                            {option.includes('$') ? <BlockMath>{option}</BlockMath> : option}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SingleCorrectMCQRenderer;
