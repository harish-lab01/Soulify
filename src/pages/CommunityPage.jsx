import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COMMUNITIES } from '../utils/constants';
import { joinCommunity, leaveCommunity } from '../firebase/firestore';
import CommunityFeed from '../components/community/CommunityFeed';
import CommunityEvents from '../components/community/CommunityEvents';
import CreatePost from '../components/feed/CreatePost';
import Modal from '../components/ui/Modal';
import { useApp } from '../context/AppContext';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const TABS = ['Posts', 'Events'];

export default function CommunityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile, refreshProfile } = useAuth();
  const { addToast } = useApp();
  const community = COMMUNITIES.find(c => c.id === id);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('Posts');
  const [joinLoading, setJoinLoading] = useState(false);

  const isJoined = userProfile?.communities?.includes(id);

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-soul-muted">Community not found</p>
      </div>
    );
  }

  const handleJoinLeave = async () => {
    if (!user || joinLoading) return;
    setJoinLoading(true);
    try {
      if (isJoined) {
        await leaveCommunity(user.uid, id);
        await refreshProfile();
        addToast(`Left ${community.name}`, 'success');
      } else {
        await joinCommunity(user.uid, id);
        await refreshProfile();
        addToast(`Joined ${community.name} 🎉`, 'success');
      }
    } catch {
      addToast('Something went wrong', 'error');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header banner */}
      <div
        className="px-4 pt-4 pb-5"
        style={{
          background: `linear-gradient(135deg, ${community.color}20 0%, ${community.color}08 100%)`,
          borderBottom: `1px solid ${community.color}30`,
        }}
      >
        <div className="max-w-lg mx-auto lg:max-w-2xl">
          <button
            onClick={() => navigate('/communities')}
            className="flex items-center gap-1 text-soul-muted text-sm mb-4"
          >
            <ArrowLeft size={16} />
            Communities
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ backgroundColor: `${community.color}25` }}
              >
                {community.emoji}
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-soul-text">{community.name}</h1>
                <p className="text-sm text-soul-muted">{community.desc}</p>
              </div>
            </div>

            {/* Join / Leave */}
            <motion.button
              onClick={handleJoinLeave}
              disabled={joinLoading}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isJoined
                  ? 'bg-white border border-soul-border text-soul-muted'
                  : 'text-white'
              }`}
              style={!isJoined ? { backgroundColor: community.color } : {}}
              whileTap={{ scale: 0.95 }}
            >
              {joinLoading ? '...' : isJoined ? '✓ Joined' : '+ Join'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 max-w-lg mx-auto lg:max-w-2xl">
        <div className="flex gap-2 mb-4">
          {TABS.map(t => (
            <motion.button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === t ? 'text-white shadow-sm' : 'bg-white/60 text-soul-muted hover:bg-white/80'
              }`}
              style={activeTab === t ? { background: `linear-gradient(135deg, ${community.color} 0%, ${community.color}cc 100%)` } : {}}
              whileTap={{ scale: 0.95 }}
            >
              {t === 'Posts' ? '📝 ' : '🗓 '}{t}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-24 max-w-lg mx-auto lg:max-w-2xl">
        <AnimatePresence mode="wait">
          {activeTab === 'Posts' && (
            <motion.div
              key="posts"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <CommunityFeed communityId={id} />
            </motion.div>
          )}
          {activeTab === 'Events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <CommunityEvents communityId={id} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAB — only on Posts tab */}
      {activeTab === 'Posts' && (
        <motion.button
          className="fixed right-5 z-40 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl lg:hidden"
          style={{
            background: `linear-gradient(135deg, ${community.color} 0%, ${community.color}cc 100%)`,
            bottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 16px)',
          }}
          onClick={() => setShowCreate(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Create post"
        >
          <Plus size={24} />
        </motion.button>
      )}

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title={`Post in ${community.name}`}
      >
        <CreatePost onClose={() => setShowCreate(false)} communityId={id} />
      </Modal>
    </motion.div>
  );
}
