import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { saveMoodCheckin, getMoodHistory } from '../../firebase/firestore';
import { getTodayString, getGreeting, calculateStreak } from '../../utils/helpers';
import { MOODS } from '../../utils/constants';
import MoodPicker from './MoodPicker';
import Button from '../ui/Button';
import { useBadgeAwarder } from '../../hooks/useBadgeAwarder';

export default function MoodCheckin({ onClose }) {
  const { user, userProfile } = useAuth();
  const { setTodayMood } = useApp();
  const navigate = useNavigate();
  const { checkAndAward } = useBadgeAwarder();
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedMood = MOODS.find(m => m.id === selected);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const today = getTodayString();
      await saveMoodCheckin(user.uid, today, { mood: selected, note });
      setTodayMood(selected);
      // Check streak badge
      const history = await getMoodHistory(user.uid);
      const streak = calculateStreak(history);
      await checkAndAward({ streak });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTellSoul = async () => {
    await handleSave();
    navigate('/soul');
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="relative w-full max-w-lg bg-white rounded-t-3xl px-5 pt-5 pb-8 z-10 max-h-[90vh] overflow-y-auto"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-soul-bg"
        >
          <X size={20} className="text-soul-muted" />
        </button>

        {/* Greeting */}
        <div className="mb-5">
          <p className="text-soul-muted text-sm">{getGreeting()} 🌸</p>
          <h2 className="font-display font-bold text-2xl text-soul-text mt-1">
            How are you feeling, {userProfile?.displayName || 'friend'}?
          </h2>
          {selected && (
            <motion.p
              className="text-sm mt-1 font-medium"
              style={{ color: selectedMood?.color }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Feeling {selectedMood?.label} {selectedMood?.emoji}
            </motion.p>
          )}
        </div>

        {/* Mood Picker */}
        <MoodPicker selected={selected} onSelect={setSelected} />

        {/* Optional note */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              {!showNote ? (
                <button
                  onClick={() => setShowNote(true)}
                  className="text-sm text-soul-primary underline"
                >
                  Want to add a note?
                </button>
              ) : (
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="What's on your mind? (optional)"
                  className="w-full bg-soul-bg border border-soul-border rounded-2xl p-3 text-sm text-soul-text placeholder-soul-muted outline-none focus:border-soul-primary resize-none"
                  rows={3}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        {selected && (
          <motion.div
            className="flex flex-col gap-3 mt-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button onClick={handleTellSoul} fullWidth disabled={saving}>
              <div className="flex items-center justify-center gap-2">
                <MessageCircle size={16} />
                Tell Soul about it
              </div>
            </Button>
            <Button variant="ghost" onClick={handleSave} fullWidth disabled={saving}>
              {saving ? 'Saving...' : 'Just save'}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
