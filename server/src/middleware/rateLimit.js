// Limitador de peticiones en memoria, sin dependencias externas.
// Pensado para proteger endpoints sensibles (login/registro) contra intentos
// masivos (fuerza bruta) durante la feria. Como el backend corre en una sola
// instancia, un contador en memoria por IP es suficiente.
//
// Nota: al reiniciar el servicio se reinician los contadores; es un límite
// "best effort", no una defensa de nivel producción, pero cubre el caso común.

/**
 * Crea un middleware que permite como máximo `max` peticiones por `windowMs`
 * desde una misma IP. Si se excede, responde 429 con un mensaje claro.
 */
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 20, message } = {}) {
  const hits = new Map(); // ip -> { count, resetAt }

  // Limpieza periódica para no acumular IPs viejas en memoria.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(ip);
    }
  }, windowMs);
  // No evitar que el proceso termine por este timer.
  if (typeof cleanup.unref === "function") cleanup.unref();

  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    let entry = hits.get(ip);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(ip, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        error:
          message ||
          "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.",
      });
    }

    next();
  };
}
