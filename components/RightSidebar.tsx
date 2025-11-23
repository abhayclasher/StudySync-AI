
import React, { useState } from 'react';
import { Goal } from '../types';
import { Target, Plus, Check, Clock, Flame, Trash2, RotateCcw, Play, Pause, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RightSidebarProps {
  timeLeft: number;
  isTimerActive: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onAdjustTimer: (minutes: number) => void;
  // New Props for State Hoisting
  goals: Goal[];
  onAddGoal: (title: string) => void;
  onToggleGoal: (id: string) => void;
  onDeleteGoal: (id: string) => void;
  streak: number;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  timeLeft,
  isTimerActive,
  onToggleTimer,
  onResetTimer,
  onAdjustTimer,
  goals,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
  streak
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = () => {
    if (!newGoalTitle.trim()) return;
    onAddGoal(newGoalTitle);
    setNewGoalTitle('');
    setIsAdding(false);
  };

  return (
    <aside className="hidden xl:flex flex-col w-80 h-full bg-black border-l border-white/5 p-4 overflow-y-auto custom-scrollbar flex-shrink-0">

      {/* Timer (Moved to Top) - Clean Design */}
      <div className="w-full mb-6">
        <div className={`
            relative rounded-xl p-5 w-full h-auto overflow-hidden transition-all duration-500
            ${isTimerActive
            ? 'bg-[#050505] border border-primary/30 shadow-[0_0_30px_rgba(124,58,237,0.1)]'
            : 'bg-[#050505] border border-white/5'}
        `}>
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent opacity-50"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className={`mb-2 transition-transform ${isTimerActive ? 'scale-110' : ''}`}>
              <Clock className={`transition-colors ${isTimerActive ? 'text-primary animate-pulse' : 'text-slate-500'}`} size={24} />
            </div>

            <h3 className="text-white font-bold text-sm mb-0.5">{isTimerActive ? 'Focus Mode On' : 'Focus Session'}</h3>
            <p className="text-xs text-slate-500 mb-4">{isTimerActive ? 'Stay detailed. Keep going.' : 'Ready for deep work?'}</p>

            <div className="text-4xl font-bold text-white mb-5 font-mono tracking-wider tabular-nums">
              {formatTime(timeLeft)}
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={onToggleTimer}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all shadow-lg flex items-center justify-center ${isTimerActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20' : 'bg-white text-black hover:bg-slate-200'}`}
              >
                {isTimerActive ? <><Pause size={14} className="mr-1.5" /> Pause</> : <><Play size={14} className="mr-1.5" /> Start</>}
              </button>

              <button
                onClick={onResetTimer}
                className="px-3 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors border border-white/5"
                title="Reset Timer"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            <div className="flex gap-2 w-full mt-3 justify-center">
              <button onClick={() => onAdjustTimer(-5)} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-slate-400 hover:text-white transition-colors">-5m</button>
              <button onClick={() => onAdjustTimer(5)} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-slate-400 hover:text-white transition-colors">+5m</button>
              <button onClick={() => onAdjustTimer(15)} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-slate-400 hover:text-white transition-colors">+15m</button>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Card - Clean Design */}
      <div className="w-full mb-6">
        <div className="bg-gradient-to-br from-blue-900/20 to-slate-900/20 border border-blue-500/20 rounded-xl p-5 relative overflow-hidden group w-full h-auto hover:border-blue-500/40 transition-colors">
          <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
            <Flame size={48} className="text-blue-500" />
          </div>
          <h3 className="text-blue-400 font-bold text-lg mb-1">{streak} Day Streak!</h3>
          <p className="text-xs text-slate-400 mb-3 pr-8">You're on fire. Keep studying to maintain it.</p>
          <div className="flex gap-1.5">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${i < (streak > 7 ? 7 : streak)
                  ? 'bg-blue-600 shadow-[0_0_5px_rgba(37,99,235,0.5)]'
                  : 'bg-white/10'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Goals Section */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center text-sm uppercase tracking-wide">
          <Target className="w-4 h-4 mr-2 text-primary" /> Daily Goals
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`text-xs p-1.5 rounded transition-colors z-10 relative ${isAdding ? 'bg-red-500/20 text-red-400' : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'}`}
          title={isAdding ? "Cancel" : "Add Goal"}
        >
          {isAdding ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {/* Add Goal Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <input
                autoFocus
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Goal title..."
                className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-xs text-white mb-2 focus:border-primary focus:outline-none placeholder:text-slate-500"
              />
              <button
                onClick={handleSubmit}
                disabled={!newGoalTitle.trim()}
                className="w-full bg-primary text-white text-xs font-bold py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/10"
              >
                Add Goal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 mb-8 flex-1">
        <AnimatePresence mode="popLayout">
          {goals.map((goal) => (
            <motion.div
              layout
              key={goal.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`p-3 rounded-lg border transition-all group relative cursor-pointer select-none ${goal.completed ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
              onClick={() => onToggleGoal(goal.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-sm font-medium transition-colors truncate pr-8 ${goal.completed ? 'text-green-400 line-through opacity-70' : 'text-slate-200'}`}>
                  {goal.title}
                </span>
                <div
                  className={`absolute top-3 right-3 w-5 h-5 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${goal.completed ? 'bg-green-500 border-green-500 text-black scale-110' : 'border-slate-600 group-hover:border-primary text-transparent'
                    }`}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onDeleteGoal(goal.id); }}
                className="absolute top-3 right-10 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
              >
                <Trash2 size={14} />
              </button>

              <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${(goal.current / goal.target) * 100}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${goal.completed ? 'bg-green-500' : 'bg-primary'}`}
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                <span>{Math.round((goal.current / goal.target) * 100)}%</span>
                <span>{goal.type ? goal.type.toUpperCase() : 'TASK'}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {goals.length === 0 && (
          <div className="text-center text-xs text-slate-600 py-6 italic border border-dashed border-white/10 rounded-lg">
            No active goals.<br />Click + to add one.
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightSidebar;
