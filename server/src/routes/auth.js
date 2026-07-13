import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "../db.js";
import { signToken, requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

authRouter.post("/register", async (req, res) => {
  const { email, password, name, role, companyName } = req.body || {};

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: "Faltan campos obligatorios (nombre, email, contraseña, rol)." });
  }
  if (!["empresa", "egresado"].includes(role)) {
    return res.status(400).json({ error: "El rol debe ser 'empresa' o 'egresado'." });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
  }

  await db.read();
  const exists = db.data.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) {
    return res.status(409).json({ error: "Ya existe una cuenta registrada con ese correo." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: crypto.randomUUID(),
    email: String(email).trim().toLowerCase(),
    passwordHash,
    name: String(name).trim(),
    role,
    createdAt: new Date().toISOString(),
    profile:
      role === "egresado"
        ? { techSkills: [], softSkills: [], bio: "", career: "", cvFileName: null, cvOriginalName: null, experiences: [], yearsOfExperience: 0 }
        : { companyName: companyName?.trim() || name.trim(), sector: "", description: "" },
  };

  db.data.users.push(user);
  await db.write();

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
  }

  await db.read();
  const user = db.data.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas." });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Credenciales inválidas." });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  await db.read();
  const user = db.data.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
  res.json({ user: publicUser(user) });
});
