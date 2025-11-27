import React, { useRef, useEffect, useState } from 'react';
import { LayoutDashboard, Map, Brain, MessageSquare, Menu } from 'lucide-react';
import { ViewState } from '../types';

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

    const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const [tabUnderlineWidth, setTabUnderlineWidth] = useState(0);
    const [tabUnderlineLeft, setTabUnderlineLeft] = useState(0);

    const activeTabIndex = navItems.findIndex(item => item.id === currentView);

    useEffect(() => {
        const setTabPosition = () => {
            const currentTab = tabsRef.current[activeTabIndex];
            if (currentTab) {
                setTabUnderlineLeft(currentTab.offsetLeft);
                setTabUnderlineWidth(currentTab.clientWidth);
            }
        };

        setTabPosition();
        window.addEventListener('resize', setTabPosition);
        return () => window.removeEventListener('resize', setTabPosition);
    }, [activeTabIndex]);

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
            <div className="relative mx-auto flex h-16 max-w-md items-center rounded-3xl border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-2xl px-2 shadow-2xl shadow-black/50">
                {/* Sliding background indicator */}
                <span
                    className="absolute bottom-0 top-0 flex overflow-hidden rounded-3xl py-2 transition-all duration-300 ease-out"
                    style={{ left: tabUnderlineLeft, width: tabUnderlineWidth }}
                >
                    <span className="h-full w-full rounded-3xl bg-blue-600/20 border border-blue-500/30" />
                </span>

                {/* Navigation Items */}
                {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                        <button
                            key={item.id}
                            ref={(el) => (tabsRef.current[index] = el)}
                            onClick={() => onNavigate(item.id)}
                            className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl transition-all duration-300 ${isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
                            <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}

                {/* Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="flex flex-col items-center justify-center gap-1 py-2 px-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                    <Menu size={20} />
                    <span className="text-[10px] font-medium opacity-70">Menu</span>
                </button>
            </div>
        </div>
    );
};

export default MobileBottomNav;
