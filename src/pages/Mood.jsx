import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getMoodHistory, getMoodCheckin } from '../firebase/firestore';
import { getTodayString, calculateStreak } from '../utils/helpers';
import { MOODS } from '../utils/constants';
import TopBar from '../components/layout/TopBar';
import MoodHeatmap from '../components/mood/MoodHeatmap';
import MoodCheckin from '../components/mood/MoodCheckin';
import MoodCard from '../components/mood/MoodCard';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export default function Mood() {
  const { user } = useAuth();
  const { todayMood, setTodayMood, showMoodCheckin, setShowMoodCheckin } = useApp();
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  const todayCheckin = history[getTodayString()];
  const todayMoodData = MOODS.find(m => m.id === (todayCheckin?.mood || todayMood));

  useEffect(() => {
    if (!user) return;
    getMoodHistory(user.uid).then(data => {
      setHistory(data);
      setStreak(calculateStreak(data));
      setLoading(false);
    });
  }, [user, todayMood]);

  // Recent mood history (last 7 entries)
  const recentCheckins = Object.entries(history)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <TopBar title="Mood Universe" />

      {/* Desktop header */}
      <div className="hidden lg:block px-6 pt-6 pb-2">
        <h1 className="font-display font-bold text-2xl text-soul-text">Mood Universe</h1>
        <p className="text-soul-muted text-sm mt-0.5">Track how you feel, day by day</p>
      </div>

      <div className="px-4 lg:px-6 py-4 max-w-lg lg:max-w-full mx-auto space-y-5">
        {/* Today's mood */}
        <div
          className="rounded-3xl p-5"
          style={{
            background: todayMoodData
              ? `linear-gradient(135deg, ${todayMoodData.bg} 0%, ${todayMoodData.bg}aa 100%)`
              : 'linear-gradient(135deg, #f0e6ff 0%, #fde8f0 100%)',
            border: `2px solid ${todayMoodData?.color || '#E8E4FF'}40`,
          }}
        >
          <p className="text-xs font-semibold text-soul-muted uppercase tracking-wide">Today</p>
          {todayMoodData ? (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-4xl">{todayMoodData.emoji}</span>
              <div>
                <p className="font-display font-bold text-xl" style={{ color: todayMoodData.color }}>
                  Feeling {todayMoodData.label}
                </p>
                {todayCheckin?.note && (
                  <p className="text-xs text-soul-muted mt-0.5">{todayCheckin.note}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-2">
              <p className="font-display font-semibold text-soul-text">How are you feeling today?</p>
              <motion.button
                onClick={() => setShowMoodCheckin(true)}
                className="text-sm text-soul-primary font-semibold"
                whileTap={{ scale: 0.95 }}
              >
                Check in →
              </motion.button>
            </div>
          )}
        </div>

        {/* Heatmap */}
        <div className="glass-card p-5">
          <h2 className="font-display font-bold text-soul-text mb-4">Your Mood Journey</h2>
          {loading ? (
            <div className="h-24 skeleton rounded-2xl" />
          ) : (
            <MoodHeatmap checkins={history} streak={streak} />
          )}
        </div>

        {/* Recent check-ins */}
        {recentCheckins.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="font-display font-bold text-soul-text mb-3">Recent Check-ins</h2>
            <div className="space-y-2">
              {recentCheckins.map(([date, checkin]) => (
                <MoodCard key={date} checkin={{ ...checkin, date }} />
              ))}
            </div>
          </div>
        )}

        {/* Mood stats */}
        {Object.keys(history).length > 0 && (
          <div className="glass-card p-5">
            <h2 className="font-display font-bold text-soul-text mb-4">Mood Overview</h2>
            <div className="space-y-2">
              {MOODS.map(mood => {
                const count = Object.values(history).filter(c => c.mood === mood.id).length;
                const total = Object.keys(history).length;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                if (count === 0) return null;

                return (
                  <div key={mood.id} className="flex items-center gap-3">
                    <span className="text-xl w-8">{mood.emoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-semibold text-soul-text">{mood.label}</span>
                        <span className="text-xs text-soul-muted">{count}x</span>
                      </div>
                      <div className="h-1.5 bg-soul-bg rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: mood.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FAB — mobile only */}
      <motion.button
        className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl shadow-violet-300 lg:hidden"
        style={{ background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' }}
        onClick={() => setShowMoodCheckin(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Plus size={24} />
      </motion.button>

      {/* Mood check-in */}
      <AnimatePresence>
        {showMoodCheckin && (
          <MoodCheckin onClose={() => setShowMoodCheckin(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
