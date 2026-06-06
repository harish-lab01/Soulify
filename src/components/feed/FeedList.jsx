import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertCircle, Wifi } from 'lucide-react';
import { getPosts } from '../../firebase/firestore';
import PostCard from './PostCard';
import { PostSkeleton } from '../ui/Skeleton';

const containerVariants = {
  animate: { transition: { staggerChildren: 0.06 } }
};

export default function FeedList({ communityId = null }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPostCount, setNewPostCount] = useState(0);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    let firstLoad = true;

    const unsub = getPosts(
      (data, lastDocSnap) => {
        if (firstLoad) {
          setPosts(data);
          firstLoad = false;
          setLoading(false);
          setIsLive(true);
        } else {
          // Real-time update — check if there are new posts
          setPosts(prev => {
            if (data.length > prev.length) {
              setNewPostCount(data.length - prev.length);
            }
            return data;
          });
        }
      },
      communityId,
      null,
      (err) => {
        console.error('Feed error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsub();
      setIsLive(false);
    };
  }, [communityId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <AlertCircle size={40} className="text-soul-muted opacity-50" />
        <h3 className="font-display font-bold text-soul-text">Couldn't load posts</h3>
        <p className="text-soul-muted text-sm max-w-xs">
          {error?.code === 'permission-denied'
            ? 'Check your Firestore security rules allow authenticated reads on /posts.'
            : 'Something went wrong loading the feed. Check your connection.'}
        </p>
        <motion.button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-soul-primary text-sm font-semibold"
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw size={14} /> Retry
        </motion.button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-6xl mb-4">🌸</span>
        <h3 className="font-display font-bold text-soul-text text-lg">Nothing here yet</h3>
        <p className="text-soul-muted text-sm mt-2">Be the first to share something 💙</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live indicator */}
      {isLive && (
        <div className="flex items-center gap-2 text-xs text-soul-muted">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span>Live feed · {posts.length} posts</span>
        </div>
      )}

      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </motion.div>
    </div>
  );
}
