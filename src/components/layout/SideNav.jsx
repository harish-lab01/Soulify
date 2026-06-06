import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Bot, Smile, Users, User, Bell, Settings, PenSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { MOODS } from '../../utils/constants';
import Avatar from '../ui/Avatar';

const TABS = [
  { id: 'home',      icon: Home,  label: 'Home',      path: '/home' },
  { id: 'soul',      icon: Bot,   label: 'Soul',       path: '/soul' },
  { id: 'mood',      icon: Smile, label: 'Mood',       path: '/mood' },
  { id: 'community', icon: Users, label: 'Community',  path: '/communities' },
  { id: 'profile',   icon: User,  label: 'Profile',    path: '/profile' },
];

export default function SideNav({ onCreatePost }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { todayMood } = useApp();

  const activeTab = TABS.find(t => location.pathname.startsWith(t.path))?.id || 'home';
  const todayMoodData = MOODS.find(m => m.id === todayMood);

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 h-screen sticky top-0 px-4 py-6 gap-2 overflow-y-auto">
      {/* Logo */}
      <div className="px-3 mb-4">
        <span
          className="font-display font-bold text-2xl cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          onClick={() => navigate('/home')}
        >
          Soulify ✨
        </span>
        <p className="text-xs text-soul-muted mt-0.5">You are never alone</p>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold
                transition-all text-left w-full
                ${isActive
                  ? 'text-white shadow-lg shadow-violet-200'
                  : 'text-soul-muted hover:bg-white/60 hover:text-soul-text'
                }
              `}
              style={isActive ? {
                background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)',
              } : {}}
              whileHover={{ x: isActive ? 0 : 4 }}
              whileTap={{ scale: 0.97 }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="ml-auto w-2 h-2 rounded-full bg-white/60"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Create post button */}
      <motion.button
        onClick={onCreatePost}
        className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white font-semibold text-sm shadow-lg shadow-violet-200"
        style={{ background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' }}
        whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(124,111,247,0.4)' }}
        whileTap={{ scale: 0.97 }}
      >
        <PenSquare size={16} />
        Create Post
      </motion.button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Today's mood chip */}
      {todayMoodData && (
        <motion.div
          className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
          style={{
            backgroundColor: `${todayMoodData.color}15`,
            color: todayMoodData.color,
          }}
          onClick={() => navigate('/mood')}
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-xs opacity-70 mb-0.5">Today's mood</p>
          <div className="flex items-center gap-2">
            <span className="text-xl">{todayMoodData.emoji}</span>
            <span>{todayMoodData.label}</span>
          </div>
        </motion.div>
      )}

      {/* User profile mini */}
      <motion.div
        className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/60 cursor-pointer transition-all"
        onClick={() => navigate('/profile')}
        whileHover={{ x: 2 }}
      >
        <Avatar
          src={userProfile?.photoURL}
          name={userProfile?.displayName}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-soul-text truncate">
            {userProfile?.displayName || 'You'}
          </p>
          <p className="text-xs text-soul-muted truncate">
            {userProfile?.email || ''}
          </p>
        </div>
      </motion.div>
    </aside>
  );
}
