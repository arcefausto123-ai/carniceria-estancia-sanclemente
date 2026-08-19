import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatLongDate, startOfDay, TIMEZONE } from "@/lib/format";
import { DELIVERY_METHOD_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/orders";
import { StatCard, OrderBadge, ProductBadge, PageHeader } from "@/components/admin/ui";
import { ProductImage } from "@/components/product-image";
import {
  Money, Cart, Box, CheckCircle, Plus, Calendar, Truck, ArrowRight, TrendUp,
} from "@/components/icons";

export const dynamic = "force-dynamic";

const CHART_HEIGHT = 180;

const DAY_LABEL = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  timeZone: TIMEZONE,
});
const dayLabel = (day: Date) => DAY_LABEL.format(day);

export default async function DashboardPage() {
  const today = startOfDay(new Date());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const weekAgo = new Date(today.getTime() - 6 * 86_400_000);

  const [
    salesToday,
    salesYesterday,
    newOrders,
    preparing,
    ready,
    recentOrders,
    weekOrders,
    lowStock,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { createdAt: { gte: today }, status: { not: "CANCELLED" } },
    }),
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { createdAt: { gte: yesterday, lt: today }, status: { not: "CANCELLED" } },
    }),
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.order.count({ where: { status: "PREPARING" } }),
    prisma.order.count({ where: { status: "READY" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.order.findMany({
      where: { createdAt: { gte: weekAgo }, status: { not: "CANCELLED" } },
      select: { createdAt: true },
    }),
    prisma.product.findMany({
      where: { OR: [{ stock: { lte: 1 } }, { status: "DRAFT" }] },
      orderBy: { stock: "asc" },
      take: 5,
    }),
  ]);

  const todayCents = salesToday._sum.totalCents ?? 0;
  const yesterdayCents = salesYesterday._sum.totalCents ?? 0;
  const delta =
    yesterdayCents > 0 ? Math.round(((todayCents - yesterdayCents) / yesterdayCents) * 100) : null;

  // Serie de los últimos 7 días para el gráfico de barras
  const series = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekAgo.getTime() + index * 86_400_000);
    const next = new Date(day.getTime() + 86_400_000);
    const count = weekOrders.filter(
      (order) => order.createdAt >= day && order.createdAt < next,
    ).length;
    return { day, count };
  });
  // Escala redondeada hacia arriba a un múltiplo de 4, así las cinco guías
  // del eje caen siempre en números enteros.
  const busiest = Math.max(...series.map((point) => point.count), 0);
  const step = Math.max(1, Math.ceil(Math.max(busiest, 4) / 4));
  const peak = step * 4;
  const ticks = Array.from({ length: 5 }, (_, index) => peak - index * step);

  return (
    <>
      <PageHeader
        title="Resumen del día"
        subtitle={`${formatLongDate(new Date())} · Estado general de la tienda`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Money className="h-6 w-6" />}
          label="Ventas de hoy"
          value={formatMoney(todayCents)}
          hint={
            delta === null ? (
              "Sin datos de ayer"
            ) : (
              <span className={delta >= 0 ? "text-ok-fg" : "text-danger-fg"}>
                {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% vs. ayer
              </span>
            )
          }
        />
        <StatCard
          icon={<Cart className="h-6 w-6" />}
          label="Pedidos nuevos"
          value={newOrders}
          tone="warn"
          hint="Esperando revisión"
        />
        <StatCard
          icon={<Box className="h-6 w-6" />}
          label="En preparación"
          value={preparing}
          tone="danger"
          hint="En el mostrador"
        />
        <StatCard
          icon={<CheckCircle className="h-6 w-6" />}
          label="Listos para entregar"
          value={ready}
          tone="ok"
          hint="Esperando al cliente"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* Pedidos recientes */}
          <section className="panel overflow-hidden">
            <h2 className="panel-title border-b border-ink-200 px-5 py-4">Pedidos recientes</h2>
            {recentOrders.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-ink-500">
                Todavía no entró ningún pedido.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-ink-100/60">
                    <tr>
                      <th className="th">Pedido</th>
                      <th className="th">Cliente</th>
                      <th className="th">Entrega</th>
                      <th className="th">Pago</th>
                      <th className="th">Total</th>
                      <th className="th">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="row-hover">
                        <td className="td">
                          <Link
                            href={`/admin/pedidos/${order.code}`}
                            className="font-medium text-admin-blue hover:underline"
                          >
                            #{order.code}
                          </Link>
                        </td>
                        <td className="td">
                          {order.contactFirstName} {order.contactLastName}
                        </td>
                        <td className="td">{DELIVERY_METHOD_LABEL[order.deliveryMethod]}</td>
                        <td className="td">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</td>
                        <td className="td font-medium text-ink-900">
                          {formatMoney(order.totalCents)}
                        </td>
                        <td className="td">
                          <OrderBadge status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Link
              href="/admin/pedidos"
              className="flex items-center gap-1.5 border-t border-ink-200 px-5 py-3.5 text-sm
                         font-medium text-admin-blue hover:underline"
            >
              Ver todos los pedidos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          {/* Gráfico de 7 días */}
          <section className="panel p-5">
            <h2 className="panel-title">Pedidos de los últimos 7 días</h2>

            <div className="mt-6 flex gap-3">
              {/* Eje Y con líneas guía */}
              <div className="flex w-8 shrink-0 flex-col justify-between text-right text-[11px] text-ink-500"
                   style={{ height: CHART_HEIGHT }}>
                {ticks.map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>

              <div className="relative flex-1">
                <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
                  {ticks.map((tick) => (
                    <span key={tick} className="border-t border-dashed border-ink-200" />
                  ))}
                </div>

                <div className="relative flex gap-3" style={{ height: CHART_HEIGHT }}>
                  {series.map(({ day, count }) => (
                    <div key={day.toISOString()} className="flex h-full flex-1 items-end justify-center">
                      <div
                        className="w-full max-w-14 rounded-t bg-navy"
                        style={{ height: `${Math.round((count / peak) * CHART_HEIGHT)}px` }}
                        role="img"
                        aria-label={`${dayLabel(day)}: ${count} pedidos`}
                        title={`${count} pedidos`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-2 flex gap-3">
              <span className="w-8 shrink-0" />
              <div className="flex flex-1 gap-3">
                {series.map(({ day }) => (
                  <span
                    key={day.toISOString()}
                    className="flex-1 text-center text-[11px] whitespace-nowrap text-ink-500"
                  >
                    {dayLabel(day)}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          {/* Accesos rápidos */}
          <section className="panel p-5">
            <h2 className="panel-title">Acciones rápidas</h2>
            <div className="mt-4 space-y-2.5">
              <QuickAction href="/admin/productos?nuevo=1" icon={<Plus className="h-5 w-5" />}>
                Agregar producto
              </QuickAction>
              <QuickAction href="/admin/pedidos" icon={<Calendar className="h-5 w-5" />}>
                Ver pedidos
              </QuickAction>
              <QuickAction href="/admin/productos" icon={<Box className="h-5 w-5" />}>
                Actualizar stock
              </QuickAction>
              <QuickAction href="/admin/envios" icon={<Truck className="h-5 w-5" />}>
                Configurar entregas
              </QuickAction>
            </div>
          </section>

          {/* Alertas de stock */}
          <section className="panel p-5">
            <h2 className="panel-title">Alertas de stock</h2>
            {lowStock.length === 0 ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-ink-500">
                <TrendUp className="h-4 w-4 text-ok-fg" />
                Todo el catálogo tiene stock.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {lowStock.map((product) => (
                  <li key={product.id} className="flex items-center gap-3">
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      className="h-10 w-12 shrink-0 rounded"
                      iconClassName="h-4 w-4"
                    />
                    <Link
                      href={`/admin/productos?editar=${product.id}`}
                      className="min-w-0 flex-1 truncate text-sm text-ink-900 hover:text-admin-blue"
                    >
                      {product.name}
                    </Link>
                    {product.stock <= 0 ? (
                      <span className="badge bg-danger-bg text-danger-fg">Sin stock</span>
                    ) : product.status === "DRAFT" ? (
                      <ProductBadge status={product.status} stock={product.stock} />
                    ) : (
                      <span className="badge bg-warn-bg text-warn-fg">
                        Queda {product.stock} {product.stock === 1 ? "unidad" : "unidades"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function QuickAction({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-ink-200 px-4 py-3 text-sm
                 text-ink-900 transition hover:border-admin-blue hover:bg-info-bg/40"
    >
      <span className="text-ink-500">{icon}</span>
      {children}
    </Link>
  );
}
