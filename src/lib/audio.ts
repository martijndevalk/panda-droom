import { Howl, Howler } from 'howler';

const sounds: Record<string, Howl> = {};
let bgmAudio: Howl | null = null;
let bgmStarted = false;

/** Whether the user wants BGM on or off (persisted in localStorage). */
let bgmEnabled: boolean = typeof window !== 'undefined'
  ? localStorage.getItem('panda-droom-bgm-enabled') !== 'false'
  : true;

/** Simple listener list so React can subscribe to bgmEnabled changes. */
type BGMChangeCallback = (enabled: boolean) => void;
const bgmChangeListeners: BGMChangeCallback[] = [];

/**
 * Multiple success sound variants — rotated on each correct answer
 * so the child hears a different celebration sound each time.
 */
const successSounds: Howl[] = [];
let successSoundIndex = 0;

function getAudioUrl(filename: string) {
  // @ts-ignore - Vite statically replaces import.meta.env
  const base = typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined' ? import.meta.env.BASE_URL : '/panda-droom/';
  return `${base.replace(/\/$/, '')}/${filename}`;
}

if (typeof window !== 'undefined') {
  // Success sound variants — rotated per correct answer
  successSounds.push(
    new Howl({
      src: [getAudioUrl('MA_Stockboom_Cartoon_Game_Bonus_Yeah_2_MP3.mp3')],
      preload: true,
    }),
    new Howl({
      src: [getAudioUrl('MA_Cartoon Voice Good mood-001.wav')],
      preload: true,
    }),
    new Howl({
      src: [getAudioUrl('MA_Cartoon Voice Good mood-002.wav')],
      preload: true,
    }),
  );

  // Keep the first variant accessible as `sounds.success` for backwards compat
  sounds.success = successSounds[0];

  sounds.cheer = new Howl({
    src: [getAudioUrl('MA_Originals_Cartoon_Crowd_small_group_cheering_yay_applause_MP3.mp3')],
    preload: true,
  });

  sounds.level_complete = new Howl({
    src: [getAudioUrl('MA_AppleHillStudios_HappyWoohooYeahCheer_3_MP3.mp3')],
    preload: true,
  });

  sounds.fail = new Howl({
    src: [getAudioUrl('MA_WOWSound_Cartoon_NG_Bad_02_MP3.mp3')],
    preload: true,
  });

  sounds.pop = new Howl({
    src: [getAudioUrl('Mouth_Pop_1.wav')],
    volume: 0.5,
    preload: true,
  });

  sounds.treasure_open = new Howl({
    src: [getAudioUrl('MA_Originals_SillyCartoonSounds_1_MP3.mp3')],
    preload: true,
  });

  bgmAudio = new Howl({
    src: [getAudioUrl('MA_AwesomeMusic_KidsAreChampionsOfFun.wav')],
    loop: true,
    volume: 0.15,
    preload: true,
  });
}

/**
 * Initialise / resume the shared AudioContext (handled internally by Howler).
 * Also kick off BGM on user gesture.
 */
export function initAudioContext(): void {
  if (typeof window === 'undefined') return;

  // Howler automatically resumes audio contexts globally on user interaction.
  if (Howler.ctx?.state === 'suspended') {
    Howler.ctx.resume().catch(() => {});
  }

  if (!bgmStarted) {
    playBGM();
  }
}

export function playBGM(): void {
  if (!bgmAudio || typeof window === 'undefined') return;
  if (!bgmEnabled) return;

  if (!bgmAudio.playing()) {
    bgmAudio.play();
    bgmStarted = true;
  }
}

export function stopBGM(): void {
  if (bgmAudio && bgmAudio.playing()) {
    bgmAudio.pause();
    bgmStarted = false;
  }
}

/** Toggle background music on/off. Persists to localStorage. */
export function toggleBGM(): boolean {
  bgmEnabled = !bgmEnabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('panda-droom-bgm-enabled', String(bgmEnabled));
  }
  if (bgmEnabled) {
    playBGM();
  } else {
    stopBGM();
  }
  bgmChangeListeners.forEach(cb => cb(bgmEnabled));
  return bgmEnabled;
}

/** Check if BGM is currently enabled. */
export function isBGMEnabled(): boolean {
  return bgmEnabled;
}

/** Subscribe to BGM enabled/disabled changes (for React re-render). */
export function onBGMChange(cb: BGMChangeCallback): void {
  bgmChangeListeners.push(cb);
}

/** Unsubscribe from BGM changes. */
export function offBGMChange(cb: BGMChangeCallback): void {
  const idx = bgmChangeListeners.indexOf(cb);
  if (idx >= 0) bgmChangeListeners.splice(idx, 1);
}

export type SoundEffectOptions = 'success' | 'fail' | 'pop' | 'cheer' | 'level_complete' | 'treasure_open';

/**
 * Play a short sound effect.
 *
 * For the 'success' type the three loaded variants are played in
 * round-robin order so the child hears a different sound each time.
 */
export const playSound = (type: SoundEffectOptions): void => {
  if (typeof window === 'undefined') return;

  if (type === 'success' && successSounds.length > 0) {
    const sound = successSounds[successSoundIndex % successSounds.length];
    sound.play();
    successSoundIndex++;
    return;
  }

  const sound = sounds[type];
  if (sound) {
    if (type === 'pop') {
      sound.stop(); // restart immediately for fast clicks
    }
    sound.play();
  }
};

if (typeof window !== 'undefined') {
  // Global click listener to automatically play a 'pop' sound on any button click
  // and resume AudioContext globally.
  window.addEventListener('click', (e) => {
    initAudioContext();

    // Check if the click originated from a button or anchor
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      playSound('pop');
    }
  }, { capture: true }); // Use capture phase so it runs before React handlers
}
