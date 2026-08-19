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

## Mobile

La tienda del cliente es **mobile-first**: es el uso principal. El panel
administrativo es de escritorio y no hace falta optimizarlo para celular.

Al tocar la tienda, respetá esto:

- Los campos de texto van en **16px como mínimo** en celular (`.field` ya usa
  `text-base sm:text-sm`). Por debajo de 16px, Safari de iOS hace zoom solo al
  enfocar el campo.
- Nada puede desbordar a lo ancho. Si una fila no entra, partila con
  `flex-wrap` y un bloque `w-full sm:w-auto`, como hace el carrito.
- Los botones y enlaces tocables necesitan ~44px de alto. Para enlaces de
  texto sueltos, `-m-2 p-2` agranda el área sin mover el diseño.
- Los radios van dentro de `<label>` que envuelve toda la tarjeta: el dedo
  toca la tarjeta, no el círculo de 20px.

## Convenciones

- Server Components por defecto; `"use client"` sólo donde hay interacción.
- Mutaciones con Server Actions (`actions.ts`), nunca con route handlers,
  salvo descargas (CSV).
- Toda acción del panel arranca con `requireAdmin()`.
- La interfaz está **en español rioplatense** (voseo): "Elegí", "Cargá",
  "Guardá". Los identificadores del código, en inglés.
- Estilos con las clases de `globals.css` (`btn-navy`, `panel`, `admin-field`,
  `badge`, `th`, `td`). No repitas cadenas largas de utilidades.

## Logo

El logo oficial es **blanco sobre fondo transparente**: sólo se lee sobre
fondo oscuro. Todo lugar donde se renderice `<Logo>` tiene que darle un fondo
navy. Ojo con la barra superior del panel, que es blanca: ahí el logo lleva su
propia pastilla navy.

La bajada de la marca es **"SABEMOS DE CARNE"**.

Si hace falta el logo sobre crema o blanco, se pide una variante en tinta
oscura del archivo. Un filtro CSS no alcanza.

Archivos, todos derivados de `public/logo-original.png`:

| Archivo | Uso |
|---|---|
| `public/logo-original.png` | Lo que entregó el cliente. No se toca. |
| `public/logo.png` | Recortado al contenido. Es el que usa `<Logo>`. |
| `src/app/favicon.ico` | Pestaña: 16/32/48 px. |
| `src/app/icon.png` | 512 px. |
| `src/app/apple-icon.png` | 180 px, pantalla de inicio de iOS. |

Se regeneran con `python3 scripts/generate-icons.py` (necesita `pillow`).
Los tamaños chicos **no** usan el lettering: a 16 px queda ilegible, así que
llevan una "E" con los dos puntos de la marca. El de iOS sí lo usa entero.

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
