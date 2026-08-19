import { prisma } from "./prisma";
import type { Settings } from "@prisma/client";

export const SETTINGS_ID = "singleton";

/**
 * Devuelve la fila única de configuración, creándola con los valores por
 * defecto si todavía no existe. Todas las reglas de negocio (seña, pedido
 * mínimo, tiempo de reserva) se leen desde acá — nunca están hardcodeadas.
 */
export async function getSettings(): Promise<Settings> {
  const existing = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: SETTINGS_ID } });
}
