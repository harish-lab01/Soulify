import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import FloatingBlobs from '../components/layout/FloatingBlobs';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <FloatingBlobs />
      <motion.div
        className="text-center relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-8xl">🌸</span>
        <h1 className="font-display font-bold text-3xl text-soul-text mt-4">Page not found</h1>
        <p className="text-soul-muted mt-2 mb-6">Looks like you wandered off the path 💙</p>
        <Button onClick={() => navigate('/home')}>Take me home</Button>
      </motion.div>
    </div>
  );
}
