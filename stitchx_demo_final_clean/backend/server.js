const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("StitchX Backend Running");
});

app.get("/inspections", (req, res) => {
  res.json([
    { id: 1, rider: "Rider A", status: "PASS" },
    { id: 2, rider: "Rider B", status: "FAIL" }
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
