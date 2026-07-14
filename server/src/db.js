import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// DATA_DIR permite apuntar la "base de datos" a un volumen persistente en
// producción (ej. Railway Volumes). Si no se define, usa server/data como en
// desarrollo local.
const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbFile = path.join(dataDir, "db.json");

const defaultData = {
  users: [],
  jobs: [],
  applications: [],
  courses: [
    { id: "c1", skill: "javascript", title: "JavaScript Moderno (ES6+)", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", level: "Intermedio" },
    { id: "c2", skill: "react", title: "React - Fundamentos y Hooks", provider: "React.dev", url: "https://react.dev/learn", level: "Intermedio" },
    { id: "c3", skill: "node.js", title: "Node.js desde cero", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/", level: "Intermedio" },
    { id: "c4", skill: "sql", title: "SQL para análisis de datos", provider: "Khan Academy", url: "https://www.khanacademy.org/computing/computer-programming/sql", level: "Básico" },
    { id: "c5", skill: "python", title: "Python para todos", provider: "Coursera", url: "https://www.coursera.org/specializations/python", level: "Básico" },
    { id: "c6", skill: "java", title: "Java: Programación Orientada a Objetos", provider: "Coursera", url: "https://www.coursera.org/learn/programacion-orientada-a-objetos-con-java", level: "Intermedio" },
    { id: "c7", skill: "git", title: "Control de versiones con Git y GitHub", provider: "GitHub Skills", url: "https://skills.github.com/", level: "Básico" },
    { id: "c8", skill: "docker", title: "Docker para desarrolladores", provider: "Docker Docs", url: "https://docs.docker.com/get-started/", level: "Intermedio" },
    { id: "c9", skill: "aws", title: "AWS Cloud Practitioner Essentials", provider: "AWS Skill Builder", url: "https://skillbuilder.aws/", level: "Básico" },
    { id: "c10", skill: "figma", title: "Diseño de interfaces con Figma", provider: "Figma Academy", url: "https://www.figma.com/academy/", level: "Básico" },
    { id: "c11", skill: "excel", title: "Excel avanzado para negocios", provider: "Coursera", url: "https://www.coursera.org/learn/excel-avanzado", level: "Básico" },
    { id: "c12", skill: "typescript", title: "TypeScript práctico", provider: "TypeScript Docs", url: "https://www.typescriptlang.org/docs/handbook/intro.html", level: "Intermedio" },
    { id: "c13", skill: "comunicación", title: "Comunicación efectiva en equipos", provider: "Coursera", url: "https://www.coursera.org/learn/comunicacion-efectiva", level: "Básico" },
    { id: "c14", skill: "trabajo en equipo", title: "Colaboración y trabajo en equipo", provider: "LinkedIn Learning", url: "https://www.linkedin.com/learning/", level: "Básico" },
    { id: "c15", skill: "liderazgo", title: "Fundamentos de liderazgo", provider: "Coursera", url: "https://www.coursera.org/learn/liderazgo", level: "Intermedio" },
    { id: "c16", skill: "resolución de problemas", title: "Pensamiento crítico y resolución de problemas", provider: "edX", url: "https://www.edx.org/", level: "Básico" },
    { id: "c17", skill: "adaptabilidad", title: "Adaptabilidad y manejo del cambio", provider: "LinkedIn Learning", url: "https://www.linkedin.com/learning/", level: "Básico" },
    { id: "c18", skill: "gestión del tiempo", title: "Gestión del tiempo y productividad", provider: "Coursera", url: "https://www.coursera.org/learn/gestion-del-tiempo", level: "Básico" },
    { id: "c19", skill: "google analytics", title: "Google Analytics Certification", provider: "Google Skillshop", url: "https://skillshop.withgoogle.com/", level: "Básico" },
    { id: "c20", skill: "seo", title: "Fundamentos de SEO", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c21", skill: "google ads", title: "Google Ads Certification", provider: "Google Skillshop", url: "https://skillshop.withgoogle.com/", level: "Básico" },
    { id: "c22", skill: "meta ads", title: "Meta Blueprint", provider: "Meta", url: "https://www.facebook.com/business/learn", level: "Básico" },
    { id: "c23", skill: "hubspot", title: "HubSpot Inbound Marketing", provider: "HubSpot Academy", url: "https://academy.hubspot.com/", level: "Básico" },
    { id: "c24", skill: "mailchimp", title: "Mailchimp Essentials", provider: "Mailchimp", url: "https://mailchimp.com/learn/", level: "Básico" },
    { id: "c25", skill: "crm", title: "Fundamentos de CRM", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c26", skill: "canva", title: "Diseño con Canva", provider: "Canva Design School", url: "https://www.canva.com/learn/", level: "Básico" },
    { id: "c27", skill: "adobe xd", title: "Adobe XD Essentials", provider: "Adobe", url: "https://helpx.adobe.com/support/xd.html", level: "Básico" },
    { id: "c28", skill: "indesign", title: "Adobe InDesign Fundamentals", provider: "LinkedIn Learning", url: "https://www.linkedin.com/learning/", level: "Básico" },
    { id: "c29", skill: "corel draw", title: "CorelDRAW Basics", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c30", skill: "autocad", title: "AutoCAD Basics", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c31", skill: "solidworks", title: "SolidWorks Essentials", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c32", skill: "revit", title: "Revit Fundamentals", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c33", skill: "sketchup", title: "SketchUp Essentials", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c34", skill: "bim", title: "Fundamentos de BIM", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c35", skill: "microsoft office", title: "Microsoft Office Essentials", provider: "Microsoft Learn", url: "https://learn.microsoft.com/", level: "Básico" },
    { id: "c36", skill: "excel avanzado", title: "Excel avanzado para negocios", provider: "Coursera", url: "https://www.coursera.org/learn/excel-avanzado", level: "Intermedio" },
    { id: "c37", skill: "powerpoint", title: "Presentaciones efectivas con PowerPoint", provider: "Microsoft Learn", url: "https://learn.microsoft.com/", level: "Básico" },
    { id: "c38", skill: "project", title: "Gestión de proyectos con Microsoft Project", provider: "Microsoft Learn", url: "https://learn.microsoft.com/", level: "Básico" },
    { id: "c39", skill: "erp", title: "Fundamentos de ERP", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c40", skill: "sap", title: "Introducción a SAP", provider: "SAP", url: "https://www.sap.com/", level: "Básico" },
    { id: "c41", skill: "business intelligence", title: "Introducción a Business Intelligence", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c42", skill: "administración", title: "Fundamentos de administración", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c43", skill: "gestión administrativa", title: "Gestión administrativa eficaz", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c44", skill: "gestión documental", title: "Gestión documental y archivos", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c45", skill: "telecomunicaciones", title: "Fundamentos de telecomunicaciones", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c46", skill: "redes", title: "Fundamentos de redes", provider: "Cisco Networking Academy", url: "https://www.netacad.com/", level: "Básico" },
    { id: "c47", skill: "cisco packet tracer", title: "Cisco Packet Tracer Basics", provider: "Cisco Networking Academy", url: "https://www.netacad.com/", level: "Básico" },
    { id: "c48", skill: "wireshark", title: "Wireshark Essentials", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c49", skill: "voip", title: "Introducción a VoIP", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c50", skill: "fiber optics", title: "Fundamentos de fibra óptica", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c51", skill: "vpn", title: "Fundamentos de VPN", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c52", skill: "ccna", title: "CCNA 200-301", provider: "Cisco Networking Academy", url: "https://www.netacad.com/", level: "Intermedio" },
    { id: "c53", skill: "derecho", title: "Fundamentos de derecho", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c54", skill: "gestión legal", title: "Gestión legal y documental", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c55", skill: "contratos", title: "Contratos y negociación", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c56", skill: "documentación legal", title: "Documentación legal y procesos", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c57", skill: "legaltech", title: "Introducción a LegalTech", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c58", skill: "medicina", title: "Introducción a la medicina", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c59", skill: "historia clínica electrónica", title: "Fundamentos de EHR", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c60", skill: "pacs", title: "Fundamentos de PACS", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c61", skill: "telemedicina", title: "Telemedicina y salud digital", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c62", skill: "arquitectura", title: "Fundamentos de arquitectura", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c63", skill: "revit architecture", title: "Revit Architecture Basics", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c64", skill: "lumion", title: "Lumion Essentials", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c65", skill: "psicología", title: "Introducción a la psicología", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c66", skill: "evaluación psicológica", title: "Evaluación psicológica básica", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c67", skill: "psicoterapia", title: "Fundamentos de psicoterapia", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c68", skill: "trabajo social", title: "Fundamentos de trabajo social", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c69", skill: "contabilidad", title: "Contabilidad básica", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c70", skill: "finanzas", title: "Fundamentos de finanzas", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c71", skill: "presupuestos", title: "Presupuestos y control financiero", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c72", skill: "impuestos", title: "Fundamentos de impuestos", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c73", skill: "quickbooks", title: "QuickBooks Essentials", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c74", skill: "educación", title: "Fundamentos de educación", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c75", skill: "didáctica", title: "Didáctica y enseñanza", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c76", skill: "moodle", title: "Moodle para docentes", provider: "Moodle", url: "https://moodle.org/", level: "Básico" },
    { id: "c77", skill: "zoom", title: "Uso avanzado de Zoom", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c78", skill: "teams", title: "Microsoft Teams para trabajo colaborativo", provider: "Microsoft Learn", url: "https://learn.microsoft.com/", level: "Básico" },
    { id: "c79", skill: "investigación social", title: "Investigación social básica", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c80", skill: "análisis cualitativo", title: "Análisis cualitativo", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
    { id: "c81", skill: "monitoreo y evaluación", title: "Monitoreo y evaluación de programas", provider: "Coursera", url: "https://www.coursera.org/", level: "Básico" },
  ],
};

// Búsqueda de una habilidad en Udemy (siempre lleva a cursos reales).
const udemySearch = (skill) => `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skill)}`;

// Habilidades técnicas frecuentes que faltaban en el catálogo. Sus cursos
// apuntan directamente a Udemy para tener siempre una opción concreta.
const EXTRA_UDEMY_COURSES = [
  ["html", "HTML5 desde cero"],
  ["css", "CSS y diseño web responsivo"],
  ["tailwind css", "Tailwind CSS práctico"],
  ["angular", "Angular de principio a fin"],
  ["vue", "Vue.js desde cero"],
  ["next.js", "Next.js: React para producción"],
  ["express", "APIs REST con Express y Node"],
  ["mongodb", "MongoDB para desarrolladores"],
  ["postgresql", "PostgreSQL desde cero"],
  ["mysql", "Bases de datos con MySQL"],
  ["c#", "Programación en C#"],
  [".net", "Desarrollo con .NET"],
  ["php", "PHP moderno"],
  ["laravel", "Laravel desde cero"],
  ["django", "Django: web con Python"],
  ["flask", "APIs con Flask"],
  ["spring boot", "Spring Boot para Java"],
  ["kotlin", "Kotlin para Android"],
  ["swift", "Swift e iOS"],
  ["flutter", "Flutter: apps móviles"],
  ["react native", "React Native desde cero"],
  ["kubernetes", "Kubernetes para desarrolladores"],
  ["azure", "Microsoft Azure Fundamentals"],
  ["google cloud", "Google Cloud esencial"],
  ["power bi", "Power BI de cero a experto"],
  ["tableau", "Análisis y dashboards con Tableau"],
  ["machine learning", "Machine Learning práctico"],
  ["pandas", "Análisis de datos con Pandas"],
  ["scrum", "Scrum y metodologías ágiles"],
  ["agile", "Gestión ágil de proyectos"],
  ["jira", "Gestión de proyectos con Jira"],
  ["postman", "Pruebas de API con Postman"],
];

const existingSkills = new Set(defaultData.courses.map((c) => c.skill.toLowerCase()));
let nextCourseId = defaultData.courses.length + 1;
for (const [skill, title] of EXTRA_UDEMY_COURSES) {
  if (existingSkills.has(skill.toLowerCase())) continue; // no duplicar
  defaultData.courses.push({ id: `c${nextCourseId++}`, skill, title, provider: "Udemy", url: udemySearch(skill), level: "Variable" });
  existingSkills.add(skill.toLowerCase());
}

// Los cursos que quedaron apuntando a la página genérica de Coursera (sin un
// curso específico) se redirigen a una búsqueda real en Udemy por su habilidad,
// para que el enlace siempre lleve a cursos concretos en vez de a una portada.
for (const course of defaultData.courses) {
  if (/^https:\/\/www\.coursera\.org\/?$/.test(course.url)) {
    course.url = udemySearch(course.skill);
    course.provider = "Udemy";
  }
}

const adapter = new JSONFile(dbFile);
export const db = new Low(adapter, defaultData);

export async function initDb() {
  await db.read();
  db.data ||= defaultData;
  // Ensure new fields exist if db.json already existed from a previous run
  db.data.users ||= [];
  db.data.jobs ||= [];
  db.data.applications ||= [];
  // El catálogo de cursos es data de referencia (no lo editan los usuarios), así
  // que lo refrescamos siempre desde el código. De este modo, una base ya
  // existente en producción (volumen) recibe los cursos nuevos y los enlaces
  // actualizados a Udemy sin necesidad de borrar la base.
  db.data.courses = defaultData.courses;
  await db.write();
}
