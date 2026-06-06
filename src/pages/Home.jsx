import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getMoodCheckin } from '../firebase/firestore';
import { getTodayString } from '../utils/helpers';
import TopBar from '../components/layout/TopBar';
import FeedList from '../components/feed/FeedList';
import DailyPrompt from '../components/feed/DailyPrompt';
import CreatePost from '../components/feed/CreatePost';
import MoodCheckin from '../components/mood/MoodCheckin';
import StoryBar from '../components/stories/StoryBar';
import Modal from '../components/ui/Modal';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const FEED_TABS = [
  { id: 'all',       label: '🌍 All' },
  { id: 'following', label: '💜 Following' },
];

export default function Home() {
  const { user, userProfile } = useAuth();
  const { todayMood, setTodayMood, showMoodCheckin, setShowMoodCheckin } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [feedTab, setFeedTab] = useState('all');

  // Check if user has checked in today
  useEffect(() => {
    if (!user) return;
    const today = getTodayString();
    getMoodCheckin(user.uid, today).then(checkin => {
      if (checkin) {
        setTodayMood(checkin.mood);
      } else {
        const timer = setTimeout(() => setShowMoodCheckin(true), 1200);
        return () => clearTimeout(timer);
      }
    });
  }, [user]);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Mobile top bar */}
      <TopBar />

      {/* Desktop page header */}
      <div className="hidden lg:block px-6 pt-6 pb-2">
        <h1 className="font-display font-bold text-2xl text-soul-text">Home</h1>
        <p className="text-soul-muted text-sm mt-0.5">See what your community is sharing</p>
      </div>

      <div className="px-4 lg:px-6 py-4 max-w-lg lg:max-w-full mx-auto space-y-4">

        {/* Stories Row */}
        <div className="glass-card p-3">
          <StoryBar />
        </div>

        {/* Daily Prompt */}
        <DailyPrompt onRespond={() => setShowCreate(true)} />

        {/* Feed tabs */}
        <div className="flex gap-2">
          {FEED_TABS.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setFeedTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                feedTab === tab.id
                  ? 'text-white shadow-sm'
                  : 'bg-white/60 text-soul-muted hover:bg-white/80'
              }`}
              style={feedTab === tab.id ? { background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' } : {}}
              whileTap={{ scale: 0.95 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Feed */}
        <FeedList feedMode={feedTab} />
      </div>

      {/* FAB — mobile only */}
      <motion.button
        className="fixed z-40 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl shadow-violet-300 lg:hidden"
        style={{
          background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)',
          bottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 16px)',
          right: '20px',
        }}
        onClick={() => setShowCreate(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Create post"
      >
        <Plus size={24} />
      </motion.button>

      {/* Mood Check-in Modal */}
      <AnimatePresence>
        {showMoodCheckin && (
          <MoodCheckin onClose={() => setShowMoodCheckin(false)} />
        )}
      </AnimatePresence>

      {/* Create Post Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Post"
      >
        <CreatePost onClose={() => setShowCreate(false)} />
      </Modal>
    </motion.div>
  );
}
