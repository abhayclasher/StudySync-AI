import React, { useState, useEffect } from 'react';
import BlockMath from 'react-katex';
import { Calculator } from 'lucide-react';
import { NumericalQuestion } from '../../types';

interface NumericalQuestionRendererProps {
    question: NumericalQuestion;
    currentAnswer?: string | number;
    onAnswer: (value: string) => void;
}

const NumericalQuestionRenderer: React.FC<NumericalQuestionRendererProps> = ({
    question,
    currentAnswer,
    onAnswer
}) => {
    const [inputValue, setInputValue] = useState(currentAnswer?.toString() || '');

    useEffect(() => {
        setInputValue(currentAnswer?.toString() || '');
    }, [currentAnswer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        onAnswer(val);
    };

    return (
        <div className="space-y-4">
            <div className="text-lg md:text-xl text-white font-medium leading-relaxed mb-6">
                {question.question.includes('$') || question.question.includes('\\') ? (
                    <BlockMath>{question.question}</BlockMath>
                ) : (
                    question.question
                )}
            </div>

            <div className="mt-4">
                <label className="block text-sm text-slate-400 mb-2">Enter your numerical answer:</label>
                <div className="flex gap-3 items-center">
                    <input
                        type="number"
                        value={inputValue}
                        onChange={handleChange}
                        placeholder="e.g. 42.5"
                        className="bg-[#0a0a0a] border border-white/20 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-blue-500 transition-all w-full md:w-1/2"
                    />
                    {question.unit && (
                        <span className="text-slate-400 font-medium">{question.unit}</span>
                    )}
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <Calculator size={12} />
                    {question.type === 'numerical-integer'
                        ? 'Enter an integer value'
                        : 'Enter integer or decimal value'}
                </p>
            </div>
        </div>
    );
};

export default NumericalQuestionRenderer;
