// Script de limpieza de datos de prueba de SUBEYA.
//
// Elimina cuentas de prueba (correos de test), ofertas de prueba, sus
// postulaciones y los archivos de CV asociados. PRESERVA las empresas demo
// (Nimbus Tech y DataBridge) y sus ofertas originales del seed.
//
// Uso (en la Console de Railway, dentro del servicio backend):
//   node scripts/cleanup-test-data.js            -> ejecuta la limpieza
//   DRY_RUN=1 node scripts/cleanup-test-data.js  -> solo muestra qué borraría (no borra nada)
//
// Es seguro correrlo varias veces.

import fs from "fs";
import path from "path";
import { db, initDb } from "../src/db.js";
import { uploadsDir } from "../src/utils/cvStorage.js";

const DRY_RUN = process.env.DRY_RUN === "1";

// --- Reglas de qué se considera "de prueba" --------------------------------

// Correos que SIEMPRE se conservan (empresas demo del seed). Nunca se borran.
const PROTECTED_EMAILS = [
  "rrhh@nimbustech.demo",
  "talento@databridge.demo",
];

// Un usuario es "de prueba" si su correo o nombre cumple alguno de estos patrones.
const TEST_EMAIL_PATTERNS = [
  /@test\.com$/i,
  /@test\./i,
  /subeya-test\.demo/i,
];
const TEST_NAME_PATTERNS = [
  /^qa\b/i, // nombres que empiezan con "QA " (ej. "QA Empresa", "QA Egresado Manual")
];

// Ofertas "de prueba" por título (se borran aunque pertenezcan a una empresa demo).
const TEST_JOB_TITLE_PATTERNS = [
  /^qa\b/i,
  /normalizaci[oó]n de skills/i,
  /\bprueba\b/i,
];

// ---------------------------------------------------------------------------

function isProtected(user) {
  return PROTECTED_EMAILS.includes((user.email || "").toLowerCase());
}

function isTestUser(user) {
  if (isProtected(user)) return false;
  const email = user.email || "";
  const name = user.name || "";
  return (
    TEST_EMAIL_PATTERNS.some((re) => re.test(email)) ||
    TEST_NAME_PATTERNS.some((re) => re.test(name))
  );
}

function isTestJobTitle(title) {
  return TEST_JOB_TITLE_PATTERNS.some((re) => re.test(title || ""));
}

function deleteCv(fileName) {
  if (!fileName) return;
  const p = path.join(uploadsDir, fileName);
  if (DRY_RUN) return;
  fs.unlink(p, () => {});
}

async function main() {
  await initDb();
  await db.read();

  const users = db.data.users || [];
  const jobs = db.data.jobs || [];
  const applications = db.data.applications || [];

  // 1) Usuarios de prueba
  const testUsers = users.filter(isTestUser);
  const testUserIds = new Set(testUsers.map((u) => u.id));

  // 2) Ofertas a borrar: de una empresa de prueba, o con título de prueba
  const jobsToDelete = jobs.filter(
    (j) => testUserIds.has(j.companyId) || isTestJobTitle(j.title)
  );
  const jobsToDeleteIds = new Set(jobsToDelete.map((j) => j.id));

  // 3) Postulaciones a borrar: de un egresado de prueba, o de una oferta a borrar
  const appsToDelete = applications.filter(
    (a) => testUserIds.has(a.egresadoId) || jobsToDeleteIds.has(a.jobId)
  );

  // --- Reporte ---
  console.log(DRY_RUN ? "== VISTA PREVIA (no se borrará nada) ==" : "== LIMPIEZA ==");
  console.log(`Usuarios de prueba a eliminar: ${testUsers.length}`);
  testUsers.forEach((u) => console.log(`  - [${u.role}] ${u.name} <${u.email}>`));
  console.log(`Ofertas de prueba a eliminar: ${jobsToDelete.length}`);
  jobsToDelete.forEach((j) => console.log(`  - "${j.title}"`));
  console.log(`Postulaciones a eliminar: ${appsToDelete.length}`);

  if (DRY_RUN) {
    console.log("\nDRY_RUN activo: no se realizó ningún cambio. Quita DRY_RUN para aplicar.");
    return;
  }

  // 4) Borrar archivos de CV (de las postulaciones y de los perfiles de prueba)
  appsToDelete.forEach((a) => deleteCv(a.cvFileName));
  testUsers.forEach((u) => deleteCv(u.profile?.cvFileName));

  // 5) Filtrar la base
  db.data.users = users.filter((u) => !testUserIds.has(u.id));
  db.data.jobs = jobs.filter((j) => !jobsToDeleteIds.has(j.id));
  const appsToDeleteIds = new Set(appsToDelete.map((a) => a.id));
  db.data.applications = applications.filter((a) => !appsToDeleteIds.has(a.id));

  await db.write();

  console.log("\n✔ Limpieza completada.");
  console.log(`Quedan: ${db.data.users.length} usuarios, ${db.data.jobs.length} ofertas, ${db.data.applications.length} postulaciones.`);
}

main().catch((err) => {
  console.error("Error durante la limpieza:", err);
  process.exit(1);
});
