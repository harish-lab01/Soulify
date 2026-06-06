import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Bot, Smile, Users, User } from 'lucide-react';

const TABS = [
  { id: 'home',      icon: Home,  label: 'Home',      path: '/home' },
  { id: 'soul',      icon: Bot,   label: 'Soul',       path: '/soul' },
  { id: 'mood',      icon: Smile, label: 'Mood',       path: '/mood' },
  { id: 'community', icon: Users, label: 'Community',  path: '/communities' },
  { id: 'profile',   icon: User,  label: 'Profile',    path: '/profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = TABS.find(t => location.pathname.startsWith(t.path))?.id || 'home';

  return (
    // lg:hidden — hidden on desktop (desktop uses SideNav instead)
    // fixed at bottom, always above ALL page content (z-[100])
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[100]"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(232,228,255,0.6)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around px-1 pt-2 pb-2 max-w-lg mx-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[56px] touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7C6FF7, #F472B6)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {/* Icon */}
              <Icon
                size={23}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{
                  color: isActive ? '#7C6FF7' : '#9CA3AF',
                  transition: 'color 0.2s',
                }}
              />

              {/* Label */}
              <span
                className="text-[10px] font-semibold transition-all duration-200"
                style={{ color: isActive ? '#7C6FF7' : '#9CA3AF' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
