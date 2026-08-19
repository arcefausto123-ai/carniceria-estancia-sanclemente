import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatWeight } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { StatCard, ProductBadge, TabLink, PageHeader, EmptyState } from "@/components/admin/ui";
import { ProductDrawer } from "./product-drawer";
import { duplicateProduct, deleteProduct } from "../actions";
import { Tag, Box, Alert, XCircle, Plus, Upload, Pencil, Copy, Trash, Search } from "@/components/icons";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type SearchParams = Promise<{
  tab?: string;
  q?: string;
  categoria?: string;
  estado?: string;
  orden?: string;
  page?: string;
  nuevo?: string;
  editar?: string;
}>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tab = params.tab ?? "todos";
  const page = Math.max(1, Number(params.page ?? 1));
  const search = params.q?.trim();

  const tabFilter: Prisma.ProductWhereInput =
    tab === "publicados"
      ? { status: "PUBLISHED", stock: { gt: 0 } }
      : tab === "borradores"
        ? { status: "DRAFT" }
        : tab === "sin-stock"
          ? { stock: { lte: 0 } }
          : {};

  const where: Prisma.ProductWhereInput = {
    ...tabFilter,
    ...(params.categoria ? { categoryId: params.categoria } : {}),
    ...(params.estado === "PUBLISHED" || params.estado === "DRAFT"
      ? { status: params.estado }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.orden === "precio"
      ? { priceCents: "desc" }
      : params.orden === "stock"
        ? { stock: "asc" }
        : params.orden === "reciente"
          ? { createdAt: "desc" }
          : { name: "asc" };

  const [products, total, categories, published, inStock, low, out, editing] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: { category: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { position: "asc" } }),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { stock: { gt: 0 } } }),
    prisma.product.count({ where: { stock: { gt: 0, lte: 2 } } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
    params.editar
      ? prisma.product.findUnique({ where: { id: params.editar } })
      : Promise.resolve(null),
  ]);

  const [countAll, countPublished, countDrafts, countOut] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "PUBLISHED", stock: { gt: 0 } } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const drawerOpen = params.nuevo === "1" || Boolean(editing);
  const query = (extra: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, ...extra })) {
      if (value) next.set(key, String(value));
    }
    next.delete("nuevo");
    next.delete("editar");
    return `/admin/productos?${next.toString()}`;
  };

  return (
    <div className={drawerOpen ? "grid gap-6 xl:grid-cols-[1fr_380px]" : ""}>
      <div className="min-w-0">
        <PageHeader
          title="Productos y stock"
          subtitle="Cargá y administrá cada envase disponible en la tienda"
          actions={
            <>
              <Link href="/admin/productos?nuevo=1" className="btn-primary">
                <Plus className="h-4 w-4" />
                Agregar producto
              </Link>
              <Link href="/admin/productos/importar" className="btn-secondary">
                <Upload className="h-4 w-4" />
                Importar planilla
              </Link>
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<Tag className="h-6 w-6" />} label="Productos publicados" value={published} />
          <StatCard icon={<Box className="h-6 w-6" />} label="Stock disponible" value={inStock} tone="ok" />
          <StatCard icon={<Alert className="h-6 w-6" />} label="Stock bajo" value={low} tone="warn" />
          <StatCard icon={<XCircle className="h-6 w-6" />} label="Sin stock" value={out} tone="danger" />
        </div>

        {/* Pestañas */}
        <div className="mt-6 flex gap-6 overflow-x-auto border-b border-ink-200 no-scrollbar">
          <TabLink href={query({ tab: undefined, page: undefined })} active={tab === "todos"} label="Todos" count={countAll} />
          <TabLink href={query({ tab: "publicados", page: undefined })} active={tab === "publicados"} label="Publicados" count={countPublished} />
          <TabLink href={query({ tab: "borradores", page: undefined })} active={tab === "borradores"} label="Borradores" count={countDrafts} />
          <TabLink href={query({ tab: "sin-stock", page: undefined })} active={tab === "sin-stock"} label="Sin stock" count={countOut} />
        </div>

        {/* Filtros */}
        <form className="mt-4 flex flex-wrap gap-3">
          <input type="hidden" name="tab" value={tab} />
          <div className="relative min-w-52 flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              name="q"
              defaultValue={search}
              placeholder="Buscar por nombre o código..."
              aria-label="Buscar productos"
              className="admin-field pl-9"
            />
          </div>
          <select name="categoria" defaultValue={params.categoria ?? ""} className="admin-field w-auto" aria-label="Categoría">
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select name="estado" defaultValue={params.estado ?? ""} className="admin-field w-auto" aria-label="Estado">
            <option value="">Todos los estados</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="DRAFT">Borrador</option>
          </select>
          <select name="orden" defaultValue={params.orden ?? ""} className="admin-field w-auto" aria-label="Ordenar por">
            <option value="">Ordenar por nombre</option>
            <option value="precio">Mayor precio</option>
            <option value="stock">Menor stock</option>
            <option value="reciente">Más recientes</option>
          </select>
          <button type="submit" className="btn-secondary">
            Aplicar
          </button>
        </form>

        {/* Tabla */}
        <section className="panel mt-4 overflow-hidden">
          {products.length === 0 ? (
            <EmptyState
              title="No hay productos que coincidan"
              body="Probá con otro filtro o cargá un producto nuevo."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead className="bg-ink-100/60">
                  <tr>
                    <th className="th">Foto</th>
                    <th className="th">Producto</th>
                    <th className="th">Código</th>
                    <th className="th">Categoría</th>
                    <th className="th">Peso exacto</th>
                    <th className="th">Precio final</th>
                    <th className="th">Stock</th>
                    <th className="th">Estado</th>
                    <th className="th">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {products.map((product) => (
                    <tr key={product.id} className="row-hover">
                      <td className="td">
                        <ProductImage
                          src={product.image}
                          alt={product.name}
                          className="h-11 w-14 rounded"
                          iconClassName="h-4 w-4"
                        />
                      </td>
                      <td className="td font-medium text-ink-900">{product.name}</td>
                      <td className="td text-ink-500">{product.sku ?? "—"}</td>
                      <td className="td">{product.category.name}</td>
                      <td className="td">{formatWeight(product.weightGrams)}</td>
                      <td className="td font-medium text-ink-900">{formatMoney(product.priceCents)}</td>
                      <td className="td">
                        {product.stock} {product.stock === 1 ? "unidad" : "unidades"}
                      </td>
                      <td className="td">
                        <ProductBadge status={product.status} stock={product.stock} />
                      </td>
                      <td className="td">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/productos?editar=${product.id}`}
                            className="rounded p-1.5 text-ink-500 transition hover:bg-info-bg hover:text-admin-blue"
                            aria-label={`Editar ${product.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <form action={duplicateProduct}>
                            <input type="hidden" name="id" value={product.id} />
                            <button
                              type="submit"
                              className="rounded p-1.5 text-ink-500 transition hover:bg-info-bg hover:text-admin-blue"
                              aria-label={`Duplicar ${product.name}`}
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </form>
                          <form action={deleteProduct}>
                            <input type="hidden" name="id" value={product.id} />
                            <button
                              type="submit"
                              className="rounded p-1.5 text-ink-500 transition hover:bg-danger-bg hover:text-danger-fg"
                              aria-label={`Eliminar ${product.name}`}
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 px-5 py-3.5">
              <p className="text-sm text-ink-500">
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}{" "}
                productos
              </p>
              {pages > 1 && (
                <nav className="flex items-center gap-1">
                  {Array.from({ length: pages }, (_, index) => index + 1)
                    .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1)
                    .map((n, index, list) => (
                      <span key={n} className="flex items-center gap-1">
                        {index > 0 && list[index - 1] !== n - 1 && (
                          <span className="px-1 text-ink-500">…</span>
                        )}
                        <Link
                          href={query({ page: String(n) })}
                          className={`flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm ${
                            n === page
                              ? "bg-admin-blue font-medium text-white"
                              : "text-ink-700 hover:bg-ink-100"
                          }`}
                        >
                          {n}
                        </Link>
                      </span>
                    ))}
                </nav>
              )}
            </div>
          )}
        </section>
      </div>

      {drawerOpen && (
        <ProductDrawer
          product={editing}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      )}
    </div>
  );
}
