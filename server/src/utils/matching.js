// Motor de coincidencia (match) de SUBEYA.
//
// Objetivos:
//  1) Comparar habilidades ignorando espacios, mayúsculas y acentos, y además
//     detectar coincidencias APROXIMADAS por forma/orden de palabras
//     (ej. "Composición de fotografía" == "Composición fotográfica").
//  2) Leer el NIVEL indicado en la habilidad (ej. "SQL (Avanzado)") y aplicar
//     reglas estrictas: el candidato cumple solo si su nivel es MAYOR O IGUAL al
//     pedido. Un nivel mayor cubre a uno menor. Si no se pide nivel, basta con
//     tener la habilidad.
//  3) Permitir un respaldo opcional con IA (ver utils/aiSkillMatch.js) para
//     equivalencias que la comparación algorítmica no capte.

import { aiEquivalences } from "./aiSkillMatch.js";

// ---------------------------------------------------------------------------
// Utilidades de texto
// ---------------------------------------------------------------------------
function stripAccents(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function normNoSpace(s) {
  // Conserva + # . porque distinguen habilidades (c, c#, c++, node.js).
  return stripAccents(s).toLowerCase().replace(/[^a-z0-9+#.]/g, "");
}

// ---------------------------------------------------------------------------
// Niveles
// ---------------------------------------------------------------------------
const LEVEL_WORDS = {
  // Básico = 1
  basico: 1, basica: 1, principiante: 1, inicial: 1, junior: 1, jr: 1, beginner: 1, basic: 1, elemental: 1, bajo: 1,
  // Intermedio = 2
  intermedio: 2, intermedia: 2, medio: 2, media: 2, intermediate: 2, mid: 2,
  // Avanzado = 3
  avanzado: 3, avanzada: 3, experto: 3, experta: 3, expert: 3, senior: 3, sr: 3, advanced: 3, alto: 3, profesional: 3, dominio: 3, nativo: 3,
};
const LEVEL_LABEL = { 1: "Básico", 2: "Intermedio", 3: "Avanzado" };

function detectLevel(str) {
  const words = stripAccents(str).toLowerCase().match(/[a-z0-9+#.]+/g) || [];
  let level = 0;
  for (const w of words) {
    if (LEVEL_WORDS[w] !== undefined) level = Math.max(level, LEVEL_WORDS[w]);
  }
  return level;
}

// Quita la anotación de nivel del texto para quedarnos con el nombre limpio de
// la habilidad, conservando el texto original (mayúsculas/acentos) para mostrar.
function stripLevelText(str) {
  const isLevel = (w) => LEVEL_WORDS[stripAccents(w).toLowerCase()] !== undefined;
  let out = String(str || "");
  // (Avanzado) [Intermedio] {Básico}
  out = out.replace(/[([{]\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)\s*[)\]}]/g, (m, w) => (isLevel(w) ? "" : m));
  // separadores + palabra de nivel al final: "- Avanzado", ": intermedio", ", básico"
  out = out.replace(/[-,:–—/|]\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)\s*$/g, (m, w) => (isLevel(w) ? "" : m));
  // palabra de nivel suelta al final: "SQL avanzado"
  out = out.replace(/\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)\s*$/g, (m, w) => (isLevel(w) ? "" : m));
  return out.trim();
}

export function parseSkill(str) {
  const raw = String(str || "").trim();
  const level = detectLevel(raw);
  const name = stripLevelText(raw) || raw;
  return { raw, name, level };
}

// ---------------------------------------------------------------------------
// Coincidencia aproximada de NOMBRES de habilidad (algorítmica, offline)
// ---------------------------------------------------------------------------
const STOPWORDS = new Set([
  "de", "del", "la", "el", "los", "las", "en", "y", "con", "para", "por", "a", "al",
  "un", "una", "o", "u", "the", "of", "and", "in", "for", "on", "to",
]);

// Palabras de marca/fabricante que se ignoran al comparar, de modo que
// "Adobe Photoshop" = "Photoshop", "Microsoft Excel" = "Excel", "Google Sheets"
// = "Sheets", etc. Solo se descartan como prefijo/sufijo: el nombre real (la
// herramienta) es lo que se compara.
const VENDOR_WORDS = new Set([
  "adobe", "microsoft", "ms", "google", "office365", "o365",
]);

// Raíz aproximada: quita plurales y sufijos comunes de forma/derivación para que
// "fotografía", "fotográfica" y "fotográfico" converjan a la misma raíz.
function stem(token) {
  let x = token;
  if (x.length > 4) x = x.replace(/(es|s)$/, "");
  if (x.length > 5) {
    x = x.replace(/(iones|ciones|mente|idades|icas|icos|ias|ica|ico|dad|cion|ncia|ados|idos|ado|ido|ia|ar|er|ir)$/, "");
  }
  return x;
}

function tokenSet(name) {
  // Conserva + y # para no confundir "c" / "c#" / "c++".
  const clean = stripAccents(name).toLowerCase().replace(/[^a-z0-9+#]/g, " ");
  const toks = clean.split(/\s+/).filter((t) => t && !STOPWORDS.has(t));
  return Array.from(new Set(toks.map(stem).filter(Boolean)));
}

// "Clave núcleo": quita palabras vacías y de marca, y une el resto sin espacios.
// Así "Adobe Photoshop" -> "photoshop", "Microsoft Power Point" -> "powerpoint",
// "Google Sheets" -> "sheets". Sirve para emparejar la herramienta real aunque
// venga con el fabricante delante o escrita separada/junta.
function coreKey(name) {
  const clean = stripAccents(name).toLowerCase().replace(/[^a-z0-9+#]/g, " ");
  const toks = clean.split(/\s+/).filter((t) => t && !STOPWORDS.has(t) && !VENDOR_WORDS.has(t));
  return toks.join("");
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(
        dp[i] + 1,
        dp[i - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
  }
  return dp[m];
}

function tokensEqual(a, b) {
  if (a === b) return true;
  const L = Math.max(a.length, b.length);
  if (L >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  if (L >= 5 && levenshtein(a, b) <= 1) return true;
  return false;
}

/**
 * Devuelve true si dos nombres de habilidad son equivalentes de forma
 * aproximada: mismo texto (ignorando espacios/acentos/mayúsculas) o mismo
 * conjunto de palabras significativas por raíz e independiente del orden.
 */
export function namesMatch(a, b) {
  const ka = normNoSpace(a), kb = normNoSpace(b);
  if (ka && ka === kb) return true; // exacto (GitHub == Git Hub, PowerBI == Power BI)

  // Núcleo sin marca ni espacios (Adobe Photoshop == Photoshop, MS Excel == Excel).
  const ca = coreKey(a), cb = coreKey(b);
  if (ca && ca === cb) return true;

  const ta = tokenSet(a), tb = tokenSet(b);
  if (!ta.length || !tb.length) return false;
  if (ta.length !== tb.length) return false; // misma cantidad de palabras clave

  // Emparejamiento uno a uno de las palabras clave (independiente del orden).
  const used = new Array(tb.length).fill(false);
  for (const s of ta) {
    let ok = false;
    for (let i = 0; i < tb.length; i++) {
      if (!used[i] && tokensEqual(s, tb[i])) { used[i] = true; ok = true; break; }
    }
    if (!ok) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Experiencia
// ---------------------------------------------------------------------------
const MIN_YEARS_BY_SENIORITY = { Practicante: 0, Junior: 0, "Semi Senior": 2, Senior: 4 };

function experienceFit(job, egresadoProfile) {
  const requiredYears = Number.isFinite(Number(job.minExperienceYears))
    ? Math.max(0, Number(job.minExperienceYears))
    : MIN_YEARS_BY_SENIORITY[job.seniority] ?? 0;
  const candidateYears = Math.max(0, Number(egresadoProfile?.yearsOfExperience) || 0);
  const score = requiredYears === 0 ? 1 : Math.min(1, candidateYears / requiredYears);
  return {
    experienceScore: score,
    requiredYears,
    candidateYears,
    meetsExperience: candidateYears >= requiredYears,
  };
}

// ---------------------------------------------------------------------------
// Cálculo del match
// ---------------------------------------------------------------------------
function uniqueByKey(list) {
  const seen = new Set();
  const out = [];
  for (const item of list || []) {
    const raw = String(item || "").trim();
    if (!raw) continue;
    const key = normNoSpace(raw);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(raw);
  }
  return out;
}

// Nivel efectivo del candidato: si no declaró nivel, se asume Básico (1).
function candidateEffectiveLevel(level) {
  return level > 0 ? level : 1;
}

// ¿El candidato cumple el requisito (nombre equivalente Y nivel suficiente)?
function requirementMet(req, candidates, equivalences) {
  for (const c of candidates) {
    if (namesMatch(req.name, c.name) && candidateEffectiveLevel(c.level) >= req.level) return true;
  }
  // Respaldo IA: equivalences mapea clave-normalizada-del-requisito -> nombre de
  // una habilidad del candidato que la IA consideró equivalente.
  if (equivalences) {
    const eqName = equivalences[normNoSpace(req.raw)] ?? equivalences[normNoSpace(req.name)];
    if (eqName) {
      const c = candidates.find((x) => normNoSpace(x.name) === normNoSpace(eqName));
      if (c && candidateEffectiveLevel(c.level) >= req.level) return true;
    }
  }
  return false;
}

/**
 * Calcula el % de coincidencia. `opts.equivalences` es un mapa opcional provisto
 * por el respaldo de IA. Ponderación: 60% técnicas + 20% blandas + 20% experiencia.
 * Las habilidades mostradas (matched/missing) conservan su texto original,
 * incluido el nivel (ej. "SQL (Avanzado)").
 */
export function computeMatch(job, egresadoProfile, opts = {}) {
  const equivalences = opts.equivalences || null;

  const techReq = uniqueByKey(job.techRequirements).map(parseSkill);
  const softReq = uniqueByKey(job.softRequirements).map(parseSkill);
  const techCand = (egresadoProfile?.techSkills || []).map(parseSkill);
  const softCand = (egresadoProfile?.softSkills || []).map(parseSkill);

  const matchedTech = techReq.filter((r) => requirementMet(r, techCand, equivalences)).map((r) => r.raw);
  const matchedSoft = softReq.filter((r) => requirementMet(r, softCand, equivalences)).map((r) => r.raw);
  const missingTech = techReq.filter((r) => !requirementMet(r, techCand, equivalences)).map((r) => r.raw);
  const missingSoft = softReq.filter((r) => !requirementMet(r, softCand, equivalences)).map((r) => r.raw);

  const techScore = techReq.length ? matchedTech.length / techReq.length : 1;
  const softScore = softReq.length ? matchedSoft.length / softReq.length : 1;
  const { experienceScore, requiredYears, candidateYears, meetsExperience } = experienceFit(job, egresadoProfile);

  const score = Math.round((techScore * 0.6 + softScore * 0.2 + experienceScore * 0.2) * 100);

  return {
    score: Math.max(0, Math.min(100, score)),
    matchedTech,
    matchedSoft,
    missingTech,
    missingSoft,
    experienceScore: Math.round(experienceScore * 100),
    requiredYears,
    candidateYears,
    meetsExperience,
  };
}

/**
 * Igual que computeMatch, pero si el respaldo de IA está activado (ver
 * aiSkillMatch.js) intenta resolver las habilidades faltantes con la IA y
 * recalcula. Si la IA está desactivada, se comporta idéntico a computeMatch.
 */
export async function computeMatchAsync(job, egresadoProfile) {
  const base = computeMatch(job, egresadoProfile);
  const gaps = [...base.missingTech, ...base.missingSoft];
  if (!gaps.length) return base;

  const candidateNames = [
    ...(egresadoProfile?.techSkills || []),
    ...(egresadoProfile?.softSkills || []),
  ].map((s) => parseSkill(s).name);

  const equivalences = await aiEquivalences(gaps.map((g) => parseSkill(g)), candidateNames);
  if (!equivalences || Object.keys(equivalences).length === 0) return base;

  return computeMatch(job, egresadoProfile, { equivalences });
}

/**
 * Sugiere cursos del catálogo para las habilidades faltantes. Usa coincidencia
 * aproximada por nombre (ignorando el nivel). Si no hay curso curado, genera una
 * búsqueda en Udemy de esa habilidad.
 */
export function suggestCourses(courses, missingTech, missingSoft) {
  const gaps = [...missingTech, ...missingSoft];
  const suggestions = [];

  for (const gapRaw of gaps) {
    const gapName = parseSkill(gapRaw).name;
    const found = courses.find(
      (c) => normNoSpace(c.skill) === normNoSpace(gapName) || namesMatch(c.skill, gapName)
    );
    if (found) {
      suggestions.push({ skill: gapName, ...found });
    } else {
      suggestions.push({
        skill: gapName,
        id: `search-${normNoSpace(gapName) || "skill"}`,
        title: `Cursos de ${gapName} en Udemy`,
        provider: "Udemy",
        url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(gapName)}`,
        level: "Variable",
      });
    }
  }

  return suggestions;
}

export { LEVEL_LABEL };
// Motor de match: coincidencia aproximada + niveles + respaldo IA opcional.
