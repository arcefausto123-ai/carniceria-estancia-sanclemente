/**
 * Vuelca los datos iniciales a SQL, para poder cargarlos desde el editor
 * de Supabase sin tener Node ni Prisma configurados en la máquina.
 *
 *     npx tsx scripts/export-seed-sql.ts > prisma/supabase-seed.sql
 *
 * No incluye el usuario administrador a propósito: su contraseña se crea
 * aparte para no dejar un hash versionado en el repositorio.
 */
import { CATEGORIES, PRODUCTS, ZONES, SLOTS, SETTINGS, FIRST_ORDER_NUMBER } from "../prisma/seed-data";

const q = (value: string | null) =>
  value === null ? "NULL" : `'${value.replace(/'/g, "''")}'`;

const lines: string[] = [
  "-- Datos iniciales de Estancia San Clemente.",
  "-- Generado con: npx tsx scripts/export-seed-sql.ts",
  "-- Se puede correr más de una vez: no duplica nada.",
  "",
  "BEGIN;",
  "",
  "-- Configuración de la tienda (fila única)",
  `INSERT INTO "Settings" ("id", "businessName", "whatsapp", "email", "address",`,
  `  "instagram", "facebook", "tagline", "stockHoldMinutes", "depositPct",`,
  `  "minOrderCents", "bankAlias", "bankHolder", "updatedAt")`,
  `VALUES ('singleton', ${q(SETTINGS.businessName)}, ${q(SETTINGS.whatsapp)},`,
  `  ${q(SETTINGS.email)}, ${q(SETTINGS.address)}, ${q(SETTINGS.instagram)},`,
  `  ${q(SETTINGS.facebook)}, ${q(SETTINGS.tagline)}, ${SETTINGS.stockHoldMinutes},`,
  `  ${SETTINGS.depositPct}, ${SETTINGS.minOrderCents}, ${q(SETTINGS.bankAlias)},`,
  `  ${q(SETTINGS.bankHolder)}, now())`,
  `ON CONFLICT ("id") DO NOTHING;`,
  "",
  "-- Categorías",
];

CATEGORIES.forEach((c, index) => {
  lines.push(
    `INSERT INTO "Category" ("id","slug","name","description","highlight","icon","visible","position","updatedAt")`,
    `VALUES (${q(c.id)}, ${q(c.slug)}, ${q(c.name)}, ${q(c.description)}, ${q(c.highlight)}, ${q(c.icon)}, ${c.visible}, ${index}, now())`,
    `ON CONFLICT ("id") DO NOTHING;`,
  );
});

lines.push("", "-- Productos (cada envase es una unidad, con su peso exacto)");
PRODUCTS.forEach((p, index) => {
  lines.push(
    `INSERT INTO "Product" ("id","slug","name","sku","categoryId","weightGrams","priceCents","stock","status","position","updatedAt")`,
    `VALUES (${q(p.id)}, ${q(p.slug)}, ${q(p.name)}, ${q(p.sku)}, ${q(p.categoryId)}, ${p.weightGrams}, ${p.priceCents}, ${p.stock}, '${p.status}', ${index}, now())`,
    `ON CONFLICT ("id") DO NOTHING;`,
  );
});

lines.push("", "-- Zonas de envío");
ZONES.forEach((z, index) => {
  lines.push(
    `INSERT INTO "ShippingZone" ("id","name","feeCents","minOrderCents","position","updatedAt")`,
    `VALUES (${q(z.id)}, ${q(z.name)}, ${z.feeCents}, ${z.minOrderCents}, ${index}, now())`,
    `ON CONFLICT ("id") DO NOTHING;`,
  );
});

lines.push("", "-- Franjas horarias");
SLOTS.forEach((s, index) => {
  lines.push(
    `INSERT INTO "TimeSlot" ("id","kind","label","position") VALUES (${q(s.id)}, '${s.kind}', ${q(s.label)}, ${index})`,
    `ON CONFLICT ("id") DO NOTHING;`,
  );
});

lines.push(
  "",
  "-- Numerador de pedidos: el primero sale ESC-" + (FIRST_ORDER_NUMBER + 1),
  `INSERT INTO "Counter" ("name","value") VALUES ('order', ${FIRST_ORDER_NUMBER})`,
  `ON CONFLICT ("name") DO NOTHING;`,
  "",
  "COMMIT;",
  "",
);

console.log(lines.join("\n"));
