const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
