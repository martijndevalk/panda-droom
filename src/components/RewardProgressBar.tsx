import React from 'react';
import { motion } from 'motion/react';

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
}

export const RewardProgressBar: React.FC<RewardProgressBarProps> = ({ earnedCount, totalCount, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-6 text-center border-2 border-amber-200 shadow-lg ${className}`}>
      <p className="text-lg sm:text-xl font-bold text-amber-800 mb-3 sm:mb-4">
        {earnedCount} van {totalCount} stickers verdiend! 🌟
      </p>

      <div className="relative w-full h-6 sm:h-8 bg-amber-100 rounded-full mb-3 sm:mb-4 border-2 border-amber-300 overflow-hidden">
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
