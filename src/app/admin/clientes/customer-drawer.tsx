"use client";

import Link from "next/link";
import { useState } from "react";
import { saveCustomer, deleteCustomer } from "../actions";
import { whatsappLink } from "@/lib/whatsapp";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import { XCircle, Phone, Mail, Pin, Whatsapp, Star, Bag, Trash, Save, Pencil } from "@/components/icons";
import type { OrderStatus } from "@prisma/client";

const TAGS = [
  { value: "frecuente", label: "Cliente frecuente", icon: Star },
  { value: "prefiere-retiro", label: "Prefiere retiro", icon: Bag },
];

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  tags: string[];
  address: {
    street: string;
    number: string;
    apartment: string | null;
    locality: string;
    postalCode: string;
  } | null;
  orders: { code: string; date: string; total: string; status: OrderStatus }[];
  orderCount: number;
  spent: string;
};

export function CustomerDrawer({ customer }: { customer: Customer }) {
  const [editing, setEditing] = useState(false);
  const [tags, setTags] = useState(customer.tags);

  const toggleTag = (value: string) =>
    setTags((current) =>
      current.includes(value) ? current.filter((tag) => tag !== value) : [...current, value],
    );

  return (
    <aside className="panel h-fit p-5 xl:sticky xl:top-24">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="font-serif text-2xl text-ink-900">
          {customer.firstName} {customer.lastName}
        </h2>
        <Link href="/admin/clientes" className="text-ink-500 transition hover:text-ink-900" aria-label="Cerrar">
          <XCircle className="h-5 w-5" />
        </Link>
      </div>

      <form action={saveCustomer}>
        <input type="hidden" name="id" value={customer.id} />
        {tags.map((tag) => (
          <input key={tag} type="hidden" name="tags" value={tag} />
        ))}

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="admin-label">Nombre</span>
                <input name="firstName" required defaultValue={customer.firstName} className="admin-field" />
              </label>
              <label className="block">
                <span className="admin-label">Apellido</span>
                <input name="lastName" required defaultValue={customer.lastName} className="admin-field" />
              </label>
            </div>
            <label className="block">
              <span className="admin-label">Teléfono</span>
              <input name="phone" required defaultValue={customer.phone} className="admin-field" />
            </label>
            <label className="block">
              <span className="admin-label">Correo electrónico</span>
              <input name="email" type="email" defaultValue={customer.email ?? ""} className="admin-field" />
            </label>
          </div>
        ) : (
          <>
            <input type="hidden" name="firstName" value={customer.firstName} />
            <input type="hidden" name="lastName" value={customer.lastName} />
            <input type="hidden" name="phone" value={customer.phone} />
            <input type="hidden" name="email" value={customer.email ?? ""} />

            <div className="space-y-2 text-sm text-ink-700">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-ink-500" />
                {customer.phone}
              </p>
              {customer.email && (
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-ink-500" />
                  {customer.email}
                </p>
              )}
              {customer.address && (
                <p className="flex items-start gap-2">
                  <Pin className="mt-px h-4 w-4 shrink-0 text-ink-500" />
                  {customer.address.locality}
                </p>
              )}
            </div>
          </>
        )}

        <a
          href={whatsappLink(customer.phone)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border
                     border-ok-fg/30 bg-white px-4 py-2.5 text-sm font-medium text-ok-fg
                     transition hover:bg-ok-bg"
        >
          <Whatsapp className="h-5 w-5" />
          Contactar por WhatsApp
        </a>

        {/* Etiquetas */}
        <div className="mt-4 flex flex-wrap gap-2">
          {TAGS.map(({ value, label, icon: Icon }) => {
            const on = tags.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleTag(value)}
                aria-pressed={on}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
                  on
                    ? "border-gold-500 bg-warn-bg font-medium text-warn-fg"
                    : "border-ink-200 text-ink-500 hover:border-ink-300"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        <p className="mt-4 border-t border-ink-200 pt-4 text-sm text-ink-700">
          <strong className="font-semibold text-ink-900">{customer.orderCount}</strong>{" "}
          {customer.orderCount === 1 ? "pedido" : "pedidos"} ·{" "}
          <strong className="font-semibold text-ink-900">{customer.spent}</strong> total
        </p>

        {/* Dirección guardada */}
        {customer.address && (
          <div className="mt-4">
            <p className="admin-label">Dirección guardada</p>
            <p className="text-sm leading-relaxed text-ink-700">
              {customer.address.street} {customer.address.number}
              {customer.address.apartment ? `, ${customer.address.apartment}` : ""}
              <br />
              {customer.address.locality}
              {customer.address.postalCode ? `, ${customer.address.postalCode}` : ""}
            </p>
          </div>
        )}

        {/* Últimos pedidos */}
        {customer.orders.length > 0 && (
          <div className="mt-4">
            <p className="admin-label">Últimos pedidos</p>
            <ul className="space-y-2">
              {customer.orders.map((order) => (
                <li key={order.code} className="flex items-center justify-between gap-2 text-sm">
                  <Link
                    href={`/admin/pedidos/${order.code}`}
                    className="font-medium text-admin-blue hover:underline"
                  >
                    #{order.code}
                  </Link>
                  <span className="text-xs text-ink-500">{order.date}</span>
                  <span className="badge bg-ink-100 text-ink-700">
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                  <span className="text-ink-900">{order.total}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <label className="mt-4 block">
          <span className="admin-label">Nota interna</span>
          <textarea
            name="notes"
            rows={3}
            defaultValue={customer.notes ?? ""}
            placeholder="Retira habitualmente los sábados."
            className="admin-field resize-y"
          />
        </label>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="btn-secondary flex-1"
          >
            <Pencil className="h-4 w-4" />
            {editing ? "Cancelar edición" : "Editar datos"}
          </button>
          <button type="submit" className="btn-primary flex-1">
            <Save className="h-4 w-4" />
            Guardar
          </button>
        </div>
      </form>

      <form action={deleteCustomer} className="mt-3">
        <input type="hidden" name="id" value={customer.id} />
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5
                     text-sm text-danger-fg transition hover:bg-danger-bg"
        >
          <Trash className="h-4 w-4" />
          Eliminar datos del cliente
        </button>
        <p className="mt-1.5 text-center text-xs text-ink-500">
          Sólo se puede eliminar si no tiene pedidos asociados.
        </p>
      </form>
    </aside>
  );
}
