import { Meat } from "./icons";

/**
 * Foto del envase. Cuando todavía no se cargó una imagen mostramos un
 * marcador de posición con la textura de la marca, en vez de un hueco roto.
 */
export function ProductImage({
  src,
  alt,
  className = "",
  iconClassName = "h-8 w-8",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`object-cover ${className}`} loading="lazy" />;
  }
  return (
    <div
      className={`flex items-center justify-center bg-cream-200 text-navy/25 ${className}`}
      aria-label={alt}
      role="img"
    >
      <Meat className={iconClassName} />
    </div>
  );
}
