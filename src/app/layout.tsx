import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estancia San Clemente — Cortes seleccionados",
  description:
    "Carnicería Estancia San Clemente. Cortes seleccionados envasados al vacío, con envío refrigerado y retiro en Loma Verde, Escobar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
