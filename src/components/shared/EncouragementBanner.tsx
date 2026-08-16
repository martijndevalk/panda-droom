import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface EncouragementBannerProps {
  show: boolean;
  message: string;
  theme?: 'tables' | 'clock';
}

export const EncouragementBanner: React.FC<EncouragementBannerProps> = ({
  show,
  message,
  theme = 'tables',
}) => {
  const isTables = theme === 'tables';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`w-full max-w-sm p-3 rounded-2xl border-3 border-dark shadow-[3px_3px_0px_theme(colors.dark)] text-center text-xs sm:text-sm font-bold my-2 transition-colors ${
            isTables ? 'bg-amber-100 text-amber-950' : 'bg-orange-100 text-orange-950'
          }`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
