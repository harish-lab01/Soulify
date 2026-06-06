import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getActiveStories, createStory, markStoryViewed, getUser } from '../../firebase/firestore';
import { MOODS } from '../../utils/constants';
import Avatar from '../ui/Avatar';

// ─── Story Viewer Modal ───────────────────────────────────────────────────────
function StoryViewer({ stories, initialUserIndex, onClose }) {
  const { user } = useAuth();
  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [userProfiles, setUserProfiles] = useState({});
  const timerRef = useRef(null);
  const DURATION = 5000;

  const userIds = Object.keys(stories);
  const currentUserId = userIds[userIndex];
  const currentUserStories = stories[currentUserId] || [];
  const currentStory = currentUserStories[storyIndex];

  // Load author profiles
  useEffect(() => {
    userIds.forEach(async (uid) => {
      if (!userProfiles[uid]) {
        const p = await getUser(uid);
        if (p) setUserProfiles(prev => ({ ...prev, [uid]: p }));
      }
    });
  }, []);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && user) {
      markStoryViewed(currentStory.id, user.uid);
    }
  }, [currentStory]);

  // Auto-advance timer
  useEffect(() => {
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (elapsed >= DURATION) {
        clearInterval(timerRef.current);
        goNext();
      }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [storyIndex, userIndex]);

  const goNext = () => {
    if (storyIndex < currentUserStories.length - 1) {
      setStoryIndex(s => s + 1);
    } else if (userIndex < userIds.length - 1) {
      setUserIndex(u => u + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(s => s - 1);
    } else if (userIndex > 0) {
      setUserIndex(u => u - 1);
      setStoryIndex(0);
    }
  };

  if (!currentStory) return null;

  const mood = currentStory.mood ? MOODS.find(m => m.id === currentStory.mood) : null;
  const profile = userProfiles[currentUserId];

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative w-full max-w-sm mx-auto h-full max-h-[700px] rounded-3xl overflow-hidden"
        style={{
          background: mood
            ? `linear-gradient(160deg, ${mood.color}60 0%, ${mood.bg} 100%)`
            : 'linear-gradient(160deg, #a18cd1 0%, #fbc2eb 100%)',
        }}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 z-10">
          {currentUserStories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-2">
            <Avatar src={profile?.photoURL} name={profile?.displayName} size="sm" />
            <div>
              <p className="text-white font-semibold text-sm">{profile?.displayName || '...'}</p>
              <p className="text-white/70 text-xs">
                {new Date(currentStory.createdAt?.toDate?.() || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/20 rounded-full">
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Story content */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {currentStory.image ? (
            <img src={currentStory.image} alt="story" className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <div className="text-center">
              {mood && <div className="text-8xl mb-4">{mood.emoji}</div>}
              <p className="text-white font-bold text-2xl leading-snug drop-shadow-lg">
                {currentStory.text}
              </p>
            </div>
          )}
        </div>

        {/* Tap zones */}
        <button
          className="absolute left-0 top-0 w-1/3 h-full z-20"
          onClick={goPrev}
        />
        <button
          className="absolute right-0 top-0 w-1/3 h-full z-20"
          onClick={goNext}
        />
      </div>
    </motion.div>
  );
}

// ─── Create Story Modal ───────────────────────────────────────────────────────
function CreateStoryModal({ onClose }) {
  const { user, userProfile } = useAuth();
  const { addToast, todayMood } = useApp();
  const [tab, setTab] = useState('text'); // 'text' | 'mood'
  const [text, setText] = useState('');
  const [selectedMood, setSelectedMood] = useState(todayMood || null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    if (tab === 'text' && !text.trim()) return;
    setSubmitting(true);
    try {
      await createStory(user.uid, {
        text: text.trim(),
        mood: tab === 'mood' ? selectedMood : null,
        type: tab,
        authorName: userProfile?.displayName || 'You',
        authorPhoto: userProfile?.photoURL || '',
      });
      addToast('Story shared for 24h 🌸', 'success');
      onClose();
    } catch (e) {
      addToast('Failed to share story', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="bg-white rounded-t-3xl w-full max-w-lg p-6"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-soul-text text-lg">Add to Story</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-soul-bg">
            <X size={18} className="text-soul-muted" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[{ id: 'text', label: '✍️ Text' }, { id: 'mood', label: '😊 Mood' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'text-white shadow-sm'
                  : 'bg-soul-bg text-soul-muted'
              }`}
              style={tab === t.id ? { background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'text' && (
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What's on your mind? (disappears in 24h)"
            className="w-full bg-soul-bg border border-soul-border rounded-2xl p-4 text-sm text-soul-text outline-none focus:border-soul-primary resize-none"
            rows={4}
            autoFocus
          />
        )}

        {tab === 'mood' && (
          <div className="grid grid-cols-4 gap-2">
            {MOODS.map(mood => (
              <motion.button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all"
                style={{
                  borderColor: selectedMood === mood.id ? mood.color : 'transparent',
                  backgroundColor: selectedMood === mood.id ? `${mood.color}15` : '#F9F7FF',
                }}
                whileTap={{ scale: 0.93 }}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-[10px] font-semibold text-soul-muted">{mood.label}</span>
              </motion.button>
            ))}
          </div>
        )}

        <motion.button
          onClick={handleSubmit}
          disabled={submitting || (tab === 'text' && !text.trim()) || (tab === 'mood' && !selectedMood)}
          className="mt-4 w-full py-3.5 rounded-2xl text-white font-semibold text-sm disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' }}
          whileTap={{ scale: 0.97 }}
        >
          {submitting ? 'Sharing...' : 'Share Story ✨'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main StoryBar ────────────────────────────────────────────────────────────
export default function StoryBar() {
  const { user, userProfile } = useAuth();
  const [stories, setStories] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    const unsub = getActiveStories((grouped) => {
      setStories(grouped);
      // Preload user profiles
      Object.keys(grouped).forEach(async (uid) => {
        if (!userProfiles[uid]) {
          const p = await getUser(uid);
          if (p) setUserProfiles(prev => ({ ...prev, [uid]: p }));
        }
      });
    });
    return unsub;
  }, []);

  const userIds = Object.keys(stories);
  const myStories = stories[user?.uid];

  const openStory = (userId) => {
    const idx = userIds.indexOf(userId);
    setViewerStartIndex(Math.max(0, idx));
    setViewerOpen(true);
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 px-0.5">
        {/* Add story button */}
        <motion.button
          onClick={() => setShowCreate(true)}
          className="flex-shrink-0 flex flex-col items-center gap-1.5"
          whileTap={{ scale: 0.93 }}
        >
          <div className="relative">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center ring-2 ring-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #fde8f0 100%)' }}
            >
              <Avatar src={userProfile?.photoURL} name={userProfile?.displayName} size="md" />
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' }}
            >
              <Plus size={12} strokeWidth={3} />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-soul-muted whitespace-nowrap">
            {myStories ? 'Your story' : 'Add story'}
          </span>
        </motion.button>

        {/* Other users' stories */}
        {userIds.filter(uid => uid !== user?.uid).map(uid => {
          const profile = userProfiles[uid];
          const userStories = stories[uid];
          const latestMood = userStories?.[0]?.mood;
          const moodData = latestMood ? MOODS.find(m => m.id === latestMood) : null;

          return (
            <motion.button
              key={uid}
              onClick={() => openStory(uid)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5"
              whileTap={{ scale: 0.93 }}
            >
              <div
                className="w-14 h-14 rounded-full p-0.5"
                style={{
                  background: moodData
                    ? `linear-gradient(135deg, ${moodData.color} 0%, ${moodData.color}80 100%)`
                    : 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)',
                }}
              >
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <Avatar src={profile?.photoURL} name={profile?.displayName} size="md" className="w-full h-full" />
                </div>
              </div>
              <span className="text-[10px] font-semibold text-soul-muted max-w-[56px] truncate">
                {profile?.displayName?.split(' ')[0] || '...'}
              </span>
            </motion.button>
          );
        })}

        {userIds.length === 0 && !myStories && (
          <p className="text-xs text-soul-muted self-center ml-2">No stories yet — be the first!</p>
        )}
      </div>

      <AnimatePresence>
        {showCreate && <CreateStoryModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {viewerOpen && Object.keys(stories).length > 0 && (
          <StoryViewer
            stories={stories}
            initialUserIndex={viewerStartIndex}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
