-- Refuerzos de seguridad.
--
-- `publicToken` autoriza a ver un pedido sin iniciar sesión. Los códigos
-- (ESC-1048, ESC-1049…) son correlativos y por lo tanto adivinables: sin
-- este token, cualquiera podía recorrerlos y leer nombre, teléfono,
-- dirección y datos de pago de todos los clientes.
--
-- Se agrega en cuatro pasos para no cortar el servicio. Prisma genera el
-- token del lado del cliente, así que la versión anterior de la aplicación
-- no lo enviaría al insertar: por eso la columna lleva además un valor por
-- defecto en la base, y así las dos versiones del código funcionan mientras
-- dure el despliegue.

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "publicToken" TEXT;

-- gen_random_uuid() viene con Postgres desde la 13; gen_random_bytes
-- necesitaría la extensión pgcrypto, que no está en todas las instalaciones.
ALTER TABLE "Order"
  ALTER COLUMN "publicToken"
  SET DEFAULT replace(gen_random_uuid()::text, '-', '')
           || replace(gen_random_uuid()::text, '-', '');

UPDATE "Order"
   SET "publicToken" = replace(gen_random_uuid()::text, '-', '')
                    || replace(gen_random_uuid()::text, '-', '')
 WHERE "publicToken" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "publicToken" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_publicToken_key" ON "Order"("publicToken");

-- `sessionVersion` sube al cambiar la contraseña, para cortar las sesiones
-- que hubieran quedado abiertas en otro navegador.
-- `failedLogins` y `lockedUntil` frenan la fuerza bruta contra el login.
ALTER TABLE "AdminUser"
  ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "failedLogins"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockedUntil"    TIMESTAMP(3);
