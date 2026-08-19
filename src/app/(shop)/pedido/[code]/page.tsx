import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatWeight } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_TIMELINE, timelineIndex } from "@/lib/orders";
import { whatsappLink } from "@/lib/whatsapp";
import { CheckCircle, Clock, Store, Truck, Pin, Whatsapp, Check } from "@/components/icons";
import { CheckoutSteps } from "../../checkout/steps";
import { ProductImage } from "@/components/product-image";
import { TransferForm } from "./transfer-form";

export const dynamic = "force-dynamic";

type Params = Promise<{ code: string }>;
type SearchParams = Promise<{ estado?: string; informado?: string }>;

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { code } = await params;
  const { estado, informado } = await searchParams;

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { code: code.toUpperCase() },
      include: { items: true, payments: { orderBy: { createdAt: "asc" } }, shippingZone: true },
    }),
    getSettings(),
  ]);

  if (!order) notFound();

  const showTracking = estado === "1";
  const pending = order.payments.find((p) => p.status === "PENDING");
  const pendingPayment = Boolean(pending);
  const approvedPayment = order.payments.find((p) => p.status === "APPROVED");
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const isCash = order.paymentMethod === "CASH_ON_PICKUP";

  const consultText =
    `Hola! Consulto por mi pedido ${order.code} a nombre de ` +
    `${order.contactFirstName} ${order.contactLastName}.`;

  return (
    <>
      {!showTracking && <CheckoutSteps current={3} />}

      <div className="mx-auto max-w-4xl px-4 pt-4 pb-16">
        {showTracking ? (
          <TrackingHeader order={{ code: order.code, status: order.status }} />
        ) : (
          <header className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-navy" strokeWidth={1.3} />
            <h1 className="mt-5 font-serif text-4xl text-navy sm:text-[3rem]">¡Pedido recibido!</h1>
            <p className="mt-2 text-[15px] text-ink-700">
              Tu pedido <strong className="font-semibold text-navy">#{order.code}</strong> fue
              registrado correctamente.
            </p>
          </header>
        )}

        {/* Aviso de validación manual */}
        {pendingPayment && (
          <div className="mt-7 flex items-start gap-3 rounded-md bg-cream-200/80 px-6 py-5">
            <Clock className="mt-0.5 h-6 w-6 shrink-0 text-navy" />
            <p className="text-[15px] leading-relaxed text-ink-700">
              Estamos validando tu comprobante.
              <br />
              Te avisaremos por WhatsApp cuando la reserva quede confirmada.
            </p>
          </div>
        )}

        {informado === "1" && (
          <p className="mt-5 flex items-center gap-2 rounded-md bg-ok-bg px-5 py-4 text-sm text-ok-fg">
            <CheckCircle className="h-5 w-5 shrink-0" />
            ¡Gracias! Recibimos los datos de tu transferencia.
          </p>
        )}

        {/* Informar la transferencia */}
        {pending && (
          <TransferForm
            code={order.code}
            paymentId={pending.id}
            concept={pending.kind === "DEPOSIT" ? `la seña del ${order.depositPct}%` : "el pago total"}
            expected={formatMoney(pending.expectedCents)}
            reported={pending.reportedCents !== null}
          />
        )}

        {/* Entrega + pago */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <section className="shop-card p-6">
            <div className="flex items-center gap-3">
              {order.deliveryMethod === "PICKUP" ? (
                <Store className="h-7 w-7 text-navy" />
              ) : (
                <Truck className="h-7 w-7 text-navy" />
              )}
              <h2 className="font-serif text-xl text-navy">
                {order.deliveryMethod === "PICKUP" ? "Retiro en el local" : "Envío a domicilio"}
              </h2>
            </div>

            <div className="mt-4 space-y-2 text-sm text-ink-700">
              {order.deliveryMethod === "PICKUP" ? (
                <>
                  <p className="font-medium text-navy">{settings.businessName}</p>
                  {settings.address && (
                    <p className="flex items-start gap-2">
                      <Pin className="mt-px h-4 w-4 shrink-0 text-ink-500" />
                      {settings.address}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-medium text-navy">
                    {order.street} {order.number}
                    {order.apartment ? `, ${order.apartment}` : ""}
                  </p>
                  <p className="flex items-start gap-2">
                    <Pin className="mt-px h-4 w-4 shrink-0 text-ink-500" />
                    {order.locality}
                    {order.postalCode ? ` (${order.postalCode})` : ""}
                  </p>
                  {order.shippingZone && (
                    <p className="text-xs text-ink-500">Zona: {order.shippingZone.name}</p>
                  )}
                </>
              )}
              {order.slotLabel && (
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-ink-500" />
                  {order.slotLabel} hs
                </p>
              )}
            </div>
          </section>

          <section className="shop-card p-6">
            <h2 className="font-serif text-xl text-navy">Detalle del pago</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {isCash ? (
                <>
                  <Line
                    label={approvedPayment ? "Seña abonada" : `Seña a pagar ahora (${order.depositPct}%)`}
                    value={formatMoney(order.depositCents)}
                  />
                  <Line label="Saldo al retirar" value={formatMoney(order.balanceCents)} />
                  <Line label="Forma de pago" value="Efectivo al retirar" />
                </>
              ) : (
                <>
                  <Line
                    label={approvedPayment ? "Pago acreditado" : "Pago a transferir"}
                    value={formatMoney(order.totalCents)}
                  />
                  <Line label="Forma de pago" value="Transferencia bancaria" />
                </>
              )}
              {settings.bankAlias && pendingPayment && (
                <Line label="Alias" value={settings.bankAlias} />
              )}
            </dl>
          </section>
        </div>

        {/* Resumen */}
        <section className="shop-card mt-5 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-navy">Resumen del pedido</h2>
            <span className="text-sm text-ink-500">
              {itemCount} {itemCount === 1 ? "producto" : "productos"}
            </span>
            <span className="flex items-baseline gap-3">
              <span className="text-sm text-ink-700">Total</span>
              <span className="font-serif text-xl font-semibold text-navy">
                {formatMoney(order.totalCents)}
              </span>
            </span>
          </div>

          {showTracking && (
            <ul className="mt-5 divide-y divide-navy/10 border-t border-navy/10">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-16 shrink-0 rounded"
                    iconClassName="h-5 w-5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">{item.name}</p>
                    <p className="text-xs text-ink-500">
                      {formatWeight(item.weightGrams)}
                      {item.quantity > 1 ? ` · ${item.quantity} unidades` : ""}
                    </p>
                  </div>
                  <span className="text-sm text-navy">
                    {formatMoney(item.priceCents * item.quantity)}
                  </span>
                </li>
              ))}
              <li className="flex justify-between py-3 text-sm">
                <span className="text-ink-700">Subtotal</span>
                <span className="text-navy">{formatMoney(order.subtotalCents)}</span>
              </li>
              {order.shippingCents > 0 && (
                <li className="flex justify-between py-3 text-sm">
                  <span className="text-ink-700">Envío</span>
                  <span className="text-navy">{formatMoney(order.shippingCents)}</span>
                </li>
              )}
            </ul>
          )}
        </section>

        {/* Acciones */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {showTracking ? (
            <Link href="/" className="btn-navy">
              Volver al inicio
            </Link>
          ) : (
            <Link href={`/pedido/${order.code}?estado=1`} className="btn-navy">
              Ver estado del pedido
            </Link>
          )}
          <a
            href={whatsappLink(settings.whatsapp, consultText)}
            target="_blank"
            rel="noreferrer"
            className="btn-outline-navy"
          >
            <Whatsapp className="h-5 w-5 text-[#25D366]" />
            Consultar por WhatsApp
          </a>
        </div>

        {!showTracking && (
          <Link
            href="/"
            className="mt-5 block text-center text-sm text-navy underline underline-offset-4"
          >
            Volver al inicio
          </Link>
        )}

        <p className="mt-6 text-center text-xs text-ink-500">
          Guardá tu número de pedido para cualquier consulta.
        </p>
      </div>
    </>
  );
}

function TrackingHeader({ order }: { order: { code: string; status: string } }) {
  const current = timelineIndex(order.status as never);

  return (
    <header>
      <p className="text-sm text-ink-500">Seguimiento</p>
      <h1 className="mt-1 font-serif text-4xl text-navy">Pedido #{order.code}</h1>
      <p className="mt-1 text-sm text-ink-700">
        Estado actual:{" "}
        <strong className="font-semibold text-navy">
          {ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL]}
        </strong>
      </p>

      <ol className="mt-7 flex items-start">
        {ORDER_TIMELINE.map((step, index) => {
          const done = index <= current;
          return (
            <li key={step.status} className="flex flex-1 flex-col items-center last:flex-none">
              <div className="flex w-full items-center">
                {index > 0 && (
                  <span className={`h-0.5 flex-1 ${done ? "bg-navy" : "bg-navy/15"}`} />
                )}
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                    done ? "border-navy bg-navy text-white" : "border-navy/25 bg-white"
                  }`}
                >
                  {done && <Check className="h-3.5 w-3.5" />}
                </span>
                {index < ORDER_TIMELINE.length - 1 && (
                  <span
                    className={`h-0.5 flex-1 ${index < current ? "bg-navy" : "bg-navy/15"}`}
                  />
                )}
              </div>
              <span
                className={`mt-2 text-center text-[11px] leading-tight sm:text-xs ${
                  done ? "text-navy" : "text-ink-500"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </header>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed border-navy/15 pb-2.5 last:border-0 last:pb-0">
      <dt className="text-ink-700">{label}</dt>
      <dd className="font-medium text-navy">{value}</dd>
    </div>
  );
}
