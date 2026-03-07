# 🐼 Panda's Getallenreis

Een vriendelijke, stressvrije reken-app waarmee kinderen de tafels van vermenigvuldiging leren. Speciaal ontworpen voor kinderen met leerproblemen: geen timers, geen harde feedback, en een visueel hint-systeem dat stap voor stap helpt.

**[▶ Live demo](https://martijndevalk.github.io/panda-droom/)**

---

## ✨ Kenmerken

- **Stressvrij leren** — geen countdown-timers of negatieve scores. Kinderen leren op hun eigen tempo.
- **Interactieve Panda Avatar** — een levendige panda die reageert op antwoorden met animaties en uitdrukkingen (blije ogen, "denkende" animaties bij invoer, en "X"-oogjes bij een foutje).
- **Visuele hints (Concreet → Pictoraal → Abstract)** — bij een fout antwoord of via de hint-knop verschijnt visuele ondersteuning die helpt om de som te begrijpen.
- **Slimme tafelvolgorde** — start met de makkelijkste tafels (1, 10, 2, 5) en bouwt op naar moeilijkere (7, 8, 9).
- **Dagelijkse sessielimiet** — maximaal 2 levels per dag om overbelasting te voorkomen en de focus te behouden.
- **Intro-systeem** — elke nieuwe wereld krijgt een introductie die het concept van vermenigvuldigen uitlegt.
- **Text-to-Speech** — sommen worden voorgelezen via [ElevenLabs](https://elevenlabs.io/) (optioneel), wat helpt bij kinderen met leesproblemen.
- **Haptische Feedback** — voelbare trillingen op ondersteunde mobiele apparaten bij succes of fouten.
- **Geluidseffecten & BGM** — subtiele audio-feedback en achtergrondmuziek die in/uitgeschakeld kan worden.
- **Naadloze Navigatie** — gebruik van Astro View Transitions voor vloeiende overgangen tussen schermen.
- **PWA-ondersteuning** — installeerbaar op telefoon en tablet, werkt offline via een Service Worker.
- **Confetti & Beloningen** — visuele beloningen en een beloningssysteem met "milestones".

---

## 🛠 Tech stack

| Tool | Doel |
|---|---|
| [Astro](https://astro.build/) 5 | Framework, Routing & View Transitions |
| [React](https://react.dev/) 18 | UI-componenten & State management |
| [Tailwind CSS](https://tailwindcss.com/) 3 | Utility-first styling |
| [DaisyUI](https://daisyui.com/) 5 | Componenten & Thema's |
| [Motion](https://motion.dev/) | Animaties (Framer Motion) |
| [Howler.js](https://howlerjs.com/) | Audio playback & BGM |
| [Web Haptics](https://github.com/vlad-stoenescu/web-haptics) | Haptische feedback |
| [Lucide React](https://lucide.dev/) | Iconen |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Confetti-effecten |
| [ElevenLabs API](https://elevenlabs.io/) | Text-to-Speech (optioneel) |
| TypeScript | Type-veiligheid |

---

## 🚀 Aan de slag

### Vereisten

- [Node.js](https://nodejs.org/) 20+
- npm

### Installatie

```bash
npm install
```

### Development server

```bash
npm run dev
```

De app draait standaard op `http://localhost:4321/panda-droom/`.

### Productie-build

```bash
npm run build
```

De statische bestanden verschijnen in de `dist/` map.

### Preview (productie lokaal testen)

```bash
npm run preview
```

---

## 🔑 Omgevingsvariabelen

Kopieer `.env.example` naar `.env` en vul je keys in:

```bash
cp .env.example .env
```

| Variabele | Verplicht | Omschrijving |
|---|---|---|
| `PUBLIC_ELEVENLABS_API_KEY` | Nee | API-key voor ElevenLabs TTS. Zonder key werkt de app gewoon, maar worden sommen niet voorgelezen. Verkrijgbaar via [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys). |

---

## 📁 Projectstructuur

```
panda-droom/
├── public/                  # Statische assets (favicon, PWA manifest, service worker)
├── src/
│   ├── components/          # React-componenten
│   │   ├── App.tsx          # Hoofd-app met routing en state management
│   │   ├── PandaAvatar.tsx  # Geanimeerde panda SVG
│   │   ├── Map.tsx          # Wereldkaart met tafels
│   │   ├── Level.tsx        # De kernspel-loop (sommen beantwoorden)
│   │   ├── VisualHint.tsx   # Visuele hints (CPA methode)
│   │   └── ...
│   ├── layouts/
│   │   └── Layout.astro     # HTML-layout met meta tags en PWA-registratie
│   ├── lib/
│   │   ├── GameData.ts      # Wereld- en somdefinities
│   │   ├── audio.ts         # Geluidseffecten & BGM management
│   │   └── tts.ts           # ElevenLabs Text-to-Speech integratie
│   ├── pages/
│   │   └── index.astro      # Entrypoint (Astro page)
│   └── styles/              # CSS (Tailwind, thema, fonts via Fontsource)
├── astro.config.mjs         # Astro configuratie
├── tailwind.config.mjs      # Tailwind & DaisyUI configuratie
└── package.json
```

---

## 🚢 Deployment

De app wordt automatisch gedeployed naar **GitHub Pages** bij elke push naar `main`. De workflow staat in `.github/workflows/deploy.yml`.

Handmatig deployen:

```bash
npm run build
# Upload de inhoud van dist/ naar je hosting
```

---

## 📄 Licentie

Zie [ATTRIBUTIONS.md](./ATTRIBUTIONS.md) voor gebruikte assets en licenties.
