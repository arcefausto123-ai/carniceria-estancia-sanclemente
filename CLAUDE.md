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

## Imágenes

Las fotos van a Supabase Storage, bucket `tienda`, en carpetas por tipo
(`productos/`, `categorias/`, `marca/`). Toda la lógica está en
`src/lib/storage.ts`, que es **sólo de servidor**: usa la `service_role` key,
así que nunca se importa desde un componente con `"use client"`.

- El campo de carga es `<ImageField>`. Redimensiona en el navegador a 1600 px
  antes de subir: una foto de celular pesa 5-8 MB y así viajan ~300 KB.
- Si faltan las variables de Supabase, `storageEnabled` es false y el panel
  cae a pedir la URL a mano. El proyecto tiene que seguir andando sin
  credenciales.
- Al reemplazar o borrar una imagen se borra la anterior del bucket. Un
  producto ya vendido se archiva en vez de borrarse, y **conserva su foto**,
  porque sigue apareciendo en los pedidos viejos.
- `deleteImage` ignora las URL que no son del bucket, así que una imagen
  externa pegada a mano nunca se intenta borrar.

## Puesta en marcha de la base

El esquema y los datos iniciales se pueden aplicar de dos maneras:

- Con Node: `npm run db:push && npm run db:seed`.
- Sin Node, pegando SQL en el editor de Supabase, en este orden:
  `prisma/migrations/0_init/migration.sql`, `prisma/supabase-seed.sql`,
  `prisma/migrations/1_seguridad/migration.sql` y `prisma/baseline.sql`.
  Todos menos `0_init` se pueden correr más de una vez; ése crea las tablas
  y hay que correrlo una sola vez sobre una base vacía.

El tercero no es opcional: le registra a Prisma que la migración inicial ya
está aplicada. Sin él, `prisma migrate deploy` falla con `P3005` al encontrar
tablas que existen sin registro de haberlas creado. Se regenera con
`npx tsx scripts/export-baseline-sql.ts` cada vez que cambie la migración.

El deploy en Vercel corre `vercel-build`, que aplica las migraciones
pendientes antes de compilar. El `build` común no las toca, así que sigue
andando sin conexión a la base. El detalle completo está en `DEPLOY.md`.

Los datos iniciales viven en `prisma/seed-data.ts` y los consumen tanto el
seed como el exportador de SQL, así que **no los edites en el `.sql`**:
cambiá el módulo y regenerá con `npx tsx scripts/export-seed-sql.ts`.

La primera cuenta del panel **no** viene en el seed. La primera vez que se
entra a `/admin`, la pantalla de login ofrece crearla; en cuanto existe una,
esa puerta se cierra sola. Después se cambia desde Configuración → Usuarios.

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # build (corre prisma generate)
npm run db:push    # aplica el esquema
npm run db:seed    # datos iniciales
npm run storage:setup   # crea el bucket de imágenes en Supabase
npx tsc --noEmit   # chequeo de tipos
```
