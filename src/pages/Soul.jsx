import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import SoulAvatar from '../components/soul/SoulAvatar';
import SoulModeSelector from '../components/soul/SoulModeSelector';
import SoulChat from '../components/soul/SoulChat';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export default function Soul() {
  const { soulMode, setSoulMode } = useApp();

  return (
    <motion.div
      className="flex flex-col"
      // Mobile: fill viewport minus bottom nav (80px) — never overlap it
      // Desktop: fill full viewport height via flex parent
      style={{ height: 'calc(100vh - 80px)' }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header — mobile */}
      <div className="lg:hidden bg-white/70 backdrop-blur-xl border-b border-soul-border/50 px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <SoulAvatar size="sm" />
          <div>
            <h1 className="font-display font-bold text-lg text-soul-text">Soul</h1>
            <p className="text-xs text-soul-muted">Your AI Companion</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-soul-muted">Online</span>
          </div>
        </div>
      </div>

      {/* Header — desktop */}
      <div className="hidden lg:flex items-center gap-4 px-6 py-4 border-b border-soul-border/50 flex-shrink-0">
        <SoulAvatar size="sm" />
        <div>
          <h1 className="font-display font-bold text-lg text-soul-text">Soul</h1>
          <p className="text-xs text-soul-muted">Your AI Companion · Always here for you 💙</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-soul-muted">Online</span>
        </div>
      </div>

      {/* Mode selector */}
      <div className="border-b border-soul-border/30 flex-shrink-0">
        <div className="overflow-x-auto hide-scrollbar">
          <SoulModeSelector activeMode={soulMode} onModeChange={setSoulMode} />
        </div>
      </div>

      {/* Chat — fills all remaining space above the nav */}
      <div className="flex-1 overflow-hidden min-h-0 w-full max-w-2xl mx-auto lg:max-w-full">
        <SoulChat mode={soulMode} />
      </div>
    </motion.div>
  );
}
