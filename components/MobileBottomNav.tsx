import React, { useRef, useEffect, useState } from 'react';
import { LayoutDashboard, Map, Brain, MessageSquare, Menu, User } from 'lucide-react';
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
        { id: ViewState.PROFILE, label: 'Profile', icon: User },
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
        // Small delay to ensure layout is ready
        setTimeout(setTabPosition, 50);
        window.addEventListener('resize', setTabPosition);
        return () => window.removeEventListener('resize', setTabPosition);
    }, [activeTabIndex, currentView]);

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[60] md:hidden">
            <div className="relative flex h-14 items-center justify-between rounded-full bg-[#000] border border-white/10 px-2 shadow-2xl shadow-black/50">
                {/* Sliding background indicator - Blue Pill Style */}
                <span
                    className="absolute bottom-1.5 top-1.5 flex overflow-hidden rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                    style={{ left: tabUnderlineLeft, width: tabUnderlineWidth }}
                >
                    <span className="h-full w-full bg-blue-600 shadow-lg shadow-blue-600/30" />
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
                            className={`relative flex-1 flex items-center justify-center gap-2 h-full rounded-full transition-all duration-300 z-10 px-3 ${isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
                                }`}
                        >
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                            {isActive && (
                                <span className="text-xs font-bold whitespace-nowrap">
                                    {item.label}
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* Menu Button */}

            </div>
        </div>
    );
};

export default MobileBottomNav;
