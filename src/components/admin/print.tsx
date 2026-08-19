"use client";

import { Printer } from "@/components/icons";

/** Dispara el diálogo de impresión del navegador. */
export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary print:hidden">
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
