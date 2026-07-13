// Extrae experiencia laboral del texto de un CV usando heurísticas de texto
// (rangos de fechas + encabezados de sección), sin depender de IA externa.
// Es intencionalmente conservador: prefiere devolver menos entradas pero más
// confiables, y siempre deja que el egresado corrija el resultado a mano.

const MONTHS =
  "enero|ene|febrero|feb|marzo|mar|abril|abr|mayo|may|junio|jun|julio|jul|agosto|ago|septiembre|setiembre|sept?|octubre|oct|noviembre|nov|diciembre|dic|" +
  "january|february|march|april|june|july|august|september|october|november|december|jan|apr|aug|sep|oct|nov|dec";

const MONTH_INDEX = {
  enero: 0, ene: 0, january: 0, jan: 0,
  febrero: 1, feb: 1, february: 1,
  marzo: 2, mar: 2, march: 2,
  abril: 3, abr: 3, april: 3, apr: 3,
  mayo: 4, may: 4,
  junio: 5, jun: 5, june: 5,
  julio: 6, jul: 6, july: 6,
  agosto: 7, ago: 7, august: 7, aug: 7,
  septiembre: 8, setiembre: 8, sept: 8, sep: 8, september: 8,
  octubre: 9, oct: 9, october: 9,
  noviembre: 10, nov: 10, november: 10,
  diciembre: 11, dic: 11, december: 11, dec: 11,
};

const CURRENT_WORDS = /^(presente|actualidad|actual|present|current|hoy|ahora)$/i;

const DATE_TOKEN = `(?:(?:${MONTHS})\\.?\\s+\\d{4}|\\d{1,2}\\/\\d{4}|\\d{4})`;
const END_TOKEN = `(?:${DATE_TOKEN}|presente|actualidad|actual|present|current|hoy|ahora)`;

const RANGE_REGEX = new RegExp(`(${DATE_TOKEN})\\s*(?:-|–|—|al?|to)\\s*(${END_TOKEN})`, "gi");

const EXPERIENCE_HEADER = /^(experiencia( laboral| profesional)?|historial laboral|work experience|professional experience|employment history)\s*:?\s*$/i;
const OTHER_HEADER = /^(educaci[oó]n|formaci[oó]n( acad[eé]mica)?|estudios|habilidades|skills|idiomas|languages|referencias|certificaciones|certifications|proyectos|projects|resumen|perfil( profesional)?|sobre m[ií]|contacto|datos personales|about me|summary)\s*:?\s*$/i;

const MAX_ENTRIES = 15;
const MAX_SINGLE_ENTRY_MONTHS = 40 * 12; // 40 años, cota de seguridad ante fechas mal parseadas

function parseDateToken(raw) {
  const token = raw.trim().toLowerCase().replace(/\./g, "");
  if (CURRENT_WORDS.test(token)) return null; // se resuelve como "ahora" en el llamador

  const slashMatch = token.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = Math.min(11, Math.max(0, parseInt(slashMatch[1], 10) - 1));
    return { year: parseInt(slashMatch[2], 10), month };
  }

  const monthYearMatch = token.match(new RegExp(`^(${MONTHS})\\s+(\\d{4})$`, "i"));
  if (monthYearMatch) {
    const monthName = monthYearMatch[1].toLowerCase();
    const month = MONTH_INDEX[monthName] ?? 0;
    return { year: parseInt(monthYearMatch[2], 10), month };
  }

  const yearOnlyMatch = token.match(/^(\d{4})$/);
  if (yearOnlyMatch) {
    return { year: parseInt(yearOnlyMatch[1], 10), month: 0 };
  }

  return null;
}

function toAbsoluteMonth({ year, month }) {
  return year * 12 + month;
}

/**
 * Extrae bloques de experiencia (título/período/duración) y calcula el total
 * de años de experiencia sin contar dos veces los períodos que se traslapan.
 */
export function extractExperienceFromText(text) {
  if (!text || !text.trim()) {
    return { entries: [], totalMonths: 0, yearsOfExperience: 0 };
  }

  const now = new Date();
  const nowAbs = toAbsoluteMonth({ year: now.getFullYear(), month: now.getMonth() });

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Si hay un encabezado de "Experiencia", acotamos la búsqueda a esa sección
  // para no confundir fechas de estudios/certificaciones con experiencia laboral.
  let startIdx = 0;
  let endIdx = lines.length;
  const headerIdx = lines.findIndex((l) => EXPERIENCE_HEADER.test(l));
  if (headerIdx !== -1) {
    startIdx = headerIdx + 1;
    for (let i = startIdx; i < lines.length; i++) {
      if (OTHER_HEADER.test(lines[i])) {
        endIdx = i;
        break;
      }
    }
  }
  const scopedLines = lines.slice(startIdx, endIdx);

  const rawEntries = [];
  scopedLines.forEach((line, idx) => {
    RANGE_REGEX.lastIndex = 0;
    const match = RANGE_REGEX.exec(line);
    if (!match) return;

    const start = parseDateToken(match[1]);
    const endRaw = match[2].trim().toLowerCase();
    const end = CURRENT_WORDS.test(endRaw) ? { year: now.getFullYear(), month: now.getMonth() } : parseDateToken(match[2]);
    if (!start || !end) return;

    const startAbs = toAbsoluteMonth(start);
    const endAbs = Math.min(toAbsoluteMonth(end), nowAbs);
    if (endAbs <= startAbs || endAbs - startAbs > MAX_SINGLE_ENTRY_MONTHS) return;

    // El título es el resto de la línea sin el rango de fechas; si queda vacío,
    // usamos la línea anterior no vacía (formato común: título arriba, fecha abajo).
    let title = line.replace(match[0], "").replace(/[|,\-–—()]+$/, "").trim();
    if (!title && idx > 0) title = scopedLines[idx - 1];
    if (!title) title = "Experiencia laboral";

    rawEntries.push({
      title: title.slice(0, 120),
      period: `${match[1].trim()} – ${match[2].trim()}`,
      startAbs,
      endAbs,
    });
  });

  const limited = rawEntries.slice(0, MAX_ENTRIES);

  // Fusiona rangos superpuestos para no contar el mismo mes dos veces
  // (ej. un freelance en paralelo a un trabajo full-time).
  const sorted = [...limited].sort((a, b) => a.startAbs - b.startAbs);
  const merged = [];
  for (const entry of sorted) {
    const last = merged[merged.length - 1];
    if (last && entry.startAbs <= last.endAbs) {
      last.endAbs = Math.max(last.endAbs, entry.endAbs);
    } else {
      merged.push({ startAbs: entry.startAbs, endAbs: entry.endAbs });
    }
  }
  const totalMonths = merged.reduce((sum, m) => sum + (m.endAbs - m.startAbs), 0);

  return {
    entries: limited.map(({ title, period }) => ({ title, period })),
    totalMonths,
    yearsOfExperience: Math.round((totalMonths / 12) * 10) / 10,
  };
}
