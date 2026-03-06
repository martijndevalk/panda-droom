import React from 'react';
import { DeleteIcon } from 'lucide-animated';
import { motion } from 'motion/react';
import { useWebHaptics } from 'web-haptics/react';

interface NumpadProps {
  onType: (num: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const colors = [
  'bg-red-400 hover:bg-red-500',
  'bg-orange-400 hover:bg-orange-500',
  'bg-yellow-400 hover:bg-yellow-500',
  'bg-green-400 hover:bg-green-500',
  'bg-teal-400 hover:bg-teal-500',
  'bg-blue-400 hover:bg-blue-500',
  'bg-indigo-400 hover:bg-indigo-500',
  'bg-purple-400 hover:bg-purple-500',
  'bg-pink-400 hover:bg-pink-500',
  'bg-rose-400 hover:bg-rose-500',
  'bg-gray-400 hover:bg-gray-500',
  'bg-sky-500 hover:bg-sky-600'
];

export const Numpad: React.FC<NumpadProps> = ({ onType, onClear, onSubmit, disabled }) => {
  const { trigger } = useWebHaptics();

  const keys = [
    { label: '1', val: '1', color: colors[0] },
    { label: '2', val: '2', color: colors[1] },
    { label: '3', val: '3', color: colors[2] },
    { label: '4', val: '4', color: colors[3] },
    { label: '5', val: '5', color: colors[4] },
    { label: '6', val: '6', color: colors[5] },
    { label: '7', val: '7', color: colors[6] },
    { label: '8', val: '8', color: colors[7] },
    { label: '9', val: '9', color: colors[8] },
    { label: 'C', val: 'C', color: colors[10], isAction: true },
    { label: '0', val: '0', color: colors[9] },
    { label: 'OK', val: 'OK', color: colors[11], isAction: true }
  ];

  const handleClick = (val: string) => {
    if (disabled) return;
    trigger('nudge');
    if (val === 'C') onClear();
    else if (val === 'OK') onSubmit();
    else onType(val);
  };

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-4 w-full max-w-sm mx-auto p-1.5 sm:p-4 bg-white/50 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-xl">
      {keys.map((k, i) => (
        <motion.button
          key={k.val}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 250,
            damping: 22,
            delay: i * 0.02,
          }}
          whileTap={{ scale: 0.92 }}
          onClick={() => handleClick(k.val)}
          disabled={disabled}
          className={`${k.color} text-white font-bold text-3xl sm:text-4xl p-3 sm:p-6 rounded-2xl shadow-md transform transition-all disabled:opacity-50 flex items-center justify-center`}
        >
          {k.val === 'C' ? <DeleteIcon size={28} className="sm:w-8 sm:h-8" /> : k.label}
        </motion.button>
      ))}
    </div>
  );
};
