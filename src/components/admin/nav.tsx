"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Meat, Cart, Tag, Truck, Card, Users, Gear } from "@/components/icons";

const LINKS = [
  { href: "/admin", label: "Resumen", icon: Gauge, exact: true },
  { href: "/admin/productos", label: "Productos", icon: Meat },
  { href: "/admin/pedidos", label: "Pedidos", icon: Cart },
  { href: "/admin/categorias", label: "Categorías", icon: Tag },
  { href: "/admin/envios", label: "Envíos", icon: Truck },
  { href: "/admin/pagos", label: "Pagos", icon: Card },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/configuracion", label: "Configuración", icon: Gear },
];

export function AdminNav({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  if (horizontal) {
    return (
      <nav className="flex gap-1 overflow-x-auto border-b border-ink-200 bg-white px-3 py-2 no-scrollbar">
        {LINKS.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
              isActive(href, exact)
                ? "bg-info-bg font-medium text-info-fg"
                : "text-ink-500 hover:bg-ink-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1 px-4">
      {LINKS.map(({ href, label, icon: Icon, exact }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
            isActive(href, exact)
              ? "bg-white/10 font-medium text-white"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
