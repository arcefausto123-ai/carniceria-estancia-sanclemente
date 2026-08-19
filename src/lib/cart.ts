import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { getSettings } from "./settings";
import type { Cart, CartItem, Product, Category } from "@prisma/client";

const CART_COOKIE = "esc_cart";

export type CartLine = CartItem & { product: Product & { category: Category } };
export type FullCart = Cart & { items: CartLine[] };

/**
 * Reserva de stock: el carrito tiene un `expiresAt` que se corre hacia
 * adelante en cada cambio. Mientras no venza, sus unidades cuentan como
 * reservadas y no se ofrecen a otro cliente. El plazo sale de
 * Settings.stockHoldMinutes (hoy 10 minutos, editable desde el panel).
 */
export async function holdWindowMs(): Promise<number> {
  const settings = await getSettings();
  return Math.max(1, settings.stockHoldMinutes) * 60_000;
}

async function nextExpiry(): Promise<Date> {
  return new Date(Date.now() + (await holdWindowMs()));
}

/** Lee el carrito actual sin crearlo. */
export async function getCart(): Promise<FullCart | null> {
  const id = (await cookies()).get(CART_COOKIE)?.value;
  if (!id) return null;

  const cart = await prisma.cart.findUnique({
    where: { id },
    include: { items: { include: { product: { include: { category: true } } } } },
  });
  if (!cart || cart.orderId) return null;

  // Vencido: la reserva se soltó, arrancamos limpio.
  if (cart.expiresAt.getTime() < Date.now()) {
    await prisma.cart.delete({ where: { id } }).catch(() => {});
    return null;
  }
  return cart;
}

/** Lee el carrito y lo crea si hace falta. Sólo para Server Actions. */
export async function getOrCreateCart(): Promise<FullCart> {
  const existing = await getCart();
  if (existing) return existing;

  const cart = await prisma.cart.create({
    data: { expiresAt: await nextExpiry() },
    include: { items: { include: { product: { include: { category: true } } } } },
  });
  (await cookies()).set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return cart;
}

export async function clearCartCookie() {
  (await cookies()).delete(CART_COOKIE);
}

/** Empuja el vencimiento de la reserva. Se llama en cada modificación. */
export async function touchCart(cartId: string) {
  await prisma.cart.update({
    where: { id: cartId },
    data: { expiresAt: await nextExpiry() },
  });
}

/**
 * Unidades de un producto retenidas por carritos vivos que no son el mío.
 * Es lo que resta del stock publicado a la hora de mostrar disponibilidad.
 */
export async function reservedElsewhere(productId: string, exceptCartId?: string): Promise<number> {
  const result = await prisma.cartItem.aggregate({
    _sum: { quantity: true },
    where: {
      productId,
      cartId: exceptCartId ? { not: exceptCartId } : undefined,
      cart: { orderId: null, expiresAt: { gt: new Date() } },
    },
  });
  return result._sum.quantity ?? 0;
}

export async function availableStock(product: Product, exceptCartId?: string): Promise<number> {
  return Math.max(0, product.stock - (await reservedElsewhere(product.id, exceptCartId)));
}

export function cartSubtotalCents(cart: FullCart | null): number {
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
}

export function cartCount(cart: FullCart | null): number {
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Borra carritos vencidos, liberando el stock que retenían. */
export async function sweepExpiredCarts(): Promise<number> {
  const { count } = await prisma.cart.deleteMany({
    where: { orderId: null, expiresAt: { lt: new Date() } },
  });
  return count;
}
