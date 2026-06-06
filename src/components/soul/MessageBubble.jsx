import { motion } from 'framer-motion';
import { formatTimeAgo } from '../../utils/helpers';

export default function MessageBubble({ message, isUser }) {
  return (
    <motion.div
      className={`flex items-end gap-2 px-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {/* Soul avatar for soul messages */}
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
          style={{ background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' }}
        >
          🌸
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`
            px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isUser
              ? 'rounded-br-sm text-white'
              : 'rounded-bl-sm bg-white/80 backdrop-blur-sm border border-white/50 text-soul-text shadow-sm'
            }
          `}
          style={isUser ? {
            background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
          } : {
            borderLeft: '3px solid rgba(124, 111, 247, 0.3)',
          }}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-soul-muted mt-1 px-1">
          {formatTimeAgo(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
