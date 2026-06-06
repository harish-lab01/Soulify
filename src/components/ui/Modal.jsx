import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, children, title, fullScreen = false }) {
  // Lock body scroll while open
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

          {/* Framer only handles the slide-up — NO height/overflow here */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[210]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            {fullScreen ? (
              <div className="fixed inset-0 bg-white overflow-y-auto">
                {title && (
                  <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-soul-border">
                    <h2 className="font-display font-bold text-lg text-soul-text">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-soul-bg" aria-label="Close">
                      <X size={20} className="text-soul-muted" />
                    </button>
                  </div>
                )}
                <div className="p-5">{children}</div>
              </div>
            ) : (
              /*
               * THE KEY FIX:
               * We need a definite height on this container so that flex-1 + overflow-y-auto
               * work on the child. "max-height" alone does NOT give a definite height to flex
               * children — you need either "height" or both together.
               *
               * We use a CSS custom property --sheet-max set from JS on mount so we can
               * account for the real window.innerHeight (actual visible pixels, not vh).
               * This is the only 100% reliable approach across all mobile browsers.
               */
              <SheetContent title={title} onClose={onClose}>
                {children}
              </SheetContent>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* Separate component so we can use useEffect to measure real viewport */
function SheetContent({ title, onClose, children }) {
  // Measure real available height once on mount
  const maxH = typeof window !== 'undefined'
    ? Math.floor(window.innerHeight * 0.85)
    : 600;

  return (
    <div
      className="bg-white rounded-t-3xl flex flex-col"
      style={{
        /* Both height and max-height — this gives flex children a definite size to work against */
        height: `${maxH}px`,
        maxHeight: `${maxH}px`,
        overflow: 'hidden',
      }}
    >
      {/* Drag handle pill */}
      <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div className="w-10 h-1 rounded-full bg-gray-200" />
      </div>

      {/* Title bar — pinned, never scrolls */}
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-soul-border flex-shrink-0">
          <h2 className="font-display font-bold text-lg text-soul-text">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-soul-bg" aria-label="Close">
            <X size={20} className="text-soul-muted" />
          </button>
        </div>
      )}

      {/*
       * Scrollable area — flex-1 + overflow-y-auto works because parent has a definite height.
       * -webkit-overflow-scrolling: touch = momentum scrolling on iOS.
       */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          paddingBottom: 'env(safe-area-inset-bottom, 12px)',
        }}
      >
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
