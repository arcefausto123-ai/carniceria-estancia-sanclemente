"use server";

import { getSession } from "@/lib/auth";
import { uploadImage, deleteImage, storageEnabled, type ImageFolder } from "@/lib/storage";

const FOLDERS: ImageFolder[] = ["productos", "categorias", "marca", "comprobantes"];

export type UploadState =
  | { status: "idle" }
  | { status: "ok"; url: string }
  | { status: "error"; message: string };

/**
 * Sube una imagen y devuelve su URL pública. La llama `ImageField` apenas el
 * usuario elige el archivo, así ve la foto antes de guardar el formulario.
 */
export async function uploadImageAction(formData: FormData): Promise<UploadState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "Tu sesión venció. Volvé a entrar." };

  if (!storageEnabled) {
    return {
      status: "error",
      message: "Falta configurar Supabase Storage. Por ahora pegá la URL de la imagen.",
    };
  }

  const folder = String(formData.get("folder") ?? "");
  if (!FOLDERS.includes(folder as ImageFolder)) {
    return { status: "error", message: "Destino de imagen inválido." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { status: "error", message: "No llegó ningún archivo." };
  }

  const result = await uploadImage(file, folder as ImageFolder);
  return result.ok
    ? { status: "ok", url: result.url }
    : { status: "error", message: result.error };
}

/** Borra una imagen que quedó huérfana al reemplazarla o descartarla. */
export async function deleteImageAction(url: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await deleteImage(url);
}

/** Le dice al cliente si puede mostrar el selector de archivos. */
export async function isStorageEnabled(): Promise<boolean> {
  return storageEnabled;
}
