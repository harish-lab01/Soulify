import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { callSoul, buildSystemPrompt } from '../../gemini/api';
import { saveSoulMessage, getSoulMessages } from '../../firebase/firestore';
import { detectCrisis, CRISIS_RESOURCES } from '../../utils/crisisKeywords';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function SoulChat({ mode }) {
  const { user, userProfile } = useAuth();
  const { todayMood } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load messages from Firestore
  useEffect(() => {
    if (!user) return;
    const unsub = getSoulMessages(user.uid, (msgs) => {
      setMessages(msgs);
    });
    return unsub;
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Welcome message on first load
  useEffect(() => {
    if (messages.length === 0 && !isTyping) {
      const greeting = getGreeting(mode, userProfile?.displayName, todayMood);
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: greeting,
        timestamp: { toDate: () => new Date() },
      }]);
    }
  }, [mode]);

  const getGreeting = (mode, name, mood) => {
    const greetings = {
      chat: `Hey ${name || 'there'} 💙 I'm so glad you're here. How are you doing today?`,
      vent: `Hey ${name || 'there'}, I'm all ears and no judgement 🤍 What's been going on?`,
      calm: `Hello ${name || 'there'} 🌿 Let's slow down together. Take a deep breath with me...`,
      think: `Hey ${name || 'there'} 💭 Let's figure this out together. What's on your mind?`,
      night: `Good night, ${name || 'there'} 🌙 How was your day? Tell me anything...`,
      morning: `Good morning, ${name || 'there'} ☀️ A fresh new day! How are you feeling as you start it?`,
    };
    return greetings[mode] || greetings.chat;
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');

    // Check for crisis
    if (detectCrisis(userMessage)) {
      setShowCrisis(true);
    }

    // Add user message to UI immediately
    const tempUserMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: { toDate: () => new Date() },
    };

    setMessages(prev => [...prev, tempUserMsg]);

    // Save to Firestore
    if (user) {
      saveSoulMessage(user.uid, {
        role: 'user',
        content: userMessage,
        mode,
        date: new Date().toISOString().split('T')[0],
      });
    }

    if (showCrisis) return; // Don't send to AI during crisis

    // Get AI response
    setIsTyping(true);
    try {
      const systemPrompt = buildSystemPrompt(
        userProfile?.displayName,
        todayMood,
        mode
      );

      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .concat(tempUserMsg)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await callSoul(conversationHistory, systemPrompt);

      const soulMsg = {
        id: Date.now().toString() + '_soul',
        role: 'assistant',
        content: response,
        timestamp: { toDate: () => new Date() },
      };

      setMessages(prev => [...prev, soulMsg]);

      if (user) {
        saveSoulMessage(user.uid, {
          role: 'assistant',
          content: response,
          mode,
          date: new Date().toISOString().split('T')[0],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Crisis Card */}
      <AnimatePresence>
        {showCrisis && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 my-3 p-4 rounded-2xl border"
            style={{
              background: 'linear-gradient(135deg, #f0e6ff 0%, #fde8f0 100%)',
              borderColor: 'rgba(124, 111, 247, 0.3)',
            }}
          >
            <p className="font-semibold text-soul-text mb-1">💙 I hear you, and you matter so much.</p>
            <p className="text-sm text-soul-muted mb-3">
              Please reach out to someone who can truly support you right now:
            </p>
            {CRISIS_RESOURCES.map(r => (
              <div key={r.name} className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-soul-text">{r.name}</p>
                  <p className="text-xs text-soul-muted">{r.available}</p>
                </div>
                <a
                  href={`tel:${r.number}`}
                  className="flex items-center gap-1 bg-soul-primary text-white text-xs px-3 py-1.5 rounded-full font-semibold"
                >
                  <Phone size={12} />
                  {r.number}
                </a>
              </div>
            ))}
            <button
              onClick={() => setShowCrisis(false)}
              className="text-xs text-soul-primary underline mt-1"
            >
              Continue talking to Soul
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isUser={msg.role === 'user'}
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar — not sticky, just part of the flex column */}
      <div className="flex-shrink-0 px-4 py-3 bg-white/70 backdrop-blur-xl border-t border-soul-border/50">
        <div className="flex items-end gap-2 bg-white rounded-full border border-soul-border shadow-sm px-4 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Talk to Soul..."
            className="flex-1 bg-transparent text-sm text-soul-text placeholder-soul-muted resize-none outline-none max-h-24 leading-relaxed py-1"
            rows={1}
            style={{
              fieldSizing: 'content',
            }}
          />
          <motion.button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send size={16} className="text-white ml-0.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
