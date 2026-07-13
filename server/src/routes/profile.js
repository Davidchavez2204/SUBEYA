import { Router } from "express";
import fs from "fs";
import path from "path";
import { db } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { uploadCv, uploadsDir, extractTextFromCv } from "../utils/cvStorage.js";
import { extractSkillsFromText } from "../utils/skillsDictionary.js";
import { extractExperienceFromText } from "../utils/experienceExtractor.js";

export const profileRouter = Router();

function mergeUnique(existing, incoming) {
  const result = [...(existing || [])];
  for (const item of incoming || []) {
    if (!result.some((r) => r.toLowerCase() === item.toLowerCase())) {
      result.push(item);
    }
  }
  return result;
}

profileRouter.put("/egresado", requireAuth, requireRole("egresado"), async (req, res) => {
  const { techSkills, softSkills, bio, career, yearsOfExperience, experiences } = req.body || {};

  await db.read();
  const user = db.data.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

  user.profile = {
    ...user.profile,
    techSkills: Array.isArray(techSkills) ? techSkills.map((s) => String(s).trim()).filter(Boolean) : user.profile.techSkills,
    softSkills: Array.isArray(softSkills) ? softSkills.map((s) => String(s).trim()).filter(Boolean) : user.profile.softSkills,
    bio: typeof bio === "string" ? bio : user.profile.bio,
    career: typeof career === "string" ? career : user.profile.career,
    yearsOfExperience: Number.isFinite(Number(yearsOfExperience)) ? Math.max(0, Number(yearsOfExperience)) : user.profile.yearsOfExperience,
    experiences: Array.isArray(experiences) ? experiences : user.profile.experiences,
  };

  await db.write();
  const { passwordHash, ...publicUser } = user;
  res.json({ user: publicUser });
});

// Subir el CV al perfil: guarda el archivo y extrae automáticamente las
// habilidades técnicas/blandas detectadas, para pre-llenar el perfil.
// No sobrescribe el perfil por sí solo: el frontend decide si aplica las
// habilidades detectadas antes de que el egresado presione "Guardar perfil".
profileRouter.post(
  "/egresado/cv",
  requireAuth,
  requireRole("egresado"),
  (req, res, next) => {
    uploadCv.single("cv")(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Debes adjuntar tu CV en PDF o Word (.docx)." });
    }

    await db.read();
    const user = db.data.users.find((u) => u.id === req.user.id);
    if (!user) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const text = await extractTextFromCv(req.file.path, req.file.mimetype);
    const extractedSkills = extractSkillsFromText(text);
    const extractedExperience = extractExperienceFromText(text);

    // Elimina el CV anterior del perfil (si existía) para no acumular archivos.
    if (user.profile.cvFileName) {
      const oldPath = path.join(uploadsDir, user.profile.cvFileName);
      fs.unlink(oldPath, () => {});
    }

    user.profile = {
      ...user.profile,
      cvFileName: req.file.filename,
      cvOriginalName: req.file.originalname,
      // Las habilidades detectadas se suman a las que ya tenía guardadas en el
      // perfil (sin duplicar), como base de lo que el egresado verá para revisar.
      techSkills: mergeUnique(user.profile.techSkills, extractedSkills.techSkills),
      softSkills: mergeUnique(user.profile.softSkills, extractedSkills.softSkills),
      // La experiencia laboral se reemplaza con la detectada en este CV (representa
      // el historial completo más reciente), pero el egresado puede corregirla luego.
      experiences: extractedExperience.entries.length > 0 ? extractedExperience.entries.map((e, i) => ({ id: `exp-${Date.now()}-${i}`, ...e })) : user.profile.experiences || [],
      yearsOfExperience: extractedExperience.entries.length > 0 ? extractedExperience.yearsOfExperience : user.profile.yearsOfExperience || 0,
    };

    await db.write();
    const { passwordHash, ...publicUser } = user;

    res.json({
      user: publicUser,
      extracted: { ...extractedSkills, experience: extractedExperience },
      extractionEmpty: !text.trim(),
    });
  }
);

// Descargar el CV guardado en el propio perfil.
profileRouter.get("/egresado/cv", requireAuth, requireRole("egresado"), async (req, res) => {
  await db.read();
  const user = db.data.users.find((u) => u.id === req.user.id);
  if (!user?.profile?.cvFileName) {
    return res.status(404).json({ error: "Todavía no has subido un CV a tu perfil." });
  }
  const filePath = path.join(uploadsDir, user.profile.cvFileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "El archivo del CV ya no está disponible." });
  }
  res.download(filePath, user.profile.cvOriginalName);
});

profileRouter.put("/empresa", requireAuth, requireRole("empresa"), async (req, res) => {
  const { companyName, sector, description } = req.body || {};

  await db.read();
  const user = db.data.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

  user.profile = {
    companyName: typeof companyName === "string" && companyName.trim() ? companyName.trim() : user.profile.companyName,
    sector: typeof sector === "string" ? sector : user.profile.sector,
    description: typeof description === "string" ? description : user.profile.description,
  };

  await db.write();
  const { passwordHash, ...publicUser } = user;
  res.json({ user: publicUser });
});
