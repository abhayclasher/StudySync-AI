import React, { useState } from 'react';
import BlockMath from 'react-katex';
import { ParagraphQuestion } from '../../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ParagraphQuestionRendererProps {
    question: ParagraphQuestion;
    answers?: Record<string, number>; // questionId -> selectedOptionIndex
    onAnswer: (questionId: string, optionIndex: number) => void;
}

const ParagraphQuestionRenderer: React.FC<ParagraphQuestionRendererProps> = ({
    question,
    answers = {},
    onAnswer
}) => {
    const [isParagraphCollapsed, setIsParagraphCollapsed] = useState(false);

    return (
        <div className="space-y-6">
            {/* Paragraph Section */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
                <div
                    className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center cursor-pointer"
                    onClick={() => setIsParagraphCollapsed(!isParagraphCollapsed)}
                >
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        Comprehension Paragraph
                    </span>
                    {isParagraphCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </div>

                {!isParagraphCollapsed && (
                    <div className="p-6 text-slate-300 leading-relaxed text-sm md:text-base max-h-60 overflow-y-auto custom-scrollbar">
                        {question.paragraph.split('\n').map((para, i) => (
                            <p key={i} className="mb-2 last:mb-0">
                                {para.includes('$') ? <BlockMath>{para}</BlockMath> : para}
                            </p>
                        ))}
                    </div>
                )}
            </div>

            {/* Sub-questions */}
            <div className="space-y-8">
                {question.questions.map((subQ, qIdx) => (
                    <div key={subQ.id || qIdx} className="space-y-4">
                        <div className="flex items-start gap-3">
                            <span className="text-sm font-bold text-slate-500 mt-1">Q{qIdx + 1}.</span>
                            <div className="text-base md:text-lg text-white font-medium">
                                {subQ.question.includes('$') ? <BlockMath>{subQ.question}</BlockMath> : subQ.question}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                            {subQ.options.map((option, optIdx) => {
                                const isSelected = answers[subQ.id] === optIdx;
                                return (
                                    <button
                                        key={optIdx}
                                        onClick={() => onAnswer(subQ.id, optIdx)}
                                        className={`text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${isSelected
                                                ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50'
                                                : 'bg-[#0a0a0a] border-white/10 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${isSelected
                                                ? 'bg-blue-500 border-blue-500 text-white'
                                                : 'border-white/20 text-slate-400'
                                            }`}>
                                            {String.fromCharCode(65 + optIdx)}
                                        </div>
                                        <div className="text-sm text-slate-300">
                                            {option.includes('$') ? <BlockMath>{option}</BlockMath> : option}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ParagraphQuestionRenderer;
