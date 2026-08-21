/**
 * Crea el bucket de imágenes en Supabase Storage si todavía no existe.
 *
 *     npm run storage:setup
 *
 * Es idempotente: se puede correr las veces que haga falta. Necesita
 * NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el .env.
 */
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && existsSync(".env")) {
  process.loadEnvFile(".env");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "tienda";

if (!URL || !KEY) {
  console.error(
    "Faltan credenciales.\n" +
      "Definí NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env\n" +
      "(Supabase → Project Settings → API).",
  );
  process.exit(1);
}

const supabase = createClient(URL, KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: buckets, error: listError } = await supabase.storage.listBuckets();
if (listError) {
  console.error("No se pudo consultar Storage:", listError.message);
  process.exit(1);
}

if (buckets.some((bucket) => bucket.name === BUCKET)) {
  console.log(`✓ El bucket "${BUCKET}" ya existe.`);
} else {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    // Público: las fotos de los productos las tiene que ver cualquiera que
    // entre a la tienda, sin login.
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  });
  if (error) {
    console.error("No se pudo crear el bucket:", error.message);
    process.exit(1);
  }
  console.log(`✓ Bucket "${BUCKET}" creado (público, máx. 5 MB por archivo).`);
}

console.log("\nCarpetas que usa la app dentro del bucket:");
for (const folder of ["productos", "categorias", "marca", "comprobantes"]) {
  console.log(`  ${BUCKET}/${folder}/`);
}
console.log("\nSe crean solas con la primera subida.");
