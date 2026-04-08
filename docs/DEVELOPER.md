# StitchX Radio Developer Guide

This guide provides all the technical details needed to understand, run, and contribute to StitchX Radio. It covers project structure, setup, deployment, and best practices for developers and contributors.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Setup & Installation](#setup--installation)
5. [Running Locally](#running-locally)
6. [Deployment](#deployment)
7. [Backend API Integration](#backend-api-integration)
8. [Frontend Features](#frontend-features)
9. [Security Notes](#security-notes)
10. [Contributing](#contributing)
11. [Support](#support)

---

## Project Overview
StitchX Radio is a Flask-based web app with a static HTML/CSS/JS frontend and a secure backend proxy for Hugging Face AI integration. It is designed for demos, investor presentations, and public use.

---

## Architecture
- **Frontend:** Static HTML, CSS, JavaScript (tab navigation, tooltips, modals, responsive design)
- **Backend:** Flask (Python), provides API endpoints and securely proxies Hugging Face Inference API
- **Deployment:** Hugging Face Spaces or Vercel (static + backend)

---

## Directory Structure
```
StitchX_Radio/
├── backend/
│   └── server.py
├── static/
│   ├── css/
│   │   └── main.css
│   └── js/
│       └── main.js
├── index.html
├── docs/
│   ├── API.md
│   ├── USER_GUIDE.md
│   └── DEVELOPER.md
└── README.md
```

---

## Setup & Installation
1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd StitchX_Radio
   ```
2. **Install Python dependencies:**
   ```sh
   pip install -r requirements.txt
   ```
3. **(Optional) Set Hugging Face API key:**
   - Add your key to the backend environment (e.g., `.env` or system variable).

---

## Running Locally
1. **Start the backend:**
   ```sh
   cd backend
   python server.py
   ```
2. **Open index.html** in your browser (or use a simple HTTP server for static files).

---

## Deployment
- **Hugging Face Spaces:**
  - Push the repo to your Hugging Face account.
  - Configure the backend and static files as per Spaces documentation.
- **Vercel:**
  - Deploy static frontend via Vercel.
  - Deploy backend separately (e.g., Vercel Serverless Functions or another host).

---

## Backend API Integration
- All AI calls are routed through `/api/sentiment` (see API.md).
- The backend securely stores and uses the Hugging Face API key.
- Never expose API keys in frontend code.

---

## Frontend Features
- Tab navigation (Social Feed, Demo Guide, Investor Pitch)
- Sentiment analysis input and results
- Tooltips for sentiment scores
- Modal dialogs (Investor Pitch)
- Feedback button (Google Forms)
- Mobile-first responsive design

---

## Security Notes
- API keys are only ever used server-side.
- CORS is configured to allow frontend-backend communication.
- No sensitive data is stored or logged.

---

## Contributing
1. Fork the repo and create a feature branch.
2. Follow code style and documentation conventions.
3. Submit a pull request with a clear description.
4. All contributions are reviewed before merging.

---

## Support
- For technical questions, open an issue or contact the maintainer (see README).
- For investor/demo support, use the Feedback form or contact info in the pitch modal.

---

Thank you for contributing to StitchX Radio!