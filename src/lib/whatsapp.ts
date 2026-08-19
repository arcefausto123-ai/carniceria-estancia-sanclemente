/**
 * WhatsApp semiautomático: el sistema arma el texto ya escrito y abre
 * wa.me para que una persona lo envíe desde el número del negocio.
 *
 * La capa está desacoplada a propósito: el día que se conecte la Cloud API
 * de Meta sólo hay que cambiar `sendMessage`, no las pantallas.
 */

/** Deja el teléfono como lo espera wa.me: sólo dígitos, con país. */
export function normalizePhone(raw: string, defaultCountry = "54"): string {
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!digits.startsWith(defaultCountry)) {
    digits = digits.replace(/^0+/, "");
    // Argentina: los celulares llevan un 9 después del código de país.
    if (!digits.startsWith("9")) digits = "9" + digits;
    digits = defaultCountry + digits;
  }
  return digits;
}

export function whatsappLink(phone: string, message?: string): string {
  const to = normalizePhone(phone);
  const base = to ? `https://wa.me/${to}` : "https://wa.me/";
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export type MessageVars = {
  cliente: string;
  pedido: string;
  total: string;
  sena?: string;
  saldo?: string;
  alias?: string;
  entrega?: string;
  negocio: string;
};

/** Reemplaza {cliente}, {pedido}, {total}... en las plantillas de Settings. */
export function renderTemplate(template: string, vars: MessageVars): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = (vars as Record<string, string | undefined>)[key];
    return value ?? match;
  });
}

export const DEFAULT_TEMPLATES = {
  newOrder:
    "¡Hola {cliente}! Recibimos tu pedido {pedido} por {total}. " +
    "Estamos validando tu comprobante y te confirmamos en breve. ¡Gracias! — {negocio}",
  paymentOk:
    "¡Hola {cliente}! Confirmamos el pago de tu pedido {pedido}. " +
    "Ya lo estamos preparando. — {negocio}",
  ready:
    "¡Hola {cliente}! Tu pedido {pedido} ya está listo. {entrega} — {negocio}",
} as const;

/** Texto que el cliente envía junto con el comprobante de transferencia. */
export function receiptMessage(opts: {
  orderCode: string;
  customerName: string;
  amount: string;
  concept: string;
  alias: string;
}): string {
  return (
    `Hola! Soy ${opts.customerName}. Te envío el comprobante de ${opts.concept} ` +
    `por ${opts.amount} correspondiente al pedido ${opts.orderCode}. ` +
    `Transferí al alias ${opts.alias}.`
  );
}
