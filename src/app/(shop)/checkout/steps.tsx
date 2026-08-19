import { Check } from "@/components/icons";

const STEPS = ["Datos y entrega", "Forma de pago", "Confirmación"] as const;

/** Indicador de los 3 pasos del checkout. `current` es 1, 2 o 3. */
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="mx-auto flex max-w-3xl items-center justify-center px-4 py-7">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;

        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex shrink-0 items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium ${
                  done || active
                    ? "border-navy bg-navy text-white"
                    : "border-navy/30 bg-white text-navy/50"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : step}
              </span>
              <span
                className={`hidden text-sm sm:inline ${
                  active ? "font-medium text-navy" : "text-ink-500"
                }`}
              >
                {label}
              </span>
            </div>
            {step < STEPS.length && <span className="mx-4 h-px flex-1 bg-navy/20" />}
          </li>
        );
      })}
    </ol>
  );
}
