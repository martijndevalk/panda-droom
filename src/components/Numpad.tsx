import React from 'react';
import { Delete } from 'lucide-react';
import { motion } from 'motion/react';
import { useWebHaptics } from 'web-haptics/react';

interface NumpadProps {
  onType: (num: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const buttonStyles: { bg: string; border: string; text: string }[] = [
  { bg: '#FF5A5F', border: '#dc2626', text: '#fff' },       // 1 – rood
  { bg: '#FF9F1C', border: '#ea580c', text: '#fff' },       // 2 – oranje
  { bg: '#FFD803', border: '#e5c000', text: '#fff' },       // 3 – geel
  { bg: '#00B4D8', border: '#0092af', text: '#fff' },       // 4 – cyaan
  { bg: '#3A86FF', border: '#1d4ed8', text: '#fff' },       // 5 – blauw
  { bg: '#8338EC', border: '#7e22ce', text: '#fff' },       // 6 – paars
  { bg: '#FF006E', border: '#be185d', text: '#fff' },       // 7 – roze
  { bg: '#A7C957', border: '#8ba646', text: '#fff' },       // 8 – lime
  { bg: '#2EC4B6', border: '#0f766e', text: '#fff' },       // 9 – groen
  { bg: '#F72585', border: '#be123c', text: '#fff' },       // 0 – rose
  { bg: '#ffffff', border: '#d1d5db', text: '#FF5A5F' },    // C – wit
  { bg: '#2EC4B6', border: '#0f766e', text: '#fff' },       // OK – groen
];

export const Numpad: React.FC<NumpadProps> = ({ onType, onClear, onSubmit, disabled }) => {
  const { trigger } = useWebHaptics();

  const keys = [
    { label: '1', val: '1', style: buttonStyles[0] },
    { label: '2', val: '2', style: buttonStyles[1] },
    { label: '3', val: '3', style: buttonStyles[2] },
    { label: '4', val: '4', style: buttonStyles[3] },
    { label: '5', val: '5', style: buttonStyles[4] },
    { label: '6', val: '6', style: buttonStyles[5] },
    { label: '7', val: '7', style: buttonStyles[6] },
    { label: '8', val: '8', style: buttonStyles[7] },
    { label: '9', val: '9', style: buttonStyles[8] },
    { label: 'C', val: 'C', style: buttonStyles[10], isAction: true },
    { label: '0', val: '0', style: buttonStyles[9] },
    { label: 'OK', val: 'OK', style: buttonStyles[11], isAction: true }
  ];

  const handleClick = (val: string) => {
    if (disabled) return;
    trigger('nudge');
    if (val === 'C') onClear();
    else if (val === 'OK') onSubmit();
    else onType(val);
  };

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-[260px] sm:max-w-sm mx-auto p-4 sm:p-6 bg-white/50 backdrop-blur-md rounded-[2rem] sm:rounded-[2.5rem] shadow-xl">
      {keys.map((k, i) => (
        <motion.button
          key={k.val}
          initial={{ opacity: 0, scale: 0.8, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 14, // Wobbly effect
            mass: 0.8,
            delay: i * 0.03,
          }}
          whileHover={{ scale: 1.05, rotate: (i % 2 === 0 ? 2 : -2) }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleClick(k.val)}
          disabled={disabled}
          style={{
            backgroundColor: k.style.bg,
            color: k.style.text,
            borderBottomWidth: '4px',
            borderBottomColor: k.style.border,
            borderBottomStyle: 'solid',
          }}
          className="w-full h-auto aspect-square rounded-full text-3xl sm:text-4xl shadow-md transform transition-all disabled:opacity-50 flex flex-col items-center justify-center font-bubble font-bold"
        >
          {k.val === 'C' ? <Delete size={28} className="sm:w-8 sm:h-8" /> : k.label}
        </motion.button>
      ))}
    </div>
  );
};
