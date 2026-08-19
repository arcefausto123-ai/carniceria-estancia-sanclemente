import { redirect } from "next/navigation";
import { authenticate, createSession, getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Logo } from "@/components/logo";
import { Alert } from "@/components/icons";

export const dynamic = "force-dynamic";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = await authenticate(email, password);
  if (!user) redirect("/admin/login?error=1");

  await createSession({ id: user.id, name: user.name });
  redirect("/admin");
}

type SearchParams = Promise<{ error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;
  if (await getSession()) redirect("/admin");
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center text-white">
          <Logo src={settings.logoUrl} className="h-28 w-auto" />
        </div>

        <form action={login} className="mt-8 rounded-xl bg-white p-7">
          <h1 className="font-serif text-2xl text-ink-900">Panel administrativo</h1>
          <p className="mt-1 text-sm text-ink-500">Ingresá con tu cuenta para continuar.</p>

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-sm text-danger-fg">
              <Alert className="h-4 w-4 shrink-0" />
              Correo o contraseña incorrectos.
            </p>
          )}

          <label className="mt-5 block">
            <span className="admin-label">Correo electrónico</span>
            <input name="email" type="email" required autoComplete="username" className="admin-field" />
          </label>

          <label className="mt-4 block">
            <span className="admin-label">Contraseña</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="admin-field"
            />
          </label>

          <button type="submit" className="btn-primary mt-6 w-full">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
