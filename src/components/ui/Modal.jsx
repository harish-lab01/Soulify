import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, children, title, fullScreen = false }) {
  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Modal sheet */}
          <motion.div
            className={`
              fixed z-[210] bg-white
              ${fullScreen
                ? 'inset-0 rounded-none overflow-y-auto'
                : 'bottom-0 left-0 right-0 rounded-t-3xl flex flex-col'
              }
            `}
            style={fullScreen ? {} : {
              /* Use dynamic viewport height so browser chrome + keyboard don't clip */
              maxHeight: 'min(92dvh, 92vh)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            {/* Drag handle pill */}
            {!fullScreen && (
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
            )}

            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-soul-border flex-shrink-0 bg-white rounded-t-3xl">
                <h2 className="font-display font-bold text-lg text-soul-text">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-soul-bg transition-colors"
                  aria-label="Close"
                >
                  <X size={20} className="text-soul-muted" />
                </button>
              </div>
            )}

            {/* Scrollable content area with safe-area bottom padding */}
            <div
              className="overflow-y-auto flex-1"
              style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
            >
              <div className="p-5">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
