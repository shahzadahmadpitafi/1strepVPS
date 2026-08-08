/**
 * Web Push Notification Service
 *
 * - VAPID keys are generated once and stored in the `vapid_settings` DB table.
 * - Subscriptions are stored in `push_subscriptions`.
 * - Call `sendAdminPushNotification()` to push to all subscribed admin sessions.
 */

import webpush, { PushSubscription } from "web-push";
import { db } from "./db";
import { sql } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

// ─── VAPID key initialisation ─────────────────────────────────────────────────

let vapidInitialised = false;
let _publicKey = "";

export async function initialisePush(): Promise<void> {
  if (vapidInitialised) return;

  // Ensure tables exist (called before DB is fully seeded in some test paths)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vapid_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      public_key TEXT NOT NULL,
      private_key TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT 'mailto:info@1strep.com',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh_key TEXT NOT NULL,
      auth_key TEXT NOT NULL,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Try to load keys from env vars first (preferred for production)
  const envPublic = process.env.VAPID_PUBLIC_KEY;
  const envPrivate = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:info@1strep.com";

  if (envPublic && envPrivate) {
    webpush.setVapidDetails(subject, envPublic, envPrivate);
    _publicKey = envPublic;
    vapidInitialised = true;
    console.log("[Push] VAPID keys loaded from environment variables");
    return;
  }

  // Try DB
  const rows = await db.execute(sql`SELECT * FROM vapid_settings WHERE id = 1`);
  const row = (rows as any).rows?.[0];

  if (row) {
    webpush.setVapidDetails(row.subject, row.public_key, row.private_key);
    _publicKey = row.public_key;
    vapidInitialised = true;
    console.log("[Push] VAPID keys loaded from database");
    return;
  }

  // Generate fresh keys and persist
  const keys = webpush.generateVAPIDKeys();
  await db.execute(sql`
    INSERT INTO vapid_settings (id, public_key, private_key, subject)
    VALUES (1, ${keys.publicKey}, ${keys.privateKey}, ${subject})
    ON CONFLICT (id) DO NOTHING
  `);

  webpush.setVapidDetails(subject, keys.publicKey, keys.privateKey);
  _publicKey = keys.publicKey;
  vapidInitialised = true;

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║           [Push] VAPID keys generated and saved             ║");
  console.log("║  Set these env vars to persist across full DB resets:       ║");
  console.log(`║  VAPID_PUBLIC_KEY=${keys.publicKey.slice(0, 44)}... ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
}

export function getVapidPublicKey(): string {
  return _publicKey;
}

// ─── Save / remove subscriptions ─────────────────────────────────────────────

export async function savePushSubscription(
  userId: string,
  subscription: PushSubscription,
  userAgent?: string
): Promise<void> {
  await db.execute(sql`
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, user_agent)
    VALUES (
      ${userId},
      ${subscription.endpoint},
      ${subscription.keys.p256dh},
      ${subscription.keys.auth},
      ${userAgent ?? null}
    )
    ON CONFLICT (endpoint) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      p256dh_key = EXCLUDED.p256dh_key,
      auth_key = EXCLUDED.auth_key,
      user_agent = EXCLUDED.user_agent
  `);
}

export async function removePushSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  await db.execute(sql`
    DELETE FROM push_subscriptions
    WHERE user_id = ${userId} AND endpoint = ${endpoint}
  `);
}

export async function getUserPushSubscriptions(userId: string): Promise<{ endpoint: string }[]> {
  const result = await db.execute(sql`
    SELECT endpoint FROM push_subscriptions WHERE user_id = ${userId}
  `);
  return (result as any).rows ?? [];
}

// ─── Send push to all admin subscribers ──────────────────────────────────────

export async function sendAdminPushNotification(payload: PushPayload): Promise<void> {
  if (!vapidInitialised) return;

  // Get all admin user subscriptions
  const result = await db.execute(sql`
    SELECT ps.endpoint, ps.p256dh_key, ps.auth_key
    FROM push_subscriptions ps
    INNER JOIN users u ON u.id = ps.user_id
    WHERE u.role = 'admin'
  `);
  const subscriptions: Array<{ endpoint: string; p256dh_key: string; auth_key: string }> =
    (result as any).rows ?? [];

  if (!subscriptions.length) return;

  const data = JSON.stringify(payload);
  const staleEndpoints: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSub: PushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
      };
      try {
        await webpush.sendNotification(pushSub, data);
      } catch (err: any) {
        // 404 / 410 = subscription expired / unsubscribed by the browser
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.warn(`[Push] Failed to send to ${sub.endpoint.slice(0, 40)}…:`, err.message);
        }
      }
    })
  );

  // Prune stale subscriptions
  for (const endpoint of staleEndpoints) {
    await db.execute(sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`);
    console.log("[Push] Removed stale subscription");
  }

  if (subscriptions.length) {
    console.log(`[Push] Sent notification to ${subscriptions.length - staleEndpoints.length} admin device(s): "${payload.title}"`);
  }
}
