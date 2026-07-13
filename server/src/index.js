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

// Necesario para que req.ip refleje la IP real del cliente detrás del proxy
// de Railway/Render (usa la cabecera X-Forwarded-For). Lo usa el rate limiter.
app.set("trust proxy", 1);

// exposedHeaders permite que el navegador (en peticiones cross-origin desde
// Vercel) pueda leer el nombre real del archivo al descargar un CV vía fetch.
app.use(cors({ origin: ALLOWED_ORIGIN, exposedHeaders: ["Content-Disposition"] }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "subeya-server" }));

// --- Serialización de peticiones a la API -----------------------------------
// La "base de datos" (lowdb) mantiene todo el estado en un único objeto en
// memoria y reescribe el archivo completo en cada db.write(). Bajo concurrencia
// (varios usuarios a la vez en la feria), dos peticiones podrían intercalarse
// entre su db.read() y db.write() y pisarse mutuamente (lost update), llegando
// incluso a perder registros o postulaciones.
//
// Como el backend corre en una sola instancia (Railway/Render), la solución
// robusta y simple es procesar las peticiones a /api de una en una: cada
// request espera a que termine la anterior antes de tocar la base. Las
// operaciones son muy rápidas (memoria + escritura de un archivo pequeño), así
// que para la escala de una feria el impacto en rendimiento es imperceptible.
let requestChain = Promise.resolve();
app.use("/api", (req, res, next) => {
  // El health check no toca la base: no necesita hacer cola.
  if (req.path === "/health") return next();

  requestChain = requestChain.then(
    () =>
      new Promise((resolve) => {
        let released = false;
        const release = () => {
          if (released) return;
          released = true;
          resolve();
        };
        // Liberamos el turno cuando la respuesta termina (o si la conexión se
        // cierra), y como red de seguridad tras un tiempo máximo para que un
        // request colgado nunca bloquee la cola indefinidamente.
        res.on("finish", release);
        res.on("close", release);
        setTimeout(release, 30000);
        next();
      })
  );
});
// ---------------------------------------------------------------------------

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
