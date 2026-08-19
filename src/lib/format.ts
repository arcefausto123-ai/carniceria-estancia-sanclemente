// Todos los importes viven en centavos de ARS. Estas son las únicas
// funciones que deberían convertir entre centavos y texto.

export function formatMoney(cents: number): string {
  return "$" + new Intl.NumberFormat("es-AR").format(Math.round(cents / 100));
}

/** Con decimales — para comprobantes y detalle de transferencias. */
export function formatMoneyExact(cents: number): string {
  return (
    "$" +
    new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100)
  );
}

/** 850 -> "0,850 kg" */
export function formatWeight(grams: number): string {
  return (grams / 1000).toFixed(3).replace(".", ",") + " kg";
}

/** "1,250" o "1.250" -> 1250 gramos */
export function parseWeightKg(input: string): number {
  const n = Number(String(input).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 1000);
}

/** "12500" o "12.500,50" -> centavos */
export function parsePriceToCents(input: string): number {
  const cleaned = String(input).trim().replace(/[^\d,.-]/g, "");
  // Formato local: el punto separa miles, la coma separa decimales.
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export const TIMEZONE = "America/Argentina/Buenos_Aires";

const DATE = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIMEZONE,
});
const TIME = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TIMEZONE,
});
const LONG = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TIMEZONE,
});

export const formatDate = (d: Date) => DATE.format(d);
export const formatTime = (d: Date) => TIME.format(d);
export const formatDateTime = (d: Date) => `${DATE.format(d)} · ${TIME.format(d)}`;
export const formatLongDate = (d: Date) => {
  const s = LONG.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** "hoy" / "ayer" / fecha */
export function formatRelativeDay(d: Date): string {
  const today = startOfDay(new Date());
  const day = startOfDay(d);
  const diff = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return DATE.format(d);
}

/**
 * Diferencia entre UTC y la hora de pared argentina en ese instante.
 * Se calcula con Intl en vez de un -3 fijo para no romperse si alguna vez
 * vuelve el horario de verano.
 */
function timezoneOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((part) => part.type === type)!.value);
  const wallClockAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return at.getTime() - wallClockAsUtc;
}

/**
 * Instante UTC correspondiente a las 00:00 de ese día EN ARGENTINA.
 * El servidor puede correr en UTC (Vercel lo hace), así que usar
 * setHours(0,0,0,0) desplazaría los cortes de día tres horas.
 */
export function startOfDay(d: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (type: string) => Number(parts.find((part) => part.type === type)!.value);
  const midnightAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"));
  return new Date(midnightAsUtc + timezoneOffsetMs(d));
}

export function initials(first: string, last: string): string {
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
}
