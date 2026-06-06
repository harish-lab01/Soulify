import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { subscribeConversations } from '../firebase/realtime';
import { searchUsers } from '../firebase/firestore';
import TopBar from '../components/layout/TopBar';
import Avatar from '../components/ui/Avatar';
import { formatTimeAgo } from '../utils/helpers';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export default function Messages() {
  const { user, userProfile } = useAuth();
  const { setUnreadDMCount } = useApp();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeConversations(user.uid, (convos) => {
      setConversations(convos);
      const unread = convos.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setUnreadDMCount(unread);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchUsers(searchQuery);
      setSearchResults(results.filter(u => u.id !== user?.uid));
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openConversation = (otherUserId, otherUserName, otherUserPhoto) => {
    navigate(`/messages/${otherUserId}`, {
      state: { otherUserName, otherUserPhoto }
    });
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <TopBar title="Messages" backButton={() => navigate(-1)} />

      <div className="hidden lg:flex items-center justify-between px-6 pt-6 pb-2">
        <div>
          <h1 className="font-display font-bold text-2xl text-soul-text">Messages</h1>
          <p className="text-soul-muted text-sm mt-0.5">Your conversations</p>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-4 max-w-lg mx-auto lg:max-w-2xl">
        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soul-muted" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search people to message..."
            className="w-full bg-soul-bg border border-soul-border rounded-2xl pl-9 pr-4 py-3 text-sm text-soul-text placeholder-soul-muted outline-none focus:border-soul-primary"
          />
        </div>

        {/* Search results */}
        {searchQuery.trim() && (
          <div className="mb-4 glass-card overflow-hidden">
            {searching ? (
              <div className="p-4 text-center text-sm text-soul-muted">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-soul-muted">No users found</div>
            ) : (
              searchResults.map(u => (
                <motion.div
                  key={u.id}
                  onClick={() => { openConversation(u.id, u.displayName, u.photoURL); setSearchQuery(''); }}
                  className="flex items-center gap-3 p-4 hover:bg-soul-bg cursor-pointer transition-colors"
                  whileHover={{ x: 2 }}
                >
                  <Avatar src={u.photoURL} name={u.displayName} size="md" />
                  <div>
                    <p className="font-semibold text-sm text-soul-text">{u.displayName}</p>
                    {u.username && <p className="text-xs text-soul-muted">@{u.username}</p>}
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs text-soul-primary font-semibold">Message</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Conversations list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-soul-bg animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-1/3" />
                  <div className="h-2.5 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 && !searchQuery ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #fde8f0 100%)' }}
            >
              <MessageSquare size={32} className="text-soul-primary" />
            </div>
            <h3 className="font-display font-bold text-soul-text text-lg">No conversations yet</h3>
            <p className="text-soul-muted text-sm mt-2 max-w-xs">
              Search for someone above to start a conversation 💙
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map(convo => (
              <motion.div
                key={convo.id}
                onClick={() => openConversation(convo.otherUserId, convo.otherUserName, convo.otherUserPhoto)}
                className="flex items-center gap-3 p-4 rounded-2xl hover:bg-soul-bg cursor-pointer transition-all"
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="relative">
                  <Avatar src={convo.otherUserPhoto} name={convo.otherUserName} size="lg" />
                  {convo.unreadCount > 0 && (
                    <div
                      className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' }}
                    >
                      {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-soul-text">{convo.otherUserName}</p>
                  <p className={`text-xs truncate mt-0.5 ${convo.unreadCount > 0 ? 'text-soul-text font-semibold' : 'text-soul-muted'}`}>
                    {convo.lastMessage || 'Start a conversation'}
                  </p>
                </div>
                <p className="text-[10px] text-soul-muted flex-shrink-0">
                  {convo.lastMessageAt ? formatTimeAgo({ toDate: () => new Date(convo.lastMessageAt) }) : ''}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
