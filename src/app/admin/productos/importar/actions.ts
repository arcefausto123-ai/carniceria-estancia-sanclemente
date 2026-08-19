"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";
import { parsePriceToCents, parseWeightKg } from "@/lib/format";
import type { ProductStatus } from "@prisma/client";

const HEADERS = ["nombre", "codigo", "categoria", "peso_kg", "precio", "stock", "publicado"];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Alta masiva de envases desde un CSV pegado en el panel. */
export async function importProducts(formData: FormData) {
  if (!(await getSession())) redirect("/admin/login");

  const rows = parseCsv(String(formData.get("csv") ?? ""));
  if (rows.length < 2) redirect("/admin/productos/importar?errores=" + encodeURIComponent("El archivo está vacío."));

  const header = rows[0].map((cell) => slugify(cell).replace(/-/g, "_"));
  const index = (name: string) => header.indexOf(name);
  const missing = ["nombre", "categoria", "peso_kg", "precio"].filter((key) => index(key) < 0);
  if (missing.length > 0) {
    redirect(
      "/admin/productos/importar?errores=" +
        encodeURIComponent(`Faltan columnas obligatorias: ${missing.join(", ")}. Esperadas: ${HEADERS.join(", ")}.`),
    );
  }

  const categories = await prisma.category.findMany();
  const byName = new Map(categories.map((c) => [slugify(c.name), c.id]));

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const [offset, row] of rows.slice(1).entries()) {
    const line = offset + 2;
    const cell = (name: string) => (index(name) >= 0 ? (row[index(name)] ?? "").trim() : "");

    const name = cell("nombre");
    if (!name) {
      errors.push(`Fila ${line}: falta el nombre.`);
      continue;
    }

    const categoryId = byName.get(slugify(cell("categoria")));
    if (!categoryId) {
      errors.push(`Fila ${line} (${name}): la categoría "${cell("categoria")}" no existe.`);
      continue;
    }

    const weightGrams = parseWeightKg(cell("peso_kg"));
    if (weightGrams <= 0) {
      errors.push(`Fila ${line} (${name}): peso inválido "${cell("peso_kg")}".`);
      continue;
    }

    const priceCents = parsePriceToCents(cell("precio"));
    if (priceCents <= 0) {
      errors.push(`Fila ${line} (${name}): precio inválido "${cell("precio")}".`);
      continue;
    }

    const sku = cell("codigo") || null;
    const stockRaw = cell("stock");
    const stock = stockRaw === "" ? 1 : Math.max(0, Number(stockRaw.replace(/\D/g, "")) || 0);
    const published = ["si", "sí", "s", "true", "1", "publicado"].includes(
      cell("publicado").toLowerCase(),
    );

    const data = {
      name,
      sku,
      categoryId,
      weightGrams,
      priceCents,
      stock,
      status: (published ? "PUBLISHED" : "DRAFT") as ProductStatus,
    };

    // El código interno es la clave de actualización; si no viene, usamos el nombre.
    const existing = sku
      ? await prisma.product.findFirst({ where: { sku } })
      : await prisma.product.findFirst({ where: { name } });

    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      let slug = slugify(name);
      for (let suffix = 1; await prisma.product.findUnique({ where: { slug } }); suffix++) {
        slug = `${slugify(name)}-${suffix}`;
      }
      await prisma.product.create({ data: { ...data, slug } });
      created++;
    }
  }

  revalidatePath("/admin/productos");
  revalidatePath("/");

  const query = new URLSearchParams({ creados: String(created), actualizados: String(updated) });
  if (errors.length > 0) query.set("errores", errors.join("||"));
  redirect(`/admin/productos/importar?${query.toString()}`);
}
