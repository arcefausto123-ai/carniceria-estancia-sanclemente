-- Marca la migración "0_init" como ya aplicada.
-- Generado con: npx tsx scripts/export-baseline-sql.ts
--
-- Corré esto SÓLO si cargaste el esquema pegando migration.sql en el editor
-- de Supabase. Si usaste `npm run db:push` o `prisma migrate deploy`, no
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
SELECT gen_random_uuid()::text, '0a420b3625f79d428c21cbb0fe4c07e75a0e907f79b7769e54708e9cda8295a5', now(), '0_init', now(), 1
WHERE NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '0_init'
);
