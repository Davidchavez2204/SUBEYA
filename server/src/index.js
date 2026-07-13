import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { profileRouter } from "./routes/profile.js";
import { jobsRouter } from "./routes/jobs.js";
import { applicationsRouter } from "./routes/applications.js";

const app = express();
const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "subeya-server" }));

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/applications", applicationsRouter);

// Manejador de errores genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor." });
});

await initDb();

app.listen(PORT, () => {
  console.log(`SUBEYA API escuchando en http://localhost:${PORT}`);
});
