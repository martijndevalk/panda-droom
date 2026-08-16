import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LockKeyholeOpen, Edit3, Save, RotateCcw, X, Check } from 'lucide-react';
import { useWebHaptics } from 'web-haptics/react';
import { initAudioContext, playSound } from '../lib/audio';
import { RewardItem } from '../lib/rewardsStorage';

import { ParentGateModal } from './ParentGateModal';

interface ParentRewardsSectionProps {
  title: string;
  description: string;
  unitPlural: string; // 'tafels' | 'werelden'
  allCompletedLabel: string; // 'Alle 10 tafels' | 'Alle werelden'
  playerName: string;
  rewards: RewardItem[];
  onSave: (newRewards: RewardItem[]) => void;
  onResetToDefaults: () => void;
  onResetProgress: () => void;
}

export const ParentRewardsSection: React.FC<ParentRewardsSectionProps> = ({
  title,
  description,
  unitPlural,
  allCompletedLabel,
  playerName,
  rewards,
  onSave,
  onResetToDefaults,
  onResetProgress,
}) => {
  const { trigger } = useWebHaptics();
  const [isEditing, setIsEditing] = useState(false);
  const [tempRewards, setTempRewards] = useState<RewardItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states for child gate & confirmations
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'gate' | 'confirm';
    title: string;
    message: string;
    confirmButtonText?: string;
    action?: 'edit' | 'reset-progress' | 'reset-defaults';
  }>({
    isOpen: false,
    mode: 'gate',
    title: '',
    message: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartEdit = () => {
    initAudioContext();
    trigger('nudge');
    setTempRewards(JSON.parse(JSON.stringify(rewards)));
    setIsEditing(true);
  };

  const handleSave = () => {
    initAudioContext();
    playSound('success');
    trigger('success');
    onSave(tempRewards);
    setIsEditing(false);
    showToast('Beloningen succesvol opgeslagen! 🎉');
  };

  const handleCancel = () => {
    initAudioContext();
    trigger('nudge');
    setIsEditing(false);
  };

  const handleResetDefaultsClick = () => {
    initAudioContext();
    trigger('nudge');
    setModalState({
      isOpen: true,
      mode: 'confirm',
      title: 'Standaardbeloningen herstellen?',
      message: `Weet je zeker dat je de beloningen voor ${title} wilt herstellen naar de originele teksten?`,
      confirmButtonText: 'Herstel Standaarden',
      action: 'reset-defaults',
    });
  };

  const handleResetProgressClick = () => {
    initAudioContext();
    trigger('nudge');
    setModalState({
      isOpen: true,
      mode: 'gate',
      title: 'Voortgang Resetten',
      message: `Los de som op om te bevestigen dat je de voortgang van ${playerName || 'het kind'} wilt wissen:`,
      action: 'reset-progress',
    });
  };

  const handleModalSuccess = () => {
    if (modalState.action === 'reset-defaults') {
      onResetToDefaults();
      setIsEditing(false);
      showToast('Standaardbeloningen hersteld! 🔄');
    } else if (modalState.action === 'reset-progress') {
      onResetProgress();
    }
  };

  const isHighestReward = (count: number) => {
    const maxCount = Math.max(...rewards.map((r) => r.count));
    return count >= maxCount;
  };

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-[1.75rem] sm:rounded-[2.25rem] shadow-[6px_6px_0px_theme(colors.dark)] border-4 border-dark w-full mb-4 sm:mb-8 relative">
      {/* Toast popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-black px-6 py-3 rounded-full border-3 border-dark shadow-[4px_4px_0px_theme(colors.dark)] text-sm sm:text-base flex items-center gap-2"
          >
            <Check size={20} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 sm:mb-5 gap-3 sm:gap-4">
        <h2 className="title-font text-lg sm:text-xl md:text-2xl font-black text-amber-900 flex items-center gap-2">
          <LockKeyholeOpen className="w-5 h-5 sm:w-6 sm:h-7 text-amber-700 shrink-0" />
          <span>{title}</span>
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          {!isEditing && (
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleStartEdit}
              className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-black py-2.5 px-4 sm:px-5 rounded-full border-3 sm:border-4 border-dark shadow-[3px_3px_0px_theme(colors.dark)] text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Edit3 size={16} />
              <span>Beloningen aanpassen</span>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={handleResetProgressClick}
            className="bg-[#FF5A5F] hover:bg-[#e0484d] text-white font-black py-2.5 px-4 sm:px-5 rounded-full border-3 sm:border-4 border-dark shadow-[3px_3px_0px_theme(colors.dark)] text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw size={16} />
            <span>Reset Voortgang</span>
          </motion.button>
        </div>
      </div>

      {/* Read view vs Edit view */}
      {!isEditing ? (
        <>
          <p className="text-sm sm:text-base text-amber-800 mb-5 font-bold leading-relaxed">
            {description}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {rewards.map((reward) => (
              <div
                key={reward.count}
                className="bg-amber-50 border-3 sm:border-4 border-dark rounded-[1.5rem] p-4 sm:p-5 flex flex-col justify-start gap-2.5 shadow-[3px_3px_0px_theme(colors.dark)] hover:scale-[1.01] transition-transform"
              >
                <span className="bg-amber-300 text-amber-950 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full border-3 border-dark shadow-[2px_2px_0px_theme(colors.dark)] w-fit">
                  {isHighestReward(reward.count) ? allCompletedLabel : `${reward.count} ${unitPlural}`}
                </span>
                <p className="text-sm sm:text-base font-extrabold text-amber-950 leading-snug break-words">
                  {reward.label}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-amber-50/80 p-4 sm:p-6 rounded-[2rem] border-4 border-dark shadow-[4px_4px_0px_theme(colors.dark)]">
          <p className="title-font text-base sm:text-lg font-black text-amber-950 mb-4 flex items-center gap-2">
            <span>✏️</span> Typ hieronder je eigen beloningen voor elk aantal behaalde {unitPlural}:
          </p>
          <div className="space-y-3 sm:space-y-3.5 mb-5">
            {tempRewards.map((reward, idx) => (
              <div
                key={reward.count}
                className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 bg-white p-3 sm:p-4 rounded-[1.5rem] border-3 sm:border-4 border-dark shadow-[3px_3px_0px_theme(colors.dark)]"
              >
                <span className="bg-amber-300 text-amber-950 text-xs sm:text-sm font-black px-4 py-2 rounded-full border-3 border-dark shadow-[2px_2px_0px_theme(colors.dark)] shrink-0 text-center w-fit">
                  {isHighestReward(reward.count) ? allCompletedLabel : `${reward.count} ${unitPlural}`}
                </span>
                <input
                  type="text"
                  value={reward.label}
                  onChange={(e) => {
                    const updated = [...tempRewards];
                    updated[idx] = { ...updated[idx], label: e.target.value };
                    setTempRewards(updated);
                  }}
                  placeholder="Bijv. 15 min extra schermtijd, pannenkoeken eten..."
                  className="flex-1 w-full min-w-0 px-4 py-2.5 rounded-full sm:rounded-[1.25rem] border-3 sm:border-4 border-dark font-bold text-sm sm:text-base text-dark bg-amber-50/30 focus:bg-white focus:outline-none shadow-[2px_2px_0px_theme(colors.dark)] transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t-3 border-dark/20">
            <div className="flex items-center gap-2.5 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={handleSave}
                className="bg-[#388E3C] hover:bg-[#2e7d32] text-white font-black py-2.5 px-5 sm:py-2.5 sm:px-6 rounded-full border-3 sm:border-4 border-dark shadow-[3px_3px_0px_theme(colors.dark)] text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Save size={16} />
                <span>Opslaan</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={handleCancel}
                className="bg-white hover:bg-gray-100 text-gray-800 font-black py-2.5 px-5 sm:py-2.5 sm:px-6 rounded-full border-3 sm:border-4 border-dark shadow-[3px_3px_0px_theme(colors.dark)] text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <X size={16} />
                <span>Annuleren</span>
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={handleResetDefaultsClick}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-black py-2 px-4 rounded-full border-3 border-dark shadow-[2px_2px_0px_theme(colors.dark)] text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <RotateCcw size={15} />
              <span>Standaard herstellen</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Kinderslot & Bevestigingsmodal */}
      <ParentGateModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        title={modalState.title}
        message={modalState.message}
        confirmButtonText={modalState.confirmButtonText}
        onSuccess={handleModalSuccess}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
