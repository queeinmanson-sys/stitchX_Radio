const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

let raceState = {
  gap: 74,
  avgSpeed: 44.2,
  kmToGo: 36,
  inspectionsClear: true
};

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "stitchX_Radio API" });
});

app.get("/inspections", (req, res) => {
  res.json([
    { id: 1, rider: "Rider A", status: "PASS" },
    { id: 2, rider: "Rider B", status: "FAIL" }
  ]);
});
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/stream", (req, res) => {
  res.redirect("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
});

app.get("/insights", (req, res) => {
  const { gap, avgSpeed, kmToGo, inspectionsClear } = raceState;

  // 🔥 Race dynamics logic
  let raceLine1 = gap > 60
    ? `Breakaway gap stable at ${Math.floor(gap / 60)}:${(gap % 60).toString().padStart(2, "0")}`
    : "Peloton closing in on breakaway";

  let raceLine2 = avgSpeed > 45
    ? "High pace detected across peloton"
    : "Controlled pace before key climb";

  // 🔥 Rider focus logic
  let riderLine1 = kmToGo < 20
    ? "GC riders preparing for final attacks"
    : "GC leader holding position in peloton";

  let riderLine2 = "No mechanical or inspection flags detected";

  // 🔥 Equipment logic
  let equipmentLine1 = inspectionsClear
    ? "All scanned bikes compliant"
    : "Inspection alerts detected";

  let equipmentLine2 = inspectionsClear
    ? "No UCI inspection alerts"
    : "Review required for flagged bikes";

  // 🔥 Live alert logic
  let alertLine1 = gap < 60
    ? "Breakaway under pressure"
    : "Stable race conditions";

  let alertLine2 = kmToGo < 15
    ? "Final race phase approaching"
    : "Monitoring race dynamics";

  res.json({
    raceDynamics: {
      label: "RACE DYNAMICS",
      accent: "yellow",
      line1: raceLine1,
      line2: raceLine2
    },
    riderFocus: {
      label: "RIDER FOCUS",
      accent: "blue",
      line1: riderLine1,
      line2: riderLine2
    },
    equipmentStatus: {
      label: "EQUIPMENT STATUS",
      accent: "green",
      line1: equipmentLine1,
      line2: equipmentLine2
    },
    liveAlert: {
      label: "LIVE ALERT",
      accent: "red",
      line1: alertLine1,
      line2: alertLine2
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
