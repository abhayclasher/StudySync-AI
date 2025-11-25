
import React, { useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Map,
  LogOut,
  Cpu,
  Gamepad2,
  Clock,
  BookOpen,
  Brain,
  BarChart3
} from 'lucide-react';
import { ViewState, UserProfile } from '../types';
import { Sidebar, SidebarBody, SidebarLink } from './ui/sidebar';
import { motion } from 'framer-motion';
import SignOutModal from './SignOutModal';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onSignOut: () => void;
  user: UserProfile;
}

const AppSidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onSignOut, user }) => {
  const [open, setOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.CHAT, label: 'AI Chat', icon: MessageSquare },
    { id: ViewState.ROADMAP, label: 'Smart Course', icon: Map },
    { id: ViewState.PRACTICE, label: 'Practice', icon: Brain },
    { id: ViewState.QUIZ_ANALYTICS, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <>
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-4 bg-black border-white/5">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo Section - Clickable to Landing Page */}
            <button
              onClick={() => onNavigate(ViewState.LANDING)}
              aria-label="Go to homepage"
              className="flex items-center justify-start gap-3 mb-4 pt-2 px-1 py-2 rounded-lg hover:bg-white/5 transition-colors w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <div className="h-9 w-9 flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                <Cpu className="text-white h-5 w-5" />
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: open ? 1 : 0 }}
                className="font-bold text-white whitespace-pre text-base"
              >
                StudySync AI
              </motion.span>
            </button>

            {/* Navigation Links */}
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <SidebarLink
                    key={item.id}
                    link={{
                      label: item.label,
                      href: "#",
                      onClick: () => onNavigate(item.id),
                      icon: <Icon className={`h-5 w-5 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                    }}
                    className={isActive ? 'bg-white/5' : ''}
                    aria-label={`Navigate to ${item.label}`}
                    aria-current={isActive ? 'page' : undefined}
                  />
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex flex-col gap-1">
            <SidebarLink
              link={{
                label: 'Sign Out',
                href: '#',
                onClick: () => setShowSignOutModal(true),
                icon: <LogOut className="h-5 w-5 text-red-400" />
              }}
              aria-label="Sign out"
            />

            {/* User Profile Mini */}
            <div className="mt-2 pt-2 border-t border-white/5">
              <SidebarLink
                link={{
                  label: user.name,
                  href: '#',
                  icon: (
                    <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )
                }}
              />
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={onSignOut}
      />
    </>
  );
};

export default AppSidebar;
