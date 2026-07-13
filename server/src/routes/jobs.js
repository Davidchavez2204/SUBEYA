import { Router } from "express";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { db } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { computeMatch, suggestCourses } from "../utils/matching.js";
import { uploadsDir } from "../utils/cvStorage.js";

export const jobsRouter = Router();

function jobWithCompany(job, users) {
  const company = users.find((u) => u.id === job.companyId);
  return {
    ...job,
    companyName: company?.profile?.companyName || company?.name || "Empresa",
  };
}

// Crear oferta laboral (solo empresa)
jobsRouter.post("/", requireAuth, requireRole("empresa"), async (req, res) => {
  const { title, description, techRequirements, softRequirements, modality, location, seniority, minExperienceYears } = req.body || {};

  if (!title || !description) {
    return res.status(400).json({ error: "El título y la descripción de la oferta son obligatorios." });
  }

  await db.read();
  const job = {
    id: crypto.randomUUID(),
    companyId: req.user.id,
    title: String(title).trim(),
    description: String(description).trim(),
    techRequirements: Array.isArray(techRequirements) ? techRequirements.map((s) => String(s).trim()).filter(Boolean) : [],
    softRequirements: Array.isArray(softRequirements) ? softRequirements.map((s) => String(s).trim()).filter(Boolean) : [],
    modality: modality || "Remoto",
    location: location || "Perú",
    seniority: seniority || "Junior",
    minExperienceYears: Number.isFinite(Number(minExperienceYears)) ? Math.max(0, Number(minExperienceYears)) : 0,
    status: "publicada",
    createdAt: new Date().toISOString(),
  };

  db.data.jobs.push(job);
  await db.write();
  res.status(201).json({ job });
});

// Listar ofertas publicadas (público / egresado autenticado obtiene su % de match)
jobsRouter.get("/", async (req, res) => {
  await db.read();
  const published = db.data.jobs.filter((j) => j.status === "publicada");

  const header = req.headers.authorization || "";

  // Intento opcional de decodificar el usuario si mandó token, para incluir match%
  let currentUser = null;
  if (header.startsWith("Bearer ")) {
    try {
      const jwt = (await import("jsonwebtoken")).default;
      const JWT_SECRET = process.env.JWT_SECRET || "subeya-dev-secret-change-in-production";
      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      currentUser = db.data.users.find((u) => u.id === payload.id);
    } catch {
      currentUser = null;
    }
  }

  const jobs = published.map((job) => {
    const enriched = jobWithCompany(job, db.data.users);
    if (currentUser?.role === "egresado") {
      const match = computeMatch(job, currentUser.profile);
      return { ...enriched, matchScore: match.score };
    }
    return enriched;
  });

  res.json({ jobs });
});

// Ofertas de la empresa autenticada (con conteo de postulantes)
jobsRouter.get("/mine", requireAuth, requireRole("empresa"), async (req, res) => {
  await db.read();
  const jobs = db.data.jobs
    .filter((j) => j.companyId === req.user.id)
    .map((job) => ({
      ...job,
      applicantsCount: db.data.applications.filter((a) => a.jobId === job.id).length,
    }));
  res.json({ jobs });
});

// Detalle de una oferta
jobsRouter.get("/:id", async (req, res) => {
  await db.read();
  const job = db.data.jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: "Oferta no encontrada." });

  const enriched = jobWithCompany(job, db.data.users);

  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    try {
      const jwt = (await import("jsonwebtoken")).default;
      const JWT_SECRET = process.env.JWT_SECRET || "subeya-dev-secret-change-in-production";
      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      const currentUser = db.data.users.find((u) => u.id === payload.id);
      if (currentUser?.role === "egresado") {
        const match = computeMatch(job, currentUser.profile);
        const courses = suggestCourses(db.data.courses, match.missingTech, match.missingSoft);
        return res.json({ job: { ...enriched, ...match, suggestedCourses: courses } });
      }
    } catch {
      // token inválido: se ignora y se devuelve la oferta sin match
    }
  }

  res.json({ job: enriched });
});

// Cerrar / reabrir una oferta (solo la empresa dueña)
jobsRouter.patch("/:id", requireAuth, requireRole("empresa"), async (req, res) => {
  await db.read();
  const job = db.data.jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: "Oferta no encontrada." });
  if (job.companyId !== req.user.id) return res.status(403).json({ error: "No puedes editar ofertas de otra empresa." });

  const { status, title, description, techRequirements, softRequirements, modality, location, seniority, minExperienceYears } = req.body || {};
  if (status) job.status = status;
  if (title) job.title = title;
  if (description) job.description = description;
  if (Array.isArray(techRequirements)) job.techRequirements = techRequirements;
  if (Array.isArray(softRequirements)) job.softRequirements = softRequirements;
  if (modality) job.modality = modality;
  if (location) job.location = location;
  if (seniority) job.seniority = seniority;
  if (minExperienceYears !== undefined && Number.isFinite(Number(minExperienceYears))) {
    job.minExperienceYears = Math.max(0, Number(minExperienceYears));
  }

  await db.write();
  res.json({ job });
});

// Eliminar una oferta por completo (solo la empresa dueña). Borra en cascada
// las postulaciones asociadas y sus archivos de CV para no dejar datos huérfanos.
jobsRouter.delete("/:id", requireAuth, requireRole("empresa"), async (req, res) => {
  await db.read();
  const job = db.data.jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: "Oferta no encontrada." });
  if (job.companyId !== req.user.id) {
    return res.status(403).json({ error: "No puedes eliminar ofertas de otra empresa." });
  }

  // Borra archivos de CV de cada postulación a esta oferta.
  const relatedApplications = db.data.applications.filter((a) => a.jobId === job.id);
  for (const app of relatedApplications) {
    if (app.cvFileName) {
      fs.unlink(path.join(uploadsDir, app.cvFileName), () => {});
    }
  }

  const removedApplications = relatedApplications.length;
  db.data.applications = db.data.applications.filter((a) => a.jobId !== job.id);
  db.data.jobs = db.data.jobs.filter((j) => j.id !== job.id);
  await db.write();

  res.json({ ok: true, removedApplications });
});

// Postulantes de una oferta, con % de match y cursos sugeridos por candidato (solo la empresa dueña)
jobsRouter.get("/:id/applicants", requireAuth, requireRole("empresa"), async (req, res) => {
  await db.read();
  const job = db.data.jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: "Oferta no encontrada." });
  if (job.companyId !== req.user.id) return res.status(403).json({ error: "No puedes ver postulantes de otra empresa." });

  const applications = db.data.applications.filter((a) => a.jobId === job.id);

  // Al abrir la lista de postulantes, las postulaciones recién recibidas
  // pasan automáticamente a "en_revision" (la empresa ya las vio).
  let changed = false;
  for (const app of applications) {
    if (app.status === "recibido") {
      app.status = "en_revision";
      changed = true;
    }
  }
  if (changed) await db.write();

  const applicants = applications.map((app) => {
    const egresado = db.data.users.find((u) => u.id === app.egresadoId);
    const match = computeMatch(job, egresado?.profile);
    const courses = suggestCourses(db.data.courses, match.missingTech, match.missingSoft);
    return {
      applicationId: app.id,
      status: app.status,
      appliedAt: app.createdAt,
      cvFileName: app.cvOriginalName,
      egresado: {
        id: egresado?.id,
        name: egresado?.name,
        email: egresado?.email,
        career: egresado?.profile?.career,
        techSkills: egresado?.profile?.techSkills || [],
        softSkills: egresado?.profile?.softSkills || [],
      },
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

  applicants.sort((a, b) => b.matchScore - a.matchScore);
  res.json({ job, applicants });
});
