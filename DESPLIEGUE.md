# Guía de despliegue de SUBEYA (para la feria)

Objetivo: dejar la app **en línea y pública** para que cualquiera pueda usarla desde su celular o laptop.

Arquitectura:

- **Backend (API):** Node/Express + lowdb → se despliega en **Railway** (necesita disco persistente para `db.json` y los CVs).
- **Frontend (web):** React + Vite → se despliega en **Vercel** (estático).

> Tiempo estimado: 20–30 min la primera vez. No necesitas tarjeta para el plan gratuito de Vercel; Railway pide verificación pero tiene crédito gratis mensual.

---

## 0. Antes de empezar

1. Sube el proyecto a un repositorio de **GitHub** (Railway y Vercel despliegan desde ahí).
   ```bash
   git init
   git add .
   git commit -m "SUBEYA listo para desplegar"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/subeya.git
   git push -u origin main
   ```
2. Verifica localmente que todo compila antes de subir:
   ```bash
   cd server && npm install && npm run start   # debe imprimir "SUBEYA API escuchando..."
   cd ../client && npm install && npm run typecheck && npm run build
   ```

---

## 1. Desplegar el BACKEND en Railway

1. Entra a https://railway.app → **New Project** → **Deploy from GitHub repo** → elige tu repo.
2. En **Settings → Root Directory** pon: `server`
   (así Railway solo construye la carpeta del backend).
3. Railway detecta Node automáticamente (ya existe `server/railway.json` con `npm start`).
4. **Añade un volumen persistente** (clave: si no, se pierden los CVs y usuarios al reiniciar):
   - **Settings → Volumes → New Volume**
   - Mount path: `/data`
5. **Variables de entorno** (Settings → Variables):

   | Variable | Valor |
   |---|---|
   | `JWT_SECRET` | una cadena larga y aleatoria (ej. genera una con `openssl rand -hex 32`) |
   | `CLIENT_ORIGIN` | *(lo llenas en el paso 3, con la URL de Vercel)* |
   | `DATA_DIR` | `/data` |
   | `UPLOADS_DIR` | `/data/uploads/cvs` |
   | `PORT` | *(no la pongas: Railway la inyecta sola)* |

6. Espera a que el deploy termine y copia la **URL pública** del backend
   (Settings → Networking → Generate Domain). Ej: `https://subeya-api.up.railway.app`
7. Prueba: abre `https://TU-API.up.railway.app/api/health` → debe responder `{"ok":true,...}`.

---

## 2. Desplegar el FRONTEND en Vercel

1. Entra a https://vercel.com → **Add New → Project** → importa el mismo repo de GitHub.
2. En la configuración del proyecto:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (lo detecta solo)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Environment Variables** → agrega:

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | `https://TU-API.up.railway.app/api`  *(¡ojo con el `/api` al final!)* |

4. **Deploy.** Al terminar, copia la URL pública de la web. Ej: `https://subeya.vercel.app`

---

## 3. Conectar los dos (CORS)

1. Vuelve a **Railway → Variables** y pon en `CLIENT_ORIGIN` la URL exacta de Vercel
   (sin `/` final): `https://subeya.vercel.app`
2. Railway reinicia el backend solo. Listo: el frontend ya puede hablar con la API.

> Si ves errores de CORS en la consola del navegador, casi siempre es que `CLIENT_ORIGIN`
> no coincide **exactamente** con la URL de Vercel (revisa http/https y que no sobre una `/`).

---

## 4. Cargar datos de demo (opcional, recomendado para la feria)

El repo trae `server/scripts/seed-demo.js` para poblar la base con empresas, egresados y ofertas de ejemplo.
Puedes correrlo desde tu máquina apuntando a la API en producción, o localmente antes de subir.
Revisa ese script para ver los usuarios/contraseñas de prueba.

---

## 5. Checklist final antes de la feria

- [ ] `https://TU-API/api/health` responde `ok`.
- [ ] Puedes **registrarte** como egresado y como empresa.
- [ ] Una empresa **publica** una oferta y aparece en la landing y en el panel del egresado.
- [ ] Un egresado **sube su CV**, se autocompletan habilidades y ve su **% de match**.
- [ ] El egresado **postula** y luego puede **retirar** la postulación.
- [ ] La empresa ve postulantes ordenados por match, cambia estado a **Aceptado/Rechazado** y puede **eliminar** la oferta.
- [ ] Probado en un **celular** (la mayoría de asistentes usará el suyo).

---

## Notas técnicas

- **Persistencia:** en Railway TODO el estado vive en el volumen `/data` (`db.json` + `uploads/cvs`).
  Sin el volumen, cada redeploy borra los datos. Es una base tipo archivo (lowdb), ideal para demo;
  para producción real con muchos usuarios concurrentes conviene migrar a Postgres.
- **Seguridad para la feria:** cambia `JWT_SECRET` por algo aleatorio. Las contraseñas ya se guardan
  con hash (bcrypt).
- **Alternativa 1-click:** también puedes desplegar el backend en Render.com (mismo esquema: root `server`,
  start `npm start`, disco persistente montado en `/data`).
