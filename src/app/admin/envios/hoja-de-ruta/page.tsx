import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatLongDate, startOfDay } from "@/lib/format";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/orders";
import { PrintButton } from "@/components/admin/print";
import { ArrowLeft } from "@/components/icons";

export const dynamic = "force-dynamic";

/** Hoja de ruta del día para el repartidor. */
export default async function RouteSheetPage() {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const [stops, settings] = await Promise.all([
    prisma.order.findMany({
      where: {
        deliveryMethod: "SHIPPING",
        createdAt: { gte: today, lt: tomorrow },
        status: { notIn: ["CANCELLED"] },
      },
      orderBy: [{ routePosition: "asc" }, { createdAt: "asc" }],
      include: { shippingZone: true },
    }),
    getSettings(),
  ]);

  const toCollect = stops.reduce(
    (sum, order) => sum + (order.paymentMethod === "CASH_ON_PICKUP" ? order.balanceCents : 0),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/admin/envios"
          className="inline-flex items-center gap-2 text-sm text-admin-blue hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a envíos
        </Link>
        <PrintButton label="Imprimir hoja de ruta" />
      </div>

      <article className="panel p-8 print:border-0 print:p-0">
        <header className="border-b border-ink-200 pb-4">
          <h1 className="font-serif text-2xl text-ink-900">Hoja de ruta</h1>
          <p className="text-sm text-ink-500">
            {settings.businessName} · {formatLongDate(new Date())}
          </p>
          <p className="mt-1 text-sm text-ink-700">
            {stops.length} {stops.length === 1 ? "entrega" : "entregas"}
            {toCollect > 0 && <> · a cobrar en ruta: {formatMoney(toCollect)}</>}
          </p>
        </header>

        {stops.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-500">
            No hay envíos programados para hoy.
          </p>
        ) : (
          <ol className="divide-y divide-ink-200">
            {stops.map((stop, index) => (
              <li key={stop.id} className="flex gap-4 py-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-300 text-sm font-semibold text-ink-900">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    #{stop.code} · {stop.contactFirstName} {stop.contactLastName}
                  </p>
                  <p className="text-sm text-ink-700">
                    {stop.street} {stop.number}
                    {stop.apartment ? `, ${stop.apartment}` : ""} — {stop.locality}
                    {stop.postalCode ? ` (${stop.postalCode})` : ""}
                  </p>
                  <p className="text-sm text-ink-700">{stop.contactPhone}</p>
                  {stop.instructions && (
                    <p className="mt-1 text-xs text-ink-500">{stop.instructions}</p>
                  )}
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="text-ink-700">{stop.slotLabel ?? "Sin franja"}</p>
                  <p className="text-xs text-ink-500">{ORDER_STATUS_LABEL[stop.status]}</p>
                  <p className="mt-1 font-semibold text-ink-900">
                    {stop.paymentMethod === "CASH_ON_PICKUP"
                      ? `Cobrar ${formatMoney(stop.balanceCents)}`
                      : "Pagado"}
                  </p>
                  <p className="text-xs text-ink-500">
                    {PAYMENT_METHOD_LABEL[stop.paymentMethod]}
                  </p>
                  <span className="mt-2 inline-block h-5 w-5 rounded border border-ink-500" />
                </div>
              </li>
            ))}
          </ol>
        )}
      </article>
    </div>
  );
}
