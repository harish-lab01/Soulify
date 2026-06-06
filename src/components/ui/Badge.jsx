export default function Badge({ children, color, emoji, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${className}`}
      style={{
        backgroundColor: color ? `${color}20` : undefined,
        color: color || undefined,
      }}
    >
      {emoji && <span>{emoji}</span>}
      {children}
    </span>
  );
}
