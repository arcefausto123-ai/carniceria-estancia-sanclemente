import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateTime, startOfDay } from "@/lib/format";
import { DELIVERY_METHOD_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/orders";
import { StatCard, OrderBadge, TabLink, PageHeader, EmptyState } from "@/components/admin/ui";
import { BulkStatusBar } from "./bulk-bar";
import { Cart, Truck, Bag, Search, Upload, Dots } from "@/components/icons";
import type { OrderStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const TABS: { key: string; label: string; status?: OrderStatus }[] = [
  { key: "todos", label: "Todos" },
  { key: "nuevos", label: "Nuevos", status: "NEW" },
  { key: "pago-pendiente", label: "Pago pendiente", status: "PAYMENT_PENDING" },
  { key: "confirmados", label: "Confirmados", status: "CONFIRMED" },
  { key: "en-preparacion", label: "En preparación", status: "PREPARING" },
  { key: "listos", label: "Listos", status: "READY" },
  { key: "entregados", label: "Entregado", status: "DELIVERED" },
];

type SearchParams = Promise<{
  tab?: string;
  q?: string;
  periodo?: string;
  entrega?: string;
  pago?: string;
}>;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tab = params.tab ?? "todos";
  const search = params.q?.trim();

  const today = startOfDay(new Date());
  const periodStart =
    params.periodo === "semana"
      ? new Date(today.getTime() - 7 * 86_400_000)
      : params.periodo === "mes"
        ? new Date(today.getTime() - 30 * 86_400_000)
        : params.periodo === "todo"
          ? undefined
          : today;

  const status = TABS.find((t) => t.key === tab)?.status;

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(periodStart ? { createdAt: { gte: periodStart } } : {}),
    ...(params.entrega === "SHIPPING" || params.entrega === "PICKUP"
      ? { deliveryMethod: params.entrega }
      : {}),
    ...(params.pago === "CASH_ON_PICKUP" || params.pago === "BANK_TRANSFER"
      ? { paymentMethod: params.pago }
      : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { contactFirstName: { contains: search, mode: "insensitive" } },
            { contactLastName: { contains: search, mode: "insensitive" } },
            { contactPhone: { contains: search.replace(/\D/g, "") } },
          ],
        }
      : {}),
  };

  const [orders, counts, todayCount, shippingToday, pickupToday] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { createdAt: { gte: today }, deliveryMethod: "SHIPPING" } }),
    prisma.order.count({ where: { createdAt: { gte: today }, deliveryMethod: "PICKUP" } }),
  ]);

  const countByStatus = new Map(counts.map((row) => [row.status, row._count]));
  const totalCount = counts.reduce((sum, row) => sum + row._count, 0);

  const query = (extra: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, ...extra })) {
      if (value) next.set(key, String(value));
    }
    return `/admin/pedidos?${next.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Pedidos"
        subtitle="Gestioná y prepará las compras de la tienda"
        actions={
          <Link href="/admin/pedidos/exportar" className="btn-secondary">
            <Upload className="h-4 w-4" />
            Exportar pedidos
          </Link>
        }
      />

      {/* Pestañas */}
      <div className="flex gap-6 overflow-x-auto border-b border-ink-200 no-scrollbar">
        {TABS.map((item) => (
          <TabLink
            key={item.key}
            href={query({ tab: item.key === "todos" ? undefined : item.key })}
            active={tab === item.key}
            label={item.label}
            count={item.status ? (countByStatus.get(item.status) ?? 0) : totalCount}
          />
        ))}
      </div>

      {/* Filtros */}
      <form className="mt-4 flex flex-wrap gap-3">
        <input type="hidden" name="tab" value={tab} />
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Buscar por número, cliente o teléfono..."
            aria-label="Buscar pedidos"
            className="admin-field pl-9"
          />
        </div>
        <select name="periodo" defaultValue={params.periodo ?? ""} className="admin-field w-auto" aria-label="Período">
          <option value="">Hoy</option>
          <option value="semana">Últimos 7 días</option>
          <option value="mes">Últimos 30 días</option>
          <option value="todo">Todos</option>
        </select>
        <select name="entrega" defaultValue={params.entrega ?? ""} className="admin-field w-auto" aria-label="Tipo de entrega">
          <option value="">Toda entrega</option>
          <option value="SHIPPING">Envío a domicilio</option>
          <option value="PICKUP">Retiro en el local</option>
        </select>
        <select name="pago" defaultValue={params.pago ?? ""} className="admin-field w-auto" aria-label="Forma de pago">
          <option value="">Toda forma de pago</option>
          <option value="CASH_ON_PICKUP">Seña + efectivo</option>
          <option value="BANK_TRANSFER">Transferencia</option>
        </select>
        <button type="submit" className="btn-secondary">
          Aplicar
        </button>
      </form>

      <div className="mt-4 grid gap-5 xl:grid-cols-[1fr_260px]">
        {/* Tabla con selección múltiple */}
        <BulkStatusBar>
          <section className="panel overflow-hidden">
            {orders.length === 0 ? (
              <EmptyState
                title="No hay pedidos con estos filtros"
                body="Cambiá el período o el estado para ver más resultados."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px]">
                  <thead className="bg-ink-100/60">
                    <tr>
                      <th className="th w-10">
                        <input type="checkbox" data-select-all aria-label="Seleccionar todos" className="h-4 w-4 accent-admin-blue" />
                      </th>
                      <th className="th">Pedido</th>
                      <th className="th">Fecha y hora</th>
                      <th className="th">Cliente</th>
                      <th className="th">Entrega</th>
                      <th className="th">Pago</th>
                      <th className="th">Total</th>
                      <th className="th">Estado</th>
                      <th className="th">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="row-hover">
                        <td className="td">
                          <input
                            type="checkbox"
                            name="orderIds"
                            value={order.id}
                            data-select-row
                            aria-label={`Seleccionar pedido ${order.code}`}
                            className="h-4 w-4 accent-admin-blue"
                          />
                        </td>
                        <td className="td">
                          <Link
                            href={`/admin/pedidos/${order.code}`}
                            className="font-medium text-admin-blue hover:underline"
                          >
                            #{order.code}
                          </Link>
                        </td>
                        <td className="td whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
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
                        <td className="td">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/admin/pedidos/${order.code}`}
                              className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs
                                         text-ink-700 transition hover:border-admin-blue hover:text-admin-blue"
                            >
                              Ver pedido
                            </Link>
                            <Link
                              href={`/admin/pedidos/${order.code}`}
                              className="rounded p-1 text-ink-500 hover:text-ink-900"
                              aria-label="Más acciones"
                            >
                              <Dots className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </BulkStatusBar>

        {/* Resumen del día */}
        <aside className="flex h-fit flex-col gap-4">
          <StatCard icon={<Cart className="h-6 w-6" />} label="Pedidos de hoy" value={todayCount} />
          <StatCard icon={<Truck className="h-6 w-6" />} label="Envíos" value={shippingToday} tone="ok" />
          <StatCard icon={<Bag className="h-6 w-6" />} label="Retiros" value={pickupToday} tone="warn" />
        </aside>
      </div>
    </>
  );
}
