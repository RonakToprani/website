/* Shared mockup content — lifted from src/App.tsx so every mockup
   shows the same real material. Not shipped; disposable. */

const WORK = [
  {t:"Fixate", v:"Chrome Extension (MV3) · 2026", tags:["typescript","computer vision","local-first","product"], cat:["software","ai"],
   d:"A Chrome extension (MV3) that verifies focus sessions with on-device computer vision. Pairs webcam gaze estimation (eye-blendshapes + head pose, with hysteresis to avoid false flags) with site-blocking via declarativeNetRequest, and logs per-session focus metrics locally. No backend.",
   cards:[
     ["Trustworthy gaze detection","Combines eye-blendshapes with head pose, applies hysteresis so it never flickers, and skips frames it isn't sure about (no face / mid-blink) instead of falsely flagging them."],
     ["Specific attribution","The end report says what actually happened — “2 gaze drifts, left Chrome once, tried instagram.com twice” — and feeds a shareable focus card."],
     ["Friction to quit","Ending early takes a press-and-hold or a typed reason, so a moment of weakness isn't one click away."],
     ["Private by construction","No camera frames, blendshapes, or session data ever leave the machine. There is no server."]],
   list:[["Site blocking","via declarativeNetRequest for the session's duration"],
         ["Leaving-Chrome detection","through windows.onFocusChanged"],
         ["Runs in the background","hidden document, live dashboard in the toolbar popout"],
         ["Verified history","focus hours, clean streaks, and one pattern insight"]]},

  {t:"whoomp", v:"On-device health app · iOS", tags:["local-first","on-device","bluetooth le","react native"], cat:["software","hardware"],
   d:"A local-first iOS app (React Native / Expo) that reads live biometrics from a wearable over Bluetooth LE and computes HRV, recovery, and strain on-device. Decodes the raw framed sensor stream at the byte level and persists sessions locally with SQLite — no cloud or account.",
   cards:[
     ["Signal & systems work","Talks directly to the wearable's sensors over a custom Bluetooth LE service and decodes the raw, framed data stream at the byte level (CRC-32 checked)."],
     ["How the stress score works","Heart rate above your resting baseline while the accelerometer shows you're still — motion is excluded, so a workout registers as strain, not stress."]],
   list:[["Sleep staging","actigraphy fused with heart rate and HRV, smoothed by a transition model so stages don't flicker"],
         ["Stack","Expo (SDK 52+), react-native-ble-plx, expo-sqlite, EAS Build"]]},

  {t:"kōdō", v:"Personal Dashboard · Local SLMs", tags:["node","local SLM","ollama","sqlite"], cat:["software","ai"],
   d:"A local-first productivity dashboard that classifies task priority and estimates effort using two small language models running in parallel through Ollama. Adds natural-language date parsing, a calendar view, and SQLite-backed cross-device sync. Node/Express, no build step.",
   cards:[
     ["Two models, in parallel","Gemma (via Ollama) categorizes priority; a second model (qwen2.5:1.5b) estimates time in the background so the timeline fills in without ever blocking you."],
     ["Natural-language dates","Understands tmr, this weekend, end of month, in 2 weeks, 3/15 — and drops the task on the right day."]],
   list:[["Cross-device sync","same data on phone and laptop, all SQLite on the server"],
         ["Analytics","streak, completion rate, activity heatmap, priority donut"],
         ["Stack","Node + Express, better-sqlite3, Chart.js, Ollama, zero build step"]]},

  {t:"CryptoRadar", v:"Market & Compliance Terminal", tags:["next.js","react","fintech","data viz"], cat:["software","finance"],
   d:"A real-time dashboard (Next.js 16 / React 19 / Recharts) that aggregates crypto market data and Americas regulatory signals into a single view — live market stats, ETF flows, a compliance calendar, and CBDC / stablecoin trackers, fed by public APIs and RSS.",
   cards:[
     ["Market layer","Live global stats (CoinGecko), a BTC/ETH 90-day correlation panel, ETF demand flows, and a stablecoin monitor."],
     ["Regulatory layer","A country regulatory snapshot, compliance calendar, CBDC tracker, tokenization pipeline, and an RSS-driven live intelligence feed."]],
   list:[]},

  {t:"Mochi desk robot", v:"Embedded / Robotics · ESP32", tags:["esp32","embedded","local SLM","hardware"], cat:["hardware","ai"],
   d:"An ESP32-based desk companion that runs a small language model on-device behind an animated LVGL touchscreen face. Firmware written in C++ / PlatformIO, iterated across several hardware revisions.",
   cards:[], list:[["Stack","ESP32, PlatformIO / C++, touchscreen UI, local SLM"]]},

  {t:"XRP algo trading bot", v:"Crypto / Finance · In progress", tags:["python","finance","crypto","local SLM"], cat:["finance","ai"],
   d:"A Python trading bot for XRP that combines classical quantitative signals with a locally-hosted small language model for short-horizon predictive modeling. In development.",
   cards:[], list:[]},

  {t:"Dash Options chain Platform", v:"Finance / Derivatives", tags:["python","finance","data analysis","risk reversal"], cat:["finance"],
   d:"Built an analytics dashboard for analyzing historical options chain data, focusing on risk reversal strategies, volatility skew, and time-series visualization. Built to aid my own trading strategies.",
   cards:[], list:[["Calibration","Custom Black-Scholes & SABR engine with real-time parameter fitting"],
                   ["Greeks","Live Delta, Gamma, Theta, Vega with directional exposure heatmaps"],
                   ["Density","Risk-neutral extraction via the Breeden-Litzenberger method"],
                   ["Surface","Multi-timeframe volatility interpolation using cubic splines"]]},

  {t:"Galactic Mapping with Machine Learning", v:"James Webb Space Telescope", tags:["machine learning","astronomy","classification"], cat:["research","ai"],
   d:"Developed a novel machine learning classification model to discern galactic components in JWST images of NGC 623, with an 84% accuracy (across not a very large sample 🥲). Built to probabilistically identify features such as star clusters, dust lanes, and galactic cores across multi-band photometric data.",
   cards:[], list:[["Models","SVM, Random Forest, and KNN evaluated across classes C1–C5"],
                   ["Result","Average F1-score of 0.84 — strong on background and bulge, weaker on outer disk"]]},

  {t:"Bird Species Classification Algorithm", v:"Ontario Field Study", tags:["machine learning","bioacoustics","classification"], cat:["research","ai"],
   d:"Prototype CNN using mel-spectrogram inputs to support automated bird species ID in Ontario field recordings.",
   cards:[], list:[["Approach","mel-spectrogram preprocessing, time/frequency masking, noise injection"],
                   ["Model","a compact CNN optimized for edge deployment"]]},

  {t:"Multi-Module Spectral Analysis of PAH States", v:"NGC 2023 / Spitzer Space Telescope", tags:["astronomy","spectroscopy","signal processing"], cat:["research"],
   d:"Developed a diagnostic framework to map ionic and neutral Polycyclic Aromatic Hydrocarbons (PAHs) by cross-calibrating IRAC photometry with IRS spectroscopy.",
   cards:[], list:[["Neutral PAH mapping","isolated the 11.2µm emission band from SL1 and SH spectral cubes"],
                   ["Continuum subtraction","local spline interpolation at 8.6µm and 12.7µm"],
                   ["Data engineering","3D FITS cubes across 7.3µm – 14.0µm"]]},

  {t:"CubeSat Satellite Project", v:"Ukpik-1 CubeSat", tags:["satellite","radio","engineering"], cat:["hardware","research"],
   d:"Worked on the development of a radio station for the Ukpik-1 CubeSat satellite project @ Western University, specializing in assembly operations and implementing a comms center for real-time data transmission.",
   cards:[], list:[]},
];

const ASTRO = [
  {n:"M101 (Pinwheel Galaxy)", files:["m101.jpg","m101-2.jpg"], g:"Canon mirrorless",
   d:"A grand-design face-on spiral in Ursa Major, with sweeping blue arms and pink star-forming regions. Shown fully processed and as the raw stack."},
  {n:"M27 (Dumbbell Nebula)", files:["M27(1).JPG","M27(2).JPG"], g:"Seestar S50",
   d:"A planetary nebula in Vulpecula, 1360 light-years away. One of the brightest and earliest discovered. Personal favourite."},
  {n:"C27 (Crescent Nebula)", files:["C27(1).JPG","C27(2).JPG"], g:"Seestar S50",
   d:"An emission nebula in Cygnus, formed by stellar winds from a massive, incredibly hot star at its heart."},
  {n:"M13 (Great Hercules Cluster)", files:["m13.jpg","m13-2.jpg"], g:"Seestar S50",
   d:"A globular cluster in Hercules — hundreds of thousands of stars bound into a dense sphere. Two processing passes of the same night."},
  {n:"IC 5070 (Pelican Nebula)", files:["IC5070(1).JPG","IC5070(2).JPG"], g:"Seestar S50",
   d:"A bright emission nebula in Cygnus, known for its distinctive pelican shape. But tbh I don't see it 🤷‍♂️"},
  {n:"Andromeda Galaxy (M31)", files:["andromeda.jpeg"], g:"Canon mirrorless",
   d:"The closest major galaxy to the Milky Way, captured on a somewhat cloudy night in Toronto."},
];

const CATS = [["all","All"],["software","Software"],["finance","Finance"],["ai","AI / ML"],["research","Research"],["hardware","Hardware"]];
