/**
 * Badge auto-awarding hook.
 * Idempotent — won't add a badge the user already has.
 * Call checkAndAward() after any action that might unlock a badge.
 */
import { useCallback } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { createNotification } from '../firebase/firestore';
import { db } from '../firebase/config';

export function useBadgeAwarder() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { addToast } = useApp();

  /** Award a single badge — safe to call even if already owned */
  const awardBadge = useCallback(async (badgeId, badgeName, badgeEmoji) => {
    if (!user || !userProfile) return;
    if (userProfile.badges?.includes(badgeId)) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        badges: arrayUnion(badgeId),
      });
      await refreshProfile();
      addToast(`🏆 Badge earned: ${badgeEmoji} ${badgeName}`, 'success');
      await createNotification(user.uid, {
        type: 'badge',
        fromUserId: 'system',
        fromUserName: 'Soulify',
        fromUserPhoto: '',
        message: `You earned the "${badgeName}" badge ${badgeEmoji}`,
      });
    } catch {
      // Non-critical — silently fail
    }
  }, [user, userProfile, addToast, refreshProfile]);

  /**
   * Check ALL badge conditions and award any newly earned ones.
   * Pass current counts — missing values fall back to userProfile.
   */
  const checkAndAward = useCallback(async ({
    postCount,
    followerCount,
    communityCount,
    streak,
    hasChatted,
  } = {}) => {
    if (!user || !userProfile) return;

    const badges = userProfile.badges || [];
    const pc = postCount      ?? userProfile.postCount          ?? 0;
    const cc = communityCount ?? userProfile.communities?.length ?? 0;
    const fc = followerCount  ?? userProfile.followerCount       ?? 0;
    const s  = streak         ?? 0;

    const checks = [
      { id: 'soul_seeker',   name: 'Soul Seeker',   emoji: '✨', cond: hasChatted },
      { id: 'storyteller',   name: 'Storyteller',   emoji: '📝', cond: pc >= 5 },
      { id: 'community_gem', name: 'Community Gem', emoji: '💎', cond: cc >= 3 },
      { id: 'connector',     name: 'Connector',     emoji: '🤝', cond: fc >= 1 },
      { id: 'mood_master',   name: 'Mood Master',   emoji: '😊', cond: s >= 7 },
      { id: 'streak_7',      name: '7-Day Streak',  emoji: '🔥', cond: s >= 7 },
      { id: 'night_owl',     name: 'Night Owl',     emoji: '🌙', cond: hasChatted && new Date().getHours() >= 22 },
    ];

    for (const { id, name, emoji, cond } of checks) {
      if (cond && !badges.includes(id)) {
        await awardBadge(id, name, emoji);
      }
    }
  }, [user, userProfile, awardBadge]);

  return { awardBadge, checkAndAward };
}
