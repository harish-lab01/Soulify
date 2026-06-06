import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';
import { COMMUNITIES } from '../utils/constants';
import CommunityFeed from '../components/community/CommunityFeed';
import CreatePost from '../components/feed/CreatePost';
import Modal from '../components/ui/Modal';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export default function CommunityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const community = COMMUNITIES.find(c => c.id === id);
  const [showCreate, setShowCreate] = useState(false);

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-soul-muted">Community not found</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div
        className="px-4 pt-4 pb-6"
        style={{
          background: `linear-gradient(135deg, ${community.color}20 0%, ${community.color}10 100%)`,
          borderBottom: `1px solid ${community.color}30`,
        }}
      >
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate('/communities')}
            className="flex items-center gap-1 text-soul-muted text-sm mb-4"
          >
            <ArrowLeft size={16} />
            Communities
          </button>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${community.color}20` }}
            >
              {community.emoji}
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-soul-text">{community.name}</h1>
              <p className="text-sm text-soul-muted">{community.desc}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        <CommunityFeed communityId={id} />
      </div>

      {/* FAB */}
      <motion.button
        className="fixed right-5 z-40 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl"
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
