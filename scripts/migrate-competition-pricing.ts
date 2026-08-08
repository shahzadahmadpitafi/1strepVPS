import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Creating competition subscription tables...");

  // Add dnf_reps column to competition_scores if not exists
  await db.execute(sql`
    ALTER TABLE competition_scores ADD COLUMN IF NOT EXISTS dnf_reps integer;
  `);
  console.log("  ✓ dnf_reps column");

  // Add scores_visible to competition_workouts if not exists
  await db.execute(sql`
    ALTER TABLE competition_workouts ADD COLUMN IF NOT EXISTS scores_visible boolean DEFAULT false;
  `);
  console.log("  ✓ scores_visible column");

  // Add video_proof_url to competition_scores if not exists
  await db.execute(sql`
    ALTER TABLE competition_scores ADD COLUMN IF NOT EXISTS video_proof_url text;
  `);
  console.log("  ✓ video_proof_url column");

  // Add rejection_reason to competition_scores if not exists
  await db.execute(sql`
    ALTER TABLE competition_scores ADD COLUMN IF NOT EXISTS rejection_reason text;
  `);
  console.log("  ✓ rejection_reason column");

  // competition_pricing_config table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS competition_pricing_config (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      tier varchar NOT NULL UNIQUE,
      name varchar NOT NULL,
      price integer NOT NULL DEFAULT 0,
      billing_period varchar NOT NULL DEFAULT 'one_time',
      features jsonb NOT NULL DEFAULT '[]',
      max_competitions integer,
      max_participants_per_comp integer,
      allow_payment_processing boolean NOT NULL DEFAULT false,
      allow_custom_branding boolean NOT NULL DEFAULT false,
      allow_online_qualifiers boolean NOT NULL DEFAULT false,
      allow_spectator_ticketing boolean NOT NULL DEFAULT false,
      is_active boolean NOT NULL DEFAULT true,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  console.log("  ✓ competition_pricing_config table");

  // competition_subscriptions table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS competition_subscriptions (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL,
      tier varchar NOT NULL DEFAULT 'starter',
      status varchar NOT NULL DEFAULT 'active',
      stripe_subscription_id varchar,
      stripe_payment_intent_id varchar,
      current_period_start timestamp,
      current_period_end timestamp,
      competitions_used integer NOT NULL DEFAULT 0,
      competitions_limit integer,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  console.log("  ✓ competition_subscriptions table");

  // Seed default pricing tiers
  const tiers = [
    {
      tier: "starter",
      name: "Starter",
      price: 0,
      billing_period: "free",
      sort_order: 1,
      max_competitions: 1,
      max_participants_per_comp: 30,
      allow_payment_processing: false,
      allow_custom_branding: false,
      allow_online_qualifiers: false,
      allow_spectator_ticketing: false,
      features: JSON.stringify([
        "1 competition",
        "Up to 30 participants",
        "Basic leaderboard",
        "Manual scoring",
        "1stRep branding on leaderboard",
        "Free events only (no payment processing)"
      ]),
    },
    {
      tier: "single",
      name: "Single Event",
      price: 6000,
      billing_period: "one_time",
      sort_order: 2,
      max_competitions: 1,
      max_participants_per_comp: null,
      allow_payment_processing: true,
      allow_custom_branding: false,
      allow_online_qualifiers: false,
      allow_spectator_ticketing: false,
      features: JSON.stringify([
        "1 competition",
        "Unlimited participants",
        "Full live leaderboard",
        "Live scoring & heat management",
        "Stripe payment processing for entries",
        "CSV exports",
        "Custom categories",
      ]),
    },
    {
      tier: "pro",
      name: "Pro Monthly",
      price: 6000,
      billing_period: "monthly",
      sort_order: 3,
      max_competitions: null,
      max_participants_per_comp: null,
      allow_payment_processing: true,
      allow_custom_branding: true,
      allow_online_qualifiers: true,
      allow_spectator_ticketing: true,
      features: JSON.stringify([
        "Unlimited competitions",
        "All Single Event features",
        "Online qualifiers & remote scoring",
        "Scheduled workout release",
        "Spectator ticketing",
        "Custom leaderboard branding",
        "Volunteer management",
        "Priority support",
      ]),
    },
    {
      tier: "white_label",
      name: "White Label",
      price: 0,
      billing_period: "contact",
      sort_order: 4,
      max_competitions: null,
      max_participants_per_comp: null,
      allow_payment_processing: true,
      allow_custom_branding: true,
      allow_online_qualifiers: true,
      allow_spectator_ticketing: true,
      features: JSON.stringify([
        "Everything in Pro",
        "Remove 1stRep branding entirely",
        "Custom domain support",
        "Dedicated account manager",
        "SLA guarantee",
        "Custom integrations on request",
      ]),
    },
  ];

  for (const t of tiers) {
    const existing = await db.execute(sql`SELECT id FROM competition_pricing_config WHERE tier = ${t.tier}`);
    if (existing.rows.length === 0) {
      await db.execute(sql`
        INSERT INTO competition_pricing_config
          (id, tier, name, price, billing_period, features, max_competitions, max_participants_per_comp,
           allow_payment_processing, allow_custom_branding, allow_online_qualifiers, allow_spectator_ticketing,
           is_active, sort_order)
        VALUES
          (gen_random_uuid(), ${t.tier}, ${t.name}, ${t.price}, ${t.billing_period},
           ${t.features}::jsonb, ${t.max_competitions ?? null}, ${t.max_participants_per_comp ?? null},
           ${t.allow_payment_processing}, ${t.allow_custom_branding}, ${t.allow_online_qualifiers},
           ${t.allow_spectator_ticketing}, true, ${t.sort_order})
      `);
      console.log(`  + Tier: ${t.name}`);
    } else {
      console.log(`  ↻ Tier exists: ${t.name}`);
    }
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(e => { console.error(e.message); process.exit(1); });
