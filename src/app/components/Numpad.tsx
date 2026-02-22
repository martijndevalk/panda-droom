import { motion } from 'motion/react';

interface NumpadProps {
  onNumberClick: (number: number) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const buttonVariants = {
  tap: {},
  hover: {},
};

export function Numpad({ onNumberClick, onBackspace, onSubmit, disabled = false }: NumpadProps) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 md:p-6 shadow-xl">
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
        {numbers.slice(0, 9).map((num) => (
          <motion.button
            key={num}
            variants={buttonVariants}
            whileTap="tap"
            whileHover="hover"
            onClick={() => onNumberClick(num)}
            disabled={disabled}
            className="bg-primary rounded-full h-16 w-16 md:h-20 md:w-20 text-2xl md:text-3xl font-medium text-primary-foreground shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
          >
            {num}
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {/* Backspace knop */}
        <motion.button
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={onBackspace}
          disabled={disabled}
          className="bg-destructive rounded-full h-16 w-16 md:h-20 md:w-20 text-xl md:text-2xl shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
        >
          ⌫
        </motion.button>

        {/* Nul */}
        <motion.button
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onNumberClick(0)}
          disabled={disabled}
          className="bg-primary rounded-full h-16 w-16 md:h-20 md:w-20 text-2xl md:text-3xl font-medium text-primary-foreground shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
        >
          0
        </motion.button>

        {/* Submit/Enter knop */}
        <motion.button
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={onSubmit}
          disabled={disabled}
          className="bg-secondary rounded-full h-16 w-16 md:h-20 md:w-20 text-xl md:text-2xl shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
        >
          ✓
        </motion.button>
      </div>
    </div>
  );
}
