/**
 * Datos iniciales de Estancia San Clemente.
 * Idempotente: se puede correr varias veces sin duplicar nada.
 *
 *   npm run db:seed
 */
import { existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";
import { DEFAULT_TEMPLATES } from "../src/lib/whatsapp";
import {
  CATEGORIES, PRODUCTS, ZONES, SLOTS, SETTINGS, FIRST_ORDER_NUMBER,
} from "./seed-data";

// El script corre fuera de Next, que es quien normalmente carga el .env.
if (!process.env.DATABASE_URL && existsSync(".env")) process.loadEnvFile(".env");

const prisma = new PrismaClient();

async function main() {
  // ── Configuración ────────────────────────────────────────────────────
  await prisma.settings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      ...SETTINGS,
      msgNewOrder: DEFAULT_TEMPLATES.newOrder,
      msgPaymentOk: DEFAULT_TEMPLATES.paymentOk,
      msgReady: DEFAULT_TEMPLATES.ready,
    },
    update: {},
  });

  // ── Usuario administrador ────────────────────────────────────────────
  const email = (process.env.ADMIN_EMAIL ?? "admin@estanciasanclemente.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (password) {
    await prisma.adminUser.upsert({
      where: { email },
      create: { email, name: "Administrador", passwordHash: hashPassword(password) },
      update: { passwordHash: hashPassword(password) },
    });
    console.log(`✓ Usuario admin: ${email}`);
  } else {
    const exists = await prisma.adminUser.findUnique({ where: { email } });
    if (!exists) {
      console.warn(
        `! Falta ADMIN_PASSWORD en .env — no se creó el usuario ${email}.\n` +
          `  Agregala y volvé a correr: npm run db:seed`,
      );
    }
  }

  // ── Categorías ───────────────────────────────────────────────────────
  for (const [index, category] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { id: category.id },
      create: { ...category, position: index },
      update: { name: category.name, icon: category.icon, position: index },
    });
  }

  // ── Productos ────────────────────────────────────────────────────────
  for (const [index, product] of PRODUCTS.entries()) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: { ...product, position: index },
      update: { priceCents: product.priceCents, weightGrams: product.weightGrams },
    });
  }

  // ── Zonas y franjas ──────────────────────────────────────────────────
  for (const [index, zone] of ZONES.entries()) {
    await prisma.shippingZone.upsert({
      where: { id: zone.id },
      create: { ...zone, position: index },
      update: {},
    });
  }

  for (const [index, slot] of SLOTS.entries()) {
    await prisma.timeSlot.upsert({
      where: { id: slot.id },
      create: { ...slot, position: index },
      update: {},
    });
  }

  // ── Numerador de pedidos ─────────────────────────────────────────────
  await prisma.counter.upsert({
    where: { name: "order" },
    create: { name: "order", value: FIRST_ORDER_NUMBER },
    update: {},
  });

  console.log("✓ Datos iniciales cargados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
