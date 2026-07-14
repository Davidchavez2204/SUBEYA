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
  // Ampliación con tecnologías frecuentes en egresados de la región
  "nest.js", "nestjs", "svelte", "redux", "jquery", "webpack", "vite",
  ".net core", "asp.net", "entity framework", "sql server", "mariadb",
  "cassandra", "elasticsearch", "kafka", "rabbitmq", "nginx", "apache",
  "github actions", "gitlab ci", "ansible", "postman", "swagger", "jwt",
  "oauth", "websockets", "power apps", "power automate", "sharepoint",
  "google analytics", "seo", "sem", "google ads", "meta ads", "facebook ads",
  "hubspot", "mailchimp", "crm", "salesforce", "zoho crm", "microsoft dynamics",
  "canva", "adobe xd", "after effects", "premiere", "indesign", "corel draw",
  "illustrator", "photoshop", "autocad", "solidworks", "revit", "arduino", "iot",
  "looker", "google data studio", "airflow", "snowflake", "databricks",
  "microsoft office", "excel avanzado", "powerpoint", "project", "ms project",
  "erp", "sap", "oracle erp", "business intelligence", "power bi", "tableau",
  "administración", "gestión administrativa", "gestión documental", "office 365",
  "telecomunicaciones", "redes", "networking", "cisco packet tracer", "wireshark",
  "mikrotik", "routeros", "voip", "telefonía ip", "fiber optics", "fibra óptica",
  "5g", "4g", "lte", "vpn", "ccna", "ccnp", "fortigate", "pfsense",
  "derecho", "gestión legal", "sistemas jurídicos", "juris", "lex", "legaltech",
  "contratos", "documentación legal", "e-filing", "firmas digitales",
  "medicina", "historia clínica electrónica", "ehr", "emr", "pacs", "dicom",
  "telemedicina", "sistemas hospitalarios", "epic", "cerner", "citrix", "vitalink",
  "arquitectura", "autocad arquitectónico", "revit architecture", "sketchup",
  "lumion", "enscape", "rhino", "grasshopper", "bim", "render", "urbanismo",
  "psicología", "entrevista clínica", "evaluación psicológica", "psicodiagnóstico",
  "psicoterapia", "atención clínica", "apoyo emocional", "trabajo social",
  "contabilidad", "contabilidad general", "contabilidad gerencial", "finanzas",
  "presupuestos", "análisis financiero", "costo", "costos", "facturación",
  "cobranza", "tesorería", "tributaria", "impuestos", "quickbooks", "xero",
  "educación", "didáctica", "planificación educativa", "evaluación educativa",
  "aprendizaje", "formación docente", "classroom", "moodle", "zoom", "teams",
  "ciencias sociales", "investigación social", "análisis cualitativo", "análisis cuantitativo",
  "gestión comunitaria", "monitoreo y evaluación", "m&e", "programación social",
  // --- Administración y gestión ---
  "administración de empresas", "planeamiento estratégico", "planificación estratégica",
  "gestión de operaciones", "gestión de procesos", "gestión de calidad", "control de calidad",
  "iso 9001", "iso 14001", "iso 45001", "mejora continua", "lean", "six sigma", "kaizen", "5s",
  "logística", "cadena de suministro", "supply chain", "gestión de inventarios", "almacén",
  "compras", "abastecimiento", "comercio exterior", "importaciones", "exportaciones", "aduanas",
  "incoterms", "kpi", "okr", "balanced scorecard", "cuadro de mando", "gestión del cambio",
  "recursos humanos", "rrhh", "reclutamiento", "selección de personal", "gestión del talento",
  "capacitación", "nómina", "planillas", "plame", "clima laboral",
  "seguridad y salud ocupacional", "sst", "gestión ambiental", "pmbok", "pmp",
  // --- Ventas y atención al cliente ---
  "ventas", "gestión comercial", "atención al cliente", "servicio al cliente", "telemarketing",
  "posventa", "fidelización", "prospección", "cierre de ventas",
  // --- Marketing ---
  "marketing", "marketing digital", "publicidad", "branding", "community management",
  "redes sociales", "social media", "marketing de contenidos", "content marketing",
  "email marketing", "inbound marketing", "copywriting", "storytelling", "growth hacking",
  "embudos de conversión", "analítica web", "google tag manager", "marketing de influencers",
  "investigación de mercados", "comercio electrónico", "ecommerce", "estrategia de marca",
  // --- Diseño gráfico y multimedia ---
  "diseño gráfico", "diseño", "diseño ux", "diseño ui", "ux/ui", "ux", "ui", "diseño editorial",
  "diseño web", "identidad visual", "tipografía", "ilustración", "motion graphics", "animación",
  "edición de video", "fotografía", "retoque fotográfico", "lightroom", "premiere pro",
  "final cut", "corel", "3d", "maquetación",
  // --- Derecho ---
  "derecho civil", "derecho penal", "derecho laboral", "derecho corporativo", "derecho tributario",
  "derecho administrativo", "derecho constitucional", "litigios", "redacción jurídica",
  "argumentación jurídica", "conciliación", "arbitraje", "notarial", "registral", "compliance",
  "propiedad intelectual", "due diligence", "asesoría legal",
  // --- Medicina y salud ---
  "enfermería", "primeros auxilios", "rcp", "soporte vital", "farmacología", "anatomía",
  "fisiología", "diagnóstico", "atención primaria", "salud pública", "epidemiología",
  "bioseguridad", "esterilización", "toma de muestras", "signos vitales", "triaje", "nutrición",
  "fisioterapia", "kinesiología", "odontología", "laboratorio clínico", "radiología", "obstetricia",
  // --- Contabilidad y finanzas ---
  "auditoría", "niif", "pcge", "sunat", "concar", "siscont", "conciliación bancaria",
  "estados financieros", "análisis de costos", "control interno", "activos fijos", "flujo de caja",
  // --- Educación ---
  "pedagogía", "currículo", "evaluación por competencias", "tutoría", "educación inicial",
  "educación primaria", "educación secundaria", "educación superior",
  // --- Ingeniería y producción ---
  "gestión de la producción", "mantenimiento", "minitab", "metrología", "pert", "cpm",
  // === Herramientas y programas por especialidad ===
  // Ofimática y gestión / proyectos
  "outlook", "onedrive", "google workspace", "visio", "microsoft visio", "trello",
  "asana", "monday", "notion", "slack", "bizagi", "odoo", "primavera", "primavera p6",
  // Contabilidad y finanzas (herramientas frecuentes en Perú)
  "pdt", "sire", "nubox", "defontana", "contasol", "contpaq", "starsoft", "sap fico",
  "facturación electrónica", "siaf", "siga",
  // Marketing digital (herramientas)
  "hootsuite", "buffer", "metricool", "semrush", "ahrefs", "google search console",
  "meta business suite", "capcut", "klaviyo", "activecampaign",
  // Diseño gráfico y multimedia (programas)
  "blender", "cinema 4d", "sketch", "invision", "procreate", "davinci resolve",
  "affinity", "affinity designer", "adobe creative suite",
  // Arquitectura e ingeniería civil (software)
  "civil 3d", "3ds max", "archicad", "v-ray", "vray", "navisworks", "etabs", "sap2000",
  "s10", "robot structural", "tekla", "infraworks", "autodesk",
  // Ingeniería industrial / mecánica (software)
  "arena simulation", "flexsim", "catia", "autodesk inventor", "ansys", "labview",
  // Derecho (sistemas y bases legales)
  "spij", "vlex", "westlaw", "lexisnexis", "sinoe", "expediente judicial electrónico",
  "mesa de partes electrónica",
  // Salud (sistemas clínicos y hospitalarios)
  "sistema his", "openmrs", "software clínico", "sis salud",
  // Educación (plataformas)
  "canvas lms", "blackboard", "kahoot", "genially", "nearpod", "siagie", "edmodo",
  // Datos y estadística (herramientas)
  "stata", "sas", "qlik", "qlikview", "knime", "eviews", "google looker studio",
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
  "inteligencia emocional", "asertividad", "resiliencia", "manejo de conflictos",
  "tolerancia a la frustración", "pensamiento estratégico", "vocación de servicio",
  "orientación al logro", "multitarea", "trabajo remoto", "persuasión", "oratoria",
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
    // Los espacios internos de la habilidad se vuelven "espacios opcionales"
    // (\s*), de modo que se detecta igual con o sin espacios: "power bi" reconoce
    // "power bi" y "powerbi"; "google ads" reconoce "googleads"; etc.
    const escaped = escapeRegex(normalizedSkill).replace(/ /g, "\\s*");
    // Límites de palabra "suaves": funciona bien tanto para palabras sueltas
    // ("react") como para frases ("trabajo en equipo").
    const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
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
