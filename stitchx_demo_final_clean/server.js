const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ✅ test route
app.get("/inspections", (req, res) => {
  res.json([
    { id: 1, rider: "Rider A", status: "PASS" },
    { id: 2, rider: "Rider B", status: "FAIL" }
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// --- Event Intelligence Engine ---
function detectEvents() {
  const updates = [];

  // Example: breakaway detection
  if (raceState.race.gap === "0:00" && Math.random() > 0.7) {
    const event = {
      id: `ru_${Date.now()}`,
      channel: "System",
      message: "Breakaway forming at front of peloton",
      time: new Date().toISOString(),
      type: "breakaway",
      label: "Breakaway Forming",
      priority: "medium"
    };
    raceState.updates.unshift(event);
    updates.push(event);
  }

  // Example: crash detection (simulated)
  if (Math.random() > 0.95) {
    const incident = {
      id: `inc_${Date.now()}`,
      severity: "high",
      type: "Crash Detected",
      location: "Sector " + Math.floor(Math.random() * 5 + 1),
      message: "System detected sudden speed drop — possible crash",
      time: new Date().toISOString(),
      label: "Crash Detected",
      priority: "high"
    };
    raceState.incidents.unshift(incident);
    updates.push({ type: "incident", data: incident, label: incident.label, priority: incident.priority });
  }

  return updates;
}
// Timeline replay event history
let history = [];
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});

let raceUpdates = [
  {
    id: "ru_001",
    channel: "Race Radio",
    message: "Breakaway of four riders holding 1:14.",
    time: new Date().toISOString(),
  },
  {
    id: "ru_002",
    channel: "Commissaire",
    message: "Feeding zone entry complete. No irregularities reported.",
    time: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
];

let incidents = [
  {
    id: "inc_001",
    severity: "medium",
    type: "Crash",
    location: "Sector 3",
    message: "Minor crash in rear of peloton. Medical car observing.",
    time: new Date().toISOString(),
  },
];

let fanZone = [
// Timeline replay event history
let history = [];

// --- Multi-race system ---
function createRace(name) {
  return {
    race: {
      stageName: name,
      status: "LIVE",
      distanceKm: 148,
      completedKm: 0,
      gap: "0:00",
      pelotonSpeedKph: 45,
      wind: "Neutral",
      lastUpdated: new Date().toISOString(),
    },
    phase: "Start",
    incidents: [],
    updates: [],
    fanZone: [],
    positions: {
      peloton: { lat: 41.5, lng: 2.0 },
      breakaway: { lat: 41.52, lng: 1.98 },
      incident: null,
    },
    predictions: [],
  };
}

let races = {
  race_1: createRace("Stage 12"),
  race_2: createRace("Stage 5"),
};
  {
    id: "fz_001",
    user: "SprintSector",
    content: "This stage is finally opening up.",
    likes: 24,
  },
  {
    id: "fz_002",
    user: "ClimbWatcher",
    const express = require("express");
    const cors = require("cors");
    const http = require("http");
    const { Server } = require("socket.io");

    const app = express();
    const PORT = 4000;

    app.use(cors());
    app.use(express.json());

    let raceState = {
      race: {
        stageName: "Stage 12",
        status: "LIVE",
        distanceKm: 148,
        completedKm: 91.4,
        gap: "1:14",
        pelotonSpeedKph: 46,
        wind: "Cross-tailwind",
        lastUpdated: new Date().toISOString(),
      },
// --- LLM Commentary Integration ---
require('dotenv').config();
let openaiClient = null;
try {
  const OpenAI = require("openai");
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (e) {
  console.warn("OpenAI not available or API key missing.");
}

function buildPrompt(state) {
  return `
You are a professional cycling race commentator.

Current race situation:
- Phase: ${state.phase}
- Gap: ${state.race.gap}
- Speed: ${state.race.pelotonSpeedKph} km/h
- Latest incident: ${state.incidents[0]?.message || "None"}

Tone:
- Sometimes excited
- Sometimes analytical
- Sometimes calm

Give a short, natural commentary line (1–2 sentences).
Make it sound like live TV commentary.
`;
}

async function generateLLMCommentary() {
  if (!openaiClient) return null;
  try {
    const prompt = buildPrompt(raceState);
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error("LLM error:", err);
    return null;
  }
}

// Emit LLM commentary every 10s
setInterval(async () => {
  const line = await generateLLMCommentary();
  if (line) io.emit("race:commentary", [line]);
}, 10000);
      incidents: [
        {
          id: "inc_001",
          severity: "medium",
          type: "Crash",
          location: "Sector 3",
          message: "Minor crash in rear of peloton. Medical car observing.",
          time: new Date().toISOString(),
        },
      ],
      updates: [
        {
          id: "ru_001",
          channel: "Race Radio",
          message: "Breakaway of four riders holding 1:14.",
          time: new Date().toISOString(),
        },
      ],
      fanZone: [
        {
          id: "fz_001",
          user: "SprintSector",
          content: "This stage is finally opening up.",
          likes: 24,
        },
      ],
    };

    const clients = new Map();

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: { origin: "*" },
    });

    function fullPayload() {
      const roleCounts = { admin: 0, official: 0, fan: 0 };
      for (const role of clients.values()) {
        if (roleCounts[role] !== undefined) roleCounts[role] += 1;
      let raceState = loadState();

      if (!raceState.positions) {
        raceState.positions = {
          peloton: { lat: 41.55, lng: 1.9 },
          breakaway: { lat: 41.6, lng: 1.8 },
          incident: { lat: 41.52, lng: 1.95 }
        };
      }
      if (!raceState.phase) {
        raceState.phase = "Breakaway Formation";
      }
      return {
        success: true,
        ...raceState,
        positions: raceState.positions,
        phase: raceState.phase,
        predictions: raceState.predictions || [],
        presence: {
          total: clients.size,
          byRole: roleCounts,
        },
      };
    }
      positions: raceState.positions,
setInterval(() => {
    // --- Predictive intelligence ---
    const predictions = generatePredictions();
    raceState.predictions = predictions;
    if (predictions.length > 0) {
      io.emit("race:predictions", predictions);
    }
  // --- Predictive Intelligence Engine ---
  function generatePredictions() {
    const predictions = [];

    // Breakaway success (simple heuristic)
    const gapSeconds = parseInt(raceState.race.gap.split(":")[1]);
    if (gapSeconds > 60) {
      predictions.push({
        id: `pred_${Date.now()}`,
        type: "breakaway_success",
        confidence: 0.75,
        message: "Breakaway has high chance of success",
      });
    }

    // Crash risk (simulate based on “sector”)
    if (Math.random() > 0.85) {
      predictions.push({
        id: `pred_${Date.now()}`,
        type: "crash_risk",
        confidence: 0.6,
        message: "High crash risk in upcoming sector",
      });
    }

    // Phase transition prediction
    if (raceState.race.completedKm > 120 && raceState.phase !== "Final Phase") {
      predictions.push({
        id: `pred_${Date.now()}`,
        type: "phase_shift",
        confidence: 0.8,
        message: "Entering final race phase soon",
      });
    }

    return predictions;
  }
  // Move peloton slightly
  raceState.positions.peloton.lat += 0.001;
  raceState.positions.peloton.lng -= 0.001;

  // Breakaway ahead
  raceState.positions.breakaway.lat += 0.0012;
  raceState.positions.breakaway.lng -= 0.0012;

  // Update completed km
  raceState.race.completedKm += 0.2;

  // Update phase based on completed km
  const km = raceState.race.completedKm;
  if (km < 10) raceState.phase = "Start";
  else if (km < 40) raceState.phase = "Breakaway Formation";
  else if (km < 100) raceState.phase = "Mid-Race Control";
  else if (km < 130) raceState.phase = "Climb Phase";
  else raceState.phase = "Final Phase";

  // --- Event intelligence ---
  const newEvents = detectEvents();
  if (newEvents.length > 0) {
    io.emit("race:intelligence", newEvents);
  }

  // Update timestamp
  raceState.race.lastUpdated = new Date().toISOString();

  // Broadcast to all users
  io.emit("state:update", fullPayload());

  // Save to history (movement step)
  history.push({
    timestamp: new Date().toISOString(),
    type: "movement",
    label: null,
    state: JSON.parse(JSON.stringify(raceState))
  });
}, 3000);
// Save every control action to history

// Patch: wrap original /api/control to add highlight event
const originalControlHandler = app._router.stack.find(
  (layer) => layer.route && layer.route.path === "/api/control" && layer.route.methods.post
);
if (originalControlHandler) {
  const oldHandler = originalControlHandler.route.stack[0].handle;
  originalControlHandler.route.stack[0].handle = function (req, res, next) {
    oldHandler(req, res, next);
    // After updating raceState, add highlight event
    history.push({
      timestamp: new Date().toISOString(),
      type: "control",
      label: req.body?.label || "Control Action",
      state: JSON.parse(JSON.stringify(raceState))
    });
  };
}
// Patch: add highlight for new incidents
function addIncidentToHistory(incident) {
  history.push({
    timestamp: new Date().toISOString(),
    type: "incident",
    label: incident.message || "Incident",
    state: JSON.parse(JSON.stringify(raceState))
  });
}
// Timeline replay API
app.get("/api/history", (req, res) => {
  res.json(history);
});

    function broadcastState() {
      io.emit("state:update", fullPayload());
    }

    io.on("connection", (socket) => {
      clients.set(socket.id, "fan");

      socket.on("role:set", (role) => {
        if (!["admin", "official", "fan"].includes(role)) return;
        clients.set(socket.id, role);
        broadcastState();
      });

      socket.emit("state:update", fullPayload());

      socket.on("disconnect", () => {
        clients.delete(socket.id);
        broadcastState();
      });
    });

    app.get("/api/race-updates", (req, res) => {
      res.json(fullPayload());
    });

    app.post("/api/control", (req, res) => {
      const { action } = req.body || {};

      if (action === "dispatch_medical") {
        const incident = {
          id: `inc_${Date.now()}`,
          severity: "high",
          type: "Medical Dispatch",
          location: "Race Route",
          message: "Medical team dispatched by race control.",
          time: new Date().toISOString(),
        };

        raceState.incidents.unshift(incident);
        raceState.race.lastUpdated = new Date().toISOString();
        broadcastState();

        return res.json({ success: true, message: "Medical team dispatched" });
      }

      if (action === "neutralize_race") {
        raceState.race.status = "NEUTRALIZED";
        raceState.race.lastUpdated = new Date().toISOString();

        raceState.updates.unshift({
          id: `ru_${Date.now()}`,
          channel: "Race Control",
          message: "Race has been neutralized by control.",
          time: new Date().toISOString(),
        });

        broadcastState();
        return res.json({ success: true, message: "Race neutralized" });
      }

      if (action === "flag_incident") {
        raceState.incidents.unshift({
          id: `inc_${Date.now()}`,
          severity: "medium",
          type: "Flagged Incident",
          location: "Under Review",
          message: "Incident flagged for official review.",
          time: new Date().toISOString(),
        });

        raceState.race.lastUpdated = new Date().toISOString();
        broadcastState();

        return res.json({ success: true, message: "Incident flagged" });
      }

      return res.status(400).json({ success: false, message: "Unknown action" });
    });

    server.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
