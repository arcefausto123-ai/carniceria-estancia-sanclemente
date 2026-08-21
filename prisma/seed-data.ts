/**
 * Datos iniciales de la tienda, en un solo lugar.
 *
 * Los consumen dos cosas: `prisma/seed.ts` (vía Prisma, para desarrollo) y
 * `scripts/export-seed-sql.ts`, que los vuelca a SQL para poder pegarlos en
 * el editor de Supabase sin necesidad de tener Node configurado.
 *
 * Los identificadores son legibles a propósito: se leen bien en el editor de
 * la base y hacen que volver a correr el seed sea idempotente.
 */

export const CATEGORIES = [
  { id: "cat_vacunos", slug: "vacunos", name: "Vacunos", icon: "beef",
    description: "Cortes vacunos seleccionados y envasados al vacío",
    highlight: "Calidad premium, directo del campo a tu mesa", visible: true },
  { id: "cat_cerdo", slug: "cerdo", name: "Cerdo", icon: "pork",
    description: "Cortes de cerdo frescos", highlight: null, visible: true },
  { id: "cat_pollo", slug: "pollo", name: "Pollo", icon: "chicken",
    description: "Pollo de granja", highlight: null, visible: true },
  { id: "cat_combos", slug: "combos", name: "Combos", icon: "box",
    description: "Combos armados para asado y semana", highlight: null, visible: true },
  { id: "cat_ofertas", slug: "ofertas-especiales", name: "Ofertas especiales", icon: "tag",
    description: "Promociones por tiempo limitado", highlight: null, visible: false },
] as const;

export const PRODUCTS = [
  { id: "prd_entrana", slug: "entrana", name: "Entraña", sku: "ENT-0850", categoryId: "cat_vacunos", weightGrams: 850, priceCents: 1275000, stock: 1, status: "PUBLISHED" },
  { id: "prd_vacio", slug: "vacio", name: "Vacío", sku: "VAC-1320", categoryId: "cat_vacunos", weightGrams: 1320, priceCents: 1980000, stock: 1, status: "PUBLISHED" },
  { id: "prd_asado", slug: "asado-banderita", name: "Asado banderita", sku: "ASA-1100", categoryId: "cat_vacunos", weightGrams: 1100, priceCents: 1490000, stock: 0, status: "PUBLISHED" },
  { id: "prd_bondiola", slug: "bondiola", name: "Bondiola", sku: "BON-1450", categoryId: "cat_cerdo", weightGrams: 1450, priceCents: 1650000, stock: 1, status: "DRAFT" },
  { id: "prd_ojobife", slug: "ojo-de-bife", name: "Ojo de bife", sku: "OJO-0920", categoryId: "cat_vacunos", weightGrams: 920, priceCents: 1840000, stock: 3, status: "PUBLISHED" },
  { id: "prd_matambre", slug: "matambre", name: "Matambre", sku: "MAT-1050", categoryId: "cat_vacunos", weightGrams: 1050, priceCents: 1420000, stock: 2, status: "PUBLISHED" },
  { id: "prd_costillar", slug: "costillar", name: "Costillar", sku: "COS-2400", categoryId: "cat_vacunos", weightGrams: 2400, priceCents: 2880000, stock: 2, status: "PUBLISHED" },
  { id: "prd_matambrito", slug: "matambrito-de-cerdo", name: "Matambrito de cerdo", sku: "MTC-0780", categoryId: "cat_cerdo", weightGrams: 780, priceCents: 936000, stock: 4, status: "PUBLISHED" },
  { id: "prd_costillitas", slug: "costillitas-de-cerdo", name: "Costillitas de cerdo", sku: "CDO-1200", categoryId: "cat_cerdo", weightGrams: 1200, priceCents: 1320000, stock: 3, status: "PUBLISHED" },
  { id: "prd_polloentero", slug: "pollo-entero", name: "Pollo entero", sku: "POL-1900", categoryId: "cat_pollo", weightGrams: 1900, priceCents: 855000, stock: 6, status: "PUBLISHED" },
  { id: "prd_suprema", slug: "suprema-de-pollo", name: "Suprema de pollo", sku: "SUP-0600", categoryId: "cat_pollo", weightGrams: 600, priceCents: 480000, stock: 5, status: "PUBLISHED" },
  { id: "prd_comboasado", slug: "combo-asado-4-personas", name: "Combo asado 4 personas", sku: "CMB-4000", categoryId: "cat_combos", weightGrams: 4000, priceCents: 4850000, stock: 2, status: "PUBLISHED" },
  { id: "prd_combosemanal", slug: "combo-semanal", name: "Combo semanal", sku: "CMB-5500", categoryId: "cat_combos", weightGrams: 5500, priceCents: 5980000, stock: 1, status: "PUBLISHED" },
] as const;

export const ZONES = [
  { id: "zon_lomaverde", name: "Loma Verde", feeCents: 350000, minOrderCents: 2000000 },
  { id: "zon_maschwitz", name: "Ingeniero Maschwitz", feeCents: 450000, minOrderCents: 2500000 },
  { id: "zon_escobar", name: "Escobar centro", feeCents: 500000, minOrderCents: 3000000 },
] as const;

export const SLOTS = [
  { id: "slt_del_1", kind: "DELIVERY", label: "12:00–14:00" },
  { id: "slt_del_2", kind: "DELIVERY", label: "14:00–16:00" },
  { id: "slt_del_3", kind: "DELIVERY", label: "16:00–18:00" },
  { id: "slt_del_4", kind: "DELIVERY", label: "18:00–20:00" },
  { id: "slt_pic_1", kind: "PICKUP", label: "10:00–13:00" },
  { id: "slt_pic_2", kind: "PICKUP", label: "17:00–20:00" },
] as const;

export const SETTINGS = {
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
} as const;

/** El primer pedido sale ESC-1048. */
export const FIRST_ORDER_NUMBER = 1047;
