/**
 * Genera el SQL que le avisa a Prisma qué migraciones ya están aplicadas,
 * para bases donde el esquema se cargó pegando los `.sql` a mano.
 *
 *     npx tsx scripts/export-baseline-sql.ts > prisma/baseline.sql
 *
 * Sin esto, `prisma migrate deploy` intentaría volver a crear tablas que ya
 * existen y fallaría con P3005. Hay que regenerarlo cada vez que se agrega
 * o cambia una migración.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

const DIR = "prisma/migrations";
const names = readdirSync(DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const rows = names.map((name) => {
  const sql = readFileSync(`${DIR}/${name}/migration.sql`);
  return { name, checksum: createHash("sha256").update(sql).digest("hex") };
});

console.log(`-- Marca como aplicadas las migraciones que ya corriste a mano.
-- Generado con: npx tsx scripts/export-baseline-sql.ts
--
-- Corré esto SÓLO si cargaste el esquema pegando los .sql en el editor de
-- Supabase. Si usaste \`npm run db:push\` o \`prisma migrate deploy\`, no hace
-- falta. Se puede correr más de una vez.

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
${rows
  .map(
    (row) => `
INSERT INTO "_prisma_migrations" (
    "id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count"
)
SELECT gen_random_uuid()::text, '${row.checksum}', now(), '${row.name}', now(), 1
WHERE NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '${row.name}'
);`,
  )
  .join("\n")}`);
