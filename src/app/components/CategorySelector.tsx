import { motion } from 'motion/react';
import { MathCategory } from '../hooks/useMathGame';

interface CategorySelectorProps {
  currentCategory: MathCategory;
  onSelectCategory: (category: MathCategory) => void;
}

const categories = [
  { id: 'numbers' as MathCategory, label: 'Getallen', emoji: '🔢', color: 'bg-[#cfe8fc]' },
  { id: 'plus' as MathCategory, label: 'Optellen', emoji: '➕', color: 'bg-primary' },
  { id: 'minus' as MathCategory, label: 'Aftrekken', emoji: '➖', color: 'bg-[#e9d5ff]' },
  { id: 'multiply' as MathCategory, label: 'Keer', emoji: '✖️', color: 'bg-[#fed7aa]' },
];

export function CategorySelector({ currentCategory, onSelectCategory }: CategorySelectorProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 shadow-xl">
      <p className="text-center mb-3 text-sm text-muted-foreground">Kies een oefening</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const isSelected = currentCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => onSelectCategory(cat.id)}
              className={`
                ${cat.color} rounded-2xl p-4 flex flex-col items-center gap-2 transition-all
                ${isSelected ? 'ring-4 ring-foreground/30 shadow-lg' : 'opacity-70 hover:opacity-100'}
              `}
            >
              <span className="text-4xl">{cat.emoji}</span>
              <span className="text-sm font-medium">{cat.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
