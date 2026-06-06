import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { MOODS } from '../../utils/constants';

export default function MoodPicker({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {MOODS.map((mood, i) => {
        const isSelected = selected === mood.id;

        return (
          <motion.button
            key={mood.id}
            onClick={() => onSelect(mood.id)}
            className="relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all"
            style={{
              backgroundColor: isSelected ? mood.bg : 'rgba(255,255,255,0.7)',
              borderColor: isSelected ? mood.color : 'rgba(232, 228, 255, 0.8)',
              boxShadow: isSelected ? `0 4px 20px ${mood.color}30` : 'none',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 0.05,
              type: 'spring',
              stiffness: 400,
              damping: 20,
            }}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
          >
            {/* Check badge */}
            {isSelected && (
              <motion.div
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: mood.color }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 600, damping: 15 }}
              >
                <Check size={11} className="text-white" strokeWidth={3} />
              </motion.div>
            )}

            {/* Emoji */}
            <motion.span
              className="text-3xl"
              animate={isSelected ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {mood.emoji}
            </motion.span>

            {/* Label */}
            <span
              className="text-xs font-semibold"
              style={{ color: isSelected ? mood.color : '#6B7280' }}
            >
              {mood.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
