"use client";

import { useEffect, useRef, useState } from "react";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import { bulkUpdateOrderStatus } from "../actions";
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

/**
 * Envuelve la tabla en un form y muestra la barra de acciones en lote
 * cuando hay pedidos tildados. Los checkboxes los renderiza la tabla
 * (server component) con `data-select-row`; acá sólo los coordinamos.
 */
export function BulkStatusBar({ children }: { children: React.ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const rows = () =>
      Array.from(form.querySelectorAll<HTMLInputElement>("input[data-select-row]"));
    const selectAll = form.querySelector<HTMLInputElement>("input[data-select-all]");

    const sync = () => {
      const checked = rows().filter((row) => row.checked).length;
      setSelected(checked);
      if (selectAll) {
        selectAll.checked = checked > 0 && checked === rows().length;
        selectAll.indeterminate = checked > 0 && checked < rows().length;
      }
    };

    const onToggleAll = (event: Event) => {
      const target = event.target as HTMLInputElement;
      rows().forEach((row) => {
        row.checked = target.checked;
      });
      sync();
    };

    form.addEventListener("change", sync);
    selectAll?.addEventListener("change", onToggleAll);
    return () => {
      form.removeEventListener("change", sync);
      selectAll?.removeEventListener("change", onToggleAll);
    };
  }, []);

  return (
    <form ref={formRef} action={bulkUpdateOrderStatus} className="min-w-0">
      {children}

      {selected > 0 && (
        <div className="panel mt-4 flex flex-wrap items-center gap-4 border-admin-blue px-5 py-4">
          <p className="text-sm text-ink-900">
            {selected} {selected === 1 ? "pedido seleccionado" : "pedidos seleccionados"}
          </p>
          <select name="status" required defaultValue="" className="admin-field w-auto" aria-label="Nuevo estado">
            <option value="" disabled>
              Cambiar estado
            </option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary">
            Aplicar
          </button>
        </div>
      )}
    </form>
  );
}
