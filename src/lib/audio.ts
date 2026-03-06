/**
 * Lightweight sound effects using Web Audio API (no external dependencies).
 *
 * Android Chrome (and some other mobile browsers) create AudioContext in a
 * `suspended` state. The context can only be resumed inside a user-gesture
 * handler, so we must `await audioCtx.resume()` before scheduling any nodes.
 */

let audioCtx: AudioContext | null = null;

/**
 * Initialise / resume the shared AudioContext.
 *
 * Call this from any user-gesture handler (click, tap, touchstart) to
 * make sure subsequent `playSound` calls work immediately.
 */
export function initAudioContext(): void {
  if (typeof window === 'undefined') return;

  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      /* resume may fail when called outside a gesture — ignore */
    });
  }
}

/**
 * Schedule the oscillator nodes for a given sound type.
 * Must only be called when `audioCtx` is in `running` state.
 */
function scheduleSound(ctx: AudioContext, type: 'success' | 'fail' | 'pop'): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  const t = ctx.currentTime;

  if (type === 'success') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, t);
    oscillator.frequency.exponentialRampToValueAtTime(880, t + 0.1);

    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.5, t + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    oscillator.start(t);
    oscillator.stop(t + 0.3);
  } else if (type === 'fail') {
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(200, t);
    oscillator.frequency.exponentialRampToValueAtTime(100, t + 0.3);

    gainNode.gain.setValueAtTime(0.3, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    oscillator.start(t);
    oscillator.stop(t + 0.3);
  } else if (type === 'pop') {
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(600, t);
    gainNode.gain.setValueAtTime(0.1, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    oscillator.start(t);
    oscillator.stop(t + 0.05);
  }
}

/**
 * Play a short sound effect.
 *
 * The function creates / resumes the AudioContext (awaiting the resume
 * promise) so that sounds play reliably on Android and iOS.
 */
export const playSound = (type: 'success' | 'fail' | 'pop'): void => {
  if (typeof window === 'undefined') return;

  // Ensure context exists
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();
  }

  if (audioCtx.state === 'suspended') {
    // Await resume, then schedule the sound
    audioCtx.resume().then(() => {
      if (audioCtx) scheduleSound(audioCtx, type);
    }).catch(() => { /* ignore */ });
  } else {
    scheduleSound(audioCtx, type);
  }
};
