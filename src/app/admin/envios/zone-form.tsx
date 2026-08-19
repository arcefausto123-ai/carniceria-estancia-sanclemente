"use client";

import Link from "next/link";
import { saveShippingZone, deleteShippingZone } from "../actions";
import { XCircle, Save, Trash } from "@/components/icons";
import type { ShippingZone } from "@prisma/client";

export function ZoneForm({ zone }: { zone: ShippingZone | null }) {
  return (
    <aside className="panel h-fit p-5 xl:sticky xl:top-24">
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 className="panel-title">{zone ? "Editar zona" : "Nueva zona de envío"}</h2>
        <Link
          href="/admin/envios?tab=zonas"
          className="text-ink-500 transition hover:text-ink-900"
          aria-label="Cerrar"
        >
          <XCircle className="h-5 w-5" />
        </Link>
      </div>

      <form action={saveShippingZone} className="space-y-4">
        {zone && <input type="hidden" name="id" value={zone.id} />}

        <label className="block">
          <span className="admin-label">Nombre de la zona</span>
          <input
            name="name"
            required
            defaultValue={zone?.name}
            placeholder="Loma Verde"
            className="admin-field"
          />
        </label>

        <label className="block">
          <span className="admin-label">Tarifa de envío</span>
          <input
            name="fee"
            required
            inputMode="decimal"
            defaultValue={zone ? String(Math.round(zone.feeCents / 100)) : ""}
            placeholder="3500"
            className="admin-field"
          />
        </label>

        <label className="block">
          <span className="admin-label">Pedido mínimo para esta zona</span>
          <input
            name="minOrder"
            inputMode="decimal"
            defaultValue={zone ? String(Math.round(zone.minOrderCents / 100)) : "0"}
            placeholder="20000"
            className="admin-field"
          />
          <span className="mt-1 block text-xs text-ink-500">
            Dejalo en 0 si no querés exigir un mínimo propio de la zona.
          </span>
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-ink-200 pt-4">
          <span className="text-sm text-ink-900">Zona activa</span>
          <input
            type="checkbox"
            name="active"
            defaultChecked={zone?.active ?? true}
            className="peer sr-only"
          />
          <span
            className="relative h-6 w-11 shrink-0 rounded-full bg-ink-300 transition
                       peer-checked:bg-admin-blue after:absolute after:top-0.5 after:left-0.5
                       after:h-5 after:w-5 after:rounded-full after:bg-white after:transition
                       peer-checked:after:translate-x-5"
          />
        </label>

        <button type="submit" className="btn-primary w-full">
          <Save className="h-4 w-4" />
          Guardar zona
        </button>
      </form>

      {zone && (
        <form action={deleteShippingZone} className="mt-3">
          <input type="hidden" name="id" value={zone.id} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5
                       text-sm text-danger-fg transition hover:bg-danger-bg"
          >
            <Trash className="h-4 w-4" />
            Eliminar zona
          </button>
        </form>
      )}
    </aside>
  );
}
