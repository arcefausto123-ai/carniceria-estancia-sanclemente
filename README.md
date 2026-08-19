# Estancia San Clemente — tienda online

Venta online para la carnicería Estancia San Clemente: catálogo, carrito con
reserva de stock, checkout con envío o retiro, pago por transferencia con
validación manual, y un panel administrativo completo.

## Decisiones del proyecto

| Tema | Decisión |
|---|---|
| Framework | **Next.js 16** (App Router) + TypeScript + Tailwind 4 |
| Base de datos | **PostgreSQL en Supabase**, accedida con Prisma |
| Fotos y comprobantes | **Supabase Storage** (hoy se cargan por URL) |
| Hosting | **Vercel** (la app) + **Supabase** (base y archivos) |
| Pagos | Transferencia + comprobante. **Validación 100% manual**, sin pasarela ni OCR |
| WhatsApp | **Semiautomático**: el panel arma el mensaje y lo abre con un clic |
| Autenticación | Sesión propia firmada con HMAC, contraseñas con `scrypt` |

### Cómo se modela el stock

Cada envase es una unidad individual con su **peso exacto** y su **precio
final** ya calculado. Un `Product` representa un envase concreto
("Entraña 0,850 kg — $12.750") y `stock` es cuántos envases equivalentes hay.
Cuando se vende, el stock baja solo.

### Dinero

Todos los importes se guardan como **enteros en centavos de ARS**. Nunca se
usa punto flotante. `$47.450` se almacena como `4745000`.

### Reserva de stock

El carrito vive en la base con un `expiresAt` que se corre en cada cambio.
Mientras no venza, sus unidades no se le ofrecen a otro cliente. El plazo
sale de `Settings.stockHoldMinutes` (hoy 10 minutos).

### Parámetros configurables

Nada de esto está hardcodeado — todo se edita desde **Configuración**:

- Porcentaje de seña para pago en efectivo (hoy 30 %)
- Pedido mínimo general y pedido mínimo por zona de envío
- Tiempo de reserva del stock (hoy 10 minutos)
- Habilitar/deshabilitar envío y retiro
- Ocultar automáticamente productos sin stock
- Datos bancarios (alias, titular, CUIT, CBU)
- Plantillas de los mensajes de WhatsApp

Cambiar el % de seña **sólo afecta a los pedidos nuevos**: cada pedido
congela el porcentaje con el que se calculó.

## Puesta en marcha

### 1. Base de datos

Creá un proyecto en [supabase.com](https://supabase.com) y copiá las cadenas
de conexión desde *Project Settings → Database*.

### 2. Variables de entorno

```bash
cp .env.example .env
```

Completá:

```bash
DATABASE_URL=   # conexión con pooling (puerto 6543), la usa la app
DIRECT_URL=     # conexión directa (puerto 5432), la usa Prisma
AUTH_SECRET=    # openssl rand -base64 32
ADMIN_EMAIL=    # usuario del panel
ADMIN_PASSWORD= # contraseña del panel (sólo la lee el seed)
```

### 3. Instalar, migrar y cargar datos

```bash
npm install
npm run db:push    # crea las tablas
npm run db:seed    # categorías, productos de ejemplo, zonas, franjas y admin
npm run dev        # http://localhost:3000
```

El panel queda en `/admin`.

## Despliegue en Vercel

1. Subí el repo a GitHub e importalo en Vercel.
2. Cargá las mismas variables de entorno en *Settings → Environment Variables*.
3. Vercel corre `npm run build`, que ya incluye `prisma generate`.
4. La primera vez, aplicá el esquema contra la base de producción:
   `npx prisma db push` (con `DIRECT_URL` apuntando a producción).

Costos aproximados: gratis para probar; alrededor de USD 45/mes con
Vercel Pro + Supabase Pro cuando salga a vender en serio.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (incluye `prisma generate`) |
| `npm run start` | Servidor de producción |
| `npm run db:push` | Aplica el esquema a la base |
| `npm run db:seed` | Carga los datos iniciales |
| `npm run db:studio` | Prisma Studio para mirar/editar datos a mano |

## Mapa del código

```
prisma/
  schema.prisma            modelo de datos completo
  seed.ts                  datos iniciales
src/
  lib/
    prisma.ts              cliente de Prisma
    format.ts              plata, pesos, fechas (todo en huso argentino)
    pricing.ts             cálculo de seña y saldo
    settings.ts            fila única de configuración
    cart.ts                carrito y reserva de stock
    auth.ts                sesión del panel (HMAC + scrypt)
    orders.ts              estados y numeración de pedidos
    whatsapp.ts            armado de mensajes y links wa.me
    csv.ts                 exportación e importación
  components/              logo, íconos y piezas compartidas del panel
  app/
    (shop)/                las 5 pantallas del cliente
      page.tsx             1. catálogo
      carrito/             2. carrito
      checkout/datos/      3. datos y entrega
      checkout/pago/       4. forma de pago
      pedido/[code]/       5. confirmación y seguimiento
      actions.ts           acciones de carrito y checkout
    admin/                 las 9 secciones del panel
      page.tsx             resumen
      productos/           productos, stock e importación
      categorias/          categorías reordenables
      pedidos/             listado, detalle, impresión y exportación
      envios/              ruta del día, zonas, franjas, hoja de ruta
      pagos/               validación manual de comprobantes
      clientes/            fichas y exportación
      configuracion/       reglas del negocio
      actions.ts           acciones del panel
```

## Qué falta / próximos pasos

- **Subida de imágenes**: hoy las fotos se cargan pegando una URL. El paso
  siguiente es conectar Supabase Storage para subir el archivo desde el panel.
- **WhatsApp automático**: la capa de mensajes ya está desacoplada
  (`src/lib/whatsapp.ts`). Conectar la Cloud API de Meta no requiere tocar
  las pantallas.
- **Recordatorio de saldo**: avisar automáticamente antes del retiro.
