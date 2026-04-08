# StitchX Radio — Race Intelligence Platform

## Project structure

```
StitchX_Radio/
├── index.html                ← open in browser (fully standalone)
├── static/
│   ├── css/main.css          ← all styles, variables, components
│   ├── js/main.js            ← all app logic, data, live updates
│   └── assets/
│       └── favicon.svg
├── backend/
│   ├── server.py             ← Flask API (NFC lookup, compliance, exports)
│   ├── scraper.py            ← social feed, equipment data, NFC registry
│   └── requirements.txt
├── data/                     ← auto-created: CSVs, JSON exports, scan logs
└── README.md
```

---

# What’s New in 2026: Investor & Demo Edition

StitchX Radio is now fully investor/demo-ready with the following enhancements:

- **Modern UI/UX:** Tab navigation, mobile-first responsive design, tooltips, and polished branding
- **Demo Guide Tab:** Step-by-step walkthrough for demos and investors
- **Investor Pitch Modal:** One-click elevator pitch for presentations
- **Live Social Feed:** Real-time posts with AI-powered sentiment analysis (via Hugging Face)
- **Secure AI Integration:** All API keys handled server-side (never exposed)
- **Feedback Button:** Direct link to Google Forms for feedback and bug reports
- **Comprehensive Documentation:**
    - [API Reference](docs/API.md)
    - [User Guide](docs/USER_GUIDE.md)
    - [Developer Guide](docs/DEVELOPER.md)
- **Easy Deployment:** Ready for Hugging Face Spaces or Vercel

---

## Quick Links
- [User Guide](docs/USER_GUIDE.md)
- [Developer Guide](docs/DEVELOPER.md)
- [API Reference](docs/API.md)

---

## Quick start — standalone (no backend needed)

Just open `index.html` in Chrome or Safari. Everything works:

- Live race simulation with moving rider dots
- NFC scan simulation (click the scanner or enter tag IDs)
- Fan predictions, social feed, equipment analysis
- Image drop for equipment identification
- Manufacturer compliance dashboard
- CSV export

```bash
# Optional — serve with a local server to avoid any CORS issues:
python -m http.server 5500 --directory .
open http://localhost:5500
```

---

## Full setup — with Flask backend

### 1. Install Python dependencies

```bash
cd StitchX_Radio/backend
pip install -r requirements.txt
```

### 2. Start the backend

```bash
python backend/server.py
# → http://127.0.0.1:8765
```

The Flask server:
- Serves `index.html` at `/`
- Provides REST API at `/api/...`
- Logs all scans to `data/scan_log.csv`
- Serves static files from `static/`

### 3. Open the app

```
http://127.0.0.1:8765
```

---

## NFC tag specification

Each physical tag stores only the `tag_id` (plain UTF-8 text):

```
NDEF Text Record
Encoding: UTF-8
Payload:  044B536AD71F90
```

The system reads the tag, looks up all data by `tag_id`:

```
Tag scanned → tag_id → GET /api/tag/{tag_id}
                      → returns scan + compliance + report
```

Recommended chips: NTAG213 / NTAG215 / NTAG216

---

## Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/health` | System status |
| GET  | `/api/tag/:tag_id` | Full bike record + compliance checks |
| POST | `/api/scan` | Log a scan (body: `{tag_id, operator}`) |
| GET  | `/api/bikes` | All bikes (filter: `?mfr=Colnago&comp=PASS`) |
| GET  | `/api/gc` | GC standings with live km position |
| GET  | `/api/equipment` | Equipment performance data (`?cat=Helmets`) |
| GET  | `/api/compliance/summary` | Pass/fail counts by manufacturer |
| GET  | `/api/report/:tag_id` | Full compliance report |
| GET  | `/api/export/csv` | Download fleet as CSV (`?mfr=Colnago`) |
| GET  | `/api/scans` | Scan log (`?limit=50`) |
| GET  | `/api/predict` | Stage win probabilities |
| GET  | `/api/comfy/queue` | ComfyUI status |

### Example: scan a tag

```bash
curl -X POST http://localhost:8765/api/scan \
  -H "Content-Type: application/json" \
  -d '{"tag_id":"044B536AD71F90","operator":"Q. Mansson"}'
```

### Example: get compliance report

```bash
curl http://localhost:8765/api/report/044B536AD71F90
```

---

## Scraper

### Social feed

```bash
python backend/scraper.py --source social \
  --tags "#TdF2026" "#cycling" "#Colnago" \
  --limit 100
# → data/social_feed.json
```

### Equipment data

```bash
python backend/scraper.py --source equipment \
  --brands Colnago Kask Zipp Continental Shimano \
  --limit 50
# → data/equipment_data.json
```

### Export NFC registry

```bash
python backend/scraper.py --source nfc
# → data/nfc_registry.csv
# → data/nfc_ndef_payloads.txt
```

### Export compliance data

```bash
python backend/scraper.py --source export \
  --output data/compliance_stage12.csv
```

---

## The 4 user views

### 1. Live Race (default tab)
- Stage elevation profile with moving rider dots
- GC standings with compliance status dot
- Click any rider → full profile: telemetry, equipment, compliance badge
- Live km-to-go, break gap, speed — updating every 500ms

### 2. Fan Zone
- Stage win prediction with probability breakdown
- Pick your winner — locks in prediction
- Live social feed (Instagram + Twitter style), auto-updates every 8s
- "Why they won" — equipment analysis of last stage
- Equipment win stats by brand (frames, helmets, wheels, tyres, groupsets)
- Drop a race photo → equipment identification

### 3. UCI Officials
- NFC scanner simulation — click to scan (cycles through all bikes)
- Manual tag ID entry
- Full compliance workflow: Scan → Compliance → Report → Export
- All 6 check types (frame weight, aero, motor scan, wheel, handlebar, mechanical)
- Export report as text file
- Scan history sidebar

### 4. Manufacturers
- KPI row: bikes registered, PASS/FAIL/PENDING counts, stage wins
- Filter by manufacturer (Colnago, Trek, Cervélo, etc.)
- Compliance heatmap — click any cell to jump to UCI inspection
- Commercial opportunities grid (6 product tiers with pricing)
- Fleet registry table with equip score and stage wins per bike
- Compliance event log
- CSV export

---

## Commercial product tiers

| Product | Who buys | Price |
|---------|----------|-------|
| UCI Compliance SaaS | Race organisations | €80,000 / year |
| Broadcaster Data Pack | TV / streaming | €45,000 / race |
| Manufacturer Intelligence | Colnago, Kask, Zipp, etc. | €12,000 / season |
| Team Analytics Suite | Pro teams | €8,000 / season |
| Component Brand Reports | Helmet, wheel, tyre brands | €5,000 / season |
| Fan Prediction Platform | Fans (B2C) | €2 / user / month |

**The key insight:** StitchX Radio is the only system that simultaneously knows:
1. Which exact equipment is on which bike (NFC tag)
2. Whether it passed compliance (UCI check)
3. Where that rider finished (race data)
4. How that equipment correlated with winning (intelligence layer)

No competitor has all four. That is the moat.

---

## Connecting to real data (when ready for API)

The JS data arrays in `static/js/main.js` are clearly labelled:
```js
const BIKES     = [...];   // → replace with GET /api/bikes
const GC_RIDERS = [...];   // → replace with GET /api/gc
const EQUIPMENT = [...];   // → replace with GET /api/equipment
```

Replace each with a `fetch()` call returning the same structure.
The backend already serves these endpoints — just wire them up.
