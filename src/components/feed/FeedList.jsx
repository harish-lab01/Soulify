import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { getPosts, getMorePosts, getFollowingPosts, getFollowingIds } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import PostCard from './PostCard';
import { PostSkeleton } from '../ui/Skeleton';

const containerVariants = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export default function FeedList({ communityId = null, feedMode = 'all' }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [followingIds, setFollowingIds] = useState([]);

  // Sentinel element for intersection observer
  const sentinelRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPosts([]);
    setHasMore(true);
    setLastDoc(null);
    let firstLoad = true;

    if (unsubRef.current) {
      unsubRef.current();
    }

    if (feedMode === 'following') {
      // Following feed — one-time fetch (not real-time)
      if (!user) { setLoading(false); return; }
      getFollowingIds(user.uid).then(async (ids) => {
        setFollowingIds(ids);
        if (ids.length === 0) {
          setPosts([]);
          setLoading(false);
          setHasMore(false);
          return;
        }
        try {
          const { posts: data } = await getFollowingPosts(ids);
          setPosts(data);
          setHasMore(false); // Following feed loads all at once for now
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      });
      return;
    }

    // All feed — real-time
    unsubRef.current = getPosts(
      (data, lastDocSnap) => {
        if (firstLoad) {
          setPosts(data);
          setLastDoc(lastDocSnap || null);
          setHasMore(data.length >= 20);
          firstLoad = false;
          setLoading(false);
          setIsLive(true);
        } else {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = data.filter(p => !existingIds.has(p.id));
            if (newPosts.length > 0) return [...newPosts, ...prev];
            return prev.map(p => {
              const updated = data.find(d => d.id === p.id);
              return updated || p;
            });
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
      if (unsubRef.current) unsubRef.current();
      setIsLive(false);
    };
  }, [communityId, feedMode, user]);

  // Load more posts when sentinel enters viewport
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const { posts: morePosts, lastDoc: newLastDoc } = await getMorePosts(lastDoc, communityId);
      if (morePosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const unique = morePosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...unique];
        });
        setLastDoc(newLastDoc || null);
        setHasMore(morePosts.length >= 20);
      }
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc, communityId]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

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
            ? 'Check your Firestore security rules.'
            : 'Something went wrong. Check your connection.'}
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
    if (feedMode === 'following') {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-6xl mb-4">💜</span>
          <h3 className="font-display font-bold text-soul-text text-lg">Your following feed is empty</h3>
          <p className="text-soul-muted text-sm mt-2 max-w-xs">
            Follow people to see their posts here. Head to Explore to find people you connect with.
          </p>
        </div>
      );
    }
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
          <span>Live · {posts.length} posts</span>
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

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading more indicator */}
      <AnimatePresence>
        {loadingMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center py-4"
          >
            <Loader2 size={20} className="text-soul-primary animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* End of feed */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-6">
          <p className="text-xs text-soul-muted">You've seen everything 🌸</p>
        </div>
      )}
    </div>
  );
}
