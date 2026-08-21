/**
 * Genera el SQL que le avisa a Prisma que la migración inicial ya está
 * aplicada, para bases donde el esquema se cargó pegando el `.sql` a mano.
 *
 *     npx tsx scripts/export-baseline-sql.ts > prisma/baseline.sql
 *
 * Sin esto, el primer `prisma migrate deploy` intentaría volver a crear
 * tablas que ya existen y fallaría. Hay que regenerarlo si alguna vez
 * cambia `prisma/migrations/0_init/migration.sql`.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const NAME = "0_init";
const sql = readFileSync(`prisma/migrations/${NAME}/migration.sql`);
const checksum = createHash("sha256").update(sql).digest("hex");

console.log(`-- Marca la migración "${NAME}" como ya aplicada.
-- Generado con: npx tsx scripts/export-baseline-sql.ts
--
-- Corré esto SÓLO si cargaste el esquema pegando migration.sql en el editor
-- de Supabase. Si usaste \`npm run db:push\` o \`prisma migrate deploy\`, no
-- hace falta. Se puede correr más de una vez.

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum"              VARCHAR(64) NOT NULL,
    "finished_at"           TIMESTAMPTZ,
    "migration_name"        VARCHAR(255) NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        TIMESTAMPTZ,
    "started_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count"   INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "_prisma_migrations" (
    "id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count"
)
SELECT gen_random_uuid()::text, '${checksum}', now(), '${NAME}', now(), 1
WHERE NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '${NAME}'
);`);
