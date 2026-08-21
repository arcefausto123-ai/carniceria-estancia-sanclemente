import { createClient } from "@supabase/supabase-js";

/**
 * Subida de imágenes a Supabase Storage.
 *
 * Se usa la service_role key, así que este módulo es **sólo de servidor**:
 * nunca importarlo desde un componente con "use client".
 *
 * Mientras no estén las variables de entorno, `storageEnabled` es false y el
 * panel cae de vuelta a pegar una URL a mano. Así el proyecto sigue andando
 * en local sin credenciales.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** Bucket público donde viven las fotos de la tienda. */
export const BUCKET = "tienda";

/** Carpetas dentro del bucket, una por tipo de imagen. */
export type ImageFolder = "productos" | "categorias" | "marca" | "comprobantes";

export const storageEnabled = Boolean(SUPABASE_URL && SERVICE_KEY);

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function admin() {
  if (!storageEnabled) {
    throw new Error(
      "Falta configurar Supabase Storage: definí NEXT_PUBLIC_SUPABASE_URL y " +
        "SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.",
    );
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function extensionFor(type: string): string {
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[
    type
  ] ?? "jpg";
}

/** Nombre de archivo único y sin acentos ni espacios. */
function buildPath(folder: ImageFolder, originalName: string, type: string): string {
  const base = originalName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "imagen";
  const unique = `${Date.now().toString(36)}${Math.round(Math.random() * 1e6).toString(36)}`;
  return `${folder}/${base}-${unique}.${extensionFor(type)}`;
}

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadImage(file: File, folder: ImageFolder): Promise<UploadResult> {
  if (!file || file.size === 0) return { ok: false, error: "No llegó ningún archivo." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `La imagen supera los ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` };
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { ok: false, error: "Formato no admitido. Usá JPG, PNG o WebP." };
  }

  const path = buildPath(folder, file.name, file.type);
  const client = admin();

  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      cacheControl: "31536000", // las imágenes nunca se pisan: nombre único
      upsert: false,
    });

  if (error) return { ok: false, error: `No se pudo subir la imagen: ${error.message}` };

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

/**
 * Borra una imagen a partir de su URL pública. Silencioso a propósito: si el
 * archivo ya no está, no tiene sentido romper la operación que lo motivó.
 */
export async function deleteImage(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl || !storageEnabled) return;

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return; // no es nuestro: puede ser una URL externa pegada a mano

  const path = decodeURIComponent(publicUrl.slice(index + marker.length));
  await admin().storage.from(BUCKET).remove([path]);
}
