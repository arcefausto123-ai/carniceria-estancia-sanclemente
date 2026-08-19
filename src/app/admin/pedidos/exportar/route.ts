import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { toCsv, csvResponse } from "@/lib/csv";
import { ORDER_STATUS_LABEL, DELIVERY_METHOD_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/orders";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Exporta los pedidos a CSV para abrir en Excel o Google Sheets. */
export async function GET() {
  if (!(await getSession())) return new Response("No autorizado", { status: 401 });

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, shippingZone: true },
  });

  const money = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

  const rows = orders.map((order) => [
    order.code,
    formatDateTime(order.createdAt),
    ORDER_STATUS_LABEL[order.status],
    `${order.contactFirstName} ${order.contactLastName}`,
    order.contactPhone,
    order.contactEmail ?? "",
    DELIVERY_METHOD_LABEL[order.deliveryMethod],
    order.deliveryMethod === "SHIPPING"
      ? `${order.street ?? ""} ${order.number ?? ""}${order.apartment ? `, ${order.apartment}` : ""}`.trim()
      : "",
    order.locality ?? "",
    order.postalCode ?? "",
    order.shippingZone?.name ?? "",
    order.slotLabel ?? "",
    PAYMENT_METHOD_LABEL[order.paymentMethod],
    money(order.subtotalCents),
    money(order.shippingCents),
    money(order.totalCents),
    order.depositPct,
    money(order.depositCents),
    money(order.balanceCents),
    order.items.reduce((sum, item) => sum + item.quantity, 0),
    order.items.map((item) => `${item.quantity}× ${item.name}`).join(" | "),
    order.internalNotes ?? "",
  ]);

  const csv = toCsv(
    [
      "Pedido", "Fecha", "Estado", "Cliente", "Teléfono", "Email", "Entrega", "Dirección",
      "Localidad", "CP", "Zona", "Franja", "Forma de pago", "Subtotal", "Envío", "Total",
      "% seña", "Seña", "Saldo", "Unidades", "Productos", "Notas internas",
    ],
    rows,
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`pedidos-${stamp}.csv`, csv);
}
