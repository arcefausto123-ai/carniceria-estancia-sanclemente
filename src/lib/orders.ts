import { prisma } from "./prisma";
import type { OrderStatus, PaymentMethod, DeliveryMethod } from "@prisma/client";

/** Numeración correlativa de pedidos: ESC-1048, ESC-1049, ... */
export async function nextOrderCode(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { name: "order" },
    create: { name: "order", value: 1001 },
    update: { value: { increment: 1 } },
  });
  return `ESC-${counter.value}`;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "Nuevo",
  PAYMENT_PENDING: "Pago pendiente",
  CONFIRMED: "Confirmado",
  PREPARING: "En preparación",
  READY: "Listo",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

/** Línea de tiempo que ve el admin en el detalle del pedido. */
export const ORDER_TIMELINE: { status: OrderStatus; label: string }[] = [
  { status: "NEW", label: "Pedido recibido" },
  { status: "CONFIRMED", label: "Pago confirmado" },
  { status: "PREPARING", label: "En preparación" },
  { status: "READY", label: "Listo" },
  { status: "DELIVERED", label: "Entregado" },
];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH_ON_PICKUP: "Seña + efectivo",
  BANK_TRANSFER: "Transferencia",
};

export const DELIVERY_METHOD_LABEL: Record<DeliveryMethod, string> = {
  SHIPPING: "Envío",
  PICKUP: "Retiro",
};

export function timelineIndex(status: OrderStatus): number {
  const i = ORDER_TIMELINE.findIndex((s) => s.status === status);
  if (i >= 0) return i;
  // Los estados que no están en la línea principal se mapean al paso previo.
  if (status === "PAYMENT_PENDING") return 0;
  return -1;
}
