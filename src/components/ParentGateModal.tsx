import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useWebHaptics } from 'web-haptics/react';
import { initAudioContext, playSound } from '../lib/audio';

export interface ParentGateModalProps {
  isOpen: boolean;
  mode: 'gate' | 'confirm';
  title?: string;
  message?: string;
  confirmButtonText?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const ParentGateModal: React.FC<ParentGateModalProps> = ({
  isOpen,
  mode,
  title,
  message,
  confirmButtonText = 'Bevestigen',
  onSuccess,
  onClose,
}) => {
  const { trigger } = useWebHaptics();

  // Math question for parent verification
  const [numA, setNumA] = useState(7);
  const [numB, setNumB] = useState(8);
  const [inputVal, setInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate new math problem when gate opens
  useEffect(() => {
    if (isOpen && mode === 'gate') {
      const a = Math.floor(Math.random() * 4) + 6; // 6, 7, 8, 9
      const b = Math.floor(Math.random() * 4) + 6; // 6, 7, 8, 9
      setNumA(a);
      setNumB(b);
      setInputVal('');
      setErrorMsg(null);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleGateSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    initAudioContext();

    const expected = numA * numB;
    const trimmed = inputVal.trim().toLowerCase();

    // Valid if math answer is correct OR backup master password "panda" is entered
    if (parseInt(trimmed, 10) === expected || trimmed === 'panda') {
      trigger('success');
      playSound('success');
      onSuccess();
      onClose();
    } else {
      trigger('error');
      playSound('fail');
      setErrorMsg('Oeps, dat is niet juist! Probeer het nog eens.');
      setInputVal('');
    }
  };

  const handleConfirmSubmit = () => {
    initAudioContext();
    trigger('success');
    playSound('success');
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    initAudioContext();
    trigger('nudge');
    playSound('pop');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white rounded-[2rem] border-4 border-dark shadow-[8px_8px_0px_theme(colors.dark)] p-5 sm:p-7 max-w-md w-full relative"
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Sluiten"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center border-2 border-dark cursor-pointer transition-transform active:scale-95"
          >
            <X size={20} />
          </button>

          {mode === 'gate' ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border-3 border-dark flex items-center justify-center text-amber-700 shadow-inner">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h3 className="title-font text-xl font-black text-amber-950 leading-tight">
                    {title || 'Ouder Toegangscontrole'}
                  </h3>
                  <p className="text-xs font-bold text-gray-600">
                    Alleen voor ouders of begeleiders
                  </p>
                </div>
              </div>

              <p className="text-sm font-bold text-amber-900 mb-4 leading-relaxed">
                Los deze som op om te bevestigen dat je een volwassene bent:
              </p>

              <form onSubmit={handleGateSubmit} className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-2xl border-3 border-dark flex items-center justify-center gap-3 shadow-inner">
                  <span className="title-font text-2xl font-black text-dark">
                    {numA} × {numB} =
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={inputVal}
                    onChange={(e) => {
                      setInputVal(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="?"
                    className="w-24 px-3 py-2 text-center text-2xl font-black rounded-xl border-3 border-dark bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs font-black text-red-600 text-center animate-shake">
                    {errorMsg}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-[#388E3C] hover:bg-[#2e7d32] text-white font-black text-sm sm:text-base rounded-full border-3 border-dark shadow-[3px_3px_0px_theme(colors.dark)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
                  >
                    <CheckCircle2 size={18} />
                    <span>Verifiëren</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm sm:text-base rounded-full border-3 border-dark shadow-[3px_3px_0px_theme(colors.dark)] cursor-pointer active:scale-95 transition-transform"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 border-3 border-dark flex items-center justify-center text-red-600 shadow-inner">
                  <AlertTriangle size={26} />
                </div>
                <div>
                  <h3 className="title-font text-xl font-black text-red-950 leading-tight">
                    {title || 'Weet je het zeker?'}
                  </h3>
                  <p className="text-xs font-bold text-gray-600">
                    Deze actie kan niet ongedaan worden gemaakt
                  </p>
                </div>
              </div>

              <p className="text-sm font-bold text-gray-700 mb-6 leading-relaxed bg-amber-50/80 p-3.5 rounded-xl border-2 border-amber-200">
                {message || 'Weet je zeker dat je wilt doorgaan met deze actie?'}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="flex-1 py-3 px-4 bg-[#FF5A5F] hover:bg-[#e0484d] text-white font-black text-sm sm:text-base rounded-full border-3 border-dark shadow-[3px_3px_0px_theme(colors.dark)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
                >
                  <CheckCircle2 size={18} />
                  <span>{confirmButtonText}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="py-3 px-5 bg-white hover:bg-gray-100 text-gray-700 font-black text-sm sm:text-base rounded-full border-3 border-dark shadow-[3px_3px_0px_theme(colors.dark)] cursor-pointer active:scale-95 transition-transform"
                >
                  Annuleren
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
