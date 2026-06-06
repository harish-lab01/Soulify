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
  const ref = await addDoc(collection(db, 'posts'), {
    ...data,
    reactionCounts: { hug: 0, feel_this: 0, got_this: 0, same: 0, love: 0 },
    commentCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getPosts = (callback, communityId = null, lastDoc = null, onError = null) => {
  let q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  if (communityId) {
    q = query(
      collection(db, 'posts'),
      where('communityId', '==', communityId),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
  }
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
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

export const toggleReaction = async (postId, userId, reactionType) => {
  const reactionRef = doc(db, 'posts', postId, 'reactions', userId);
  const snap = await getDoc(reactionRef);

  if (snap.exists() && snap.data().type === reactionType) {
    // Remove reaction
    await deleteDoc(reactionRef);
    await updateDoc(doc(db, 'posts', postId), {
      [`reactionCounts.${reactionType}`]: increment(-1),
    });
    return null;
  } else {
    // Add or change reaction
    if (snap.exists()) {
      // Remove old reaction count
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
  await deleteDoc(doc(db, 'posts', postId));
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

// ─── Connections ──────────────────────────────────────────────────────────────

export const searchUsers = async (searchTerm) => {
  const q = query(
    collection(db, 'users'),
    where('username', '>=', searchTerm),
    where('username', '<=', searchTerm + '\uf8ff'),
    limit(10)
  );
  const snap = await getDocs(q);
  const users = [];
  snap.forEach(d => users.push({ id: d.id, ...d.data() }));
  return users;
};

export { serverTimestamp };
