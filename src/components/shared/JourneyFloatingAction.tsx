import React from 'react';
import { motion } from 'motion/react';
import { useWebHaptics } from 'web-haptics/react';
import { initAudioContext, playSound } from '../../lib/audio';

export interface JourneyFloatingActionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  theme: 'tables' | 'clock';
  onClick: () => void;
}

export const JourneyFloatingAction: React.FC<JourneyFloatingActionProps> = ({
  title,
  subtitle,
  icon,
  theme,
  onClick,
}) => {
  const { trigger } = useWebHaptics();
  const isTables = theme === 'tables';

  const handleClick = () => {
    trigger('success');
    initAudioContext();
    playSound('pop');
    onClick();
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-40"
    >
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`flex items-center gap-2.5 bg-white/95 backdrop-blur-sm border-3 sm:border-4 py-2 px-3 sm:py-2.5 sm:px-4 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer ${
          isTables ? 'border-emerald-400' : 'border-amber-400'
        }`}
      >
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-inner text-white ${
            isTables
              ? 'bg-gradient-to-br from-green-400 to-emerald-500'
              : 'bg-gradient-to-br from-amber-400 to-orange-500'
          }`}
        >
          {icon}
        </div>
        <div className="flex flex-col items-start pr-1">
          <span
            className={`title-font text-xs sm:text-sm font-black leading-tight ${
              isTables ? 'text-emerald-800' : 'text-amber-900'
            }`}
          >
            {title}
          </span>
          <span
            className={`text-[9px] sm:text-[11px] font-bold ${
              isTables ? 'text-emerald-600' : 'text-amber-700'
            }`}
          >
            {subtitle}
          </span>
        </div>
      </motion.button>
    </motion.div>
  );
};
