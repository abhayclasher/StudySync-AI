
import React, { useState } from 'react';
import { generateFlashcards } from '../services/geminiService';
import { Flashcard } from '../types';
import { BrainCircuit, Loader2, RotateCw, Check, X, Plus, Youtube, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FlashcardDeck: React.FC = () => {
  const [inputMode, setInputMode] = useState<'text' | 'youtube'>('text');
  const [inputText, setInputText] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!inputText) return;
    setIsLoading(true);
    const newCards = await generateFlashcards(inputText, inputMode === 'youtube');
    setCards(newCards);
    setIsLoading(false);
  };

  const toggleFlip = (id: string) => {
    setFlippedId(flippedId === id ? null : id);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Creation Tools */}
      <div className="bg-[#050505] border border-white/5 rounded-xl p-6 relative overflow-hidden">
         <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary/10 rounded-full blur-[50px]"></div>
         
        <h2 className="text-xl font-bold text-white mb-6 flex items-center relative z-10">
          <BrainCircuit className="mr-3 text-secondary" />
          Flashcard Generator
        </h2>
        
        <div className="flex space-x-4 mb-4 relative z-10">
          <button 
            onClick={() => setInputMode('text')}
            className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${inputMode === 'text' ? 'bg-secondary text-black font-medium shadow-lg shadow-secondary/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}
          >
            <Type size={16} className="mr-2" /> From Text
          </button>
          <button 
            onClick={() => setInputMode('youtube')}
            className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${inputMode === 'youtube' ? 'bg-red-600 text-white font-medium shadow-lg shadow-red-600/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}
          >
            <Youtube size={16} className="mr-2" /> From YouTube
          </button>
        </div>

        <div className="relative z-10">
          <textarea
            className="w-full bg-black border border-white/10 rounded-lg p-4 text-slate-300 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 focus:outline-none min-h-[120px] transition-all placeholder:text-slate-500"
            placeholder={inputMode === 'text' ? "Paste your study notes here..." : "Paste YouTube URL here to extract key concepts..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            onClick={handleGenerate}
            disabled={isLoading || !inputText}
            className="absolute bottom-4 right-4 bg-white text-black hover:bg-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Generate Cards
          </button>
        </div>
      </div>

      {/* Grid of Cards */}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {cards.map((card, i) => (
              <motion.div 
                key={card.id} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group perspective-1000 h-[280px]"
              >
                <div 
                  className={`relative w-full h-full transition-all duration-500 transform-style-3d cursor-pointer ${flippedId === card.id ? 'rotate-y-180' : ''}`}
                  onClick={() => toggleFlip(card.id)}
                >
                  {/* Front */}
                  <div className="absolute inset-0 backface-hidden bg-[#050505] border border-white/5 p-8 rounded-xl flex flex-col justify-center items-center text-center hover:border-secondary/30 shadow-lg group-hover:shadow-secondary/5 transition-colors">
                    <h3 className="text-lg font-medium text-white leading-relaxed">{card.front}</h3>
                    <div className="absolute bottom-6 text-xs text-slate-400 flex items-center">
                      <RotateCw size={12} className="mr-1" /> Click to flip
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0a0a0a] border border-secondary/20 p-8 rounded-xl flex flex-col justify-center items-center text-center shadow-[0_0_30px_rgba(45,212,191,0.05)]">
                    <p className="text-slate-200 text-sm leading-relaxed">{card.back}</p>
                    
                    <div className="flex gap-4 mt-6 absolute bottom-6">
                      <button 
                        className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        onClick={(e) => { e.stopPropagation(); /* Handle hard */ }}
                      >
                        <X size={18} />
                      </button>
                      <button 
                        className="p-2 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                        onClick={(e) => { e.stopPropagation(); /* Handle easy */ }}
                      >
                        <Check size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {cards.length === 0 && !isLoading && (
        <div className="text-center py-10 text-slate-500">
          <BrainCircuit size={48} className="mx-auto mb-4 opacity-20" />
          <p>No flashcards yet. Paste text or a video URL above to generate a deck.</p>
        </div>
      )}
    </div>
  );
};

export default FlashcardDeck;
