# Revisión senior de SUBEYA (QA + código)

Fecha: 13/07/2026 · Alcance: revisión de código de todo el proyecto (frontend + backend) y plan de prueba.
Nota: la prueba interactiva en vivo (https://subeya.vercel.app) requería el navegador conectado; aquí va la
revisión a nivel de código, que cubre los mismos flujos, más un checklist para ejecutar en pantalla.

---

## ✅ Estado: correcciones aplicadas (13/07/2026)

- [x] **#1 Concurrencia (ALTA):** se serializan las peticiones a `/api` con una cola en `server/src/index.js`,
      eliminando el *lost update* de lowdb bajo varios usuarios simultáneos.
- [x] **#2 Eliminar oferta:** ya no se pierde el registro del egresado. La oferta se marca como "eliminada" y el
      egresado la ve así en "Mis postulaciones" (con el título original) y puede retirarla.
- [x] **#3 Descarga de CV:** ahora se descarga con cabecera `Authorization` (blob), sin token en la URL. Se expone
      `Content-Disposition` en CORS para conservar el nombre real del archivo.
- [x] **#4 Rate limiting:** nuevo `server/src/middleware/rateLimit.js` (sin dependencias) aplicado a login/registro,
      con `trust proxy` para la IP real.
- [x] **#5 Consistencia del match:** verificado que empresa y egresado usan el mismo cálculo (perfil actual); no hay
      inconsistencia visible. Sin cambios.
- [x] **#7 Diccionario de skills:** ampliado con ~40 tecnologías frecuentes.
- [x] **#9 Accesibilidad:** `aria-label` en los campos e íconos del modal de acceso.
- [ ] **#6 / #8 (opcionales):** botón "Retirar" se mantiene disponible salvo en "Aceptado" (permite reintentar);
      enlaces placeholder del footer se dejaron como estaban (cosméticos, no son bugs).

> Verificado por revisión de código sobre los archivos reales. Antes de desplegar, corre en tu máquina
> `cd client && npm run typecheck && npm run build` y `cd server && npm start` para una última confirmación.

---

## 🔴 Prioridad ALTA (recomendado arreglar antes de la feria)

### 1. Condición de carrera en la base de datos (lowdb) con varios usuarios a la vez
**Qué pasa:** cada endpoint hace `await db.read()` → modifica → `await db.write()`. `db.read()` **recarga en
memoria** todo `db.data` desde el archivo. Bajo concurrencia (varias personas usando el stand al mismo tiempo),
dos peticiones se intercalan en los `await` y una escritura pisa a la otra (*lost update*):

- Ej.: dos registros casi simultáneos → uno se guarda y el otro desaparece.
- Ej.: dos postulaciones al mismo tiempo → una se pierde, o el `db.json` queda en estado inconsistente.

**Por qué importa:** es exactamente el escenario de una feria con "varios usuarios" y es el riesgo #1 de robustez.
**Solución sugerida:** serializar las operaciones de lectura/escritura con un *mutex* o cola en proceso (una sola
escritura a la vez), o mantener `db.data` en memoria y escribir con cola. Es un cambio acotado. **Puedo implementarlo.**

---

## 🟠 Prioridad MEDIA

### 2. Al eliminar una oferta, la postulación del egresado desaparece sin aviso
Hoy `DELETE /jobs/:id` borra en cascada las postulaciones. El egresado deja de ver esa postulación en
"Mis postulaciones" **sin ninguna notificación** — puede pensar que se perdió algo. Existe código para mostrar
"Oferta eliminada" (con `job: null`) que ahora queda inactivo. Opciones: (a) conservar la postulación marcando la
oferta como eliminada, o (b) avisar al egresado. Es una **decisión de negocio**; hoy es coherente pero sorprende.

### 3. Token JWT viaja en la URL para descargar el CV (`?token=`)
Los tokens en *query string* pueden quedar en logs de servidor/proxy e historial del navegador. Aceptable para una
demo, pero para producción conviene descargar con cabecera `Authorization` (blob) o URLs firmadas de un solo uso.

### 4. Sin límite de intentos en login/registro
No hay *rate limiting*: permite fuerza bruta contra contraseñas. Riesgo bajo en la feria, pero es 1 línea con
`express-rate-limit` y suma robustez.

### 5. El % de match que ve la empresa se recalcula con el perfil ACTUAL del egresado
Se guarda `matchScoreAtApply` al postular, pero la lista de postulantes recalcula el match con el perfil vigente.
Si el egresado edita su perfil después de postular, la empresa ve un número distinto al del momento de postular.
Puede ser intencional (mostrar lo más reciente), pero conviene definir cuál es la "fuente de verdad" y ser consistente.

---

## 🟡 Prioridad BAJA / UX / detalle

6. **"Retirar postulación" también aparece en estado "Rechazado".** Retirar algo ya rechazado es poco útil; podrías
   ocultar el botón también en ese estado (hoy solo se oculta en "Aceptado").
7. **Extractor de CV solo reconoce habilidades del diccionario.** CVs con términos fuera de la lista, o escaneados
   como imagen (sin texto seleccionable), no detectan nada. Está bien manejado con un aviso, pero para la demo usa
   CVs con texto real. Considera ampliar el diccionario con las tecnologías más comunes de tus egresados.
8. **Enlaces placeholder en el footer y "Términos/Privacidad" (`href="#"`).** Antes de entregar al cliente,
   ocúltalos o apúntalos a contenido real para que no parezcan rotos.
9. **Accesibilidad:** varios inputs del modal de auth usan `placeholder` como etiqueta, sin `<label>`/`aria-label`.
   Mejorable para lectores de pantalla y buenas prácticas.
10. **Primera carga "en frío".** Con Railway + volumen el backend no se duerme (bien). Si algún día cambian de plan,
    la primera petición tardaría ~1 min; tenlo presente.

---

## ✅ Lo que está bien hecho (para balancear)

- Arquitectura limpia y separada (rutas, utils, middleware) y **código comentado en español**.
- **Matching transparente y ponderado** (60% técnicas / 20% blandas / 20% experiencia) y extracción de experiencia
  por heurística, sin depender de IA externa (rápido, gratis, predecible).
- **Validación de propiedad** (dueño) en cada endpoint sensible (editar/eliminar oferta, ver/retirar postulación, CV).
- Contraseñas con **hash bcrypt**; JWT con expiración; subida de CV limitada a 5 MB y solo PDF/DOCX.
- UI con **actualización optimista** (cambiar estado revierte si falla), buenos *empty states* y feedback por *toasts*.
- **Confirmaciones** en las acciones destructivas nuevas (eliminar oferta, retirar postulación).
- Buen manejo de la condición de carrera del login (flushSync + reconciliación de sesión).

---

## 🧪 Plan de prueba manual (E2E) — checklist para ejecutar en la web

**Auth y sesión**
- [ ] Registro como egresado y como empresa (validar contraseña < 6 y correo duplicado).
- [ ] Login / logout. Refrescar la página mantiene la sesión.
- [ ] Un egresado que entra a `/empresa` es redirigido (y viceversa).

**Empresa**
- [ ] Crear oferta (con requisitos técnicos y blandos) → aparece en la landing y en el panel del egresado.
- [ ] Ver postulantes ordenados por % de match; al abrir, pasan a "En revisión".
- [ ] Cambiar estado a **Aceptado** y a **Rechazado**; descargar CV del postulante.
- [ ] **Cerrar/Reabrir** oferta; **Eliminar** oferta (aparece confirmación; se van también sus postulaciones).
- [ ] Editar perfil de empresa.

**Egresado**
- [ ] Subir CV (PDF y DOCX) → autocompleta habilidades y experiencia; revisar/editar; guardar perfil.
- [ ] **Buscar/filtrar** ofertas (por texto) y ordenar por "Mayor % de match" y "Más recientes".
- [ ] Ver detalle con % de match, habilidades faltantes y **cursos sugeridos**.
- [ ] Postular usando el **CV del perfil** y subiendo un **CV nuevo**.
- [ ] **Retirar** postulación (aparece confirmación) y volver a postular.

**Casos borde (importantes para robustez)**
- [ ] Postular dos veces a la misma oferta → debe bloquear ("Ya postulaste…").
- [ ] Postular a una oferta **cerrada** → debe rechazar.
- [ ] Subir archivo **> 5 MB** o que **no sea PDF/DOCX** → mensaje de error claro.
- [ ] Registrar dos usuarios **al mismo tiempo** en dos pestañas → confirmar que ambos se guardan (prueba de la
      condición de carrera del punto 1).
- [ ] Probar todo en **celular** y con rutas directas (`/egresado`, `/empresa`).

---

## Sugerencia de orden de trabajo
1. (Alta) Serializar escrituras de la base — evita pérdida de datos en la feria.
2. (Media) Decidir comportamiento al eliminar oferta + rate limiting básico.
3. (Baja) Limpiar enlaces placeholder del footer y ocultar "Retirar" en rechazado.

¿Quieres que implemente el punto 1 (y opcionalmente 2 y 3) ahora?
