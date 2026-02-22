import { motion, AnimatePresence } from 'motion/react';
import { ReactNode } from 'react';

interface FeedbackAnimationProps {
  children: ReactNode;
  isCorrect?: boolean | null;
  showShake?: boolean;
}

export function FeedbackAnimation({ children, isCorrect, showShake }: FeedbackAnimationProps) {
  // Schud animatie bij fout antwoord
  const shakeAnimation = showShake ? {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.5 }
  } : {};

  // Celebratie animatie bij goed antwoord
  const celebrateAnimation = isCorrect === true ? {
    scale: [1, 1.1, 1],
    rotate: [0, -5, 5, -5, 5, 0],
    transition: { duration: 0.6, ease: 'easeInOut' }
  } : {};

  return (
    <motion.div
      animate={{
        ...shakeAnimation,
        ...celebrateAnimation,
      }}
    >
      {children}
    </motion.div>
  );
}

interface SlideInContainerProps {
  children: ReactNode;
  delay?: number;
}

export function SlideInContainer({ children, delay = 0 }: SlideInContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {children}
    </motion.div>
  );
}

interface FadeInProps {
  children: ReactNode;
  delay?: number;
}

export function FadeIn({ children, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        delay,
        ease: 'easeOut'
      }}
    >
      {children}
    </motion.div>
  );
}

interface SuccessParticlesProps {
  show: boolean;
}

export function SuccessParticles({ show }: SuccessParticlesProps) {
  if (!show) return null;

  const particles = Array.from({ length: 8 });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 1,
            scale: 0,
            x: '50%',
            y: '50%',
          }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1.5, 1],
            x: `${50 + Math.cos((i / particles.length) * Math.PI * 2) * 100}%`,
            y: `${50 + Math.sin((i / particles.length) * Math.PI * 2) * 100}%`,
          }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
          }}
          className="absolute text-4xl"
          style={{
            left: '50%',
            top: '50%',
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  );
}

interface PulseProps {
  children: ReactNode;
  active?: boolean;
}

export function Pulse({ children, active = false }: PulseProps) {
  return (
    <motion.div
      animate={active ? {
        scale: [1, 1.05, 1],
      } : {}}
      transition={{
        duration: 1,
        repeat: active ? Infinity : 0,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}
