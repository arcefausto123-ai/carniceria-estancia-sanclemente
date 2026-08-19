/**
 * Isologo ovalado de la marca, dibujado en SVG para que se vea nítido en
 * cualquier tamaño y herede el color del contenedor.
 * Si en Configuración se carga un logo propio, se usa ese en su lugar.
 */
export function Logo({
  className = "h-16 w-auto",
  src,
  alt = "Estancia San Clemente",
}: {
  className?: string;
  src?: string | null;
  alt?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <svg viewBox="0 0 220 118" className={className} role="img" aria-label={alt}>
      <ellipse
        cx="110"
        cy="59"
        rx="104"
        ry="52"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <ellipse
        cx="110"
        cy="59"
        rx="98"
        ry="46"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="14" cy="59" r="2.4" fill="currentColor" />
      <circle cx="206" cy="59" r="2.4" fill="currentColor" />
      <text
        x="110"
        y="47"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Playfair Display, Georgia, serif"
        fontSize="25"
        fontWeight="600"
        letterSpacing="1.5"
      >
        ESTANCIA
      </text>
      <text
        x="110"
        y="62"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Playfair Display, Georgia, serif"
        fontSize="12"
        fontWeight="500"
        letterSpacing="1"
      >
        SAN
      </text>
      <text
        x="110"
        y="82"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Playfair Display, Georgia, serif"
        fontSize="25"
        fontWeight="600"
        letterSpacing="1.5"
      >
        CLEMENTE
      </text>
      <text
        x="110"
        y="96"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Inter, sans-serif"
        fontSize="7"
        letterSpacing="2.5"
      >
        CORTES SELECCIONADOS
      </text>
    </svg>
  );
}
