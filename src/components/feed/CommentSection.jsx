import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getComments, addComment } from '../../firebase/firestore';
import Avatar from '../ui/Avatar';
import { formatTimeAgo } from '../../utils/helpers';

export default function CommentSection({ postId }) {
  const { user, userProfile } = useAuth();
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getComments(postId, (data) => {
      setComments(data);
      setLoading(false);
    });
    return unsub;
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    try {
      await addComment(postId, {
        authorId: user.uid,
        authorName: userProfile?.displayName || 'Anonymous',
        authorPhoto: userProfile?.photoURL || '',
        content: input.trim(),
        parentId: null,
      });
      setInput('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-3">
      {/* Comment input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Avatar src={userProfile?.photoURL} name={userProfile?.displayName} size="sm" />
        <div className="flex-1 flex items-center bg-soul-bg rounded-full border border-soul-border px-3 py-1.5 gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-sm text-soul-text placeholder-soul-muted outline-none"
          />
          <motion.button
            type="submit"
            disabled={!input.trim()}
            whileTap={{ scale: 0.9 }}
            className="disabled:opacity-40"
          >
            <Send size={16} className="text-soul-primary" />
          </motion.button>
        </div>
      </form>

      {/* Comments list */}
      {comments.map(comment => (
        <motion.div
          key={comment.id}
          className="flex items-start gap-2"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Avatar src={comment.authorPhoto} name={comment.authorName} size="sm" />
          <div className="flex-1 bg-soul-bg rounded-2xl px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-soul-text">{comment.authorName}</span>
              <span className="text-[10px] text-soul-muted">{formatTimeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-soul-text mt-0.5">{comment.content}</p>
          </div>
        </motion.div>
      ))}

      {loading && (
        <p className="text-xs text-soul-muted text-center">Loading comments...</p>
      )}
    </div>
  );
}
