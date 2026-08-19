import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatWeight, formatDate, formatTime } from "@/lib/format";
import { ORDER_TIMELINE, timelineIndex } from "@/lib/orders";
import { whatsappLink, renderTemplate, DEFAULT_TEMPLATES } from "@/lib/whatsapp";
import { ProductImage } from "@/components/product-image";
import { OrderBadge, PaymentBadge } from "@/components/admin/ui";
import { StatusChanger } from "./status-changer";
import { toggleOrderItemPrepared, addOrderNote, registerBalancePayment } from "../../actions";
import {
  ArrowLeft, Printer, User, Truck, Store, Card, Note, Check, Pin, Calendar,
  Whatsapp, Phone, Clock,
} from "@/components/icons";

export const dynamic = "force-dynamic";

type Params = Promise<{ code: string }>;

export default async function OrderDetailPage({ params }: { params: Params }) {
  const { code } = await params;

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        items: { orderBy: { name: "asc" } },
        payments: { orderBy: { createdAt: "asc" } },
        events: { orderBy: { createdAt: "desc" }, take: 10 },
        shippingZone: true,
        customer: true,
      },
    }),
    getSettings(),
  ]);

  if (!order) notFound();

  const current = timelineIndex(order.status);
  const isCash = order.paymentMethod === "CASH_ON_PICKUP";
  const depositPayment = order.payments.find((p) => p.kind === "DEPOSIT" || p.kind === "FULL");
  const balancePaid = order.payments.some((p) => p.kind === "BALANCE" && p.status === "APPROVED");
  const preparedCount = order.items.filter((item) => item.prepared).length;

  // Mensaje sugerido según el estado, listo para enviar por WhatsApp.
  const messageVars = {
    cliente: order.contactFirstName,
    pedido: `#${order.code}`,
    total: formatMoney(order.totalCents),
    sena: formatMoney(order.depositCents),
    saldo: formatMoney(order.balanceCents),
    alias: settings.bankAlias,
    entrega:
      order.deliveryMethod === "PICKUP"
        ? `Podés retirarlo en ${settings.address}.`
        : "Salimos a entregarlo en la franja acordada.",
    negocio: settings.businessName,
  };
  const suggestedTemplate =
    order.status === "READY"
      ? settings.msgReady || DEFAULT_TEMPLATES.ready
      : order.status === "CONFIRMED"
        ? settings.msgPaymentOk || DEFAULT_TEMPLATES.paymentOk
        : settings.msgNewOrder || DEFAULT_TEMPLATES.newOrder;

  return (
    <>
      <Link
        href="/admin/pedidos"
        className="mb-4 inline-flex items-center gap-2 text-sm text-admin-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a pedidos
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl text-ink-900">Pedido #{order.code}</h1>
            <OrderBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Realizado el {formatDate(order.createdAt)} a las {formatTime(order.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/admin/pedidos/${order.code}/imprimir`} className="btn-secondary">
            <Printer className="h-4 w-4" />
            Imprimir pedido
          </Link>
          <StatusChanger code={order.code} current={order.status} />
        </div>
      </div>

      {/* Línea de tiempo */}
      <section className="panel mb-5 px-6 py-7">
        <ol className="flex items-start">
          {ORDER_TIMELINE.map((step, index) => {
            const done = index < current;
            const active = index === current;
            const label =
              step.status === "READY" && order.deliveryMethod === "PICKUP"
                ? "Listo para retirar"
                : step.label;

            return (
              <li key={step.status} className="flex flex-1 flex-col items-center last:flex-none">
                <div className="flex w-full items-center">
                  {index > 0 && (
                    <span className={`h-0.5 flex-1 ${done || active ? "bg-admin-blue" : "bg-ink-200"}`} />
                  )}
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                      done
                        ? "border-admin-blue bg-admin-blue text-white"
                        : active
                          ? "border-admin-blue bg-white"
                          : "border-ink-300 bg-white"
                    }`}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : active ? (
                      <span className="h-3 w-3 rounded-full bg-admin-blue" />
                    ) : null}
                  </span>
                  {index < ORDER_TIMELINE.length - 1 && (
                    <span className={`h-0.5 flex-1 ${done ? "bg-admin-blue" : "bg-ink-200"}`} />
                  )}
                </div>
                <span
                  className={`mt-2.5 text-center text-xs ${
                    done || active ? "font-medium text-ink-900" : "text-ink-500"
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {/* Checklist de preparación */}
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-5 py-4">
              <h2 className="panel-title">Productos del pedido</h2>
              <span className="text-xs text-ink-500">
                {preparedCount}/{order.items.length} preparados
              </span>
            </div>

            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Producto</th>
                  <th className="th text-right">Preparado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          className="h-14 w-16 shrink-0 rounded"
                          iconClassName="h-5 w-5"
                        />
                        <span>
                          <span className="font-medium text-ink-900">{item.name}</span>
                          <span className="text-ink-500">
                            {" "}
                            · {formatWeight(item.weightGrams)} · {formatMoney(item.priceCents)}
                          </span>
                          {item.quantity > 1 && (
                            <span className="block text-xs text-ink-500">
                              {item.quantity} unidades ={" "}
                              {formatMoney(item.priceCents * item.quantity)}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="td text-right">
                      <form action={toggleOrderItemPrepared} className="inline-flex">
                        <input type="hidden" name="itemId" value={item.id} />
                        <button
                          type="submit"
                          role="checkbox"
                          aria-checked={item.prepared}
                          aria-label={`Marcar ${item.name} como preparado`}
                          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition ${
                            item.prepared
                              ? "border-admin-blue bg-admin-blue text-white"
                              : "border-ink-300 hover:border-admin-blue"
                          }`}
                        >
                          {item.prepared && <Check className="h-3 w-3" />}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-ink-200">
                {order.shippingCents > 0 && (
                  <tr>
                    <td className="td text-ink-500">Envío</td>
                    <td className="td text-right">{formatMoney(order.shippingCents)}</td>
                  </tr>
                )}
                <tr>
                  <td className="td font-serif text-lg text-ink-900">Total del pedido</td>
                  <td className="td text-right font-serif text-lg font-semibold text-ink-900">
                    {formatMoney(order.totalCents)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Notas internas */}
          <section className="panel p-5">
            <h2 className="panel-title flex items-center gap-2">
              <Note className="h-5 w-5 text-ink-500" />
              Notas internas
            </h2>

            <form action={addOrderNote} className="mt-4 flex gap-3">
              <input type="hidden" name="code" value={order.code} />
              <input
                name="note"
                required
                placeholder="Agregar una nota para el equipo..."
                aria-label="Nota interna"
                className="admin-field flex-1"
              />
              <button type="submit" className="btn-primary">
                Guardar nota
              </button>
            </form>

            {order.events.length > 0 && (
              <ul className="mt-5 space-y-3 border-t border-ink-200 pt-4">
                {order.events.map((event) => (
                  <li key={event.id} className="flex gap-3 text-sm">
                    <span className="shrink-0 text-xs text-ink-500">
                      {formatDate(event.createdAt)} {formatTime(event.createdAt)}
                    </span>
                    <span className="text-ink-700">{event.message}</span>
                    <span className="ml-auto shrink-0 text-xs text-ink-500">{event.author}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-5">
          {/* Cliente */}
          <section className="panel p-5">
            <h2 className="panel-title flex items-center gap-2">
              <User className="h-5 w-5 text-ink-500" />
              Cliente
            </h2>
            <p className="mt-3 font-medium text-ink-900">
              {order.contactFirstName} {order.contactLastName}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-ink-700">
              <Phone className="h-4 w-4 text-ink-500" />
              {order.contactPhone}
            </p>
            {order.contactEmail && (
              <p className="mt-1 text-sm text-ink-700">{order.contactEmail}</p>
            )}

            <a
              href={whatsappLink(order.contactPhone, renderTemplate(suggestedTemplate, messageVars))}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border
                         border-ok-fg/30 bg-white px-4 py-2.5 text-sm font-medium text-ok-fg
                         transition hover:bg-ok-bg"
            >
              <Whatsapp className="h-5 w-5" />
              Contactar por WhatsApp
            </a>
            <p className="mt-2 text-center text-xs text-ink-500">
              Se abre con el mensaje sugerido ya escrito.
            </p>

            <Link
              href={`/admin/clientes?ver=${order.customerId}`}
              className="mt-3 block text-center text-xs text-admin-blue hover:underline"
            >
              Ver ficha del cliente
            </Link>
          </section>

          {/* Entrega */}
          <section className="panel p-5">
            <h2 className="panel-title flex items-center gap-2">
              {order.deliveryMethod === "PICKUP" ? (
                <Store className="h-5 w-5 text-ink-500" />
              ) : (
                <Truck className="h-5 w-5 text-ink-500" />
              )}
              Entrega
            </h2>
            <p className="mt-3 font-medium text-ink-900">
              {order.deliveryMethod === "PICKUP" ? "Retiro en el local" : "Envío a domicilio"}
            </p>
            <div className="mt-2 space-y-1.5 text-sm text-ink-700">
              {order.slotLabel && (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-ink-500" />
                  {order.slotLabel} hs
                </p>
              )}
              <p className="flex items-start gap-2">
                <Pin className="mt-px h-4 w-4 shrink-0 text-ink-500" />
                {order.deliveryMethod === "PICKUP"
                  ? settings.address
                  : `${order.street} ${order.number}${order.apartment ? `, ${order.apartment}` : ""}, ${order.locality}${order.postalCode ? ` (${order.postalCode})` : ""}`}
              </p>
              {order.shippingZone && (
                <p className="text-xs text-ink-500">Zona: {order.shippingZone.name}</p>
              )}
              {order.instructions && (
                <p className="rounded-lg bg-admin-bg px-3 py-2 text-xs text-ink-700">
                  {order.instructions}
                </p>
              )}
            </div>
          </section>

          {/* Pago */}
          <section className="panel p-5">
            <h2 className="panel-title flex items-center gap-2">
              <Card className="h-5 w-5 text-ink-500" />
              Pago
            </h2>
            <p className="mt-3 font-medium text-ink-900">
              {isCash ? "Efectivo al retirar" : "Transferencia bancaria"}
            </p>

            <dl className="mt-3 space-y-2 text-sm">
              {isCash ? (
                <>
                  <Row label={`Seña requerida (${order.depositPct}%)`} value={formatMoney(order.depositCents)} />
                  <Row
                    label="Seña validada"
                    value={
                      depositPayment?.status === "APPROVED"
                        ? formatMoney(depositPayment.reportedCents ?? depositPayment.expectedCents)
                        : "—"
                    }
                  />
                  <Row label="Saldo al retirar" value={formatMoney(order.balanceCents)} />
                </>
              ) : (
                <Row label="Pago total" value={formatMoney(order.totalCents)} />
              )}
            </dl>

            {depositPayment && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <PaymentBadge status={depositPayment.status} />
                <Link href="/admin/pagos" className="text-xs text-admin-blue hover:underline">
                  Ver comprobante
                </Link>
              </div>
            )}

            {isCash && order.balanceCents > 0 && !balancePaid && order.status !== "NEW" && (
              <form action={registerBalancePayment} className="mt-4">
                <input type="hidden" name="code" value={order.code} />
                <button type="submit" className="btn-secondary w-full">
                  Registrar cobro del saldo
                </button>
              </form>
            )}

            {balancePaid && (
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-ok-bg px-3 py-2.5 text-xs text-ok-fg">
                <Check className="h-4 w-4" />
                Saldo cobrado en el local.
              </p>
            )}

            {order.status === "NEW" && (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-warn-bg px-3 py-2.5 text-xs text-warn-fg">
                <Clock className="mt-px h-4 w-4 shrink-0" />
                Esperando la validación manual del comprobante desde Pagos.
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-900">{value}</dd>
    </div>
  );
}
