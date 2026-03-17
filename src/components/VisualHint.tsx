import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { speak, ensureAudioUnlocked } from '../lib/tts';
import { initAudioContext } from '../lib/audio';

interface VisualHintProps {
  factors: [number, number];
  visible: boolean;
  onClose: () => void;
}

/**
 * Visual hint for a multiplication problem.
 *
 * Shows `factors[0]` groups of `factors[1]` dots so the child
 * can count the answer instead of relying on recall.
 */
export function VisualHint({ factors, visible, onClose }: VisualHintProps) {
  const [groups, dotsPerGroup] = factors;
  const hasSpokenRef = useRef(false);

  const handleSpeak = () => {
    initAudioContext();
    ensureAudioUnlocked();
    speak(`Hint! ${groups} groepjes van ${dotsPerGroup}. Tel alle bolletjes!`);
  };

  useEffect(() => {
    if (visible && !hasSpokenRef.current) {
      hasSpokenRef.current = true;
      const timer = setTimeout(() => handleSpeak(), 400);
      return () => clearTimeout(timer);
    }
    if (!visible) {
      hasSpokenRef.current = false;
    }
  }, [visible, groups, dotsPerGroup]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[6px_6px_0px_theme(colors.dark)] border-4 border-dark max-w-md w-full max-h-[80vh] overflow-y-auto relative"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 border-2 border-dark text-dark transition-colors shadow-[2px_2px_0px_theme(colors.dark)]"
              aria-label="Hint sluiten"
            >
              <X size={20} />
            </button>

            {/* Title */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-sky-600">
                💡 Hint
              </h3>
            </div>
            <p className="text-lg text-gray-600 text-center mb-6 font-medium">
              {groups} groepjes van {dotsPerGroup}
            </p>

            {/* Visual groups of dots */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {Array.from({ length: groups }, (_, groupIndex) => (
                <motion.div
                  key={groupIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1 }}
                  className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-3 flex flex-wrap justify-center gap-1.5 min-w-[60px]"
                  style={{
                    width: dotsPerGroup <= 5 ? 'auto' : `${Math.ceil(dotsPerGroup / 2) * 28 + 24}px`,
                  }}
                >
                  {Array.from({ length: dotsPerGroup }, (_, dotIndex) => (
                    <motion.div
                      key={dotIndex}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: groupIndex * 0.1 + dotIndex * 0.03,
                        type: 'spring',
                        stiffness: 400,
                        damping: 15,
                      }}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-400 border-2 border-green-500 shadow-sm"
                    />
                  ))}
                </motion.div>
              ))}
            </div>

            <p className="text-center text-gray-500 mt-6 text-sm font-medium">
              Tel alle bolletjes!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
