-- Datos iniciales de Estancia San Clemente.
-- Generado con: npx tsx scripts/export-seed-sql.ts
-- Se puede correr más de una vez: no duplica nada.

BEGIN;

-- Configuración de la tienda (fila única)
INSERT INTO "Settings" ("id", "businessName", "whatsapp", "email", "address",
  "instagram", "facebook", "tagline", "stockHoldMinutes", "depositPct",
  "minOrderCents", "bankAlias", "bankHolder", "updatedAt")
VALUES ('singleton', 'Estancia San Clemente', '11 5582-9202',
  'pedidos@estanciasanclemente.com', 'Los Fresnos 378, Loma Verde, Escobar', 'https://instagram.com/estanciasanclemente',
  'https://facebook.com/estanciasanclemente', 'Cortes seleccionados de la mejor calidad.', 10,
  30, 2000000, 'ESTANCIA.SANCLEMENTE',
  'Estancia San Clemente', now())
ON CONFLICT ("id") DO NOTHING;

-- Categorías
INSERT INTO "Category" ("id","slug","name","description","highlight","icon","visible","position","updatedAt")
VALUES ('cat_vacunos', 'vacunos', 'Vacunos', 'Cortes vacunos seleccionados y envasados al vacío', 'Calidad premium, directo del campo a tu mesa', 'beef', true, 0, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Category" ("id","slug","name","description","highlight","icon","visible","position","updatedAt")
VALUES ('cat_cerdo', 'cerdo', 'Cerdo', 'Cortes de cerdo frescos', NULL, 'pork', true, 1, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Category" ("id","slug","name","description","highlight","icon","visible","position","updatedAt")
VALUES ('cat_pollo', 'pollo', 'Pollo', 'Pollo de granja', NULL, 'chicken', true, 2, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Category" ("id","slug","name","description","highlight","icon","visible","position","updatedAt")
VALUES ('cat_combos', 'combos', 'Combos', 'Combos armados para asado y semana', NULL, 'box', true, 3, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Category" ("id","slug","name","description","highlight","icon","visible","position","updatedAt")
VALUES ('cat_ofertas', 'ofertas-especiales', 'Ofertas especiales', 'Promociones por tiempo limitado', NULL, 'tag', false, 4, now())
ON CONFLICT ("id") DO NOTHING;

-- Productos (cada envase es una unidad, con su peso exacto)
INSERT INTO "Product" ("id","slug","name","sku","categoryId","weightGrams","priceCents","stock","status","position","updatedAt")
VALUES ('prd_entrana', 'entrana', 'Entraña', 'ENT-0850', 'cat_vacunos', 850, 1275000, 1, 'PUBLISHED', 0, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id","slug","name","sku","categoryId","weightGrams","priceCents","stock","status","position","updatedAt")
VALUES ('prd_vacio', 'vacio', 'Vacío', 'VAC-1320', 'cat_vacunos', 1320, 1980000, 1, 'PUBLISHED', 1, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id","slug","name","sku","categoryId","weightGrams","priceCents","stock","status","position","updatedAt")
VALUES ('prd_asado', 'asado-banderita', 'Asado banderita', 'ASA-1100', 'cat_vacunos', 1100, 1490000, 0, 'PUBLISHED', 2, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id","slug","name","sku","categoryId","weightGrams","priceCents","stock","status","position","updatedAt")
VALUES ('prd_bondiola', 'bondiola', 'Bondiola', 'BON-1450', 'cat_cerdo', 1450, 1650000, 1, 'DRAFT', 3, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id","slug","name","sku","categoryId","weightGrams","priceCents","stock","status","position","updatedAt")
VALUES ('prd_ojobife', 'ojo-de-bife', 'Ojo de bife', 'OJO-0920', 'cat_vacunos', 920, 1840000, 3, 'PUBLISHED', 4, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id","slug","name","sku","categoryId","weightGrams","priceCents","stock","status","position","updatedAt")
VALUES ('prd_matambre', 'matambre', 'Matambre', 'MAT-1050', 'cat_vacunos', 1050, 1420000, 2, 'PUBLISHED', 5, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id","slug","name","sku","categoryId","weightGrams","priceCents","stock","status","position","updatedAt")
VALUES ('prd_costillar', 'costillar', 'Costillar', 'COS-2400', 'cat_vacunos', 2400, 2880000, 2, 'PUBLISHED', 6, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id","slug","name","sku","categoryId","weightGrams","priceCents","stock","status","position","updatedAt")
VALUES ('prd_matambrito', 'matambrito-de-cerdo', 'Matambrito de cerdo', 'MTC-0780', 'cat_cerdo', 780, 936000, 4, 'PUBLISHED', 7, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id","slug","name","sku","categoryId","weightGrams","priceCents","stock","status","position","updatedAt")
VALUES ('prd_costillitas', 'costillitas-de-cerdo', 'Costillitas de cerdo', 'CDO-1200', 'cat_cerdo', 1200, 1320000, 3, 'PUBLISHED', 8, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id","slug","name","sku","categoryId","weightGrams","priceCents","stock","status","position","updatedAt")
VALUES ('prd_polloentero', 'pollo-entero', 'Pollo entero', 'POL-1900', 'cat_pollo', 1900, 855000, 6, 'PUBLISHED', 9, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id","slug","name","sku","categoryId","weightGrams","priceCents","stock","status","position","updatedAt")
VALUES ('prd_suprema', 'suprema-de-pollo', 'Suprema de pollo', 'SUP-0600', 'cat_pollo', 600, 480000, 5, 'PUBLISHED', 10, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id","slug","name","sku","categoryId","weightGrams","priceCents","stock","status","position","updatedAt")
VALUES ('prd_comboasado', 'combo-asado-4-personas', 'Combo asado 4 personas', 'CMB-4000', 'cat_combos', 4000, 4850000, 2, 'PUBLISHED', 11, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id","slug","name","sku","categoryId","weightGrams","priceCents","stock","status","position","updatedAt")
VALUES ('prd_combosemanal', 'combo-semanal', 'Combo semanal', 'CMB-5500', 'cat_combos', 5500, 5980000, 1, 'PUBLISHED', 12, now())
ON CONFLICT ("id") DO NOTHING;

-- Zonas de envío
INSERT INTO "ShippingZone" ("id","name","feeCents","minOrderCents","position","updatedAt")
VALUES ('zon_lomaverde', 'Loma Verde', 350000, 2000000, 0, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ShippingZone" ("id","name","feeCents","minOrderCents","position","updatedAt")
VALUES ('zon_maschwitz', 'Ingeniero Maschwitz', 450000, 2500000, 1, now())
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ShippingZone" ("id","name","feeCents","minOrderCents","position","updatedAt")
VALUES ('zon_escobar', 'Escobar centro', 500000, 3000000, 2, now())
ON CONFLICT ("id") DO NOTHING;

-- Franjas horarias
INSERT INTO "TimeSlot" ("id","kind","label","position") VALUES ('slt_del_1', 'DELIVERY', '12:00–14:00', 0)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TimeSlot" ("id","kind","label","position") VALUES ('slt_del_2', 'DELIVERY', '14:00–16:00', 1)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TimeSlot" ("id","kind","label","position") VALUES ('slt_del_3', 'DELIVERY', '16:00–18:00', 2)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TimeSlot" ("id","kind","label","position") VALUES ('slt_del_4', 'DELIVERY', '18:00–20:00', 3)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TimeSlot" ("id","kind","label","position") VALUES ('slt_pic_1', 'PICKUP', '10:00–13:00', 4)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TimeSlot" ("id","kind","label","position") VALUES ('slt_pic_2', 'PICKUP', '17:00–20:00', 5)
ON CONFLICT ("id") DO NOTHING;

-- Numerador de pedidos: el primero sale ESC-1048
INSERT INTO "Counter" ("name","value") VALUES ('order', 1047)
ON CONFLICT ("name") DO NOTHING;

COMMIT;

