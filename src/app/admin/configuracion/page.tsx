import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TEMPLATES } from "@/lib/whatsapp";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ seccion?: string; guardado?: string }>;

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [settings, admins] = await Promise.all([
    getSettings(),
    prisma.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true } }),
  ]);

  return (
    <SettingsForm
      section={params.seccion ?? "negocio"}
      saved={params.guardado === "1"}
      admins={admins}
      settings={{
        businessName: settings.businessName,
        logoUrl: settings.logoUrl ?? "",
        whatsapp: settings.whatsapp,
        email: settings.email,
        address: settings.address,
        instagram: settings.instagram,
        facebook: settings.facebook,
        tagline: settings.tagline,

        stockHoldMinutes: settings.stockHoldMinutes,
        depositPct: settings.depositPct,
        minOrder: String(Math.round(settings.minOrderCents / 100)),
        shippingEnabled: settings.shippingEnabled,
        pickupEnabled: settings.pickupEnabled,
        hideOutOfStock: settings.hideOutOfStock,

        bankAlias: settings.bankAlias,
        bankHolder: settings.bankHolder,
        bankTaxId: settings.bankTaxId,
        bankCbu: settings.bankCbu,

        notifyOnNewOrder: settings.notifyOnNewOrder,
        notifyOnPaymentOk: settings.notifyOnPaymentOk,
        notifyOnReady: settings.notifyOnReady,
        msgNewOrder: settings.msgNewOrder || DEFAULT_TEMPLATES.newOrder,
        msgPaymentOk: settings.msgPaymentOk || DEFAULT_TEMPLATES.paymentOk,
        msgReady: settings.msgReady || DEFAULT_TEMPLATES.ready,
      }}
    />
  );
}
