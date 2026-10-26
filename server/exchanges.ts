/**
 * Exchanges and order amendments.
 *
 * Exchange (industry-standard flow):
 *  - Customer asks for a different size/colour of the SAME product, within the 30-day return window.
 *  - They send the original back; when the admin marks it "received" the returned item goes back into stock
 *    (see returnRestock.ts) and a free replacement order is created automatically (stock is reserved at that
 *    moment, so we never promise stock we no longer have). If the replacement has sold out in the meantime
 *    nothing is created and the admin refunds instead.
 *
 * Amendments:
 *  - Admin can change the size/colour of an item, or the delivery address, on an order that has not been
 *    dispatched yet (pending / processing). Stock moves from the old variant to the new one atomically and an
 *    audit entry is written to the order history.
 */
import { db } from "./db";
import { sql, eq, and, asc } from "drizzle-orm";
import {
  customerOrders,
  customerOrderItems,
  customerOrderStatusHistory,
  productVariants,
  returnRequests,
} from "@shared/schema";
import { storage } from "./storage";
import { sendEmail } from "./email";

export const EXCHANGE_WINDOW_DAYS = 30;

/** Adds the exchange columns to return_requests (safe to run on every start). */
export async function ensureExchangeColumns(): Promise<void> {
  await db.execute(sql`ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL DEFAULT 'return'`);
  await db.execute(sql`ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS exchange_items TEXT`);
  await db.execute(sql`ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS exchange_order_id VARCHAR`);
  await db.execute(sql`ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS exchange_order_number TEXT`);
}

const sizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "ONE SIZE", "OS"];
const sizeRank = (s: string | null | undefined) => {
  const i = sizeOrder.indexOf(String(s || "").trim().toUpperCase());
  return i === -1 ? 99 : i;
};

export interface VariantOption {
  variantId: string;
  size: string;
  color: string;
  stock: number;
  sku: string | null;
}

/** For each catalogue item of an order: the other live size/colour options of the same product. */
export async function getVariantOptionsForOrder(orderId: string, opts: { inStockOnly: boolean }) {
  const items = await db.select().from(customerOrderItems).where(eq(customerOrderItems.orderId, orderId));
  const result: Array<{
    orderItemId: string;
    productId: string | null;
    productName: string;
    size: string | null;
    color: string | null;
    quantity: number;
    options: VariantOption[];
  }> = [];

  for (const item of items) {
    let options: VariantOption[] = [];
    if (item.productId) {
      const variants = await db
        .select()
        .from(productVariants)
        .where(and(eq(productVariants.productId, item.productId), eq(productVariants.isActive, true)))
        .orderBy(asc(productVariants.color));
      options = variants
        .filter((v) => !(v.size === item.size && v.color === item.color))
        .filter((v) => (opts.inStockOnly ? (v.stockQuantity ?? 0) >= item.quantity : true))
        .map((v) => ({ variantId: v.id, size: v.size, color: v.color, stock: v.stockQuantity ?? 0, sku: v.sku }))
        .sort((a, b) => a.color.localeCompare(b.color) || sizeRank(a.size) - sizeRank(b.size));
    }
    result.push({
      orderItemId: item.id,
      productId: item.productId,
      productName: item.productName,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      options,
    });
  }
  return result;
}

export interface ExchangeItem {
  orderItemId: string;
  productName: string;
  quantity: number;
  fromSize: string | null;
  fromColor: string | null;
  newVariantId: string;
  newSize: string;
  newColor: string;
}

/**
 * Check a customer's exchange request against the order and live stock.
 * Returns the cleaned list to store, or an error message safe to show the customer.
 */
export async function validateExchangeRequest(
  orderId: string,
  requested: Array<{ orderItemId: string; newVariantId: string }>,
): Promise<{ ok: true; items: ExchangeItem[] } | { ok: false; error: string }> {
  if (!Array.isArray(requested) || requested.length === 0) {
    return { ok: false, error: "Please choose the new size or colour for each item you want to exchange." };
  }
  const orderItems = await db.select().from(customerOrderItems).where(eq(customerOrderItems.orderId, orderId));
  const out: ExchangeItem[] = [];
  for (const r of requested) {
    const oi = orderItems.find((i) => i.id === r.orderItemId);
    if (!oi || !oi.productId) return { ok: false, error: "One of the items could not be found on your order." };
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, r.newVariantId));
    if (!variant || variant.productId !== oi.productId || !variant.isActive) {
      return { ok: false, error: `${oi.productName} can only be exchanged for another size or colour of the same item.` };
    }
    if (variant.size === oi.size && variant.color === oi.color) {
      return { ok: false, error: `Please choose a different size or colour for ${oi.productName}.` };
    }
    if ((variant.stockQuantity ?? 0) < oi.quantity) {
      return { ok: false, error: `Sorry, ${oi.productName} in ${variant.size} / ${variant.color} is no longer in stock.` };
    }
    out.push({
      orderItemId: oi.id,
      productName: oi.productName,
      quantity: oi.quantity,
      fromSize: oi.size,
      fromColor: oi.color,
      newVariantId: variant.id,
      newSize: variant.size,
      newColor: variant.color,
    });
  }
  return { ok: true, items: out };
}

export interface ReplacementResult {
  created: boolean;
  orderNumber?: string;
  reason?: string;
}

/** Create the free replacement order for an exchange (once), reserving stock atomically. */
export async function createReplacementOrder(returnId: string, adminUser?: { id: string; name?: string }): Promise<ReplacementResult> {
  const [ret] = await db.select().from(returnRequests).where(eq(returnRequests.id, returnId));
  if (!ret) return { created: false, reason: "Return not found" };
  const r: any = ret;
  if (r.requestType !== "exchange" || !r.exchangeItems) return { created: false, reason: "Not an exchange" };
  if (r.exchangeOrderId) return { created: false, reason: "Replacement already created", orderNumber: r.exchangeOrderNumber };

  const [order] = await db.select().from(customerOrders).where(eq(customerOrders.id, ret.orderId));
  if (!order) return { created: false, reason: "Original order not found" };

  let items: ExchangeItem[] = [];
  try {
    items = JSON.parse(r.exchangeItems);
  } catch {
    return { created: false, reason: "Exchange items could not be read" };
  }
  const originalItems = await db.select().from(customerOrderItems).where(eq(customerOrderItems.orderId, order.id));

  // Reserve stock for every replacement line; undo everything if one line has sold out.
  const reserved: Array<{ variantId: string; quantity: number }> = [];
  for (const it of items) {
    const res = await storage.reduceProductVariantStock(it.newVariantId, it.quantity);
    if (!res.success) {
      for (const done of reserved) {
        await db
          .update(productVariants)
          .set({ stockQuantity: sql`${productVariants.stockQuantity} + ${done.quantity}`, updatedAt: new Date() })
          .where(eq(productVariants.id, done.variantId));
      }
      return {
        created: false,
        reason: `${it.productName} in ${it.newSize} / ${it.newColor} is out of stock now - refund the customer instead, or offer another size.`,
      };
    }
    reserved.push({ variantId: it.newVariantId, quantity: it.quantity });
  }

  // Unique, recognisable order number: EXC-<original number> (-2, -3 ... if a second exchange is made)
  let orderNumber = `EXC-${order.orderNumber}`;
  for (let n = 2; n < 20; n++) {
    const [taken] = await db.select({ id: customerOrders.id }).from(customerOrders).where(eq(customerOrders.orderNumber, orderNumber));
    if (!taken) break;
    orderNumber = `EXC-${order.orderNumber}-${n}`;
  }

  try {
    const [newOrder] = await db
      .insert(customerOrders)
      .values({
        userId: order.userId,
        orderNumber,
        status: "processing",
        customerEmail: order.customerEmail,
        customerFirstName: order.customerFirstName,
        customerLastName: order.customerLastName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingPostalCode: order.shippingPostalCode,
        shippingCountry: order.shippingCountry,
        subtotal: "0.00",
        shippingCost: "0.00",
        taxAmount: "0.00",
        totalAmount: "0.00",
        paymentMethod: "exchange",
        isPaid: true,
        paidAt: new Date(),
        channel: "exchange",
        notes: `Free exchange for order ${order.orderNumber}`,
      })
      .returning();

    for (const it of items) {
      const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, it.newVariantId));
      const original = originalItems.find((o) => o.id === it.orderItemId);
      await db.insert(customerOrderItems).values({
        orderId: newOrder.id,
        productId: original?.productId ?? variant?.productId ?? null,
        productName: it.productName,
        sku: variant?.sku ?? null,
        barcodeDescriptor: variant?.barcodeDescriptor ?? null,
        locationNote: variant?.locationNote ?? null,
        size: it.newSize,
        color: it.newColor,
        quantity: it.quantity,
        unitPrice: "0.00",
        totalPrice: "0.00",
        imageUrl: original?.imageUrl ?? null,
      });
    }

    await db.insert(customerOrderStatusHistory).values({
      orderId: newOrder.id,
      previousStatus: null,
      newStatus: "processing",
      changedBy: adminUser?.id ?? null,
      changedByName: adminUser?.name ?? "System",
      notes: `Exchange replacement for order ${order.orderNumber}`,
    });

    await db.execute(sql`
      UPDATE return_requests SET exchange_order_id = ${newOrder.id}, exchange_order_number = ${orderNumber}, updated_at = NOW()
       WHERE id = ${returnId}
    `);

    // Tell the customer (best effort)
    const lines = items.map((it) => `<li>${it.quantity} x ${it.productName} - ${it.newSize} / ${it.newColor}</li>`).join("");
    sendEmail(
      order.customerEmail,
      `Your 1stRep exchange is on its way (${orderNumber})`,
      `<p>Hi ${order.customerFirstName || "there"},</p>
       <p>We've received your return for order ${order.orderNumber} and are sending your replacement:</p>
       <ul>${lines}</ul>
       <p>Your exchange order number is <strong>${orderNumber}</strong>. There is nothing more to pay. We'll email you the tracking details as soon as it is dispatched.</p>
       <p>Thank you,<br/>1stRep</p>`,
    ).catch(() => {});

    return { created: true, orderNumber };
  } catch (err) {
    console.error("Create replacement order error:", err);
    for (const done of reserved) {
      await db
        .update(productVariants)
        .set({ stockQuantity: sql`${productVariants.stockQuantity} + ${done.quantity}`, updatedAt: new Date() })
        .where(eq(productVariants.id, done.variantId));
    }
    return { created: false, reason: "Could not create the replacement order - stock was not changed. Please try again." };
  }
}

// ─── Amendments (before dispatch) ─────────────────────────────────────────────

const AMENDABLE = ["pending", "processing"];

async function logAmendment(orderId: string, status: any, note: string, admin: { id: string; name?: string }) {
  await db.insert(customerOrderStatusHistory).values({
    orderId,
    previousStatus: status,
    newStatus: status,
    changedBy: admin.id,
    changedByName: admin.name ?? "Admin",
    notes: note,
  });
}

export async function amendOrderItem(
  orderId: string,
  orderItemId: string,
  newVariantId: string,
  admin: { id: string; name?: string },
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const [order] = await db.select().from(customerOrders).where(eq(customerOrders.id, orderId));
  if (!order) return { ok: false, error: "Order not found" };
  if (!AMENDABLE.includes(order.status)) {
    return { ok: false, error: `This order is ${order.status}, so it can no longer be changed. Use an exchange or return instead.` };
  }
  const [item] = await db.select().from(customerOrderItems).where(and(eq(customerOrderItems.id, orderItemId), eq(customerOrderItems.orderId, orderId)));
  if (!item || !item.productId) return { ok: false, error: "Item not found on this order" };

  const [newVariant] = await db.select().from(productVariants).where(eq(productVariants.id, newVariantId));
  if (!newVariant || newVariant.productId !== item.productId || !newVariant.isActive) {
    return { ok: false, error: "The new size/colour must be a live variant of the same product" };
  }
  if (newVariant.size === item.size && newVariant.color === item.color) {
    return { ok: false, error: "That is already the size/colour on the order" };
  }

  // Take the new variant's stock first (fails safely if it has sold out), then give the old one back.
  const taken = await storage.reduceProductVariantStock(newVariant.id, item.quantity);
  if (!taken.success) return { ok: false, error: `Not enough stock: ${taken.error}` };

  const [oldVariant] = await db
    .select()
    .from(productVariants)
    .where(and(eq(productVariants.productId, item.productId), sql`${productVariants.size} IS NOT DISTINCT FROM ${item.size}`, sql`${productVariants.color} IS NOT DISTINCT FROM ${item.color}`));
  if (oldVariant) {
    await db
      .update(productVariants)
      .set({ stockQuantity: sql`${productVariants.stockQuantity} + ${item.quantity}`, updatedAt: new Date() })
      .where(eq(productVariants.id, oldVariant.id));
  }

  await db
    .update(customerOrderItems)
    .set({
      size: newVariant.size,
      color: newVariant.color,
      sku: newVariant.sku ?? item.sku,
      barcodeDescriptor: newVariant.barcodeDescriptor ?? null,
      locationNote: newVariant.locationNote ?? null,
    })
    .where(eq(customerOrderItems.id, item.id));

  const note = `Amended: ${item.productName} ${item.size}/${item.color} -> ${newVariant.size}/${newVariant.color}`;
  await logAmendment(orderId, order.status, note, admin);

  sendEmail(
    order.customerEmail,
    `Your 1stRep order ${order.orderNumber} has been updated`,
    `<p>Hi ${order.customerFirstName || "there"},</p>
     <p>As requested, we've updated your order ${order.orderNumber}:</p>
     <p>${item.productName}: ${item.size} / ${item.color} &rarr; <strong>${newVariant.size} / ${newVariant.color}</strong></p>
     <p>There's nothing more you need to do. We'll email you when it is dispatched.</p>
     <p>Thank you,<br/>1stRep</p>`,
  ).catch(() => {});

  return { ok: true, message: note };
}

export async function amendOrderAddress(
  orderId: string,
  address: { shippingAddress: string; shippingCity: string; shippingPostalCode: string; shippingCountry?: string; customerPhone?: string },
  admin: { id: string; name?: string },
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const [order] = await db.select().from(customerOrders).where(eq(customerOrders.id, orderId));
  if (!order) return { ok: false, error: "Order not found" };
  if (!AMENDABLE.includes(order.status)) {
    return { ok: false, error: `This order is ${order.status}, so the address can no longer be changed.` };
  }
  const line = String(address.shippingAddress || "").trim();
  const city = String(address.shippingCity || "").trim();
  const postcode = String(address.shippingPostalCode || "").trim();
  if (!line || !city || !postcode) return { ok: false, error: "Address, city and postcode are all required" };

  await db
    .update(customerOrders)
    .set({
      shippingAddress: line,
      shippingCity: city,
      shippingPostalCode: postcode,
      shippingCountry: String(address.shippingCountry || order.shippingCountry || "UK").trim(),
      customerPhone: address.customerPhone !== undefined ? String(address.customerPhone).trim() || null : order.customerPhone,
    })
    .where(eq(customerOrders.id, orderId));

  const note = `Amended delivery address: ${order.shippingAddress}, ${order.shippingCity} ${order.shippingPostalCode} -> ${line}, ${city} ${postcode}`;
  await logAmendment(orderId, order.status, note, admin);

  sendEmail(
    order.customerEmail,
    `Your 1stRep order ${order.orderNumber} has been updated`,
    `<p>Hi ${order.customerFirstName || "there"},</p>
     <p>As requested, we've updated the delivery address for order ${order.orderNumber} to:</p>
     <p><strong>${line}, ${city}, ${postcode}</strong></p>
     <p>If this isn't right, please reply to this email straight away.</p>
     <p>Thank you,<br/>1stRep</p>`,
  ).catch(() => {});

  return { ok: true, message: note };
}
