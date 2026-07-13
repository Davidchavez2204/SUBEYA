// Diccionario de habilidades conocidas para detectar automáticamente en el texto
// de un CV. Es intencionalmente explícito (en vez de usar IA externa) para que la
// extracción sea rápida, gratuita, 100% offline y predecible.

export const TECH_SKILLS = [
  "javascript", "typescript", "react", "react native", "vue", "angular", "node.js",
  "node", "express", "next.js", "python", "django", "flask", "fastapi", "java",
  "spring", "spring boot", "c#", ".net", "php", "laravel", "ruby", "ruby on rails",
  "go", "golang", "rust", "kotlin", "swift", "c++", "c",
  "sql", "mysql", "postgresql", "postgres", "mongodb", "sqlite", "redis", "oracle",
  "html", "css", "sass", "tailwind", "tailwind css", "bootstrap",
  "git", "github", "gitlab", "docker", "kubernetes", "aws", "azure", "gcp",
  "google cloud", "linux", "bash", "ci/cd", "jenkins", "terraform",
  "figma", "photoshop", "illustrator", "excel", "power bi", "tableau",
  "power query", "vba", "spss", "r", "matlab",
  "machine learning", "deep learning", "tensorflow", "pytorch", "pandas", "numpy",
  "scikit-learn", "data science", "big data", "spark", "hadoop",
  "jira", "scrum", "kanban", "agile", "wordpress", "shopify",
  "salesforce", "sap", "networking", "cisco", "seguridad informática",
  "testing", "selenium", "cypress", "jest", "qa",
  "android", "ios", "flutter", "unity",
  "graphql", "rest api", "microservicios", "firebase", "supabase",
];

export const SOFT_SKILLS = [
  "trabajo en equipo", "comunicación", "comunicación efectiva", "liderazgo",
  "resolución de problemas", "pensamiento crítico", "pensamiento analítico",
  "adaptabilidad", "flexibilidad", "gestión del tiempo", "organización",
  "proactividad", "creatividad", "innovación", "negociación",
  "orientación a resultados", "orientación al cliente", "toma de decisiones",
  "empatía", "escucha activa", "responsabilidad", "puntualidad",
  "trabajo bajo presión", "atención al detalle", "colaboración",
  "aprendizaje continuo", "autonomía", "iniciativa", "ética de trabajo",
  "gestión de proyectos", "planificación", "mentoría", "capacidad de análisis",
];

function stripAccents(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(text) {
  return stripAccents(String(text || "").toLowerCase());
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findSkillsInText(text, dictionary) {
  const normalizedText = normalize(text);
  const found = [];

  for (const skill of dictionary) {
    const normalizedSkill = normalize(skill);
    // Límites de palabra "suaves": funciona bien tanto para palabras sueltas
    // ("react") como para frases ("trabajo en equipo").
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(normalizedSkill)}([^a-z0-9]|$)`, "i");
    if (pattern.test(normalizedText)) {
      found.push(skill);
    }
  }

  return found;
}

/**
 * Detecta habilidades técnicas y blandas presentes en el texto de un CV,
 * usando el diccionario definido arriba. No usa IA: es coincidencia de texto,
 * así que solo reconoce las habilidades listadas en TECH_SKILLS/SOFT_SKILLS.
 */
export function extractSkillsFromText(text) {
  if (!text || !text.trim()) {
    return { techSkills: [], softSkills: [] };
  }
  return {
    techSkills: findSkillsInText(text, TECH_SKILLS),
    softSkills: findSkillsInText(text, SOFT_SKILLS),
  };
}
