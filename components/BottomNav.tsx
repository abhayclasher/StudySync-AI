import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, MessageSquare, Map, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show on scroll up, hide on scroll down
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Home', icon: LayoutDashboard },
    { id: ViewState.CHAT, label: 'Chat', icon: MessageSquare },
    { id: ViewState.ROADMAP, label: 'Roadmap', icon: Map },
    { id: ViewState.PRACTICE, label: 'Practice', icon: Brain },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0a0a] border-t border-white/10 shadow-2xl rounded-t-[28px]"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div className="flex items-center justify-around h-16 px-1">
    {navItems.map((item) => {
      const Icon = item.icon;
      const isActive = currentView === item.id;

      return (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          aria-label={`Navigate to ${item.label}`}
          aria-current={isActive ? 'page' : undefined}
          className={`flex flex-col items-center justify-center flex-1 h-12 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isActive
              ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <Icon
            size={18}
            className={`transition-all duration-300 ${isActive ? 'text-blue-400 scale-110' : ''}`}
            aria-hidden="true"
          />
          <span className={`text-[10px] mt-1 font-medium transition-all duration-300 ${isActive ? 'text-blue-400' : 'text-slate-400'
            }`}>
            {item.label}
          </span>

          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="w-1 h-1 bg-blue-400 rounded-full mt-1"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              aria-hidden="true"
            />
          )}
        </button>
      );
    })}
  </div>
        </motion.nav >
      )}
    </AnimatePresence >
  );
};

export default BottomNav;