# Estancia San Clemente

E-commerce de carnicería: tienda pública + panel administrativo.
Next.js 16 (App Router) · TypeScript · Tailwind 4 · Prisma · PostgreSQL (Supabase).

## Reglas que no se negocian

- **Plata en centavos.** Todos los importes son `Int` en centavos de ARS.
  Nunca uses float. Formateá sólo con `formatMoney` / `formatMoneyExact`.
- **Pesos en gramos.** `weightGrams: Int`. Formateá con `formatWeight`.
- **Nada hardcodeado.** El % de seña, el pedido mínimo y el tiempo de reserva
  salen siempre de `getSettings()`. Si aparece un número mágico, está mal.
- **Fechas en huso argentino.** Usá `startOfDay()` de `src/lib/format.ts`, que
  corta el día en hora de Buenos Aires. El servidor corre en UTC.
- **La validación de pagos es manual.** No agregues OCR ni conciliación
  automática: alguien aprueba desde `/admin/pagos`.
- **WhatsApp es semiautomático.** El panel arma el texto y abre `wa.me`.
  Toda la lógica vive en `src/lib/whatsapp.ts`.

## Convenciones

- Server Components por defecto; `"use client"` sólo donde hay interacción.
- Mutaciones con Server Actions (`actions.ts`), nunca con route handlers,
  salvo descargas (CSV).
- Toda acción del panel arranca con `requireAdmin()`.
- La interfaz está **en español rioplatense** (voseo): "Elegí", "Cargá",
  "Guardá". Los identificadores del código, en inglés.
- Estilos con las clases de `globals.css` (`btn-navy`, `panel`, `admin-field`,
  `badge`, `th`, `td`). No repitas cadenas largas de utilidades.

## Paleta

- Tienda: azul marino `--color-navy` (#0f2b4c), crema `--color-cream-*`,
  dorado `--color-gold-*`. Títulos en serif.
- Panel: azul de trabajo `--color-admin-blue` (#1668c8) sobre `--color-admin-bg`.

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # build (corre prisma generate)
npm run db:push    # aplica el esquema
npm run db:seed    # datos iniciales
npx tsc --noEmit   # chequeo de tipos
```
