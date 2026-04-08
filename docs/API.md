# StitchX Radio API Documentation

This document describes the REST API endpoints provided by the StitchX Radio backend (Flask).

---

## Authentication
Most endpoints are public. For `/api/sentiment`, the backend securely uses your Hugging Face API key (never exposed to the frontend).

---

## Endpoints

### Health Check
- **GET** `/api/health`
  - Returns: `{ status: 'ok' }`

### Get All Bikes
- **GET** `/api/bikes`
  - Returns: List of all bikes with compliance and equipment info.

### Get GC Standings
- **GET** `/api/gc`
  - Returns: List of GC riders and their positions.

### Get Equipment Data
- **GET** `/api/equipment`
  - Returns: List of equipment performance data.

### Get Compliance Summary
- **GET** `/api/compliance/summary`
  - Returns: Pass/fail counts by manufacturer.

### Get Tag Details
- **GET** `/api/tag/<tag_id>`
  - Returns: Full bike record, compliance checks, and report for the given NFC tag.

### Log a Scan
- **POST** `/api/scan`
  - Body: `{ tag_id: string, operator: string }`
  - Returns: Scan log entry.

### Get Compliance Report
- **GET** `/api/report/<tag_id>`
  - Returns: Full compliance report for the given tag.

### Export Fleet as CSV
- **GET** `/api/export/csv`
  - Returns: Downloadable CSV of the fleet (optionally filter by manufacturer).

### Get Scan Log
- **GET** `/api/scans?limit=50`
  - Returns: Recent scan log entries.

### Stage Win Prediction
- **GET** `/api/predict`
  - Returns: Stage win probabilities for riders.

### ComfyUI Status
- **GET** `/api/comfy/queue`
  - Returns: ComfyUI queue/status (if integrated).

### Social Feed Scraper (CLI only)
- Run `python backend/scraper.py --source social ...` to update social feed data.

### Equipment Data Scraper (CLI only)
- Run `python backend/scraper.py --source equipment ...` to update equipment data.

### NFC Registry Export (CLI only)
- Run `python backend/scraper.py --source nfc` to export NFC registry.

### Compliance Data Export (CLI only)
- Run `python backend/scraper.py --source export ...` to export compliance data.

### Sentiment Analysis (Secure Proxy)
- **POST** `/api/sentiment`
  - Body: `{ text: string }`
  - Returns: `{ label: 'POSITIVE'|'NEGATIVE'|'NEUTRAL'|'UNKNOWN', score: float }`
  - Note: The Hugging Face API key is kept private on the backend.

---

## Error Handling
- All endpoints return JSON errors with appropriate HTTP status codes.
- Example: `{ error: 'Missing text or API key' }`

---

## Contact
For questions or integration help, contact the StitchX Radio team.
