import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatTime, startOfDay } from "@/lib/format";
import { StatCard, TabLink, PaymentBadge, PageHeader, EmptyState } from "@/components/admin/ui";
import { ReceiptReview } from "./receipt-review";
import { approvePayment, rejectPayment } from "../actions";
import { Clock, CheckCircle, Bag, Bank, Search, Info, Pencil } from "@/components/icons";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const KIND_LABEL = { DEPOSIT: "Seña", FULL: "Pago total", BALANCE: "Saldo en efectivo" } as const;

type SearchParams = Promise<{ tab?: string; q?: string; tipo?: string; ver?: string }>;

export default async function PaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tab = params.tab ?? "pendientes";
  const search = params.q?.trim();
  const today = startOfDay(new Date());

  const statusFilter: Prisma.PaymentWhereInput =
    tab === "aprobados" ? { status: "APPROVED" } : tab === "pendientes" ? { status: "PENDING" } : {};

  const where: Prisma.PaymentWhereInput = {
    ...statusFilter,
    ...(params.tipo === "DEPOSIT" || params.tipo === "FULL" || params.tipo === "BALANCE"
      ? { kind: params.tipo }
      : {}),
    ...(search
      ? {
          order: {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { contactFirstName: { contains: search, mode: "insensitive" } },
              { contactLastName: { contains: search, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const [payments, pendingAgg, approvedAgg, pendingBalances, collectedToday, settings, reviewing] =
    await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { order: true },
      }),
      prisma.payment.aggregate({ _count: true, _sum: { expectedCents: true }, where: { status: "PENDING" } }),
      prisma.payment.aggregate({
        _count: true,
        _sum: { expectedCents: true },
        where: { status: "APPROVED", kind: { in: ["DEPOSIT", "FULL"] } },
      }),
      prisma.order.aggregate({
        _count: true,
        _sum: { balanceCents: true },
        where: { paymentMethod: "CASH_ON_PICKUP", balanceCents: { gt: 0 }, status: { notIn: ["DELIVERED", "CANCELLED"] } },
      }),
      prisma.payment.aggregate({
        _sum: { expectedCents: true },
        where: { status: "APPROVED", reviewedAt: { gte: today } },
      }),
      getSettings(),
      params.ver
        ? prisma.payment.findUnique({ where: { id: params.ver }, include: { order: true } })
        : Promise.resolve(null),
    ]);

  const balancesOnly = tab === "saldos";
  const pendingOrders = balancesOnly
    ? await prisma.order.findMany({
        where: {
          paymentMethod: "CASH_ON_PICKUP",
          balanceCents: { gt: 0 },
          status: { notIn: ["DELIVERED", "CANCELLED"] },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  return (
    <div className={reviewing ? "grid gap-6 xl:grid-cols-[1fr_400px]" : ""}>
      <div className="min-w-0">
        <PageHeader
          title="Pagos y comprobantes"
          subtitle="Validá transferencias, señas y saldos pendientes"
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Clock className="h-6 w-6" />}
            label="Por validar"
            value={pendingAgg._count}
            hint={formatMoney(pendingAgg._sum.expectedCents ?? 0)}
            tone="warn"
          />
          <StatCard
            icon={<CheckCircle className="h-6 w-6" />}
            label="Pagos confirmados"
            value={approvedAgg._count}
            hint={formatMoney(approvedAgg._sum.expectedCents ?? 0)}
            tone="ok"
          />
          <StatCard
            icon={<Bag className="h-6 w-6" />}
            label="Saldos al retirar"
            value={pendingBalances._count}
            hint={formatMoney(pendingBalances._sum.balanceCents ?? 0)}
          />
          <StatCard
            icon={<Bank className="h-6 w-6" />}
            label="Cobrado hoy"
            value={formatMoney(collectedToday._sum.expectedCents ?? 0)}
            tone="ok"
          />
        </div>

        <div className="mt-6 flex gap-6 overflow-x-auto border-b border-ink-200 no-scrollbar">
          <TabLink href="/admin/pagos" active={tab === "pendientes"} label="Comprobantes pendientes" count={pendingAgg._count} />
          <TabLink href="/admin/pagos?tab=aprobados" active={tab === "aprobados"} label="Pagos aprobados" />
          <TabLink href="/admin/pagos?tab=saldos" active={tab === "saldos"} label="Saldos pendientes" count={pendingBalances._count} />
          <TabLink href="/admin/pagos?tab=todos" active={tab === "todos"} label="Todos" />
        </div>

        {!balancesOnly && (
          <form className="mt-4 flex flex-wrap gap-3">
            <input type="hidden" name="tab" value={tab} />
            <div className="relative min-w-52 flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                name="q"
                defaultValue={search}
                placeholder="Buscar pedido o cliente..."
                aria-label="Buscar pagos"
                className="admin-field pl-9"
              />
            </div>
            <select name="tipo" defaultValue={params.tipo ?? ""} className="admin-field w-auto" aria-label="Tipo de pago">
              <option value="">Todo tipo de pago</option>
              <option value="DEPOSIT">Seña</option>
              <option value="FULL">Pago total</option>
              <option value="BALANCE">Saldo en efectivo</option>
            </select>
            <button type="submit" className="btn-secondary">
              Aplicar
            </button>
          </form>
        )}

        <section className="panel mt-4 overflow-hidden">
          {balancesOnly ? (
            pendingOrders.length === 0 ? (
              <EmptyState title="No hay saldos pendientes" body="Todos los pedidos con seña ya cobraron su saldo." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-ink-100/60">
                    <tr>
                      <th className="th">Pedido</th>
                      <th className="th">Cliente</th>
                      <th className="th">Seña</th>
                      <th className="th">Saldo a cobrar</th>
                      <th className="th">Total</th>
                      <th className="th"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200">
                    {pendingOrders.map((order) => (
                      <tr key={order.id} className="row-hover">
                        <td className="td">
                          <Link href={`/admin/pedidos/${order.code}`} className="font-medium text-admin-blue hover:underline">
                            #{order.code}
                          </Link>
                        </td>
                        <td className="td">
                          {order.contactFirstName} {order.contactLastName}
                        </td>
                        <td className="td">{formatMoney(order.depositCents)}</td>
                        <td className="td font-medium text-ink-900">{formatMoney(order.balanceCents)}</td>
                        <td className="td">{formatMoney(order.totalCents)}</td>
                        <td className="td">
                          <Link
                            href={`/admin/pedidos/${order.code}`}
                            className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-700
                                       transition hover:border-admin-blue hover:text-admin-blue"
                          >
                            Ver pedido
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : payments.length === 0 ? (
            <EmptyState
              title="No hay comprobantes acá"
              body="Cuando un cliente informe una transferencia, aparece en esta cola."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead className="bg-ink-100/60">
                  <tr>
                    <th className="th">Pedido</th>
                    <th className="th">Cliente</th>
                    <th className="th">Concepto</th>
                    <th className="th">Importe</th>
                    <th className="th">Recibido</th>
                    <th className="th">Comprobante</th>
                    <th className="th">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className={payment.id === params.ver ? "bg-info-bg/40" : "row-hover"}
                    >
                      <td className="td">
                        <Link
                          href={`/admin/pedidos/${payment.order.code}`}
                          className="font-medium text-admin-blue hover:underline"
                        >
                          #{payment.order.code}
                        </Link>
                      </td>
                      <td className="td">
                        {payment.order.contactFirstName} {payment.order.contactLastName}
                      </td>
                      <td className="td">
                        {KIND_LABEL[payment.kind]}
                        {payment.kind === "DEPOSIT" ? ` ${payment.order.depositPct}%` : ""}
                      </td>
                      <td className="td font-medium text-ink-900">
                        {formatMoney(payment.expectedCents)}
                      </td>
                      <td className="td whitespace-nowrap">{formatTime(payment.createdAt)}</td>
                      <td className="td">
                        <Link
                          href={`/admin/pagos?tab=${tab}&ver=${payment.id}`}
                          className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-700
                                     transition hover:border-admin-blue hover:text-admin-blue"
                        >
                          {payment.receiptImage ? "Ver imagen" : "Ver detalle"}
                        </Link>
                        {!payment.receiptImage && (
                          <span className="mt-1 block text-[11px] text-ink-500">
                            Llegó por WhatsApp
                          </span>
                        )}
                      </td>
                      <td className="td">
                        {payment.status === "PENDING" ? (
                          <div className="flex items-center gap-2">
                            <form action={approvePayment}>
                              <input type="hidden" name="id" value={payment.id} />
                              <button type="submit" className="btn-approve">
                                Aprobar
                              </button>
                            </form>
                            <form action={rejectPayment}>
                              <input type="hidden" name="id" value={payment.id} />
                              <button type="submit" className="btn-reject">
                                Rechazar
                              </button>
                            </form>
                          </div>
                        ) : (
                          <PaymentBadge status={payment.status} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 px-5 py-3.5">
            <p className="flex items-center gap-2 text-sm text-ink-500">
              <Info className="h-4 w-4" />
              Alias configurado:{" "}
              <strong className="font-semibold text-ink-900">{settings.bankAlias || "sin configurar"}</strong>
            </p>
            <Link
              href="/admin/configuracion?seccion=pagos"
              className="flex items-center gap-1.5 text-sm text-admin-blue hover:underline"
            >
              <Pencil className="h-4 w-4" />
              Editar datos bancarios
            </Link>
          </div>
        </section>
      </div>

      {reviewing && (
        <ReceiptReview
          payment={{
            id: reviewing.id,
            kind: reviewing.kind,
            expectedCents: reviewing.expectedCents,
            reportedCents: reviewing.reportedCents,
            senderName: reviewing.senderName,
            senderTaxId: reviewing.senderTaxId,
            sourceAlias: reviewing.sourceAlias,
            destinationAlias: reviewing.destinationAlias ?? settings.bankAlias,
            operationId: reviewing.operationId,
            receiptNumber: reviewing.receiptNumber,
            receiptImage: reviewing.receiptImage,
            transferredAt: reviewing.transferredAt?.toISOString() ?? null,
            orderCode: reviewing.order.code,
            customerName: `${reviewing.order.contactFirstName} ${reviewing.order.contactLastName}`,
            depositPct: reviewing.order.depositPct,
          }}
          backHref={`/admin/pagos?tab=${tab}`}
        />
      )}
    </div>
  );
}
