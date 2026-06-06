import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Hash, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { COMMUNITIES, MOODS, DAILY_PROMPTS, ROOMS } from '../../utils/constants';
import { getDayOfYear } from '../../utils/helpers';
import SoulAvatar from '../soul/SoulAvatar';

export default function RightPanel() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { todayMood, unreadNotifCount, unreadDMCount } = useApp();

  const todayMoodData = MOODS.find(m => m.id === todayMood);
  const todayPrompt = DAILY_PROMPTS[getDayOfYear() % DAILY_PROMPTS.length];
  const joinedCommunities = userProfile?.communities || [];
  const suggestedCommunities = COMMUNITIES.filter(c => !joinedCommunities.includes(c.id)).slice(0, 3);

  return (
    <aside className="hidden xl:flex flex-col w-72 2xl:w-80 h-screen sticky top-0 py-6 px-4 gap-4 overflow-y-auto">

      {/* Notification + DM quick actions */}
      <div className="flex gap-2">
        <motion.button
          onClick={() => navigate('/notifications')}
          className="flex-1 flex items-center gap-2 p-3 glass-card cursor-pointer relative"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Bell size={18} className="text-soul-primary" />
          <span className="text-xs font-semibold text-soul-text">Notifications</span>
          {unreadNotifCount > 0 && (
            <div
              className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
              style={{ background: 'linear-gradient(135deg, #7C6FF7, #F472B6)' }}
            >
              {unreadNotifCount}
            </div>
          )}
        </motion.button>
        <motion.button
          onClick={() => navigate('/messages')}
          className="flex-1 flex items-center gap-2 p-3 glass-card cursor-pointer relative"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <MessageSquare size={18} className="text-soul-secondary" />
          <span className="text-xs font-semibold text-soul-text">Messages</span>
          {unreadDMCount > 0 && (
            <div
              className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
              style={{ background: 'linear-gradient(135deg, #F472B6, #fb7185)' }}
            >
              {unreadDMCount}
            </div>
          )}
        </motion.button>
      </div>

      {/* Soul quick chat widget */}
      <motion.div
        className="rounded-3xl p-4 cursor-pointer text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' }}
        onClick={() => navigate('/soul')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-3 relative z-10">
          <SoulAvatar size="sm" />
          <div>
            <p className="font-display font-bold text-sm">Talk to Soul</p>
            <p className="text-xs opacity-80">Your AI companion 💙</p>
          </div>
        </div>
        <p className="text-xs mt-3 opacity-70 relative z-10 italic">
          "How are you really feeling today?"
        </p>
      </motion.div>

      {/* Today's prompt */}
      <div className="glass-card p-4">
        <p className="text-xs font-semibold text-soul-muted uppercase tracking-wide mb-2">
          ✨ Today's Prompt
        </p>
        <p className="text-sm text-soul-text font-medium leading-snug">{todayPrompt}</p>
        <button
          className="mt-3 text-xs text-soul-primary font-semibold hover:underline"
          onClick={() => navigate('/home')}
        >
          Share your answer →
        </button>
      </div>

      {/* Mood status */}
      {todayMoodData ? (
        <div
          className="rounded-2xl p-4 cursor-pointer"
          style={{ backgroundColor: `${todayMoodData.color}15` }}
          onClick={() => navigate('/mood')}
        >
          <p className="text-xs font-semibold opacity-60 uppercase tracking-wide mb-2"
            style={{ color: todayMoodData.color }}>
            Today's mood
          </p>
          <div className="flex items-center gap-2">
            <span className="text-3xl">{todayMoodData.emoji}</span>
            <div>
              <p className="font-bold text-sm" style={{ color: todayMoodData.color }}>
                {todayMoodData.label}
              </p>
              <p className="text-xs opacity-60" style={{ color: todayMoodData.color }}>
                View mood history →
              </p>
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          className="glass-card p-4 cursor-pointer"
          onClick={() => navigate('/mood')}
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-xs font-semibold text-soul-muted uppercase tracking-wide mb-2">
            😊 Mood Check-in
          </p>
          <p className="text-sm text-soul-text">How are you feeling today?</p>
          <p className="text-xs text-soul-primary font-semibold mt-2">Check in now →</p>
        </motion.div>
      )}

      {/* Live rooms */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-soul-muted uppercase tracking-wide">
            🔴 Live Rooms
          </p>
          <button
            className="text-xs text-soul-primary font-semibold"
            onClick={() => navigate('/rooms')}
          >
            See all →
          </button>
        </div>
        <div className="space-y-2">
          {ROOMS.map(room => (
            <motion.div
              key={room.id}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-soul-bg cursor-pointer transition-colors"
              onClick={() => navigate(`/rooms/${room.id}`)}
              whileHover={{ x: 2 }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ backgroundColor: `${room.color}20` }}
              >
                {room.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-soul-text">{room.name}</p>
                <p className="text-[10px] text-soul-muted truncate">{room.desc}</p>
              </div>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0 animate-pulse" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Suggested communities */}
      {suggestedCommunities.length > 0 && (
        <div className="glass-card p-4">
          <p className="text-xs font-semibold text-soul-muted uppercase tracking-wide mb-3">
            Communities for you
          </p>
          <div className="space-y-2">
            {suggestedCommunities.map(c => (
              <motion.div
                key={c.id}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-soul-bg cursor-pointer transition-colors"
                onClick={() => navigate(`/community/${c.id}`)}
                whileHover={{ x: 2 }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: `${c.color}20` }}
                >
                  {c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-soul-text truncate">{c.name}</p>
                  <p className="text-xs text-soul-muted truncate">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <button
            className="mt-3 text-xs text-soul-primary font-semibold hover:underline"
            onClick={() => navigate('/communities')}
          >
            See all →
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto text-xs text-soul-muted text-center pb-2">
        <p>Made with 💜 for everyone</p>
        <p className="mt-0.5 opacity-60">Soulify © {new Date().getFullYear()}</p>
      </div>
    </aside>
  );
}
