import { Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

export default function TopBar({ title, showSearch = false, showNotif = true, backButton = null }) {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  return (
    <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-soul-border/50 px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {/* Left side */}
        {backButton ? (
          <motion.button
            onClick={backButton}
            className="p-2 rounded-full hover:bg-soul-bg transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            ←
          </motion.button>
        ) : (
          <span
            onClick={() => navigate('/home')}
            className="cursor-pointer font-display font-bold text-xl text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' }}
          >
            {title || 'Soulify'}
          </span>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <motion.button
              className="p-2 rounded-full hover:bg-soul-bg transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <Search size={20} className="text-soul-muted" />
            </motion.button>
          )}
          {showNotif && (
            <motion.button
              className="p-2 rounded-full hover:bg-soul-bg transition-colors relative"
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={20} className="text-soul-muted" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-soul-secondary rounded-full" />
            </motion.button>
          )}
          <motion.div
            className="cursor-pointer"
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/profile/${userProfile?.uid}`)}
          >
            <Avatar
              src={userProfile?.photoURL}
              name={userProfile?.displayName}
              size="sm"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
