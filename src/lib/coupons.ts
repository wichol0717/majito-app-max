export interface Cupon { code: string; pct: number; desc?: string }

export function findCoupon(list: Cupon[] | null | undefined, code: string): Cupon | null {
  if (!list || !code) return null;
  const c = code.trim().toUpperCase();
  return list.find((x) => x.code.toUpperCase() === c) ?? null;
}

export function parseCupones(raw: unknown): Cupon[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({
      code: String(x.code ?? ""),
      pct: Number(x.pct ?? 0),
      desc: x.desc ? String(x.desc) : undefined,
    }))
    .filter((c) => c.code && c.pct > 0);
}

const ORIGEN_KEY = "majito.origen.v1";
const CUPON_KEY = "majito.cupon.v1";

export function saveOrigen(origen: string) {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(ORIGEN_KEY, origen); } catch { /* ignore */ }
}
export function readOrigen(): string {
  if (typeof window === "undefined") return "directo";
  try { return window.sessionStorage.getItem(ORIGEN_KEY) || "directo"; } catch { return "directo"; }
}
export function saveCupon(code: string) {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(CUPON_KEY, code.toUpperCase()); } catch { /* ignore */ }
}
export function readCupon(): string {
  if (typeof window === "undefined") return "";
  try { return window.sessionStorage.getItem(CUPON_KEY) || ""; } catch { return ""; }
}
export function clearOrigenYCupon() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ORIGEN_KEY);
    window.sessionStorage.removeItem(CUPON_KEY);
  } catch { /* ignore */ }
}