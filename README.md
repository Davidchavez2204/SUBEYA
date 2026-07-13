# SUBEYA — Plataforma de matching Egresado ↔ Empresa

Monorepo con dos partes independientes:

```
subeya/
├── client/   → Frontend (React + Vite + Tailwind v4)
└── server/   → Backend (Node.js + Express + lowdb)
```

## Funcionalidades implementadas

- **Empresa**: se registra, publica ofertas laborales (requisitos técnicos + habilidades
  blandas), revisa sus ofertas y ve a los postulantes ordenados por % de coincidencia,
  con las brechas de habilidades y cursos sugeridos para cada candidato. Puede cambiar
  manualmente el estado de cada postulación (Recibido / En revisión / Rechazado).
- **Egresado**: se registra, completa su perfil de habilidades técnicas/blandas —ya sea
  **subiendo su CV para autocompletarlo** o agregándolas manualmente, o ambas cosas—,
  navega las ofertas publicadas viendo su % de match con cada una, y postula subiendo
  su CV (puede reusar el CV ya guardado en su perfil o subir uno distinto para esa
  postulación puntual). Puede ver el estado de sus postulaciones (Recibido / En
  revisión / Rechazado) y los cursos sugeridos para mejorar su compatibilidad.
- **Estados de la postulación**: toda postulación nace como `Recibido`. En cuanto la
  empresa abre la lista de postulantes de esa oferta, pasa automáticamente a
  `En revisión` (el egresado lo ve reflejado en su panel). La empresa también puede
  cambiar el estado manualmente en cualquier momento (por ejemplo, a `Rechazado`) desde
  un selector en cada tarjeta de postulante.

### Corrección: "el primer inicio de sesión no redirige al panel"

Había una condición de carrera entre la navegación (wouter) y la actualización del
usuario en el contexto de autenticación: justo después de iniciar sesión, la ruta
`/egresado` o `/empresa` podía renderizarse un instante antes de que React propagara el
nuevo usuario, así que `ProtectedRoute` redirigía a "/" por no encontrar sesión todavía.

La corrección definitiva está en `client/src/lib/auth-context.tsx`: `login`, `register`
y `logout` ahora usan `flushSync` de React para aplicar el cambio de usuario de forma
síncrona *antes* de que el código que sigue (la navegación) se ejecute — cerrando la
carrera de raíz en vez de solo mitigarla. Además, `ProtectedRoute` y `DashboardRedirect`
(en `client/src/App.tsx`) siguen teniendo una verificación de respaldo: si no hay
usuario en contexto pero sí un token guardado, confirman la sesión contra
`/api/auth/me` antes de redirigir, por si ocurriera cualquier otra carrera similar.

### Nuevo: años de experiencia mínimos por oferta

Al publicar una oferta, la empresa ahora define explícitamente los **años de
experiencia mínimos** que pide (además del seniority, que queda como campo
informativo). Ese número —no una tabla fija por seniority— es el que se usa en el 20%
de "experiencia" del cálculo de match, así que dos ofertas "Junior" pueden pedir
experiencia distinta si la empresa así lo define. Se puede editar después desde
`PATCH /api/jobs/:id`. Se ve reflejado tanto en las tarjetas de oferta (egresado,
empresa y landing) como en el desglose de "Experiencia laboral" de cada postulación.
- **Autocompletado de perfil desde el CV**: al subir un CV (PDF o Word `.docx`) en la
  pestaña "Mi perfil", el backend extrae el texto del archivo y detecta:
  - Habilidades técnicas y blandas conocidas (diccionario en
    `server/src/utils/skillsDictionary.js`), que se agregan a la lista editable.
  - **Experiencia laboral**: busca la sección "Experiencia" del CV, identifica rangos de
    fechas (ej. "Enero 2022 – Presente", "03/2021 - 12/2021") y calcula los años totales
    de experiencia sin contar dos veces los períodos que se traslapan
    (`server/src/utils/experienceExtractor.js`).

  El egresado siempre revisa el resultado antes de guardar: puede quitar lo que no
  aplique (habilidades o experiencias mal detectadas) y corregir manualmente los años
  de experiencia con un campo numérico.
- **Lógica de negocio (matching)**: el backend calcula el % de coincidencia con la
  fórmula `60% habilidades técnicas + 20% habilidades blandas + 20% experiencia laboral`
  comparando el perfil del egresado (incluyendo los años de experiencia detectados en su
  CV, o corregidos a mano) contra los **años de experiencia mínimos que la empresa
  define al publicar la oferta** (campo `minExperienceYears`, independiente del
  seniority, que queda solo como etiqueta informativa). Con las habilidades faltantes,
  sugiere cursos de un catálogo (o una búsqueda genérica si la habilidad no está en el
  catálogo). Si una oferta antigua no tuviera ese campo, se usa como respaldo una tabla
  simple por seniority (`Practicante`/`Junior` = 0, `Semi Senior` = 2+, `Senior` = 4+)
  definida en `MIN_YEARS_BY_SENIORITY` dentro de `server/src/utils/matching.js`.

No hay backend/IA externo: todo el cálculo de match, la extracción de texto del CV, la
detección de experiencia y las sugerencias de cursos corren en el propio servidor Node
(`server/src/utils/matching.js`, `server/src/utils/skillsDictionary.js` y
`server/src/utils/experienceExtractor.js`), así que es 100% predecible, auditable y no
depende de ninguna API de pago.

> **Nota sobre la extracción de experiencia**: al igual que con las habilidades, es una
> heurística de texto (busca la sección "Experiencia" y rangos de fechas), no un modelo
> de lenguaje. Funciona bien con CVs que siguen un formato razonablemente estándar, pero
> puede fallar con formatos muy creativos o CVs escaneados como imagen (sin texto
> seleccionable). Por eso el egresado siempre puede corregir el resultado a mano.

> **Nota sobre el reconocimiento de habilidades**: la extracción es por coincidencia de
> texto contra un diccionario (no usa un modelo de lenguaje), así que es instantánea y
> gratuita, pero solo reconoce las habilidades listadas en ese diccionario. Es fácil de
> ampliar: solo hay que agregar términos a los arreglos `TECH_SKILLS` / `SOFT_SKILLS` en
> `server/src/utils/skillsDictionary.js`. Si más adelante quieres reconocimiento más
> flexible (sinónimos, redacción libre), el siguiente paso natural es enviar el texto
> extraído del CV a un modelo de lenguaje (por ejemplo la API de Claude) para que
> devuelva las habilidades en formato JSON.

---

## 1. Levantar el proyecto en tu máquina (desarrollo local)

Requisitos: **Node.js 18 o superior** (recomendado 20+) y npm. No se necesita ninguna
base de datos externa: el backend usa un archivo JSON local (`server/data/db.json`)
como base de datos, y los CVs se guardan en `server/uploads/cvs/`.

### 1.1. Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

El backend queda escuchando en `http://localhost:4000`. Puedes probar que funciona
abriendo `http://localhost:4000/api/health` (debe responder `{"ok":true}`).

Variables de entorno (`server/.env`):

| Variable       | Descripción                                              | Valor por defecto              |
|----------------|-----------------------------------------------------------|---------------------------------|
| `PORT`         | Puerto del backend                                        | `4000`                          |
| `JWT_SECRET`   | Clave para firmar los tokens de sesión                    | *(cámbiala en producción)*      |
| `CLIENT_ORIGIN`| Origen permitido por CORS (la URL del frontend)            | `http://localhost:5173`         |

### 1.2. Frontend

En otra terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Se abre en `http://localhost:5173`. La variable `client/.env` debe apuntar al backend:

```
VITE_API_URL=http://localhost:4000/api
```

### 1.3. Probar el flujo completo

1. Entra a `http://localhost:5173`, haz clic en **Registrarse** → elige **Empresa**.
2. Publica una oferta con requisitos técnicos (ej. `React`, `SQL`) y blandos
   (ej. `Trabajo en equipo`).
3. Abre una ventana de incógnito, regístrate como **Egresado**, ve a **Mi perfil** y
   sube un CV en PDF o Word (`.docx`) que mencione algunas de esas habilidades —se
   detectarán automáticamente—. Ajusta la lista a mano si hace falta y guarda el perfil.
4. En la pestaña **Ofertas laborales** verás el % de match calculado en vivo. Ábrela y
   postula: por defecto se usa el CV que ya tienes guardado en el perfil, o puedes subir
   uno distinto solo para esa postulación.
5. Vuelve a la sesión de la Empresa → pestaña **Mis ofertas** → botón de postulantes:
   verás al egresado con su % de match, sus habilidades, el CV descargable y los
   cursos sugeridos para cerrar sus brechas.

---

## 2. Desplegar para la feria del jueves (acceso público desde celulares)

Contexto de este despliegue: proyecto estudiantil, un solo día de uso, ~100 personas a
lo largo del día pero pocas al mismo tiempo, sin fines de lucro. Con ese perfil, la
combinación más simple y confiable es:

- **Backend → Railway** (con un volumen persistente, para que los datos y CVs no se
  borren si el servidor se reinicia durante el día).
- **Frontend → Vercel** (gratis, no se "duerme", URL estable para poner en un QR).

Evita Render en su plan gratuito para este caso puntual: se "duerme" tras ~15 min sin
tráfico y la primera persona que entre después de esa pausa esperaría ~30-50 segundos
de carga — mala primera impresión en un stand. Railway no tiene ese comportamiento tan
agresivo y admite volúmenes persistentes incluso en el plan de prueba gratuito.

### Paso 1 — Sube el proyecto a GitHub

```bash
cd subeya
git init
git add .
git commit -m "SUBEYA - versión feria"
```
Crea un repositorio en GitHub y súbelo (`git remote add origin ...` y `git push`).

### Paso 2 — Backend en Railway

1. Entra a [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → elige tu repositorio.
2. En la configuración del servicio, define **Root Directory: `server`** (Railway detecta Node.js y usa `npm install` + `npm start` automáticamente gracias al `railway.json` incluido).
3. En la pestaña **Variables**, agrega:
   ```
   JWT_SECRET=<genera un valor largo y aleatorio>
   CLIENT_ORIGIN=https://<lo-que-sea-por-ahora>.vercel.app
   DATA_DIR=/data
   UPLOADS_DIR=/data/uploads/cvs
   ```
   (`CLIENT_ORIGIN` lo corriges en el paso 4, cuando ya tengas la URL real de Vercel.)
4. En la pestaña **Volumes**, crea un volumen y móntalo en `/data`. Esto hace que `db.json` y los CVs subidos sobrevivan a reinicios del servicio durante todo el día.
5. Genera el dominio público del servicio (**Settings → Networking → Generate Domain**). Copia esa URL, por ejemplo `https://subeya-api-production.up.railway.app`.

### Paso 3 — Frontend en Vercel

1. Entra a [vercel.com](https://vercel.com) → **Add New Project** → importa el mismo repositorio de GitHub.
2. Framework: Vercel detecta Vite automáticamente. Define **Root Directory: `client`**.
3. En **Environment Variables**, agrega:
   ```
   VITE_API_URL=https://subeya-api-production.up.railway.app/api
   ```
   (usa la URL real de Railway del paso anterior, con `/api` al final).
4. Deploy. Vercel te da una URL como `https://subeya.vercel.app` (o un dominio personalizado si configuras uno). El archivo `client/vercel.json` ya incluido hace que las rutas internas (`/egresado`, `/empresa`) funcionen aunque alguien entre directo o recargue la página.

### Paso 4 — Conecta ambos y precarga datos de demo

1. Vuelve a Railway → Variables → actualiza `CLIENT_ORIGIN` con la URL real de Vercel del paso 3 (sin `/` al final) → el servicio se reinicia solo.
2. Precarga un par de empresas y ofertas de ejemplo para que el stand no arranque vacío. Puedes correr el script localmente apuntando a Railway, o más simple: ábrelo una vez desde tu máquina apuntando a una copia local antes de subir el `db.json` inicial, **o** usa la pestaña "Shell"/"Run Command" de Railway (si tu plan la incluye) para ejecutar:
   ```bash
   node scripts/seed-demo.js
   ```
   Esto crea 2 empresas demo con 2 ofertas cada una (`server/scripts/seed-demo.js` — ahí puedes editar los datos si quieres otras ofertas). Es seguro correrlo más de una vez: si el correo ya existe, lo salta.
3. Genera un código QR apuntando a tu URL de Vercel (cualquier generador gratuito de QR sirve) e imprímelo para el stand.

### Antes del jueves: checklist de ensayo

- [ ] Probar el flujo completo **desde un celular con datos móviles** (no solo wifi de casa/universidad): registro de empresa, publicar oferta, registro de egresado, subir CV, postular, cambiar estado, ver cursos sugeridos.
- [ ] Verificar que `JWT_SECRET` en Railway NO sea el de `.env.example`.
- [ ] Verificar que `CLIENT_ORIGIN` (Railway) y `VITE_API_URL` (Vercel) apunten exactamente a las URLs finales, con `https://`.
- [ ] Confirmar que el volumen de Railway está montado en `/data` antes de sembrar los datos de demo (si lo agregas después, el `db.json` sembrado sin volumen se perderá en el próximo reinicio).
- [ ] Tener a mano el usuario/contraseña de las empresas demo (`server/scripts/seed-demo.js` los imprime en consola) por si quieres mostrar el panel de empresa sin registrar una cuenta en vivo.
- [ ] Guardar una copia del repositorio de GitHub como respaldo (no dependes de tu laptop el día de la feria; si algo falla, puedes volver a desplegar desde ahí en minutos).

### Alternativas (si más adelante el proyecto crece)

<details>
<summary>Ver opciones de VPS propio y otros proveedores</summary>

#### Un VPS (Ubuntu) con Nginx + PM2

1. **Backend**
   ```bash
   cd server
   npm install --omit=dev
   ```
   Crea `server/.env` en el servidor con un `JWT_SECRET` largo y aleatorio, y
   `CLIENT_ORIGIN=https://tu-dominio.com`. Corre el proceso con PM2 para que quede
   siempre activo:
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name subeya-api
   pm2 save
   pm2 startup
   ```
   Recuerda: `server/data/` y `server/uploads/` (o las rutas que definas en `DATA_DIR` /
   `UPLOADS_DIR`) deben persistir entre despliegues.

2. **Frontend**
   ```bash
   cd client
   echo "VITE_API_URL=https://api.tu-dominio.com/api" > .env
   npm install
   npm run build
   ```
   Esto genera `client/dist/`. Sirve esa carpeta como sitio estático con Nginx.

3. **Nginx** (ejemplo simplificado):
   ```nginx
   # Frontend estático
   server {
     listen 80;
     server_name tu-dominio.com;
     root /ruta/a/subeya/client/dist;
     try_files $uri /index.html;
   }

   # Backend API (proxy)
   server {
     listen 80;
     server_name api.tu-dominio.com;
     location / {
       proxy_pass http://localhost:4000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
   }
   ```
   Agrega HTTPS con `certbot --nginx` para ambos dominios.

#### Otros proveedores administrados

- **Frontend**: Netlify también funciona (`client/public/_redirects` ya incluido para
  las rutas internas).
- **Backend**: Render o Fly.io también sirven; en Render usa Render Disks (plan pago)
  para persistencia, ya que su disco gratuito es efímero.

</details>

### Checklist general de producción (más allá de la feria)

- [ ] `JWT_SECRET` cambiado por un valor largo y aleatorio (no uses el de `.env.example`).
- [ ] `CLIENT_ORIGIN` del backend apunta exactamente al dominio del frontend (con `https://`).
- [ ] `VITE_API_URL` del frontend apunta al dominio del backend.
- [ ] HTTPS habilitado en ambos dominios.
- [ ] Volumen persistente para los datos y CVs (o migración a una BD real, ver sección 3).
- [ ] Backups periódicos de la carpeta de datos.

---

## 3. Siguiente paso natural: migrar de archivo JSON a una base de datos real

`lowdb` (el archivo `db.json`) es ideal para desarrollar rápido y para un primer
despliegue, pero no escala bien con mucha concurrencia. Cuando el proyecto crezca, el
cambio más directo es reemplazar `server/src/db.js` por Postgres (con Prisma o
Drizzle) o MongoDB, manteniendo intactas las rutas (`routes/*.js`) y la lógica de
matching (`utils/matching.js`), que no dependen de lowdb directamente.

## Estructura de carpetas

```
server/
├── src/
│   ├── index.js          # servidor Express
│   ├── db.js              # lowdb + catálogo de cursos semilla (DATA_DIR configurable)
│   ├── middleware/auth.js # JWT
│   ├── utils/
│   │   ├── matching.js              # % de match (técnicas + blandas + experiencia)
│   │   ├── cvStorage.js             # subida de CVs + extracción de texto (PDF/DOCX)
│   │   ├── skillsDictionary.js      # diccionario de habilidades + detección en texto
│   │   └── experienceExtractor.js   # detección de experiencia laboral en el CV
│   └── routes/            # auth, profile, jobs, applications
├── scripts/seed-demo.js   # precarga empresas/ofertas de demo para la feria
├── railway.json           # config de despliegue en Railway
├── uploads/cvs/           # CVs subidos (perfil y postulaciones) — UPLOADS_DIR configurable
└── data/db.json           # "base de datos" (se crea sola al iniciar)

client/
├── src/
│   ├── App.tsx                    # landing + auth modal + routing
│   ├── pages/egresado-dashboard.tsx
│   ├── pages/empresa-dashboard.tsx
│   ├── components/                # MatchRing, SkillMatchBreakdown, ExperienceFit, etc.
│   └── lib/api.ts, auth-context.tsx, application-status.ts
├── vercel.json             # rewrite de rutas SPA para Vercel
└── public/_redirects       # rewrite de rutas SPA para Netlify
```
