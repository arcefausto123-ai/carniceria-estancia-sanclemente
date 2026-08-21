"use client";

import Link from "next/link";
import { useState } from "react";
import { saveCategory } from "../actions";
import { CategoryIcon, CATEGORY_ICONS, XCircle, Save } from "@/components/icons";
import { ImageField } from "@/components/admin/image-field";
import type { CategoryItem } from "./page";

const ICON_LABELS: Record<string, string> = {
  beef: "Vacunos",
  pork: "Cerdo",
  chicken: "Pollo",
  box: "Combos",
  meat: "Cortes",
  tag: "Genérico",
};

export function CategoryDrawer({
  category,
  storageReady,
}: {
  category: CategoryItem | null;
  storageReady: boolean;
}) {
  const [icon, setIcon] = useState(category?.icon ?? "tag");
  const [name, setName] = useState(category?.name ?? "");

  return (
    <aside className="panel h-fit p-5 xl:sticky xl:top-24">
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 className="panel-title">{category ? "Editar categoría" : "Nueva categoría"}</h2>
        <Link
          href="/admin/categorias"
          className="text-ink-500 transition hover:text-ink-900"
          aria-label="Cerrar"
        >
          <XCircle className="h-5 w-5" />
        </Link>
      </div>

      <form action={saveCategory} className="space-y-4">
        {category && <input type="hidden" name="id" value={category.id} />}
        <input type="hidden" name="icon" value={icon} />

        {/* Ícono */}
        <div>
          <span className="admin-label">Ícono de categoría</span>
          <div className="flex flex-wrap gap-2">
            {Object.keys(CATEGORY_ICONS).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                title={ICON_LABELS[key] ?? key}
                aria-pressed={icon === key}
                aria-label={ICON_LABELS[key] ?? key}
                className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 transition ${
                  icon === key
                    ? "border-admin-blue bg-info-bg text-admin-blue"
                    : "border-ink-200 text-ink-500 hover:border-ink-300"
                }`}
              >
                <CategoryIcon name={key} className="h-7 w-7" />
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="admin-label">Nombre</span>
          <input
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="admin-field"
          />
        </label>

        <label className="block">
          <span className="admin-label">Descripción</span>
          <textarea
            name="description"
            rows={2}
            defaultValue={category?.description ?? ""}
            placeholder="Cortes vacunos seleccionados y envasados al vacío"
            className="admin-field resize-y"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span className="text-sm text-ink-900">Visible en la tienda</span>
          <input
            type="checkbox"
            name="visible"
            defaultChecked={category?.visible ?? true}
            className="peer sr-only"
          />
          <span
            className="relative h-6 w-11 shrink-0 rounded-full bg-ink-300 transition
                       peer-checked:bg-admin-blue after:absolute after:top-0.5 after:left-0.5
                       after:h-5 after:w-5 after:rounded-full after:bg-white after:transition
                       peer-checked:after:translate-x-5"
          />
        </label>

        <ImageField
          name="coverImage"
          folder="categorias"
          defaultValue={category?.coverImage}
          label="Imagen de portada"
          hint="Recomendado 1200 × 600 px · máx. 5 MB"
          storageReady={storageReady}
          aspect="h-32"
        />

        <label className="block">
          <span className="admin-label">Texto destacado (opcional)</span>
          <input
            name="highlight"
            defaultValue={category?.highlight ?? ""}
            placeholder="Calidad premium, directo del campo a tu mesa"
            className="admin-field"
          />
        </label>

        {/* Vista previa pública */}
        <div className="rounded-lg border border-ink-200 bg-admin-bg p-4">
          <p className="mb-2 text-xs text-ink-500">Vista pública previa</p>
          <span className="inline-flex items-center gap-2.5 rounded-full border border-navy/20 bg-white px-5 py-2 text-sm text-navy">
            <CategoryIcon name={icon} className="h-5 w-5" />
            {name || "Nombre de la categoría"}
          </span>
        </div>

        <div className="flex gap-3 pt-1">
          <Link href="/admin/categorias" className="btn-secondary flex-1">
            Cancelar
          </Link>
          <button type="submit" className="btn-primary flex-1">
            <Save className="h-4 w-4" />
            Guardar cambios
          </button>
        </div>
      </form>
    </aside>
  );
}
