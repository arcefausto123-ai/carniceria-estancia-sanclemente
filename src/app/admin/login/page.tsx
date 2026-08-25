import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  authenticate, createSession, getSession, needsFirstAdmin, hashPassword, MIN_PASSWORD_LENGTH,
} from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Logo } from "@/components/logo";
import { Alert, Info } from "@/components/icons";

export const dynamic = "force-dynamic";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const result = await authenticate(email, password);
  if (!result.ok) {
    // Devolvemos el correo para no obligar a reescribirlo.
    const back = `&email=${encodeURIComponent(email)}`;
    redirect(
      result.reason === "bloqueada"
        ? `/admin/login?error=bloqueada&minutos=${result.minutes}${back}`
        : `/admin/login?error=credenciales${back}`,
    );
  }

  await createSession(result.user);
  redirect("/admin");
}

/**
 * Crea la primera cuenta del panel. Sólo funciona mientras no exista
 * ninguna: en cuanto hay una, esta acción deja de estar disponible, así
 * que no queda una puerta abierta.
 */
async function createFirstAdmin(formData: FormData) {
  "use server";
  if (!(await needsFirstAdmin())) redirect("/admin/login");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const repeat = String(formData.get("repeat") ?? "");

  if (!name || !email) redirect("/admin/login?error=datos");
  if (password.length < MIN_PASSWORD_LENGTH) redirect("/admin/login?error=corta");
  if (password !== repeat) redirect("/admin/login?error=distintas");

  const user = await prisma.adminUser.create({
    data: { name, email, passwordHash: hashPassword(password) },
  });

  await createSession(user);
  redirect("/admin");
}

const ERRORS: Record<string, string> = {
  credenciales: "Correo o contraseña incorrectos.",
  datos: "Completá tu nombre y tu correo.",
  corta: `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  distintas: "Las dos contraseñas no coinciden.",
};

type SearchParams = Promise<{ error?: string; email?: string; minutos?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { error, email, minutos } = await searchParams;
  if (await getSession()) redirect("/admin");

  const [settings, firstRun] = await Promise.all([getSettings(), needsFirstAdmin()]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo src={settings.logoUrl} className="h-24 w-auto" />
        </div>

        <form
          action={firstRun ? createFirstAdmin : login}
          className="mt-8 rounded-xl bg-white p-7"
        >
          <h1 className="font-serif text-2xl text-ink-900">
            {firstRun ? "Creá tu cuenta" : "Panel administrativo"}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {firstRun
              ? "Es la primera vez que entrás. Elegí tus datos de acceso."
              : "Ingresá con tu cuenta para continuar."}
          </p>

          {error === "bloqueada" ? (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-warn-bg px-3 py-2.5 text-sm text-warn-fg">
              <Alert className="mt-px h-4 w-4 shrink-0" />
              Demasiados intentos fallidos. Volvé a probar en {minutos ?? "unos"} minutos.
            </p>
          ) : (
            error && ERRORS[error] && (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-sm text-danger-fg">
                <Alert className="mt-px h-4 w-4 shrink-0" />
                {ERRORS[error]}
              </p>
            )
          )}

          {firstRun && (
            <label className="mt-5 block">
              <span className="admin-label">Tu nombre</span>
              <input name="name" required autoComplete="name" className="admin-field" />
            </label>
          )}

          <label className="mt-4 block">
            <span className="admin-label">Correo electrónico</span>
            <input
              name="email"
              type="email"
              required
              defaultValue={email}
              autoComplete="username"
              className="admin-field"
            />
          </label>

          <label className="mt-4 block">
            <span className="admin-label">Contraseña</span>
            <input
              name="password"
              type="password"
              required
              minLength={firstRun ? MIN_PASSWORD_LENGTH : undefined}
              autoComplete={firstRun ? "new-password" : "current-password"}
              className="admin-field"
            />
          </label>

          {firstRun && (
            <>
              <label className="mt-4 block">
                <span className="admin-label">Repetí la contraseña</span>
                <input
                  name="repeat"
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  className="admin-field"
                />
              </label>
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-info-bg px-3 py-2.5 text-xs text-info-fg">
                <Info className="mt-px h-4 w-4 shrink-0" />
                Mínimo {MIN_PASSWORD_LENGTH} caracteres. Esta pantalla sólo aparece una vez:
                después se administra desde Configuración.
              </p>
            </>
          )}

          <button type="submit" className="btn-primary mt-6 w-full">
            {firstRun ? "Crear cuenta y entrar" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
