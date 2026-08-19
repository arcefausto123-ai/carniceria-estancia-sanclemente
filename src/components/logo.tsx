/**
 * Isologo de la marca.
 *
 * El logo oficial es **blanco sobre fondo transparente**: sólo se lee sobre
 * fondo oscuro. Todos los lugares donde se usa le dan un fondo navy
 * (cabecera y pie de la tienda, barra lateral, login y barra superior del
 * panel). Si alguna vez hace falta ponerlo sobre crema o blanco hay que
 * pedir una variante en tinta oscura del archivo — un filtro CSS no alcanza
 * con un lettering dibujado a mano.
 *
 * `public/logo.png` es el archivo original recortado a su contenido, así que
 * la altura que se le pide es la altura real de la marca. El original sin
 * recortar queda en `public/logo-original.png`; los dos, más los íconos, se
 * regeneran con `python3 scripts/generate-icons.py`.
 */

/** Ruta del logo oficial dentro de `public/`. */
export const BRAND_LOGO = "/logo.png";

/** Proporción del archivo recortado (548×327), para reservar el espacio. */
const RATIO = 548 / 327;

export function Logo({
  className = "h-16 w-auto",
  src,
  alt = "Estancia San Clemente",
  height = 327,
}: {
  className?: string;
  /** Logo cargado desde Configuración. Si no hay, se usa el oficial. */
  src?: string | null;
  alt?: string;
  /** Alto intrínseco declarado, para que el navegador no salte al cargar. */
  height?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || BRAND_LOGO}
      alt={alt}
      width={Math.round(height * RATIO)}
      height={height}
      className={className}
    />
  );
}
