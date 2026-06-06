import { motion } from 'framer-motion';
import { SOUL_MODES } from '../../utils/constants';

export default function SoulModeSelector({ activeMode, onModeChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-2">
      {SOUL_MODES.map(mode => {
        const isActive = activeMode === mode.id;
        return (
          <motion.button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`
              flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full
              text-sm font-semibold transition-all
              ${isActive
                ? 'text-white shadow-lg shadow-violet-200'
                : 'bg-white/60 text-soul-muted border border-soul-border hover:border-soul-primary/30'
              }
            `}
            style={isActive ? {
              background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)',
            } : {}}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            animate={isActive ? { scale: 1.05 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <span>{mode.emoji}</span>
            <span>{mode.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
