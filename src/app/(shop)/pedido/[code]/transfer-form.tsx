"use client";

import { useState } from "react";
import { reportTransfer } from "../../actions";
import { Bank, Info, CheckCircle } from "@/components/icons";

/**
 * Formulario opcional para que el cliente informe los datos de su
 * transferencia. Acelera la validación manual: el panel muestra el importe
 * esperado contra el informado y los datos de la operación.
 */
export function TransferForm({
  code,
  token,
  paymentId,
  concept,
  expected,
  reported,
}: {
  code: string;
  token: string;
  paymentId: string;
  concept: string;
  expected: string;
  reported: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (reported) {
    return (
      <p className="mt-5 flex items-center gap-2 rounded-md bg-cream-200/70 px-5 py-4 text-sm text-ink-700">
        <CheckCircle className="h-5 w-5 shrink-0 text-navy" />
        Ya recibimos los datos de tu transferencia. Estamos validándola.
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-outline-navy mt-5 w-full">
        <Bank className="h-5 w-5" />
        Informar los datos de mi transferencia
      </button>
    );
  }

  return (
    <form action={reportTransfer} className="shop-card mt-5 p-6">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="paymentId" value={paymentId} />

      <h2 className="font-serif text-xl text-navy">Datos de tu transferencia</h2>
      <p className="mt-1 text-sm text-ink-500">
        Es opcional, pero nos ayuda a confirmarte más rápido. Concepto: {concept} por {expected}.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">Importe transferido</span>
          <input name="amount" inputMode="decimal" placeholder="Ej: 20805" className="field" />
        </label>
        <label>
          <span className="field-label">Titular de la cuenta</span>
          <input name="senderName" placeholder="Como figura en tu banco" className="field" />
        </label>
        <label>
          <span className="field-label">CUIT / CUIL</span>
          <input name="senderTaxId" placeholder="27-12345678-9" className="field" />
        </label>
        <label>
          <span className="field-label">Alias de origen</span>
          <input name="sourceAlias" placeholder="MI.ALIAS" className="field" />
        </label>
        <label>
          <span className="field-label">ID de operación</span>
          <input name="operationId" className="field" />
        </label>
        <label>
          <span className="field-label">Número de comprobante</span>
          <input name="receiptNumber" className="field" />
        </label>
        <label className="sm:col-span-2">
          <span className="field-label">Link a la imagen del comprobante (opcional)</span>
          <input name="receiptImage" type="url" placeholder="https://…" className="field" />
        </label>
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs text-ink-500">
        <Info className="mt-px h-4 w-4 shrink-0" />
        Igual necesitamos que nos mandes la imagen del comprobante por WhatsApp.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" className="btn-navy flex-1">
          Enviar datos
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline-navy">
          Cancelar
        </button>
      </div>
    </form>
  );
}
