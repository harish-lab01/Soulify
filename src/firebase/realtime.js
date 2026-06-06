/**
 * Firebase Realtime Database — used for:
 * 1. Direct Messages (1:1 real-time chat)
 * 2. Connection Rooms (live group chat)
 * 3. Online presence / typing indicators
 */
import {
  ref,
  push,
  set,
  onValue,
  off,
  query as rtQuery,
  orderByChild,
  limitToLast,
  serverTimestamp,
  onDisconnect,
  get,
  update,
  remove,
} from 'firebase/database';
import { rtdb } from './config';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isDmAvailable() {
  return rtdb !== null;
}

// ─── Direct Messages ──────────────────────────────────────────────────────────

/**
 * conversationId = sort([uid1, uid2]).join('_')
 */
export const generateConversationId = (uid1, uid2) =>
  [uid1, uid2].sort().join('_');

export const sendDM = async (conversationId, messageData) => {
  if (!isDmAvailable()) return null;
  const msgRef = ref(rtdb, `messages/${conversationId}`);
  const newRef = push(msgRef);
  await set(newRef, {
    ...messageData,
    timestamp: Date.now(),
    read: false,
  });
  // Update conversation metadata
  await update(ref(rtdb, `conversations/${messageData.senderId}/${conversationId}`), {
    lastMessage: messageData.content,
    lastMessageAt: Date.now(),
    otherUserId: messageData.receiverId,
    otherUserName: messageData.receiverName,
    otherUserPhoto: messageData.receiverPhoto,
    unreadCount: 0,
  });
  await update(ref(rtdb, `conversations/${messageData.receiverId}/${conversationId}`), {
    lastMessage: messageData.content,
    lastMessageAt: Date.now(),
    otherUserId: messageData.senderId,
    otherUserName: messageData.senderName,
    otherUserPhoto: messageData.senderPhoto,
    unreadCount: 1,
  });
  return newRef.key;
};

export const subscribeDMs = (conversationId, callback) => {
  if (!isDmAvailable()) {
    callback([]);
    return () => {};
  }
  const q = rtQuery(
    ref(rtdb, `messages/${conversationId}`),
    orderByChild('timestamp'),
    limitToLast(100)
  );
  const handler = onValue(q, (snap) => {
    const messages = [];
    snap.forEach(child => {
      messages.push({ id: child.key, ...child.val() });
    });
    callback(messages);
  });
  return () => off(q, 'value', handler);
};

export const subscribeConversations = (userId, callback) => {
  if (!isDmAvailable()) {
    callback([]);
    return () => {};
  }
  const convRef = ref(rtdb, `conversations/${userId}`);
  const handler = onValue(convRef, (snap) => {
    const convos = [];
    snap.forEach(child => {
      convos.push({ id: child.key, ...child.val() });
    });
    convos.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    callback(convos);
  });
  return () => off(convRef, 'value', handler);
};

export const markDMRead = async (conversationId, userId) => {
  if (!isDmAvailable()) return;
  await update(ref(rtdb, `conversations/${userId}/${conversationId}`), {
    unreadCount: 0,
  });
};

// ─── Typing Indicators ────────────────────────────────────────────────────────

export const setTyping = (conversationId, userId, isTyping) => {
  if (!isDmAvailable()) return;
  set(ref(rtdb, `typing/${conversationId}/${userId}`), isTyping ? Date.now() : null);
};

export const subscribeTyping = (conversationId, currentUserId, callback) => {
  if (!isDmAvailable()) {
    callback(false);
    return () => {};
  }
  const typingRef = ref(rtdb, `typing/${conversationId}`);
  const handler = onValue(typingRef, (snap) => {
    const data = snap.val() || {};
    const isOtherTyping = Object.entries(data).some(
      ([uid, ts]) => uid !== currentUserId && ts && Date.now() - ts < 5000
    );
    callback(isOtherTyping);
  });
  return () => off(typingRef, 'value', handler);
};

// ─── Online Presence ─────────────────────────────────────────────────────────

export const setOnline = (userId) => {
  if (!isDmAvailable()) return;
  const presenceRef = ref(rtdb, `presence/${userId}`);
  set(presenceRef, { online: true, lastSeen: Date.now() });
  onDisconnect(presenceRef).set({ online: false, lastSeen: Date.now() });
};

export const subscribePresence = (userId, callback) => {
  if (!isDmAvailable()) {
    callback({ online: false });
    return () => {};
  }
  const presenceRef = ref(rtdb, `presence/${userId}`);
  const handler = onValue(presenceRef, (snap) => {
    callback(snap.val() || { online: false });
  });
  return () => off(presenceRef, 'value', handler);
};

// ─── Connection Rooms ─────────────────────────────────────────────────────────

export const sendRoomMessage = async (roomId, messageData) => {
  if (!isDmAvailable()) return null;
  const msgRef = ref(rtdb, `rooms/${roomId}/messages`);
  const newRef = push(msgRef);
  await set(newRef, {
    ...messageData,
    timestamp: Date.now(),
  });
  return newRef.key;
};

export const subscribeRoomMessages = (roomId, callback) => {
  if (!isDmAvailable()) {
    callback([]);
    return () => {};
  }
  const q = rtQuery(
    ref(rtdb, `rooms/${roomId}/messages`),
    orderByChild('timestamp'),
    limitToLast(100)
  );
  const handler = onValue(q, (snap) => {
    const messages = [];
    snap.forEach(child => {
      messages.push({ id: child.key, ...child.val() });
    });
    callback(messages);
  });
  return () => off(q, 'value', handler);
};

export const joinRoom = async (roomId, userId, userData) => {
  if (!isDmAvailable()) return;
  await set(ref(rtdb, `rooms/${roomId}/members/${userId}`), {
    ...userData,
    joinedAt: Date.now(),
  });
};

export const leaveRoom = async (roomId, userId) => {
  if (!isDmAvailable()) return;
  await remove(ref(rtdb, `rooms/${roomId}/members/${userId}`));
};

export const subscribeRoomMembers = (roomId, callback) => {
  if (!isDmAvailable()) {
    callback([]);
    return () => {};
  }
  const membersRef = ref(rtdb, `rooms/${roomId}/members`);
  const handler = onValue(membersRef, (snap) => {
    const members = [];
    snap.forEach(child => {
      members.push({ id: child.key, ...child.val() });
    });
    callback(members);
  });
  return () => off(membersRef, 'value', handler);
};

export const setRoomTyping = (roomId, userId, isTyping) => {
  if (!isDmAvailable()) return;
  set(ref(rtdb, `rooms/${roomId}/typing/${userId}`), isTyping ? Date.now() : null);
};

export const subscribeRoomTyping = (roomId, currentUserId, callback) => {
  if (!isDmAvailable()) {
    callback([]);
    return () => {};
  }
  const typingRef = ref(rtdb, `rooms/${roomId}/typing`);
  const handler = onValue(typingRef, (snap) => {
    const data = snap.val() || {};
    const typingUsers = Object.entries(data)
      .filter(([uid, ts]) => uid !== currentUserId && ts && Date.now() - ts < 5000)
      .map(([uid]) => uid);
    callback(typingUsers);
  });
  return () => off(typingRef, 'value', handler);
};
