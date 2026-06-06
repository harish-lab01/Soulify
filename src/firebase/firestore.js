import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  deleteDoc,
  startAfter,
  arrayUnion,
  arrayRemove,
  collectionGroup,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from './config';

// ─── Users ────────────────────────────────────────────────────────────────────

export const createUser = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    joinedAt: serverTimestamp(),
    badges: ['early_bird'],
    communities: [],
    connectionCount: 0,
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    onboardingComplete: false,
  });
};

export const getUser = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateUser = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), data);
};

export const completeOnboarding = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    onboardingComplete: true,
  });
};

// ─── Mood Check-ins ───────────────────────────────────────────────────────────

export const saveMoodCheckin = async (userId, date, data) => {
  await setDoc(doc(db, 'mood_checkins', userId, 'checkins', date), {
    ...data,
    timestamp: serverTimestamp(),
    date,
  });
};

export const getMoodCheckin = async (userId, date) => {
  const snap = await getDoc(doc(db, 'mood_checkins', userId, 'checkins', date));
  return snap.exists() ? snap.data() : null;
};

export const getMoodHistory = async (userId) => {
  const snap = await getDocs(
    query(collection(db, 'mood_checkins', userId, 'checkins'), orderBy('date', 'desc'), limit(90))
  );
  const result = {};
  snap.forEach(d => { result[d.id] = d.data(); });
  return result;
};

// ─── Soul Conversations ───────────────────────────────────────────────────────

export const saveSoulMessage = async (userId, data) => {
  await addDoc(collection(db, 'soul_conversations', userId, 'messages'), {
    ...data,
    timestamp: serverTimestamp(),
  });
};

export const getSoulMessages = (userId, callback) => {
  return onSnapshot(
    query(
      collection(db, 'soul_conversations', userId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    ),
    (snap) => {
      const messages = [];
      snap.forEach(d => messages.push({ id: d.id, ...d.data() }));
      callback(messages);
    }
  );
};

// ─── Posts ────────────────────────────────────────────────────────────────────

export const createPost = async (data) => {
  if (data.imageURL && data.imageURL.length > 750 * 1024) {
    const err = new Error('Image data exceeds Firestore document size limit.');
    err.code = 'invalid-argument';
    throw err;
  }

  const ref = await addDoc(collection(db, 'posts'), {
    ...data,
    reactionCounts: { hug: 0, feel_this: 0, got_this: 0, same: 0, love: 0 },
    commentCount: 0,
    viewCount: 0,
    createdAt: serverTimestamp(),
  });

  // increment user postCount
  if (data.authorId) {
    await updateDoc(doc(db, 'users', data.authorId), { postCount: increment(1) });
  }

  return ref.id;
};

export const getPosts = (callback, communityId = null, lastDoc = null, onError = null) => {
  let constraints = [orderBy('createdAt', 'desc'), limit(20)];
  if (communityId) constraints = [where('communityId', '==', communityId), ...constraints];
  if (lastDoc) constraints = [...constraints, startAfter(lastDoc)];

  const q = query(collection(db, 'posts'), ...constraints);

  return onSnapshot(
    q,
    (snap) => {
      const posts = [];
      snap.forEach(d => posts.push({ id: d.id, ...d.data() }));
      callback(posts, snap.docs[snap.docs.length - 1]);
    },
    (err) => {
      console.error('Firestore snapshot error:', err);
      if (onError) onError(err);
    }
  );
};

// Fetch next page of posts (one-time, not real-time)
export const getMorePosts = async (lastDoc, communityId = null) => {
  let constraints = [orderBy('createdAt', 'desc'), limit(20), startAfter(lastDoc)];
  if (communityId) constraints = [where('communityId', '==', communityId), ...constraints];
  const q = query(collection(db, 'posts'), ...constraints);
  const snap = await getDocs(q);
  const posts = [];
  snap.forEach(d => posts.push({ id: d.id, ...d.data() }));
  return { posts, lastDoc: snap.docs[snap.docs.length - 1] };
};

// Get posts by a specific user (for profile feed)
export const getUserPosts = (userId, callback) => {
  const q = query(
    collection(db, 'posts'),
    where('authorId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(q, (snap) => {
    const posts = [];
    snap.forEach(d => posts.push({ id: d.id, ...d.data() }));
    callback(posts);
  });
};

// Get posts from followed users (following feed)
export const getFollowingPosts = async (followingIds, lastDoc = null) => {
  if (!followingIds || followingIds.length === 0) return { posts: [], lastDoc: null };
  // Firestore 'in' supports max 30 values — chunk if needed
  const chunks = [];
  for (let i = 0; i < followingIds.length; i += 10) {
    chunks.push(followingIds.slice(i, i + 10));
  }
  let allPosts = [];
  for (const chunk of chunks) {
    let constraints = [
      where('authorId', 'in', chunk),
      orderBy('createdAt', 'desc'),
      limit(20),
    ];
    if (lastDoc) constraints.push(startAfter(lastDoc));
    const q = query(collection(db, 'posts'), ...constraints);
    const snap = await getDocs(q);
    snap.forEach(d => allPosts.push({ id: d.id, ...d.data() }));
  }
  allPosts.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() || 0;
    const tb = b.createdAt?.toMillis?.() || 0;
    return tb - ta;
  });
  return { posts: allPosts.slice(0, 20), lastDoc: null };
};

export const toggleReaction = async (postId, userId, reactionType) => {
  const reactionRef = doc(db, 'posts', postId, 'reactions', userId);
  const snap = await getDoc(reactionRef);

  if (snap.exists() && snap.data().type === reactionType) {
    await deleteDoc(reactionRef);
    await updateDoc(doc(db, 'posts', postId), {
      [`reactionCounts.${reactionType}`]: increment(-1),
    });
    return null;
  } else {
    if (snap.exists()) {
      await updateDoc(doc(db, 'posts', postId), {
        [`reactionCounts.${snap.data().type}`]: increment(-1),
      });
    }
    await setDoc(reactionRef, { type: reactionType });
    await updateDoc(doc(db, 'posts', postId), {
      [`reactionCounts.${reactionType}`]: increment(1),
    });
    return reactionType;
  }
};

export const getUserReaction = async (postId, userId) => {
  const snap = await getDoc(doc(db, 'posts', postId, 'reactions', userId));
  return snap.exists() ? snap.data().type : null;
};

export const addComment = async (postId, data) => {
  const ref = await addDoc(collection(db, 'posts', postId, 'comments'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'posts', postId), {
    commentCount: increment(1),
  });
  // Notify post author
  const postSnap = await getDoc(doc(db, 'posts', postId));
  if (postSnap.exists() && postSnap.data().authorId !== data.authorId) {
    await createNotification(postSnap.data().authorId, {
      type: 'comment',
      fromUserId: data.authorId,
      fromUserName: data.authorName,
      fromUserPhoto: data.authorPhoto,
      postId,
      message: `${data.authorName} commented on your post`,
    });
  }
  return ref.id;
};

export const getComments = (postId, callback) => {
  return onSnapshot(
    query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    ),
    (snap) => {
      const comments = [];
      snap.forEach(d => comments.push({ id: d.id, ...d.data() }));
      callback(comments);
    }
  );
};

export const deletePost = async (postId) => {
  const postSnap = await getDoc(doc(db, 'posts', postId));
  if (postSnap.exists()) {
    const authorId = postSnap.data().authorId;
    if (authorId) {
      await updateDoc(doc(db, 'users', authorId), { postCount: increment(-1) });
    }
  }
  await deleteDoc(doc(db, 'posts', postId));
};

// Poll voting
export const votePoll = async (postId, userId, optionIndex) => {
  const voteRef = doc(db, 'posts', postId, 'pollVotes', userId);
  const snap = await getDoc(voteRef);
  if (snap.exists()) return; // Already voted
  await setDoc(voteRef, { optionIndex });
  await updateDoc(doc(db, 'posts', postId), {
    [`poll.options.${optionIndex}.votes`]: increment(1),
  });
};

export const getPollVote = async (postId, userId) => {
  const snap = await getDoc(doc(db, 'posts', postId, 'pollVotes', userId));
  return snap.exists() ? snap.data().optionIndex : null;
};

// ─── Communities ──────────────────────────────────────────────────────────────

export const getCommunities = async () => {
  const snap = await getDocs(collection(db, 'communities'));
  const communities = [];
  snap.forEach(d => communities.push({ id: d.id, ...d.data() }));
  return communities;
};

export const joinCommunity = async (userId, communityId) => {
  await updateDoc(doc(db, 'users', userId), {
    communities: arrayUnion(communityId),
  });
};

export const leaveCommunity = async (userId, communityId) => {
  await updateDoc(doc(db, 'users', userId), {
    communities: arrayRemove(communityId),
  });
};

// ─── Follow / Unfollow System ─────────────────────────────────────────────────

// Follow a user
export const followUser = async (currentUserId, targetUserId) => {
  // Add to current user's following
  await setDoc(doc(db, 'users', currentUserId, 'following', targetUserId), {
    userId: targetUserId,
    createdAt: serverTimestamp(),
  });
  // Add to target user's followers
  await setDoc(doc(db, 'users', targetUserId, 'followers', currentUserId), {
    userId: currentUserId,
    createdAt: serverTimestamp(),
  });
  // Update counts
  await updateDoc(doc(db, 'users', currentUserId), { followingCount: increment(1) });
  await updateDoc(doc(db, 'users', targetUserId), { followerCount: increment(1) });
  // Send notification
  const currentUserSnap = await getDoc(doc(db, 'users', currentUserId));
  if (currentUserSnap.exists()) {
    const cu = currentUserSnap.data();
    await createNotification(targetUserId, {
      type: 'follow',
      fromUserId: currentUserId,
      fromUserName: cu.displayName || 'Someone',
      fromUserPhoto: cu.photoURL || '',
      message: `${cu.displayName || 'Someone'} started following you`,
    });
  }
};

// Unfollow a user
export const unfollowUser = async (currentUserId, targetUserId) => {
  await deleteDoc(doc(db, 'users', currentUserId, 'following', targetUserId));
  await deleteDoc(doc(db, 'users', targetUserId, 'followers', currentUserId));
  await updateDoc(doc(db, 'users', currentUserId), { followingCount: increment(-1) });
  await updateDoc(doc(db, 'users', targetUserId), { followerCount: increment(-1) });
};

// Check if current user follows target
export const isFollowing = async (currentUserId, targetUserId) => {
  const snap = await getDoc(doc(db, 'users', currentUserId, 'following', targetUserId));
  return snap.exists();
};

// Get followers list
export const getFollowers = async (userId) => {
  const snap = await getDocs(collection(db, 'users', userId, 'followers'));
  const ids = [];
  snap.forEach(d => ids.push(d.id));
  // Fetch full profiles
  const profiles = await Promise.all(ids.map(id => getUser(id)));
  return profiles.filter(Boolean);
};

// Get following list
export const getFollowing = async (userId) => {
  const snap = await getDocs(collection(db, 'users', userId, 'following'));
  const ids = [];
  snap.forEach(d => ids.push(d.id));
  const profiles = await Promise.all(ids.map(id => getUser(id)));
  return profiles.filter(Boolean);
};

// Get following IDs only (faster)
export const getFollowingIds = async (userId) => {
  const snap = await getDocs(collection(db, 'users', userId, 'following'));
  const ids = [];
  snap.forEach(d => ids.push(d.id));
  return ids;
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const createNotification = async (userId, data) => {
  await addDoc(collection(db, 'notifications', userId, 'items'), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
};

export const getNotifications = (userId, callback) => {
  return onSnapshot(
    query(
      collection(db, 'notifications', userId, 'items'),
      orderBy('createdAt', 'desc'),
      limit(50)
    ),
    (snap) => {
      const notifications = [];
      snap.forEach(d => notifications.push({ id: d.id, ...d.data() }));
      callback(notifications);
    }
  );
};

export const markNotificationRead = async (userId, notifId) => {
  await updateDoc(doc(db, 'notifications', userId, 'items', notifId), { read: true });
};

export const markAllNotificationsRead = async (userId) => {
  const snap = await getDocs(
    query(collection(db, 'notifications', userId, 'items'), where('read', '==', false))
  );
  const batch = snap.docs.map(d =>
    updateDoc(doc(db, 'notifications', userId, 'items', d.id), { read: true })
  );
  await Promise.all(batch);
};

// ─── Stories ──────────────────────────────────────────────────────────────────

export const createStory = async (userId, data) => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  const ref = await addDoc(collection(db, 'stories'), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    expiresAt,
    viewers: [],
    viewCount: 0,
  });
  return ref.id;
};

export const getActiveStories = (callback) => {
  const now = new Date();
  // Get stories from last 24h — filter in app since Firestore needs index for this query
  return onSnapshot(
    query(
      collection(db, 'stories'),
      orderBy('createdAt', 'desc'),
      limit(100)
    ),
    (snap) => {
      const stories = [];
      snap.forEach(d => {
        const data = d.data();
        // Filter expired stories client-side
        const expiry = data.expiresAt?.toDate?.() || new Date(0);
        if (expiry > now) {
          stories.push({ id: d.id, ...data });
        }
      });
      // Group by user
      const grouped = {};
      stories.forEach(s => {
        if (!grouped[s.userId]) grouped[s.userId] = [];
        grouped[s.userId].push(s);
      });
      callback(grouped);
    }
  );
};

export const markStoryViewed = async (storyId, viewerId) => {
  await updateDoc(doc(db, 'stories', storyId), {
    viewers: arrayUnion(viewerId),
    viewCount: increment(1),
  });
};

export const deleteStory = async (storyId) => {
  await deleteDoc(doc(db, 'stories', storyId));
};

// ─── Community Events ─────────────────────────────────────────────────────────

export const createCommunityEvent = async (communityId, data) => {
  const ref = await addDoc(collection(db, 'communities', communityId, 'events'), {
    ...data,
    communityId,
    attendees: [],
    attendeeCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getCommunityEvents = (communityId, callback) => {
  const now = new Date();
  return onSnapshot(
    query(
      collection(db, 'communities', communityId, 'events'),
      orderBy('eventDate', 'asc'),
      limit(20)
    ),
    (snap) => {
      const events = [];
      snap.forEach(d => events.push({ id: d.id, ...d.data() }));
      callback(events);
    }
  );
};

export const rsvpEvent = async (communityId, eventId, userId) => {
  const eventRef = doc(db, 'communities', communityId, 'events', eventId);
  const snap = await getDoc(eventRef);
  if (!snap.exists()) return;
  const attendees = snap.data().attendees || [];
  if (attendees.includes(userId)) {
    await updateDoc(eventRef, {
      attendees: arrayRemove(userId),
      attendeeCount: increment(-1),
    });
  } else {
    await updateDoc(eventRef, {
      attendees: arrayUnion(userId),
      attendeeCount: increment(1),
    });
  }
};

// ─── Search ───────────────────────────────────────────────────────────────────

export const searchUsers = async (searchTerm) => {
  if (!searchTerm.trim()) return [];
  const term = searchTerm.toLowerCase();
  // Search by displayName prefix
  const q1 = query(
    collection(db, 'users'),
    where('displayName', '>=', searchTerm),
    where('displayName', '<=', searchTerm + '\uf8ff'),
    limit(10)
  );
  // Search by username prefix
  const q2 = query(
    collection(db, 'users'),
    where('username', '>=', term),
    where('username', '<=', term + '\uf8ff'),
    limit(10)
  );
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const usersMap = {};
  snap1.forEach(d => { usersMap[d.id] = { id: d.id, ...d.data() }; });
  snap2.forEach(d => { usersMap[d.id] = { id: d.id, ...d.data() }; });
  return Object.values(usersMap);
};

// Get suggested users (non-following users to discover)
export const getSuggestedUsers = async (currentUserId, followingIds = []) => {
  const excludeIds = [currentUserId, ...followingIds];
  const snap = await getDocs(
    query(collection(db, 'users'), orderBy('followerCount', 'desc'), limit(20))
  );
  const users = [];
  snap.forEach(d => {
    if (!excludeIds.includes(d.id)) {
      users.push({ id: d.id, ...d.data() });
    }
  });
  return users.slice(0, 8);
};

// Get trending posts (most reactions in last 48h)
export const getTrendingPosts = async () => {
  const snap = await getDocs(
    query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50))
  );
  const posts = [];
  snap.forEach(d => posts.push({ id: d.id, ...d.data() }));
  // Score by total reactions
  return posts
    .map(p => ({
      ...p,
      score: Object.values(p.reactionCounts || {}).reduce((a, b) => a + b, 0) + (p.commentCount || 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
};

export { serverTimestamp };
