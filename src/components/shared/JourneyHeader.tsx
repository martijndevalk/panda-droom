import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useWebHaptics } from 'web-haptics/react';
import { initAudioContext, playSound } from '../../lib/audio';

export interface JourneyHeaderProps {
  mode: 'tables' | 'clock';
  earnedCount: number;
  totalCount: number;
  onOpenTreasury: () => void;
  onSwitchJourney?: () => void;
}

export const JourneyHeader: React.FC<JourneyHeaderProps> = ({
  mode,
  earnedCount,
  totalCount,
  onOpenTreasury,
  onSwitchJourney,
}) => {
  const { trigger } = useWebHaptics();

  const isTables = mode === 'tables';

  const handleOpenTreasury = () => {
    trigger('success');
    initAudioContext();
    playSound('pop');
    onOpenTreasury();
  };

  const handleSwitch = () => {
    if (onSwitchJourney) {
      initAudioContext();
      playSound('pop');
      onSwitchJourney();
    }
  };

  return (
    <div
      className={`flex-shrink-0 z-30 backdrop-blur-sm border-b-3 border-dark/10 px-3 py-2 flex flex-col items-center gap-1.5 shadow-sm transition-colors duration-300 ${
        isTables ? 'bg-sky-300/95' : 'bg-amber-200/95'
      }`}
    >
      {/* ── Mode Switcher Pill ── */}
      {onSwitchJourney && (
        <div className="flex items-center gap-1 bg-white/95 p-1 rounded-full border-3 border-dark shadow-[2px_2px_0px_theme(colors.dark)]">
          <button
            type="button"
            onClick={isTables ? undefined : handleSwitch}
            className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 transition-all ${
              isTables
                ? 'bg-emerald-500 text-white border-2 border-dark shadow-xs cursor-default'
                : 'text-gray-600 hover:text-dark hover:bg-gray-100 cursor-pointer'
            }`}
          >
            <span>🔢</span>
            <span>Getallenreis</span>
          </button>

          <button
            type="button"
            onClick={!isTables ? undefined : handleSwitch}
            className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 transition-all ${
              !isTables
                ? 'bg-amber-400 text-dark border-2 border-dark shadow-xs cursor-default'
                : 'text-gray-600 hover:text-dark hover:bg-gray-100 cursor-pointer'
            }`}
          >
            <span>⏰</span>
            <span>Tijdreis</span>
          </button>
        </div>
      )}

      {/* ── Title + Quick Treasury Button ── */}
      <div className="flex items-center justify-between w-full max-w-md px-2">
        <h1 className="title-font text-base sm:text-lg font-black text-dark drop-shadow-xs flex items-center gap-1">
          <span>{isTables ? "Panda's Getallenreis" : "Panda's Tijdreis"}</span>
          <span>{isTables ? '🌿' : '⏰'}</span>
        </h1>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={handleOpenTreasury}
          className="flex items-center gap-1 bg-amber-400 hover:bg-amber-500 text-amber-950 px-2.5 py-1 rounded-full border-2 border-dark shadow-[2px_2px_0px_theme(colors.dark)] text-xs font-black cursor-pointer transition-all"
        >
          <Star className="w-3.5 h-3.5" fill="currentColor" />
          <span>Schatkist ({earnedCount}/{totalCount})</span>
        </motion.button>
      </div>
    </div>
  );
};
