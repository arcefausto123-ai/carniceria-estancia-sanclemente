import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Las fotos se suben a través de una Server Action. El navegador las
    // reduce a 1600 px antes de mandarlas, lo que normalmente deja archivos
    // de 300 a 500 KB, pero una foto muy detallada puede superar el límite
    // de 1 MB que Next aplica por defecto. `storage.ts` igual rechaza todo
    // lo que pase de 5 MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
