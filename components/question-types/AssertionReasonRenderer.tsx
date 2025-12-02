import React from 'react';
import BlockMath from 'react-katex';
import { AssertionReasonQuestion } from '../../types';

interface AssertionReasonRendererProps {
    question: AssertionReasonQuestion;
    selectedOption?: number;
    onAnswer: (index: number) => void;
}

const AssertionReasonRenderer: React.FC<AssertionReasonRendererProps> = ({
    question,
    selectedOption,
    onAnswer
}) => {
    const renderText = (text: string) => {
        return text.includes('$') || text.includes('\\') ? (
            <BlockMath>{text}</BlockMath>
        ) : (
            text
        );
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 block">Assertion (A)</span>
                    <div className="text-lg text-white font-medium leading-relaxed">
                        {renderText(question.assertion)}
                    </div>
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 block">Reason (R)</span>
                    <div className="text-lg text-white font-medium leading-relaxed">
                        {renderText(question.reason)}
                    </div>
                </div>
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
                            {option}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AssertionReasonRenderer;
