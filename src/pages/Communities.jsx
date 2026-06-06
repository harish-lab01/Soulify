import { motion } from 'framer-motion';
import TopBar from '../components/layout/TopBar';
import CommunityList from '../components/community/CommunityList';
import { useAuth } from '../context/AuthContext';
import { COMMUNITIES } from '../utils/constants';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export default function Communities() {
  const { userProfile } = useAuth();
  const joinedCount = userProfile?.communities?.length || 0;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <TopBar title="Communities" />

      {/* Desktop header */}
      <div className="hidden lg:block px-6 pt-6 pb-2">
        <h1 className="font-display font-bold text-2xl text-soul-text">Communities</h1>
        <p className="text-soul-muted text-sm mt-0.5">Find your people</p>
      </div>

      <div className="px-4 lg:px-6 py-4 max-w-lg lg:max-w-full mx-auto space-y-5">
        {/* Hero */}
        <div
          className="rounded-3xl p-5 text-white"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <h2 className="font-display font-bold text-xl">Find Your People</h2>
          <p className="text-sm opacity-80 mt-1">
            You're part of {joinedCount} {joinedCount === 1 ? 'community' : 'communities'}
          </p>
        </div>

        {/* My communities */}
        {joinedCount > 0 && (
          <div>
            <h3 className="font-display font-bold text-soul-text mb-3">My Communities</h3>
            <div className="flex gap-2 flex-wrap">
              {userProfile.communities.map(id => {
                const c = COMMUNITIES.find(c => c.id === id);
                if (!c) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
                    style={{ backgroundColor: `${c.color}15`, color: c.color }}
                  >
                    {c.emoji} {c.name}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All communities */}
        <div>
          <h3 className="font-display font-bold text-soul-text mb-3">All Communities</h3>
          <CommunityList />
        </div>
      </div>
    </motion.div>
  );
}
