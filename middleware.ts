import { NextResponse, type NextRequest } from "next/server";

/**
 * Publica el pathname en un header para que los layouts de servidor puedan
 * saber en qué ruta están (el layout de /admin necesita distinguir el login).
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
