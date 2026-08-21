# Puesta en producción

Guía para dejar Estancia San Clemente andando en Vercel + Supabase.
Los pasos 1 a 3 se hacen una sola vez.

## 1. Base de datos (Supabase)

Con Node instalado, alcanza con:

```bash
npm run db:push && npm run db:seed
```

Sin Node, se pega SQL en el **SQL Editor** de Supabase, en este orden:

| Orden | Archivo | Qué hace |
|---|---|---|
| 1 | `prisma/migrations/0_init/migration.sql` | Crea las 15 tablas y los 7 enums. |
| 2 | `prisma/supabase-seed.sql` | Carga categorías, productos, zonas, franjas y configuración. |
| 3 | `prisma/baseline.sql` | Le avisa a Prisma que la migración ya está aplicada. |

**El paso 3 no es opcional si usaste el editor SQL.** Sin él, el primer
`prisma migrate deploy` falla con `P3005` porque encuentra tablas que ya
existen y no tiene registro de haberlas creado.

Los tres se pueden correr más de una vez sin romper nada.

Para verificar:

```sql
SELECT (SELECT count(*) FROM "Category")     AS categorias,   --  5
       (SELECT count(*) FROM "Product")      AS productos,    -- 13
       (SELECT count(*) FROM "ShippingZone") AS zonas,        --  3
       (SELECT count(*) FROM "TimeSlot")     AS franjas,      --  6
       (SELECT count(*) FROM "Settings")     AS config;       --  1
```

## 2. Imágenes (Supabase Storage)

Con Node: `npm run storage:setup`.

A mano, en **Storage → New bucket**:

| Campo | Valor |
|---|---|
| Name | `tienda` (exacto: es el que busca el código) |
| Public bucket | Sí |
| File size limit | 5 MB |
| Allowed MIME types | `image/jpeg, image/png, image/webp, image/avif` |

Tiene que ser público: las fotos las ve cualquiera que entre a la tienda,
sin iniciar sesión.

## 3. Vercel

Importá el repositorio. Framework: **Next.js** (lo detecta solo).

Vercel usa el script `vercel-build`, que corre `prisma migrate deploy` antes
de compilar. Así, cada cambio de esquema se aplica solo al desplegar.

Variables de entorno (**Settings → Environment Variables**), las cinco en
Production y Preview:

| Variable | De dónde sale |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → Transaction pooler (**6543**) |
| `DIRECT_URL` | Supabase → Settings → Database → Direct connection (**5432**) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` |
| `AUTH_SECRET` | Generala: `openssl rand -base64 32` |

`DATABASE_URL` tiene que terminar en `?pgbouncer=true`. Es lo que le dice a
Prisma que está hablando con un pooler en modo transacción y que no use
sentencias preparadas.

La `service_role` key saltea todas las reglas de seguridad de Supabase.
Va sólo acá, como variable de entorno del servidor. Nunca en el repositorio
ni en código que llegue al navegador.

## 4. Primer ingreso

Entrá a `/admin`. Como todavía no hay ninguna cuenta, la pantalla ofrece
crear la primera: nombre, correo y contraseña. En cuanto existe una, esa
puerta se cierra sola y pasa a ser el login normal.

Después se cambia desde **Configuración → Usuarios**.

## 5. Qué revisar apenas esté arriba

- Cargar un producto con foto, para confirmar que la subida al bucket anda.
- Hacer una compra de prueba de punta a punta y validar el comprobante desde
  el panel.
- Ajustar en **Configuración** los datos reales del negocio: WhatsApp,
  dirección, alias bancario y el porcentaje de seña.
- Reemplazar los 13 productos de ejemplo por el catálogo real.
