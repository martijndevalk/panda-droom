import { motion } from 'motion/react';

type Emotion = 'happy' | 'neutral' | 'encouraging' | 'celebrating' | 'thinking';

interface PandaCoachProps {
  emotion?: Emotion;
  text?: string;
  showBubble?: boolean;
}

const emotionEmojis: Record<Emotion, string> = {
  happy: '😊',
  neutral: '🐼',
  encouraging: '💪',
  celebrating: '🎉',
  thinking: '🤔',
};

const emotionColors: Record<Emotion, string> = {
  happy: 'bg-primary',
  neutral: 'bg-secondary',
  encouraging: 'bg-accent',
  celebrating: 'bg-[#e9d5ff]',
  thinking: 'bg-[#fed7aa]',
};

export function PandaCoach({ 
  emotion = 'happy', 
  text = '',
  showBubble = true 
}: PandaCoachProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Tekstballon boven de panda */}
      {showBubble && text && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white rounded-3xl px-6 py-4 shadow-lg max-w-md relative"
        >
          <p className="text-xl text-center text-foreground">{text}</p>
          {/* Kleine driehoek die naar panda wijst */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rotate-45 rounded-sm" />
        </motion.div>
      )}

      {/* Panda Avatar */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`${emotionColors[emotion]} rounded-full w-32 h-32 flex items-center justify-center shadow-xl relative`}
      >
        {/* Panda gezicht */}
        <div className="text-7xl">🐼</div>
        
        {/* Emotie indicator (klein emoji rechtsboven) */}
        {emotion !== 'neutral' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="absolute -top-2 -right-2 text-4xl"
          >
            {emotionEmojis[emotion]}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
