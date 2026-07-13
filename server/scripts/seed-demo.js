// Script de una sola vez para precargar SUBEYA con empresas y ofertas de
// demostración antes de la feria, así el stand no arranca con la plataforma vacía.
//
// Uso:
//   cd server
//   node scripts/seed-demo.js
//
// Es seguro correrlo varias veces: si el correo ya existe, se salta esa empresa
// en vez de duplicarla.

import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, initDb } from "../src/db.js";

const DEMO_PASSWORD = "Demo1234";

const DEMO_COMPANIES = [
  {
    email: "rrhh@nimbustech.demo",
    name: "Nimbus Tech",
    companyName: "Nimbus Tech",
    sector: "Tecnología / Software",
    description: "Empresa de desarrollo de software a la medida, especializada en aplicaciones web y móviles para clientes en Latinoamérica.",
    jobs: [
      {
        title: "Desarrollador Frontend Junior",
        description: "Buscamos un/a desarrollador/a frontend junior para sumarse al equipo de producto. Trabajarás con React y TypeScript construyendo nuevas funcionalidades junto a un equipo senior que te acompañará en tu crecimiento.",
        techRequirements: ["JavaScript", "React", "HTML", "CSS", "Git"],
        softRequirements: ["Trabajo en equipo", "Comunicación", "Adaptabilidad"],
        modality: "Híbrido",
        location: "Lima, Perú",
        seniority: "Junior",
        minExperienceYears: 0,
      },
      {
        title: "Practicante de Desarrollo Backend",
        description: "Prácticas pre-profesionales en el equipo de backend, apoyando en el desarrollo de APIs REST y mantenimiento de servicios existentes.",
        techRequirements: ["Node.js", "SQL", "Git"],
        softRequirements: ["Proactividad", "Aprendizaje continuo"],
        modality: "Remoto",
        location: "Lima, Perú",
        seniority: "Practicante",
        minExperienceYears: 0,
      },
    ],
  },
  {
    email: "talento@databridge.demo",
    name: "DataBridge Analytics",
    companyName: "DataBridge Analytics",
    sector: "Datos / Analítica",
    description: "Consultora de datos que ayuda a empresas medianas a tomar mejores decisiones con dashboards, reportes y modelos predictivos.",
    jobs: [
      {
        title: "Analista de Datos Junior",
        description: "Apoyarás en la limpieza, análisis y visualización de datos para clientes de retail y banca. Ideal para egresados de Ingeniería, Estadística o carreras afines.",
        techRequirements: ["SQL", "Excel", "Python"],
        softRequirements: ["Pensamiento crítico", "Atención al detalle", "Comunicación"],
        modality: "Híbrido",
        location: "Arequipa, Perú",
        seniority: "Junior",
        minExperienceYears: 1,
      },
      {
        title: "Especialista en Business Intelligence",
        description: "Buscamos a alguien con experiencia armando dashboards y reportes ejecutivos para liderar la relación con clientes clave.",
        techRequirements: ["Power BI", "SQL", "Excel"],
        softRequirements: ["Liderazgo", "Orientación al cliente", "Negociación"],
        modality: "Presencial",
        location: "Lima, Perú",
        seniority: "Semi Senior",
        minExperienceYears: 3,
      },
    ],
  },
];

async function main() {
  await initDb();
  await db.read();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const company of DEMO_COMPANIES) {
    const exists = db.data.users.find((u) => u.email === company.email);
    if (exists) {
      console.log(`- Ya existe "${company.companyName}", se omite.`);
      continue;
    }

    const companyUser = {
      id: crypto.randomUUID(),
      email: company.email,
      passwordHash,
      name: company.name,
      role: "empresa",
      createdAt: new Date().toISOString(),
      profile: {
        companyName: company.companyName,
        sector: company.sector,
        description: company.description,
      },
    };
    db.data.users.push(companyUser);

    for (const job of company.jobs) {
      db.data.jobs.push({
        id: crypto.randomUUID(),
        companyId: companyUser.id,
        title: job.title,
        description: job.description,
        techRequirements: job.techRequirements,
        softRequirements: job.softRequirements,
        modality: job.modality,
        location: job.location,
        seniority: job.seniority,
        minExperienceYears: job.minExperienceYears ?? 0,
        status: "publicada",
        createdAt: new Date().toISOString(),
      });
    }

    console.log(`✔ Creada "${company.companyName}" con ${company.jobs.length} oferta(s). Login: ${company.email} / ${DEMO_PASSWORD}`);
  }

  await db.write();
  console.log("\nListo. Recuerda estas credenciales de demo para mostrar el panel de empresa si lo necesitas:");
  for (const c of DEMO_COMPANIES) console.log(`  - ${c.email} / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error("Error al sembrar datos de demo:", err);
  process.exit(1);
});
