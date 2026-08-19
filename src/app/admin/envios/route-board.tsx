"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Drag, Phone, Whatsapp, Save } from "@/components/icons";
import { reorderRoute } from "../actions";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import { whatsappLink } from "@/lib/whatsapp";
import type { OrderStatus } from "@prisma/client";

type Stop = {
  id: string;
  code: string;
  customer: string;
  phone: string;
  locality: string;
  slot: string;
  status: OrderStatus;
};

const TONES: Partial<Record<OrderStatus, string>> = {
  READY: "bg-info-bg text-info-fg",
  DELIVERED: "bg-ok-bg text-ok-fg",
};

/** Ruta del día reordenable arrastrando cada parada. */
export function RouteBoard({ orders }: { orders: Stop[] }) {
  const [stops, setStops] = useState(orders);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setStops(orders);
    setDirty(false);
  }, [orders]);

  const handleDrop = (targetId: string) => {
    if (!dragging || dragging === targetId) return;
    const next = [...stops];
    const from = next.findIndex((stop) => stop.id === dragging);
    const to = next.findIndex((stop) => stop.id === targetId);
    if (from < 0 || to < 0) return;
    next.splice(to, 0, ...next.splice(from, 1));
    setStops(next);
    setDirty(true);
    setDragging(null);
  };

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-5 py-4">
        <h2 className="panel-title">Ruta de hoy</h2>
        {dirty && (
          <form action={reorderRoute}>
            <input type="hidden" name="order" value={stops.map((stop) => stop.id).join(",")} />
            <button type="submit" className="btn-primary py-1.5 text-xs">
              <Save className="h-3.5 w-3.5" />
              Guardar orden
            </button>
          </form>
        )}
      </div>

      {stops.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-ink-500">
          No hay envíos programados para hoy.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-ink-100/60">
              <tr>
                <th className="th w-20">Orden</th>
                <th className="th">Pedido</th>
                <th className="th">Cliente</th>
                <th className="th">Localidad</th>
                <th className="th">Franja</th>
                <th className="th">Estado</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {stops.map((stop, index) => (
                <tr
                  key={stop.id}
                  draggable
                  onDragStart={() => setDragging(stop.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(stop.id)}
                  className={dragging === stop.id ? "bg-info-bg/50" : "row-hover"}
                >
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <span className="cursor-grab text-ink-300 active:cursor-grabbing" aria-hidden>
                        <Drag className="h-5 w-5" />
                      </span>
                      <span className="text-ink-700">{index + 1}</span>
                    </div>
                  </td>
                  <td className="td">
                    <Link
                      href={`/admin/pedidos/${stop.code}`}
                      className="font-medium text-admin-blue hover:underline"
                    >
                      #{stop.code}
                    </Link>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      {stop.customer}
                      <a
                        href={`tel:${stop.phone}`}
                        className="text-ink-500 hover:text-admin-blue"
                        aria-label={`Llamar a ${stop.customer}`}
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                      <a
                        href={whatsappLink(stop.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ok-fg hover:opacity-70"
                        aria-label={`WhatsApp a ${stop.customer}`}
                      >
                        <Whatsapp className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                  <td className="td">{stop.locality}</td>
                  <td className="td whitespace-nowrap">{stop.slot}</td>
                  <td className="td">
                    <span className={`badge ${TONES[stop.status] ?? "bg-warn-bg text-warn-fg"}`}>
                      {stop.status === "READY" ? "En camino" : ORDER_STATUS_LABEL[stop.status]}
                    </span>
                  </td>
                  <td className="td">
                    <Link
                      href={`/admin/pedidos/${stop.code}`}
                      className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-700
                                 transition hover:border-admin-blue hover:text-admin-blue"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
