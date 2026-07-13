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
  ],
};

const adapter = new JSONFile(dbFile);
export const db = new Low(adapter, defaultData);

export async function initDb() {
  await db.read();
  db.data ||= defaultData;
  // Ensure new fields exist if db.json already existed from a previous run
  db.data.users ||= [];
  db.data.jobs ||= [];
  db.data.applications ||= [];
  db.data.courses ||= defaultData.courses;
  await db.write();
}
