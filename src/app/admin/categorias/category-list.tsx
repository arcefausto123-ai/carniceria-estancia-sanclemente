"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryIcon, Drag, Pencil, Trash, Save } from "@/components/icons";
import { reorderCategories, toggleCategory, deleteCategory } from "../actions";
import type { CategoryItem } from "./page";

/**
 * Lista reordenable por arrastre. Guardamos el orden con un botón explícito
 * para que un arrastre accidental no reordene la tienda de los clientes.
 */
export function CategoryList({
  title,
  categories,
  reorderable = false,
  emptyMessage,
}: {
  title: string;
  categories: CategoryItem[];
  reorderable?: boolean;
  emptyMessage: string;
}) {
  const [items, setItems] = useState(categories);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Cuando el servidor devuelve datos nuevos (alta, edición) descartamos el
  // orden local para no mostrar una lista desactualizada.
  useEffect(() => {
    setItems(categories);
    setDirty(false);
  }, [categories]);

  const handleDrop = (targetId: string) => {
    if (!dragging || dragging === targetId) return;
    const next = [...items];
    const from = next.findIndex((item) => item.id === dragging);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    next.splice(to, 0, ...next.splice(from, 1));
    setItems(next);
    setDirty(true);
    setDragging(null);
  };

  return (
    <section className="panel p-5">
      <h2 className="panel-title mb-4">{title}</h2>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((category, index) => (
            <li
              key={category.id}
              draggable={reorderable}
              onDragStart={() => setDragging(category.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(category.id)}
              className={`flex items-center gap-4 rounded-lg border px-4 py-3 transition ${
                dragging === category.id
                  ? "border-admin-blue bg-info-bg/40"
                  : "border-ink-200 bg-white"
              }`}
            >
              {reorderable && (
                <span className="cursor-grab text-ink-300 active:cursor-grabbing" aria-hidden>
                  <Drag className="h-5 w-5" />
                </span>
              )}
              <span className="w-4 text-sm text-ink-500">{index + 1}</span>

              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-ink-200 text-ink-700">
                <CategoryIcon name={category.icon} className="h-6 w-6" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink-900">{category.name}</span>
                <span className="text-xs text-ink-500">
                  {category.productCount}{" "}
                  {category.productCount === 1 ? "producto" : "productos"}
                </span>
              </span>

              <form action={toggleCategory}>
                <input type="hidden" name="id" value={category.id} />
                <button
                  type="submit"
                  role="switch"
                  aria-checked={category.visible}
                  aria-label={`${category.visible ? "Ocultar" : "Mostrar"} ${category.name}`}
                  className={`relative block h-6 w-11 rounded-full transition ${
                    category.visible ? "bg-admin-blue" : "bg-ink-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                      category.visible ? "left-[1.375rem]" : "left-0.5"
                    }`}
                  />
                </button>
              </form>

              <Link
                href={`/admin/categorias?editar=${category.id}`}
                className="rounded p-1.5 text-ink-500 transition hover:bg-info-bg hover:text-admin-blue"
                aria-label={`Editar ${category.name}`}
              >
                <Pencil className="h-4 w-4" />
              </Link>

              <form action={deleteCategory}>
                <input type="hidden" name="id" value={category.id} />
                <button
                  type="submit"
                  className="rounded p-1.5 text-ink-500 transition hover:bg-danger-bg hover:text-danger-fg"
                  aria-label={`Eliminar ${category.name}`}
                >
                  <Trash className="h-4 w-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {reorderable && items.length > 1 && (
        <form action={reorderCategories} className="mt-4 flex justify-end">
          <input type="hidden" name="order" value={items.map((item) => item.id).join(",")} />
          <button type="submit" disabled={!dirty} className="btn-secondary">
            <Save className="h-4 w-4" />
            Guardar orden
          </button>
        </form>
      )}
    </section>
  );
}
