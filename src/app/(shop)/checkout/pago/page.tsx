import Link from "next/link";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { getCart, cartSubtotalCents, cartCount } from "@/lib/cart";
import { calculateDeposit } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import { ArrowLeft } from "@/components/icons";
import { CheckoutSteps } from "../steps";
import { placeOrder, getCheckoutDraft } from "../../actions";
import { PaymentChoice } from "./payment-choice";

export const dynamic = "force-dynamic";

export default async function CheckoutPaymentPage() {
  const [cart, settings, draft] = await Promise.all([getCart(), getSettings(), getCheckoutDraft()]);

  if (!cart || cart.items.length === 0) redirect("/carrito");
  if (!draft) redirect("/checkout/datos");

  const subtotal = cartSubtotalCents(cart);
  const shipping = draft.deliveryMethod === "SHIPPING" ? draft.shippingCents : 0;
  const total = subtotal + shipping;
  const count = cartCount(cart);

  // La seña sale del % vigente en Configuración, no de un número fijo.
  const deposit = calculateDeposit(total, settings.depositPct);

  return (
    <>
      <CheckoutSteps current={2} />

      <form action={placeOrder} className="mx-auto max-w-7xl px-4 pb-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div>
            <h1 className="rule-gold font-serif text-4xl text-navy sm:text-[2.7rem]">
              Elegí cómo pagar
            </h1>

            <PaymentChoice
              total={formatMoney(total)}
              depositPct={deposit.depositPct}
              deposit={formatMoney(deposit.depositCents)}
              balance={formatMoney(deposit.balanceCents)}
              alias={settings.bankAlias}
              holder={settings.bankHolder}
              whatsapp={settings.whatsapp}
              customerName={`${draft.firstName} ${draft.lastName}`.trim()}
              pickupOnly={draft.deliveryMethod === "PICKUP"}
            />

            <Link
              href="/checkout/datos"
              className="mt-8 -mb-2 flex items-center gap-2 p-2 text-sm text-navy hover:text-gold-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a datos y entrega
            </Link>
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
                <dt className="text-ink-700">
                  {draft.deliveryMethod === "SHIPPING" ? "Envío refrigerado" : "Retiro en el local"}
                </dt>
                <dd className="font-medium text-navy">
                  {draft.deliveryMethod === "SHIPPING" ? formatMoney(shipping) : "Gratis"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <dt className="font-serif text-2xl text-navy">Total</dt>
                <dd className="font-serif text-[1.75rem] font-semibold text-navy">
                  {formatMoney(total)}
                </dd>
              </div>
            </dl>

            <button type="submit" className="btn-navy mt-6 w-full">
              Confirmar pedido
            </button>

            <p className="mt-4 text-center text-xs text-ink-500">
              Al confirmar reservamos tu pedido. La compra queda validada cuando revisamos tu
              comprobante.
            </p>
          </aside>
        </div>
      </form>
    </>
  );
}
