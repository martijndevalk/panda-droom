/**
 * ElevenLabs Text-to-Speech integration.
 *
 * Uses a friendly children's voice to read math problems aloud.
 * Audio responses are cached in-memory so repeated questions
 * don't make extra API calls.
 *
 * The API key is read from the `PUBLIC_ELEVENLABS_API_KEY`
 * environment variable (Astro/Vite convention for client-side
 * env vars that are safe to expose).
 */

/** Cache: question text → Object URL pointing to the audio blob. */
const audioCache = new Map<string, string>();

/**
 * Shared Audio element — reused across all TTS playback.
 *
 * Mobile browsers (iOS Safari, Android Chrome) require that `audio.play()`
 * is called on an element that was "unlocked" by a prior user gesture.
 * Creating `new Audio()` each time and calling `.play()` after an async
 * `fetch()` breaks the gesture chain and gets blocked silently.
 *
 * By reusing a single element that is unlocked on the first tap/click,
 * subsequent `.play()` calls succeed even after async work.
 */
let sharedAudio: HTMLAudioElement | null = null;

/** Whether the shared audio element has been unlocked via a user gesture. */
let audioUnlocked = false;

/** Promise that resolves once the audio element is unlocked. */
let unlockPromise: Promise<void> | null = null;

/**
 * Ensure the shared Audio element exists and is "unlocked" for playback.
 *
 * iOS Safari requires an actual `.play()` call within a user-gesture
 * handler to unlock an Audio element. We play a tiny silent MP3 to
 * achieve this without audible output.
 *
 * Call this from any user-gesture handler (click, tap) to warm it up.
 * Returns a Promise that resolves once the unlock is complete.
 */
export function ensureAudioUnlocked(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (audioUnlocked) return Promise.resolve();

  // If an unlock is already in progress, return the existing promise
  if (unlockPromise) return unlockPromise;

  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.volume = 0.9;
    // Hint to Android that we intend to play via user interaction
    sharedAudio.setAttribute('playsinline', '');
    sharedAudio.setAttribute('webkit-playsinline', '');
  }

  // Tiny silent MP3 — enough to satisfy Safari's/Android's autoplay unlock
  // eslint-disable-next-line max-len
  sharedAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYlmKPeAAAAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYlmKPeAAAAAAAAAAAAAAAAAAAA';

  unlockPromise = sharedAudio.play().then(() => {
    sharedAudio!.pause();
    sharedAudio!.currentTime = 0;
    audioUnlocked = true;
    unlockPromise = null;
  }).catch(() => {
    // Unlock failed — this can happen if called outside a gesture.
    // We'll retry on the next gesture.
    unlockPromise = null;
  });

  return unlockPromise ?? Promise.resolve();
}

/**
 * ElevenLabs voice for Dutch text-to-speech.
 *
 * "George" — pre-made voice available on all tiers (including free).
 * Works well with the eleven_multilingual_v2 model for Dutch.
 *
 * Other pre-made voices that work on the free tier:
 * - "JBFqnCBsd6RMkjVDRZzb" — George (pre-made, male)
 * - "21m00Tcm4TlvDq8ikWAM" — Rachel (pre-made, female)
 * - "pNInz6obpgDQGcFmaJgB" — Adam (pre-made, male)
 * - "9BWtsMINqrJLrRacOk9x" — Aria (pre-made, female)
 *
 * NOTE: Some voices (like "Laura Peeters" gC9jy9VUxaXAswovchvQ)
 * require Creator tier or above and will return 400 on free/starter.
 */
const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

const MODEL_ID = 'eleven_multilingual_v2';

function getApiKey(): string | null {
  // Vite/Astro exposes PUBLIC_ prefixed env vars on import.meta.env
  const key =
    (import.meta as any).env?.PUBLIC_ELEVENLABS_API_KEY ??
    (import.meta as any).env?.VITE_ELEVENLABS_API_KEY ??
    null;
  return key || null;
}

/**
 * Speak the given text using ElevenLabs TTS.
 * Returns a promise that resolves when playback starts
 * (not when it finishes).
 *
 * If TTS is not configured (no API key), falls back to native Web Speech.
 */
export async function speak(text: string): Promise<void> {
  if (typeof window === 'undefined') return;

  // Stop any currently playing audio
  stopSpeaking();

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[TTS] No ElevenLabs API key found. Falling back to native Web Speech API.');
    speakNative(text);
    return;
  }

  // Ensure the shared element exists and is unlocked (await on Android)
  await ensureAudioUnlocked();
  if (!sharedAudio) {
    speakNative(text);
    return;
  }

  try {
    let audioUrl = audioCache.get(text);

    if (!audioUrl) {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: MODEL_ID,
            voice_settings: {
              stability: 0.75,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[TTS] ElevenLabs API error: ${response.status} ${response.statusText}`, errorBody);
        console.warn('[TTS] Falling back to native Web Speech API.');
        speakNative(text);
        return;
      }

      const blob = await response.blob();
      audioUrl = URL.createObjectURL(blob);
      audioCache.set(text, audioUrl);
    }

    // Swap the src on the shared (already-unlocked) element and play.
    // Android Chrome requires an explicit load() after changing src,
    // otherwise play() may silently fail on a reused element.
    sharedAudio.src = audioUrl;
    sharedAudio.currentTime = 0;
    sharedAudio.load();

    await sharedAudio.play();
  } catch (err) {
    console.error('[TTS] Failed to speak with ElevenLabs, falling back to native TTS:', err);
    speakNative(text);
  }
}

/**
 * Pre-processes text for natural Dutch speech intonation and pronunciation.
 *
 * 1. Strips emojis that TTS engines might skip or read out weirdly.
 * 2. Replaces math & fraction symbols like "3/10" with "3 van de 10" and "×" with "keer".
 * 3. Expands common abbreviations.
 * 4. Ensures natural punctuation for proper pitch rising/falling and breathing pauses.
 */
function preprocessForDutchSpeech(text: string): string {
  let cleaned = text
    // Remove emoji icons that can cause stutter or odd spell-outs
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
    // Math fractions / counters like "3/10" -> "3 van de 10"
    .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 van de $2')
    // Multiplication signs
    .replace(/(\d+)\s*[×x*]\s*(\d+)/g, '$1 keer $2')
    // Equals signs
    .replace(/\s*=\s*\?/g, ' is hoeveel?')
    .replace(/\s*=\s*/g, ' is ')
    // Plus and Minus
    .replace(/\s*\+\s*/g, ' plus ')
    .replace(/\s*-\s*/g, ' min ')
    // Abbreviations
    .replace(/\bbijv\.\b/gi, 'bijvoorbeeld')
    .replace(/\bmin\.\b/gi, 'minuten')
    .replace(/\bu\.\b/gi, 'uur')
    // Ensure clean multiple spaces
    .replace(/\s+/g, ' ')
    .trim();

  // Ensure sentence ends with expressive punctuation for lively intonation
  if (cleaned && !/[.!?]$/.test(cleaned)) {
    cleaned += '!';
  }

  return cleaned;
}

/** Cached voices for Web Speech API fallback */
let cachedNlVoice: SpeechSynthesisVoice | null = null;
/** Retain reference to active utterance to prevent Chrome garbage-collection cutting off speech mid-sentence */
let activeUtterance: SpeechSynthesisUtterance | null = null;

function findDutchVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const nlVoices = voices.filter(v =>
    v.lang.startsWith('nl-') ||
    v.lang.startsWith('nl_') ||
    v.lang.toLowerCase() === 'nl' ||
    v.lang.includes('NL') ||
    v.lang.includes('BE')
  );
  if (nlVoices.length === 0) return null;

  // High-quality voice priority list (Neural, Natural, Premium, Modern OS voices)
  const priorityKeywords = [
    'natural',
    'online (natural)',
    'neural',
    'premium',
    'enhanced',
    'fenna',
    'maarten',
    'claire',
    'fiona',
    'xander',
    'google nederlands',
    'google',
    'colette',
    'ruben',
    'female',
    'vrouw',
  ];

  for (const keyword of priorityKeywords) {
    const match = nlVoices.find(v => v.name.toLowerCase().includes(keyword));
    if (match) return match;
  }

  return nlVoices[0];
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedNlVoice = findDutchVoice();
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cachedNlVoice = findDutchVoice();
  });
}

/** Fallback to the browser's native text-to-speech with optimized intonation for kids. */
function speakNative(rawText: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const processedText = preprocessForDutchSpeech(rawText);
  if (!processedText) return;

  // Cancel any ongoing speech to avoid overlap
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(processedText);
  utterance.lang = 'nl-NL';

  const voice = cachedNlVoice || findDutchVoice();
  if (voice) {
    utterance.voice = voice;
  }

  // Intonation tweaks:
  // - Pitch 1.08: slightly higher, friendlier and more youthful tone for children
  // - Rate 0.92: calm, articulate pacing without sounding sluggish
  utterance.pitch = 1.08;
  utterance.rate = 0.92;
  utterance.volume = 1.0;

  activeUtterance = utterance;

  utterance.onend = () => {
    if (activeUtterance === utterance) {
      activeUtterance = null;
    }
  };

  utterance.onerror = () => {
    if (activeUtterance === utterance) {
      activeUtterance = null;
    }
  };

  window.speechSynthesis.speak(utterance);
}

/** Stop any currently playing TTS audio. */
export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  activeUtterance = null;
  if (sharedAudio) {
    sharedAudio.pause();
    sharedAudio.currentTime = 0;
  }
}

/** Check whether TTS is configured (has an API key or native support). */
export function isTtsConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  return !!getApiKey() || 'speechSynthesis' in window;
}
