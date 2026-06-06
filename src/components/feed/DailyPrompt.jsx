import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { DAILY_PROMPTS } from '../../utils/constants';
import { getDayOfYear } from '../../utils/helpers';

export default function DailyPrompt({ onRespond }) {
  const prompt = DAILY_PROMPTS[getDayOfYear() % DAILY_PROMPTS.length];

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl p-5 text-white cursor-pointer"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onRespond}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} />
          <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
            Today's Prompt
          </span>
        </div>
        <p className="font-display font-semibold text-lg leading-snug">{prompt}</p>
        <p className="text-xs mt-3 opacity-70">Tap to share your answer →</p>
      </div>
    </motion.div>
  );
}
