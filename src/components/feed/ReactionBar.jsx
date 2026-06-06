import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REACTIONS } from '../../utils/constants';
import { toggleReaction, getUserReaction } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export default function ReactionBar({ postId, reactionCounts = {} }) {
  const { user } = useAuth();
  const [userReaction, setUserReaction] = useState(null);
  const [localCounts, setLocalCounts] = useState(reactionCounts);
  const [animating, setAnimating] = useState(null);

  useEffect(() => {
    setLocalCounts(reactionCounts);
  }, [reactionCounts]);

  useEffect(() => {
    if (user) {
      getUserReaction(postId, user.uid).then(setUserReaction);
    }
  }, [postId, user]);

  const handleReaction = async (reactionId) => {
    if (!user) return;

    setAnimating(reactionId);
    setTimeout(() => setAnimating(null), 400);

    const newCounts = { ...localCounts };
    const prevReaction = userReaction;

    // Optimistic update
    if (prevReaction === reactionId) {
      newCounts[reactionId] = Math.max(0, (newCounts[reactionId] || 0) - 1);
      setUserReaction(null);
    } else {
      if (prevReaction) {
        newCounts[prevReaction] = Math.max(0, (newCounts[prevReaction] || 0) - 1);
      }
      newCounts[reactionId] = (newCounts[reactionId] || 0) + 1;
      setUserReaction(reactionId);
    }
    setLocalCounts(newCounts);

    // Persist
    await toggleReaction(postId, user.uid, reactionId);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {REACTIONS.map(reaction => {
        const count = localCounts[reaction.id] || 0;
        const isActive = userReaction === reaction.id;

        return (
          <motion.button
            key={reaction.id}
            onClick={() => handleReaction(reaction.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
              transition-all border
              ${isActive
                ? 'border-transparent text-white'
                : 'bg-soul-bg border-soul-border text-soul-muted hover:border-soul-primary/30'
              }
            `}
            style={isActive ? {
              backgroundColor: reaction.color,
              boxShadow: `0 2px 8px ${reaction.color}50`,
            } : {}}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            animate={animating === reaction.id ? {
              scale: [1, 1.4, 1],
            } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span>{reaction.emoji}</span>
            {count > 0 && <span>{count}</span>}
          </motion.button>
        );
      })}
    </div>
  );
}
