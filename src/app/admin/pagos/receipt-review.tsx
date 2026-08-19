"use client";

import Link from "next/link";
import { useState } from "react";
import { approvePayment, rejectPayment } from "../actions";
import { formatMoney, formatMoneyExact } from "@/lib/format";
import { XCircle, CheckCircle, Alert, Bank } from "@/components/icons";

type Receipt = {
  id: string;
  kind: "DEPOSIT" | "FULL" | "BALANCE";
  expectedCents: number;
  reportedCents: number | null;
  senderName: string | null;
  senderTaxId: string | null;
  sourceAlias: string | null;
  destinationAlias: string | null;
  operationId: string | null;
  receiptNumber: string | null;
  receiptImage: string | null;
  transferredAt: string | null;
  orderCode: string;
  customerName: string;
  depositPct: number;
};

const KIND_LABEL = { DEPOSIT: "Seña", FULL: "Pago total", BALANCE: "Saldo en efectivo" } as const;

/**
 * Validación manual de un comprobante. No hay OCR ni conciliación
 * automática: mostramos lo esperado contra lo informado y decide una persona.
 */
export function ReceiptReview({ payment, backHref }: { payment: Receipt; backHref: string }) {
  const [notes, setNotes] = useState("");
  const reported = payment.reportedCents;
  const matches = reported !== null && reported === payment.expectedCents;

  return (
    <aside className="panel h-fit p-5 xl:sticky xl:top-24">
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 className="panel-title">Validar comprobante</h2>
        <Link href={backHref} className="text-ink-500 transition hover:text-ink-900" aria-label="Cerrar">
          <XCircle className="h-5 w-5" />
        </Link>
      </div>

      {/* Ficha de la transferencia declarada */}
      <div className="rounded-lg border border-ink-200 p-4">
        <p className="text-center text-xs font-medium text-ink-500">Comprobante de transferencia</p>

        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-ok-fg">
          <CheckCircle className="h-4 w-4" />
          {payment.transferredAt
            ? new Intl.DateTimeFormat("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "America/Argentina/Buenos_Aires",
              }).format(new Date(payment.transferredAt))
            : "Transferencia informada"}
        </p>

        <dl className="mt-4 space-y-2 text-xs">
          <Field label="Desde" value={payment.senderName ?? payment.customerName} />
          <Field label="CUIT/CUIL" value={payment.senderTaxId} />
          <Field label="Alias origen" value={payment.sourceAlias} />
          <Field label="Alias destino" value={payment.destinationAlias} />
          <Field
            label="Importe"
            value={reported !== null ? formatMoneyExact(reported) : null}
          />
          <Field
            label="Motivo"
            value={`${KIND_LABEL[payment.kind]} pedido #${payment.orderCode}`}
          />
          <Field label="ID de operación" value={payment.operationId} />
          <Field label="Número de comprobante" value={payment.receiptNumber} />
        </dl>

        {payment.receiptImage ? (
          <a href={payment.receiptImage} target="_blank" rel="noreferrer" className="mt-3 block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={payment.receiptImage}
              alt={`Comprobante del pedido ${payment.orderCode}`}
              className="w-full rounded-lg border border-ink-200"
            />
          </a>
        ) : (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-admin-bg px-3 py-2.5 text-xs text-ink-500">
            <Bank className="mt-px h-4 w-4 shrink-0" />
            El comprobante llegó por WhatsApp. Comparalo con el chat del cliente antes de aprobar.
          </p>
        )}
      </div>

      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-500">Pedido</dt>
          <dd>
            <Link
              href={`/admin/pedidos/${payment.orderCode}`}
              className="font-medium text-admin-blue hover:underline"
            >
              #{payment.orderCode}
            </Link>
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500">Cliente</dt>
          <dd className="font-medium text-ink-900">{payment.customerName}</dd>
        </div>
        <div className="flex justify-between border-t border-ink-200 pt-2.5">
          <dt className="text-ink-500">Importe esperado</dt>
          <dd className="font-medium text-ink-900">{formatMoney(payment.expectedCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500">Importe informado</dt>
          <dd className={`font-medium ${reported === null ? "text-ink-500" : matches ? "text-ok-fg" : "text-danger-fg"}`}>
            {reported === null ? "No informado" : formatMoney(reported)}
          </dd>
        </div>
      </dl>

      {reported !== null && !matches && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-xs text-danger-fg">
          <Alert className="mt-px h-4 w-4 shrink-0" />
          El importe informado no coincide con el esperado. Revisá antes de aprobar.
        </p>
      )}

      <label className="mt-4 block">
        <span className="admin-label">Nota interna (opcional)</span>
        <textarea
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Escribí una nota interna..."
          className="admin-field resize-y"
        />
      </label>

      <div className="mt-4 space-y-2.5">
        <form action={approvePayment}>
          <input type="hidden" name="id" value={payment.id} />
          <input type="hidden" name="reviewNotes" value={notes} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ok-fg px-4 py-2.5
                       text-sm font-medium text-white transition hover:opacity-90"
          >
            <CheckCircle className="h-4 w-4" />
            Aprobar pago
          </button>
        </form>

        <form action={rejectPayment}>
          <input type="hidden" name="id" value={payment.id} />
          <input type="hidden" name="reviewNotes" value={notes} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg border
                       border-danger-fg/40 px-4 py-2.5 text-sm font-medium text-danger-fg
                       transition hover:bg-danger-bg"
          >
            <XCircle className="h-4 w-4" />
            Rechazar
          </button>
        </form>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-lg bg-warn-bg px-3 py-2.5 text-xs text-warn-fg">
        <Alert className="mt-px h-4 w-4 shrink-0" />
        Al aprobar, el pedido pasa a Confirmado.
      </p>
    </aside>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right font-medium break-all text-ink-900">{value || "—"}</dd>
    </div>
  );
}
