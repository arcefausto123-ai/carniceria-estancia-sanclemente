"use client";

import { useEffect, useState } from "react";
import { Truck, Store, Alert } from "@/components/icons";
import { formatMoney } from "@/lib/format";
import type { CheckoutDraft } from "../../actions";

type Zone = {
  id: string;
  name: string;
  feeCents: number;
  minOrderCents: number;
  fee: string;
  minOrder: string;
};

/**
 * Elección de envío vs. retiro. Sólo la parte que necesita reaccionar al
 * click vive en el cliente; el resto del formulario es server-rendered.
 * El total del resumen se actualiza en vivo, pero la tarifa que vale es
 * la que recalcula el servidor a partir de la zona.
 */
export function DeliveryForm({
  settings,
  zones,
  deliverySlots,
  pickupSlots,
  subtotalCents,
  defaults,
}: {
  settings: { shippingEnabled: boolean; pickupEnabled: boolean; address: string };
  zones: Zone[];
  deliverySlots: string[];
  pickupSlots: string[];
  subtotalCents: number;
  defaults: CheckoutDraft | null;
}) {
  const initial = defaults?.deliveryMethod ?? (settings.shippingEnabled ? "SHIPPING" : "PICKUP");
  const [method, setMethod] = useState<"SHIPPING" | "PICKUP">(initial);
  const [zoneId, setZoneId] = useState(defaults?.shippingZoneId ?? zones[0]?.id ?? "");

  const zone = zones.find((z) => z.id === zoneId);
  const shippingCents = method === "SHIPPING" ? (zone?.feeCents ?? 0) : 0;
  const belowZoneMinimum =
    method === "SHIPPING" && zone ? subtotalCents < zone.minOrderCents : false;
  const slots = method === "SHIPPING" ? deliverySlots : pickupSlots;

  // El resumen vive en el server component del costado; lo mantenemos
  // sincronizado por id en vez de duplicar el markup en el cliente.
  useEffect(() => {
    const label = document.getElementById("summary-shipping-label");
    const shipping = document.getElementById("summary-shipping");
    const total = document.getElementById("summary-total");
    if (label) label.textContent = method === "SHIPPING" ? "Envío refrigerado" : "Retiro en el local";
    if (shipping) {
      shipping.textContent =
        method === "PICKUP" ? "Gratis" : zone ? formatMoney(shippingCents) : "A calcular";
    }
    if (total) total.textContent = formatMoney(subtotalCents + shippingCents);
  }, [method, zone, shippingCents, subtotalCents]);

  return (
    <>
      <h2 className="mt-8 mb-3 text-[15px] text-navy">¿Cómo querés recibir tu pedido?</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <MethodCard
          checked={method === "SHIPPING"}
          disabled={!settings.shippingEnabled}
          onSelect={() => setMethod("SHIPPING")}
          icon={<Truck className="h-6 w-6" />}
          label="Envío a domicilio"
          value="SHIPPING"
        />
        <MethodCard
          checked={method === "PICKUP"}
          disabled={!settings.pickupEnabled}
          onSelect={() => setMethod("PICKUP")}
          icon={<Store className="h-6 w-6" />}
          label="Retiro en el local"
          value="PICKUP"
        />
      </div>

      {method === "SHIPPING" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <input name="street" required placeholder="Calle" aria-label="Calle" defaultValue={defaults?.street} className="field sm:col-span-1" />
          <input name="number" required placeholder="Número" aria-label="Número" defaultValue={defaults?.number} className="field" />
          <input name="locality" required placeholder="Localidad" aria-label="Localidad" defaultValue={defaults?.locality} className="field" />
          <input name="postalCode" placeholder="Código postal" aria-label="Código postal" defaultValue={defaults?.postalCode} className="field" />
          <input
            name="apartment"
            placeholder="Piso / departamento (opcional)"
            aria-label="Piso o departamento"
            defaultValue={defaults?.apartment}
            className="field sm:col-span-2"
          />
          <textarea
            name="instructions"
            rows={3}
            placeholder="Indicaciones para la entrega (opcional)"
            aria-label="Indicaciones para la entrega"
            defaultValue={defaults?.instructions}
            className="field sm:col-span-2 resize-y"
          />

          {zones.length > 0 && (
            <label className="sm:col-span-2">
              <span className="field-label">Zona de envío</span>
              <select
                name="shippingZoneId"
                value={zoneId}
                onChange={(event) => setZoneId(event.target.value)}
                className="field"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} — {z.fee} (mínimo {z.minOrder})
                  </option>
                ))}
              </select>
            </label>
          )}

          {belowZoneMinimum && zone && (
            <p className="sm:col-span-2 flex items-center gap-2 rounded-md bg-warn-bg px-3 py-2.5 text-xs text-warn-fg">
              <Alert className="h-4 w-4 shrink-0" />
              {zone.name} tiene un pedido mínimo de {zone.minOrder}.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-md border border-navy/15 bg-cream-50 px-5 py-4">
          <p className="font-serif text-lg text-navy">Retirás en el local</p>
          <p className="mt-1 text-sm text-ink-500">{settings.address || "Consultanos la dirección."}</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="text-sm text-navy">Franja horaria</span>
        <select
          name="slotLabel"
          defaultValue={defaults?.slotLabel}
          className="field max-w-md flex-1"
          aria-label="Franja horaria"
        >
          <option value="">Seleccioná una franja horaria</option>
          {slots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </div>

      <input type="hidden" name="deliveryMethod" value={method} />
    </>
  );
}

function MethodCard({
  checked,
  disabled,
  onSelect,
  icon,
  label,
  value,
}: {
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-md border-2 px-5 py-4 transition ${
        checked ? "border-navy bg-white" : "border-navy/15 bg-white hover:border-navy/40"
      } ${disabled ? "pointer-events-none opacity-40" : ""}`}
    >
      <input
        type="radio"
        name="deliveryMethodChoice"
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="h-4 w-4 accent-navy"
      />
      <span className="text-navy">{icon}</span>
      <span className="text-[15px] text-navy">{label}</span>
    </label>
  );
}
