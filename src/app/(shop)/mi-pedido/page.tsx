import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Search } from "@/components/icons";

export const dynamic = "force-dynamic";

async function findOrder(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/^#/, "");
  if (!code) redirect("/mi-pedido?error=1");

  const normalized = code.startsWith("ESC-") ? code : `ESC-${code}`;
  const order = await prisma.order.findUnique({ where: { code: normalized } });
  if (!order) redirect("/mi-pedido?error=1");
  redirect(`/pedido/${order.code}?estado=1`);
}

type SearchParams = Promise<{ error?: string }>;

export default async function TrackOrderPage({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="rule-gold font-serif text-4xl text-navy">Seguí tu pedido</h1>
      <p className="mt-5 text-sm text-ink-700">
        Ingresá el número que te dimos al confirmar la compra (por ejemplo ESC-1048).
      </p>

      <form action={findOrder} className="mt-6 flex gap-3">
        <input
          name="code"
          required
          placeholder="ESC-1048"
          aria-label="Número de pedido"
          className="field flex-1"
        />
        <button type="submit" className="btn-navy px-5">
          <Search className="h-4 w-4" />
          Buscar
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger-fg">
          No encontramos ningún pedido con ese número. Revisalo y probá de nuevo.
        </p>
      )}
    </div>
  );
}
