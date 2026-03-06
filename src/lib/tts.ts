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

/**
 * Ensure the shared Audio element exists and is "unlocked" for playback.
 *
 * iOS Safari requires an actual `.play()` call within a user-gesture
 * handler to unlock an Audio element. We play a tiny silent MP3 to
 * achieve this without audible output.
 *
 * Call this from any user-gesture handler (click, tap) to warm it up.
 */
export function ensureAudioUnlocked(): void {
  if (typeof window === 'undefined') return;
  if (audioUnlocked) return;

  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.volume = 0.9;
  }

  // Tiny silent MP3 — enough to satisfy Safari's autoplay unlock requirement
  // eslint-disable-next-line max-len
  sharedAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYlmKPeAAAAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYlmKPeAAAAAAAAAAAAAAAAAAAA';
  sharedAudio.play().then(() => {
    sharedAudio!.pause();
    sharedAudio!.currentTime = 0;
    audioUnlocked = true;
  }).catch(() => {
    // Unlock failed — this can happen if called outside a gesture.
    // We'll retry on the next gesture.
  });
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
 * If TTS is not configured (no API key), fails silently.
 */
export async function speak(text: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[TTS] No ElevenLabs API key found. Set PUBLIC_ELEVENLABS_API_KEY in your .env file.');
    return;
  }

  // Stop any currently playing audio
  stopSpeaking();

  // Ensure the shared element exists
  ensureAudioUnlocked();
  if (!sharedAudio) return;

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
        return;
      }

      const blob = await response.blob();
      audioUrl = URL.createObjectURL(blob);
      audioCache.set(text, audioUrl);
    }

    // Swap the src on the shared (already-unlocked) element and play
    sharedAudio.src = audioUrl;
    sharedAudio.currentTime = 0;

    await sharedAudio.play();
  } catch (err) {
    console.error('[TTS] Failed to speak:', err);
  }
}

/** Stop any currently playing TTS audio. */
export function stopSpeaking(): void {
  if (sharedAudio) {
    sharedAudio.pause();
    sharedAudio.currentTime = 0;
  }
}

/** Check whether TTS is configured (has an API key). */
export function isTtsConfigured(): boolean {
  return !!getApiKey();
}
