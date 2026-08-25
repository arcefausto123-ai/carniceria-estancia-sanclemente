import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/whatsapp";
import { Search, Info, Alert } from "@/components/icons";

export const dynamic = "force-dynamic";

/**
 * Buscador de pedidos. Pide el número **y** el teléfono: los códigos son
 * correlativos, así que si alcanzara con el código cualquiera podría
 * recorrerlos y leer los datos de todos los clientes.
 */
async function findOrder(formData: FormData) {
  "use server";
  const raw = String(formData.get("code") ?? "").trim().toUpperCase().replace(/^#/, "");
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!raw || !phone) redirect("/mi-pedido?error=1");

  const code = raw.startsWith("ESC-") ? raw : `ESC-${raw}`;
  const order = await prisma.order.findUnique({ where: { code } });

  // Misma respuesta si el pedido no existe o si el teléfono no coincide:
  // así no se puede usar este formulario para averiguar qué códigos existen.
  if (!order || order.contactPhone !== phone) redirect("/mi-pedido?error=1");

  redirect(`/pedido/${order.code}?t=${order.publicToken}&estado=1`);
}

type SearchParams = Promise<{ error?: string; code?: string }>;

export default async function TrackOrderPage({ searchParams }: { searchParams: SearchParams }) {
  const { error, code } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-14">
      <h1 className="rule-gold font-serif text-4xl text-navy">Seguí tu pedido</h1>

      {error === "token" ? (
        <p className="mt-6 flex items-start gap-2 rounded-md bg-warn-bg px-4 py-3 text-sm text-warn-fg">
          <Alert className="mt-px h-4 w-4 shrink-0" />
          Por seguridad necesitamos confirmar que el pedido es tuyo. Ingresá el número y el
          teléfono con el que lo hiciste.
        </p>
      ) : (
        <p className="mt-5 text-sm text-ink-700">
          Ingresá el número que te dimos al confirmar la compra y el teléfono que cargaste.
        </p>
      )}

      <form action={findOrder} className="mt-6 space-y-4">
        <label className="block">
          <span className="field-label">Número de pedido</span>
          <input
            name="code"
            required
            defaultValue={code}
            placeholder="ESC-1048"
            className="field"
          />
        </label>

        <label className="block">
          <span className="field-label">Teléfono</span>
          <input
            name="phone"
            type="tel"
            required
            placeholder="11 3902-7156"
            className="field"
          />
        </label>

        <button type="submit" className="btn-navy w-full">
          <Search className="h-4 w-4" />
          Buscar mi pedido
        </button>
      </form>

      {error === "1" && (
        <p className="mt-4 flex items-start gap-2 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger-fg">
          <Alert className="mt-px h-4 w-4 shrink-0" />
          No encontramos un pedido con ese número y ese teléfono. Revisá los dos datos.
        </p>
      )}

      <p className="mt-6 flex items-start gap-2 text-xs text-ink-500">
        <Info className="mt-px h-4 w-4 shrink-0" />
        El enlace que te dimos al confirmar la compra te lleva directo, sin pedirte nada.
        Guardalo si querés volver rápido.
      </p>
    </div>
  );
}
