import React from 'react';
import { LayoutDashboard, Map, Brain, MessageSquare, Menu } from 'lucide-react';
import { ViewState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface MobileBottomNavProps {
    currentView: ViewState;
    onNavigate: (view: ViewState) => void;
    onMenuClick: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentView, onNavigate, onMenuClick }) => {
    const navItems = [
        { id: ViewState.DASHBOARD, label: 'Home', icon: LayoutDashboard },
        { id: ViewState.ROADMAP, label: 'Course', icon: Map },
        { id: ViewState.PRACTICE, label: 'Practice', icon: Brain },
        { id: ViewState.CHAT, label: 'Chat', icon: MessageSquare },
    ];

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 md:hidden">
            <div className="bg-[#0f1115]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 p-2 flex items-center justify-between relative overflow-hidden">

                {/* Navigation Items */}
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={cn(
                                "relative flex items-center justify-center p-3 rounded-2xl transition-all duration-300 z-10",
                                isActive ? "flex-1" : "w-12"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-blue-600 rounded-2xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            <div className={cn(
                                "relative flex items-center gap-2 transition-all duration-300",
                                isActive ? "text-white" : "text-slate-400"
                            )}>
                                <Icon size={20} className={cn("transition-transform duration-300", isActive && "scale-105")} />
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0, x: -10 }}
                                            animate={{ opacity: 1, width: "auto", x: 0 }}
                                            exit={{ opacity: 0, width: 0, x: -10 }}
                                            className="text-sm font-semibold whitespace-nowrap overflow-hidden"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        </button>
                    );
                })}

                {/* Menu Button (Static) */}
                <button
                    onClick={onMenuClick}
                    className="relative flex items-center justify-center w-12 p-3 rounded-2xl text-slate-400 hover:text-white transition-colors z-10"
                >
                    <Menu size={20} />
                </button>
            </div>
        </div>
    );
};

export default MobileBottomNav;
