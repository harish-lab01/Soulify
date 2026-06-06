import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal, MessageCircle, Share2, Trash2, UserCircle,
  CheckCircle2, Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOODS, COMMUNITIES } from '../../utils/constants';
import { formatTimeAgo } from '../../utils/helpers';
import { deletePost, votePoll, getPollVote } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import ReactionBar from './ReactionBar';
import CommentSection from './CommentSection';

export default function PostCard({ post }) {
  const { user } = useAuth();
  const { addToast } = useApp();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Poll state
  const [pollData, setPollData] = useState(post.poll || null);
  const [userVote, setUserVote] = useState(null);
  const [voting, setVoting] = useState(false);

  const mood = post.mood ? MOODS.find(m => m.id === post.mood) : null;
  const community = post.communityId ? COMMUNITIES.find(c => c.id === post.communityId) : null;
  const isOwner = user?.uid === post.authorId;

  // Keep poll in sync with prop updates
  useEffect(() => {
    setPollData(post.poll || null);
  }, [post.poll]);

  // Load user's existing poll vote
  useEffect(() => {
    if (post.type === 'poll' && user) {
      getPollVote(post.id, user.uid).then(vote => {
        if (vote !== null) setUserVote(vote);
      });
    }
  }, [post.id, user]);

  const handleDelete = async () => {
    if (!isOwner) return;
    try {
      await deletePost(post.id);
      addToast('Post deleted', 'success');
    } catch {
      addToast('Failed to delete post', 'error');
    }
    setShowMenu(false);
  };

  const handleShare = async () => {
    const text = `${post.authorName} on Soulify: "${post.content}"`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Soulify', text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const goToProfile = () => navigate(`/profile/${post.authorId}`);

  // ─── Poll voting ────────────────────────────────────────────────────────────
  const handlePollVote = async (optionIndex) => {
    if (!user || userVote !== null || voting) return;
    setVoting(true);

    // Optimistic update
    const newOptions = pollData.options.map((opt, i) => ({
      ...opt,
      votes: i === optionIndex ? (opt.votes || 0) + 1 : (opt.votes || 0),
    }));
    setPollData({ ...pollData, options: newOptions });
    setUserVote(optionIndex);

    try {
      await votePoll(post.id, user.uid, optionIndex);
      addToast('Vote recorded! 🗳️', 'success');
    } catch (err) {
      // Revert optimistic update
      setPollData(post.poll);
      setUserVote(null);
      addToast('Failed to vote', 'error');
    } finally {
      setVoting(false);
    }
  };

  // Compute poll total votes & percentages
  const pollTotal = pollData?.options?.reduce((sum, o) => sum + (o.votes || 0), 0) || 0;

  return (
    <motion.div
      className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl overflow-hidden"
      style={{ boxShadow: '0 8px 32px rgba(124, 111, 247, 0.06)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      {/* ── Header ── */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="cursor-pointer" onClick={goToProfile}>
              <Avatar src={post.authorPhoto} name={post.authorName} size="md" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="font-semibold text-sm text-soul-text cursor-pointer hover:text-soul-primary transition-colors"
                  onClick={goToProfile}
                >
                  {post.authorName}
                </span>
                {community && (
                  <span
                    className="text-xs text-soul-muted cursor-pointer hover:text-soul-primary"
                    onClick={() => navigate(`/community/${community.id}`)}
                  >
                    · {community.emoji} {community.name}
                  </span>
                )}
              </div>
              <span className="text-xs text-soul-muted">{formatTimeAgo(post.createdAt)}</span>
            </div>
          </div>

          {/* 3-dot menu */}
          <div className="relative">
            <motion.button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full hover:bg-soul-bg"
              whileTap={{ scale: 0.9 }}
            >
              <MoreHorizontal size={18} className="text-soul-muted" />
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  className="absolute right-0 top-8 bg-white rounded-2xl shadow-lg border border-soul-border z-10 overflow-hidden min-w-[160px]"
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                >
                  {isOwner && (
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} /> Delete post
                    </button>
                  )}
                  <button
                    onClick={() => { navigate(`/messages/${post.authorId}`, { state: { otherUserName: post.authorName, otherUserPhoto: post.authorPhoto } }); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-soul-muted hover:bg-soul-bg text-left transition-colors"
                  >
                    <MessageCircle size={14} /> Send message
                  </button>
                  <button
                    onClick={() => { goToProfile(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-soul-muted hover:bg-soul-bg text-left transition-colors"
                  >
                    <UserCircle size={14} /> View profile
                  </button>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full px-4 py-3 text-sm text-soul-muted hover:bg-soul-bg text-left transition-colors"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mood badge */}
        {mood && (
          <div className="mt-2">
            <Badge color={mood.color} emoji={mood.emoji}>
              Feeling {mood.label}
            </Badge>
          </div>
        )}

        {/* ── Content ── */}
        <div className="mt-3">
          {post.content && (
            <p className="text-sm text-soul-text leading-relaxed">{post.content}</p>
          )}

          {/* Image */}
          {post.type === 'image' && post.imageURL && (
            <img
              src={post.imageURL}
              alt="Post"
              className="mt-3 w-full rounded-2xl object-cover max-h-80"
            />
          )}

          {/* ── Poll ── */}
          {post.type === 'poll' && pollData?.options && (
            <div className="mt-3 space-y-2">
              {pollData.options.map((opt, i) => {
                const votes = opt.votes || 0;
                const pct = pollTotal > 0 ? Math.round((votes / pollTotal) * 100) : 0;
                const isVoted = userVote === i;
                const hasVoted = userVote !== null;

                return (
                  <motion.button
                    key={i}
                    onClick={() => handlePollVote(i)}
                    disabled={hasVoted || voting || !user}
                    className="w-full relative overflow-hidden rounded-2xl text-left transition-all"
                    style={{
                      border: `2px solid ${isVoted ? '#7C6FF7' : '#E8E4FF'}`,
                      cursor: hasVoted ? 'default' : 'pointer',
                    }}
                    whileHover={!hasVoted ? { scale: 1.01 } : {}}
                    whileTap={!hasVoted ? { scale: 0.99 } : {}}
                  >
                    {/* Progress fill */}
                    {hasVoted && (
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        style={{ backgroundColor: isVoted ? '#7C6FF720' : '#F9F7FF' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    )}

                    <div className="relative flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isVoted && (
                          <CheckCircle2 size={15} className="text-soul-primary flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm font-medium ${isVoted ? 'text-soul-primary' : 'text-soul-text'}`}
                        >
                          {opt.text}
                        </span>
                      </div>
                      {hasVoted && (
                        <span className="text-xs font-bold text-soul-muted ml-2">{pct}%</span>
                      )}
                    </div>
                  </motion.button>
                );
              })}

              {/* Poll meta */}
              <div className="flex items-center gap-1.5 mt-1 text-xs text-soul-muted">
                <Users size={11} />
                <span>{pollTotal} {pollTotal === 1 ? 'vote' : 'votes'}</span>
                {userVote !== null && (
                  <span className="text-soul-primary font-semibold ml-1">· You voted</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Reaction bar ── */}
      <div className="px-4 pb-3">
        <ReactionBar
          postId={post.id}
          reactionCounts={post.reactionCounts}
          postAuthorId={post.authorId}
        />
      </div>

      {/* ── Footer ── */}
      <div className="px-4 pb-3 flex items-center gap-4 border-t border-soul-border/30 pt-3">
        <motion.button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs text-soul-muted hover:text-soul-primary transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle size={15} />
          <span>{post.commentCount || 0} comments</span>
        </motion.button>
        <motion.button
          className="flex items-center gap-1.5 text-xs text-soul-muted hover:text-soul-primary transition-colors"
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
        >
          <Share2 size={15} />
          <span>{copied ? '✓ Copied!' : 'Share'}</span>
        </motion.button>
      </div>

      {/* ── Comments ── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            className="px-4 pb-4 border-t border-soul-border/30"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="pt-3">
              <CommentSection postId={post.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
