import { motion } from 'framer-motion';
import { Heart, MessageCircle, UserPlus, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { markNotificationRead } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { formatTimeAgo } from '../../utils/helpers';
import Avatar from '../ui/Avatar';

const typeConfig = {
  follow:  { icon: UserPlus,      color: '#7C6FF7', bg: '#f0e6ff' },
  comment: { icon: MessageCircle, color: '#34D399', bg: '#d1fae5' },
  reaction:{ icon: Heart,         color: '#F472B6', bg: '#fce7f3' },
  badge:   { icon: Star,          color: '#FBBF24', bg: '#fef9c3' },
};

export default function NotificationItem({ notif }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const config = typeConfig[notif.type] || typeConfig.reaction;
  const Icon = config.icon;

  const handleClick = async () => {
    if (!notif.read) {
      await markNotificationRead(user.uid, notif.id);
    }
    if (notif.type === 'follow' && notif.fromUserId) {
      navigate(`/profile/${notif.fromUserId}`);
    } else if (notif.postId) {
      navigate(`/home`);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
        notif.read ? 'bg-transparent hover:bg-soul-bg/50' : 'bg-soul-bg'
      }`}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          src={notif.fromUserPhoto}
          name={notif.fromUserName}
          size="md"
        />
        <div
          className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: config.bg }}
        >
          <Icon size={11} style={{ color: config.color }} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-soul-text leading-snug">
          <span className="font-semibold">{notif.fromUserName}</span>{' '}
          <span className="text-soul-muted font-normal">
            {notif.type === 'follow' && 'started following you'}
            {notif.type === 'comment' && 'commented on your post'}
            {notif.type === 'reaction' && 'reacted to your post'}
            {notif.type === 'badge' && 'you earned a new badge'}
          </span>
        </p>
        <p className="text-xs text-soul-muted mt-0.5">
          {formatTimeAgo(notif.createdAt)}
        </p>
      </div>

      {!notif.read && (
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.color }}
        />
      )}
    </motion.div>
  );
}
