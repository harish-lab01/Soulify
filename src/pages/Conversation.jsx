import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone, ArrowLeft } from 'lucide-react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  generateConversationId,
  sendDM,
  subscribeDMs,
  markDMRead,
  setTyping,
  subscribeTyping,
  subscribePresence,
  setOnline,
} from '../firebase/realtime';
import { getUser } from '../firebase/firestore';
import Avatar from '../components/ui/Avatar';

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit:    { opacity: 0, x: 40, transition: { duration: 0.2 } },
};

export default function Conversation() {
  const { otherUserId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(
    location.state
      ? { displayName: location.state.otherUserName, photoURL: location.state.otherUserPhoto }
      : null
  );
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [presence, setPresence] = useState({ online: false });

  const conversationId = user ? generateConversationId(user.uid, otherUserId) : null;
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Load other user profile
  useEffect(() => {
    if (!otherUser?.uid) {
      getUser(otherUserId).then(p => { if (p) setOtherUser(p); });
    }
  }, [otherUserId]);

  // Set own online status
  useEffect(() => {
    if (user) setOnline(user.uid);
  }, [user]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId) return;
    const unsub = subscribeDMs(conversationId, (msgs) => {
      setMessages(msgs);
      markDMRead(conversationId, user.uid);
    });
    return unsub;
  }, [conversationId]);

  // Subscribe to typing indicator
  useEffect(() => {
    if (!conversationId) return;
    const unsub = subscribeTyping(conversationId, user.uid, setIsOtherTyping);
    return unsub;
  }, [conversationId]);

  // Subscribe to presence
  useEffect(() => {
    const unsub = subscribePresence(otherUserId, setPresence);
    return unsub;
  }, [otherUserId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherTyping]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (conversationId) {
      setTyping(conversationId, user.uid, true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setTyping(conversationId, user.uid, false);
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !conversationId) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    setTyping(conversationId, user.uid, false);
    try {
      await sendDM(conversationId, {
        senderId: user.uid,
        senderName: userProfile?.displayName || 'You',
        senderPhoto: userProfile?.photoURL || '',
        receiverId: otherUserId,
        receiverName: otherUser?.displayName || '',
        receiverPhoto: otherUser?.photoURL || '',
        content,
      });
    } catch (e) {
      console.error('Send DM error:', e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      className="flex flex-col h-screen lg:h-[calc(100vh-0px)]"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-soul-border/50"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}
      >
        <motion.button
          onClick={() => navigate('/messages')}
          className="p-2 rounded-full hover:bg-soul-bg"
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft size={20} className="text-soul-muted" />
        </motion.button>

        <div className="relative">
          <Avatar src={otherUser?.photoURL} name={otherUser?.displayName} size="md" />
          {presence.online && (
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-400 rounded-full ring-2 ring-white" />
          )}
        </div>

        <div className="flex-1">
          <p className="font-semibold text-sm text-soul-text">{otherUser?.displayName || '...'}</p>
          <p className="text-xs text-soul-muted">
            {isOtherTyping ? (
              <span className="text-soul-primary">typing...</span>
            ) : presence.online ? (
              <span className="text-green-500">Online</span>
            ) : (
              'offline'
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-3 text-3xl"
              style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #fde8f0 100%)' }}
            >
              💬
            </div>
            <p className="font-semibold text-soul-text">Start the conversation</p>
            <p className="text-sm text-soul-muted mt-1">
              Say hi to {otherUser?.displayName || 'them'} 👋
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === user?.uid;
          const showAvatar = !isMe && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);

          return (
            <motion.div
              key={msg.id}
              className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {!isMe && (
                <div className="w-7 flex-shrink-0">
                  {showAvatar && (
                    <Avatar src={otherUser?.photoURL} name={otherUser?.displayName} size="xs" />
                  )}
                </div>
              )}
              <div
                className={`max-w-[72%] px-4 py-2.5 rounded-3xl text-sm leading-relaxed ${
                  isMe
                    ? 'text-white rounded-br-lg'
                    : 'bg-white/80 backdrop-blur-sm border border-soul-border text-soul-text rounded-bl-lg'
                }`}
                style={isMe ? { background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' } : {}}
              >
                {msg.content}
                <div className={`text-[10px] mt-0.5 ${isMe ? 'text-white/60 text-right' : 'text-soul-muted'}`}>
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        <AnimatePresence>
          {isOtherTyping && (
            <motion.div
              className="flex items-end gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Avatar src={otherUser?.photoURL} name={otherUser?.displayName} size="xs" />
              <div className="bg-white/80 border border-soul-border rounded-3xl rounded-bl-lg px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-soul-muted"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
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
            placeholder={`Message ${otherUser?.displayName || ''}...`}
            className="flex-1 bg-transparent text-sm text-soul-text placeholder-soul-muted resize-none outline-none max-h-28 leading-relaxed py-1.5"
            rows={1}
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send size={15} className="text-white ml-0.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
