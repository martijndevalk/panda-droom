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

/** Currently playing audio element (so we can stop it if needed). */
let currentAudio: HTMLAudioElement | null = null;

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

    const audio = new Audio(audioUrl);
    audio.volume = 0.9;
    currentAudio = audio;

    await audio.play();
  } catch (err) {
    console.error('[TTS] Failed to speak:', err);
  }
}

/** Stop any currently playing TTS audio. */
export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

/** Check whether TTS is configured (has an API key). */
export function isTtsConfigured(): boolean {
  return !!getApiKey();
}
