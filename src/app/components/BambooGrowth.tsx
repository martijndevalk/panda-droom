import { motion } from 'motion/react';

interface BambooGrowthProps {
  growth: number; // 0-5
  max?: number;
}

export function BambooGrowth({ growth, max = 5 }: BambooGrowthProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-muted-foreground">Bamboe groei</p>
      <div className="flex gap-2">
        {Array.from({ length: max }).map((_, index) => {
          const isGrown = index < growth;
          return (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: isGrown ? 1 : 0.8,
                opacity: isGrown ? 1 : 0.3,
              }}
              transition={{
                delay: isGrown ? index * 0.1 : 0,
                type: 'spring',
                stiffness: 200,
              }}
              className={`w-12 h-16 rounded-2xl flex items-center justify-center text-3xl ${
                isGrown ? 'bg-primary' : 'bg-muted'
              }`}
            >
              {isGrown ? '🎋' : '○'}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
