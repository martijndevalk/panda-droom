import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useWebHaptics } from 'web-haptics/react';
import { CheckCircle2, Plus, Minus } from 'lucide-react';
import { playSound, initAudioContext } from '../../lib/audio';
import { speak, stopSpeaking, ensureAudioUnlocked } from '../../lib/tts';
import { PandaAvatar } from '../PandaAvatar';
import { ClockFace } from './ClockFace';
import { ClockVisualHint } from './ClockVisualHint';
import { CLOCK_WORLDS, CLOCK_BADGES, ClockProblem } from '../../lib/clockData';
import { getClockRewards } from '../../lib/rewardsStorage';
import { LevelHeader } from '../shared/LevelHeader';
import { LevelCompleteModal } from '../shared/LevelCompleteModal';
import { EncouragementBanner } from '../shared/EncouragementBanner';

interface ClockLevelProps {
  worldId: string;
  unlockedClockWorlds: string[];
  onBack: () => void;
  onComplete: (worldId: string, action: 'map' | 'next') => void;
}

const CLOCK_ENCOURAGEMENTS = [
  { text: 'Bijna! Probeer nog eens 💪', spoken: 'Bijna! Kijk goed naar de wijzers en probeer het nog eens!' },
  { text: 'De wijzers draaien nog even dol! ⏰', spoken: 'Oepsie! De klok staat nog net niet helemaal goed. Probeer maar weer!' },
  { text: 'Geen paniek, tijdreiziger! 🚀', spoken: 'Geen paniek! Van proberen word je een echte klokkenkampioen!' },
  { text: 'Kleine en grote wijzer helpen je! 🕰️', spoken: 'Kijk goed waar de grote en de kleine wijzer naar wijzen!' },
  { text: 'Even tik-takken en nog een keer! 🐼', spoken: 'Bijna raak! Panda telt tik-tak, probeer het nog een keertje!' },
  { text: 'Neem lekker je tijd! ⏳', spoken: 'Neem rustig je tijd, Panda wacht gezellig op jou!' },
  { text: 'Rood is uur, blauw is minuut! 🎨', spoken: 'Handige tip: de rode wijzer wijst het uur, de blauwe wijzer de minuten!' },
  { text: 'Panda klapt in zijn pootjes! 🐾', spoken: 'Supergoed dat je het probeert! Jij komt er wel!' },
];

export const ClockLevel: React.FC<ClockLevelProps> = ({
  worldId,
  unlockedClockWorlds,
  onBack,
  onComplete,
}) => {
  const world = CLOCK_WORLDS.find((w) => w.id === worldId) || CLOCK_WORLDS[0];
  const badge = CLOCK_BADGES.find((b) => b.worldId === worldId) || CLOCK_BADGES[0];
  const { trigger } = useWebHaptics();

  const [sequence, setSequence] = useState<ClockProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userHour, setUserHour] = useState(12);
  const [userMinute, setUserMinute] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'none' | 'success' | 'shake'>('none');
  const [pandaState, setPandaState] = useState<'idle' | 'happy' | 'thinking' | 'error'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [hasSpokenComplete, setHasSpokenComplete] = useState(false);
  const [encouragementText, setEncouragementText] = useState('Bijna! Probeer het nog eens 💪');

  const hasSpokenRef = useRef<Set<number>>(new Set());

  // Calculate milestone rewards
  const clockRewards = useMemo(() => getClockRewards(), []);
  const newUnlockedCount = unlockedClockWorlds.includes(worldId)
    ? unlockedClockWorlds.length
    : unlockedClockWorlds.length + 1;
  const justEarnedMilestone = clockRewards.find((m) => m.count === newUnlockedCount);

  // Initialize sequence
  useEffect(() => {
    const seq = world.generateSequence(world.requiredScore);
    setSequence(seq);
    setCurrentIndex(0);
    setIsLevelComplete(false);
    setHasSpokenComplete(false);
    hasSpokenRef.current = new Set();
  }, [world]);

  const currentProblem = sequence[currentIndex];

  // Set initial clock hands when problem changes
  useEffect(() => {
    if (currentProblem) {
      setUserHour(currentProblem.hours);
      setUserMinute(currentProblem.minutes);
      setSelectedOption(null);
      setFeedback('none');
      setPandaState('idle');
    }
  }, [currentProblem]);

  // Speak question
  const speakProblem = useCallback((problem: ClockProblem) => {
    initAudioContext();
    ensureAudioUnlocked();
    speak(problem.spokenText);
  }, []);

  useEffect(() => {
    if (currentProblem && !hasSpokenRef.current.has(currentIndex)) {
      hasSpokenRef.current.add(currentIndex);
      const timer = setTimeout(() => speakProblem(currentProblem), 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentProblem, speakProblem]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  // Completion speech
  useEffect(() => {
    if (isLevelComplete && !hasSpokenComplete) {
      setHasSpokenComplete(true);
      initAudioContext();
      ensureAudioUnlocked();
      let text = `Wauw, wat ontzettend knap van jou! Je hebt de ${badge.title} badge verdiend voor je schatkist! Jij bent een echte meester van de tijd!`;
      if (justEarnedMilestone) {
        text += ` En kijk eens: beloning verdiend! ${justEarnedMilestone.label}!`;
      }
      speak(text);
    }
  }, [isLevelComplete, hasSpokenComplete, badge.title, justEarnedMilestone]);

  // Handle choice submission
  const handleSelectOption = (option: string) => {
    if (feedback !== 'none') return;
    initAudioContext();
    ensureAudioUnlocked();
    setSelectedOption(option);

    const isCorrect = option === currentProblem.correctAnswer;
    if (isCorrect) {
      handleCorrect();
    } else {
      handleIncorrect();
    }
  };

  // Handle set clock submission
  const handleCheckSetClock = () => {
    if (feedback !== 'none') return;
    initAudioContext();
    ensureAudioUnlocked();

    const targetH = currentProblem.targetHours;
    const targetM = currentProblem.targetMinutes;
    const isMinuteCorrect = userMinute === targetM;
    const isHourCorrect = userHour === targetH;

    if (isMinuteCorrect && isHourCorrect) {
      handleCorrect();
    } else {
      handleIncorrect();
    }
  };

  const handleCorrect = () => {
    setFeedback('success');
    setPandaState('happy');
    trigger('success');
    playSound('success');

    confetti({
      particleCount: 70,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#4ade80', '#fbbf24', '#38bdf8', '#f472b6'],
    });

    setTimeout(() => {
      if (currentIndex + 1 >= sequence.length) {
        setIsLevelComplete(true);
        trigger('success');
        playSound('level_complete');
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 1200);
  };

  const handleIncorrect = () => {
    setFeedback('shake');
    setPandaState('error');
    trigger('error');
    playSound('fail');

    const randomEnc = CLOCK_ENCOURAGEMENTS[Math.floor(Math.random() * CLOCK_ENCOURAGEMENTS.length)];
    setEncouragementText(randomEnc.text);
    speak(randomEnc.spoken);

    setTimeout(() => {
      setFeedback('none');
      setPandaState('idle');
      setSelectedOption(null);
      setShowHint(true);
    }, 1200);
  };

  // Quick adjust buttons for set mode
  const adjustMinute = (delta: number) => {
    initAudioContext();
    playSound('pop');
    trigger('nudge');
    let nextM = userMinute + delta;
    let nextH = userHour;
    if (nextM >= 60) {
      nextM -= 60;
      nextH = nextH === 12 ? 1 : nextH + 1;
    } else if (nextM < 0) {
      nextM += 60;
      nextH = nextH === 1 ? 12 : nextH - 1;
    }
    setUserMinute(nextM);
    setUserHour(nextH);
  };

  const adjustHour = (delta: number) => {
    initAudioContext();
    playSound('pop');
    trigger('nudge');
    let nextH = userHour + delta;
    if (nextH > 12) nextH = 1;
    if (nextH < 1) nextH = 12;
    setUserHour(nextH);
  };

  if (!currentProblem && !isLevelComplete) {
    return <div className="flex-1 flex items-center justify-center font-bold">Laden...</div>;
  }

  const currentWorldIndex = CLOCK_WORLDS.findIndex((w) => w.id === worldId);
  const nextWorld = CLOCK_WORLDS[currentWorldIndex + 1] || null;

  // Level Complete Modal View
  if (isLevelComplete) {
    return (
      <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center p-4 relative overflow-y-auto bg-amber-100">
        <div className="sun sun--sm absolute top-4 right-6" />
        <div className="cloud cloud--lg absolute opacity-50" style={{ top: '6%', left: '5%' }} />
        <div className="cloud cloud--md absolute opacity-55" style={{ top: '15%', right: '20%' }} />

        <LevelCompleteModal
          title="Geweldig gedaan! 🎉"
          subtitle={`Je hebt ${world.name} behaald!`}
          theme="clock"
          badgeContent={
            <div className="w-full bg-gradient-to-br from-amber-50 to-orange-50 border-3 border-amber-300 rounded-2xl p-3.5 mb-2 flex items-center gap-3 shadow-md text-left">
              <div className="w-12 h-12 rounded-xl bg-white border-2 border-amber-300 flex items-center justify-center text-3xl shadow-inner shrink-0">
                {badge.emoji}
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">
                  ✨ Nieuwe Badge voor je Schatkist!
                </span>
                <h3 className="title-font text-base font-black text-amber-950 leading-tight">
                  {badge.title}
                </h3>
                <p className="text-xs font-bold text-amber-800 leading-tight mt-0.5">
                  {badge.subtitle}
                </p>
              </div>
            </div>
          }
          milestoneReward={justEarnedMilestone}
          onBackToMap={() => onComplete(worldId, 'map')}
          onNextLevel={nextWorld ? () => onComplete(worldId, 'next') : undefined}
          nextButtonText="Volgende Wereld! 🚀"
        />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-between bg-gradient-to-b from-sky-100 via-sky-200 to-emerald-50 p-4 sm:p-6 relative overflow-y-auto">
      {/* ── Shared Level Header ── */}
      <LevelHeader
        title={world.name}
        emoji={world.emoji}
        theme="clock"
        currentIndex={currentIndex}
        totalQuestions={sequence.length}
        showHint={showHint}
        onToggleHint={() => setShowHint((prev) => !prev)}
        onSpeak={() => speakProblem(currentProblem)}
        onBack={onBack}
      />

      {/* ── Question & Panda ── */}
      <div className="w-full max-w-md flex flex-col items-center text-center mt-1 z-10">
        <div className="mb-2 relative">
          <PandaAvatar mood={pandaState} className="w-18 h-18 sm:w-22 sm:h-22 drop-shadow-md" />
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max max-w-[220px] z-30">
            <EncouragementBanner
              show={feedback === 'shake'}
              message={encouragementText}
              theme="clock"
            />
          </div>
        </div>

        {/* Question balloon */}
        <motion.div
          animate={feedback === 'shake' ? { x: [-8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl px-6 py-3 border-4 border-dark shadow-[4px_4px_0px_theme(colors.dark)] flex items-center justify-center gap-3 relative max-w-full"
        >
          <span className="title-font text-lg sm:text-xl font-black text-dark">
            {currentProblem.questionText}
          </span>
        </motion.div>
      </div>

      {/* ── Main Interactive Clock Area ── */}
      <div className="flex-1 flex flex-col items-center justify-center my-3 max-w-md w-full">
        <div className="w-52 h-52 sm:w-64 sm:h-64 relative flex items-center justify-center">
          <ClockFace
            hours={currentProblem.type === 'set' ? userHour : currentProblem.hours}
            minutes={currentProblem.type === 'set' ? userMinute : currentProblem.minutes}
            interactive={currentProblem.type === 'set'}
            onChange={(h, m) => {
              setUserHour(h);
              setUserMinute(m);
            }}
            showHelperZones={true}
          />
        </div>

        {/* Quick adjustment controls for 'set' mode */}
        {currentProblem.type === 'set' && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 z-10">
            {/* Hour controls pill */}
            <div className="flex items-center bg-white/95 rounded-full border-4 border-dark p-1.5 shadow-[3px_3px_0px_theme(colors.dark)] gap-2">
              <span className="text-xs sm:text-sm font-black text-gray-600 pl-3">Uur:</span>
              <button
                type="button"
                onClick={() => adjustHour(-1)}
                className="w-9 h-9 rounded-full bg-red-100 hover:bg-red-200 text-red-700 font-black flex items-center justify-center border-2 border-red-300 shadow-sm active:scale-95 transition-transform cursor-pointer"
                aria-label="Uur min"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                onClick={() => adjustHour(1)}
                className="w-9 h-9 rounded-full bg-red-100 hover:bg-red-200 text-red-700 font-black flex items-center justify-center border-2 border-red-300 shadow-sm active:scale-95 transition-transform cursor-pointer"
                aria-label="Uur plus"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Minute controls pill */}
            <div className="flex items-center bg-white/95 rounded-full border-4 border-dark p-1.5 shadow-[3px_3px_0px_theme(colors.dark)] gap-2">
              <span className="text-xs sm:text-sm font-black text-gray-600 pl-3">Min:</span>
              <button
                type="button"
                onClick={() => adjustMinute(-5)}
                className="w-9 h-9 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-700 font-black flex items-center justify-center border-2 border-sky-300 shadow-sm active:scale-95 transition-transform cursor-pointer"
                aria-label="Minuten min"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                onClick={() => adjustMinute(5)}
                className="w-9 h-9 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-700 font-black flex items-center justify-center border-2 border-sky-300 shadow-sm active:scale-95 transition-transform cursor-pointer"
                aria-label="Minuten plus"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Answer choices / Submit ── */}
      <div className="w-full max-w-md z-10 mb-2">
        {currentProblem.type === 'set' ? (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={handleCheckSetClock}
            className="w-full py-3.5 bg-[#388E3C] hover:bg-[#2e7d32] text-white rounded-full border-4 border-dark shadow-[4px_4px_0px_theme(colors.dark)] text-lg font-black flex items-center justify-center gap-2 cursor-pointer transition-transform"
          >
            <CheckCircle2 size={24} />
            <span>Klaar!</span>
          </motion.button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {currentProblem.options?.map((opt, i) => {
              const isSelected = selectedOption === opt;
              const isSuccess = feedback === 'success' && opt === currentProblem.correctAnswer;
              return (
                <motion.button
                  key={i}
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-3 sm:p-3.5 rounded-2xl border-4 border-dark shadow-[4px_4px_0px_theme(colors.dark)] title-font text-base sm:text-lg font-black transition-all cursor-pointer ${
                    isSuccess
                      ? 'bg-emerald-400 text-white'
                      : isSelected
                        ? 'bg-amber-300 text-dark'
                        : 'bg-white hover:bg-amber-50 text-dark'
                  }`}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Visual Hint Modal ── */}
      <ClockVisualHint
        visible={showHint}
        hours={currentProblem.targetHours}
        minutes={currentProblem.targetMinutes}
        hintText={currentProblem.hintText}
        onClose={() => setShowHint(false)}
      />
    </div>
  );
};
