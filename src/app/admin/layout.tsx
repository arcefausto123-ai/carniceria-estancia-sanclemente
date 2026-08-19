import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession, destroySession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { AdminNav } from "@/components/admin/nav";
import { Bell, Search, User, ChevronDown } from "@/components/icons";

export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  await destroySession();
  redirect("/admin/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // La pantalla de login usa este mismo layout, así que la dejamos pasar sin sesión.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLogin = pathname.startsWith("/admin/login");

  const session = await getSession();
  if (!session && !isLogin) redirect("/admin/login");
  if (isLogin) return <>{children}</>;

  const [settings, pendingPayments] = await Promise.all([
    getSettings(),
    prisma.payment.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="flex min-h-screen bg-admin-bg">
      {/* Barra lateral */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-navy text-white lg:flex">
        <Link href="/admin" className="flex justify-center px-6 py-7">
          <Logo src={settings.logoUrl} className="h-24 w-auto" />
        </Link>
        <AdminNav />
        <div className="mt-auto px-4 py-5 text-xs text-white/50">
          <Link href="/" target="_blank" className="hover:text-gold-400">
            Ver la tienda →
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior */}
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-ink-200 bg-white px-5 py-3">
          <Link href="/admin" className="lg:hidden">
            <Logo src={settings.logoUrl} className="h-9 w-auto text-navy" />
          </Link>

          <form action="/admin/pedidos" className="relative hidden max-w-md flex-1 sm:block">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              name="q"
              type="search"
              placeholder="Buscar producto o pedido"
              aria-label="Buscar"
              className="admin-field bg-admin-bg pl-9"
            />
          </form>

          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/admin/pagos"
              className="relative text-ink-500 transition hover:text-ink-900"
              aria-label={`${pendingPayments} comprobantes por validar`}
            >
              <Bell className="h-5 w-5" />
              {pendingPayments > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center
                                 justify-center rounded-full bg-danger-fg px-1 text-[10px] font-semibold text-white">
                  {pendingPayments}
                </span>
              )}
            </Link>

            <form action={logout} className="flex items-center gap-2">
              <User className="h-6 w-6 text-ink-500" />
              <span className="hidden text-sm text-ink-900 sm:inline">{session!.name}</span>
              <button
                type="submit"
                className="flex items-center gap-1 text-xs text-ink-500 hover:text-danger-fg"
              >
                <ChevronDown className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Salir</span>
              </button>
            </form>
          </div>
        </header>

        <div className="lg:hidden">
          <AdminNav horizontal />
        </div>

        <main className="min-w-0 flex-1 p-5 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
