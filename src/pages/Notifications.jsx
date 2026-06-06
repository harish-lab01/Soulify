import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getNotifications, markAllNotificationsRead } from '../firebase/firestore';
import NotificationItem from '../components/notifications/NotificationItem';
import TopBar from '../components/layout/TopBar';
import { useNavigate } from 'react-router-dom';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export default function Notifications() {
  const { user } = useAuth();
  const { setUnreadNotifCount } = useApp();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = getNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
      const unread = notifs.filter(n => !n.read).length;
      setUnreadNotifCount(unread);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const handleMarkAll = async () => {
    await markAllNotificationsRead(user.uid);
    setUnreadNotifCount(0);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <TopBar title="Notifications" backButton={() => navigate(-1)} />

      <div className="hidden lg:flex items-center justify-between px-6 pt-6 pb-2">
        <div>
          <h1 className="font-display font-bold text-2xl text-soul-text">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-soul-muted text-sm mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <motion.button
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 text-xs text-soul-primary font-semibold"
            whileTap={{ scale: 0.95 }}
          >
            <CheckCheck size={14} />
            Mark all read
          </motion.button>
        )}
      </div>

      <div className="px-4 lg:px-6 py-4 max-w-lg mx-auto lg:max-w-2xl">
        {/* Mark all button — mobile */}
        {unreadCount > 0 && (
          <div className="flex justify-end mb-3 lg:hidden">
            <motion.button
              onClick={handleMarkAll}
              className="flex items-center gap-1.5 text-xs text-soul-primary font-semibold"
              whileTap={{ scale: 0.95 }}
            >
              <CheckCheck size={14} />
              Mark all read
            </motion.button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-soul-bg animate-pulse">
                <div className="w-11 h-11 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #fde8f0 100%)' }}
            >
              <Bell size={32} className="text-soul-primary" />
            </div>
            <h3 className="font-display font-bold text-soul-text text-lg">All caught up!</h3>
            <p className="text-soul-muted text-sm mt-2 max-w-xs">
              When someone follows you, reacts to your post, or comments, it'll show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Today */}
            {notifications.filter(n => {
              const d = n.createdAt?.toDate?.() || new Date();
              return new Date().toDateString() === d.toDateString();
            }).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-soul-muted uppercase tracking-wide px-2 mb-2">Today</p>
                {notifications.filter(n => {
                  const d = n.createdAt?.toDate?.() || new Date();
                  return new Date().toDateString() === d.toDateString();
                }).map(n => (
                  <NotificationItem key={n.id} notif={n} />
                ))}
              </div>
            )}

            {/* Earlier */}
            {notifications.filter(n => {
              const d = n.createdAt?.toDate?.() || new Date();
              return new Date().toDateString() !== d.toDateString();
            }).length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-soul-muted uppercase tracking-wide px-2 mb-2">Earlier</p>
                {notifications.filter(n => {
                  const d = n.createdAt?.toDate?.() || new Date();
                  return new Date().toDateString() !== d.toDateString();
                }).map(n => (
                  <NotificationItem key={n.id} notif={n} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
