import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-gradient-to-r from-soul-primary to-soul-secondary text-white shadow-lg shadow-violet-200',
  secondary: 'bg-white text-soul-primary border-2 border-soul-primary',
  ghost: 'border-2 border-soul-primary text-soul-primary bg-white/50 backdrop-blur-sm',
  danger: 'bg-gradient-to-r from-red-400 to-rose-500 text-white',
  soft: 'bg-soul-bg text-soul-primary border border-soul-border',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
  icon: 'p-3',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        font-semibold rounded-full transition-all 
        ${variants[variant]} 
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
}
