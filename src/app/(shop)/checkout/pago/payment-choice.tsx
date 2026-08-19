"use client";

import { useState } from "react";
import { Money, Bank, Info, Whatsapp } from "@/components/icons";
import { whatsappLink, receiptMessage } from "@/lib/whatsapp";

/**
 * Las dos formas de pago. Ambas terminan en una transferencia + comprobante
 * por WhatsApp: no hay pasarela automática, la validación es manual.
 */
export function PaymentChoice({
  total,
  depositPct,
  deposit,
  balance,
  alias,
  holder,
  whatsapp,
  customerName,
  pickupOnly,
}: {
  total: string;
  depositPct: number;
  deposit: string;
  balance: string;
  alias: string;
  holder: string;
  whatsapp: string;
  customerName: string;
  pickupOnly: boolean;
}) {
  const [method, setMethod] = useState<"CASH_ON_PICKUP" | "BANK_TRANSFER">(
    pickupOnly ? "CASH_ON_PICKUP" : "BANK_TRANSFER",
  );

  const receiptFor = (concept: string, amount: string) =>
    whatsappLink(
      whatsapp,
      receiptMessage({
        orderCode: "(a confirmar)",
        customerName,
        amount,
        concept,
        alias: alias || "el alias del negocio",
      }),
    );

  return (
    <div className="mt-7 space-y-4">
      {/* Efectivo al retirar — requiere seña */}
      <label
        className={`block cursor-pointer rounded-lg border-2 p-6 transition ${
          method === "CASH_ON_PICKUP" ? "border-navy bg-white" : "border-navy/15 bg-white hover:border-navy/40"
        } ${!pickupOnly ? "opacity-100" : ""}`}
      >
        <div className="flex items-start gap-4">
          <input
            type="radio"
            name="paymentMethod"
            value="CASH_ON_PICKUP"
            checked={method === "CASH_ON_PICKUP"}
            onChange={() => setMethod("CASH_ON_PICKUP")}
            className="mt-0.5 h-5 w-5 shrink-0 accent-navy"
          />
          <Money className="mt-0.5 h-7 w-7 shrink-0 text-navy" />
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-xl text-navy">Efectivo al retirar</h2>
            <p className="mt-1 text-sm text-ink-700">
              Para confirmar la reserva, aboná una seña del {depositPct}%.
            </p>

            {method === "CASH_ON_PICKUP" && (
              <>
                <dl className="mt-4 space-y-3 rounded-md bg-cream-200/70 px-5 py-4 text-sm">
                  <Row label="Total del pedido" value={total} />
                  <Row label={`Seña para confirmar (${depositPct}%)`} value={deposit} />
                  <Row label="Saldo al retirar" value={balance} last />
                </dl>

                <p className="mt-4 text-sm text-ink-700">
                  Transferí la seña al alias{" "}
                  <strong className="font-semibold text-navy">{alias || "—"}</strong>
                  {holder && <span className="text-ink-500"> ({holder})</span>}
                  <br />y envianos el comprobante por WhatsApp.
                </p>

                <a
                  href={receiptFor(`la seña del ${depositPct}%`, deposit)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline-navy mt-4 w-full"
                >
                  <Whatsapp className="h-5 w-5 text-[#25D366]" />
                  Enviar comprobante
                </a>
              </>
            )}
          </div>
        </div>
      </label>

      {/* Transferencia bancaria — 100% por adelantado */}
      <label
        className={`block cursor-pointer rounded-lg border-2 p-6 transition ${
          method === "BANK_TRANSFER" ? "border-navy bg-white" : "border-navy/15 bg-white hover:border-navy/40"
        }`}
      >
        <div className="flex items-start gap-4">
          <input
            type="radio"
            name="paymentMethod"
            value="BANK_TRANSFER"
            checked={method === "BANK_TRANSFER"}
            onChange={() => setMethod("BANK_TRANSFER")}
            className="mt-0.5 h-5 w-5 shrink-0 accent-navy"
          />
          <Bank className="mt-0.5 h-7 w-7 shrink-0 text-navy" />
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-xl text-navy">Transferencia bancaria</h2>
            <p className="mt-1 text-sm text-ink-700">
              Pagá el total por adelantado y enviá el comprobante por WhatsApp.
            </p>

            <p className="mt-4 flex items-start gap-2 rounded-md border border-navy/10 bg-cream-50 px-4 py-3 text-sm text-ink-700">
              <Info className="mt-px h-4 w-4 shrink-0 text-navy/60" />
              La reserva se confirma una vez validado el comprobante.
            </p>

            {method === "BANK_TRANSFER" && (
              <>
                <dl className="mt-4 space-y-3 rounded-md bg-cream-200/70 px-5 py-4 text-sm">
                  <Row label="Total a transferir" value={total} last />
                </dl>
                <p className="mt-4 text-sm text-ink-700">
                  Transferí a{" "}
                  <strong className="font-semibold text-navy">{alias || "—"}</strong>
                  {holder && <span className="text-ink-500"> ({holder})</span>}.
                </p>
                <a
                  href={receiptFor("el pago total", total)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline-navy mt-4 w-full"
                >
                  <Whatsapp className="h-5 w-5 text-[#25D366]" />
                  Enviar comprobante
                </a>
              </>
            )}
          </div>
        </div>
      </label>
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        last ? "" : "border-b border-dashed border-navy/20 pb-3"
      }`}
    >
      <dt className="text-ink-700">{label}</dt>
      <dd className="font-semibold text-navy">{value}</dd>
    </div>
  );
}
