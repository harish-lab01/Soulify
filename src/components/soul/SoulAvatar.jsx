import { motion } from 'framer-motion';

// Animated Soul avatar using CSS + emoji (Lottie fallback for when no external URL available)
export default function SoulAvatar({ size = 'md', isThinking = false }) {
  const sizes = {
    sm: 'w-10 h-10 text-2xl',
    md: 'w-20 h-20 text-4xl',
    lg: 'w-32 h-32 text-6xl',
  };

  return (
    <motion.div
      className={`
        relative ${sizes[size]} rounded-full flex items-center justify-center
        shadow-xl
      `}
      style={{
        background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        boxShadow: '0 8px 32px rgba(124, 111, 247, 0.3)',
      }}
      animate={isThinking ? { scale: [1, 1.05, 1] } : { y: [0, -6, 0] }}
      transition={{
        duration: isThinking ? 1 : 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Inner glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.4) 0%, transparent 60%)',
        }}
      />
      {/* Soul emoji character */}
      <span className="relative z-10 select-none">🌸</span>

      {/* Thinking pulse rings */}
      {isThinking && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-soul-primary/30"
            animate={{ scale: [1, 1.5, 1.8], opacity: [0.6, 0.2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-soul-secondary/30"
            animate={{ scale: [1, 1.4, 1.7], opacity: [0.6, 0.2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}
    </motion.div>
  );
}
