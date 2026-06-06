import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, children, title, fullScreen = false }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            className={`
              fixed z-50 bg-white rounded-t-3xl
              ${fullScreen
                ? 'inset-0 rounded-none overflow-y-auto'
                : 'bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto'
              }
            `}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            {title && (
              <div className="flex items-center justify-between p-5 border-b border-soul-border sticky top-0 bg-white z-10">
                <h2 className="font-display font-700 text-lg text-soul-text">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-soul-bg transition-colors"
                >
                  <X size={20} className="text-soul-muted" />
                </button>
              </div>
            )}
            <div className="p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
