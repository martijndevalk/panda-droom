import React from 'react';
import { motion } from 'motion/react';
import { Gift, RotateCcw, ArrowRight, Star } from 'lucide-react';
import { useWebHaptics } from 'web-haptics/react';
import { initAudioContext, playSound } from '../../lib/audio';
import { PandaAvatar } from '../PandaAvatar';

export interface LevelCompleteModalProps {
  title?: string;
  subtitle: string;
  badgeContent?: React.ReactNode;
  rewardNote?: string;
  milestoneReward?: { label: string; count: number } | null;
  onBackToMap: () => void;
  onNextLevel?: () => void;
  nextButtonText?: string;
  theme?: 'tables' | 'clock';
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  title = '🎉 Geweldig!',
  subtitle,
  badgeContent,
  rewardNote,
  milestoneReward,
  onBackToMap,
  onNextLevel,
  nextButtonText = 'Volgende Wereld 🚀',
  theme = 'tables',
}) => {
  const { trigger } = useWebHaptics();
  const isTables = theme === 'tables';

  const handleBack = () => {
    trigger('selection');
    initAudioContext();
    playSound('pop');
    onBackToMap();
  };

  const handleNext = () => {
    if (onNextLevel) {
      trigger('success');
      initAudioContext();
      playSound('pop');
      onNextLevel();
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      className="bg-white rounded-[2.5rem] border-4 border-dark shadow-[8px_8px_0px_theme(colors.dark)] p-6 sm:p-8 max-w-sm sm:max-w-md w-full my-auto flex flex-col items-center text-center relative z-20"
    >
      {/* Panda Peek */}
      <div className="absolute -top-12 sm:-top-14 left-1/2 -translate-x-1/2">
        <PandaAvatar mood="happy" className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-lg" />
      </div>

      <h2 className="title-font text-3xl sm:text-4xl font-black text-dark mt-8 mb-1">
        {title}
      </h2>
      <p className="text-base sm:text-lg text-gray-700 font-bold mb-4">
        {subtitle}
      </p>

      {/* Badge / Reward representation */}
      {badgeContent && (
        <div className="my-2 flex flex-col items-center">
          {badgeContent}
        </div>
      )}

      {rewardNote && (
        <p className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-100 px-4 py-1.5 rounded-full mb-3 border border-emerald-300">
          {rewardNote}
        </p>
      )}

      {/* Milestone / Real Life reward unlocked */}
      {milestoneReward && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-200 border-3 border-dark rounded-2xl p-3 my-2 flex items-center gap-3 shadow-sm text-left"
        >
          <div className="w-10 h-10 rounded-full bg-amber-400 border-2 border-dark flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-amber-950" />
          </div>
          <div>
            <span className="text-xs font-black text-amber-900 uppercase tracking-wider block">
              🎁 Beloning Verdiend!
            </span>
            <span className="text-sm font-extrabold text-amber-950">
              {milestoneReward.label}
            </span>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={handleBack}
          className="flex-1 py-3 px-4 rounded-full border-3 border-dark font-black text-sm sm:text-base text-gray-700 bg-gray-100 hover:bg-gray-200 shadow-[3px_3px_0px_theme(colors.dark)] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
        >
          <RotateCcw size={18} />
          <span>Naar de Kaart</span>
        </motion.button>

        {onNextLevel && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={handleNext}
            className="flex-1 py-3 px-4 rounded-full border-3 border-dark font-black text-sm sm:text-base text-white bg-[#388E3C] hover:bg-[#2e7d32] shadow-[3px_3px_0px_theme(colors.dark)] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <span>{nextButtonText}</span>
            <ArrowRight size={18} />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
