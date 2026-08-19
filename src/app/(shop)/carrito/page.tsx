import Link from "next/link";
import { getCart, cartSubtotalCents, cartCount, availableStock } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatWeight } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { Cart as CartIcon, Clock, Box, Tag, CheckCircle, Alert } from "@/components/icons";
import { setCartQuantity, removeCartItem } from "../actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function CartPage({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;
  const [cart, settings] = await Promise.all([getCart(), getSettings()]);
  const subtotal = cartSubtotalCents(cart);
  const count = cartCount(cart);
  const belowMinimum = subtotal > 0 && subtotal < settings.minOrderCents;

  const stock = new Map<string, number>();
  if (cart) {
    await Promise.all(
      cart.items.map(async (item) => {
        stock.set(item.id, await availableStock(item.product, cart.id));
      }),
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="text-sm text-ink-500">
        <Link href="/" className="hover:text-navy">
          Inicio
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="text-navy">Mi carrito</span>
      </nav>

      <h1 className="rule-gold mt-4 font-serif text-4xl text-navy sm:text-[2.8rem]">Tu pedido</h1>

      {!cart || cart.items.length === 0 ? (
        <div className="shop-card mt-8 px-6 py-20 text-center">
          <CartIcon className="mx-auto h-12 w-12 text-navy/25" />
          <p className="mt-4 font-serif text-2xl text-navy">Tu carrito está vacío</p>
          <p className="mt-2 text-sm text-ink-500">
            Agregá los cortes que quieras y te los preparamos.
          </p>
          <Link href="/" className="btn-navy mt-6">
            Ver el catálogo
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Lista de productos */}
          <section className="shop-card p-5 sm:p-6">
            <ul className="divide-y divide-navy/10">
              {cart.items.map((item) => {
                const max = stock.get(item.id) ?? item.quantity;
                return (
                  <li key={item.id} className="flex items-center gap-4 py-5 first:pt-0">
                    <ProductImage
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-24 w-32 shrink-0 rounded"
                      iconClassName="h-8 w-8"
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-serif text-xl text-navy">{item.product.name}</h2>
                      <p className="mt-1 text-sm text-ink-500">
                        {formatWeight(item.product.weightGrams)}
                      </p>
                      <p className="mt-1 font-serif text-xl font-semibold text-navy">
                        {formatMoney(item.product.priceCents * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-ink-500">
                          {formatMoney(item.product.priceCents)} c/u
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center rounded-full border border-navy/20 bg-white">
                        <QuantityButton
                          itemId={item.id}
                          quantity={item.quantity - 1}
                          label="Quitar una unidad"
                        >
                          −
                        </QuantityButton>
                        <span className="w-12 border-x border-navy/20 py-2 text-center text-sm text-navy">
                          {item.quantity}
                        </span>
                        <QuantityButton
                          itemId={item.id}
                          quantity={item.quantity + 1}
                          label="Agregar una unidad"
                          disabled={item.quantity >= max}
                        >
                          +
                        </QuantityButton>
                      </div>
                      <form action={removeCartItem}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <button
                          type="submit"
                          className="text-xs text-ink-500 underline underline-offset-2 hover:text-navy"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-5 flex items-center gap-2 border-t border-navy/10 pt-4 text-xs text-ink-500">
              <Tag className="h-4 w-4" />
              Cada envase tiene peso y precio exactos.
            </p>
          </section>

          {/* Resumen */}
          <aside className="shop-card h-fit p-6">
            <h2 className="rule-gold font-serif text-2xl text-navy">Resumen</h2>

            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-700">Subtotal</dt>
                <dd className="font-medium text-navy">{formatMoney(subtotal)}</dd>
              </div>
              <div className="flex justify-between border-b border-navy/10 pb-4">
                <dt className="text-ink-700">Envío</dt>
                <dd className="text-ink-500">Se calcula en el siguiente paso</dd>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <dt className="font-serif text-2xl text-navy">Total</dt>
                <dd className="font-serif text-[1.75rem] font-semibold text-navy">
                  {formatMoney(subtotal)}
                </dd>
              </div>
            </dl>

            {(belowMinimum || error === "minimo") && (
              <p className="mt-4 flex items-start gap-2 rounded-md bg-warn-bg px-3 py-2.5 text-xs text-warn-fg">
                <Alert className="mt-px h-4 w-4 shrink-0" />
                El pedido mínimo es de {formatMoney(settings.minOrderCents)}. Te faltan{" "}
                {formatMoney(Math.max(0, settings.minOrderCents - subtotal))}.
              </p>
            )}

            <Link
              href="/checkout/datos"
              aria-disabled={belowMinimum}
              className={`btn-navy mt-6 w-full ${belowMinimum ? "pointer-events-none opacity-50" : ""}`}
            >
              Continuar compra
            </Link>
            <Link
              href="/"
              className="mt-4 block text-center text-sm text-navy underline underline-offset-4"
            >
              Seguir comprando
            </Link>

            <p className="mt-5 text-center text-xs text-ink-500">
              {count} {count === 1 ? "producto" : "productos"} en el carrito
            </p>
          </aside>
        </div>
      )}

      {/* Barra de confianza */}
      <div className="mt-10 grid gap-4 border-t border-navy/10 pt-6 text-sm text-navy sm:grid-cols-3">
        <span className="flex items-center justify-center gap-2">
          <CheckCircle className="h-5 w-5" /> Compra segura
        </span>
        <span className="flex items-center justify-center gap-2 sm:border-x sm:border-navy/10">
          <Box className="h-5 w-5" /> Envasado al vacío
        </span>
        <span className="flex items-center justify-center gap-2">
          <Clock className="h-5 w-5" /> Stock reservado por {settings.stockHoldMinutes} minutos
        </span>
      </div>
    </div>
  );
}

function QuantityButton({
  itemId,
  quantity,
  label,
  disabled,
  children,
}: {
  itemId: string;
  quantity: number;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <form action={setCartQuantity}>
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="quantity" value={quantity} />
      <button
        type="submit"
        aria-label={label}
        disabled={disabled}
        className="px-3.5 py-2 text-lg leading-none text-navy transition hover:text-gold-600
                   disabled:cursor-not-allowed disabled:opacity-30"
      >
        {children}
      </button>
    </form>
  );
}
