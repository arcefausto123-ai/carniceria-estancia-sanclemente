"use client";

import Link from "next/link";
import { useState } from "react";
import { saveSettings, changePassword } from "../actions";
import { Logo } from "@/components/logo";
import { ImageField } from "@/components/admin/image-field";
import {
  Store, Clock, Box, Card, Bell, Users, Save, Info, Whatsapp, Pin, Alert, CheckCircle, ArrowRight,
} from "@/components/icons";

type Values = {
  businessName: string;
  logoUrl: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
  tagline: string;
  stockHoldMinutes: number;
  depositPct: number;
  minOrder: string;
  shippingEnabled: boolean;
  pickupEnabled: boolean;
  hideOutOfStock: boolean;
  bankAlias: string;
  bankHolder: string;
  bankTaxId: string;
  bankCbu: string;
  notifyOnNewOrder: boolean;
  notifyOnPaymentOk: boolean;
  notifyOnReady: boolean;
  msgNewOrder: string;
  msgPaymentOk: string;
  msgReady: string;
};

const SECTIONS = [
  { key: "negocio", label: "Datos del negocio", icon: Store },
  { key: "pedidos", label: "Pedidos y stock", icon: Box },
  { key: "pagos", label: "Pagos", icon: Card },
  { key: "notificaciones", label: "Notificaciones", icon: Bell },
  { key: "usuarios", label: "Usuarios y permisos", icon: Users },
];

const HOLD_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

export function SettingsForm({
  settings,
  section,
  saved,
  admins,
  storageReady,
  passwordResult,
}: {
  settings: Values;
  section: string;
  saved: boolean;
  admins: { id: string; name: string; email: string; role: string }[];
  storageReady: boolean;
  passwordResult?: string;
}) {
  const [values, setValues] = useState(settings);
  const [dirty, setDirty] = useState(false);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  return (
    <>
      {/* Hermano del formulario de configuración: los campos se enganchan
          con el atributo form="cambiar-clave". */}
      <form id="cambiar-clave" action={changePassword} className="hidden" />

      <form action={saveSettings} onChange={() => setDirty(true)} className="pb-24">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink-900">Configuración</h1>
          <p className="mt-1 text-sm text-ink-500">Definí las reglas generales de la tienda</p>
        </div>
        <button type="submit" className="btn-primary">
          <Save className="h-4 w-4" />
          Guardar cambios
        </button>
      </div>

      {saved && !dirty && (
        <p className="mb-5 flex items-center gap-2 rounded-lg bg-ok-bg px-4 py-3 text-sm text-ok-fg">
          <CheckCircle className="h-4 w-4" />
          La configuración se guardó correctamente.
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[200px_1fr_280px]">
        {/* Sub-navegación */}
        <nav className="panel h-fit p-2">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <Link
              key={key}
              href={`/admin/configuracion?seccion=${key}`}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
                section === key
                  ? "bg-info-bg font-medium text-info-fg"
                  : "text-ink-700 hover:bg-ink-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Todas las secciones están montadas para que un solo submit
            guarde el formulario completo; se ocultan con CSS. */}
        <div className="min-w-0 space-y-5">
          <Section visible={section === "negocio"}>
            <div className="panel p-5">
              <h2 className="panel-title mb-4">Datos del negocio</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <div className="flex flex-wrap items-end gap-4">
                    <span className="flex h-24 w-36 shrink-0 items-center justify-center
                                     rounded-lg border border-ink-200 bg-navy p-2">
                      <Logo src={values.logoUrl || null} className="h-full w-auto" />
                    </span>
                    <div className="min-w-56 flex-1">
                      <ImageField
                        name="logoUrl"
                        folder="marca"
                        defaultValue={values.logoUrl}
                        label="Logo de la tienda"
                        hint="PNG con fondo transparente, en blanco"
                        storageReady={storageReady}
                        aspect="h-24"
                        onChange={(next) => set("logoUrl", next)}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-ink-500">
                    Dejalo vacío para usar el logo oficial. Ojo: la tienda lo muestra siempre
                    sobre fondo azul, así que tiene que ser claro.
                  </p>
                </div>

                <Field label="Nombre comercial">
                  <input
                    name="businessName"
                    value={values.businessName}
                    onChange={(event) => set("businessName", event.target.value)}
                    className="admin-field"
                  />
                </Field>
                <Field label="WhatsApp">
                  <input
                    name="whatsapp"
                    value={values.whatsapp}
                    onChange={(event) => set("whatsapp", event.target.value)}
                    placeholder="11 5582-9202"
                    className="admin-field"
                  />
                </Field>
                <Field label="Correo electrónico">
                  <input
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={(event) => set("email", event.target.value)}
                    className="admin-field"
                  />
                </Field>
                <Field label="Dirección del local">
                  <input
                    name="address"
                    value={values.address}
                    onChange={(event) => set("address", event.target.value)}
                    className="admin-field"
                  />
                </Field>
                <Field label="Instagram">
                  <input
                    name="instagram"
                    value={values.instagram}
                    onChange={(event) => set("instagram", event.target.value)}
                    placeholder="https://instagram.com/…"
                    className="admin-field"
                  />
                </Field>
                <Field label="Facebook">
                  <input
                    name="facebook"
                    value={values.facebook}
                    onChange={(event) => set("facebook", event.target.value)}
                    placeholder="https://facebook.com/…"
                    className="admin-field"
                  />
                </Field>
                <Field label="Frase de la tienda" full>
                  <input
                    name="tagline"
                    value={values.tagline}
                    onChange={(event) => set("tagline", event.target.value)}
                    className="admin-field"
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section visible={section === "pedidos"}>
            <div className="panel p-5">
              <h2 className="panel-title mb-4">Reglas de pedidos</h2>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label htmlFor="stockHoldMinutes" className="flex items-center gap-2 text-sm text-ink-900">
                    <Clock className="h-4 w-4 text-ink-500" />
                    Tiempo de reserva del stock
                  </label>
                  <select
                    id="stockHoldMinutes"
                    name="stockHoldMinutes"
                    value={values.stockHoldMinutes}
                    onChange={(event) => set("stockHoldMinutes", Number(event.target.value))}
                    className="admin-field w-40"
                  >
                    {HOLD_OPTIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} minutos
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label htmlFor="depositPct" className="text-sm text-ink-900">
                    Porcentaje de seña para retiro en efectivo
                  </label>
                  <span className="relative w-40">
                    <input
                      id="depositPct"
                      name="depositPct"
                      type="number"
                      min={0}
                      max={100}
                      value={values.depositPct}
                      onChange={(event) => set("depositPct", Number(event.target.value))}
                      className="admin-field pr-8"
                    />
                    <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-500">
                      %
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label htmlFor="minOrder" className="text-sm text-ink-900">
                    Pedido mínimo
                  </label>
                  <span className="relative w-40">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-500">$</span>
                    <input
                      id="minOrder"
                      name="minOrder"
                      inputMode="decimal"
                      value={values.minOrder}
                      onChange={(event) => set("minOrder", event.target.value)}
                      className="admin-field pl-7"
                    />
                  </span>
                </div>
              </div>

              <div className="mt-4 divide-y divide-ink-200 border-t border-ink-200">
                <Switch
                  name="shippingEnabled"
                  checked={values.shippingEnabled}
                  onChange={(next) => set("shippingEnabled", next)}
                  label="Permitir envío a domicilio"
                  hint="Los clientes podrán elegir envío a domicilio."
                />
                <Switch
                  name="pickupEnabled"
                  checked={values.pickupEnabled}
                  onChange={(next) => set("pickupEnabled", next)}
                  label="Permitir retiro en el local"
                  hint="Los clientes podrán retirar su pedido en el local."
                />
                <Switch
                  name="hideOutOfStock"
                  checked={values.hideOutOfStock}
                  onChange={(next) => set("hideOutOfStock", next)}
                  label="Ocultar automáticamente productos sin stock"
                  hint="Los productos sin stock no se mostrarán en la tienda."
                />
              </div>

              <p className="mt-4 flex items-start gap-2 rounded-lg bg-info-bg px-3 py-2.5 text-xs text-info-fg">
                <Info className="mt-px h-4 w-4 shrink-0" />
                Cambiar el porcentaje de seña sólo afecta a los pedidos nuevos. Los ya emitidos
                conservan el porcentaje con el que se calcularon.
              </p>
            </div>
          </Section>

          <Section visible={section === "pagos"}>
            <div className="panel p-5">
              <h2 className="panel-title mb-1">Datos bancarios</h2>
              <p className="mb-4 text-sm text-ink-500">
                Es la cuenta a la que los clientes transfieren la seña o el pago total.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Alias">
                  <input
                    name="bankAlias"
                    value={values.bankAlias}
                    onChange={(event) => set("bankAlias", event.target.value)}
                    placeholder="ESTANCIA.SANCLEMENTE"
                    className="admin-field"
                  />
                </Field>
                <Field label="Titular de la cuenta">
                  <input
                    name="bankHolder"
                    value={values.bankHolder}
                    onChange={(event) => set("bankHolder", event.target.value)}
                    className="admin-field"
                  />
                </Field>
                <Field label="CUIT/CUIL">
                  <input
                    name="bankTaxId"
                    value={values.bankTaxId}
                    onChange={(event) => set("bankTaxId", event.target.value)}
                    placeholder="27-12345678-9"
                    className="admin-field"
                  />
                </Field>
                <Field label="CBU/CVU">
                  <input
                    name="bankCbu"
                    value={values.bankCbu}
                    onChange={(event) => set("bankCbu", event.target.value)}
                    className="admin-field"
                  />
                </Field>
              </div>

              <p className="mt-4 flex items-start gap-2 rounded-lg bg-warn-bg px-3 py-2.5 text-xs text-warn-fg">
                <Alert className="mt-px h-4 w-4 shrink-0" />
                No hay pasarela de pago automática: cada comprobante se aprueba a mano desde{" "}
                <Link href="/admin/pagos" className="underline">
                  Pagos y comprobantes
                </Link>
                .
              </p>
            </div>
          </Section>

          <Section visible={section === "notificaciones"}>
            <div className="panel p-5">
              <h2 className="panel-title mb-1">Mensajes automáticos</h2>
              <p className="mb-4 text-sm text-ink-500">
                El panel arma el mensaje y lo abre en WhatsApp con un clic, para que salga desde el
                número del negocio. Variables disponibles: {"{cliente}"}, {"{pedido}"}, {"{total}"},{" "}
                {"{sena}"}, {"{saldo}"}, {"{alias}"}, {"{entrega}"}, {"{negocio}"}.
              </p>

              <div className="space-y-5">
                <MessageRule
                  toggleName="notifyOnNewOrder"
                  checked={values.notifyOnNewOrder}
                  onToggle={(next) => set("notifyOnNewOrder", next)}
                  title="Avisar al recibir un pedido"
                  hint="Se sugiere un mensaje cuando llega un pedido nuevo."
                  textName="msgNewOrder"
                  value={values.msgNewOrder}
                  onChangeText={(next) => set("msgNewOrder", next)}
                />
                <MessageRule
                  toggleName="notifyOnPaymentOk"
                  checked={values.notifyOnPaymentOk}
                  onToggle={(next) => set("notifyOnPaymentOk", next)}
                  title="Avisar al confirmar el pago"
                  hint="Se sugiere un mensaje cuando aprobás un comprobante."
                  textName="msgPaymentOk"
                  value={values.msgPaymentOk}
                  onChangeText={(next) => set("msgPaymentOk", next)}
                />
                <MessageRule
                  toggleName="notifyOnReady"
                  checked={values.notifyOnReady}
                  onToggle={(next) => set("notifyOnReady", next)}
                  title="Avisar cuando esté listo"
                  hint="Se sugiere un mensaje cuando el pedido pasa a Listo."
                  textName="msgReady"
                  value={values.msgReady}
                  onChangeText={(next) => set("msgReady", next)}
                />
              </div>
            </div>
          </Section>

          <Section visible={section === "usuarios"}>
            <div className="panel p-5">
              <h2 className="panel-title mb-4">Usuarios del panel</h2>
              <ul className="divide-y divide-ink-200">
                {admins.map((admin) => (
                  <li key={admin.id} className="flex items-center justify-between gap-3 py-3">
                    <span>
                      <span className="block text-sm font-medium text-ink-900">{admin.name}</span>
                      <span className="text-xs text-ink-500">{admin.email}</span>
                    </span>
                    <span className="badge bg-info-bg text-info-fg">{admin.role}</span>
                  </li>
                ))}
              </ul>
            </div>

            <PasswordPanel result={passwordResult} />
          </Section>
        </div>

        {/* Vista pública */}
        <aside className="panel h-fit p-5 xl:sticky xl:top-24">
          <h2 className="panel-title">Vista pública</h2>
          <p className="mt-1 text-xs text-ink-500">Así se mostrará tu tienda para los clientes.</p>

          <div className="mt-4 overflow-hidden rounded-lg border border-ink-200">
            <div className="bg-navy px-3 py-2.5 text-white">
              <Logo src={values.logoUrl || null} className="h-8 w-auto" />
            </div>
            <div className="bg-cream-100 px-4 py-4">
              <p className="font-serif text-lg text-navy">{values.businessName || "Tu negocio"}</p>
              <p className="mt-1 text-xs text-ink-700">{values.tagline}</p>

              <div className="mt-3 space-y-1.5 text-xs text-ink-700">
                {values.whatsapp && (
                  <p className="flex items-center gap-2">
                    <Whatsapp className="h-3.5 w-3.5 text-ok-fg" />
                    {values.whatsapp}
                  </p>
                )}
                {values.address && (
                  <p className="flex items-start gap-2">
                    <Pin className="mt-px h-3.5 w-3.5 shrink-0 text-ink-500" />
                    {values.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Link href="/" target="_blank" className="btn-secondary mt-4 w-full">
            Ver tienda
            <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>

      {/* Barra fija de guardado */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white px-5 py-3.5 lg:pl-64">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-warn-fg">
              <Alert className="h-4 w-4" />
              Hay cambios sin guardar
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setValues(settings);
                  setDirty(false);
                }}
                className="btn-secondary"
              >
                Descartar
              </button>
              <button type="submit" className="btn-primary">
                <Save className="h-4 w-4" />
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
    </>
  );
}

/**
 * Cambio de contraseña. Vive en su propio <form>, y por eso se renderiza
 * fuera del formulario grande de Configuración: HTML no admite formularios
 * anidados.
 */
function PasswordPanel({ result }: { result?: string }) {
  const MESSAGES: Record<string, { tone: string; text: string }> = {
    ok: { tone: "bg-ok-bg text-ok-fg", text: "Tu contraseña se cambió correctamente." },
    actual: { tone: "bg-danger-bg text-danger-fg", text: "La contraseña actual no es correcta." },
    corta: { tone: "bg-danger-bg text-danger-fg", text: "La nueva necesita al menos 10 caracteres." },
    distintas: { tone: "bg-danger-bg text-danger-fg", text: "Las dos contraseñas nuevas no coinciden." },
    igual: { tone: "bg-warn-bg text-warn-fg", text: "La nueva contraseña es igual a la actual." },
  };
  const message = result ? MESSAGES[result] : undefined;

  return (
    <div className="panel mt-5 p-5">
      <h2 className="panel-title mb-1">Cambiar mi contraseña</h2>
      <p className="mb-4 text-sm text-ink-500">Sólo afecta a la cuenta con la que entraste.</p>

      {message && (
        <p className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${message.tone}`}>
          {result === "ok" ? <CheckCircle className="h-4 w-4" /> : <Alert className="h-4 w-4" />}
          {message.text}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="admin-label">Contraseña actual</span>
          <input
            form="cambiar-clave"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="admin-field"
          />
        </label>
        <label className="block">
          <span className="admin-label">Nueva contraseña</span>
          <input
            form="cambiar-clave"
            name="newPassword"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className="admin-field"
          />
        </label>
        <label className="block">
          <span className="admin-label">Repetir la nueva</span>
          <input
            form="cambiar-clave"
            name="repeatPassword"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className="admin-field"
          />
        </label>
      </div>

      <button form="cambiar-clave" type="submit" className="btn-primary mt-4">
        <Save className="h-4 w-4" />
        Cambiar contraseña
      </button>
    </div>
  );
}

function Section({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return <div className={visible ? "" : "hidden"}>{children}</div>;
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="admin-label">{label}</span>
      {children}
    </label>
  );
}

function Switch({
  name,
  checked,
  onChange,
  label,
  hint,
}: {
  name: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3.5">
      <span className="min-w-0">
        <span className="block text-sm text-ink-900">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-ink-500">{hint}</span>}
      </span>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-ink-300 transition
                   peer-checked:bg-admin-blue after:absolute after:top-0.5 after:left-0.5
                   after:h-5 after:w-5 after:rounded-full after:bg-white after:transition
                   peer-checked:after:translate-x-5"
      />
    </label>
  );
}

function MessageRule({
  toggleName,
  checked,
  onToggle,
  title,
  hint,
  textName,
  value,
  onChangeText,
}: {
  toggleName: string;
  checked: boolean;
  onToggle: (next: boolean) => void;
  title: string;
  hint: string;
  textName: string;
  value: string;
  onChangeText: (next: string) => void;
}) {
  return (
    <div className="rounded-lg border border-ink-200 p-4">
      <Switch name={toggleName} checked={checked} onChange={onToggle} label={title} hint={hint} />
      {/* readOnly y no disabled: un campo deshabilitado no se envía con el
          formulario, así que apagar el aviso borraba la plantilla guardada. */}
      <textarea
        name={textName}
        rows={2}
        value={value}
        onChange={(event) => onChangeText(event.target.value)}
        readOnly={!checked}
        aria-disabled={!checked}
        className={`admin-field mt-2 resize-y ${
          checked ? "" : "bg-ink-100 text-ink-500"
        }`}
      />
    </div>
  );
}
