import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, children, title, fullScreen = false }) {
  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
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

          {/* Sheet container — sits at the bottom, height is driven by CSS not Framer */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[210]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            {fullScreen ? (
              /* Full-screen variant */
              <div className="fixed inset-0 bg-white overflow-y-auto">
                {title && (
                  <div className="flex items-center justify-between px-5 py-4 border-b border-soul-border sticky top-0 bg-white z-10">
                    <h2 className="font-display font-bold text-lg text-soul-text">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-soul-bg" aria-label="Close">
                      <X size={20} className="text-soul-muted" />
                    </button>
                  </div>
                )}
                <div className="p-5">{children}</div>
              </div>
            ) : (
              /* Bottom-sheet variant — key: height is capped via CSS, inner div scrolls */
              <div
                className="bg-white rounded-t-3xl flex flex-col overflow-hidden"
                style={{
                  /* svh = small viewport height — excludes browser chrome, keyboard, etc.
                     This is the most reliable unit for mobile bottom sheets.
                     85svh leaves enough room above the sheet to tap the backdrop to close. */
                  maxHeight: 'min(85svh, 85vh)',
                }}
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                  <div className="w-10 h-1 rounded-full bg-gray-200" />
                </div>

                {/* Title bar — never scrolls away */}
                {title && (
                  <div className="flex items-center justify-between px-5 py-4 border-b border-soul-border flex-shrink-0">
                    <h2 className="font-display font-bold text-lg text-soul-text">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-soul-bg" aria-label="Close">
                      <X size={20} className="text-soul-muted" />
                    </button>
                  </div>
                )}

                {/* Scrollable body — this is what actually scrolls */}
                <div
                  className="flex-1 overflow-y-auto overscroll-contain"
                  style={{
                    paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <div className="p-5 pb-6">{children}</div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
