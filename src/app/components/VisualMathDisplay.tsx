import { motion } from 'motion/react';
import { MathQuestion } from '../hooks/useMathGame';

interface VisualMathDisplayProps {
  question: MathQuestion;
}

export function VisualMathDisplay({ question }: VisualMathDisplayProps) {
  const { category, operand1, operand2 } = question;

  // Voor getallen herkenning: toon gewoon de objecten
  if (category === 'numbers') {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <p className="text-center text-lg mb-4 text-muted-foreground">
          {question.displayText}
        </p>
        <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
          {Array.from({ length: Math.min(operand1, 20) }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: index * 0.05,
                type: 'spring',
                stiffness: 200,
              }}
              className="text-4xl"
            >
              🎋
            </motion.div>
          ))}
          {operand1 > 20 && (
            <div className="w-full text-center text-2xl text-muted-foreground">
              ... ({operand1} stuks)
            </div>
          )}
        </div>
      </div>
    );
  }

  // Voor optellen
  if (category === 'plus' && operand2 !== undefined) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-xl max-w-3xl">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          {/* Eerste groep */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-wrap gap-2 justify-center max-w-xs">
              {Array.from({ length: operand1 }).map((_, index) => (
                <motion.div
                  key={`a-${index}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: index * 0.08,
                    type: 'spring',
                    stiffness: 200,
                  }}
                  className="text-3xl"
                >
                  🎋
                </motion.div>
              ))}
            </div>
            <span className="text-4xl font-medium text-primary">{operand1}</span>
          </div>

          {/* Plus symbool */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="text-5xl text-foreground"
          >
            ➕
          </motion.div>

          {/* Tweede groep */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-wrap gap-2 justify-center max-w-xs">
              {Array.from({ length: operand2 }).map((_, index) => (
                <motion.div
                  key={`b-${index}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.4 + index * 0.08,
                    type: 'spring',
                    stiffness: 200,
                  }}
                  className="text-3xl"
                >
                  🎋
                </motion.div>
              ))}
            </div>
            <span className="text-4xl font-medium text-primary">{operand2}</span>
          </div>

          {/* Equals symbool */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
            className="text-5xl text-foreground"
          >
            =
          </motion.div>

          {/* Vraagteken */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1, type: 'spring', stiffness: 200 }}
            className="text-6xl"
          >
            ❓
          </motion.div>
        </div>
      </div>
    );
  }

  // Voor aftrekken
  if (category === 'minus' && operand2 !== undefined) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-xl max-w-3xl">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          {/* Eerste groep (met doorgestreepte items) */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-wrap gap-2 justify-center max-w-xs">
              {Array.from({ length: operand1 }).map((_, index) => {
                const isRemoved = index < operand2;
                return (
                  <motion.div
                    key={`a-${index}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: isRemoved ? 0.3 : 1,
                    }}
                    transition={{
                      delay: index * 0.08,
                      type: 'spring',
                      stiffness: 200,
                    }}
                    className={`text-3xl relative ${isRemoved ? 'line-through' : ''}`}
                  >
                    🎋
                    {isRemoved && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className="absolute inset-0 flex items-center justify-center text-2xl"
                      >
                        ✖️
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
            <span className="text-4xl font-medium text-primary">{operand1}</span>
          </div>

          {/* Min symbool */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="text-5xl text-foreground"
          >
            ➖
          </motion.div>

          {/* Aantal weg */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl font-medium text-destructive">{operand2}</span>
          </div>

          {/* Equals symbool */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
            className="text-5xl text-foreground"
          >
            =
          </motion.div>

          {/* Vraagteken */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1, type: 'spring', stiffness: 200 }}
            className="text-6xl"
          >
            ❓
          </motion.div>
        </div>
      </div>
    );
  }

  // Voor keer (vermenigvuldigen) - toon groepen
  if (category === 'multiply' && operand2 !== undefined) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-xl max-w-3xl">
        <p className="text-center text-lg mb-4 text-muted-foreground">
          {operand1} groepen van {operand2}
        </p>
        <div className="flex flex-col gap-4 items-center">
          {Array.from({ length: Math.min(operand1, 5) }).map((_, groupIndex) => (
            <motion.div
              key={groupIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: groupIndex * 0.2 }}
              className="flex gap-2 items-center"
            >
              <div className="flex gap-2">
                {Array.from({ length: operand2 }).map((_, itemIndex) => (
                  <motion.div
                    key={`${groupIndex}-${itemIndex}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: groupIndex * 0.2 + itemIndex * 0.05,
                      type: 'spring',
                      stiffness: 200,
                    }}
                    className="text-3xl"
                  >
                    🎋
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
          {operand1 > 5 && (
            <div className="text-xl text-muted-foreground">
              ... ({operand1} groepen in totaal)
            </div>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-4 text-3xl"
        >
          {operand1} × {operand2} = ❓
        </motion.div>
      </div>
    );
  }

  return null;
}
