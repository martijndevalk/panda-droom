import React from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';

export interface JourneyFinishNodeProps {
  position: { x: number; y: number };
  label: string;
  theme: 'tables' | 'clock';
}

export const JourneyFinishNode: React.FC<JourneyFinishNodeProps> = ({
  position,
  label,
  theme,
}) => {
  const isTables = theme === 'tables';

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.8 }}
      className="absolute z-20"
      style={{
        left: `${position.x}%`,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* End of road visual dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-200 border-4 border-amber-300 shadow-sm z-0" />

      <div className="flex flex-col items-center gap-1 opacity-75 hover:opacity-100 transition-opacity z-10 relative mt-[-20px] cursor-default">
        <Trophy className="w-12 h-12 text-amber-500 drop-shadow-md" fill="#fde047" />
        <span
          className={`title-font text-xs font-black px-3 py-1 rounded-full border shadow-sm ${
            isTables
              ? 'text-amber-800 bg-amber-100/95 border-amber-300'
              : 'text-amber-900 bg-amber-100/95 border-amber-300'
          }`}
        >
          {label}
        </span>
      </div>
    </motion.div>
  );
};
