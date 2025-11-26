import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, CheckCircle, Brain } from 'lucide-react';
import { Flashcard, updateCardProgress } from '../services/db';
// import confetti from 'canvas-confetti'; // Disabled - package not installed

interface StudyModeProps {
    cards: Flashcard[];
    onClose: () => void;
}

export const StudyMode: React.FC<StudyModeProps> = ({ cards, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [reviewedCount, setReviewedCount] = useState(0);
    const [dragX, setDragX] = useState(0);
    const cardRef = useRef<HTMLDivElement>(null);

    const currentCard = cards[currentIndex];
    const progress = ((currentIndex) / cards.length) * 100;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (sessionComplete) return;

            if (e.code === 'Space') {
                if (!isFlipped) setIsFlipped(true);
            } else if (isFlipped) {
                if (e.key === '1') handleGrade(1); // Again
                if (e.key === '2') handleGrade(3); // Hard
                if (e.key === '3') handleGrade(4); // Good
                if (e.key === '4') handleGrade(5); // Easy
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFlipped, currentIndex, sessionComplete]);

    const handleGrade = async (grade: number) => {
        // Update card in DB
        await updateCardProgress(currentCard.id, grade);

        setReviewedCount(prev => prev + 1);

        if (currentIndex < cards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
        } else {
            setSessionComplete(true);
            // confetti({  // Disabled - canvas-confetti not installed
            //     particleCount: 100,
            //     spread: 70,
            //     origin: { y: 0.6 }
            // });
        }
    };

    if (sessionComplete) {
        return (
            <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#111] border border-neutral-800 rounded-2xl p-8 max-w-md w-full text-center space-y-6"
                >
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
                        <CheckCircle size={40} />
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Session Complete!</h2>
                        <p className="text-neutral-400">You reviewed {reviewedCount} cards.</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors"
                    >
                        Back to Deck
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-[#111]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        aria-label="Close study mode"
                        className="text-neutral-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded p-1"
                    >
                        <X size={24} aria-hidden="true" />
                    </button>
                    <div className="text-sm font-medium text-neutral-400">
                        Card {currentIndex + 1} of {cards.length}
                    </div>
                </div>
                <div className="w-32 h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Card Area */}
            <div className="flex-1 flex items-center justify-center p-6 perspective-1000">
                <motion.div
                    ref={cardRef}
                    className="relative w-full max-w-3xl aspect-[3/2] cursor-pointer preserve-3d"
                    onClick={() => !isFlipped && setIsFlipped(true)}
                    onKeyDown={(e) => {
                        if (e.code === 'Space' && !isFlipped) {
                            e.preventDefault();
                            setIsFlipped(true);
                        }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={isFlipped ? `Answer: ${currentCard.back}` : `Question: ${currentCard.front}`}
                    aria-pressed={isFlipped}
                    initial={false}
                    animate={{
                        rotateY: isFlipped ? 180 : 0,
                        x: dragX,
                        scale: Math.abs(dragX) > 100 ? 0.95 : 1
                    }}
                    transition={{
                        duration: 0.4,
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                    // Swipe gestures
                    drag={isFlipped ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDrag={(event, info) => {
                        setDragX(info.offset.x);
                    }}
                    onDragEnd={(event, info) => {
                        const threshold = 150;
                        const velocity = info.velocity.x;

                        // Swipe right (Easy/Good)
                        if (info.offset.x > threshold || velocity > 500) {
                            handleGrade(5); // Easy on right swipe
                        }
                        // Swipe left (Again/Hard)
                        else if (info.offset.x < -threshold || velocity < -500) {
                            handleGrade(1); // Again on left swipe
                        }

                        setDragX(0);
                    }}
                >
                    {/* Front */}
                    <div className="absolute inset-0 bg-[#111] border border-neutral-800 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center backface-hidden shadow-2xl">
                        <div className="text-sm uppercase tracking-wider text-blue-400 font-semibold mb-6">Question</div>
                        <div className="text-2xl md:text-4xl font-bold text-white leading-relaxed">
                            {currentCard.front}
                        </div>
                        <div className="absolute bottom-8 text-neutral-500 text-sm flex items-center gap-2">
                            <Brain size={16} />
                            Tap or Space to flip
                        </div>
                    </div>

                    {/* Back */}
                    <div
                        className="absolute inset-0 bg-[#111] border border-neutral-800 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center backface-hidden shadow-2xl"
                        style={{ transform: 'rotateY(180deg)' }}
                    >
                        <div className="text-sm uppercase tracking-wider text-green-400 font-semibold mb-6">Answer</div>
                        <div className="text-xl md:text-3xl font-medium text-neutral-100 leading-relaxed">
                            {currentCard.back}
                        </div>

                        {/* Swipe Hint - Mobile Only */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-neutral-500 text-sm flex items-center gap-3 md:hidden">
                            <span className="flex items-center gap-1 text-red-400">
                                ← Swipe for Again
                            </span>
                            <span className="text-neutral-600">|</span>
                            <span className="flex items-center gap-1 text-green-400">
                                Swipe for Easy →
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="h-24 md:h-32 border-t border-neutral-800 bg-[#111] flex items-center justify-center px-6">
                {!isFlipped ? (
                    <button
                        onClick={() => setIsFlipped(true)}
                        className="w-full max-w-md py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-900/20"
                    >
                        Show Answer <span className="text-blue-200 text-sm font-normal ml-2">(Space)</span>
                    </button>
                ) : (
                    <div className="grid grid-cols-4 gap-3 md:gap-6 w-full max-w-3xl">
                        <button
                            onClick={() => handleGrade(1)}
                            className="flex flex-col items-center justify-center py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                        >
                            <span className="font-bold text-lg">Again</span>
                            <span className="text-xs opacity-70">&lt; 1m</span>
                            <span className="text-xs opacity-50 mt-1 hidden md:inline">Key: 1</span>
                        </button>
                        <button
                            onClick={() => handleGrade(3)}
                            className="flex flex-col items-center justify-center py-3 rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-all"
                        >
                            <span className="font-bold text-lg">Hard</span>
                            <span className="text-xs opacity-70">2d</span>
                            <span className="text-xs opacity-50 mt-1 hidden md:inline">Key: 2</span>
                        </button>
                        <button
                            onClick={() => handleGrade(4)}
                            className="flex flex-col items-center justify-center py-3 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
                        >
                            <span className="font-bold text-lg">Good</span>
                            <span className="text-xs opacity-70">4d</span>
                            <span className="text-xs opacity-50 mt-1 hidden md:inline">Key: 3</span>
                        </button>
                        <button
                            onClick={() => handleGrade(5)}
                            className="flex flex-col items-center justify-center py-3 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-all"
                        >
                            <span className="font-bold text-lg">Easy</span>
                            <span className="text-xs opacity-70">7d</span>
                            <span className="text-xs opacity-50 mt-1 hidden md:inline">Key: 4</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyMode;
