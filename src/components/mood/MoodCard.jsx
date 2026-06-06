import { motion } from 'framer-motion';
import { MOODS } from '../../utils/constants';
import { formatTimeAgo } from '../../utils/helpers';

export default function MoodCard({ checkin, onClick }) {
  const mood = MOODS.find(m => m.id === checkin?.mood);
  if (!mood) return null;

  return (
    <motion.div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer"
      style={{ backgroundColor: mood.bg }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-3xl">{mood.emoji}</span>
      <div className="flex-1">
        <p className="font-semibold text-sm" style={{ color: mood.color }}>{mood.label}</p>
        {checkin.note && (
          <p className="text-xs text-soul-muted mt-0.5 line-clamp-1">{checkin.note}</p>
        )}
        <p className="text-xs text-soul-muted mt-0.5">{checkin.date}</p>
      </div>
    </motion.div>
  );
}
