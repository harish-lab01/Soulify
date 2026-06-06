import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Bot, Smile, Users, User, Compass, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const TABS = [
  { id: 'home',      icon: Home,         label: 'Home',     path: '/home' },
  { id: 'explore',   icon: Compass,      label: 'Explore',  path: '/explore' },
  { id: 'soul',      icon: Bot,          label: 'Soul',     path: '/soul' },
  { id: 'community', icon: Users,        label: 'Community',path: '/communities' },
  { id: 'profile',   icon: User,         label: 'Profile',  path: '/profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadNotifCount, unreadDMCount } = useApp();

  const activeTab = TABS.find(t => location.pathname.startsWith(t.path))?.id || 'home';

  return (
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
          const badgeCount = tab.id === 'home' ? unreadNotifCount : 0;

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

              {/* Icon + badge */}
              <div className="relative">
                <Icon
                  size={23}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{
                    color: isActive ? '#7C6FF7' : '#9CA3AF',
                    transition: 'color 0.2s',
                  }}
                />
                {badgeCount > 0 && (
                  <div className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-soul-secondary flex items-center justify-center text-white text-[8px] font-bold">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </div>
                )}
              </div>

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
