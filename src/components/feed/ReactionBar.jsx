import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { REACTIONS } from '../../utils/constants';
import {
  toggleReaction,
  getUserReaction,
  createNotification,
  getUser,
} from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export default function ReactionBar({ postId, reactionCounts = {}, postAuthorId }) {
  const { user, userProfile } = useAuth();
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
    setTimeout(() => setAnimating(null), 500);

    const newCounts = { ...localCounts };
    const prevReaction = userReaction;
    const isRemoving = prevReaction === reactionId;

    // Optimistic update
    if (isRemoving) {
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

    // Persist to Firestore
    const result = await toggleReaction(postId, user.uid, reactionId);

    // Fire notification when adding a reaction (not removing, not own post)
    if (result && postAuthorId && postAuthorId !== user.uid) {
      try {
        const reaction = REACTIONS.find(r => r.id === reactionId);
        await createNotification(postAuthorId, {
          type: 'reaction',
          fromUserId: user.uid,
          fromUserName: userProfile?.displayName || 'Someone',
          fromUserPhoto: userProfile?.photoURL || '',
          postId,
          message: `${userProfile?.displayName || 'Someone'} reacted ${reaction?.emoji || '❤️'} to your post`,
        });
      } catch (e) {
        // Notification failure is non-critical
      }
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {REACTIONS.map(reaction => {
        const count = localCounts[reaction.id] || 0;
        const isActive = userReaction === reaction.id;

        return (
          <motion.button
            key={reaction.id}
            onClick={() => handleReaction(reaction.id)}
            className={`
              flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold
              transition-all border
              ${isActive
                ? 'border-transparent text-white'
                : 'bg-soul-bg border-soul-border text-soul-muted hover:border-soul-primary/40 hover:bg-white'
              }
            `}
            style={isActive ? {
              backgroundColor: reaction.color,
              boxShadow: `0 2px 10px ${reaction.color}60`,
            } : {}}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.88 }}
            animate={animating === reaction.id
              ? { scale: [1, 1.5, 0.9, 1.1, 1] }
              : { scale: 1 }
            }
            transition={{ duration: 0.4 }}
          >
            <motion.span
              animate={animating === reaction.id ? { rotate: [0, -15, 15, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              {reaction.emoji}
            </motion.span>
            {count > 0 && <span>{count}</span>}
          </motion.button>
        );
      })}
    </div>
  );
}
