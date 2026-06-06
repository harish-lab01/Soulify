export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4">
      {/* Soul avatar dot */}
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
        style={{ background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' }}
      >
        🌸
      </div>

      {/* Typing bubble */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}
