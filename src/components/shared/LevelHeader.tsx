import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Lightbulb, Volume2 } from 'lucide-react';
import { useWebHaptics } from 'web-haptics/react';
import { initAudioContext, playSound } from '../../lib/audio';

export interface LevelHeaderProps {
  title: string;
  emoji?: string;
  theme?: 'tables' | 'clock';
  currentIndex: number;
  totalQuestions: number;
  showHint?: boolean;
  onToggleHint?: () => void;
  onSpeak?: () => void;
  onBack: () => void;
  rightExtra?: React.ReactNode;
}

export const LevelHeader: React.FC<LevelHeaderProps> = ({
  title,
  emoji,
  theme = 'tables',
  currentIndex,
  totalQuestions,
  showHint,
  onToggleHint,
  onSpeak,
  onBack,
  rightExtra,
}) => {
  const { trigger } = useWebHaptics();
  const isTables = theme === 'tables';

  const handleBack = () => {
    trigger('selection');
    initAudioContext();
    playSound('pop');
    onBack();
  };

  const handleHint = () => {
    if (onToggleHint) {
      trigger('selection');
      initAudioContext();
      playSound('pop');
      onToggleHint();
    }
  };

  const handleSpeak = () => {
    if (onSpeak) {
      trigger('selection');
      initAudioContext();
      onSpeak();
    }
  };

  const progressPercent = Math.min(100, Math.round(((currentIndex + 1) / Math.max(1, totalQuestions)) * 100));

  return (
    <div className="w-full max-w-lg flex flex-col gap-2 z-20">
      <div className="flex items-center justify-between gap-2">
        {/* Back button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={handleBack}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border-3 border-dark shadow-[3px_3px_0px_theme(colors.dark)] flex items-center justify-center text-dark cursor-pointer transition-transform"
          aria-label="Terug naar de kaart"
        >
          <ArrowLeft size={20} />
        </motion.button>

        {/* World Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/95 rounded-full border-2 border-dark shadow-sm">
          {emoji && <span className="text-base sm:text-lg">{emoji}</span>}
          <span className="title-font text-xs sm:text-sm font-black text-dark">
            {title}
          </span>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          {rightExtra}

          {/* Audio repeat button */}
          {onSpeak && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={handleSpeak}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white hover:bg-sky-50 border-3 border-dark shadow-[3px_3px_0px_theme(colors.dark)] flex items-center justify-center text-sky-700 cursor-pointer transition-transform"
              aria-label="Vraag nogmaals voorlezen"
            >
              <Volume2 size={20} />
            </motion.button>
          )}

          {/* Hint button */}
          {onToggleHint && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={handleHint}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-3 border-dark shadow-[3px_3px_0px_theme(colors.dark)] flex items-center justify-center cursor-pointer transition-all ${
                showHint
                  ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                  : 'bg-white text-amber-600 hover:bg-amber-50'
              }`}
              aria-label="Toon visuele tip"
            >
              <Lightbulb size={20} className={showHint ? 'fill-current' : ''} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/80 rounded-full h-3.5 p-0.5 border-2 border-dark shadow-xs flex items-center">
        <motion.div
          className={`h-full rounded-full transition-all duration-300 ${
            isTables
              ? 'bg-gradient-to-r from-emerald-400 to-green-500'
              : 'bg-gradient-to-r from-amber-400 to-orange-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
