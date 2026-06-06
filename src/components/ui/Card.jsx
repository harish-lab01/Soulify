import { motion } from 'framer-motion';

export const cardVariants = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export default function Card({ children, className = '', onClick, glass = true, padding = true }) {
  return (
    <motion.div
      variants={cardVariants}
      onClick={onClick}
      className={`
        ${glass ? 'bg-white/70 backdrop-blur-xl border border-white/50' : 'bg-white border border-soul-border'}
        rounded-3xl shadow-sm
        ${padding ? 'p-5' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{ boxShadow: '0 8px 32px rgba(124, 111, 247, 0.08)' }}
      whileHover={onClick ? { y: -2, boxShadow: '0 12px 40px rgba(124, 111, 247, 0.15)' } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}
