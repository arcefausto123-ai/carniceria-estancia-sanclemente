import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { importProducts } from "./actions";
import { ArrowLeft, Upload, Info, CheckCircle, Alert } from "@/components/icons";

export const dynamic = "force-dynamic";

const EXAMPLE = `nombre;codigo;categoria;peso_kg;precio;stock;publicado
Entraña;ENT-0850;Vacunos;0,850;12750;1;si
Vacío;VAC-1320;Vacunos;1,320;19800;1;si
Bondiola;BON-1450;Cerdo;1,450;16500;2;no`;

type SearchParams = Promise<{ creados?: string; actualizados?: string; errores?: string }>;

export default async function ImportProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { position: "asc" } });
  const errors = params.errores ? decodeURIComponent(params.errores).split("||") : [];
  const done = params.creados !== undefined || params.actualizados !== undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/productos"
        className="mb-4 inline-flex items-center gap-2 text-sm text-admin-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a productos
      </Link>

      <PageHeader
        title="Importar planilla"
        subtitle="Cargá muchos envases de una vez desde un archivo CSV"
      />

      {done && (
        <p className="mb-5 flex items-start gap-2 rounded-lg bg-ok-bg px-4 py-3 text-sm text-ok-fg">
          <CheckCircle className="mt-px h-4 w-4 shrink-0" />
          Importación terminada: {params.creados ?? 0} productos creados y{" "}
          {params.actualizados ?? 0} actualizados.
        </p>
      )}

      {errors.length > 0 && (
        <div className="mb-5 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger-fg">
          <p className="flex items-center gap-2 font-medium">
            <Alert className="h-4 w-4" />
            Estas filas no se pudieron importar:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="panel p-6">
        <h2 className="panel-title">Formato esperado</h2>
        <p className="mt-2 text-sm text-ink-700">
          Una fila por envase, separada por punto y coma. La primera fila son los encabezados.
          Si el <strong>código</strong> ya existe, se actualiza ese producto en vez de duplicarlo.
        </p>

        <pre className="mt-4 overflow-x-auto rounded-lg bg-admin-bg p-4 text-xs text-ink-700">
          {EXAMPLE}
        </pre>

        <dl className="mt-4 space-y-1.5 text-xs text-ink-500">
          <Def term="nombre">Obligatorio. Nombre del corte.</Def>
          <Def term="codigo">Opcional pero recomendado: es la clave para actualizar.</Def>
          <Def term="categoria">
            Debe coincidir con una existente: {categories.map((c) => c.name).join(", ") || "—"}.
          </Def>
          <Def term="peso_kg">Peso exacto del envase, con coma decimal (1,250).</Def>
          <Def term="precio">Precio final del envase en pesos.</Def>
          <Def term="stock">Cantidad de envases disponibles. Por defecto 1.</Def>
          <Def term="publicado">si / no. Por defecto no (queda como borrador).</Def>
        </dl>

        <form action={importProducts} className="mt-6">
          <label className="block">
            <span className="admin-label">Pegá acá el contenido del CSV</span>
            <textarea
              name="csv"
              required
              rows={10}
              placeholder={EXAMPLE}
              className="admin-field resize-y font-mono text-xs"
            />
          </label>

          <p className="mt-3 flex items-start gap-2 rounded-lg bg-info-bg px-3 py-2.5 text-xs text-info-fg">
            <Info className="mt-px h-4 w-4 shrink-0" />
            Exportá tu planilla desde Excel o Google Sheets como CSV y pegá el contenido acá.
          </p>

          <button type="submit" className="btn-primary mt-4">
            <Upload className="h-4 w-4" />
            Importar productos
          </button>
        </form>
      </section>
    </div>
  );
}

function Def({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-mono font-medium text-ink-700">{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}
