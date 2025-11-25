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
      initial = {{ y: 100, opacity: 0 }
    }
    animate = {{ y: 0, opacity: 1 }
  }
          exit = {{ y: 100, opacity: 0 }}
transition = {{ type: 'spring', damping: 20, stiffness: 100 }}
className = "fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/95 backdrop-blur-md border-t border-white/10"
style = {{
  paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
  <div className="flex items-center justify-around h-16 px-2">
    {navItems.map((item) => {
      const Icon = item.icon;
      const isActive = currentView === item.id;

      return (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          aria-label={`Navigate to ${item.label}`}
          aria-current={isActive ? 'page' : undefined}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${isActive
              ? 'bg-primary/20 text-primary'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <Icon
            size={20}
            className={isActive ? 'text-primary' : ''}
            aria-hidden="true"
          />
          <span className={`text-xs mt-1 font-medium ${isActive ? 'text-primary' : 'text-slate-400'
            }`}>
            {item.label}
          </span>

          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="w-1.5 h-1.5 bg-primary rounded-full mt-1"
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