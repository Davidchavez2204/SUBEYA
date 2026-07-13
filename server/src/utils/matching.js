// Normaliza un string de habilidad para comparaciones case-insensitive y sin espacios extra.
function normalize(skill) {
  return String(skill || "").trim().toLowerCase();
}

function normalizeList(list) {
  return Array.from(new Set((list || []).map(normalize).filter(Boolean)));
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
  const techRequired = normalizeList(job.techRequirements);
  const softRequired = normalizeList(job.softRequirements);
  const techOwned = normalizeList(egresadoProfile?.techSkills);
  const softOwned = normalizeList(egresadoProfile?.softSkills);

  const techMatched = techRequired.filter((s) => techOwned.includes(s));
  const softMatched = softRequired.filter((s) => softOwned.includes(s));

  const techScore = techRequired.length ? techMatched.length / techRequired.length : 1;
  const softScore = softRequired.length ? softMatched.length / softRequired.length : 1;
  const { experienceScore, requiredYears, candidateYears, meetsExperience } = experienceFit(job, egresadoProfile);

  const score = Math.round((techScore * 0.6 + softScore * 0.2 + experienceScore * 0.2) * 100);

  const missingTech = techRequired.filter((s) => !techOwned.includes(s));
  const missingSoft = softRequired.filter((s) => !softOwned.includes(s));

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
      suggestions.push({
        skill: gap,
        id: `search-${normalize(gap).replace(/\s+/g, "-")}`,
        title: `Curso sugerido: ${gap}`,
        provider: "Búsqueda recomendada",
        url: `https://www.coursera.org/search?query=${encodeURIComponent(gap)}`,
        level: "Variable",
      });
    }
  }

  return suggestions;
}
