import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getCart, cartSubtotalCents, cartCount } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { ArrowLeft, Alert, Truck, Store, Whatsapp } from "@/components/icons";
import { CheckoutSteps } from "../steps";
import { saveCheckoutDetails, getCheckoutDraft } from "../../actions";
import { DeliveryForm } from "./delivery-form";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  datos: "Completá nombre, apellido y teléfono para seguir.",
  direccion: "Necesitamos calle, número y localidad para el envío.",
  envio: "El envío a domicilio no está disponible en este momento.",
  retiro: "El retiro en el local no está disponible en este momento.",
  "minimo-zona": "Tu pedido no alcanza el mínimo de esa zona de envío.",
};

type SearchParams = Promise<{ error?: string }>;

export default async function CheckoutDetailsPage({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;
  const [cart, settings, zones, deliverySlots, pickupSlots, draft] = await Promise.all([
    getCart(),
    getSettings(),
    prisma.shippingZone.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
    prisma.timeSlot.findMany({ where: { kind: "DELIVERY", active: true }, orderBy: { position: "asc" } }),
    prisma.timeSlot.findMany({ where: { kind: "PICKUP", active: true }, orderBy: { position: "asc" } }),
    getCheckoutDraft(),
  ]);

  if (!cart || cart.items.length === 0) redirect("/carrito");

  const subtotal = cartSubtotalCents(cart);
  const count = cartCount(cart);

  return (
    <>
      <CheckoutSteps current={1} />

      <form action={saveCheckoutDetails} className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div>
            <h1 className="rule-gold font-serif text-4xl text-navy sm:text-[2.7rem]">
              Completá tus datos
            </h1>

            {error && ERRORS[error] && (
              <p className="mt-5 flex items-center gap-2 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger-fg">
                <Alert className="h-4 w-4 shrink-0" />
                {ERRORS[error]}
              </p>
            )}

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <input
                name="firstName"
                required
                defaultValue={draft?.firstName}
                placeholder="Nombre"
                aria-label="Nombre"
                className="field"
              />
              <input
                name="lastName"
                required
                defaultValue={draft?.lastName}
                placeholder="Apellido"
                aria-label="Apellido"
                className="field"
              />
              <input
                name="phone"
                type="tel"
                required
                defaultValue={draft?.phone}
                placeholder="Teléfono"
                aria-label="Teléfono"
                className="field"
              />
              <input
                name="email"
                type="email"
                defaultValue={draft?.email}
                placeholder="Correo electrónico (opcional)"
                aria-label="Correo electrónico"
                className="field"
              />
            </div>

            <DeliveryForm
              settings={{
                shippingEnabled: settings.shippingEnabled,
                pickupEnabled: settings.pickupEnabled,
                address: settings.address,
              }}
              zones={zones.map((zone) => ({
                id: zone.id,
                name: zone.name,
                feeCents: zone.feeCents,
                minOrderCents: zone.minOrderCents,
                fee: formatMoney(zone.feeCents),
                minOrder: formatMoney(zone.minOrderCents),
              }))}
              deliverySlots={deliverySlots.map((slot) => slot.label)}
              pickupSlots={pickupSlots.map((slot) => slot.label)}
              subtotalCents={subtotal}
              defaults={draft}
            />

            <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-navy/10 pt-6">
              <Link href="/carrito" className="flex items-center gap-2 text-sm text-navy hover:text-gold-600">
                <ArrowLeft className="h-4 w-4" />
                Volver al carrito
              </Link>
              <p className="flex items-center gap-2 text-xs text-ink-500">
                <Whatsapp className="h-5 w-5 text-[#25D366]" />
                Te contactaremos por WhatsApp
                <br className="sm:hidden" /> si necesitamos confirmar algún dato.
              </p>
            </div>
          </div>

          {/* Resumen */}
          <aside className="shop-card h-fit p-6 lg:sticky lg:top-6">
            <h2 className="rule-gold font-serif text-2xl text-navy">Resumen del pedido</h2>

            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-700">
                  {count} {count === 1 ? "producto" : "productos"}
                </dt>
                <dd className="font-medium text-navy">{formatMoney(subtotal)}</dd>
              </div>
              <div className="flex justify-between border-b border-navy/10 pb-4">
                <dt className="text-ink-700" id="summary-shipping-label">
                  Envío
                </dt>
                <dd className="font-medium text-navy" id="summary-shipping">
                  A calcular
                </dd>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <dt className="font-serif text-2xl text-navy">Total</dt>
                <dd
                  className="font-serif text-[1.75rem] font-semibold text-navy"
                  id="summary-total"
                  data-subtotal={subtotal}
                >
                  {formatMoney(subtotal)}
                </dd>
              </div>
            </dl>

            <button type="submit" className="btn-navy mt-6 w-full">
              Continuar al pago
            </button>

            <div className="mt-5 space-y-2 text-xs text-ink-500">
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4" /> Envío refrigerado en el día acordado.
              </p>
              <p className="flex items-center gap-2">
                <Store className="h-4 w-4" /> Retiro sin cargo en el local.
              </p>
            </div>
          </aside>
        </div>
      </form>
    </>
  );
}
