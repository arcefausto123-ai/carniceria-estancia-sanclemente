import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { toCsv, csvResponse } from "@/lib/csv";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getSession())) return new Response("No autorizado", { status: 401 });

  const customers = await prisma.customer.findMany({
    orderBy: { lastName: "asc" },
    include: {
      addresses: { orderBy: { isDefault: "desc" }, take: 1 },
      orders: { where: { status: { not: "CANCELLED" } }, orderBy: { createdAt: "desc" } },
    },
  });

  const rows = customers.map((customer) => {
    const spent = customer.orders.reduce((sum, order) => sum + order.totalCents, 0);
    const address = customer.addresses[0];
    return [
      customer.firstName,
      customer.lastName,
      customer.phone,
      customer.email ?? "",
      address ? `${address.street} ${address.number}${address.apartment ? `, ${address.apartment}` : ""}` : "",
      address?.locality ?? "",
      address?.postalCode ?? "",
      customer.orders.length,
      (spent / 100).toFixed(2).replace(".", ","),
      customer.orders[0] ? formatDate(customer.orders[0].createdAt) : "",
      customer.tags.join(" | "),
      customer.notes ?? "",
    ];
  });

  const csv = toCsv(
    [
      "Nombre", "Apellido", "Teléfono", "Email", "Dirección", "Localidad", "CP",
      "Pedidos", "Total comprado", "Última compra", "Etiquetas", "Notas internas",
    ],
    rows,
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`clientes-${stamp}.csv`, csv);
}
