import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoute from "./routes/authRoute.js";
import gameDataRoute from "./routes/gameDataRoute.js";
import levelsRoute from "./routes/levelRoute.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const allowedOrigins = ["http://localhost:3000", "http://localhost:5173"];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

if (process.env.NODE_ENV === "production") {
  const buildDir = path.resolve(__dirname, "frontend", "dist");
  console.log("Serving frontend from:", buildDir);
  app.use(express.static(buildDir));

  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(buildDir, "index.html"));
  });
}

app.use("/api/auth", authRoute);
app.use("/api/gameData", gameDataRoute);
app.use("/api/levels", levelsRoute);

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    message: "LevelUp backend is running",
  });
});

app.use(/^\/api\/.*$/, (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested API endpoint does not exist",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error("Error:", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on Port: ${PORT}`);
});
