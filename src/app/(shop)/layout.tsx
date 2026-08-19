import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getCart, cartCount } from "@/lib/cart";
import { Logo } from "@/components/logo";
import { Cart, Chat, Search, Store, Truck, User, Whatsapp } from "@/components/icons";
import { whatsappLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, cart] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ where: { visible: true }, orderBy: { position: "asc" } }),
    getCart(),
  ]);
  const count = cartCount(cart);

  return (
    <div className="paper flex min-h-screen flex-col">
      {/* Franja superior de beneficios */}
      <div className="bg-sand text-navy">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-1 px-4 py-2.5 text-[13px]">
          <span className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Envíos refrigerados a todo el país.
          </span>
          <span className="hidden text-navy/25 sm:inline">|</span>
          <span className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            {settings.address ? `Retirá en ${settings.address}.` : "Retiro en el local."}
          </span>
          <span className="hidden text-navy/25 lg:inline">|</span>
          <span className="hidden lg:inline">3 cuotas sin interés en todas tus compras.</span>
        </div>
      </div>

      {/* Cabecera */}
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-4">
          <Link href="/" className="shrink-0">
            <Logo src={settings.logoUrl} className="h-16 w-auto md:h-[76px]" />
          </Link>

          <form action="/" className="relative hidden flex-1 md:block">
            <input
              type="search"
              name="q"
              placeholder="¿Qué corte estás buscando?"
              aria-label="Buscar productos"
              className="w-full rounded-full border border-white/15 bg-white/95 py-3.5 pr-12 pl-6
                         text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="absolute top-1/2 right-4 -translate-y-1/2 text-navy"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>

          <nav className="ml-auto flex items-center gap-6 md:gap-8">
            <a
              href={whatsappLink(settings.whatsapp, "¡Hola! Tengo una consulta.")}
              target="_blank"
              rel="noreferrer"
              className="hidden flex-col items-center gap-1 text-xs transition hover:text-gold-400 sm:flex"
            >
              <Chat className="h-6 w-6" />
              Ayuda
            </a>
            <Link
              href="/mi-pedido"
              className="hidden flex-col items-center gap-1 text-xs transition hover:text-gold-400 sm:flex"
            >
              <User className="h-6 w-6" />
              Mi cuenta
            </Link>
            <Link href="/carrito" className="flex flex-col items-center gap-1 text-xs transition hover:text-gold-400">
              <span className="relative">
                <Cart className="h-6 w-6" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center
                                   rounded-full bg-gold-500 px-1 text-[10px] font-semibold text-navy-950">
                    {count}
                  </span>
                )}
              </span>
              Mi carrito ({count})
            </Link>
          </nav>
        </div>
      </header>

      {/* Navegación de categorías */}
      <nav className="border-b border-navy/10 bg-cream-50">
        <div className="mx-auto flex max-w-7xl items-center gap-7 overflow-x-auto px-4 text-[15px] no-scrollbar">
          <NavLink href="/">Inicio</NavLink>
          {categories.map((category) => (
            <NavLink key={category.id} href={`/?categoria=${category.slug}`}>
              {category.name}
            </NavLink>
          ))}
          <NavLink href="/como-comprar">Cómo comprar</NavLink>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 bg-navy text-white/80">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo src={settings.logoUrl} className="h-20 w-auto text-white" />
            <p className="mt-4 text-sm leading-relaxed">{settings.tagline}</p>
          </div>
          <div>
            <h3 className="mb-3 font-serif text-base text-white">Tienda</h3>
            <ul className="space-y-2 text-sm">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/?categoria=${category.slug}`} className="hover:text-gold-400">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-serif text-base text-white">Ayuda</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/como-comprar" className="hover:text-gold-400">
                  Cómo comprar
                </Link>
              </li>
              <li>
                <Link href="/mi-pedido" className="hover:text-gold-400">
                  Seguí tu pedido
                </Link>
              </li>
              <li>
                <a
                  href={whatsappLink(settings.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-gold-400"
                >
                  <Whatsapp className="h-4 w-4" />
                  {settings.whatsapp || "WhatsApp"}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-serif text-base text-white">Contacto</h3>
            <ul className="space-y-2 text-sm">
              {settings.address && <li>{settings.address}</li>}
              {settings.email && <li>{settings.email}</li>}
              {settings.instagram && (
                <li>
                  <a href={settings.instagram} target="_blank" rel="noreferrer" className="hover:text-gold-400">
                    Instagram
                  </a>
                </li>
              )}
              {settings.facebook && (
                <li>
                  <a href={settings.facebook} target="_blank" rel="noreferrer" className="hover:text-gold-400">
                    Facebook
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs">
          © {new Date().getFullYear()} {settings.businessName}. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="border-b-2 border-transparent py-3.5 whitespace-nowrap text-navy transition
                 hover:border-gold-500 hover:text-navy-700"
    >
      {children}
    </Link>
  );
}
