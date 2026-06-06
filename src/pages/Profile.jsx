import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit3, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUser, getMoodHistory, getPosts, updateUser } from '../firebase/firestore';
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

export default function Profile() {
  const { uid } = useParams();
  const { user, userProfile, refreshProfile } = useAuth();
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

  useEffect(() => {
    if (!profileUid) return;

    if (!isOwn) {
      getUser(profileUid).then(p => {
        setProfile(p);
        setLoading(false);
      });
    } else {
      setProfile(userProfile);
    }

    // Load mood history
    getMoodHistory(profileUid).then(data => {
      setMoodHistory(data);
      setStreak(calculateStreak(data));
    });
  }, [profileUid, userProfile]);

  const currentMoodData = profile?.currentMood ? MOODS.find(m => m.id === profile.currentMood) : null;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleEditSave = async () => {
    await updateUser(user.uid, { displayName: editName, bio: editBio });
    await refreshProfile();
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <ProfileSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-soul-muted">User not found</p>
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
              onClick={() => {
                setEditName(profile.displayName || '');
                setEditBio(profile.bio || '');
                setEditing(true);
              }}
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

      {/* Profile info */}
      <div className="px-4 lg:px-6 max-w-lg lg:max-w-2xl mx-auto">
        {/* Avatar — overlapping banner */}
        <div className="-mt-10 mb-3">
          <Avatar
            src={profile.photoURL}
            name={profile.displayName}
            size="xl"
            className="ring-4 ring-white shadow-xl"
          />
        </div>

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
              {currentMoodData && (
                <span className="text-lg">{currentMoodData.emoji}</span>
              )}
            </div>
            {profile.username && (
              <p className="text-soul-muted text-sm">@{profile.username}</p>
            )}
            {profile.bio && (
              <p className="text-soul-text text-sm mt-1">{profile.bio}</p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-6 mb-5">
          {[
            { label: 'Posts', value: profile.postCount || 0 },
            { label: 'Connections', value: profile.connectionCount || 0 },
            { label: 'Communities', value: profile.communities?.length || 0 },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-display font-bold text-soul-text text-lg">{stat.value}</p>
              <p className="text-xs text-soul-muted">{stat.label}</p>
            </div>
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
                    className="text-xs px-2.5 py-1 rounded-full font-semibold"
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

        {/* Mood heatmap */}
        {Object.keys(moodHistory).length > 0 && (
          <div className="glass-card p-4 mb-4">
            <h3 className="font-display font-bold text-soul-text text-sm mb-3">Mood Journey</h3>
            <MoodHeatmap checkins={moodHistory} streak={streak} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
