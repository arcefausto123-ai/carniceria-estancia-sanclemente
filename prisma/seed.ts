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

// El script corre fuera de Next, que es quien normalmente carga el .env.
if (!process.env.DATABASE_URL && existsSync(".env")) process.loadEnvFile(".env");

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "vacunos", name: "Vacunos", icon: "beef", description: "Cortes vacunos seleccionados y envasados al vacío", highlight: "Calidad premium, directo del campo a tu mesa", visible: true },
  { slug: "cerdo", name: "Cerdo", icon: "pork", description: "Cortes de cerdo frescos", visible: true },
  { slug: "pollo", name: "Pollo", icon: "chicken", description: "Pollo de granja", visible: true },
  { slug: "combos", name: "Combos", icon: "box", description: "Combos armados para asado y semana", visible: true },
  { slug: "ofertas-especiales", name: "Ofertas especiales", icon: "tag", description: "Promociones por tiempo limitado", visible: false },
];

const PRODUCTS = [
  { slug: "entrana", name: "Entraña", sku: "ENT-0850", category: "vacunos", weightGrams: 850, priceCents: 1275000, stock: 1, status: "PUBLISHED" },
  { slug: "vacio", name: "Vacío", sku: "VAC-1320", category: "vacunos", weightGrams: 1320, priceCents: 1980000, stock: 1, status: "PUBLISHED" },
  { slug: "asado-banderita", name: "Asado banderita", sku: "ASA-1100", category: "vacunos", weightGrams: 1100, priceCents: 1490000, stock: 0, status: "PUBLISHED" },
  { slug: "bondiola", name: "Bondiola", sku: "BON-1450", category: "cerdo", weightGrams: 1450, priceCents: 1650000, stock: 1, status: "DRAFT" },
  { slug: "ojo-de-bife", name: "Ojo de bife", sku: "OJO-0920", category: "vacunos", weightGrams: 920, priceCents: 1840000, stock: 3, status: "PUBLISHED" },
  { slug: "matambre", name: "Matambre", sku: "MAT-1050", category: "vacunos", weightGrams: 1050, priceCents: 1420000, stock: 2, status: "PUBLISHED" },
  { slug: "costillar", name: "Costillar", sku: "COS-2400", category: "vacunos", weightGrams: 2400, priceCents: 2880000, stock: 2, status: "PUBLISHED" },
  { slug: "matambrito-de-cerdo", name: "Matambrito de cerdo", sku: "MTC-0780", category: "cerdo", weightGrams: 780, priceCents: 936000, stock: 4, status: "PUBLISHED" },
  { slug: "costillitas-de-cerdo", name: "Costillitas de cerdo", sku: "CDO-1200", category: "cerdo", weightGrams: 1200, priceCents: 1320000, stock: 3, status: "PUBLISHED" },
  { slug: "pollo-entero", name: "Pollo entero", sku: "POL-1900", category: "pollo", weightGrams: 1900, priceCents: 855000, stock: 6, status: "PUBLISHED" },
  { slug: "suprema-de-pollo", name: "Suprema de pollo", sku: "SUP-0600", category: "pollo", weightGrams: 600, priceCents: 480000, stock: 5, status: "PUBLISHED" },
  { slug: "combo-asado-4-personas", name: "Combo asado 4 personas", sku: "CMB-4000", category: "combos", weightGrams: 4000, priceCents: 4850000, stock: 2, status: "PUBLISHED" },
  { slug: "combo-semanal", name: "Combo semanal", sku: "CMB-5500", category: "combos", weightGrams: 5500, priceCents: 5980000, stock: 1, status: "PUBLISHED" },
] as const;

const ZONES = [
  { name: "Loma Verde", feeCents: 350000, minOrderCents: 2000000 },
  { name: "Ingeniero Maschwitz", feeCents: 450000, minOrderCents: 2500000 },
  { name: "Escobar centro", feeCents: 500000, minOrderCents: 3000000 },
];

const DELIVERY_SLOTS = ["12:00–14:00", "14:00–16:00", "16:00–18:00", "18:00–20:00"];
const PICKUP_SLOTS = ["10:00–13:00", "17:00–20:00"];

async function main() {
  // ── Configuración ────────────────────────────────────────────────────
  await prisma.settings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      businessName: "Estancia San Clemente",
      whatsapp: "11 5582-9202",
      email: "pedidos@estanciasanclemente.com",
      address: "Los Fresnos 378, Loma Verde, Escobar",
      instagram: "https://instagram.com/estanciasanclemente",
      facebook: "https://facebook.com/estanciasanclemente",
      tagline: "Cortes seleccionados de la mejor calidad.",
      stockHoldMinutes: 10,
      depositPct: 30,
      minOrderCents: 2000000,
      bankAlias: "ESTANCIA.SANCLEMENTE",
      bankHolder: "Estancia San Clemente",
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
      where: { slug: category.slug },
      create: { ...category, position: index },
      update: { name: category.name, icon: category.icon, position: index },
    });
  }
  const categories = await prisma.category.findMany();
  const categoryId = (slug: string) => {
    const found = categories.find((c) => c.slug === slug);
    if (!found) throw new Error(`Falta la categoría ${slug}`);
    return found.id;
  };

  // ── Productos ────────────────────────────────────────────────────────
  for (const [index, product] of PRODUCTS.entries()) {
    const { category, ...rest } = product;
    await prisma.product.upsert({
      where: { slug: product.slug },
      create: { ...rest, categoryId: categoryId(category), position: index },
      update: { priceCents: product.priceCents, weightGrams: product.weightGrams },
    });
  }

  // ── Zonas y franjas ──────────────────────────────────────────────────
  for (const [index, zone] of ZONES.entries()) {
    const exists = await prisma.shippingZone.findFirst({ where: { name: zone.name } });
    if (!exists) await prisma.shippingZone.create({ data: { ...zone, position: index } });
  }

  for (const [kind, labels] of [
    ["DELIVERY", DELIVERY_SLOTS],
    ["PICKUP", PICKUP_SLOTS],
  ] as const) {
    for (const [index, label] of labels.entries()) {
      const exists = await prisma.timeSlot.findFirst({ where: { kind, label } });
      if (!exists) await prisma.timeSlot.create({ data: { kind, label, position: index } });
    }
  }

  // ── Numerador de pedidos ─────────────────────────────────────────────
  await prisma.counter.upsert({
    where: { name: "order" },
    create: { name: "order", value: 1047 },
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
