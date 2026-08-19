/**
 * Reglas de plata del negocio. Todo en centavos, todo con enteros.
 * El % de seña llega siempre desde Settings, nunca hardcodeado.
 */

export type PaymentBreakdown = {
  totalCents: number;
  depositPct: number;
  depositCents: number;
  balanceCents: number;
};

/**
 * Seña para pago en efectivo al retirar.
 * Redondeamos la seña hacia arriba al peso y el saldo es el resto exacto,
 * así seña + saldo === total siempre, sin centavos perdidos.
 */
export function calculateDeposit(totalCents: number, depositPct: number): PaymentBreakdown {
  const pct = clampPct(depositPct);
  const raw = (totalCents * pct) / 100;
  const depositCents = Math.min(totalCents, Math.ceil(raw / 100) * 100);
  return {
    totalCents,
    depositPct: pct,
    depositCents,
    balanceCents: totalCents - depositCents,
  };
}

/** Transferencia bancaria: se paga el 100% por adelantado. */
export function calculateFullPayment(totalCents: number): PaymentBreakdown {
  return { totalCents, depositPct: 100, depositCents: totalCents, balanceCents: 0 };
}

function clampPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.min(100, Math.max(0, Math.round(pct)));
}
