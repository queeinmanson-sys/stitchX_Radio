const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

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
  res.json({
    raceDynamics: {
      label: "RACE DYNAMICS",
      accent: "yellow",
      line1: "Breakaway gap stable at 1:14",
      line2: "Peloton maintaining controlled pace before KOM"
    },
    riderFocus: {
      label: "RIDER FOCUS",
      accent: "blue",
      line1: "GC leader holding position in peloton",
      line2: "No mechanical or inspection flags detected"
    },
    equipmentStatus: {
      label: "EQUIPMENT STATUS",
      accent: "green",
      line1: "All scanned bikes compliant",
      line2: "No UCI inspection alerts"
    },
    liveAlert: {
      label: "LIVE ALERT",
      accent: "red",
      line1: "Speed increase detected in chase group",
      line2: "Potential break catch within 12 km"
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
