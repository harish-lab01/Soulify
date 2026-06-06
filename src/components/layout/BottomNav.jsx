import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Bot, Smile, Users, User } from 'lucide-react';

const TABS = [
  { id: 'home',       icon: Home,  label: 'Home',      path: '/home' },
  { id: 'soul',       icon: Bot,   label: 'Soul',       path: '/soul' },
  { id: 'mood',       icon: Smile, label: 'Mood',       path: '/mood' },
  { id: 'community',  icon: Users, label: 'Community',  path: '/communities' },
  { id: 'profile',    icon: User,  label: 'Profile',    path: '/profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = TABS.find(t => location.pathname.startsWith(t.path))?.id || 'home';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-soul-border/50 pb-safe">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-1 px-3 py-1 min-w-[60px]"
              whileTap={{ scale: 0.9 }}
            >
              {/* Sliding active indicator */}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7C6FF7, #F472B6)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {/* Icon */}
              <div
                className={`transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}
                style={isActive ? {
                  filter: 'drop-shadow(0 0 4px rgba(124,111,247,0.4))',
                } : {}}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={isActive ? {
                    stroke: 'url(#nav-gradient)',
                  } : { stroke: '#9CA3AF' }}
                />
              </div>

              {/* Label — only show for active */}
              <motion.span
                animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.8 }}
                className="text-[10px] font-semibold"
                style={{ color: isActive ? '#7C6FF7' : 'transparent' }}
              >
                {tab.label}
              </motion.span>

              {/* SVG gradient def (hidden) */}
              <svg width="0" height="0" className="absolute">
                <defs>
                  <linearGradient id="nav-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7C6FF7" />
                    <stop offset="100%" stopColor="#F472B6" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
