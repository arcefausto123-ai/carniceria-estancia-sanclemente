import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getCart, reservedElsewhere } from "@/lib/cart";
import { formatMoney, formatWeight } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { CategoryIcon, Box, Clock, Store, Truck } from "@/components/icons";
import { addToCart } from "./actions";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ categoria?: string; q?: string }>;

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const { categoria, q } = await searchParams;
  const [settings, categories, cart] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ where: { visible: true }, orderBy: { position: "asc" } }),
    getCart(),
  ]);

  const active = categoria ? categories.find((c) => c.slug === categoria) : undefined;
  const search = q?.trim();

  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
    ...(active ? { categoryId: active.id } : {}),
    ...(settings.hideOutOfStock ? { stock: { gt: 0 } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { category: true },
  });

  // Descontamos lo que otros carritos vivos tienen reservado, así no
  // ofrecemos un envase que en la práctica ya está tomado.
  const availability = new Map<string, number>();
  await Promise.all(
    products.map(async (product) => {
      const held = await reservedElsewhere(product.id, cart?.id);
      availability.set(product.id, Math.max(0, product.stock - held));
    }),
  );

  const inCart = new Map(cart?.items.map((item) => [item.productId, item.quantity]) ?? []);

  return (
    <>
      {/* Hero */}
      {!search && !active && (
        <section className="bg-navy text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2">
            <div className="px-6 py-14 lg:py-20 lg:pl-8">
              <h1 className="font-serif text-4xl leading-tight sm:text-5xl lg:text-[3.4rem]">
                Cortes seleccionados,
                <br />
                directo a tu mesa
              </h1>
              <span className="mt-6 mb-6 block h-px w-56 bg-gold-500/70" />
              <p className="max-w-md text-[15px] leading-relaxed text-white/80">
                Elegí tu corte, seleccioná el peso exacto y recibí tu pedido en casa.
              </p>
              <Link href="#catalogo" className="btn-ghost-light mt-8">
                Ver productos
              </Link>
            </div>
            <div className="relative hidden min-h-[380px] lg:block">
              <ProductImage
                src={categories.find((c) => c.coverImage)?.coverImage}
                alt="Cortes envasados al vacío"
                className="absolute inset-0 h-full w-full"
                iconClassName="h-24 w-24"
              />
            </div>
          </div>
        </section>
      )}

      {/* Filtros de categoría */}
      <section id="catalogo" className="mx-auto max-w-7xl px-4 pt-10">
        <div className="flex flex-wrap justify-center gap-3">
          <CategoryPill href="/" active={!active && !search} icon="tag" label="Todos" />
          {categories.map((category) => (
            <CategoryPill
              key={category.id}
              href={`/?categoria=${category.slug}`}
              active={active?.id === category.id}
              icon={category.icon}
              label={category.name}
            />
          ))}
        </div>

        <div className="mt-10 flex items-center gap-5">
          <span className="h-px flex-1 bg-navy/15" />
          <h2 className="font-serif text-3xl text-navy sm:text-[2.1rem]">
            {search
              ? `Resultados para "${search}"`
              : active
                ? active.name
                : "Elegí tu corte"}
          </h2>
          <span className="h-px flex-1 bg-navy/15" />
        </div>

        {active?.highlight && (
          <p className="mt-2 text-center text-sm text-ink-500">{active.highlight}</p>
        )}
      </section>

      {/* Grilla de productos */}
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-12">
        {products.length === 0 ? (
          <div className="shop-card px-6 py-16 text-center">
            <p className="font-serif text-xl text-navy">No encontramos productos</p>
            <p className="mt-2 text-sm text-ink-500">
              {search
                ? "Probá con otro término de búsqueda."
                : "Estamos reponiendo esta categoría. Volvé a mirar en un rato."}
            </p>
            <Link href="/" className="btn-outline-navy mt-6">
              Ver todo el catálogo
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const free = availability.get(product.id) ?? 0;
              const already = inCart.get(product.id) ?? 0;
              const canAdd = already < free;

              return (
                <article
                  key={product.id}
                  className="shop-card flex items-stretch gap-4 overflow-hidden p-3"
                >
                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    className="h-36 w-32 shrink-0 rounded"
                    iconClassName="h-10 w-10"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-center pr-1 text-center">
                    <h3 className="truncate font-serif text-xl text-navy" title={product.name}>
                      {product.name}
                    </h3>
                    <span className="my-2 block border-t border-dashed border-navy/25" />
                    <p className="text-sm text-ink-500">{formatWeight(product.weightGrams)}</p>
                    <p className="mt-1 font-serif text-[1.7rem] leading-tight font-semibold text-navy">
                      {formatMoney(product.priceCents)}
                    </p>

                    {canAdd ? (
                      <form action={addToCart} className="mt-3">
                        <input type="hidden" name="productId" value={product.id} />
                        <button type="submit" className="btn-navy w-full px-4 py-2.5">
                          Agregar
                        </button>
                      </form>
                    ) : (
                      <p className="mt-3 rounded-md bg-cream-200 px-4 py-2.5 text-xs font-medium text-ink-500">
                        {already > 0 ? "Ya está en tu carrito" : "Sin stock"}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Barra de confianza */}
        <div className="shop-card mt-8 grid divide-y divide-navy/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Trust icon={<Box className="h-7 w-7" />} title="Envasado al vacío">
            Conserva frescura y calidad.
          </Trust>
          <Trust icon={<Store className="h-7 w-7" />} title="Retiro en el local">
            {settings.address || "Consultanos la dirección."}
          </Trust>
          <Trust icon={<Truck className="h-7 w-7" />} title="Envíos en la zona">
            Rápidos, seguros y refrigerados.
          </Trust>
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-500">
          <Clock className="h-4 w-4" />
          El stock del carrito se reserva por {settings.stockHoldMinutes} minutos.
        </p>
      </section>
    </>
  );
}

function CategoryPill({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 rounded-full border px-6 py-2.5 text-sm transition ${
        active
          ? "border-navy bg-navy text-white"
          : "border-navy/20 bg-white text-navy hover:border-navy"
      }`}
    >
      <CategoryIcon name={icon} className="h-5 w-5" />
      {label}
    </Link>
  );
}

function Trust({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-5">
      <span className="text-navy/70">{icon}</span>
      <div>
        <p className="font-serif text-lg text-navy">{title}</p>
        <p className="text-xs text-ink-500">{children}</p>
      </div>
    </div>
  );
}
