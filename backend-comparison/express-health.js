const express = require("express");

const startTime = Date.now();

const app = express();
const PORT = 3100;

app.get("/api/health", (req, res) => {
  res.json({
    framework: "Express",
    status: "ok",
    message: "Express health endpoint deluje."
  });
});

app.listen(PORT, () => {
  const startupTime = Date.now() - startTime;

  console.log(`Express teče na http://localhost:${PORT}`);
  console.log(`Čas zagona: ${startupTime} ms`);
});