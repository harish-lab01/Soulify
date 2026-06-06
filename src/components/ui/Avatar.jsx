import { getInitials } from '../../utils/helpers';

const sizes = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-sm',
  md: 'w-11 h-11 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

export default function Avatar({ src, name, size = 'md', className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'avatar'}
        className={`rounded-full object-cover ring-2 ring-white shadow-sm ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        rounded-full flex items-center justify-center font-bold text-white
        bg-gradient-to-br from-soul-primary to-soul-secondary
        ring-2 ring-white shadow-sm
        ${sizes[size]} ${className}
      `}
    >
      {getInitials(name)}
    </div>
  );
}
