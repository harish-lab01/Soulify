import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FloatingBlobs from '../components/layout/FloatingBlobs';
import LoginForm from '../components/auth/LoginForm';
import SoulAvatar from '../components/soul/SoulAvatar';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export default function Login() {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (userProfile && !userProfile.onboardingComplete) {
        navigate('/onboarding', { replace: true });
      } else if (userProfile?.onboardingComplete) {
        navigate('/home', { replace: true });
      }
    }
  }, [user, userProfile, loading, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <FloatingBlobs />

      <motion.div
        className="w-full max-w-sm relative z-10"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        {/* Card */}
        <div className="glass-card p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <SoulAvatar size="md" />
            <h1
              className="font-display font-bold text-2xl mt-3"
              style={{ background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Soulify
            </h1>
            <p className="text-soul-muted text-sm mt-1">You are never alone</p>
          </div>

          <LoginForm />
        </div>

        {/* Back to landing */}
        <p className="text-center mt-4 text-sm text-soul-muted">
          <button
            onClick={() => navigate('/')}
            className="text-soul-primary hover:underline"
          >
            ← Back to home
          </button>
        </p>
      </motion.div>
    </div>
  );
}
