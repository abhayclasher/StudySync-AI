import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Bot } from "lucide-react";

export interface Step {
  id: string;
  title: string;
  description: string;
 status: 'pending' | 'thinking' | 'completed' | 'error';
  details?: string;
  timestamp?: Date;
}

export interface ThinkingBarProps {
  steps: Step[];
  isThinking: boolean;
  className?: string;
}

const ThinkingBar: React.FC<ThinkingBarProps> = ({ 
  steps, 
  isThinking, 
  className = "" 
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'thinking':
        return (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
          </div>
        );
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {isThinking ? 'Thinking...' : 'Response complete'}
        </span>
      </div>
      
      <div className="space-y-2">
        <AnimatePresence>
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden"
            >
              <button
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
                onClick={() => step.details && toggleStep(step.id)}
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(step.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white truncate">{step.title}</h4>
                    {step.details && (
                      <span className="text-slate-500">
                        {expandedSteps.has(step.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 truncate">{step.description}</p>
                </div>
                
                {step.timestamp && (
                  <div className="text-xs text-slate-500 whitespace-nowrap">
                    {step.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </button>
              
              <AnimatePresence>
                {step.details && expandedSteps.has(step.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-3 pb-3 pt-1 border-t border-white/5"
                  >
                    <div className="text-sm text-slate-300 whitespace-pre-wrap">
                      {step.details}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ThinkingBar;