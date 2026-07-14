// Normaliza un string de habilidad para comparar de forma robusta. Ignora:
//  - mayúsculas/minúsculas ("GitHub" = "github")
//  - espacios en cualquier posición ("Git Hub" = "GitHub", "Cap Cut" = "capcut")
//  - acentos ("comunicación" = "comunicacion")
// De este modo, dos habilidades escritas de forma distinta pero equivalentes
// cuentan como la misma al calcular el match.
function normalize(skill) {
  return String(skill || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .toLowerCase()
    .replace(/\s+/g, ""); // quita todos los espacios
}

// Devuelve la lista sin duplicados (según la clave normalizada), pero conservando
// el texto original legible del primer elemento de cada grupo, para mostrarlo tal
// cual en la interfaz (ej. "GitHub" y no "github").
function uniqueByKey(list) {
  const seen = new Set();
  const result = [];
  for (const item of list || []) {
    const raw = String(item || "").trim();
    if (!raw) continue;
    const key = normalize(raw);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(raw);
  }
  return result;
}

// Años mínimos de experiencia esperados según el seniority de la oferta.
// Se usa solo como valor por defecto cuando la empresa no especifica un
// número exacto de años al publicar la oferta.
const MIN_YEARS_BY_SENIORITY = {
  Practicante: 0,
  Junior: 0,
  "Semi Senior": 2,
  Senior: 4,
};

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

/**
 * Calcula el porcentaje de coincidencia entre el perfil de un egresado y
 * los requisitos de una oferta laboral.
 *
 * Ponderación del negocio: 60% habilidades técnicas + 20% habilidades blandas
 * + 20% experiencia laboral (años de experiencia vs. el seniority pedido).
 * Si una oferta no pide requisitos de una categoría, esa categoría puntúa 100%.
 */
export function computeMatch(job, egresadoProfile) {
  // Requisitos de la oferta, conservando el texto original para mostrarlo.
  const techRequired = uniqueByKey(job.techRequirements);
  const softRequired = uniqueByKey(job.softRequirements);

  // Habilidades del egresado como conjunto de claves normalizadas, para comparar
  // sin importar espacios, mayúsculas ni acentos.
  const techOwnedKeys = new Set((egresadoProfile?.techSkills || []).map(normalize).filter(Boolean));
  const softOwnedKeys = new Set((egresadoProfile?.softSkills || []).map(normalize).filter(Boolean));

  const techMatched = techRequired.filter((s) => techOwnedKeys.has(normalize(s)));
  const softMatched = softRequired.filter((s) => softOwnedKeys.has(normalize(s)));

  const techScore = techRequired.length ? techMatched.length / techRequired.length : 1;
  const softScore = softRequired.length ? softMatched.length / softRequired.length : 1;
  const { experienceScore, requiredYears, candidateYears, meetsExperience } = experienceFit(job, egresadoProfile);

  const score = Math.round((techScore * 0.6 + softScore * 0.2 + experienceScore * 0.2) * 100);

  const missingTech = techRequired.filter((s) => !techOwnedKeys.has(normalize(s)));
  const missingSoft = softRequired.filter((s) => !softOwnedKeys.has(normalize(s)));

  return {
    score: Math.max(0, Math.min(100, score)),
    matchedTech: techMatched,
    matchedSoft: softMatched,
    missingTech,
    missingSoft,
    experienceScore: Math.round(experienceScore * 100),
    requiredYears,
    candidateYears,
    meetsExperience,
  };
}

/**
 * Sugiere cursos del catálogo para cerrar las brechas de habilidades técnicas
 * (y, en menor medida, blandas) detectadas en el match. Si una habilidad
 * faltante no existe en el catálogo, se sugiere una búsqueda genérica.
 */
export function suggestCourses(courses, missingTech, missingSoft) {
  const gaps = [...missingTech, ...missingSoft];
  const suggestions = [];

  for (const gap of gaps) {
    const found = courses.find((c) => normalize(c.skill) === normalize(gap));
    if (found) {
      suggestions.push({ skill: gap, ...found });
    } else {
      // Si la habilidad no está en el catálogo curado, generamos una
      // recomendación dinámica que lleva a la búsqueda de esa habilidad en
      // Udemy, para que el egresado siempre tenga por dónde empezar.
      suggestions.push({
        skill: gap,
        id: `search-${normalize(gap).replace(/\s+/g, "-")}`,
        title: `Cursos de ${gap} en Udemy`,
        provider: "Udemy",
        url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(gap)}`,
        level: "Variable",
      });
    }
  }

  return suggestions;
}
