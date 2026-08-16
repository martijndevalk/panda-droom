import React from 'react';
import { motion } from 'motion/react';
import { Lock, Star } from 'lucide-react';
import { useWebHaptics } from 'web-haptics/react';
import { initAudioContext, playSound } from '../../lib/audio';
import { PandaAvatar } from '../PandaAvatar';

export interface JourneyNodeProps {
  id: string;
  index: number;
  title: string;
  description: string;
  centerContent: React.ReactNode;
  isUnlocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  position: { x: number; y: number };
  theme: 'tables' | 'clock';
  onSelect: (id: string) => void;
}

export const JourneyNode: React.FC<JourneyNodeProps> = ({
  id,
  index,
  title,
  description,
  centerContent,
  isUnlocked,
  isCompleted,
  isCurrent,
  position,
  theme,
  onSelect,
}) => {
  const { trigger } = useWebHaptics();
  const isTables = theme === 'tables';

  const handleClick = () => {
    if (isUnlocked) {
      trigger('success');
      initAudioContext();
      playSound('pop');
      onSelect(id);
    } else {
      trigger('error');
    }
  };

  // Theming classes
  const getNodeBg = () => {
    if (isCompleted) {
      return 'bg-gradient-to-br from-yellow-300 to-amber-400 border-yellow-500 text-yellow-900';
    }
    if (isCurrent) {
      return isTables
        ? 'bg-gradient-to-br from-green-300 to-green-500 border-green-600 ring-4 ring-green-300/50 text-white'
        : 'bg-gradient-to-br from-amber-300 to-orange-400 border-orange-500 ring-4 ring-orange-300/50 text-white';
    }
    if (isUnlocked) {
      return isTables
        ? 'bg-gradient-to-br from-green-200 to-green-400 border-green-500 text-white'
        : 'bg-gradient-to-br from-emerald-200 to-teal-400 border-teal-500 text-white';
    }
    return 'bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400 opacity-60 text-gray-500';
  };

  const getLabelBg = () => {
    if (isCompleted) {
      return isTables
        ? 'text-amber-800 bg-yellow-100/90 border-amber-200'
        : 'text-amber-900 bg-yellow-100/95 border-amber-300';
    }
    if (isCurrent) {
      return isTables
        ? 'text-green-800 bg-green-100/90 border-green-300'
        : 'text-orange-900 bg-orange-100/95 border-orange-300';
    }
    if (isUnlocked) {
      return isTables
        ? 'text-green-700 bg-white/85 border-green-200'
        : 'text-emerald-900 bg-white/95 border-emerald-300';
    }
    return 'text-gray-500 bg-gray-100/85 border-gray-200';
  };

  const pulseRingColor = isTables ? 'border-green-400' : 'border-orange-400';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay: 0.08 + index * 0.06,
      }}
      className="absolute z-20"
      style={{
        left: `${position.x}%`,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <motion.button
        type="button"
        whileHover={isUnlocked ? { scale: 1.15, y: -4 } : {}}
        whileTap={isUnlocked ? { scale: 0.9 } : {}}
        onClick={handleClick}
        className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
      >
        {/* Node Circle */}
        <div
          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 shadow-[3px_3px_0px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all ${getNodeBg()}`}
        >
          {isCompleted ? (
            <Star className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-800" fill="currentColor" />
          ) : isUnlocked ? (
            centerContent
          ) : (
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
          )}

          {/* Pulsing ring on current active node */}
          {isCurrent && (
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute inset-0 rounded-full border-4 ${pulseRingColor}`}
            />
          )}
        </div>

        {/* Label underneath */}
        <div
          className={`flex flex-col items-center px-2.5 py-1 rounded-2xl shadow-sm border-2 max-w-[130px] sm:max-w-[160px] text-center backdrop-blur-xs transition-colors ${getLabelBg()}`}
        >
          <span className="title-font text-xs sm:text-sm font-black leading-tight">
            {title}
          </span>
          <span className="text-[10px] sm:text-xs font-bold opacity-75 leading-tight mt-0.5">
            {description}
          </span>
        </div>
      </motion.button>

      {/* Floating Panda avatar above current node */}
      {isCurrent && (
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.4 }}
          className="absolute -top-14 sm:-top-16 left-1/2 -translate-x-1/2 pointer-events-none"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <PandaAvatar className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-lg" />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
