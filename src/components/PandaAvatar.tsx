import { motion, AnimatePresence } from 'motion/react';

type PandaMood = 'normal' | 'error';

interface PandaAvatarProps {
  className?: string;
  mood?: PandaMood;
}

export function PandaAvatar({ className = '', mood = 'normal' }: PandaAvatarProps) {
  const isError = mood === 'error';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={className}
    >
      {/* Left ear */}
      <motion.circle
        cx="14" cy="14" r="12" fill="#1a1a2e"
        animate={{ rotate: [-2, 2, -2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "14px 26px" }}
      />
      {/* Right ear */}
      <motion.circle
        cx="50" cy="14" r="12" fill="#1a1a2e"
        animate={{ rotate: [2, -2, 2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "50px 26px" }}
      />
      {/* Head */}
      <circle cx="32" cy="34" r="26" fill="#ffffff" stroke="#1a1a2e" strokeWidth="2" />

      {/* Eye patches — always visible */}
      <ellipse cx="20" cy="28" rx="9" ry="10" fill="#1a1a2e" transform="rotate(10 20 28)" />
      <ellipse cx="44" cy="28" rx="9" ry="10" fill="#1a1a2e" transform="rotate(-10 44 28)" />

      <AnimatePresence mode="wait">
        {isError ? (
          /* X eyes for error state */
          <motion.g key="error-eyes">
            {/* Left X */}
            <motion.g
              initial={{ scale: 0.3, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              style={{ transformOrigin: "20px 27px" }}
            >
              <line x1="15" y1="22" x2="25" y2="32" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              <line x1="25" y1="22" x2="15" y2="32" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            </motion.g>
            {/* Right X */}
            <motion.g
              initial={{ scale: 0.3, opacity: 0, rotate: 45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              style={{ transformOrigin: "44px 27px" }}
            >
              <line x1="39" y1="22" x2="49" y2="32" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              <line x1="49" y1="22" x2="39" y2="32" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            </motion.g>
          </motion.g>
        ) : (
          /* Normal eyes with blink animation */
          <motion.g
            key="normal-eyes"
            initial={{ scaleY: 0.1 }}
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            exit={{ scaleY: 0.1 }}
            transition={{
              duration: 4,
              times: [0, 0.9, 0.95, 0.98, 1],
              repeat: Infinity,
              repeatDelay: 1,
            }}
            style={{ transformOrigin: "32px 28px" }}
          >
            {/* Left eye */}
            <circle cx="20" cy="27" r="3" fill="#ffffff" />
            <circle cx="21" cy="26" r="1.2" fill="#ffffff" opacity="0.8" />
            {/* Right eye */}
            <circle cx="44" cy="27" r="3" fill="#ffffff" />
            <circle cx="45" cy="26" r="1.2" fill="#ffffff" opacity="0.8" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Nose */}
      <motion.ellipse
        cx="32" cy="38" rx="4" ry="3" fill="#1a1a2e"
        animate={{ translateY: [0, -0.5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Mouth — sad line when error, happy smile otherwise */}
      <AnimatePresence mode="wait">
        {isError ? (
          <motion.path
            key="sad-mouth"
            d="M28 44 Q32 40 36 44"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round"
          />
        ) : (
          <motion.path
            key="happy-mouth"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              d: [
                "M28 42 Q32 47 36 42",
                "M28 41.5 Q32 48 36 41.5",
                "M28 42 Q32 47 36 42"
              ]
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.15 },
              d: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round"
          />
        )}
      </AnimatePresence>
      {/* Cheek blush */}
      <motion.g
        animate={{ opacity: isError ? 0.15 : [0.3, 0.6, 0.3] }}
        transition={isError ? { duration: 0.2 } : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="14" cy="36" r="4" fill="#ffb3b3" />
        <circle cx="50" cy="36" r="4" fill="#ffb3b3" />
      </motion.g>
    </svg>
  );
}
