/**
 * Automation Execution Service
 *
 * Processes active marketing automations and fires emails for:
 *   - welcome        → new customers registered in the last 2 hours
 *   - abandoned_cart → carts tracked but not yet reminded
 *   - win_back       → customers with no paid order in the last 90 days
 *
 * Called by a cron job in server/index.ts every hour.
 */

import { db } from "./db";
import {
  marketingAutomations,
  automationEnrollments,
  users,
  abandonedCarts,
} from "@shared/schema";
import { eq, and, sql, lt, gt } from "drizzle-orm";
import { sendWelcomeEmail, sendAbandonedCartReminder, sendCustomerEmail } from "./email-service";
import { smsAbandonedCart } from "./sms";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getActiveAutomations(triggerType: string) {
  return db
    .select()
    .from(marketingAutomations)
    .where(
      and(
        eq(marketingAutomations.trigger, triggerType as any),
        eq(marketingAutomations.isActive, true)
      )
    );
}

async function isAlreadyEnrolled(automationId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: automationEnrollments.id })
    .from(automationEnrollments)
    .where(
      and(
        eq(automationEnrollments.automationId, automationId),
        eq(automationEnrollments.userId, userId)
      )
    )
    .limit(1);
  return !!row;
}

async function enroll(automationId: string, userId: string) {
  await db.insert(automationEnrollments).values({
    automationId,
    userId,
    status: "completed",
  });
  await db
    .update(marketingAutomations)
    .set({
      totalTriggered: sql`${marketingAutomations.totalTriggered} + 1`,
      totalCompleted: sql`${marketingAutomations.totalCompleted} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(marketingAutomations.id, automationId));
}

async function bumpTriggered(automationId: string) {
  await db
    .update(marketingAutomations)
    .set({
      totalTriggered: sql`${marketingAutomations.totalTriggered} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(marketingAutomations.id, automationId));
}

// ─── Welcome Series ───────────────────────────────────────────────────────────

export async function processWelcomeAutomations() {
  const automationList = await getActiveAutomations("welcome");
  if (!automationList.length) return;

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const recentUsers = await db
    .select({ id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(and(eq(users.role, "customer"), gt(users.createdAt, twoHoursAgo)));

  if (!recentUsers.length) return;

  let fired = 0;
  for (const automation of automationList) {
    for (const user of recentUsers) {
      if (await isAlreadyEnrolled(automation.id, user.id)) continue;
      try {
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0];
        await sendWelcomeEmail({ name, email: user.email, isReseller: false });
        await enroll(automation.id, user.id);
        fired++;
      } catch (err) {
        console.error(`[Automation:welcome] Failed for user ${user.id}:`, err);
      }
    }
  }
  if (fired) console.log(`[Automation:welcome] Sent ${fired} welcome email(s)`);
}

// ─── Abandoned Cart ───────────────────────────────────────────────────────────

export async function processAbandonedCartAutomations() {
  const automationList = await getActiveAutomations("abandoned_cart");
  if (!automationList.length) return;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const pendingCarts = await db
    .select({
      id: abandonedCarts.id,
      cartId: abandonedCarts.cartId,
      userId: abandonedCarts.userId,
      email: abandonedCarts.email,
      firstName: abandonedCarts.firstName,
      totalValue: abandonedCarts.totalValue,
      itemCount: abandonedCarts.itemCount,
      firstReminderSmsSent: abandonedCarts.firstReminderSmsSent,
      phoneNumber: users.phoneNumber,
    })
    .from(abandonedCarts)
    .leftJoin(users, eq(abandonedCarts.userId, users.id))
    .where(
      and(
        eq(abandonedCarts.firstReminderSent, false),
        eq(abandonedCarts.recovered, false),
        lt(abandonedCarts.createdAt, oneHourAgo)
      )
    );

  if (!pendingCarts.length) return;

  let fired = 0;
  for (const automation of automationList) {
    for (const cart of pendingCarts) {
      if (!cart.email) continue;
      if (cart.userId && await isAlreadyEnrolled(automation.id, cart.userId)) continue;

      try {
        await sendAbandonedCartReminder(
          {
            email: cart.email,
            firstName: cart.firstName || undefined,
            cartId: cart.cartId,
            totalValue: cart.totalValue || "0",
            itemCount: cart.itemCount || 0,
          },
          "first"
        );
        await db
          .update(abandonedCarts)
          .set({ firstReminderSent: true, firstReminderSentAt: new Date() })
          .where(eq(abandonedCarts.id, cart.id));

        if (!cart.firstReminderSmsSent && cart.phoneNumber) {
          smsAbandonedCart(cart.phoneNumber, cart.firstName || "there", (message) => {
            console.error(`[Automation:abandoned_cart] SMS failed for cart ${cart.cartId}: ${message}`);
          });
          await db
            .update(abandonedCarts)
            .set({ firstReminderSmsSent: true, firstReminderSmsSentAt: new Date() })
            .where(eq(abandonedCarts.id, cart.id));
        }

        if (cart.userId) {
          await enroll(automation.id, cart.userId);
        } else {
          await bumpTriggered(automation.id);
        }
        fired++;
      } catch (err) {
        console.error(`[Automation:abandoned_cart] Failed for cart ${cart.cartId}:`, err);
      }
    }
  }
  if (fired) console.log(`[Automation:abandoned_cart] Sent ${fired} abandoned cart reminder(s)`);
}

// ─── Win-Back ─────────────────────────────────────────────────────────────────

export async function processWinBackAutomations() {
  const automationList = await getActiveAutomations("win_back");
  if (!automationList.length) return;

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Customers who have at least one paid order but none in the last 90 days
  const lapsedResult = await db.execute(sql`
    SELECT DISTINCT u.id, u.email, u.first_name
    FROM users u
    WHERE u.role = 'customer'
      AND u.email IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM customer_orders co
        WHERE (co.user_id = u.id OR LOWER(co.customer_email) = LOWER(u.email))
          AND co.is_paid = true
      )
      AND NOT EXISTS (
        SELECT 1 FROM customer_orders co
        WHERE (co.user_id = u.id OR LOWER(co.customer_email) = LOWER(u.email))
          AND co.is_paid = true
          AND co.order_date > ${ninetyDaysAgo}
      )
    LIMIT 200
  `);

  const lapsedUsers: { id: string; email: string; first_name: string | null }[] =
    (lapsedResult as any).rows ?? (Array.isArray(lapsedResult) ? lapsedResult : []);

  if (!lapsedUsers.length) return;

  let fired = 0;
  for (const automation of automationList) {
    for (const user of lapsedUsers) {
      if (await isAlreadyEnrolled(automation.id, user.id)) continue;
      try {
        await sendWinBackEmail({ email: user.email, firstName: user.first_name });
        await enroll(automation.id, user.id);
        fired++;
      } catch (err) {
        console.error(`[Automation:win_back] Failed for user ${user.id}:`, err);
      }
    }
  }
  if (fired) console.log(`[Automation:win_back] Sent ${fired} win-back email(s)`);
}

// ─── Win-Back email ───────────────────────────────────────────────────────────

async function sendWinBackEmail({ email, firstName }: { email: string; firstName?: string | null }) {
  const name = firstName || "there";
  await sendCustomerEmail({
    customerName: name,
    customerEmail: email,
    subject: "We miss you at 1stRep — come back and see what's new",
    message: `It's been a while since your last order and we miss you!\n\nWe've been busy adding new tactical fitness apparel built for those who train hard. From performance tees to durable outerwear, there's plenty of new kit waiting for you.\n\nHead back to the store and see what's arrived since your last visit:\nhttps://1strep.co.uk/shop\n\nWe hope to see you again soon.\n\nThe 1stRep Team`,
    senderName: "The 1stRep Team",
  });
}

// ─── Main runner ──────────────────────────────────────────────────────────────

export async function processAllAutomations() {
  try {
    await Promise.allSettled([
      processWelcomeAutomations(),
      processAbandonedCartAutomations(),
      processWinBackAutomations(),
    ]);
  } catch (err) {
    console.error("[Automation] Runner error:", err);
  }
}
