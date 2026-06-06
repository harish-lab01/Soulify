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
import Modal from '../components/ui/Modal';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export default function Home() {
  const { user, userProfile } = useAuth();
  const { todayMood, setTodayMood, showMoodCheckin, setShowMoodCheckin } = useApp();
  const [showCreate, setShowCreate] = useState(false);

  // Check if user has checked in today
  useEffect(() => {
    if (!user) return;
    const today = getTodayString();
    getMoodCheckin(user.uid, today).then(checkin => {
      if (checkin) {
        setTodayMood(checkin.mood);
      } else {
        // Show check-in after a short delay
        const timer = setTimeout(() => setShowMoodCheckin(true), 1000);
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
        {/* Daily Prompt */}
        <DailyPrompt onRespond={() => setShowCreate(true)} />

        {/* Feed */}
        <FeedList />
      </div>

      {/* FAB — mobile only, desktop uses sidebar button */}
      <motion.button
        className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl shadow-violet-300 lg:hidden"
        style={{ background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' }}
        onClick={() => setShowCreate(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
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
