import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

import { RewardItem, getMathRewards, DEFAULT_MATH_REWARDS } from '../lib/rewardsStorage';

export type RewardThreshold = RewardItem;
export const REWARDS_THRESHOLDS = DEFAULT_MATH_REWARDS;

interface RewardProgressBarProps {
  earnedCount: number;
  totalCount: number;
  thresholds?: RewardItem[];
  itemLabelSingular?: string;
  itemLabelPlural?: string;
  headerEmoji?: string;
  className?: string;
  onOpenTreasury?: () => void;
}

export const RewardProgressBar: React.FC<RewardProgressBarProps> = ({
  earnedCount,
  totalCount,
  thresholds,
  itemLabelSingular = 'sticker',
  itemLabelPlural = 'stickers',
  headerEmoji = '🌟',
  className = '',
  onOpenTreasury,
}) => {
  const activeThresholds = thresholds || getMathRewards();
  const nextReward = activeThresholds.find((r) => r.count > earnedCount) || activeThresholds[activeThresholds.length - 1];
  const itemsNeeded = nextReward ? Math.max(0, nextReward.count - earnedCount) : 0;
  const isMaxReached = earnedCount >= totalCount;

  return (
    <div className={`bg-white rounded-[2rem] p-3.5 sm:p-5 text-center border-4 border-dark shadow-[4px_4px_0px_theme(colors.dark)] ${className}`}>
      <div className="flex flex-row items-center justify-between mb-2.5 sm:mb-3 gap-2">
        <p className="title-font text-base sm:text-lg font-black text-amber-800 m-0 text-left">
          {earnedCount} van {totalCount} {itemLabelPlural} verdiend! {headerEmoji}
        </p>

        {onOpenTreasury && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenTreasury}
            className="bg-amber-400 hover:bg-amber-500 text-amber-950 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border-3 border-dark shadow-[2px_2px_0px_theme(colors.dark)] text-xs font-black shrink-0 cursor-pointer"
          >
            <Star className="w-4 h-4" fill="currentColor" />
            <span>Schatkist</span>
          </motion.button>
        )}
      </div>

      <div className="relative w-full h-6 sm:h-8 bg-amber-100 rounded-full mb-3 sm:mb-4 border-4 border-dark shadow-[inset_0px_[-4px]_0px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Base progress fill */}
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full z-0 origin-left"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (earnedCount / totalCount) * 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Threshold markers */}
        {activeThresholds.map((reward) => (
          <div
            key={reward.count}
            className="absolute top-0 bottom-0 w-0.5 bg-amber-700/20 z-10"
            style={{ left: `${(reward.count / totalCount) * 100}%` }}
          />
        ))}

        {/* Next reward dot indicator */}
        {!isMaxReached && nextReward && (
          <motion.div
            className="absolute top-1/2 -mt-1 sm:-mt-1.5 h-2 w-2 sm:h-3 sm:w-3 bg-white rounded-full shadow z-20"
            style={{
              left: `calc(${(nextReward.count / totalCount) * 100}% - ${
                (nextReward.count / totalCount) * 100 === 100 ? '12px' : '4px'
              })`,
            }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </div>

      {!isMaxReached && nextReward ? (
        <p className="text-sm sm:text-base font-medium text-amber-900">
          Nog <span className="font-bold text-amber-700">{itemsNeeded} {itemsNeeded === 1 ? itemLabelSingular : itemLabelPlural}</span> tot de volgende beloning:{' '}
          <span className="font-bold text-amber-700">{nextReward.label}</span>
        </p>
      ) : (
        <p className="text-sm sm:text-base font-bold text-amber-600 bg-amber-50 p-2 rounded-lg inline-block">
          Gefeliciteerd! Je hebt alle beloningen verdiend! 🎉
        </p>
      )}
    </div>
  );
};

