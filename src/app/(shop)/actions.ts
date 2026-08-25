"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getCart, getOrCreateCart, touchCart, availableStock, clearCartCookie, cartSubtotalCents } from "@/lib/cart";
import { calculateDeposit, calculateFullPayment } from "@/lib/pricing";
import { nextOrderCode } from "@/lib/orders";
import { normalizePhone } from "@/lib/whatsapp";
import { parsePriceToCents } from "@/lib/format";
import type { DeliveryMethod, PaymentMethod } from "@prisma/client";

export type ActionResult = { ok: true } | { ok: false; error: string };

// ------------------------------------------------------------------ carrito

export async function addToCart(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "PUBLISHED") return;

  const cart = await getOrCreateCart();
  const existing = cart.items.find((item) => item.productId === productId);
  const free = await availableStock(product, cart.id);

  // No dejamos superar el stock realmente disponible (descontando lo que
  // otros carritos vivos tienen reservado).
  if ((existing?.quantity ?? 0) + 1 > free) return;

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity: 1 },
    update: { quantity: { increment: 1 } },
  });
  await touchCart(cart.id);

  revalidatePath("/");
  revalidatePath("/carrito");
}

export async function setCartQuantity(formData: FormData): Promise<void> {
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const cart = await getCart();
  if (!cart || !itemId) return;

  const item = cart.items.find((line) => line.id === itemId);
  if (!item) return;

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    const free = await availableStock(item.product, cart.id);
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: Math.min(quantity, Math.max(1, free)) },
    });
  }
  await touchCart(cart.id);
  revalidatePath("/carrito");
}

export async function removeCartItem(formData: FormData): Promise<void> {
  const itemId = String(formData.get("itemId") ?? "");
  const cart = await getCart();
  if (!cart || !cart.items.some((line) => line.id === itemId)) return;

  await prisma.cartItem.delete({ where: { id: itemId } });
  await touchCart(cart.id);
  revalidatePath("/carrito");
}

// ----------------------------------------------------------------- checkout

const CHECKOUT_COOKIE = "esc_checkout";

export type CheckoutDraft = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  deliveryMethod: DeliveryMethod;
  street: string;
  number: string;
  apartment: string;
  locality: string;
  postalCode: string;
  instructions: string;
  slotLabel: string;
  shippingZoneId: string;
  shippingCents: number;
};

export async function saveCheckoutDetails(formData: FormData) {
  const { cookies } = await import("next/headers");
  const settings = await getSettings();
  const cart = await getCart();
  if (!cart || cart.items.length === 0) redirect("/carrito");

  const deliveryMethod = (formData.get("deliveryMethod") === "SHIPPING"
    ? "SHIPPING"
    : "PICKUP") as DeliveryMethod;

  if (deliveryMethod === "SHIPPING" && !settings.shippingEnabled) redirect("/checkout/datos?error=envio");
  if (deliveryMethod === "PICKUP" && !settings.pickupEnabled) redirect("/checkout/datos?error=retiro");

  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const draft: CheckoutDraft = {
    firstName: text("firstName"),
    lastName: text("lastName"),
    phone: text("phone"),
    email: text("email"),
    deliveryMethod,
    street: text("street"),
    number: text("number"),
    apartment: text("apartment"),
    locality: text("locality"),
    postalCode: text("postalCode"),
    instructions: text("instructions"),
    slotLabel: text("slotLabel"),
    shippingZoneId: text("shippingZoneId"),
    shippingCents: 0,
  };

  if (!draft.firstName || !draft.lastName || !draft.phone) {
    redirect("/checkout/datos?error=datos");
  }
  if (deliveryMethod === "SHIPPING" && (!draft.street || !draft.number || !draft.locality)) {
    redirect("/checkout/datos?error=direccion");
  }

  // La tarifa de envío se resuelve en el servidor a partir de la zona,
  // nunca se confía en un valor mandado por el formulario.
  if (deliveryMethod === "SHIPPING" && draft.shippingZoneId) {
    const zone = await prisma.shippingZone.findUnique({ where: { id: draft.shippingZoneId } });
    if (zone?.active) {
      draft.shippingCents = zone.feeCents;
      const subtotal = cartSubtotalCents(cart);
      if (subtotal < zone.minOrderCents) redirect("/checkout/datos?error=minimo-zona");
    } else {
      draft.shippingZoneId = "";
    }
  }

  const subtotal = cartSubtotalCents(cart);
  if (subtotal < settings.minOrderCents) redirect("/carrito?error=minimo");

  await touchCart(cart.id);
  (await cookies()).set(CHECKOUT_COOKIE, JSON.stringify(draft), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 2,
  });

  redirect("/checkout/pago");
}

export async function getCheckoutDraft(): Promise<CheckoutDraft | null> {
  const { cookies } = await import("next/headers");
  const raw = (await cookies()).get(CHECKOUT_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CheckoutDraft;
  } catch {
    return null;
  }
}

/**
 * Cierra el pedido: crea/actualiza el cliente, congela los ítems del
 * carrito, calcula la seña con el % vigente y deja el pago en estado
 * "pendiente de validación manual".
 */
export async function placeOrder(formData: FormData) {
  const { cookies } = await import("next/headers");
  const paymentMethod = (formData.get("paymentMethod") === "BANK_TRANSFER"
    ? "BANK_TRANSFER"
    : "CASH_ON_PICKUP") as PaymentMethod;

  const cart = await getCart();
  const draft = await getCheckoutDraft();
  if (!cart || cart.items.length === 0) redirect("/carrito");
  if (!draft) redirect("/checkout/datos");

  const settings = await getSettings();
  const subtotalCents = cartSubtotalCents(cart);
  const shippingCents = draft.deliveryMethod === "SHIPPING" ? draft.shippingCents : 0;
  const totalCents = subtotalCents + shippingCents;

  if (subtotalCents < settings.minOrderCents) redirect("/carrito?error=minimo");

  const breakdown =
    paymentMethod === "CASH_ON_PICKUP"
      ? calculateDeposit(totalCents, settings.depositPct)
      : calculateFullPayment(totalCents);

  const phone = normalizePhone(draft.phone);

  const order = await prisma.$transaction(async (tx) => {
    // Verificación final de stock dentro de la transacción: entre que el
    // cliente cargó el carrito y confirmó pudo venderse el último envase.
    for (const item of cart.items) {
      const fresh = await tx.product.findUnique({ where: { id: item.productId } });
      if (!fresh || fresh.stock < item.quantity) {
        throw new Error(`Sin stock: ${item.product.name}`);
      }
    }

    const customer = await tx.customer.upsert({
      where: { phone },
      create: {
        phone,
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email || null,
      },
      update: {
        firstName: draft.firstName,
        lastName: draft.lastName,
        ...(draft.email ? { email: draft.email } : {}),
      },
    });

    if (draft.deliveryMethod === "SHIPPING" && draft.street) {
      const existing = await tx.address.findFirst({
        where: { customerId: customer.id, street: draft.street, number: draft.number },
      });
      if (!existing) {
        await tx.address.create({
          data: {
            customerId: customer.id,
            street: draft.street,
            number: draft.number,
            apartment: draft.apartment || null,
            locality: draft.locality,
            postalCode: draft.postalCode,
            instructions: draft.instructions || null,
            isDefault: true,
          },
        });
      }
    }

    const created = await tx.order.create({
      data: {
        code: await nextOrderCode(),
        status: "NEW",
        customerId: customer.id,
        contactFirstName: draft.firstName,
        contactLastName: draft.lastName,
        contactPhone: phone,
        contactEmail: draft.email || null,
        deliveryMethod: draft.deliveryMethod,
        street: draft.street || null,
        number: draft.number || null,
        apartment: draft.apartment || null,
        locality: draft.locality || null,
        postalCode: draft.postalCode || null,
        instructions: draft.instructions || null,
        shippingZoneId: draft.shippingZoneId || null,
        slotLabel: draft.slotLabel || null,
        paymentMethod,
        subtotalCents,
        shippingCents,
        totalCents,
        depositPct: breakdown.depositPct,
        depositCents: breakdown.depositCents,
        balanceCents: breakdown.balanceCents,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            name: item.product.name,
            image: item.product.image,
            weightGrams: item.product.weightGrams,
            priceCents: item.product.priceCents,
            quantity: item.quantity,
          })),
        },
        payments: {
          create: {
            kind: paymentMethod === "CASH_ON_PICKUP" ? "DEPOSIT" : "FULL",
            status: "PENDING",
            expectedCents: breakdown.depositCents,
            destinationAlias: settings.bankAlias || null,
          },
        },
        events: {
          create: {
            type: "status",
            message: "Pedido recibido desde la tienda.",
          },
        },
      },
    });

    // El stock se descuenta al confirmar el pedido: el envase queda fuera
    // de la tienda mientras se valida el comprobante.
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cart.delete({ where: { id: cart.id } });
    return created;
  });

  await clearCartCookie();
  (await cookies()).delete(CHECKOUT_COOKIE);

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/pedido/${order.code}?t=${order.publicToken}`);
}

/**
 * El cliente informa los datos de la transferencia que hizo. No valida
 * nada: sólo deja registrado qué dice haber pagado, para que en el panel
 * se pueda comparar contra lo esperado antes de aprobar a mano.
 */
export async function reportTransfer(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const paymentId = String(formData.get("paymentId") ?? "");
  const token = String(formData.get("token") ?? "");

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });
  // El token es lo que prueba que quien informa el pago es el dueño del
  // pedido; el código solo no alcanza porque es correlativo.
  if (!payment || payment.order.code !== code || payment.order.publicToken !== token) {
    redirect("/mi-pedido?error=1");
  }
  if (payment.status !== "PENDING") redirect(`/pedido/${code}?t=${token}&informado=ya`);

  const value = (key: string) => String(formData.get(key) ?? "").trim() || null;
  const reported = parsePriceToCents(String(formData.get("amount") ?? ""));

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      reportedCents: reported > 0 ? reported : null,
      senderName: value("senderName"),
      senderTaxId: value("senderTaxId"),
      sourceAlias: value("sourceAlias"),
      operationId: value("operationId"),
      receiptNumber: value("receiptNumber"),
      receiptImage: value("receiptImage"),
      transferredAt: new Date(),
    },
  });

  await prisma.orderEvent.create({
    data: {
      orderId: payment.orderId,
      type: "payment",
      message: "El cliente informó los datos de su transferencia.",
      author: "cliente",
    },
  });

  revalidatePath("/admin/pagos");
  revalidatePath(`/pedido/${code}`);
  redirect(`/pedido/${code}?t=${token}&informado=1`);
}
