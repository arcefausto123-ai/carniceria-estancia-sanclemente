/**
 * Íconos de línea, dibujados a mano para que coincidan con el diseño.
 * Heredan `currentColor` y el tamaño se controla con clases.
 */
type Props = React.SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

const Svg = ({ children, ...props }: Props & { children: React.ReactNode }) => (
  <svg {...base} width="20" height="20" aria-hidden {...props}>
    {children}
  </svg>
);

export const Search = (p: Props) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const Cart = (p: Props) => (
  <Svg {...p}>
    <path d="M2.5 3h2.2l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.2L21 7H6" />
    <circle cx="9.5" cy="20" r="1.4" />
    <circle cx="17.5" cy="20" r="1.4" />
  </Svg>
);

export const User = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Svg>
);

export const Chat = (p: Props) => (
  <Svg {...p}>
    <path d="M20.5 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.4-4.7A7.5 7.5 0 1 1 20.5 11.5Z" />
  </Svg>
);

export const Truck = (p: Props) => (
  <Svg {...p}>
    <path d="M2.5 6.5h10v9h-10z" />
    <path d="M12.5 10h3.6l2.9 2.9v2.6h-6.5z" />
    <circle cx="6.5" cy="17.5" r="1.7" />
    <circle cx="16.5" cy="17.5" r="1.7" />
  </Svg>
);

export const Store = (p: Props) => (
  <Svg {...p}>
    <path d="M4 10v9h16v-9" />
    <path d="M3 6.5 4.5 4h15L21 6.5a2.4 2.4 0 0 1-4.5 1.3A2.4 2.4 0 0 1 12 7.8a2.4 2.4 0 0 1-4.5 0A2.4 2.4 0 0 1 3 6.5Z" />
    <path d="M10 19v-4.5h4V19" />
  </Svg>
);

export const Pin = (p: Props) => (
  <Svg {...p}>
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);

export const Clock = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </Svg>
);

export const Check = (p: Props) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const CheckCircle = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.2 2.7 2.8L16 9.5" />
  </Svg>
);

export const XCircle = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </Svg>
);

export const Alert = (p: Props) => (
  <Svg {...p}>
    <path d="M12 4.5 21 19.5H3z" />
    <path d="M12 10v4M12 16.8v.2" />
  </Svg>
);

export const Info = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.8v.2" />
  </Svg>
);

export const Whatsapp = (p: Props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden {...p}>
    <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2 22l5.36-1.4a9.8 9.8 0 0 0 4.68 1.19h.01c5.43 0 9.84-4.4 9.84-9.84A9.78 9.78 0 0 0 12.04 2Zm0 17.94h-.01a8.2 8.2 0 0 1-4.16-1.14l-.3-.18-3.09.81.83-3.02-.2-.31a8.13 8.13 0 0 1-1.25-4.36c0-4.5 3.67-8.17 8.19-8.17a8.13 8.13 0 0 1 5.78 2.4 8.08 8.08 0 0 1 2.4 5.78c0 4.51-3.68 8.19-8.19 8.19Zm4.5-6.13c-.25-.13-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.13-.16.24-.63.79-.78.96-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.15-.25-.02-.38.1-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.09-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.47c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03s.87 2.35.99 2.51c.13.17 1.71 2.61 4.15 3.66.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.17-.06-.11-.22-.17-.47-.29Z" />
  </svg>
);

export const Plus = (p: Props) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const Minus = (p: Props) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
);

export const ArrowLeft = (p: Props) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);

export const ArrowRight = (p: Props) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const ChevronDown = (p: Props) => (
  <Svg {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Svg>
);

export const Upload = (p: Props) => (
  <Svg {...p}>
    <path d="M12 16V4.5M7.5 9 12 4.5 16.5 9" />
    <path d="M4 15.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-3.5" />
  </Svg>
);

export const Image = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <circle cx="8.5" cy="10" r="1.6" />
    <path d="m4 17 4.5-4.5 3.5 3.5 3-3L20 17" />
  </Svg>
);

export const Pencil = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20h4L19.2 8.8a2.1 2.1 0 0 0-3-3L5 17v3Z" />
  </Svg>
);

export const Copy = (p: Props) => (
  <Svg {...p}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
    <path d="M15.5 5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2" />
  </Svg>
);

export const Trash = (p: Props) => (
  <Svg {...p}>
    <path d="M4 6.5h16M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
    <path d="M6.5 6.5 7.4 20a1.4 1.4 0 0 0 1.4 1.3h6.4a1.4 1.4 0 0 0 1.4-1.3l.9-13.5" />
    <path d="M10.5 10.5v6.5M13.5 10.5v6.5" />
  </Svg>
);

export const Drag = (p: Props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden {...p}>
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);

export const Dots = (p: Props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden {...p}>
    <circle cx="12" cy="5" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="12" cy="19" r="1.6" />
  </svg>
);

export const Bell = (p: Props) => (
  <Svg {...p}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9Z" />
    <path d="M13.7 19a2 2 0 0 1-3.4 0" />
  </Svg>
);

export const Gauge = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m14.8 9.2-3.4 4.6 4.6-3.4z" />
  </Svg>
);

export const Meat = (p: Props) => (
  <Svg {...p}>
    <path d="M15.6 4.2a5.6 5.6 0 0 1 4.2 4.2c.7 3-1 5.4-3.6 7.6-2.6 2.2-5.2 4.3-8 3.6a5.2 5.2 0 0 1-3.8-3.8c-.7-2.8 1.4-5.4 3.6-8s4.6-4.3 7.6-3.6Z" />
    <circle cx="9" cy="15" r="2.3" />
  </Svg>
);

export const Tag = (p: Props) => (
  <Svg {...p}>
    <path d="M11.4 3H20a1 1 0 0 1 1 1v8.6a2 2 0 0 1-.6 1.4l-6.4 6.4a2 2 0 0 1-2.8 0l-7.6-7.6a2 2 0 0 1 0-2.8L10 3.6a2 2 0 0 1 1.4-.6Z" />
    <circle cx="16.5" cy="7.5" r="1.4" />
  </Svg>
);

export const Card = (p: Props) => (
  <Svg {...p}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
    <path d="M2.5 10h19" />
  </Svg>
);

export const Users = (p: Props) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.3" />
    <path d="M3 19a6 6 0 0 1 12 0" />
    <path d="M16 5.3a3.3 3.3 0 0 1 0 6.4M17.5 19a6 6 0 0 0-2-4.5" />
  </Svg>
);

export const Gear = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.5 12a7.5 7.5 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-2-1.2l-.3-2.5h-4l-.3 2.5a7.5 7.5 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7.5 7.5 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.5 7.5 0 0 0 2 1.2l.3 2.5h4l.3-2.5a7.5 7.5 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.06-.4.1-.8.1-1.2Z" />
  </Svg>
);

export const Box = (p: Props) => (
  <Svg {...p}>
    <path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2z" />
    <path d="M4 7.2 12 11.5l8-4.3M12 11.5V21" />
  </Svg>
);

export const Money = (p: Props) => (
  <Svg {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 12h.01M18 12h.01" />
  </Svg>
);

export const Bank = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 9.5 12 4.5l8.5 5" />
    <path d="M5.5 9.5v8M9.8 9.5v8M14.2 9.5v8M18.5 9.5v8" />
    <path d="M3 20.5h18" />
  </Svg>
);

export const Star = (p: Props) => (
  <Svg {...p}>
    <path d="m12 4 2.5 5.2 5.5.8-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.5-.8z" />
  </Svg>
);

export const Bag = (p: Props) => (
  <Svg {...p}>
    <path d="M5 8h14l-1 12H6z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </Svg>
);

export const Calendar = (p: Props) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
  </Svg>
);

export const Phone = (p: Props) => (
  <Svg {...p}>
    <path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 5.6 5.6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />
  </Svg>
);

export const Mail = (p: Props) => (
  <Svg {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <path d="m3 6.5 9 6 9-6" />
  </Svg>
);

export const Note = (p: Props) => (
  <Svg {...p}>
    <path d="M5 3.5h9.5L19 8v12.5H5z" />
    <path d="M14 3.5V8h5M8.5 12.5h7M8.5 16h4.5" />
  </Svg>
);

export const Printer = (p: Props) => (
  <Svg {...p}>
    <path d="M7 9V3.5h10V9" />
    <rect x="3.5" y="9" width="17" height="7" rx="2" />
    <path d="M7 14h10v6.5H7z" />
  </Svg>
);

export const Filter = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 5.5h17l-6.5 7.5v5.5l-4 2v-7.5z" />
  </Svg>
);

export const Save = (p: Props) => (
  <Svg {...p}>
    <path d="M4.5 4.5h11.4L19.5 8v11.5h-15z" />
    <path d="M8 4.5v5h6v-5M8 19.5v-5h8v5" />
  </Svg>
);

export const List = (p: Props) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const Grid = (p: Props) => (
  <Svg {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" />
  </Svg>
);

export const TrendUp = (p: Props) => (
  <Svg {...p}>
    <path d="m4 16 5-5 3.5 3.5L20 7" />
    <path d="M15 7h5v5" />
  </Svg>
);

export const Cow = (p: Props) => (
  <Svg {...p}>
    <path d="M4.5 8.5c0-1.6.8-2.5 2-2.5 1 0 1.6.5 2 1h7c.4-.5 1-1 2-1 1.2 0 2 .9 2 2.5 0 1.3-.6 2.2-1.5 2.6v3.4a5.5 5.5 0 0 1-11 0v-3.4c-.9-.4-1.5-1.3-1.5-2.6Z" />
    <path d="M9.5 11.5v.01M14.5 11.5v.01M10.5 16.5h3" />
  </Svg>
);

export const Pig = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 10.5 5 7l3 1.6a8.6 8.6 0 0 1 8 0L19 7l1.5 3.5c.5 1 .5 2 .5 2.5a7.5 7.5 0 0 1-15 0c0-.5 0-1.5.5-2.5Z" />
    <ellipse cx="12" cy="14.5" rx="2.6" ry="2" />
    <path d="M11.2 14.4v.01M12.8 14.4v.01M8.5 11v.01M15.5 11v.01" />
  </Svg>
);

export const Chicken = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3.5c1 0 1.6.7 1.6 1.6 0 .5-.2.9-.5 1.2 2.4.6 4.4 2.8 4.4 5.7 0 3.6-2.6 6.5-6 6.5s-6-2.9-6-6.5c0-2.9 2-5.1 4.4-5.7a1.6 1.6 0 0 1-.5-1.2c0-.9.6-1.6 1.6-1.6Z" />
    <path d="M14 10v.01M9.5 20.5l1.5-2M14.5 20.5 13 18.5" />
  </Svg>
);

/** Mapa de íconos por clave, usado por las categorías configurables. */
export const CATEGORY_ICONS = {
  beef: Cow,
  pork: Pig,
  chicken: Chicken,
  box: Box,
  tag: Tag,
  meat: Meat,
} as const;

export type CategoryIconKey = keyof typeof CATEGORY_ICONS;

export function CategoryIcon({ name, ...props }: Props & { name: string }) {
  const Component = CATEGORY_ICONS[name as CategoryIconKey] ?? Tag;
  return <Component {...props} />;
}
