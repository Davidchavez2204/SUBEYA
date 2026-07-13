import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "subeya-dev-secret-change-in-production";

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  // Se admite el token también como query param (?token=) para poder usar
  // enlaces de descarga directa (<a href>) que no pueden enviar cabeceras.
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.query.token || null;

  if (!token) {
    return res.status(401).json({ error: "No autenticado. Falta el token de acceso." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: `Esta acción requiere un perfil de ${role}.` });
    }
    next();
  };
}
