import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit3, LogOut, MessageSquare, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useBadgeAwarder } from '../hooks/useBadgeAwarder';
import {
  getUser,
  getMoodHistory,
  updateUser,
  followUser,
  unfollowUser,
  isFollowing as checkIsFollowing,
  getFollowers,
  getFollowing,
  getUserPosts,
} from '../firebase/firestore';
import { logout } from '../firebase/auth';
import { calculateStreak } from '../utils/helpers';
import { MOODS, BADGES, COMMUNITIES } from '../utils/constants';
import Avatar from '../components/ui/Avatar';
import MoodHeatmap from '../components/mood/MoodHeatmap';
import Button from '../components/ui/Button';
import { ProfileSkeleton } from '../components/ui/Skeleton';
import PostCard from '../components/feed/PostCard';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

// ─── Followers / Following Modal ──────────────────────────────────────────────
function ConnectionsModal({ userId, type, onClose }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fn = type === 'followers' ? getFollowers : getFollowing;
    fn(userId).then(list => {
      setUsers(list);
      setLoading(false);
    });
  }, [userId, type]);

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="bg-white rounded-t-3xl w-full max-w-lg max-h-[70vh] flex flex-col"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        <div className="flex items-center justify-between p-5 border-b border-soul-border/50">
          <h3 className="font-display font-bold text-soul-text capitalize">{type}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-soul-bg">
            <X size={18} className="text-soul-muted" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-3">
          {loading ? (
            <div className="space-y-3 p-2">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-2.5 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-soul-muted text-sm">
                {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            users.map(u => (
              <motion.div
                key={u.id}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-soul-bg cursor-pointer"
                onClick={() => { navigate(`/profile/${u.id}`); onClose(); }}
                whileHover={{ x: 2 }}
              >
                <Avatar src={u.photoURL} name={u.displayName} size="md" />
                <div>
                  <p className="font-semibold text-sm text-soul-text">{u.displayName}</p>
                  {u.username && <p className="text-xs text-soul-muted">@{u.username}</p>}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Profile ─────────────────────────────────────────────────────────────
export default function Profile() {
  const { uid } = useParams();
  const { user, userProfile, refreshProfile } = useAuth();
  const { addToast } = useApp();
  const { checkAndAward } = useBadgeAwarder();
  const navigate = useNavigate();

  const profileUid = uid || user?.uid;
  const isOwn = profileUid === user?.uid;

  const [profile, setProfile] = useState(isOwn ? userProfile : null);
  const [moodHistory, setMoodHistory] = useState({});
  const [posts, setPosts] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(!isOwn);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [connectionsModal, setConnectionsModal] = useState(null); // 'followers' | 'following' | null
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'mood'

  useEffect(() => {
    if (!profileUid) return;

    if (!isOwn) {
      getUser(profileUid).then(p => {
        setProfile(p);
        setLoading(false);
      });
      // Check follow status
      if (user) {
        checkIsFollowing(user.uid, profileUid).then(setFollowing);
      }
    } else {
      setProfile(userProfile);
    }

    getMoodHistory(profileUid).then(data => {
      setMoodHistory(data);
      setStreak(calculateStreak(data));
    });

    const unsubPosts = getUserPosts(profileUid, setPosts);
    return unsubPosts;
  }, [profileUid, userProfile]);

  const currentMoodData = profile?.currentMood ? MOODS.find(m => m.id === profile.currentMood) : null;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleEditSave = async () => {
    await updateUser(user.uid, { displayName: editName, bio: editBio });
    await refreshProfile();
    addToast('Profile updated 🌸', 'success');
    setEditing(false);
  };

  const handleFollow = async () => {
    if (!user || followLoading) return;
    setFollowLoading(true);
    try {
      if (following) {
        await unfollowUser(user.uid, profileUid);
        setFollowing(false);
        setProfile(prev => prev ? { ...prev, followerCount: Math.max(0, (prev.followerCount || 0) - 1) } : prev);
        addToast(`Unfollowed ${profile?.displayName}`, 'success');
      } else {
        await followUser(user.uid, profileUid);
        setFollowing(true);
        setProfile(prev => prev ? { ...prev, followerCount: (prev.followerCount || 0) + 1 } : prev);
        addToast(`Following ${profile?.displayName} 🎉`, 'success');
        // connector badge — awarded to the target when they reach 1 follower
        // also check if current user gets connector for following first person
        await checkAndAward({ followerCount: (profile?.followerCount || 0) + 1 });
      }
    } catch {
      addToast('Something went wrong', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = () => {
    navigate(`/messages/${profileUid}`, {
      state: { otherUserName: profile?.displayName, otherUserPhoto: profile?.photoURL }
    });
  };

  if (loading) {
    return <div className="min-h-screen"><ProfileSkeleton /></div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-soul-muted">User not found</p>
      </div>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {/* Banner */}
      <div
        className="h-36 relative"
        style={{
          background: currentMoodData
            ? `linear-gradient(135deg, ${currentMoodData.color}40 0%, ${currentMoodData.color}20 100%)`
            : 'linear-gradient(135deg, #667eea40 0%, #764ba220 100%)',
        }}
      >
        {isOwn && (
          <div className="absolute top-4 right-4 flex gap-2">
            <motion.button
              onClick={() => { setEditName(profile.displayName || ''); setEditBio(profile.bio || ''); setEditing(true); }}
              className="p-2 bg-white/70 backdrop-blur-sm rounded-full"
              whileTap={{ scale: 0.9 }}
            >
              <Edit3 size={16} className="text-soul-muted" />
            </motion.button>
            <motion.button
              onClick={handleLogout}
              className="p-2 bg-white/70 backdrop-blur-sm rounded-full"
              whileTap={{ scale: 0.9 }}
            >
              <LogOut size={16} className="text-soul-muted" />
            </motion.button>
          </div>
        )}
      </div>

      <div className="px-4 lg:px-6 max-w-lg lg:max-w-2xl mx-auto">
        {/* Avatar overlapping banner */}
        <div className="-mt-10 mb-3 flex items-end justify-between">
          <Avatar
            src={profile.photoURL}
            name={profile.displayName}
            size="xl"
            className="ring-4 ring-white shadow-xl"
          />
          {/* Action buttons for other user's profile */}
          {!isOwn && (
            <div className="flex gap-2 mb-1">
              <motion.button
                onClick={handleMessage}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-soul-bg border border-soul-border text-soul-muted"
                whileTap={{ scale: 0.95 }}
              >
                <MessageSquare size={14} />
                Message
              </motion.button>
              <motion.button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  following ? 'bg-soul-bg border border-soul-border text-soul-muted' : 'text-white'
                }`}
                style={!following ? { background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' } : {}}
                whileTap={{ scale: 0.95 }}
              >
                {followLoading ? '...' : following ? '✓ Following' : '+ Follow'}
              </motion.button>
            </div>
          )}
        </div>

        {/* Edit form */}
        {editing ? (
          <div className="space-y-3 mb-4">
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full border border-soul-border rounded-2xl px-3 py-2 text-sm text-soul-text outline-none focus:border-soul-primary"
              placeholder="Your name"
            />
            <textarea
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              className="w-full border border-soul-border rounded-2xl px-3 py-2 text-sm text-soul-text outline-none focus:border-soul-primary resize-none"
              placeholder="Bio (optional)"
              rows={2}
            />
            <div className="flex gap-2">
              <Button onClick={handleEditSave} size="sm">Save</Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-xl text-soul-text">
                {profile.displayName || 'Anonymous'}
              </h1>
              {currentMoodData && <span className="text-lg">{currentMoodData.emoji}</span>}
            </div>
            {profile.username && (
              <p className="text-soul-muted text-sm">@{profile.username}</p>
            )}
            {profile.bio && (
              <p className="text-soul-text text-sm mt-1 leading-relaxed">{profile.bio}</p>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex gap-6 mb-5">
          {[
            { label: 'Posts', value: posts.length || profile.postCount || 0, onClick: null },
            {
              label: 'Followers',
              value: profile.followerCount || 0,
              onClick: () => setConnectionsModal('followers'),
            },
            {
              label: 'Following',
              value: profile.followingCount || 0,
              onClick: () => setConnectionsModal('following'),
            },
          ].map(stat => (
            <motion.div
              key={stat.label}
              className={`text-center ${stat.onClick ? 'cursor-pointer' : ''}`}
              onClick={stat.onClick}
              whileHover={stat.onClick ? { scale: 1.05 } : {}}
              whileTap={stat.onClick ? { scale: 0.95 } : {}}
            >
              <p className="font-display font-bold text-soul-text text-lg">{stat.value}</p>
              <p className="text-xs text-soul-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Communities */}
        {profile.communities?.length > 0 && (
          <div className="glass-card p-4 mb-4">
            <h3 className="font-display font-bold text-soul-text text-sm mb-2">Communities</h3>
            <div className="flex gap-2 flex-wrap">
              {profile.communities.map(cid => {
                const c = COMMUNITIES.find(c => c.id === cid);
                if (!c) return null;
                return (
                  <span
                    key={cid}
                    onClick={() => navigate(`/community/${c.id}`)}
                    className="text-xs px-2.5 py-1 rounded-full font-semibold cursor-pointer"
                    style={{ backgroundColor: `${c.color}15`, color: c.color }}
                  >
                    {c.emoji} {c.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Badges */}
        {profile.badges?.length > 0 && (
          <div className="glass-card p-4 mb-4">
            <h3 className="font-display font-bold text-soul-text text-sm mb-3">Badges</h3>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar">
              {profile.badges.map(badgeId => {
                const badge = BADGES.find(b => b.id === badgeId);
                if (!badge) return null;
                return (
                  <div
                    key={badgeId}
                    className="flex-shrink-0 flex flex-col items-center gap-1 p-3 bg-soul-bg rounded-2xl min-w-[72px]"
                    title={badge.desc}
                  >
                    <span className="text-2xl">{badge.emoji}</span>
                    <span className="text-[10px] text-soul-muted text-center font-semibold">{badge.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[{ id: 'posts', label: '📝 Posts' }, { id: 'mood', label: '😊 Mood Journey' }].map(t => (
            <motion.button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === t.id ? 'text-white shadow-sm' : 'bg-white/60 text-soul-muted'
              }`}
              style={activeTab === t.id ? { background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' } : {}}
              whileTap={{ scale: 0.95 }}
            >
              {t.label}
            </motion.button>
          ))}
        </div>

        {/* Posts tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4 pb-6">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl">📝</span>
                <p className="text-soul-muted text-sm mt-3">No posts yet</p>
              </div>
            ) : (
              posts.map(post => <PostCard key={post.id} post={post} />)
            )}
          </div>
        )}

        {/* Mood Journey tab */}
        {activeTab === 'mood' && (
          <div className="glass-card p-4 mb-6">
            {Object.keys(moodHistory).length > 0 ? (
              <MoodHeatmap checkins={moodHistory} streak={streak} />
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl">😊</span>
                <p className="text-soul-muted text-sm mt-3">No mood check-ins yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connections Modal */}
      <AnimatePresence>
        {connectionsModal && (
          <ConnectionsModal
            userId={profileUid}
            type={connectionsModal}
            onClose={() => setConnectionsModal(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
