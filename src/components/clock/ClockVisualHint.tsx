import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2 } from 'lucide-react';
import { speak, ensureAudioUnlocked } from '../../lib/tts';
import { initAudioContext } from '../../lib/audio';
import { ClockFace } from './ClockFace';

interface ClockVisualHintProps {
  visible: boolean;
  hours: number;
  minutes: number;
  hintText: string;
  onClose: () => void;
}

export function ClockVisualHint({ visible, hours, minutes, hintText, onClose }: ClockVisualHintProps) {
  const hasSpokenRef = useRef(false);

  const handleSpeak = () => {
    initAudioContext();
    ensureAudioUnlocked();
    speak(`Tip! ${hintText}`);
  };

  useEffect(() => {
    if (visible && !hasSpokenRef.current) {
      hasSpokenRef.current = true;
      const timer = setTimeout(() => handleSpeak(), 300);
      return () => clearTimeout(timer);
    }
    if (!visible) {
      hasSpokenRef.current = false;
    }
  }, [visible, hintText]);

  // Determine highlight sector
  let sector: 'none' | 'quarter-over' | 'quarter-before' | 'half' = 'none';
  if (minutes === 30) sector = 'half';
  else if (minutes === 15) sector = 'quarter-over';
  else if (minutes === 45) sector = 'quarter-before';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[8px_8px_0px_theme(colors.dark)] border-4 border-dark max-w-md w-full max-h-[85vh] overflow-y-auto relative flex flex-col items-center"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 border-2 border-dark text-dark transition-colors z-10"
              aria-label="Sluiten"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="w-full flex items-center justify-center gap-2 mb-3 px-8 text-center">
              <span className="text-xl sm:text-2xl">💡</span>
              <h3 className="title-font text-xl sm:text-2xl font-black text-amber-700 leading-tight">
                Panda's Klokkentip
              </h3>
            </div>

            {/* Mini visual clock representation */}
            <div className="my-3 flex justify-center w-44 h-44">
              <ClockFace
                hours={hours}
                minutes={minutes}
                interactive={false}
                highlightSector={sector}
                showHelperZones={true}
              />
            </div>

            {/* Explanation box */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 w-full text-center mt-2">
              <p className="text-base sm:text-lg font-bold text-gray-800 leading-relaxed">
                {hintText}
              </p>
            </div>

            {/* Speech Button */}
            <button
              type="button"
              onClick={handleSpeak}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold border-2 border-sky-300 transition-colors"
            >
              <Volume2 size={18} />
              <span>Luister naar de tip</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
