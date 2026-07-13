# Guía de despliegue de SUBEYA (Railway + Vercel)

- **Backend (API):** Node/Express + lowdb → **Railway** (con **Volumen** persistente para `db.json` y los CVs).
- **Frontend (web):** React + Vite → **Vercel** (estático, gratis y sencillo).

> ¿Por qué Railway para el backend? Porque Subeya guarda usuarios, ofertas y **CVs en el disco**, y el
> Volumen de Railway conserva esos datos entre reinicios (a diferencia del plan gratis de Render).

---

## 👇 Lo más importante (por esto "no te salían las opciones")

En Railway, **Root Directory, Volumen y Generate Domain NO están en la pantalla del proyecto**.
Están **dentro del servicio**. El flujo es:

1. Creas el proyecto y se dibuja una **tarjeta de servicio** en el lienzo (canvas).
2. **Haz clic en esa tarjeta** para abrir el servicio. Recién ahí aparecen las pestañas:
   **Deployments · Variables · Metrics · Settings**.
3. Todas las opciones que buscas viven en **Settings** (y las variables de entorno en **Variables**).

Si te quedaste en la vista del canvas sin abrir el servicio, no verás nada de eso. Ese era el detalle.

---

## 0. Preparación

1. Sube el proyecto a **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "SUBEYA listo para desplegar"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/subeya.git
   git push -u origin main
   ```
2. Verifica local que compila:
   ```bash
   cd server && npm install && npm start        # "SUBEYA API escuchando..."
   cd ../client && npm install && npm run typecheck && npm run build
   ```
3. Conecta tu cuenta de GitHub a Railway (una sola vez) en https://railway.com/dashboard.

> Nota: Railway ya no tiene "tier gratis permanente"; da un **crédito de prueba** y luego el plan
> **Hobby (~US$5/mes)**. Con eso te sobra para la feria. El **Volumen** puede requerir que el plan esté
> activo; si no ves la opción de Volumen, revisa que tu workspace tenga plan/crédito activo.

---

## 1. Backend en Railway (paso a paso con la UI actual)

### 1.1 Crear el proyecto y el servicio
1. En https://railway.com/dashboard → **`+ New Project`**.
2. Elige **`Deploy from GitHub repo`** → selecciona tu repo `subeya`.
   - Railway crea el proyecto y una **tarjeta de servicio** en el canvas.

### 1.2 Abrir el servicio y apuntar a la carpeta `server`
3. **Haz clic en la tarjeta del servicio** para abrirlo.
4. Ve a la pestaña **`Settings`**.
5. Busca la sección **`Source`** → campo **`Root Directory`** → escribe: `server`
   (Esto le dice a Railway que solo construya el backend, no todo el repo.)
6. En la misma pestaña **Settings**, sección **`Build` / `Deploy`**, confirma:
   - **Start Command:** `npm start`  *(normalmente lo detecta solo por `railway.json`)*

### 1.3 Variables de entorno
7. Pestaña **`Variables`** → botón **`+ New Variable`** y agrega:

   | Variable | Valor |
   |---|---|
   | `JWT_SECRET` | una cadena larga y aleatoria (genera con `openssl rand -hex 32`) |
   | `DATA_DIR` | `/data` |
   | `UPLOADS_DIR` | `/data/uploads/cvs` |
   | `CLIENT_ORIGIN` | *(la llenas en el paso 3, con la URL de Vercel)* |

   > **No** agregues `PORT`: Railway la inyecta sola y el server ya la lee.

### 1.4 Volumen persistente (clave para no perder datos ni CVs)
8. En el **canvas del proyecto**, **haz clic derecho sobre la tarjeta del servicio** → **`Attach Volume`**
   (alternativa: dentro del servicio, **Settings → Volumes → New/Attach Volume**).
9. Configura el volumen:
   - **Mount Path:** `/data`
   - Tamaño: 1 GB es suficiente para la feria.
10. Railway redepliega. Como pusiste `DATA_DIR=/data` y `UPLOADS_DIR=/data/uploads/cvs`, la base y los CVs
    quedan **dentro del volumen** y sobreviven a reinicios y redeploys.

### 1.5 Generar el dominio público
11. Dentro del servicio → **Settings** → sección **`Networking`** (o **Public Networking**) →
    botón **`Generate Domain`**.
    - Railway detecta el puerto solo. Copia la URL, ej: `https://subeya-production.up.railway.app`
12. Prueba: abre `https://TU-API.up.railway.app/api/health` → debe responder `{"ok":true,...}`.

---

## 2. Frontend en Vercel

1. https://vercel.com → **Add New → Project** → importa el mismo repo.
2. Configuración:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (lo detecta solo)
   - **Build Command:** `npm run build` · **Output Directory:** `dist`
3. **Environment Variables:**

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | `https://TU-API.up.railway.app/api`  *(¡con el `/api` al final!)* |

4. **Deploy** y copia la URL, ej: `https://subeya.vercel.app`

> ¿Quieres TODO en Railway? Se puede, pero el frontend Vite necesitaría un servicio aparte que sirva
> los archivos estáticos (segundo servicio, Root Directory `client`, y un start como `npx serve dist`).
> Para una feria, Vercel es más rápido y gratis; por eso lo recomiendo.

---

## 3. Conectar los dos (CORS)

1. Vuelve a **Railway → tu servicio → Variables** y pon en `CLIENT_ORIGIN` la URL exacta de Vercel
   (sin `/` final): `https://subeya.vercel.app`
2. Railway redepliega el backend solo. Listo.

> Errores de CORS en la consola = casi siempre `CLIENT_ORIGIN` no coincide **exactamente** con la URL
> de Vercel (revisa http/https y que no sobre una `/`).

---

## 4. Datos de demo (opcional, recomendado)

`server/scripts/seed-demo.js` puebla la base con empresas, egresados y ofertas de ejemplo.
Córrelo apuntando a producción, o regístrate manualmente (con el Volumen, los datos se conservan).
Revisa ese script para ver usuarios/contraseñas de prueba.

---

## 5. Checklist final antes de la feria

- [ ] `https://TU-API/api/health` responde `ok`.
- [ ] Registro como egresado y como empresa funciona.
- [ ] Una empresa **publica** una oferta y aparece en la landing y el panel del egresado.
- [ ] Un egresado **sube su CV**, se autocompletan habilidades y ve su **% de match**.
- [ ] El egresado **postula** y luego puede **retirar** la postulación.
- [ ] La empresa ve postulantes por match, marca **Aceptado/Rechazado** y **elimina** ofertas.
- [ ] Probado en **celular** y con rutas directas (`/egresado`, `/empresa`).
- [ ] Reinicia el backend en Railway y confirma que **los datos siguen ahí** (prueba del Volumen).

---

## 6. Si algo no aparece (troubleshooting de la UI de Railway)

| "No veo..." | Dónde está realmente |
|---|---|
| **Root Directory** | Clic en la tarjeta del servicio → **Settings** → sección **Source** |
| **Variables de entorno** | Clic en el servicio → pestaña **Variables** (no en Settings) |
| **Attach Volume** | **Clic derecho** sobre la tarjeta del servicio en el canvas → **Attach Volume** |
| **Generate Domain** | Servicio → **Settings** → **Networking** → **Generate Domain** |
| **Start/Build Command** | Servicio → **Settings** → **Deploy / Build** |
| La opción de **Volumen no aparece** | Verifica que tu workspace tenga **plan/crédito activo** (Hobby) |

> Regla de oro: **primero abre el servicio** (clic en su tarjeta). Casi todo lo que buscabas está adentro,
> no en la vista general del proyecto.

---

## Notas técnicas

- **Persistencia:** todo el estado vive en el volumen `/data` (`db.json` + `uploads/cvs`). Sin volumen,
  cada redeploy borra los datos.
- **Seguridad:** cambia `JWT_SECRET` por algo aleatorio. Las contraseñas ya se guardan con hash (bcrypt).
- **Escala futura:** lowdb (archivo) es perfecto para demo; para producción con muchos usuarios conviene
  migrar a Postgres.
