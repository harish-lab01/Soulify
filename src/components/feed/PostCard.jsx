import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, MessageCircle, Share2, Trash2, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOODS, COMMUNITIES } from '../../utils/constants';
import { formatTimeAgo } from '../../utils/helpers';
import { deletePost } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import ReactionBar from './ReactionBar';
import CommentSection from './CommentSection';

export default function PostCard({ post }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const mood = post.mood ? MOODS.find(m => m.id === post.mood) : null;
  const community = post.communityId ? COMMUNITIES.find(c => c.id === post.communityId) : null;
  const isOwner = user?.uid === post.authorId;

  const handleDelete = async () => {
    if (!isOwner) return;
    await deletePost(post.id);
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

  return (
    <motion.div
      className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl overflow-hidden"
      style={{ boxShadow: '0 8px 32px rgba(124, 111, 247, 0.06)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="cursor-pointer" onClick={goToProfile}>
              <Avatar
                src={post.authorPhoto}
                name={post.authorName}
                size="md"
              />
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

          {/* Options */}
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
                  className="absolute right-0 top-8 bg-white rounded-2xl shadow-lg border border-soul-border z-10 overflow-hidden min-w-[140px]"
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                >
                  {isOwner && (
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete post
                    </button>
                  )}
                  <button
                    onClick={() => { goToProfile(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-soul-muted hover:bg-soul-bg text-left transition-colors"
                  >
                    <UserCircle size={14} />
                    View profile
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

        {/* Content */}
        <div className="mt-3">
          {post.content && (
            <p className="text-sm text-soul-text leading-relaxed">{post.content}</p>
          )}
          {post.type === 'image' && post.imageURL && (
            <img
              src={post.imageURL}
              alt="Post"
              className="mt-3 w-full rounded-2xl object-cover max-h-64"
            />
          )}
          {post.type === 'poll' && post.poll && (
            <div className="mt-3 space-y-2">
              {post.poll.options.map((opt, i) => (
                <div key={i} className="bg-soul-bg rounded-xl p-3 text-sm flex justify-between">
                  <span>{opt.text}</span>
                  <span className="text-soul-muted font-semibold">{opt.votes || 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reaction bar */}
      <div className="px-4 pb-3">
        <ReactionBar postId={post.id} reactionCounts={post.reactionCounts} />
      </div>

      {/* Footer */}
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

      {/* Comments */}
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
