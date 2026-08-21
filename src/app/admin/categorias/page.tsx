import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { Info, Plus } from "@/components/icons";
import { CategoryList } from "./category-list";
import { CategoryDrawer } from "./category-drawer";
import { storageEnabled } from "@/lib/storage";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ nuevo?: string; editar?: string; error?: string }>;

export default async function CategoriesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const editing = params.editar ? categories.find((c) => c.id === params.editar) : undefined;
  const drawerOpen = params.nuevo === "1" || Boolean(editing);

  const active = categories.filter((c) => c.visible);
  const hidden = categories.filter((c) => !c.visible);

  return (
    <div className={drawerOpen ? "grid gap-6 xl:grid-cols-[1fr_380px]" : ""}>
      <div className="min-w-0">
        <PageHeader
          title="Categorías"
          subtitle="Organizá cómo se muestran los productos en la tienda"
          actions={
            <Link href="/admin/categorias?nuevo=1" className="btn-primary">
              <Plus className="h-4 w-4" />
              Nueva categoría
            </Link>
          }
        />

        {params.error === "con-productos" && (
          <p className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger-fg">
            No se puede eliminar una categoría que todavía tiene productos. Movelos primero.
          </p>
        )}

        <p className="mb-5 flex items-center gap-2 rounded-lg bg-info-bg px-4 py-3 text-sm text-info-fg">
          <Info className="h-4 w-4 shrink-0" />
          El orden de esta lista es el mismo que verán los clientes en el catálogo.
        </p>

        <CategoryList
          title="Categorías activas"
          categories={active.map(toItem)}
          reorderable
          emptyMessage="Todavía no hay categorías visibles en la tienda."
        />

        <div className="mt-6">
          <CategoryList
            title="Categorías ocultas"
            categories={hidden.map(toItem)}
            emptyMessage="No hay categorías ocultas."
          />
        </div>
      </div>

      {drawerOpen && (
        <CategoryDrawer category={editing ? toItem(editing) : null} storageReady={storageEnabled} />
      )}
    </div>
  );
}

function toItem(category: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  highlight: string | null;
  icon: string;
  coverImage: string | null;
  visible: boolean;
  _count: { products: number };
}) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    highlight: category.highlight,
    icon: category.icon,
    coverImage: category.coverImage,
    visible: category.visible,
    productCount: category._count.products,
  };
}

export type CategoryItem = ReturnType<typeof toItem>;
