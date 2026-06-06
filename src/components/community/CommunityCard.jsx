import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import Button from '../ui/Button';

export default function CommunityCard({ community, joined, onJoin, onView }) {
  return (
    <motion.div
      className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-4"
      style={{ boxShadow: '0 8px 32px rgba(124, 111, 247, 0.06)' }}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Color header */}
      <div
        className="h-14 rounded-2xl mb-3 flex items-center justify-center text-3xl"
        style={{ backgroundColor: `${community.color}20` }}
      >
        {community.emoji}
      </div>

      <h3 className="font-display font-bold text-soul-text text-base">{community.name}</h3>
      <p className="text-xs text-soul-muted mt-1 mb-3 line-clamp-2">{community.desc}</p>

      <div className="flex gap-2">
        <Button
          variant={joined ? 'ghost' : 'primary'}
          size="sm"
          onClick={onJoin}
          className="flex-1"
        >
          {joined ? '✓ Joined' : 'Join'}
        </Button>
        <Button
          variant="soft"
          size="sm"
          onClick={onView}
          className="flex-1"
        >
          View
        </Button>
      </div>
    </motion.div>
  );
}
