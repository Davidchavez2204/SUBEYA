import { Router } from "express";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { db } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { computeMatch, suggestCourses } from "../utils/matching.js";
import { uploadCv, uploadsDir } from "../utils/cvStorage.js";

export const applicationsRouter = Router();

// Postular a una oferta. Admite dos modos:
//  1) Subir un CV nuevo específico para esta postulación (campo "cv").
//  2) Reusar el CV ya guardado en el perfil del egresado (campo "useProfileCv=true", sin archivo).
applicationsRouter.post(
  "/jobs/:id/apply",
  requireAuth,
  requireRole("egresado"),
  (req, res, next) => {
    uploadCv.single("cv")(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  async (req, res) => {
    await db.read();
    const job = db.data.jobs.find((j) => j.id === req.params.id);
    if (!job) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: "Oferta no encontrada." });
    }
    if (job.status !== "publicada") {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: "Esta oferta ya no admite postulaciones." });
    }

    const already = db.data.applications.find((a) => a.jobId === job.id && a.egresadoId === req.user.id);
    if (already) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(409).json({ error: "Ya postulaste a esta oferta." });
    }

    const egresado = db.data.users.find((u) => u.id === req.user.id);

    let cvFileName;
    let cvOriginalName;

    if (req.file) {
      cvFileName = req.file.filename;
      cvOriginalName = req.file.originalname;
    } else if (req.body?.useProfileCv === "true") {
      if (!egresado?.profile?.cvFileName) {
        return res.status(400).json({ error: "No tienes un CV guardado en tu perfil. Sube uno o adjunta uno nuevo para postular." });
      }
      // Se referencia el mismo archivo que el perfil; cada postulación guarda
      // su propio nombre lógico, así que si luego reemplazas el CV del perfil,
      // esta postulación conserva el que usaste al momento de postular.
      const ext = path.extname(egresado.profile.cvFileName);
      const copyName = `${crypto.randomUUID()}${ext}`;
      fs.copyFileSync(path.join(uploadsDir, egresado.profile.cvFileName), path.join(uploadsDir, copyName));
      cvFileName = copyName;
      cvOriginalName = egresado.profile.cvOriginalName || egresado.profile.cvFileName;
    } else {
      return res.status(400).json({ error: "Debes adjuntar tu CV en PDF o Word, o usar el CV guardado en tu perfil." });
    }

    const match = computeMatch(job, egresado?.profile);

    const application = {
      id: crypto.randomUUID(),
      jobId: job.id,
      egresadoId: req.user.id,
      cvFileName,
      cvOriginalName,
      matchScoreAtApply: match.score,
      status: "recibido",
      createdAt: new Date().toISOString(),
    };

    db.data.applications.push(application);
    await db.write();

    const courses = suggestCourses(db.data.courses, match.missingTech, match.missingSoft);
    res.status(201).json({ application, match: { ...match }, suggestedCourses: courses });
  }
);

// Postulaciones del egresado autenticado, con % de match vigente y cursos sugeridos
applicationsRouter.get("/mine", requireAuth, requireRole("egresado"), async (req, res) => {
  await db.read();
  const egresado = db.data.users.find((u) => u.id === req.user.id);
  const myApplications = db.data.applications.filter((a) => a.egresadoId === req.user.id);

  const result = myApplications.map((app) => {
    const job = db.data.jobs.find((j) => j.id === app.jobId);
    const company = db.data.users.find((u) => u.id === job?.companyId);
    const match = job
      ? computeMatch(job, egresado.profile)
      : {
          score: app.matchScoreAtApply,
          matchedTech: [],
          matchedSoft: [],
          missingTech: [],
          missingSoft: [],
          experienceScore: 0,
          requiredYears: 0,
          candidateYears: egresado?.profile?.yearsOfExperience || 0,
          meetsExperience: true,
        };
    const courses = suggestCourses(db.data.courses, match.missingTech, match.missingSoft);

    return {
      applicationId: app.id,
      status: app.status,
      appliedAt: app.createdAt,
      cvFileName: app.cvOriginalName,
      job: job
        ? { id: job.id, title: job.title, companyName: company?.profile?.companyName || company?.name, status: job.status }
        : null,
      matchScore: match.score,
      matchedTech: match.matchedTech,
      matchedSoft: match.matchedSoft,
      missingTech: match.missingTech,
      missingSoft: match.missingSoft,
      experienceScore: match.experienceScore,
      requiredYears: match.requiredYears,
      candidateYears: match.candidateYears,
      meetsExperience: match.meetsExperience,
      suggestedCourses: courses,
    };
  });

  res.json({ applications: result });
});

const VALID_STATUSES = new Set(["recibido", "en_revision", "aceptado", "rechazado"]);

// La empresa cambia manualmente el estado de una postulación (por ejemplo, para aceptarla o rechazarla).
applicationsRouter.patch("/:id/status", requireAuth, requireRole("empresa"), async (req, res) => {
  const { status } = req.body || {};
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: "Estado inválido. Debe ser 'recibido', 'en_revision', 'aceptado' o 'rechazado'." });
  }

  await db.read();
  const application = db.data.applications.find((a) => a.id === req.params.id);
  if (!application) return res.status(404).json({ error: "Postulación no encontrada." });

  const job = db.data.jobs.find((j) => j.id === application.jobId);
  if (!job || job.companyId !== req.user.id) {
    return res.status(403).json({ error: "No puedes modificar postulaciones de otra empresa." });
  }

  application.status = status;
  await db.write();

  res.json({ application });
});

// Cancelar / retirar una postulación (solo el propio egresado que postuló).
// Borra la postulación y su archivo de CV asociado.
applicationsRouter.delete("/:id", requireAuth, requireRole("egresado"), async (req, res) => {
  await db.read();
  const application = db.data.applications.find((a) => a.id === req.params.id);
  if (!application) return res.status(404).json({ error: "Postulación no encontrada." });
  if (application.egresadoId !== req.user.id) {
    return res.status(403).json({ error: "No puedes cancelar la postulación de otra persona." });
  }

  if (application.cvFileName) {
    fs.unlink(path.join(uploadsDir, application.cvFileName), () => {});
  }

  db.data.applications = db.data.applications.filter((a) => a.id !== application.id);
  await db.write();

  res.json({ ok: true });
});

// Descargar el CV de una postulación (solo el propio egresado o la empresa dueña de la oferta)
applicationsRouter.get("/:id/cv", requireAuth, async (req, res) => {
  await db.read();
  const application = db.data.applications.find((a) => a.id === req.params.id);
  if (!application) return res.status(404).json({ error: "Postulación no encontrada." });

  const job = db.data.jobs.find((j) => j.id === application.jobId);
  const isOwnerEgresado = req.user.role === "egresado" && req.user.id === application.egresadoId;
  const isOwnerEmpresa = req.user.role === "empresa" && job && req.user.id === job.companyId;

  if (!isOwnerEgresado && !isOwnerEmpresa) {
    return res.status(403).json({ error: "No tienes permiso para ver este CV." });
  }

  const filePath = path.join(uploadsDir, application.cvFileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "El archivo del CV ya no está disponible." });
  }

  res.download(filePath, application.cvOriginalName);
});
