import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatMoney, startOfDay } from "@/lib/format";
import { StatCard, TabLink, PageHeader, EmptyState } from "@/components/admin/ui";
import { RouteBoard } from "./route-board";
import { ZoneForm } from "./zone-form";
import { saveTimeSlot, deleteTimeSlot, toggleShippingZone } from "../actions";
import {
  Truck, Clock, CheckCircle, Plus, Pin, Printer, Box, Pencil, Trash, Store,
} from "@/components/icons";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ tab?: string; zona?: string; nueva?: string; guardado?: string }>;

export default async function ShippingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tab = params.tab ?? "hoy";
  const today = startOfDay(new Date());
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const [routeOrders, zones, deliverySlots, pickupSlots, settings, editingZone] = await Promise.all([
    prisma.order.findMany({
      where: {
        deliveryMethod: "SHIPPING",
        createdAt: { gte: today, lt: tomorrow },
        status: { notIn: ["CANCELLED"] },
      },
      orderBy: [{ routePosition: "asc" }, { createdAt: "asc" }],
      include: { shippingZone: true },
    }),
    prisma.shippingZone.findMany({ orderBy: { position: "asc" } }),
    prisma.timeSlot.findMany({ where: { kind: "DELIVERY" }, orderBy: { position: "asc" } }),
    prisma.timeSlot.findMany({ where: { kind: "PICKUP" }, orderBy: { position: "asc" } }),
    getSettings(),
    params.zona ? prisma.shippingZone.findUnique({ where: { id: params.zona } }) : Promise.resolve(null),
  ]);

  const pending = routeOrders.filter((order) => ["NEW", "CONFIRMED", "PREPARING"].includes(order.status));
  const onRoute = routeOrders.filter((order) => order.status === "READY");
  const delivered = routeOrders.filter((order) => order.status === "DELIVERED");
  const drawerOpen = params.nueva === "1" || Boolean(editingZone);

  return (
    <div className={drawerOpen ? "grid gap-6 xl:grid-cols-[1fr_360px]" : ""}>
      <div className="min-w-0">
        <PageHeader
          title="Envíos y retiros"
          subtitle="Organizá las entregas y configurá las zonas de reparto"
          actions={
            <Link href="/admin/envios?nueva=1" className="btn-primary">
              <Plus className="h-4 w-4" />
              Nueva zona
            </Link>
          }
        />

        <div className="flex gap-6 overflow-x-auto border-b border-ink-200 no-scrollbar">
          <TabLink href="/admin/envios" active={tab === "hoy"} label="Entregas de hoy" />
          <TabLink href="/admin/envios?tab=zonas" active={tab === "zonas"} label="Zonas y tarifas" />
          <TabLink href="/admin/envios?tab=franjas" active={tab === "franjas"} label="Franjas horarias" />
        </div>

        {tab === "hoy" && (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={<Truck className="h-6 w-6" />} label="Envíos de hoy" value={routeOrders.length} />
              <StatCard icon={<Clock className="h-6 w-6" />} label="Pendientes" value={pending.length} tone="warn" />
              <StatCard icon={<Truck className="h-6 w-6" />} label="En camino" value={onRoute.length} />
              <StatCard icon={<CheckCircle className="h-6 w-6" />} label="Entregados" value={delivered.length} tone="ok" />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_280px]">
              <RouteBoard
                orders={routeOrders.map((order) => ({
                  id: order.id,
                  code: order.code,
                  customer: `${order.contactFirstName} ${order.contactLastName}`,
                  phone: order.contactPhone,
                  locality: order.locality ?? "—",
                  slot: order.slotLabel ?? "Sin franja",
                  status: order.status,
                }))}
              />

              <aside className="panel h-fit p-5">
                <h2 className="panel-title mb-4">Resumen de la ruta</h2>
                <ul className="space-y-4">
                  <SummaryRow icon={<Box className="h-6 w-6" />} value={String(routeOrders.length)} label="entregas" />
                  <SummaryRow
                    icon={<Pin className="h-6 w-6" />}
                    value={String(new Set(routeOrders.map((o) => o.locality)).size)}
                    label="localidades"
                  />
                  <SummaryRow
                    icon={<Clock className="h-6 w-6" />}
                    value={routeOrders[0]?.slotLabel?.split("–")[0] ?? "—"}
                    label="comienza"
                  />
                </ul>
                <Link href="/admin/envios/hoja-de-ruta" className="btn-secondary mt-5 w-full">
                  <Printer className="h-4 w-4" />
                  Imprimir hoja de ruta
                </Link>
              </aside>
            </div>
          </>
        )}

        {tab === "zonas" && (
          <section className="panel mt-5 p-5">
            <h2 className="panel-title mb-4">Zonas de envío</h2>
            {zones.length === 0 ? (
              <EmptyState title="Todavía no hay zonas" body="Creá una zona para poder cobrar el envío." />
            ) : (
              <ul className="space-y-3">
                {zones.map((zone) => (
                  <li
                    key={zone.id}
                    className="flex flex-wrap items-center gap-4 rounded-lg border border-ink-200 px-4 py-3"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-bg text-info-fg">
                      <Pin className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-ink-900">{zone.name}</span>
                      <span className="text-xs text-ink-500">
                        {formatMoney(zone.feeCents)} · Pedido mínimo {formatMoney(zone.minOrderCents)}
                      </span>
                    </span>

                    <form action={toggleShippingZone}>
                      <input type="hidden" name="id" value={zone.id} />
                      <button
                        type="submit"
                        role="switch"
                        aria-checked={zone.active}
                        aria-label={`${zone.active ? "Desactivar" : "Activar"} ${zone.name}`}
                        className={`relative block h-6 w-11 rounded-full transition ${
                          zone.active ? "bg-ok-fg" : "bg-ink-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                            zone.active ? "left-[1.375rem]" : "left-0.5"
                          }`}
                        />
                      </button>
                    </form>

                    <Link
                      href={`/admin/envios?tab=zonas&zona=${zone.id}`}
                      className="rounded p-1.5 text-ink-500 transition hover:bg-info-bg hover:text-admin-blue"
                      aria-label={`Editar ${zone.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "franjas" && (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <SlotPanel
              title="Franjas de envío"
              kind="DELIVERY"
              slots={deliverySlots}
              placeholder="12:00–14:00"
            />
            <div className="space-y-5">
              <SlotPanel
                title="Franjas de retiro en el local"
                kind="PICKUP"
                slots={pickupSlots}
                placeholder="10:00–13:00"
              />
              <section className="panel p-5">
                <h2 className="panel-title flex items-center gap-2">
                  <Store className="h-5 w-5 text-ink-500" />
                  Retiro en el local
                </h2>
                <p className="mt-3 flex items-start gap-2 text-sm text-ink-700">
                  <Pin className="mt-px h-4 w-4 shrink-0 text-ink-500" />
                  {settings.address || "Cargá la dirección en Configuración."}
                </p>
                <p className="mt-3 text-xs text-ink-500">
                  El retiro está{" "}
                  <strong className={settings.pickupEnabled ? "text-ok-fg" : "text-danger-fg"}>
                    {settings.pickupEnabled ? "habilitado" : "deshabilitado"}
                  </strong>
                  . Se cambia desde{" "}
                  <Link href="/admin/configuracion" className="text-admin-blue hover:underline">
                    Configuración
                  </Link>
                  .
                </p>
              </section>
            </div>
          </div>
        )}
      </div>

      {drawerOpen && <ZoneForm zone={editingZone} />}
    </div>
  );
}

function SummaryRow({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-info-bg text-info-fg">
        {icon}
      </span>
      <span>
        <span className="block font-serif text-2xl text-ink-900">{value}</span>
        <span className="text-xs text-ink-500">{label}</span>
      </span>
    </li>
  );
}

function SlotPanel({
  title,
  kind,
  slots,
  placeholder,
}: {
  title: string;
  kind: "DELIVERY" | "PICKUP";
  slots: { id: string; label: string }[];
  placeholder: string;
}) {
  return (
    <section className="panel p-5">
      <h2 className="panel-title mb-4">{title}</h2>

      <div className="flex flex-wrap gap-2">
        {slots.length === 0 && <p className="text-sm text-ink-500">Todavía no hay franjas cargadas.</p>}
        {slots.map((slot) => (
          <form key={slot.id} action={deleteTimeSlot} className="inline-flex">
            <input type="hidden" name="id" value={slot.id} />
            <span className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm text-ink-900">
              {slot.label}
              <button
                type="submit"
                className="text-ink-500 transition hover:text-danger-fg"
                aria-label={`Eliminar franja ${slot.label}`}
              >
                <Trash className="h-3.5 w-3.5" />
              </button>
            </span>
          </form>
        ))}
      </div>

      <form action={saveTimeSlot} className="mt-4 flex gap-2">
        <input type="hidden" name="kind" value={kind} />
        <input
          name="label"
          required
          placeholder={placeholder}
          aria-label={`Nueva franja para ${title}`}
          className="admin-field flex-1"
        />
        <button type="submit" className="btn-primary">
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </form>
    </section>
  );
}
