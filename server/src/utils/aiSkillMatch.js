// Respaldo opcional con IA para equivalencias de habilidades.
//
// Cuando la comparación algorítmica (matching.js) no encuentra una habilidad
// requerida entre las del candidato, este módulo puede consultar a un modelo de
// IA (API de Anthropic) para decidir si alguna habilidad del candidato es
// equivalente (sinónimo / cubre lo pedido), ignorando el nivel.
//
// Está DESACTIVADO por defecto. Se activa con dos variables de entorno:
//   AI_MATCH=1
//   ANTHROPIC_API_KEY=sk-...           (tu clave de Anthropic)
//   AI_MATCH_MODEL=claude-haiku-4-5-20251001   (opcional, modelo a usar)
//
// Si no está activado o la clave falta, todas las funciones son "no-op" y el
// sistema sigue funcionando solo con la comparación algorítmica (offline).
//
// Se cachea en memoria para no repetir consultas iguales (clave = requerido +
// lista de habilidades del candidato).

const cache = new Map();

function aiEnabled() {
  return process.env.AI_MATCH === "1" && !!process.env.ANTHROPIC_API_KEY;
}

async function aiFindEquivalent(requiredName, candidateNames) {
  if (!candidateNames.length) return null;

  const key = requiredName.toLowerCase() + "||" + candidateNames.map((c) => c.toLowerCase()).sort().join("|");
  if (cache.has(key)) return cache.get(key);

  const model = process.env.AI_MATCH_MODEL || "claude-haiku-4-5-20251001";
  const prompt =
    `Eres un evaluador de habilidades laborales. Habilidad requerida por la empresa: "${requiredName}".\n` +
    `Habilidades del candidato: ${JSON.stringify(candidateNames)}.\n` +
    `¿Cuál de las habilidades del candidato significa lo mismo, es sinónimo o cubre la habilidad requerida? Ignora el nivel.\n` +
    `Responde SOLO con el texto EXACTO de esa habilidad del candidato, o la palabra NINGUNA si no hay equivalente.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens: 40, messages: [{ role: "user", content: prompt }] }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json();
    const text = String(data?.content?.[0]?.text || "").trim();

    let found = null;
    if (text && text.toUpperCase() !== "NINGUNA") {
      found =
        candidateNames.find((c) => c.toLowerCase() === text.toLowerCase()) ||
        candidateNames.find((c) => text.toLowerCase().includes(c.toLowerCase())) ||
        null;
    }
    cache.set(key, found);
    return found;
  } catch {
    // Cualquier fallo (red, API, timeout) no debe romper el cálculo del match.
    cache.set(key, null);
    return null;
  }
}

/**
 * Dado un conjunto de requisitos faltantes (ya parseados: {raw, name, level}) y
 * los nombres de las habilidades del candidato, devuelve un mapa
 * { claveNormalizadaDelRequisito: nombreHabilidadCandidato } con las
 * equivalencias que la IA encontró. Devuelve {} si la IA está desactivada.
 */
export async function aiEquivalences(missingParsed, candidateNames) {
  if (!aiEnabled()) return {};

  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const equivalences = {};

  for (const req of missingParsed || []) {
    const match = await aiFindEquivalent(req.name, candidateNames);
    if (match) {
      equivalences[norm(req.raw)] = match;
      equivalences[norm(req.name)] = match;
    }
  }
  return equivalences;
}
