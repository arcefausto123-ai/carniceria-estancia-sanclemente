"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, verifyPassword, hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { getSettings, SETTINGS_ID } from "@/lib/settings";
import { parsePriceToCents, parseWeightKg } from "@/lib/format";
import { normalizePhone } from "@/lib/whatsapp";
import { deleteImage } from "@/lib/storage";
import { calculateDeposit } from "@/lib/pricing";
import type { OrderStatus, ProductStatus, SlotKind } from "@prisma/client";

/** Todas las acciones del panel pasan por acá antes de tocar la base. */
async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const num = (data: FormData, key: string, fallback = 0) => {
  const value = Number(data.get(key));
  return Number.isFinite(value) ? value : fallback;
};
const bool = (data: FormData, key: string) => data.get(key) === "on" || data.get(key) === "true";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Garantiza un slug único agregando un sufijo numérico si hace falta. */
async function uniqueSlug(base: string, model: "product" | "category", excludeId?: string) {
  const root = slugify(base) || "item";
  for (let suffix = 0; suffix < 100; suffix++) {
    const candidate = suffix === 0 ? root : `${root}-${suffix}`;
    const found =
      model === "product"
        ? await prisma.product.findUnique({ where: { slug: candidate } })
        : await prisma.category.findUnique({ where: { slug: candidate } });
    if (!found || found.id === excludeId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

// ------------------------------------------------------------------ productos

export async function saveProduct(formData: FormData) {
  await requireAdmin();

  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!name) redirect("/admin/productos?error=nombre");

  const categoryId = text(formData, "categoryId");
  if (!categoryId) redirect("/admin/productos?error=categoria");

  const weightGrams = parseWeightKg(text(formData, "weightKg"));
  const priceCents = parsePriceToCents(text(formData, "price"));
  if (weightGrams <= 0) redirect("/admin/productos?error=peso");
  if (priceCents <= 0) redirect("/admin/productos?error=precio");

  const data = {
    name,
    sku: text(formData, "sku") || null,
    description: text(formData, "description") || null,
    image: text(formData, "image") || null,
    categoryId,
    weightGrams,
    priceCents,
    stock: Math.max(0, num(formData, "stock", 1)),
    lowStockThreshold: Math.max(0, num(formData, "lowStockThreshold", 2)),
    // "Guardar borrador" fuerza DRAFT aunque el toggle esté encendido.
    status: (text(formData, "saveAs") !== "draft" && bool(formData, "published")
      ? "PUBLISHED"
      : "DRAFT") as ProductStatus,
  };

  if (id) {
    // Si cambió la foto, la anterior queda huérfana en el bucket.
    const previous = await prisma.product.findUnique({ where: { id }, select: { image: true } });
    await prisma.product.update({ where: { id }, data });
    if (previous?.image && previous.image !== data.image) await deleteImage(previous.image);
  } else {
    await prisma.product.create({
      data: { ...data, slug: await uniqueSlug(name, "product") },
    });
  }

  revalidatePath("/admin/productos");
  revalidatePath("/");
  redirect("/admin/productos?guardado=1");
}

export async function duplicateProduct(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const source = await prisma.product.findUnique({ where: { id } });
  if (!source) return;

  const name = `${source.name} (copia)`;
  await prisma.product.create({
    data: {
      name,
      slug: await uniqueSlug(name, "product"),
      sku: source.sku,
      description: source.description,
      image: source.image,
      categoryId: source.categoryId,
      weightGrams: source.weightGrams,
      priceCents: source.priceCents,
      stock: 0,
      lowStockThreshold: source.lowStockThreshold,
      status: "DRAFT",
    },
  });
  revalidatePath("/admin/productos");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");

  // Si el producto ya se vendió lo archivamos en vez de borrarlo, para no
  // romper el histórico de pedidos.
  const sold = await prisma.orderItem.count({ where: { productId: id } });
  if (sold > 0) {
    // Ya se vendió: lo archivamos y conservamos la foto, que sigue apareciendo
    // en el detalle de los pedidos viejos.
    await prisma.product.update({ where: { id }, data: { status: "DRAFT", stock: 0 } });
  } else {
    const product = await prisma.product.findUnique({ where: { id }, select: { image: true } });
    await prisma.product.delete({ where: { id } }).catch(() => {});
    await deleteImage(product?.image);
  }

  revalidatePath("/admin/productos");
  revalidatePath("/");
}

export async function updateStock(formData: FormData) {
  await requireAdmin();
  await prisma.product.update({
    where: { id: text(formData, "id") },
    data: { stock: Math.max(0, num(formData, "stock")) },
  });
  revalidatePath("/admin/productos");
  revalidatePath("/");
}

// ---------------------------------------------------------------- categorías

export async function saveCategory(formData: FormData) {
  await requireAdmin();

  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!name) redirect("/admin/categorias?error=nombre");

  const data = {
    name,
    description: text(formData, "description") || null,
    highlight: text(formData, "highlight") || null,
    icon: text(formData, "icon") || "tag",
    coverImage: text(formData, "coverImage") || null,
    visible: bool(formData, "visible"),
  };

  if (id) {
    const previous = await prisma.category.findUnique({
      where: { id },
      select: { coverImage: true },
    });
    await prisma.category.update({ where: { id }, data });
    if (previous?.coverImage && previous.coverImage !== data.coverImage) {
      await deleteImage(previous.coverImage);
    }
  } else {
    const last = await prisma.category.findFirst({ orderBy: { position: "desc" } });
    await prisma.category.create({
      data: { ...data, slug: await uniqueSlug(name, "category"), position: (last?.position ?? 0) + 1 },
    });
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/");
  redirect("/admin/categorias?guardado=1");
}

export async function reorderCategories(formData: FormData) {
  await requireAdmin();
  const order = String(formData.get("order") ?? "").split(",").filter(Boolean);

  await prisma.$transaction(
    order.map((id, index) =>
      prisma.category.update({ where: { id }, data: { position: index } }),
    ),
  );
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function toggleCategory(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return;

  await prisma.category.update({ where: { id }, data: { visible: !category.visible } });
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");

  const products = await prisma.product.count({ where: { categoryId: id } });
  if (products > 0) redirect("/admin/categorias?error=con-productos");

  const category = await prisma.category.findUnique({
    where: { id },
    select: { coverImage: true },
  });
  await prisma.category.delete({ where: { id } }).catch(() => {});
  await deleteImage(category?.coverImage);

  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

// ------------------------------------------------------------------- pedidos

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const code = text(formData, "code");
  const status = text(formData, "status") as OrderStatus;

  const order = await prisma.order.update({
    where: { code },
    data: {
      status,
      events: { create: { type: "status", message: `Estado cambiado a "${status}".` } },
    },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${order.code}`);
  revalidatePath(`/pedido/${order.code}`);
}

export async function bulkUpdateOrderStatus(formData: FormData) {
  await requireAdmin();
  const ids = formData.getAll("orderIds").map(String).filter(Boolean);
  const status = text(formData, "status") as OrderStatus;
  if (ids.length === 0 || !status) return;

  await prisma.order.updateMany({ where: { id: { in: ids } }, data: { status } });
  revalidatePath("/admin/pedidos");
}

export async function toggleOrderItemPrepared(formData: FormData) {
  await requireAdmin();
  const itemId = text(formData, "itemId");
  const item = await prisma.orderItem.findUnique({ where: { id: itemId }, include: { order: true } });
  if (!item) return;

  await prisma.orderItem.update({ where: { id: itemId }, data: { prepared: !item.prepared } });
  revalidatePath(`/admin/pedidos/${item.order.code}`);
}

export async function addOrderNote(formData: FormData) {
  await requireAdmin();
  const code = text(formData, "code");
  const message = text(formData, "note");
  if (!message) return;

  const session = await getSession();
  const order = await prisma.order.update({
    where: { code },
    data: {
      internalNotes: message,
      events: { create: { type: "note", message, author: session?.name ?? "panel" } },
    },
  });
  revalidatePath(`/admin/pedidos/${order.code}`);
}

// --------------------------------------------------------------------- pagos

/**
 * Aprobar un comprobante es un acto humano: pasa el pago a APPROVED y
 * mueve el pedido a Confirmado. No hay OCR ni validación automática.
 */
export async function approvePayment(formData: FormData) {
  const session = await requireAdmin();
  const id = text(formData, "id");
  const notes = text(formData, "reviewNotes");

  const payment = await prisma.payment.findUnique({ where: { id }, include: { order: true } });
  if (!payment) return;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedBy: session.name,
        reviewNotes: notes || null,
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: "CONFIRMED",
        events: {
          create: {
            type: "payment",
            message: "Comprobante aprobado. Pedido confirmado.",
            author: session.name,
          },
        },
      },
    }),
  ]);

  revalidatePath("/admin/pagos");
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${payment.order.code}`);
  revalidatePath(`/pedido/${payment.order.code}`);
}

export async function rejectPayment(formData: FormData) {
  const session = await requireAdmin();
  const id = text(formData, "id");
  const notes = text(formData, "reviewNotes");

  const payment = await prisma.payment.findUnique({ where: { id }, include: { order: true } });
  if (!payment) return;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: session.name,
        reviewNotes: notes || null,
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: "PAYMENT_PENDING",
        events: {
          create: {
            type: "payment",
            message: `Comprobante rechazado.${notes ? ` Motivo: ${notes}` : ""}`,
            author: session.name,
          },
        },
      },
    }),
  ]);

  revalidatePath("/admin/pagos");
  revalidatePath(`/admin/pedidos/${payment.order.code}`);
}

/** Registra el cobro del saldo en efectivo al momento del retiro. */
export async function registerBalancePayment(formData: FormData) {
  const session = await requireAdmin();
  const code = text(formData, "code");

  const order = await prisma.order.findUnique({ where: { code } });
  if (!order || order.balanceCents <= 0) return;

  await prisma.payment.create({
    data: {
      orderId: order.id,
      kind: "BALANCE",
      status: "APPROVED",
      expectedCents: order.balanceCents,
      reportedCents: order.balanceCents,
      reviewedAt: new Date(),
      reviewedBy: session.name,
    },
  });

  revalidatePath("/admin/pagos");
  revalidatePath(`/admin/pedidos/${code}`);
}

// ----------------------------------------------------------------- logística

export async function saveShippingZone(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const data = {
    name: text(formData, "name"),
    feeCents: parsePriceToCents(text(formData, "fee")),
    minOrderCents: parsePriceToCents(text(formData, "minOrder")),
    active: bool(formData, "active"),
  };
  if (!data.name) redirect("/admin/envios?error=nombre");

  if (id) {
    await prisma.shippingZone.update({ where: { id }, data });
  } else {
    const last = await prisma.shippingZone.findFirst({ orderBy: { position: "desc" } });
    await prisma.shippingZone.create({ data: { ...data, position: (last?.position ?? 0) + 1 } });
  }

  revalidatePath("/admin/envios");
  redirect("/admin/envios?guardado=1");
}

export async function toggleShippingZone(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const zone = await prisma.shippingZone.findUnique({ where: { id } });
  if (!zone) return;

  await prisma.shippingZone.update({ where: { id }, data: { active: !zone.active } });
  revalidatePath("/admin/envios");
}

export async function deleteShippingZone(formData: FormData) {
  await requireAdmin();
  await prisma.shippingZone.delete({ where: { id: text(formData, "id") } }).catch(() => {});
  revalidatePath("/admin/envios");
}

export async function saveTimeSlot(formData: FormData) {
  await requireAdmin();
  const label = text(formData, "label");
  const kind = text(formData, "kind") as SlotKind;
  if (!label) return;

  const last = await prisma.timeSlot.findFirst({ where: { kind }, orderBy: { position: "desc" } });
  await prisma.timeSlot.create({ data: { label, kind, position: (last?.position ?? 0) + 1 } });
  revalidatePath("/admin/envios");
}

export async function deleteTimeSlot(formData: FormData) {
  await requireAdmin();
  await prisma.timeSlot.delete({ where: { id: text(formData, "id") } }).catch(() => {});
  revalidatePath("/admin/envios");
}

/** Guarda el nuevo orden de la ruta del día (arrastrar y soltar). */
export async function reorderRoute(formData: FormData) {
  await requireAdmin();
  const order = String(formData.get("order") ?? "").split(",").filter(Boolean);

  await prisma.$transaction(
    order.map((id, index) => prisma.order.update({ where: { id }, data: { routePosition: index } })),
  );
  revalidatePath("/admin/envios");
}

// ------------------------------------------------------------------ clientes

export async function saveCustomer(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const tags = formData.getAll("tags").map(String).filter(Boolean);

  await prisma.customer.update({
    where: { id },
    data: {
      firstName: text(formData, "firstName"),
      lastName: text(formData, "lastName"),
      phone: normalizePhone(text(formData, "phone")),
      email: text(formData, "email") || null,
      notes: text(formData, "notes") || null,
      tags,
    },
  });

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes?guardado=1");
}

export async function deleteCustomer(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");

  const orders = await prisma.order.count({ where: { customerId: id } });
  if (orders > 0) redirect("/admin/clientes?error=con-pedidos");

  await prisma.customer.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

// ------------------------------------------------------------- configuración

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  await getSettings(); // se asegura de que la fila exista

  const depositPct = Math.min(100, Math.max(0, num(formData, "depositPct", 30)));
  const logoUrl = text(formData, "logoUrl") || null;

  const previous = await prisma.settings.findUnique({
    where: { id: SETTINGS_ID },
    select: { logoUrl: true },
  });

  await prisma.settings.update({
    where: { id: SETTINGS_ID },
    data: {
      businessName: text(formData, "businessName"),
      logoUrl,
      whatsapp: text(formData, "whatsapp"),
      email: text(formData, "email"),
      address: text(formData, "address"),
      instagram: text(formData, "instagram"),
      facebook: text(formData, "facebook"),
      tagline: text(formData, "tagline"),

      stockHoldMinutes: Math.max(1, num(formData, "stockHoldMinutes", 10)),
      depositPct,
      minOrderCents: parsePriceToCents(text(formData, "minOrder")),
      shippingEnabled: bool(formData, "shippingEnabled"),
      pickupEnabled: bool(formData, "pickupEnabled"),
      hideOutOfStock: bool(formData, "hideOutOfStock"),

      bankAlias: text(formData, "bankAlias"),
      bankHolder: text(formData, "bankHolder"),
      bankTaxId: text(formData, "bankTaxId"),
      bankCbu: text(formData, "bankCbu"),

      notifyOnNewOrder: bool(formData, "notifyOnNewOrder"),
      notifyOnPaymentOk: bool(formData, "notifyOnPaymentOk"),
      notifyOnReady: bool(formData, "notifyOnReady"),
      msgNewOrder: text(formData, "msgNewOrder"),
      msgPaymentOk: text(formData, "msgPaymentOk"),
      msgReady: text(formData, "msgReady"),
    },
  });

  if (previous?.logoUrl && previous.logoUrl !== logoUrl) await deleteImage(previous.logoUrl);

  // Cambiar el % de seña sólo afecta a los pedidos nuevos; los ya emitidos
  // conservan el porcentaje con el que se calcularon.
  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
  redirect("/admin/configuracion?guardado=1");
}

/** Recalcula la seña de un pedido todavía no pagado con el % vigente. */
export async function recalculateDeposit(formData: FormData) {
  await requireAdmin();
  const code = text(formData, "code");
  const settings = await getSettings();

  const order = await prisma.order.findUnique({ where: { code }, include: { payments: true } });
  if (!order || order.paymentMethod !== "CASH_ON_PICKUP") return;
  if (order.payments.some((payment) => payment.status === "APPROVED")) return;

  const breakdown = calculateDeposit(order.totalCents, settings.depositPct);
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        depositPct: breakdown.depositPct,
        depositCents: breakdown.depositCents,
        balanceCents: breakdown.balanceCents,
      },
    }),
    prisma.payment.updateMany({
      where: { orderId: order.id, kind: "DEPOSIT", status: "PENDING" },
      data: { expectedCents: breakdown.depositCents },
    }),
  ]);

  revalidatePath(`/admin/pedidos/${code}`);
}

/** Cambia la contraseña de la cuenta con la que estás trabajando. */
export async function changePassword(formData: FormData) {
  const session = await requireAdmin();

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const repeat = String(formData.get("repeatPassword") ?? "");

  const target = "/admin/configuracion?seccion=usuarios";
  const user = await prisma.adminUser.findUnique({ where: { id: session.id } });
  if (!user) redirect("/admin/login");

  if (!verifyPassword(current, user.passwordHash)) redirect(`${target}&clave=actual`);
  if (next.length < MIN_PASSWORD_LENGTH) redirect(`${target}&clave=corta`);
  if (next !== repeat) redirect(`${target}&clave=distintas`);
  if (verifyPassword(next, user.passwordHash)) redirect(`${target}&clave=igual`);

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(next) },
  });

  revalidatePath(target);
  redirect(`${target}&clave=ok`);
}
