import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/format";
import { Cart, Truck, Bank, CheckCircle } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function HowToBuyPage() {
  const settings = await getSettings();

  const steps = [
    {
      icon: <Cart className="h-7 w-7" />,
      title: "Elegí tus cortes",
      body: `Cada envase se publica con su peso y precio exactos. El pedido mínimo es de ${formatMoney(settings.minOrderCents)} y el stock queda reservado ${settings.stockHoldMinutes} minutos mientras completás la compra.`,
    },
    {
      icon: <Truck className="h-7 w-7" />,
      title: "Envío o retiro",
      body: "Elegí que te lo llevemos refrigerado a tu domicilio o retirar en el local en la franja horaria que te quede mejor.",
    },
    {
      icon: <Bank className="h-7 w-7" />,
      title: "Pagá por transferencia",
      body: `Si pagás en efectivo al retirar, transferís una seña del ${settings.depositPct}% para reservar y abonás el saldo al retirar. Si preferís, transferís el total por adelantado.`,
    },
    {
      icon: <CheckCircle className="h-7 w-7" />,
      title: "Enviá el comprobante",
      body: "Mandanos el comprobante por WhatsApp. Lo revisamos a mano y te confirmamos la reserva por el mismo medio.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="rule-gold font-serif text-4xl text-navy sm:text-[2.8rem]">Cómo comprar</h1>

      <ol className="mt-9 space-y-5">
        {steps.map((step, index) => (
          <li key={step.title} className="shop-card flex gap-5 p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream-200 text-navy">
              {step.icon}
            </span>
            <div>
              <h2 className="font-serif text-xl text-navy">
                {index + 1}. {step.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <Link href="/" className="btn-navy mt-9">
        Ver el catálogo
      </Link>
    </div>
  );
}
