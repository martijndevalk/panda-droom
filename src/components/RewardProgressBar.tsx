import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

export const REWARDS_THRESHOLDS = [
  { count: 2, label: '15 minuten extra digitale speeltijd' },
  { count: 4, label: 'Samen een spelletje kiezen' },
  { count: 6, label: 'Pannenkoeken eten!' },
  { count: 8, label: 'Samen naar de speeltuin' },
  { count: 10, label: 'Een heel speciaal cadeau! 🎁' },
];

interface RewardProgressBarProps {
  earnedCount: number;
  totalCount: number;
  className?: string;
  onOpenTreasury?: () => void;
}

export const RewardProgressBar: React.FC<RewardProgressBarProps> = ({ earnedCount, totalCount, className = '', onOpenTreasury }) => {
  return (
    <div className={`bg-white rounded-[2rem] p-4 sm:p-6 text-center border-4 border-dark shadow-[6px_6px_0px_theme(colors.dark)] ${className}`}>
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between mb-3 sm:mb-4 gap-3">
        <p className="title-font text-lg sm:text-xl font-black text-amber-800 m-0">
          {earnedCount} van {totalCount} stickers verdiend! 🌟
        </p>

        {onOpenTreasury && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.6 }}
            whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenTreasury}
            className="btn bg-amber-400 hover:bg-amber-500 text-amber-950 btn-lg h-auto px-4 py-3 md:px-6 md:py-4 rounded-2xl flex items-center gap-2 border-4 border-dark shadow-[4px_4px_0px_theme(colors.dark)] shrink-0 sm:self-start w-full sm:w-auto justify-center"
          >
            <Star className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
            Schatkist
          </motion.button>
        )}
      </div>

      <div className="relative w-full h-6 sm:h-8 bg-amber-100 rounded-full mb-3 sm:mb-4 border-4 border-dark shadow-[inset_0px_[-4px]_0px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Base progress fill */}
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full z-0 origin-left"
          initial={{ width: 0 }}
          animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Threshold markers */}
        {REWARDS_THRESHOLDS.map((reward) => (
          <div
            key={reward.count}
            className="absolute top-0 bottom-0 w-0.5 bg-amber-700/20 z-10"
            style={{ left: `${(reward.count / totalCount) * 100}%` }}
          />
        ))}

        {/* Next reward dot indicator (optional but nice) */}
        {earnedCount < totalCount && (
          <motion.div
            className="absolute top-1/2 -mt-1 sm:-mt-1.5 h-2 w-2 sm:h-3 sm:w-3 bg-white rounded-full shadow z-20"
            style={{
              left: `calc(${(REWARDS_THRESHOLDS.find((r) => r.count > earnedCount)!.count / totalCount) * 100}% - ${
                (REWARDS_THRESHOLDS.find((r) => r.count > earnedCount)!.count / totalCount) * 100 === 100 ? '12px' : '4px'
              })`,
            }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </div>

      {earnedCount < totalCount ? (() => {
        const nextReward = REWARDS_THRESHOLDS.find((r) => r.count > earnedCount) || REWARDS_THRESHOLDS[REWARDS_THRESHOLDS.length - 1];
        const stickersNeeded = nextReward.count - earnedCount;
        return (
          <p className="text-sm sm:text-base font-medium text-amber-900">
            Nog <span className="font-bold text-amber-700">{stickersNeeded} {stickersNeeded === 1 ? 'sticker' : 'stickers'}</span> tot de volgende beloning:{' '}
            <span className="font-bold text-amber-700">{nextReward.label}</span>
          </p>
        );
      })() : (
        <p className="text-sm sm:text-base font-bold text-amber-600 bg-amber-50 p-2 rounded-lg inline-block">
          Gefeliciteerd! Je hebt alle beloningen verdiend! 🎉
        </p>
      )}
    </div>
  );
};
