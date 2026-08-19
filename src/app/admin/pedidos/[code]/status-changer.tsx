"use client";

import { ORDER_STATUS_LABEL } from "@/lib/orders";
import { updateOrderStatus } from "../../actions";
import { ChevronDown } from "@/components/icons";
import type { OrderStatus } from "@prisma/client";

const STATUSES: OrderStatus[] = [
  "NEW",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "DELIVERED",
  "CANCELLED",
];

export function StatusChanger({ code, current }: { code: string; current: OrderStatus }) {
  return (
    <form action={updateOrderStatus} className="flex items-center gap-2">
      <input type="hidden" name="code" value={code} />
      <div className="relative">
        <select
          name="status"
          defaultValue={current}
          aria-label="Cambiar estado del pedido"
          className="appearance-none rounded-lg bg-admin-blue py-2.5 pr-9 pl-4 text-sm
                     font-medium text-white focus:outline-none"
        >
          {STATUSES.map((status) => (
            <option key={status} value={status} className="bg-white text-ink-900">
              {ORDER_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-white" />
      </div>
      <button type="submit" className="btn-secondary">
        Cambiar estado
      </button>
    </form>
  );
}
