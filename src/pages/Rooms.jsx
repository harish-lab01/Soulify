import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, ArrowLeft, Hash } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  sendRoomMessage,
  subscribeRoomMessages,
  subscribeRoomMembers,
  joinRoom,
  leaveRoom,
  setRoomTyping,
  subscribeRoomTyping,
} from '../firebase/realtime';
import { ROOMS } from '../utils/constants';
import TopBar from '../components/layout/TopBar';
import Avatar from '../components/ui/Avatar';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

// ─── Single Room Chat ─────────────────────────────────────────────────────────
function RoomChat({ room }) {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    joinRoom(room.id, user.uid, {
      displayName: userProfile?.displayName || 'Anonymous',
      photoURL: userProfile?.photoURL || '',
    });
    return () => leaveRoom(room.id, user.uid);
  }, [room.id, user]);

  useEffect(() => {
    const unsubMsgs = subscribeRoomMessages(room.id, setMessages);
    const unsubMembers = subscribeRoomMembers(room.id, setMembers);
    const unsubTyping = subscribeRoomTyping(room.id, user?.uid, setTypingUsers);
    return () => { unsubMsgs(); unsubMembers(); unsubTyping(); };
  }, [room.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setRoomTyping(room.id, user.uid, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setRoomTyping(room.id, user.uid, false), 2000);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    setRoomTyping(room.id, user.uid, false);
    try {
      await sendRoomMessage(room.id, {
        senderId: user.uid,
        senderName: userProfile?.displayName || 'Anonymous',
        senderPhoto: userProfile?.photoURL || '',
        content,
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-soul-border/50"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}
      >
        <motion.button
          onClick={() => navigate('/rooms')}
          className="p-2 rounded-full hover:bg-soul-bg"
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft size={20} className="text-soul-muted" />
        </motion.button>

        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${room.color}20` }}
        >
          {room.emoji}
        </div>

        <div className="flex-1">
          <p className="font-semibold text-sm text-soul-text">{room.name}</p>
          <p className="text-xs text-soul-muted flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
            {members.length} {members.length === 1 ? 'person' : 'people'} here
          </p>
        </div>

        {/* Member avatars */}
        <div className="flex -space-x-2">
          {members.slice(0, 4).map(m => (
            <Avatar key={m.id} src={m.photoURL} name={m.displayName} size="xs" />
          ))}
          {members.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-soul-bg border-2 border-white flex items-center justify-center text-[10px] font-bold text-soul-muted">
              +{members.length - 4}
            </div>
          )}
        </div>
      </div>

      {/* Room description banner */}
      <div
        className="px-4 py-3 text-sm text-center font-medium"
        style={{ backgroundColor: `${room.color}10`, color: room.color }}
      >
        {room.desc}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-3">{room.emoji}</div>
            <p className="font-semibold text-soul-text">Welcome to {room.name}</p>
            <p className="text-sm text-soul-muted mt-1">{room.desc}</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === user?.uid;
          const showName = !isMe && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);

          return (
            <motion.div
              key={msg.id}
              className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {!isMe && (
                <div className="w-7 flex-shrink-0">
                  {showName && (
                    <Avatar src={msg.senderPhoto} name={msg.senderName} size="xs" />
                  )}
                </div>
              )}
              <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                {showName && !isMe && (
                  <p className="text-[11px] font-semibold text-soul-muted ml-1 mb-0.5">{msg.senderName}</p>
                )}
                <div
                  className={`px-4 py-2.5 rounded-3xl text-sm leading-relaxed ${
                    isMe
                      ? 'text-white rounded-br-lg'
                      : 'bg-white/80 border border-soul-border text-soul-text rounded-bl-lg'
                  }`}
                  style={isMe ? { background: `linear-gradient(135deg, ${room.color} 0%, ${room.color}cc 100%)` } : {}}
                >
                  {msg.content}
                </div>
                <p className="text-[10px] text-soul-muted mt-0.5 mx-1">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              className="flex items-center gap-2 text-xs text-soul-muted"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex gap-1 px-3 py-2 bg-white/60 rounded-full border border-soul-border">
                {[0,1,2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-soul-muted"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
              <span>{typingUsers.length} typing...</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-soul-border/50"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-end gap-2 bg-white rounded-3xl border border-soul-border shadow-sm px-4 py-2">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Say something in ${room.name}...`}
            className="flex-1 bg-transparent text-sm text-soul-text placeholder-soul-muted resize-none outline-none max-h-24 leading-relaxed py-1.5"
            rows={1}
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ backgroundColor: room.color }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send size={15} className="text-white ml-0.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ─── Rooms List ───────────────────────────────────────────────────────────────
export default function Rooms() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const selectedRoom = roomId ? ROOMS.find(r => r.id === roomId) : null;

  if (selectedRoom) return <RoomChat room={selectedRoom} />;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <TopBar title="Connection Rooms" backButton={() => navigate(-1)} />

      <div className="hidden lg:block px-6 pt-6 pb-2">
        <h1 className="font-display font-bold text-2xl text-soul-text">Connection Rooms</h1>
        <p className="text-soul-muted text-sm mt-0.5">Live group spaces to connect</p>
      </div>

      <div className="px-4 lg:px-6 py-4 max-w-lg mx-auto lg:max-w-2xl space-y-4">

        {/* Hero */}
        <div
          className="rounded-3xl p-6 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-semibold opacity-80">Live Rooms</span>
            </div>
            <h2 className="font-display font-bold text-2xl">Be Heard. Feel Seen.</h2>
            <p className="text-sm opacity-80 mt-1">
              Real-time group chats where no one judges — just listens.
            </p>
          </div>
        </div>

        {/* Room cards */}
        <div className="space-y-3">
          {ROOMS.map((room, i) => (
            <motion.div
              key={room.id}
              onClick={() => navigate(`/rooms/${room.id}`)}
              className="glass-card p-5 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
              whileHover={{ y: -2, boxShadow: `0 8px 32px ${room.color}20` }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ backgroundColor: `${room.color}15` }}
                >
                  {room.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-soul-text">{room.name}</h3>
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  </div>
                  <p className="text-sm text-soul-muted mt-0.5">{room.desc}</p>
                </div>
                <div
                  className="text-xs font-semibold px-3 py-1.5 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: room.color }}
                >
                  Join
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-2 mt-3 ml-18">
                {room.id === 'vent_room' && (
                  <>
                    <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ backgroundColor: `${room.color}15`, color: room.color }}>Safe space</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ backgroundColor: `${room.color}15`, color: room.color }}>No advice</span>
                  </>
                )}
                {room.id === 'focus_room' && (
                  <>
                    <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ backgroundColor: `${room.color}15`, color: room.color }}>Silent working</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ backgroundColor: `${room.color}15`, color: room.color }}>Accountability</span>
                  </>
                )}
                {room.id === 'chill_room' && (
                  <>
                    <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ backgroundColor: `${room.color}15`, color: room.color }}>Casual vibes</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ backgroundColor: `${room.color}15`, color: room.color }}>Make friends</span>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info note */}
        <div className="text-center py-4">
          <p className="text-xs text-soul-muted">
            🔒 Rooms are safe, anonymous spaces. Be kind to each other.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
