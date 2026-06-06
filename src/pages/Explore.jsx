import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, Users, Compass, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  searchUsers,
  getTrendingPosts,
  getSuggestedUsers,
  getFollowingIds,
  followUser,
  unfollowUser,
  isFollowing,
} from '../firebase/firestore';
import { COMMUNITIES } from '../utils/constants';
import TopBar from '../components/layout/TopBar';
import PostCard from '../components/feed/PostCard';
import Avatar from '../components/ui/Avatar';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const TABS = ['Trending', 'People', 'Communities'];

// ─── User Card ─────────────────────────────────────────────────────────────
function UserCard({ u, currentUserId, followingIds, onFollowChange }) {
  const navigate = useNavigate();
  const { addToast } = useApp();
  const [following, setFollowing] = useState(followingIds.includes(u.id));
  const [loading, setLoading] = useState(false);

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      if (following) {
        await unfollowUser(currentUserId, u.id);
        setFollowing(false);
        addToast(`Unfollowed ${u.displayName}`, 'success');
      } else {
        await followUser(currentUserId, u.id);
        setFollowing(true);
        addToast(`Following ${u.displayName} 🎉`, 'success');
      }
      if (onFollowChange) onFollowChange(u.id, !following);
    } catch (err) {
      addToast('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="flex items-center gap-3 p-4 rounded-2xl hover:bg-soul-bg/60 cursor-pointer transition-all"
      onClick={() => navigate(`/profile/${u.id}`)}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
    >
      <Avatar src={u.photoURL} name={u.displayName} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-soul-text truncate">{u.displayName}</p>
        <p className="text-xs text-soul-muted truncate">
          {u.username ? `@${u.username}` : `${u.followerCount || 0} followers`}
        </p>
      </div>
      <motion.button
        onClick={handleFollow}
        disabled={loading}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
          following
            ? 'bg-soul-bg border border-soul-border text-soul-muted'
            : 'text-white'
        }`}
        style={!following ? { background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' } : {}}
        whileTap={{ scale: 0.95 }}
      >
        {loading ? '...' : following ? 'Following' : 'Follow'}
      </motion.button>
    </motion.div>
  );
}

export default function Explore() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingPeople, setLoadingPeople] = useState(true);

  useEffect(() => {
    getTrendingPosts().then(posts => {
      setTrendingPosts(posts);
      setLoadingTrending(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    getFollowingIds(user.uid).then(async (ids) => {
      setFollowingIds(ids);
      const suggested = await getSuggestedUsers(user.uid, ids);
      setSuggestedUsers(suggested);
      setLoadingPeople(false);
    });
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await searchUsers(searchQuery);
      setSearchResults(res.filter(u => u.id !== user?.uid));
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleFollowChange = (uid, nowFollowing) => {
    setFollowingIds(prev =>
      nowFollowing ? [...prev, uid] : prev.filter(id => id !== uid)
    );
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <TopBar title="Explore" showSearch={false} />

      <div className="hidden lg:block px-6 pt-6 pb-2">
        <h1 className="font-display font-bold text-2xl text-soul-text">Explore</h1>
        <p className="text-soul-muted text-sm mt-0.5">Discover people and trending posts</p>
      </div>

      <div className="px-4 lg:px-6 py-4 max-w-lg lg:max-w-2xl mx-auto space-y-4">

        {/* Search bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soul-muted" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search people, topics..."
            className="w-full bg-white/70 border border-soul-border rounded-2xl pl-9 pr-10 py-3 text-sm text-soul-text placeholder-soul-muted outline-none focus:border-soul-primary backdrop-blur-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
            >
              <X size={14} className="text-soul-muted" />
            </button>
          )}
        </div>

        {/* Search results */}
        <AnimatePresence>
          {searchQuery.trim() && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass-card overflow-hidden"
            >
              {searching ? (
                <div className="p-5 text-center text-sm text-soul-muted">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-5 text-center">
                  <p className="text-soul-muted text-sm">No results for "{searchQuery}"</p>
                </div>
              ) : (
                <div>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-soul-muted uppercase tracking-wide">
                    People
                  </p>
                  {searchResults.map(u => (
                    <UserCard
                      key={u.id}
                      u={u}
                      currentUserId={user?.uid}
                      followingIds={followingIds}
                      onFollowChange={handleFollowChange}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        {!searchQuery && (
          <>
            <div className="flex gap-2">
              {TABS.map(t => (
                <motion.button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    tab === t ? 'text-white shadow-sm' : 'bg-white/60 text-soul-muted hover:bg-white/80'
                  }`}
                  style={tab === t ? { background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' } : {}}
                  whileTap={{ scale: 0.95 }}
                >
                  {t}
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* Trending posts */}
              {tab === 'Trending' && (
                <motion.div
                  key="trending"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-soul-text">
                    <TrendingUp size={16} className="text-soul-primary" />
                    Trending this week
                  </div>
                  {loadingTrending ? (
                    [1,2,3].map(i => (
                      <div key={i} className="h-32 rounded-3xl bg-soul-bg animate-pulse" />
                    ))
                  ) : trendingPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="text-5xl">🌱</span>
                      <p className="text-soul-muted text-sm mt-3">No trending posts yet</p>
                    </div>
                  ) : (
                    trendingPosts.map(post => <PostCard key={post.id} post={post} />)
                  )}
                </motion.div>
              )}

              {/* People */}
              {tab === 'People' && (
                <motion.div
                  key="people"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-soul-text mb-3">
                    <Users size={16} className="text-soul-primary" />
                    People you might know
                  </div>
                  <div className="glass-card overflow-hidden">
                    {loadingPeople ? (
                      [1,2,3,4].map(i => (
                        <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                          <div className="w-11 h-11 rounded-full bg-gray-200" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-gray-200 rounded w-1/3" />
                            <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                          </div>
                          <div className="h-7 w-16 bg-gray-200 rounded-full" />
                        </div>
                      ))
                    ) : suggestedUsers.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-soul-muted text-sm">You're following everyone! 🎉</p>
                      </div>
                    ) : (
                      suggestedUsers.map(u => (
                        <UserCard
                          key={u.id}
                          u={u}
                          currentUserId={user?.uid}
                          followingIds={followingIds}
                          onFollowChange={handleFollowChange}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* Communities */}
              {tab === 'Communities' && (
                <motion.div
                  key="communities"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-soul-text mb-3">
                    <Compass size={16} className="text-soul-primary" />
                    All communities
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {COMMUNITIES.map(c => (
                      <motion.div
                        key={c.id}
                        onClick={() => navigate(`/community/${c.id}`)}
                        className="flex items-center gap-4 p-4 glass-card cursor-pointer"
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ backgroundColor: `${c.color}20` }}
                        >
                          {c.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-soul-text">{c.name}</p>
                          <p className="text-xs text-soul-muted truncate mt-0.5">{c.desc}</p>
                        </div>
                        <div
                          className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `${c.color}15`, color: c.color }}
                        >
                          Join
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
}
