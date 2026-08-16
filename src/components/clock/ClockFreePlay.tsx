import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Volume2, Sun, Moon, Plus, Minus, Sparkles } from 'lucide-react';
import { playSound, initAudioContext } from '../../lib/audio';
import { speak, ensureAudioUnlocked } from '../../lib/tts';
import { PandaAvatar } from '../PandaAvatar';
import { ClockFace } from './ClockFace';
import { getDutchTimeText, getDutchTimeSpoken, formatDigitalTime } from '../../lib/clockData';

interface ClockFreePlayProps {
  onBack: () => void;
}

export const ClockFreePlay: React.FC<ClockFreePlayProps> = ({ onBack }) => {
  const [hour, setHour] = useState(3);
  const [minute, setMinute] = useState(30);
  const [is24Hour, setIs24Hour] = useState(false);

  const display24H = is24Hour ? (hour % 12) + 12 : hour;
  const isNight = display24H >= 20 || display24H < 6;
  const dutchTime = getDutchTimeText(hour, minute);
  const spokenTime = getDutchTimeSpoken(hour, minute);
  const digitalTime = formatDigitalTime(display24H, minute);

  const handleSpeak = () => {
    initAudioContext();
    ensureAudioUnlocked();
    const period = display24H >= 18 ? "'s avonds" : display24H >= 12 ? "'s middags" : "'s ochtends";
    let funComment = '';
    if (display24H >= 6 && display24H < 9) {
      funComment = ' Tijd voor een lekker ontbijtje met verse bamboe!';
    } else if (display24H >= 12 && display24H < 14) {
      funComment = ' Tijd voor een lekker broodje en een dansje!';
    } else if (display24H >= 15 && display24H < 17) {
      funComment = ' Tijd voor een koekje of buitenspelen!';
    } else if (display24H >= 18 && display24H < 20) {
      funComment = ' Tijd voor het avondeten!';
    } else if (display24H >= 20 || display24H < 6) {
      funComment = ' Ssst... Panda ligt al lekker te snurken!';
    }
    speak(`Het is nu ${spokenTime} ${period}!${funComment}`);
  };

  const adjustMinute = (delta: number) => {
    initAudioContext();
    playSound('pop');
    let nextM = minute + delta;
    let nextH = hour;
    if (nextM >= 60) {
      nextM -= 60;
      nextH = nextH === 12 ? 1 : nextH + 1;
    } else if (nextM < 0) {
      nextM += 60;
      nextH = nextH === 1 ? 12 : nextH - 1;
    }
    setMinute(nextM);
    setHour(nextH);
  };

  const adjustHour = (delta: number) => {
    initAudioContext();
    playSound('pop');
    let nextH = hour + delta;
    if (nextH > 12) nextH = 1;
    if (nextH < 1) nextH = 12;
    setHour(nextH);
  };

  return (
    <div
      className={`w-full flex-1 min-h-0 flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-y-auto transition-colors duration-500 ${
        isNight
          ? 'bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 text-white'
          : 'bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50 text-dark'
      }`}
    >
      {/* ── HEADER ── */}
      <div className="w-full max-w-lg flex items-center justify-between z-20">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            initAudioContext();
            playSound('pop');
            onBack();
          }}
          className={`w-12 h-12 rounded-full border-4 border-dark shadow-[3px_3px_0px_theme(colors.dark)] flex items-center justify-center cursor-pointer transition-transform ${
            isNight ? 'bg-slate-800 text-white' : 'bg-white text-dark'
          }`}
          aria-label="Terug naar de kaart"
        >
          <ArrowLeft size={22} />
        </motion.button>

        <h1 className="title-font text-2xl sm:text-3xl font-black drop-shadow-sm flex items-center gap-2">
          <span>⏰ Klokkenplein</span>
        </h1>

        {/* Day / Night toggle */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            initAudioContext();
            playSound('pop');
            setIs24Hour(!is24Hour);
          }}
          className={`w-12 h-12 rounded-full border-4 border-dark shadow-[3px_3px_0px_theme(colors.dark)] flex items-center justify-center cursor-pointer transition-transform ${
            isNight ? 'bg-indigo-600 text-yellow-300' : 'bg-amber-300 text-amber-900'
          }`}
          aria-label="Dag / Nacht wisselen"
        >
          {isNight ? <Moon size={22} /> : <Sun size={22} />}
        </motion.button>
      </div>

      {/* ── LIVE SPOKEN TIME BANNER ── */}
      <div className="w-full max-w-md flex flex-col items-center text-center my-2 z-10">
        <div className="flex items-center gap-3 mb-2">
          <PandaAvatar mood="idle" className="w-18 h-18 sm:w-22 sm:h-22 drop-shadow-lg" />
        </div>

        <div className="bg-white/95 text-dark rounded-3xl px-6 py-4 border-4 border-dark shadow-[4px_4px_0px_theme(colors.dark)] flex items-center justify-center gap-4 w-full">
          <div className="flex flex-col items-center">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
              {isNight ? '🌙 Nacht / Avond' : '☀️ Dag / Middag'}
            </span>
            <span className="title-font text-2xl sm:text-3xl font-black text-sky-800">
              {dutchTime}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSpeak}
            className="p-2.5 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-700 transition-colors cursor-pointer"
            aria-label="Spreek tijd uit"
          >
            <Volume2 size={24} />
          </button>
        </div>
      </div>

      {/* ── MAIN INTERACTIVE CLOCK ── */}
      <div className="flex-1 flex flex-col items-center justify-center my-2 max-w-md w-full">
        <div className="w-52 h-52 sm:w-64 sm:h-64 relative flex items-center justify-center">
          <ClockFace
            hours={hour}
            minutes={minute}
            interactive={true}
            onChange={(h, m) => {
              setHour(h);
              setMinute(m);
            }}
            showHelperZones={true}
          />
        </div>

        {/* Digital Clock Box */}
        <div className="mt-4 bg-slate-900 text-emerald-400 font-mono text-2xl sm:text-3xl px-7 py-2.5 rounded-full border-4 border-slate-700 shadow-inner flex items-center gap-2">
          <span>{digitalTime}</span>
        </div>

        {/* Adjust Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 z-10">
          <div className="flex items-center bg-white/95 text-dark rounded-full border-4 border-dark p-1.5 shadow-[3px_3px_0px_theme(colors.dark)] gap-2">
            <span className="text-xs sm:text-sm font-black text-gray-600 pl-3">Uur:</span>
            <button
              type="button"
              onClick={() => adjustHour(-1)}
              className="w-9 h-9 rounded-full bg-red-100 hover:bg-red-200 text-red-700 font-black flex items-center justify-center border-2 border-red-300 shadow-sm active:scale-95 transition-transform"
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              onClick={() => adjustHour(1)}
              className="w-9 h-9 rounded-full bg-red-100 hover:bg-red-200 text-red-700 font-black flex items-center justify-center border-2 border-red-300 shadow-sm active:scale-95 transition-transform"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex items-center bg-white/95 text-dark rounded-full border-4 border-dark p-1.5 shadow-[3px_3px_0px_theme(colors.dark)] gap-2">
            <span className="text-xs sm:text-sm font-black text-gray-600 pl-3">Min:</span>
            <button
              type="button"
              onClick={() => adjustMinute(-5)}
              className="w-9 h-9 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-700 font-black flex items-center justify-center border-2 border-sky-300 shadow-sm active:scale-95 transition-transform"
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              onClick={() => adjustMinute(5)}
              className="w-9 h-9 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-700 font-black flex items-center justify-center border-2 border-sky-300 shadow-sm active:scale-95 transition-transform"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Sparkle tip */}
      <div className="z-10 mb-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold bg-white/90 text-dark px-5 py-2 rounded-full border-2 border-gray-300 shadow-md">
          <Sparkles size={16} className="text-amber-500" />
          <span>Draai de wijzers en luister hoe laat het is!</span>
        </div>
      </div>
    </div>
  );
};
