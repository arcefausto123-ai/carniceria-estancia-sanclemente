import Link from "next/link";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import type { OrderStatus, PaymentStatus, ProductStatus } from "@prisma/client";

/** Tarjeta de métrica con ícono, usada en la cabecera de casi todas las secciones. */
export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "info",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: React.ReactNode;
  tone?: "info" | "warn" | "ok" | "danger";
}) {
  const tones = {
    info: "bg-info-bg text-info-fg",
    warn: "bg-warn-bg text-warn-fg",
    ok: "bg-ok-bg text-ok-fg",
    danger: "bg-danger-bg text-danger-fg",
  };

  return (
    <div className="panel flex items-center gap-4 p-5">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm text-ink-500">{label}</p>
        <p className="mt-0.5 font-serif text-2xl text-ink-900">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
      </div>
    </div>
  );
}

const ORDER_TONES: Record<OrderStatus, string> = {
  NEW: "bg-info-bg text-info-fg",
  PAYMENT_PENDING: "bg-danger-bg text-danger-fg",
  CONFIRMED: "bg-ok-bg text-ok-fg",
  PREPARING: "bg-warn-bg text-warn-fg",
  READY: "bg-ok-bg text-ok-fg",
  DELIVERED: "bg-ink-100 text-ink-700",
  CANCELLED: "bg-ink-100 text-ink-500",
};

export function OrderBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge ${ORDER_TONES[status]}`}>{ORDER_STATUS_LABEL[status]}</span>;
}

export function ProductBadge({ status, stock }: { status: ProductStatus; stock: number }) {
  if (stock <= 0) return <span className="badge bg-danger-bg text-danger-fg">Sin stock</span>;
  if (status === "DRAFT") return <span className="badge bg-warn-bg text-warn-fg">Borrador</span>;
  return <span className="badge bg-ok-bg text-ok-fg">Publicado</span>;
}

const PAYMENT_TONES: Record<PaymentStatus, [string, string]> = {
  PENDING: ["bg-warn-bg text-warn-fg", "Por validar"],
  APPROVED: ["bg-ok-bg text-ok-fg", "Aprobado"],
  REJECTED: ["bg-danger-bg text-danger-fg", "Rechazado"],
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const [tone, label] = PAYMENT_TONES[status];
  return <span className={`badge ${tone}`}>{label}</span>;
}

/** Pestañas de filtro con contador, en la barra superior de cada listado. */
export function TabLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm whitespace-nowrap transition ${
        active
          ? "border-admin-blue font-medium text-admin-blue"
          : "border-transparent text-ink-500 hover:text-ink-900"
      }`}
    >
      {label}
      {count !== undefined && (
        <span
          className={`rounded px-1.5 py-0.5 text-xs ${
            active ? "bg-info-bg text-info-fg" : "bg-ink-100 text-ink-500"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-serif text-lg text-ink-900">{title}</p>
      <p className="mt-1 text-sm text-ink-500">{body}</p>
    </div>
  );
}

/** Toggle visual (checkbox estilizado) para formularios del panel. */
export function Toggle({
  name,
  defaultChecked,
  label,
  hint,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm text-ink-900">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-ink-500">{hint}</span>}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-ink-300 transition
                   peer-checked:bg-admin-blue after:absolute after:top-0.5 after:left-0.5
                   after:h-5 after:w-5 after:rounded-full after:bg-white after:transition
                   peer-checked:after:translate-x-5"
      />
    </label>
  );
}
