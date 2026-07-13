import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { fileURLToPath } from "url";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// UPLOADS_DIR permite apuntar los CVs a un volumen persistente en producción
// (ej. Railway Volumes). Si no se define, usa server/uploads/cvs como en
// desarrollo local.
export const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, "..", "..", "uploads", "cvs");
fs.mkdirSync(uploadsDir, { recursive: true });

// Solo PDF y Word (.docx) para poder extraer texto de forma confiable.
// (El formato .doc antiguo no es soportado por la librería de extracción.)
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const uploadCv = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new Error("Formato no permitido. Solo se aceptan archivos PDF o Word (.docx)."));
    }
    cb(null, true);
  },
});

/**
 * Extrae el texto plano de un CV ya guardado en disco, según su tipo MIME.
 * Devuelve "" (string vacío) si el formato no es soportado o si falla el parseo,
 * para que el flujo nunca se rompa por un archivo raro o corrupto.
 */
export async function extractTextFromCv(filePath, mimetype) {
  try {
    if (mimetype === "application/pdf") {
      const buffer = fs.readFileSync(filePath);
      const result = await pdfParse(buffer);
      return result.text || "";
    }
    if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || "";
    }
    return "";
  } catch (err) {
    console.error("No se pudo extraer texto del CV:", err.message);
    return "";
  }
}
