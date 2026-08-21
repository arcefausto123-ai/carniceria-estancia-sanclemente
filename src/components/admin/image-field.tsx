"use client";

import { useRef, useState, useTransition } from "react";
import { uploadImageAction, deleteImageAction } from "@/app/admin/upload-actions";
import { Image as ImageIcon, Upload, XCircle, Alert, Clock } from "@/components/icons";
import type { ImageFolder } from "@/lib/storage";

/** Lado más largo al que se reduce la foto antes de subirla. */
const MAX_EDGE = 1600;
const QUALITY = 0.85;

/**
 * Reduce la imagen en el navegador antes de subirla. Una foto de celular
 * pesa entre 5 y 8 MB; así viaja un archivo de ~300 KB, la tienda carga
 * rápido y no chocamos con el límite de tamaño de las Server Actions.
 */
async function shrink(file: File): Promise<File> {
  if (file.type === "image/avif") return file; // el canvas no lo re-codifica bien

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 900_000) return file; // ya es chica, no la tocamos

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // PNG mantiene la transparencia (importante para el logo); el resto va a JPEG.
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, QUALITY),
  );
  if (!blob || blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + (type === "image/png" ? ".png" : ".jpg");
  return new File([blob], name, { type });
}

export function ImageField({
  name,
  folder,
  defaultValue,
  label,
  hint,
  storageReady,
  aspect = "h-40",
  onChange,
}: {
  /** Nombre del campo oculto que lleva la URL al formulario. */
  name: string;
  folder: ImageFolder;
  defaultValue?: string | null;
  label: string;
  hint?: string;
  /** Si Supabase no está configurado, se ofrece pegar la URL a mano. */
  storageReady: boolean;
  aspect?: string;
  /** Avisa la nueva URL, para que el formulario refresque su vista previa. */
  onChange?: (url: string) => void;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  // Sólo borramos del bucket lo que subimos en esta misma sesión de edición:
  // así descartar un cambio no elimina la foto que ya estaba guardada.
  const uploaded = useRef<string[]>([]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const small = await shrink(file);

    startTransition(async () => {
      const data = new FormData();
      data.set("folder", folder);
      data.set("file", small);
      const result = await uploadImageAction(data);

      if (result.status === "ok") {
        if (uploaded.current.includes(url)) void deleteImageAction(url);
        uploaded.current.push(result.url);
        setUrl(result.url);
        onChange?.(result.url);
      } else if (result.status === "error") {
        setError(result.message);
      }
    });
  };

  const clear = () => {
    if (uploaded.current.includes(url)) void deleteImageAction(url);
    setUrl("");
    onChange?.("");
    setError(null);
    if (input.current) input.current.value = "";
  };

  return (
    <div>
      <span className="admin-label">{label}</span>
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative overflow-hidden rounded-lg border border-ink-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Vista previa" className={`w-full object-cover ${aspect}`} />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-ink-700
                       transition hover:text-danger-fg"
            aria-label="Quitar imagen"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={pending || !storageReady}
          className={`flex w-full flex-col items-center justify-center rounded-lg border-2
                      border-dashed px-4 py-8 text-center transition ${aspect}
                      ${pending ? "border-admin-blue bg-info-bg/40" : "border-ink-300 hover:border-admin-blue hover:bg-info-bg/20"}
                      disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {pending ? (
            <>
              <Clock className="h-7 w-7 animate-pulse text-admin-blue" />
              <span className="mt-2 text-sm text-admin-blue">Subiendo…</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-7 w-7 text-ink-500" />
              <span className="mt-2 text-sm text-ink-700">
                {storageReady ? "Elegí una foto" : "Subida no disponible"}
              </span>
              <span className="text-xs text-ink-500">{hint ?? "JPG, PNG o WebP · máx. 5 MB"}</span>
            </>
          )}
        </button>
      )}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        onChange={(event) => void pick(event.target.files?.[0])}
      />

      {url && storageReady && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={pending}
          className="btn-secondary mt-2 w-full text-xs"
        >
          <Upload className="h-3.5 w-3.5" />
          {pending ? "Subiendo…" : "Cambiar imagen"}
        </button>
      )}

      {error && (
        <p className="mt-2 flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2 text-xs text-danger-fg">
          <Alert className="mt-px h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {/* Sin Supabase configurado el panel sigue siendo usable pegando la URL. */}
      {!storageReady && (
        <input
          type="url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            onChange?.(event.target.value);
          }}
          placeholder="https://…/foto.jpg"
          aria-label={label}
          className="admin-field mt-2"
        />
      )}
    </div>
  );
}
