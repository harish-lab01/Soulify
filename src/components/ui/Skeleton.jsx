export function Skeleton({ className = '', rounded = 'rounded-xl' }) {
  return (
    <div
      className={`skeleton ${rounded} ${className}`}
      style={{
        background: 'linear-gradient(90deg, #f0e6ff 25%, #e8d5ff 50%, #f0e6ff 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

export function PostSkeleton() {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11" rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-8 w-16" rounded="rounded-full" />
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" rounded="rounded-3xl" />
      <div className="px-5 space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}
