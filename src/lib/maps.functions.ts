import { createServerFn } from "@tanstack/react-start";

/**
 * Devuelve la API key de Google Maps al browser.
 * La key es "browser-restricted" (referrer allowlist) y se puede exponer
 * al cliente sin riesgo — es equivalente a una clave publishable.
 */
export const getGoogleMapsKey = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env.GOOGLE_MAPS_BROWSER_KEY || process.env.GOOGLE_API_KEY || "";
  return { key };
});