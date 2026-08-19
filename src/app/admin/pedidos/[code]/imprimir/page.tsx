import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatWeight, formatDateTime } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import { PrintButton } from "@/components/admin/print";
import { ArrowLeft } from "@/components/icons";

export const dynamic = "force-dynamic";

type Params = Promise<{ code: string }>;

/** Comanda del pedido, pensada para imprimir y llevar al mostrador. */
export default async function PrintOrderPage({ params }: { params: Params }) {
  const { code } = await params;
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { code: code.toUpperCase() },
      include: { items: { orderBy: { name: "asc" } }, shippingZone: true },
    }),
    getSettings(),
  ]);

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <Link
          href={`/admin/pedidos/${order.code}`}
          className="inline-flex items-center gap-2 text-sm text-admin-blue hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al pedido
        </Link>
        <PrintButton label="Imprimir" />
      </div>

      <article className="panel p-8 print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-4 border-b border-ink-200 pb-4">
          <div>
            <h1 className="font-serif text-2xl text-ink-900">{settings.businessName}</h1>
            {settings.address && <p className="text-xs text-ink-500">{settings.address}</p>}
            {settings.whatsapp && <p className="text-xs text-ink-500">{settings.whatsapp}</p>}
          </div>
          <div className="text-right">
            <p className="font-serif text-xl text-ink-900">#{order.code}</p>
            <p className="text-xs text-ink-500">{formatDateTime(order.createdAt)}</p>
            <p className="text-xs text-ink-500">{ORDER_STATUS_LABEL[order.status]}</p>
          </div>
        </header>

        <section className="grid gap-4 border-b border-ink-200 py-4 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold text-ink-500">Cliente</h2>
            <p className="mt-1 text-sm text-ink-900">
              {order.contactFirstName} {order.contactLastName}
            </p>
            <p className="text-sm text-ink-700">{order.contactPhone}</p>
          </div>
          <div>
            <h2 className="text-xs font-semibold text-ink-500">
              {order.deliveryMethod === "PICKUP" ? "Retiro en el local" : "Envío a domicilio"}
            </h2>
            <p className="mt-1 text-sm text-ink-700">
              {order.deliveryMethod === "PICKUP"
                ? settings.address
                : `${order.street} ${order.number}${order.apartment ? `, ${order.apartment}` : ""}, ${order.locality}`}
            </p>
            {order.slotLabel && <p className="text-sm text-ink-700">{order.slotLabel} hs</p>}
            {order.instructions && (
              <p className="mt-1 text-xs text-ink-500">{order.instructions}</p>
            )}
          </div>
        </section>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200">
              <th className="py-2 text-left text-xs font-semibold text-ink-500">✓</th>
              <th className="py-2 text-left text-xs font-semibold text-ink-500">Producto</th>
              <th className="py-2 text-right text-xs font-semibold text-ink-500">Peso</th>
              <th className="py-2 text-right text-xs font-semibold text-ink-500">Cant.</th>
              <th className="py-2 text-right text-xs font-semibold text-ink-500">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2.5">
                  <span className="inline-block h-4 w-4 rounded border border-ink-500" />
                </td>
                <td className="py-2.5 text-ink-900">{item.name}</td>
                <td className="py-2.5 text-right text-ink-700">{formatWeight(item.weightGrams)}</td>
                <td className="py-2.5 text-right text-ink-700">{item.quantity}</td>
                <td className="py-2.5 text-right text-ink-900">
                  {formatMoney(item.priceCents * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-ink-300">
            {order.shippingCents > 0 && (
              <tr>
                <td colSpan={4} className="py-2 text-right text-ink-700">
                  Envío
                </td>
                <td className="py-2 text-right text-ink-900">{formatMoney(order.shippingCents)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={4} className="py-2 text-right font-semibold text-ink-900">
                Total
              </td>
              <td className="py-2 text-right font-serif text-lg font-semibold text-ink-900">
                {formatMoney(order.totalCents)}
              </td>
            </tr>
            {order.paymentMethod === "CASH_ON_PICKUP" && (
              <>
                <tr>
                  <td colSpan={4} className="py-1 text-right text-ink-700">
                    Seña abonada ({order.depositPct}%)
                  </td>
                  <td className="py-1 text-right text-ink-700">{formatMoney(order.depositCents)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-1 text-right font-semibold text-ink-900">
                    A cobrar al retirar
                  </td>
                  <td className="py-1 text-right font-semibold text-ink-900">
                    {formatMoney(order.balanceCents)}
                  </td>
                </tr>
              </>
            )}
          </tfoot>
        </table>

        {order.internalNotes && (
          <p className="mt-4 border-t border-ink-200 pt-3 text-sm text-ink-700">
            <strong className="font-semibold">Nota:</strong> {order.internalNotes}
          </p>
        )}
      </article>
    </div>
  );
}
