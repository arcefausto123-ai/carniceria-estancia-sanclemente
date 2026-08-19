/**
 * Isologo de la marca.
 *
 * El logo oficial es **blanco sobre fondo transparente**: sólo se lee sobre
 * fondo oscuro. Todos los lugares donde se usa le dan un fondo navy
 * (cabecera y pie de la tienda, barra lateral y login del panel). Si alguna
 * vez hace falta ponerlo sobre crema o blanco hay que pedir una variante en
 * tinta oscura del archivo — no alcanza con un filtro CSS.
 *
 * PENDIENTE: falta el PNG oficial en `public/logo.png`. Apenas esté,
 * borrar `FallbackMark` y devolver siempre el <img>.
 */

/** Ruta del logo oficial dentro de `public/`. */
export const BRAND_LOGO = "/logo.png";

export function Logo({
  className = "h-16 w-auto",
  src,
  alt = "Estancia San Clemente",
}: {
  className?: string;
  /** Logo cargado desde Configuración. Si no hay, se usa el oficial. */
  src?: string | null;
  alt?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }
  return <FallbackMark className={className} alt={alt} />;
}

/**
 * Marca provisoria mientras no esté el archivo oficial. Respeta la
 * estructura del logo real (lettering arqueado en tres líneas, los dos
 * puntos a los costados y la bajada "SABEMOS DE CARNE") pero NO reproduce
 * su tipografía dibujada a mano. No sirve para producción.
 */
function FallbackMark({ className, alt }: { className: string; alt: string }) {
  return (
    <svg viewBox="0 0 220 118" className={className} role="img" aria-label={alt}>
      <defs>
        <path id="esc-arc-top" d="M 18 74 A 96 62 0 0 1 202 74" fill="none" />
        <path id="esc-arc-bottom" d="M 24 68 A 92 52 0 0 0 196 68" fill="none" />
      </defs>

      <circle cx="10" cy="59" r="3" fill="currentColor" />
      <circle cx="210" cy="59" r="3" fill="currentColor" />

      <text
        fill="currentColor"
        fontFamily="Playfair Display, Georgia, serif"
        fontSize="27"
        fontWeight="700"
        letterSpacing="1"
      >
        <textPath href="#esc-arc-top" startOffset="50%" textAnchor="middle">
          ESTANCIA
        </textPath>
      </text>

      <text
        x="110"
        y="62"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Playfair Display, Georgia, serif"
        fontSize="13"
        fontWeight="600"
        letterSpacing="0.5"
      >
        SAN
      </text>

      <text
        fill="currentColor"
        fontFamily="Playfair Display, Georgia, serif"
        fontSize="30"
        fontWeight="700"
        letterSpacing="0.5"
      >
        <textPath href="#esc-arc-bottom" startOffset="50%" textAnchor="middle">
          CLEMENTE
        </textPath>
      </text>

      <text
        x="110"
        y="106"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Inter, sans-serif"
        fontSize="8"
        letterSpacing="3"
      >
        SABEMOS DE CARNE
      </text>
    </svg>
  );
}
