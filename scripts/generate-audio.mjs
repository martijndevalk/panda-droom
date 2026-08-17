#!/usr/bin/env node

/**
 * Panda Droom — ElevenLabs Audio Pre-generation Script
 *
 * Runs locally to batch-generate and cache all math and clock voice prompts
 * into static MP3 files in `public/audio/tts/[hash].mp3`.
 *
 * Benefits:
 * - 0 ElevenLabs API calls at runtime for children / teachers.
 * - Instant playback with 0ms latency.
 * - 100% offline support.
 * - API keys are never exposed in production builds.
 *
 * Usage:
 *   node --env-file=.env scripts/generate-audio.mjs
 *   or: npm run generate-audio
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// --- CONFIGURATION (Matches src/lib/tts.ts) ---
const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George (pre-made friendly voice)
const MODEL_ID = 'eleven_multilingual_v2';
const OUTPUT_DIR = join(process.cwd(), 'public', 'audio', 'tts');
const MANIFEST_PATH = join(OUTPUT_DIR, 'manifest.json');

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load existing manifest if present
let manifest = {};
if (existsSync(MANIFEST_PATH)) {
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    manifest = {};
  }
}

// Resolve API Key
const API_KEY =
  process.env.ELEVENLABS_API_KEY ||
  process.env.PUBLIC_ELEVENLABS_API_KEY ||
  process.env.VITE_ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error('\n❌ ERROR: Geen ElevenLabs API-sleutel gevonden!');
  console.error('Zorg dat ELEVENLABS_API_KEY of PUBLIC_ELEVENLABS_API_KEY in je .env bestand staat.\n');
  process.exit(1);
}

/**
 * Compute the SHA-256 hash matching src/lib/ttsCache.ts
 */
function computeHash(text, voiceId, modelId) {
  const cleanText = text.trim().replace(/\s+/g, ' ');
  return createHash('sha256')
    .update(`${voiceId}:${modelId}:${cleanText.toLowerCase()}`)
    .digest('hex');
}

/**
 * Sleep helper for rate-limiting
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- 1. COLLECT ALL PROMPTS & STRINGS ---

const textSet = new Set();

function addText(str) {
  if (!str) return;
  const clean = str.trim().replace(/\s+/g, ' ');
  if (clean.length > 0) {
    textSet.add(clean);
  }
}

console.log('🔍 Teksten verzamelen uit de Panda Droom werelden...');

// A. Getallenreis (Tafels 1 t/m 10)
for (let table = 1; table <= 10; table++) {
  // Intro's
  addText(`Tafel van ${table}! Tik op de groepjes om ze in het vak te zetten. Help Panda met tellen!`);

  for (let a = 1; a <= 10; a++) {
    const rawExpr = `${a} keer ${table}`;
    const total = a * table;

    // Intro completion
    addText(`Hieperdepiep! ${a} keer ${table} is ${total}! Panda springt een gat in de lucht!`);

    // Level question variations (from Level.tsx)
    addText(`Hoeveel is ${rawExpr}?`);
    addText(`Wat is ${rawExpr}?`);
    addText(`Reken maar uit: hoeveel is ${rawExpr}?`);
    addText(`Weet jij hoeveel ${rawExpr} is?`);
    addText(`Los maar op: ${rawExpr}!`);
    addText(`${a} groepjes van ${table} is samen...?`);

    // Visual hints
    addText(`Panda's rekentip! Kijk eens: hier zijn ${a} groepjes van ${table}. Tel alle groene bolletjes maar bij elkaar op!`);
  }
}

// B. Getallenreis Aanmoedigingen & Tips
const MATH_ENCOURAGEMENTS = [
  'Bijna! Probeer het nog een keertje, je kan het!',
  'Oepsie! Panda krabt achter zijn oren. Jij weet het vast wel!',
  'Geen paniek! Van foutjes maken word je juist superslim!',
  'Hé, die som probeerde je stiekem te foppen! Nog een keertje proberen!',
  'Bijna raak! Even diep ademhalen en probeer maar weer!',
  'Geen zorgen! Denk aan de sprongetjes van deze tafel!',
  'Supergoed dat je het probeert! Doe het nog eens rustig aan!',
  'Panda klapt in zijn pootjes! Je bent er bijna!',
  'Geen zorgen! Panda heeft een supergoede tip voor je. Tik maar op het lampje!',
];
MATH_ENCOURAGEMENTS.forEach(addText);

// C. Tijdreis (Klokkijken) Woorden en Tijden
const DUTCH_NUMBER_WORDS = {
  1: 'één', 2: 'twee', 3: 'drie', 4: 'vier', 5: 'vijf', 6: 'zes',
  7: 'zeven', 8: 'acht', 9: 'negen', 10: 'tien', 11: 'elf', 12: 'twaalf',
};

function getNextHour(h) {
  const norm = ((h - 1) % 12) + 1;
  return norm === 12 ? 1 : norm + 1;
}

function getDutchSpokenTime(hours, minutes) {
  const h = ((hours - 1) % 12) + 1;
  const nextH = getNextHour(h);
  const w = (num) => DUTCH_NUMBER_WORDS[num] || String(num);

  switch (minutes) {
    case 0: return `${w(h)} uur`;
    case 5: return `vijf over ${w(h)}`;
    case 10: return `tien over ${w(h)}`;
    case 15: return `kwart over ${w(h)}`;
    case 20: return `tien voor half ${w(nextH)}`;
    case 25: return `vijf voor half ${w(nextH)}`;
    case 30: return `half ${w(nextH)}`;
    case 35: return `vijf over half ${w(nextH)}`;
    case 40: return `tien over half ${w(nextH)}`;
    case 45: return `kwart voor ${w(nextH)}`;
    case 50: return `tien voor ${w(nextH)}`;
    case 55: return `vijf voor ${w(nextH)}`;
    default:
      if (minutes < 30) {
        return `${w(minutes)} over ${w(h)}`;
      } else {
        return `${w(60 - minutes)} voor ${w(nextH)}`;
      }
  }
}

// Generate all spoken clock prompts (Read, Set, Digital)
for (let h = 1; h <= 12; h++) {
  for (const m of [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]) {
    const spoken = getDutchSpokenTime(h, m);
    // Read mode
    addText(`Hoe laat is het op de klok? Het is ${spoken}.`);
    // Set mode
    addText(`Zet de klok op ${spoken}!`);
    // Digital mode
    addText(`Welke digitale tijd hoort bij ${spoken}?`);
    // Free play
    addText(`Het is nu ${spoken} 's ochtends!`);
    addText(`Het is nu ${spoken} 's middags!`);
    addText(`Het is nu ${spoken} 's avonds!`);
    addText(`Het is nu ${spoken} 's nachts!`);
  }
}

// D. Tijdreis Concept Intros & Hints
const CLOCK_INTROS = [
  'De Kloktoren! Kijk naar de grote en de kleine wijzer. De korte wijzer wijst naar het uur, en de lange wijzer naar de twaalf!',
  'Het Halve Uur Bos! Als de grote wijzer op de zes staat, is het een half uur!',
  'Het Kwartieren Eiland! De grote wijzer springt van kwart over naar kwart voor!',
  'De Tien Minuten Vallei! Tel met sprongen van vijf en tien minuten!',
  'De Klokkenmakerij! Nu kun je alle minuten op de klok precies instellen!',
  'De Digitale Ruimte! Ontdek hoe analoge klokken en digitale cijfers samenwerken!',
];
CLOCK_INTROS.forEach(addText);

const CLOCK_ENCOURAGEMENTS = [
  'Bijna! Kijk goed naar de wijzers en probeer het nog eens!',
  'Oepsie! De klok staat nog net niet helemaal goed. Probeer maar weer!',
  'Geen paniek! Van proberen word je een echte klokkenkampioen!',
  'Kijk goed waar de grote en de kleine wijzer naar wijzen!',
  'Bijna raak! Panda telt tik-tak, probeer het nog een keertje!',
  'Neem rustig je tijd, Panda wacht gezellig op jou!',
  'Handige tip: de rode wijzer wijst het uur, de blauwe wijzer de minuten!',
  'Supergoed dat je het probeert! Jij komt er wel!',
];
CLOCK_ENCOURAGEMENTS.forEach(addText);

// E. UI & Welkomstboodschappen
const GENERAL_PHRASES = [
  "Hoi! Welkom bij Panda's Getallenreis! Hoe heet jij? Typ je naam en we gaan samen op avontuur!",
  'Welkom op het Oefenplein! Hier kun je lekker vrij oefenen en groene blaadjes verzamelen voor Panda. Nom nom nom!',
  'Panda vindt het supergezellig om samen met jou te rekenen! Kies maar een leuke tafel uit!',
  'Welkom op het Klokkenplein! Draai maar lekker aan de wijzers en ontdek hoe laat het is!',
  'Nu is het avond en nacht! Kijk naar de sterretjes!',
  'Goedemorgen! De zon schijnt op het Klokkenplein!',
];
GENERAL_PHRASES.forEach(addText);

const allPhrases = Array.from(textSet);
console.log(`📋 Totaal aantal unieke spraakteksten: ${allPhrases.length}`);

// --- 2. GENERATE AUDIO FILES ---

async function run() {
  let hitCount = 0;
  let missCount = 0;
  let errorCount = 0;

  try {
    for (let i = 0; i < allPhrases.length; i++) {
      const text = allPhrases[i];
      const hash = computeHash(text, VOICE_ID, MODEL_ID);
      const filePath = join(OUTPUT_DIR, `${hash}.mp3`);

      // Check if already generated
      if (existsSync(filePath)) {
        manifest[hash] = text;
        hitCount++;
        continue;
      }

      // Call ElevenLabs API
      console.log(`[${i + 1}/${allPhrases.length}] 🎙️ Genereren: "${text.substring(0, 45)}..."`);

      try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': API_KEY,
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
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`  ⚠️ API Error (${response.status}): ${errorText}`);
          errorCount++;
          if (errorText.includes('quota_exceeded')) {
            console.log('\n🛑 Credit limiet bereikt! Reeds gegenereerde bestanden zijn veilig opgeslagen.');
            break;
          }
          if (response.status === 429) {
            console.log('  ⏳ Rate limit bereikt. Wacht 5 seconden...');
            await sleep(5000);
          }
          continue;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        writeFileSync(filePath, buffer);
        manifest[hash] = text;
        missCount++;

        // Small pause to be gentle on API rate limits
        await sleep(150);
      } catch (err) {
        console.error(`  ❌ Fout bij genereren van "${text}":`, err.message);
        errorCount++;
      }
    }
  } finally {
    // Always write manifest of available files
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  }

  console.log('\n========================================');
  console.log('🎉 Audio Status:');
  console.log(`✅ Aanwezig op schijf:     ${hitCount + missCount} MP3-bestanden`);
  console.log(`✨ Nieuw gegenereerd:       ${missCount}`);
  if (errorCount > 0) {
    console.log(`⚠️ Overgeslagen / fouten:   ${errorCount}`);
  }
  console.log(`📁 Opgeslagen in:           ${OUTPUT_DIR}`);
  console.log(`📜 Manifest opgeslagen:     ${MANIFEST_PATH}`);
  console.log('========================================\n');
}

run();
