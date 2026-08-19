"use client";

import Link from "next/link";
import { useState } from "react";
import { saveProduct } from "../actions";
import { Image as ImageIcon, XCircle, Info, Minus, Plus } from "@/components/icons";
import type { Product } from "@prisma/client";

/**
 * Panel lateral de alta/edición. Cada envase se carga como una unidad
 * individual: peso exacto + precio final + cuántos envases iguales hay.
 */
export function ProductDrawer({
  product,
  categories,
}: {
  product: Product | null;
  categories: { id: string; name: string }[];
}) {
  const [stock, setStock] = useState(product?.stock ?? 1);
  const [preview, setPreview] = useState(product?.image ?? "");

  return (
    <aside className="panel h-fit p-5 xl:sticky xl:top-24">
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 className="panel-title">{product ? "Editar producto" : "Agregar producto"}</h2>
        <Link
          href="/admin/productos"
          className="text-ink-500 transition hover:text-ink-900"
          aria-label="Cerrar"
        >
          <XCircle className="h-5 w-5" />
        </Link>
      </div>

      <form action={saveProduct} className="space-y-4">
        {product && <input type="hidden" name="id" value={product.id} />}

        {/* Foto */}
        <div>
          <label className="admin-label" htmlFor="image">
            Foto del envase
          </label>
          {preview ? (
            <div className="relative overflow-hidden rounded-lg border border-ink-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Vista previa" className="h-40 w-full object-cover" />
              <button
                type="button"
                onClick={() => setPreview("")}
                className="absolute top-2 right-2 rounded-full bg-white/90 p-1 text-ink-700 hover:text-danger-fg"
                aria-label="Quitar imagen"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-300 px-4 py-8 text-center">
              <ImageIcon className="h-7 w-7 text-ink-500" />
              <p className="mt-2 text-sm text-ink-700">Pegá la URL de la foto del envase</p>
              <p className="text-xs text-ink-500">PNG o JPG · máx. 5 MB</p>
            </div>
          )}
          <input
            id="image"
            name="image"
            type="url"
            value={preview}
            onChange={(event) => setPreview(event.target.value)}
            placeholder="https://…/entrana.jpg"
            className="admin-field mt-2"
          />
        </div>

        <label className="block">
          <span className="admin-label">Nombre del corte</span>
          <input name="name" required defaultValue={product?.name} className="admin-field" />
        </label>

        <label className="block">
          <span className="admin-label">Código interno (opcional)</span>
          <input name="sku" defaultValue={product?.sku ?? ""} placeholder="ENT-0850" className="admin-field" />
        </label>

        <label className="block">
          <span className="admin-label">Categoría</span>
          <select name="categoryId" required defaultValue={product?.categoryId ?? ""} className="admin-field">
            <option value="" disabled>
              Seleccionar categoría
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="admin-label">Peso exacto (kg)</span>
            <input
              name="weightKg"
              required
              inputMode="decimal"
              defaultValue={product ? (product.weightGrams / 1000).toFixed(3).replace(".", ",") : ""}
              placeholder="Ej: 1,250"
              className="admin-field"
            />
          </label>
          <label className="block">
            <span className="admin-label">Precio final</span>
            <input
              name="price"
              required
              inputMode="decimal"
              defaultValue={product ? String(Math.round(product.priceCents / 100)) : ""}
              placeholder="Ej: 12500"
              className="admin-field"
            />
          </label>
        </div>

        <div>
          <span className="admin-label">Stock</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-ink-200">
              <button
                type="button"
                onClick={() => setStock((value) => Math.max(0, value - 1))}
                className="px-3 py-2 text-ink-700 hover:text-admin-blue"
                aria-label="Restar una unidad"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                name="stock"
                type="number"
                min={0}
                value={stock}
                onChange={(event) => setStock(Math.max(0, Number(event.target.value)))}
                className="w-16 border-x border-ink-200 py-2 text-center text-sm focus:outline-none"
                aria-label="Cantidad de envases"
              />
              <button
                type="button"
                onClick={() => setStock((value) => value + 1)}
                className="px-3 py-2 text-ink-700 hover:text-admin-blue"
                aria-label="Sumar una unidad"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-ink-500">
              <Info className="h-4 w-4" />
              unidad individual
            </span>
          </div>
        </div>

        <label className="block">
          <span className="admin-label">Descripción (opcional)</span>
          <textarea
            name="description"
            rows={3}
            defaultValue={product?.description ?? ""}
            placeholder="Contá algún detalle del corte, maduración, origen, etc."
            className="admin-field resize-y"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-ink-200 pt-4">
          <span className="text-sm text-ink-900">Publicar en la tienda</span>
          <input
            type="checkbox"
            name="published"
            defaultChecked={product ? product.status === "PUBLISHED" : true}
            className="peer sr-only"
          />
          <span
            className="relative h-6 w-11 shrink-0 rounded-full bg-ink-300 transition
                       peer-checked:bg-admin-blue after:absolute after:top-0.5 after:left-0.5
                       after:h-5 after:w-5 after:rounded-full after:bg-white after:transition
                       peer-checked:after:translate-x-5"
          />
        </label>

        <p className="flex items-start gap-2 rounded-lg bg-info-bg px-3 py-2.5 text-xs text-info-fg">
          <Info className="mt-px h-4 w-4 shrink-0" />
          Cada envase se carga como una unidad individual. Cuando se vende, el stock baja
          automáticamente.
        </p>

        <div className="flex gap-3 pt-1">
          <button type="submit" name="saveAs" value="draft" className="btn-secondary flex-1">
            Guardar borrador
          </button>
          <button type="submit" className="btn-primary flex-1">
            {product ? "Guardar cambios" : "Publicar producto"}
          </button>
        </div>
      </form>
    </aside>
  );
}
