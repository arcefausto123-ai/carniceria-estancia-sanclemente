import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatRelativeDay, initials } from "@/lib/format";
import { StatCard, PageHeader, EmptyState } from "@/components/admin/ui";
import { CustomerDrawer } from "./customer-drawer";
import { Users, Star, Bag, Search, Upload } from "@/components/icons";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const FREQUENT_THRESHOLD = 3;

type SearchParams = Promise<{ q?: string; filtro?: string; localidad?: string; ver?: string }>;

export default async function CustomersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = params.q?.trim();
  const monthAgo = new Date(Date.now() - 30 * 86_400_000);

  const where: Prisma.CustomerWhereInput = {
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search.replace(/\D/g, "") } },
          ],
        }
      : {}),
    ...(params.filtro === "frecuentes" ? { tags: { has: "frecuente" } } : {}),
    ...(params.filtro === "nuevos" ? { createdAt: { gte: monthAgo } } : {}),
  };

  const [customers, total, newThisMonth, frequent, avgOrder, viewing] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        addresses: { orderBy: { isDefault: "desc" }, take: 1 },
        orders: {
          where: { status: { not: "CANCELLED" } },
          orderBy: { createdAt: "desc" },
          select: { id: true, code: true, totalCents: true, createdAt: true, locality: true },
        },
      },
    }),
    prisma.customer.count(),
    prisma.customer.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.customer.count({ where: { tags: { has: "frecuente" } } }),
    prisma.order.aggregate({ _avg: { totalCents: true }, where: { status: { not: "CANCELLED" } } }),
    params.ver
      ? prisma.customer.findUnique({
          where: { id: params.ver },
          include: {
            addresses: { orderBy: { isDefault: "desc" } },
            orders: {
              where: { status: { not: "CANCELLED" } },
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const rows = customers
    .map((customer) => {
      const spent = customer.orders.reduce((sum, order) => sum + order.totalCents, 0);
      // La localidad sale de la dirección guardada; si el cliente siempre
      // retira, la tomamos del último pedido que sí tuvo envío.
      const locality =
        customer.addresses[0]?.locality ??
        customer.orders.find((order) => order.locality)?.locality ??
        "—";

      return {
        ...customer,
        orderCount: customer.orders.length,
        spentCents: spent,
        lastOrder: customer.orders[0]?.createdAt ?? null,
        locality,
      };
    })
    .filter((row) => (params.localidad ? row.locality === params.localidad : true));

  return (
    <div className={viewing ? "grid gap-6 xl:grid-cols-[1fr_380px]" : ""}>
      <div className="min-w-0">
        <PageHeader
          title="Clientes"
          subtitle="Consultá compradores, pedidos e información de contacto"
          actions={
            <Link href="/admin/clientes/exportar" className="btn-secondary">
              <Upload className="h-4 w-4" />
              Exportar clientes
            </Link>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<Users className="h-6 w-6" />} label="Clientes totales" value={total} />
          <StatCard icon={<Users className="h-6 w-6" />} label="Nuevos este mes" value={newThisMonth} tone="ok" />
          <StatCard icon={<Star className="h-6 w-6" />} label="Clientes frecuentes" value={frequent} tone="warn" />
          <StatCard
            icon={<Bag className="h-6 w-6" />}
            label="Compra promedio"
            value={formatMoney(Math.round(avgOrder._avg.totalCents ?? 0))}
          />
        </div>

        <form className="mt-6 flex flex-wrap gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              name="q"
              defaultValue={search}
              placeholder="Buscar por nombre, teléfono o correo..."
              aria-label="Buscar clientes"
              className="admin-field pl-9"
            />
          </div>
          <select name="filtro" defaultValue={params.filtro ?? ""} className="admin-field w-auto" aria-label="Filtro">
            <option value="">Todos los clientes</option>
            <option value="frecuentes">Clientes frecuentes</option>
            <option value="nuevos">Nuevos este mes</option>
          </select>
          <input
            name="localidad"
            defaultValue={params.localidad ?? ""}
            placeholder="Localidad"
            aria-label="Filtrar por localidad"
            className="admin-field w-auto"
          />
          <button type="submit" className="btn-secondary">
            Aplicar
          </button>
        </form>

        <section className="panel mt-4 overflow-hidden">
          {rows.length === 0 ? (
            <EmptyState
              title="Todavía no hay clientes"
              body="Cada compra crea automáticamente la ficha del comprador."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px]">
                <thead className="bg-ink-100/60">
                  <tr>
                    <th className="th">Cliente</th>
                    <th className="th">Contacto</th>
                    <th className="th">Localidad</th>
                    <th className="th">Pedidos</th>
                    <th className="th">Total comprado</th>
                    <th className="th">Última compra</th>
                    <th className="th">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {rows.map((customer) => (
                    <tr
                      key={customer.id}
                      className={customer.id === params.ver ? "bg-info-bg/40" : "row-hover"}
                    >
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info-bg text-xs font-semibold text-info-fg">
                            {initials(customer.firstName, customer.lastName)}
                          </span>
                          <span className="font-medium text-ink-900">
                            {customer.firstName} {customer.lastName}
                          </span>
                          {customer.orderCount >= FREQUENT_THRESHOLD && (
                            <Star className="h-4 w-4 text-gold-500" aria-label="Cliente frecuente" />
                          )}
                        </div>
                      </td>
                      <td className="td">{customer.phone}</td>
                      <td className="td">{customer.locality}</td>
                      <td className="td">{customer.orderCount}</td>
                      <td className="td font-medium text-ink-900">
                        {formatMoney(customer.spentCents)}
                      </td>
                      <td className="td">
                        {customer.lastOrder ? formatRelativeDay(customer.lastOrder) : "—"}
                      </td>
                      <td className="td">
                        <Link
                          href={`/admin/clientes?ver=${customer.id}`}
                          className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-700
                                     transition hover:border-admin-blue hover:text-admin-blue"
                        >
                          Ver perfil
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {viewing && (
        <CustomerDrawer
          customer={{
            id: viewing.id,
            firstName: viewing.firstName,
            lastName: viewing.lastName,
            phone: viewing.phone,
            email: viewing.email,
            notes: viewing.notes,
            tags: viewing.tags,
            address: viewing.addresses[0]
              ? {
                  street: viewing.addresses[0].street,
                  number: viewing.addresses[0].number,
                  apartment: viewing.addresses[0].apartment,
                  locality: viewing.addresses[0].locality,
                  postalCode: viewing.addresses[0].postalCode,
                }
              : null,
            orders: viewing.orders.map((order) => ({
              code: order.code,
              date: formatRelativeDay(order.createdAt),
              total: formatMoney(order.totalCents),
              status: order.status,
            })),
            orderCount: viewing.orders.length,
            spent: formatMoney(viewing.orders.reduce((sum, order) => sum + order.totalCents, 0)),
          }}
        />
      )}
    </div>
  );
}
