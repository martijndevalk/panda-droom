import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { PandaAvatar } from './PandaAvatar';
import { speak, stopSpeaking, ensureAudioUnlocked } from '../lib/tts';
import { initAudioContext } from '../lib/audio';

interface StartScreenProps {
  onStart: (name: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [name, setName] = useState('');
  const hasSpokenRef = useRef(false);

  const handleSpeak = () => {
    initAudioContext();
    ensureAudioUnlocked();
    speak("Welkom bij Panda's Getallenreis! Hoe heet jij?");
  };

  useEffect(() => {
    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true;
      const timer = setTimeout(() => handleSpeak(), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-sky-200 h-full relative w-full overflow-y-auto overflow-x-hidden">
      {/* Floating panda */}
      <motion.div
        initial={{ y: -40, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1, mass: 0.8 }}
        className="mb-4 z-10"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PandaAvatar className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-md" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, mass: 0.8 }}
        className="text-center mb-6 sm:mb-10 z-10 bg-white p-6 sm:p-8 rounded-[2rem] shadow-[8px_8px_0px_theme(colors.dark)] max-w-sm w-full border-4 border-dark relative flex flex-col items-center"
      >
        <h1 className="title-font text-2xl sm:text-3xl font-black text-dark drop-shadow-sm mb-4">
          Welkom bij Panda's Getallenreis!
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-6 font-medium">
          Hoe heet jij?
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Je naam..."
            className="w-full text-xl sm:text-2xl p-3 sm:p-4 rounded-2xl border-4 border-dark focus:border-toy-green focus:outline-none focus:ring-0 text-center font-bold text-dark shadow-[4px_4px_0px_theme(colors.dark)] transition-colors"
            autoFocus
          />
          <motion.button
            whileHover={{ scale: 1.06, rotate: 2 }}
            whileTap={{ scale: 0.92, rotate: -1 }}
            type="submit"
            disabled={!name.trim()}
            className={`btn btn-lg w-full rounded-2xl text-lg sm:text-xl border-4 border-dark shadow-[4px_4px_0px_theme(colors.dark)] ${
              name.trim() ? 'btn-success text-white' : 'btn-disabled bg-gray-300'
            }`}
          >
            <Play size={24} className="text-white" />
            Starten
          </motion.button>
        </form>
      </motion.div>

      {/* ☀️ Sun */}
      <div className="sun sun--sm absolute top-4 right-6" />

      {/* ☁️ Decorative clouds */}
      <div className="cloud cloud--lg absolute opacity-50" style={{ top: '6%', left: '5%' }} />
      <div className="cloud cloud--md absolute opacity-55" style={{ top: '15%', right: '20%' }} />
      <div className="cloud cloud--sm absolute opacity-45" style={{ top: '10%', left: '40%' }} />
      <div className="cloud cloud--xl absolute opacity-35" style={{ top: '30%', left: '2%' }} />
      <div className="cloud cloud--md absolute opacity-50" style={{ top: '22%', right: '5%' }} />
      <div className="cloud cloud--sm absolute opacity-60" style={{ bottom: '20%', right: '10%' }} />
      <div className="cloud cloud--lg absolute opacity-40" style={{ bottom: '10%', left: '15%' }} />
      <div className="cloud cloud--md absolute opacity-45" style={{ bottom: '30%', left: '50%' }} />
    </div>
  );
};
