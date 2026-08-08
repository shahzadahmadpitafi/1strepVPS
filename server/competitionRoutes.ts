import { Express, Request, Response } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./middleware/auth";
import {
  competitions,
  competitionCategories,
  competitionWorkouts,
  competitionRegistrations,
  competitionScores,
  competitionHeats,
  competitionHeatAssignments,
  insertCompetitionSchema,
  insertCompetitionCategorySchema,
  insertCompetitionWorkoutSchema,
  insertCompetitionScoreSchema,
} from "../shared/schema";
import { calculateLeaderboard, refreshLeaderboardCache } from "./services/scoringEngine";
import { getIo } from "./socketServer";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function getSquareClient() {
  const { SquareClient, SquareEnvironment } = await import("square");
  if (!process.env.SQUARE_ACCESS_TOKEN) throw new Error("Square not configured");
  return new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: SquareEnvironment.Production,
  });
}

export function registerCompetitionRoutes(app: Express) {

  // Ensure host enquiries table exists
  db.execute(sql`
    CREATE TABLE IF NOT EXISTS competition_host_enquiries (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      organisation VARCHAR(255),
      event_name VARCHAR(255),
      message TEXT,
      plan VARCHAR(50),
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      approved_tier VARCHAR(50),
      admin_notes TEXT,
      user_id VARCHAR REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      reviewed_at TIMESTAMP
    )
  `).catch(e => console.error("Failed to create competition_host_enquiries table:", e));

  // Ensure promo codes table exists
  db.execute(sql`
    CREATE TABLE IF NOT EXISTS competition_promo_codes (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      competition_id VARCHAR NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
      code VARCHAR(100) NOT NULL,
      discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
      discount_value INTEGER NOT NULL,
      max_uses INTEGER,
      uses_count INTEGER NOT NULL DEFAULT 0,
      expires_at TIMESTAMP,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `).catch(e => console.error("Failed to create competition_promo_codes table:", e));

  // Ensure removed_at and invite_email columns exist on competition_team_members
  // and that user_id is nullable (so we can invite non-registered users by email)
  db.execute(sql`
    ALTER TABLE competition_team_members ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP
  `).catch(e => console.error("Failed to add removed_at to competition_team_members:", e));
  db.execute(sql`
    ALTER TABLE competition_team_members ADD COLUMN IF NOT EXISTS invite_email VARCHAR(255)
  `).catch(e => console.error("Failed to add invite_email to competition_team_members:", e));
  db.execute(sql`
    ALTER TABLE competition_team_members ALTER COLUMN user_id DROP NOT NULL
  `).catch(e => {/* already nullable — ignore */});

  // Ensure promo/discount columns exist on competition_registrations
  db.execute(sql`
    ALTER TABLE competition_registrations
      ADD COLUMN IF NOT EXISTS promo_code_id VARCHAR,
      ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS amount_paid INTEGER NOT NULL DEFAULT 0
  `).catch(e => console.error("Failed to add promo columns to competition_registrations:", e));

  // ── Public routes ────────────────────────────────────────────────────────

  // List public competitions
  app.get("/api/competitions", async (req: Request, res: Response) => {
    try {
      const { filter, location } = req.query;
      let whereClause = `WHERE c.is_public = true AND c.status != 'draft'`;
      if (filter === "upcoming") whereClause += ` AND c.start_date > NOW()`;
      if (filter === "live") whereClause += ` AND c.status = 'live'`;
      if (filter === "past") whereClause += ` AND c.end_date < NOW()`;
      if (location) whereClause += ` AND LOWER(c.location) LIKE LOWER('%${String(location).replace(/'/g, "''")}%')`;

      const result = await db.execute(sql.raw(`
        SELECT c.*,
          (SELECT COUNT(*) FROM competition_categories WHERE competition_id = c.id) as category_count
        FROM competitions c
        ${whereClause}
        ORDER BY c.start_date ASC
        LIMIT 50
      `));
      res.json(result.rows);
    } catch (error) {
      console.error("List competitions error:", error);
      res.status(500).json({ error: "Failed to fetch competitions" });
    }
  });

  // Pricing config (must be before /:slug to prevent route conflict)
  app.get("/api/competitions/pricing-config", async (_req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`SELECT * FROM competition_pricing_config WHERE is_active = true ORDER BY sort_order ASC`);
      res.json(result.rows);
    } catch { res.status(500).json({ error: "Failed to fetch pricing config" }); }
  });

  // My subscription (must be before /:slug)
  app.get("/api/competitions/my-subscription", requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || (req.session as any).userId;
    try {
      const result = await db.execute(sql`
        SELECT cs.*, cpc.name as tier_name, cpc.features, cpc.max_competitions, cpc.allow_payment_processing
        FROM competition_subscriptions cs
        JOIN competition_pricing_config cpc ON cpc.tier = cs.tier
        WHERE cs.user_id = ${userId} AND cs.status = 'active'
        ORDER BY cs.created_at DESC LIMIT 1
      `);
      res.json(result.rows[0] ?? null);
    } catch { res.status(500).json({ error: "Failed to fetch subscription" }); }
  });

  // Subscribe / initiate checkout (must be before /:slug)
  app.post("/api/competitions/subscribe", requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || (req.session as any).userId;
    const { tier } = req.body;
    if (!tier) return res.status(400).json({ error: "Tier required" });
    try {
      const tierRes = await db.execute(sql`SELECT * FROM competition_pricing_config WHERE tier = ${tier} AND is_active = true`);
      if (!tierRes.rows.length) return res.status(404).json({ error: "Tier not found" });
      const t = tierRes.rows[0] as any;
      if (t.price === 0 || t.billing_period === "free") {
        await db.execute(sql`
          INSERT INTO competition_subscriptions (id, user_id, tier, status, competitions_limit, created_at, updated_at)
          VALUES (gen_random_uuid(), ${userId}, ${tier}, 'active', ${t.max_competitions || null}, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `);
        return res.json({ success: true, tier, redirectUrl: "/organiser" });
      }
      // For paid tiers: send to host enquiry form so the 1stRep team can assist
      return res.json({ checkoutUrl: `/competitions/host?plan=${tier}` });
    } catch { res.status(500).json({ error: "Failed to create subscription" }); }
  });

  // My competitions (must be before /:slug)
  app.get("/api/competitions/my/registrations", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const userRow = await db.execute(sql`SELECT email FROM users WHERE id = ${userId}`);
      const userEmail = ((userRow.rows[0] as any)?.email ?? "").toLowerCase();

      const result = await db.execute(sql`
        SELECT DISTINCT ON (cr.id)
          cr.*, c.name as competition_name, c.slug, c.start_date, c.end_date,
          c.entry_fee, c.currency,
          c.location, c.venue, c.banner_image, c.status as competition_status,
          c.format as competition_format, c.waiver_text, cc.name as category_name,
          -- Heat assignment
          ch.heat_number, ch.start_time as heat_start_time,
          cha.lane_number,
          cw.name as workout_name,
          -- Role: captain if registered directly, member if via team invite
          CASE WHEN cr.user_id = ${userId} THEN 'captain' ELSE 'member' END as my_role
        FROM competition_registrations cr
        JOIN competitions c ON c.id = cr.competition_id
        JOIN competition_categories cc ON cc.id = cr.category_id
        LEFT JOIN competition_heat_assignments cha ON cha.registration_id = cr.id
        LEFT JOIN competition_heats ch ON ch.id = cha.heat_id
        LEFT JOIN competition_workouts cw ON cw.id = ch.workout_id AND cw.sort_order = (
          SELECT MIN(sort_order) FROM competition_workouts WHERE competition_id = c.id
        )
        WHERE cr.user_id = ${userId}
          OR cr.id IN (
            SELECT ctm.registration_id FROM competition_team_members ctm
            WHERE (ctm.user_id = ${userId}
              OR (ctm.user_id IS NULL AND LOWER(ctm.invite_email) = ${userEmail}))
              AND ctm.invite_status = 'accepted'
              AND ctm.removed_at IS NULL
          )
        ORDER BY cr.id, c.start_date DESC
      `);

      const rows = result.rows as any[];
      const enriched = await Promise.all(rows.map(async (row) => {
        // Determine if the current user has personally signed the waiver
        let myWaiverSigned = false;
        if (row.my_role === 'captain') {
          // Registrant — use cr.waiver_signed
          myWaiverSigned = !!row.waiver_signed;
        } else {
          // Team member — look up their CTM row
          const ctmRow = await db.execute(sql`
            SELECT ctm.waiver_signed FROM competition_team_members ctm
            WHERE ctm.registration_id = ${row.id}
              AND (ctm.user_id = ${userId}
                OR (ctm.user_id IS NULL AND LOWER(ctm.invite_email) = ${userEmail}))
              AND ctm.removed_at IS NULL
            LIMIT 1
          `);
          myWaiverSigned = !!((ctmRow.rows[0] as any)?.waiver_signed);
        }

        if (row.competition_format && row.competition_format !== "individual") {
          const members = await db.execute(sql`
            SELECT ctm.id, ctm.user_id, ctm.invite_status, ctm.role, ctm.shirt_size,
              ctm.waiver_signed, ctm.invite_email,
              COALESCE(u.first_name, '(Invited)') as first_name,
              COALESCE(u.last_name, '') as last_name,
              COALESCE(u.email, ctm.invite_email) as email
            FROM competition_team_members ctm
            LEFT JOIN users u ON u.id = ctm.user_id
            WHERE ctm.registration_id = ${row.id} AND ctm.removed_at IS NULL
            ORDER BY ctm.invited_at ASC
          `);
          return { ...row, team_members: members.rows, my_waiver_signed: myWaiverSigned };
        }
        return { ...row, team_members: [], my_waiver_signed: myWaiverSigned };
      }));

      res.json(enriched);
    } catch (error) {
      console.error("My registrations error:", error);
      res.status(500).json({ error: "Failed to fetch your competitions" });
    }
  });

  // POST /api/competitions/registrations/:regId/sign-waiver
  // Athlete signs the waiver for their own registration or CTM membership
  app.post("/api/competitions/registrations/:regId/sign-waiver", requireAuth, async (req: Request, res: Response) => {
    try {
      const { regId } = req.params;
      const userId = (req.session as any).userId;
      const userRow = await db.execute(sql`SELECT email FROM users WHERE id = ${userId}`);
      const userEmail = ((userRow.rows[0] as any)?.email ?? "").toLowerCase();

      // Check this registration exists and has a waiver
      const regRow = await db.execute(sql`
        SELECT cr.id, cr.user_id, c.waiver_text
        FROM competition_registrations cr
        JOIN competitions c ON c.id = cr.competition_id
        WHERE cr.id = ${regId}
      `);
      if (!regRow.rows.length) return res.status(404).json({ error: "Registration not found" });
      const reg = regRow.rows[0] as any;
      if (!reg.waiver_text) return res.status(400).json({ error: "This competition has no waiver" });

      let updated = false;

      // If user is the registrant, update competition_registrations
      if (reg.user_id === userId) {
        await db.execute(sql`
          UPDATE competition_registrations
          SET waiver_signed = true, waiver_signed_at = NOW()
          WHERE id = ${regId} AND user_id = ${userId}
        `);
        updated = true;
      }

      // Also update CTM row if they're a team member under this registration
      const ctmUpdate = await db.execute(sql`
        UPDATE competition_team_members
        SET waiver_signed = true, waiver_signed_at = NOW()
        WHERE registration_id = ${regId}
          AND (user_id = ${userId}
            OR (user_id IS NULL AND LOWER(invite_email) = ${userEmail}))
          AND removed_at IS NULL
        RETURNING id
      `);
      if (ctmUpdate.rows.length > 0) updated = true;

      if (!updated) return res.status(403).json({ error: "You do not have access to this registration" });

      res.json({ success: true });
    } catch (error) {
      console.error("Sign waiver error:", error);
      res.status(500).json({ error: "Failed to sign waiver" });
    }
  });

  // PATCH /api/competitions/registrations/:regId/shirt-size
  // Athletes can update their own shirt size on any registration they own or are an invited member of
  app.patch("/api/competitions/registrations/:regId/shirt-size", requireAuth, async (req: Request, res: Response) => {
    try {
      const { regId } = req.params;
      const userId = (req.session as any).userId;
      const { shirtSize } = req.body;

      const VALID_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
      if (shirtSize && !VALID_SIZES.includes(shirtSize)) {
        return res.status(400).json({ error: "Invalid shirt size" });
      }

      // Update on competition_registrations if user is the registrant
      const regUpdate = await db.execute(sql`
        UPDATE competition_registrations
        SET shirt_size = ${shirtSize || null}
        WHERE id = ${regId} AND user_id = ${userId}
        RETURNING id
      `);

      // Also update their CTM row if they're an invited member under this registration
      await db.execute(sql`
        UPDATE competition_team_members
        SET shirt_size = ${shirtSize || null}
        WHERE registration_id = ${regId}
          AND (user_id = ${userId}
            OR (user_id IS NULL AND LOWER(invite_email) = (
              SELECT LOWER(email) FROM users WHERE id = ${userId}
            )))
          AND removed_at IS NULL
      `);

      // If neither update matched, verify they at least have a CTM row (member scenario)
      if (regUpdate.rows.length === 0) {
        const ctmCheck = await db.execute(sql`
          SELECT ctm.id FROM competition_team_members ctm
          WHERE ctm.registration_id = ${regId}
            AND (ctm.user_id = ${userId}
              OR (ctm.user_id IS NULL AND LOWER(ctm.invite_email) = (
                SELECT LOWER(email) FROM users WHERE id = ${userId}
              )))
            AND ctm.removed_at IS NULL
        `);
        if (ctmCheck.rows.length === 0) {
          return res.status(403).json({ error: "You do not have access to this registration" });
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Update shirt size error:", error);
      res.status(500).json({ error: "Failed to update shirt size" });
    }
  });

  // Get pending team invitations for the current user (as an invited member, not a captain)
  app.get("/api/competitions/my/team-invites", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      // Get current user's email for matching email-only invites
      const userRow = await db.execute(sql`SELECT email FROM users WHERE id = ${userId}`);
      const userEmail = (userRow.rows[0] as any)?.email ?? "";
      const result = await db.execute(sql`
        SELECT
          ctm.id as member_id,
          ctm.invite_status,
          ctm.registration_id,
          c.name as competition_name,
          c.slug,
          c.start_date,
          c.end_date,
          c.location,
          c.venue,
          c.waiver_text,
          cr.team_name,
          u.first_name as captain_first_name,
          u.last_name as captain_last_name
        FROM competition_team_members ctm
        JOIN competition_registrations cr ON cr.id = ctm.registration_id
        JOIN competitions c ON c.id = cr.competition_id
        JOIN users u ON u.id = cr.user_id
        WHERE (
          ctm.user_id = ${userId}
          OR (ctm.user_id IS NULL AND LOWER(ctm.invite_email) = LOWER(${userEmail}))
        )
          AND ctm.invite_status = 'pending'
          AND ctm.removed_at IS NULL
        ORDER BY c.start_date ASC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("My team invites error:", error);
      res.status(500).json({ error: "Failed to fetch team invitations" });
    }
  });

  // Host enquiry (must be before /:slug)
  app.post("/api/competitions/host-enquiry", async (req: Request, res: Response) => {
    try {
      const { name, email, organisation, eventName, message, plan } = req.body;
      if (!name || !email) return res.status(400).json({ error: "Name and email required" });

      // Look up existing user by email
      const userRes = await db.execute(sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`);
      const userId = userRes.rows[0]?.id ?? null;

      // Save to DB
      await db.execute(sql`
        INSERT INTO competition_host_enquiries (id, name, email, organisation, event_name, message, plan, user_id)
        VALUES (gen_random_uuid(), ${name}, ${email}, ${organisation || null}, ${eventName || null}, ${message || null}, ${plan || null}, ${userId})
      `);

      try {
        const { sendEmail } = await import("./email");
        await sendEmail(
          "info@1strep.com",
          `Competition Hosting Enquiry — ${eventName || "New Enquiry"}${plan ? ` [${plan}]` : ""}`,
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2>Competition Hosting Enquiry</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Organisation:</strong> ${organisation || "—"}</p><p><strong>Event Name:</strong> ${eventName || "—"}</p>${plan ? `<p><strong>Plan Interest:</strong> ${plan}</p>` : ""}<p><strong>Message:</strong><br>${message?.replace(/\n/g, "<br>") || "—"}</p><hr><p style="color:#666;font-size:12px;">Manage in Admin: competitions@1strep.com — approve via admin panel</p></div>`,
        );
        await sendEmail(
          email,
          "We've received your competition hosting enquiry — 1stRep",
          `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0d0d0d; color: #f5f5f0; padding: 32px; border-radius: 8px;"><div style="text-align: center; margin-bottom: 24px;"><span style="color: #C9A84C; font-weight: 900; font-size: 20px; letter-spacing: 0.1em;">1STREP</span></div><h2 style="color: #ffffff;">Thanks, ${name}!</h2><p style="color: #aaaaaa; line-height: 1.6;">We've received your enquiry about hosting <strong style="color: #ffffff;">${eventName || "your competition"}</strong> on the 1stRep platform.</p><p style="color: #aaaaaa; line-height: 1.6;">A member of our team will be in touch within 1 business day.</p><p style="color: #666666; font-size: 13px;">— The 1stRep Team</p></div>`,
        );
      } catch (emailErr) {
        console.error("Failed to send host enquiry email:", emailErr);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Host enquiry error:", error);
      res.status(500).json({ error: "Failed to submit enquiry" });
    }
  });

  // Get competition by slug (public)
  app.get("/api/competitions/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const result = await db.execute(sql`
        SELECT c.*, u.email as organiser_email,
          u.first_name || ' ' || u.last_name as organiser_name
        FROM competitions c
        LEFT JOIN users u ON u.id = c.organiser_id
        WHERE c.slug = ${slug} AND (c.is_public = true OR c.status != 'draft')
      `);
      if (result.rows.length === 0) return res.status(404).json({ error: "Competition not found" });

      const competition = result.rows[0] as any;
      const categories = await db.execute(sql`
        SELECT * FROM competition_categories WHERE competition_id = ${competition.id} ORDER BY name
      `);
      competition.categories = categories.rows;
      res.json(competition);
    } catch (error) {
      console.error("Get competition error:", error);
      res.status(500).json({ error: "Failed to fetch competition" });
    }
  });

  // Get public workouts for a competition
  app.get("/api/competitions/:slug/workouts", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const comp = await db.execute(sql`SELECT id FROM competitions WHERE slug = ${slug}`);
      if (comp.rows.length === 0) return res.status(404).json({ error: "Not found" });
      const compId = (comp.rows[0] as any).id;

      const userId = (req.session as any)?.userId;
      const isAdmin = userId ? await db.execute(sql`SELECT id FROM users WHERE id = ${userId} AND role = 'admin'`) : { rows: [] };

      if (isAdmin.rows.length > 0) {
        const workouts = await db.execute(sql`SELECT * FROM competition_workouts WHERE competition_id = ${compId} ORDER BY sort_order`);
        res.json(workouts.rows);
      } else {
        const workouts = await db.execute(sql`
          SELECT id, competition_id, sort_order, is_public,
            CASE WHEN is_public THEN name ELSE NULL END as name,
            CASE WHEN is_public THEN description ELSE NULL END as description,
            CASE WHEN is_public THEN type ELSE NULL END as type,
            CASE WHEN is_public THEN time_cap ELSE NULL END as time_cap,
            CASE WHEN is_public THEN scores_visible ELSE NULL END as scores_visible,
            CASE WHEN is_public THEN submission_deadline ELSE NULL END as submission_deadline
          FROM competition_workouts WHERE competition_id = ${compId}
          ORDER BY sort_order
        `);
        res.json(workouts.rows);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workouts" });
    }
  });

  // Get leaderboard
  app.get("/api/competitions/:slug/leaderboard", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const { categoryId } = req.query;

      const comp = await db.execute(sql`SELECT id FROM competitions WHERE slug = ${slug}`);
      if (comp.rows.length === 0) return res.status(404).json({ error: "Not found" });
      const compId = (comp.rows[0] as any).id;

      if (!categoryId) {
        const cats = await db.execute(sql`SELECT id FROM competition_categories WHERE competition_id = ${compId} LIMIT 1`);
        if (cats.rows.length === 0) return res.json([]);
        const entries = await calculateLeaderboard(compId, (cats.rows[0] as any).id);
        return res.json(entries);
      }

      const entries = await calculateLeaderboard(compId, String(categoryId));
      res.json(entries);
    } catch (error) {
      console.error("Leaderboard error:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Get heat schedule
  app.get("/api/competitions/:slug/schedule", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const comp = await db.execute(sql`SELECT id FROM competitions WHERE slug = ${slug}`);
      if (comp.rows.length === 0) return res.status(404).json({ error: "Not found" });
      const compId = (comp.rows[0] as any).id;

      const schedule = await db.execute(sql`
        SELECT ch.*, cw.name as workout_name, cw.sort_order,
          json_agg(
            json_build_object(
              'assignmentId', cha.id,
              'registrationId', cha.registration_id,
              'laneNumber', cha.lane_number,
              'teamName', cr.team_name,
              'userName', u.first_name || ' ' || u.last_name
            ) ORDER BY cha.lane_number
          ) FILTER (WHERE cha.id IS NOT NULL) as assignments
        FROM competition_heats ch
        JOIN competition_workouts cw ON cw.id = ch.workout_id
        LEFT JOIN competition_heat_assignments cha ON cha.heat_id = ch.id
        LEFT JOIN competition_registrations cr ON cr.id = cha.registration_id
        LEFT JOIN users u ON u.id = cr.user_id
        WHERE cw.competition_id = ${compId}
        GROUP BY ch.id, cw.name, cw.sort_order
        ORDER BY cw.sort_order, ch.heat_number
      `);
      res.json(schedule.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedule" });
    }
  });

  // Validate promo code
  app.post("/api/competitions/:slug/promo/validate", requireAuth, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Code required" });

      const comp = await db.execute(sql`SELECT id, entry_fee FROM competitions WHERE slug = ${slug}`);
      if (!comp.rows.length) return res.status(404).json({ error: "Competition not found" });
      const competition = comp.rows[0] as any;

      const promo = await db.execute(sql`
        SELECT * FROM competition_promo_codes
        WHERE competition_id = ${competition.id} AND UPPER(code) = UPPER(${code}) AND is_active = true
      `);
      if (!promo.rows.length) return res.status(404).json({ error: "Invalid or expired promo code" });
      const p = promo.rows[0] as any;

      if (p.expires_at && new Date(p.expires_at) < new Date()) return res.status(400).json({ error: "This promo code has expired" });
      if (p.max_uses !== null && p.uses_count >= p.max_uses) return res.status(400).json({ error: "This promo code has reached its usage limit" });

      let discountAmount = 0;
      if (p.discount_type === "percentage") {
        discountAmount = Math.floor(competition.entry_fee * p.discount_value / 100);
      } else {
        discountAmount = Math.min(p.discount_value, competition.entry_fee);
      }
      const finalAmount = Math.max(0, competition.entry_fee - discountAmount);

      res.json({ valid: true, promoCodeId: p.id, discountAmount, finalAmount, discountType: p.discount_type, discountValue: p.discount_value });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate promo code" });
    }
  });

  // ── FREE registration route (no payment required) ────────────────────────
  app.post("/api/competitions/:slug/register", requireAuth, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const userId = (req.session as any).userId;
      const { categoryId, teamName, waiverSigned, promoCodeId, shirtSize } = req.body;

      if (!categoryId) return res.status(400).json({ error: "Category is required" });

      const comp = await db.execute(sql`
        SELECT * FROM competitions WHERE slug = ${slug} AND status = 'registration_open'
      `);
      if (comp.rows.length === 0) return res.status(404).json({ error: "Competition not found or registration is not open" });
      const competition = comp.rows[0] as any;

      // Only enforce waiver if this competition actually has waiver text
      if (competition.waiver_text && !waiverSigned) {
        return res.status(400).json({ error: "You must sign the waiver to register" });
      }

      // Check overall competition capacity
      if (competition.max_participants && competition.current_participants >= competition.max_participants) {
        return res.status(409).json({ error: "This competition is full" });
      }

      // Check if already registered (allow re-attempt if previous is pending/unpaid)
      const existing = await db.execute(sql`
        SELECT id, status, payment_status FROM competition_registrations
        WHERE competition_id = ${competition.id} AND user_id = ${userId}
      `);
      if (existing.rows.length > 0) {
        const ex = existing.rows[0] as any;
        if (ex.payment_status === "paid" || ex.status === "confirmed" || ex.status === "checked_in") {
          return res.status(409).json({ error: "You are already registered for this competition" });
        }
        // Clean up stale pending registration
        await db.execute(sql`DELETE FROM competition_registrations WHERE id = ${ex.id}`);
        await db.execute(sql`UPDATE competitions SET current_participants = GREATEST(0, current_participants - 1) WHERE id = ${competition.id}`);
        await db.execute(sql`UPDATE competition_categories SET current_participants = GREATEST(0, current_participants - 1) WHERE id = ${categoryId}`);
      }

      // Check category capacity
      const category = await db.execute(sql`
        SELECT * FROM competition_categories WHERE id = ${categoryId} AND competition_id = ${competition.id}
      `);
      if (category.rows.length === 0) return res.status(404).json({ error: "Category not found" });
      const cat = category.rows[0] as any;
      if (cat.max_participants && cat.current_participants >= cat.max_participants) {
        return res.status(409).json({ error: "This category is full" });
      }

      // Resolve promo code
      let discountAmount = 0;
      let resolvedPromoCodeId: string | null = null;
      if (promoCodeId && competition.entry_fee > 0) {
        const promoRow = await db.execute(sql`
          SELECT * FROM competition_promo_codes
          WHERE id = ${promoCodeId} AND competition_id = ${competition.id} AND is_active = true
        `);
        if (promoRow.rows.length > 0) {
          const p = promoRow.rows[0] as any;
          if ((!p.expires_at || new Date(p.expires_at) > new Date()) && (p.max_uses === null || p.uses_count < p.max_uses)) {
            discountAmount = p.discount_type === "percentage"
              ? Math.floor(competition.entry_fee * p.discount_value / 100)
              : Math.min(p.discount_value, competition.entry_fee);
            resolvedPromoCodeId = p.id;
          }
        }
      }
      const amountToPay = Math.max(0, competition.entry_fee - discountAmount);

      // This route should only be used for free/zero-amount registrations
      if (amountToPay > 0) {
        return res.status(400).json({ error: "This competition requires payment — use the Square checkout flow", requiresPayment: true, amountToPay });
      }

      const reg = await db.execute(sql`
        INSERT INTO competition_registrations
          (id, competition_id, category_id, user_id, team_name, status, payment_status, waiver_signed, waiver_signed_at, promo_code_id, discount_amount, amount_paid, shirt_size)
        VALUES
          (gen_random_uuid(), ${competition.id}, ${categoryId}, ${userId}, ${teamName || null}, 'confirmed', 'paid', true, NOW(), ${resolvedPromoCodeId}, ${discountAmount}, 0, ${shirtSize || null})
        RETURNING *
      `);

      await db.execute(sql`UPDATE competition_categories SET current_participants = current_participants + 1 WHERE id = ${categoryId}`);
      await db.execute(sql`UPDATE competitions SET current_participants = current_participants + 1 WHERE id = ${competition.id}`);

      if (resolvedPromoCodeId) {
        await db.execute(sql`UPDATE competition_promo_codes SET uses_count = uses_count + 1 WHERE id = ${resolvedPromoCodeId}`);
      }

      const io = getIo();
      if (io) {
        io.to("admin").emit("competition:registration", { competitionName: competition.name, competitionId: competition.id });
      }

      res.json({ registration: reg.rows[0], amountToPay: 0 });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Failed to register" });
    }
  });

  // ── SQUARE PAY-FIRST FLOW: Step 1 — create Square checkout (NO registration created) ──
  app.post("/api/competitions/:slug/create-square-checkout", requireAuth, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const userId = (req.session as any).userId;
      const { categoryId, promoCodeId } = req.body;

      if (!categoryId) return res.status(400).json({ error: "Category is required" });

      const comp = await db.execute(sql`
        SELECT * FROM competitions WHERE slug = ${slug} AND status = 'registration_open'
      `);
      if (!comp.rows.length) return res.status(404).json({ error: "Competition not found or registration is not open" });
      const competition = comp.rows[0] as any;

      if (!competition.entry_fee || competition.entry_fee === 0) {
        return res.status(400).json({ error: "This is a free competition — use the direct registration route" });
      }

      // Check overall capacity
      if (competition.max_participants && competition.current_participants >= competition.max_participants) {
        return res.status(409).json({ error: "This competition is full" });
      }

      // Check already confirmed/paid (no duplicate)
      const existing = await db.execute(sql`
        SELECT id, status, payment_status FROM competition_registrations
        WHERE competition_id = ${competition.id} AND user_id = ${userId}
      `);
      if (existing.rows.length > 0) {
        const ex = existing.rows[0] as any;
        if (ex.payment_status === "paid" || ex.status === "confirmed" || ex.status === "checked_in") {
          return res.status(409).json({ error: "You are already registered for this competition" });
        }
      }

      // Check category capacity
      const category = await db.execute(sql`
        SELECT * FROM competition_categories WHERE id = ${categoryId} AND competition_id = ${competition.id}
      `);
      if (!category.rows.length) return res.status(404).json({ error: "Category not found" });
      const cat = category.rows[0] as any;
      if (cat.max_participants && cat.current_participants >= cat.max_participants) {
        return res.status(409).json({ error: "This category is full" });
      }

      // Resolve promo discount
      let discountAmount = 0;
      let resolvedPromoCodeId: string | null = null;
      if (promoCodeId) {
        const promoRow = await db.execute(sql`
          SELECT * FROM competition_promo_codes
          WHERE id = ${promoCodeId} AND competition_id = ${competition.id} AND is_active = true
        `);
        if (promoRow.rows.length > 0) {
          const p = promoRow.rows[0] as any;
          if ((!p.expires_at || new Date(p.expires_at) > new Date()) && (p.max_uses === null || p.uses_count < p.max_uses)) {
            discountAmount = p.discount_type === "percentage"
              ? Math.floor(competition.entry_fee * p.discount_value / 100)
              : Math.min(p.discount_value, competition.entry_fee);
            resolvedPromoCodeId = p.id;
          }
        }
      }

      const amountToPay = Math.max(0, competition.entry_fee - discountAmount);
      if (amountToPay === 0) {
        return res.status(400).json({ error: "Amount after discount is £0 — use the free registration route", amountZero: true });
      }

      // Get user email for checkout pre-fill
      const userRow = await db.execute(sql`SELECT email FROM users WHERE id = ${userId}`);
      const userEmail = (userRow.rows[0] as any)?.email;

      const squareClient = await getSquareClient();
      const { default: crypto } = await import("crypto");
      const locationId = process.env.SQUARE_LOCATION_ID;
      if (!locationId) return res.status(500).json({ error: "Square location not configured" });

      const currency = (competition.currency || "GBP").toUpperCase();
      // referenceId encodes userId+slug to validate on confirm (max 40 chars)
      const referenceId = `COMP-${userId.slice(0, 8)}-${Date.now().toString(36)}`.slice(0, 40);

      const origin = `${req.protocol}://${req.get("host")}`;
      const redirectUrl = `${origin}/competitions/${slug}?payment_complete=1`;

      const checkoutRes = await squareClient.checkout.paymentLinks.create({
        idempotencyKey: crypto.randomUUID(),
        order: {
          locationId,
          referenceId,
          lineItems: [{
            name: `${competition.name} — Entry${promoCodeId && discountAmount > 0 ? " (Promo Applied)" : ""}`,
            quantity: "1",
            basePriceMoney: { amount: BigInt(amountToPay), currency },
          }],
        },
        checkoutOptions: {
          redirectUrl,
          prePopulateBuyerEmail: userEmail,
          acceptedPaymentMethods: { applePay: true, googlePay: true },
          askForShippingAddress: false,
        },
      });

      const paymentLinkId = checkoutRes.paymentLink?.id || "";
      const checkoutUrl = checkoutRes.paymentLink?.url || "";

      console.log(`[Competition] Square checkout created for user ${userId}, competition ${slug}: ${paymentLinkId}`);

      res.json({
        checkoutUrl,
        squarePaymentLinkId: paymentLinkId,
        referenceId,
        amountToPay,
        discountAmount,
        resolvedPromoCodeId,
        currency,
      });
    } catch (error: any) {
      console.error("[Competition] create-square-checkout error:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout" });
    }
  });

  // ── SQUARE PAY-FIRST FLOW: Step 2 — confirm registration after Square payment ──
  app.post("/api/competitions/:slug/confirm-square-registration", requireAuth, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const userId = (req.session as any).userId;
      const { squarePaymentLinkId, categoryId, teamName, waiverSigned, promoCodeId, discountAmount: clientDiscountAmount, shirtSize } = req.body;

      if (!squarePaymentLinkId) return res.status(400).json({ error: "squarePaymentLinkId is required" });
      if (!categoryId) return res.status(400).json({ error: "Category is required" });
      if (!waiverSigned) return res.status(400).json({ error: "You must agree to the waiver" });

      // Verify payment with Square
      const squareClient = await getSquareClient();
      let paid = false;
      let squareOrderId: string | undefined;
      let amountPaid = 0;

      try {
        const linkRes = await squareClient.checkout.paymentLinks.get({ id: squarePaymentLinkId });
        squareOrderId = linkRes.paymentLink?.orderId;
        if (squareOrderId) {
          const orderRes = await squareClient.orders.get({ orderId: squareOrderId });
          const order = orderRes.order;
          if (order?.state === "COMPLETED" || (order?.tenders && order.tenders.length > 0)) {
            paid = true;
            amountPaid = Number(order.tenders?.[0]?.amountMoney?.amount || 0);
          }
        }
      } catch (e) {
        console.error("[Competition] Square verification error:", e);
      }

      if (!paid) return res.status(402).json({ error: "Payment not confirmed yet. If you completed payment, please wait a moment and try again.", paid: false });

      // Load competition
      const comp = await db.execute(sql`SELECT * FROM competitions WHERE slug = ${slug}`);
      if (!comp.rows.length) return res.status(404).json({ error: "Competition not found" });
      const competition = comp.rows[0] as any;

      // Idempotency: if already confirmed (same squarePaymentLinkId stored), return it
      const existingByPayment = await db.execute(sql`
        SELECT * FROM competition_registrations
        WHERE stripe_payment_intent_id = ${squarePaymentLinkId} AND competition_id = ${competition.id}
      `);
      if (existingByPayment.rows.length > 0) {
        return res.json({ registration: existingByPayment.rows[0], alreadyConfirmed: true });
      }

      // Check for any existing confirmed registration for this user
      const existing = await db.execute(sql`
        SELECT id, status, payment_status FROM competition_registrations
        WHERE competition_id = ${competition.id} AND user_id = ${userId}
      `);
      if (existing.rows.length > 0) {
        const ex = existing.rows[0] as any;
        if (ex.payment_status === "paid" || ex.status === "confirmed" || ex.status === "checked_in") {
          return res.json({ registration: ex, alreadyConfirmed: true });
        }
        // Remove stale pending
        await db.execute(sql`DELETE FROM competition_registrations WHERE id = ${ex.id}`);
        await db.execute(sql`UPDATE competitions SET current_participants = GREATEST(0, current_participants - 1) WHERE id = ${competition.id}`);
        await db.execute(sql`UPDATE competition_categories SET current_participants = GREATEST(0, current_participants - 1) WHERE id = ${categoryId}`);
      }

      // Resolve promo code server-side for discount amount (don't trust client)
      let discountAmount = 0;
      let resolvedPromoCodeId: string | null = null;
      if (promoCodeId) {
        const promoRow = await db.execute(sql`
          SELECT * FROM competition_promo_codes
          WHERE id = ${promoCodeId} AND competition_id = ${competition.id} AND is_active = true
        `);
        if (promoRow.rows.length > 0) {
          const p = promoRow.rows[0] as any;
          if ((!p.expires_at || new Date(p.expires_at) > new Date()) && (p.max_uses === null || p.uses_count < p.max_uses)) {
            discountAmount = p.discount_type === "percentage"
              ? Math.floor(competition.entry_fee * p.discount_value / 100)
              : Math.min(p.discount_value, competition.entry_fee);
            resolvedPromoCodeId = p.id;
          }
        }
      }

      // Create confirmed registration — only now, after payment verified
      const reg = await db.execute(sql`
        INSERT INTO competition_registrations
          (id, competition_id, category_id, user_id, team_name, status, payment_status,
           waiver_signed, waiver_signed_at, promo_code_id, discount_amount, amount_paid,
           stripe_payment_intent_id, shirt_size)
        VALUES
          (gen_random_uuid(), ${competition.id}, ${categoryId}, ${userId},
           ${teamName || null}, 'confirmed', 'paid',
           true, NOW(), ${resolvedPromoCodeId}, ${discountAmount}, ${amountPaid},
           ${squarePaymentLinkId}, ${shirtSize || null})
        RETURNING *
      `);

      await db.execute(sql`UPDATE competition_categories SET current_participants = current_participants + 1 WHERE id = ${categoryId}`);
      await db.execute(sql`UPDATE competitions SET current_participants = current_participants + 1 WHERE id = ${competition.id}`);

      if (resolvedPromoCodeId) {
        await db.execute(sql`UPDATE competition_promo_codes SET uses_count = uses_count + 1 WHERE id = ${resolvedPromoCodeId}`);
      }

      const io = getIo();
      if (io) {
        io.to("admin").emit("competition:registration", { competitionName: competition.name, competitionId: competition.id });
      }

      console.log(`[Competition] Registration confirmed for user ${userId}, competition ${slug}, payment ${squarePaymentLinkId}`);
      res.json({ registration: reg.rows[0], paid: true });
    } catch (error: any) {
      console.error("[Competition] confirm-square-registration error:", error);
      res.status(500).json({ error: error.message || "Failed to confirm registration" });
    }
  });

  // Submit score (athlete self-submit)
  app.post("/api/competitions/:slug/scores/submit", requireAuth, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const userId = (req.session as any).userId;
      const { workoutId, score, scoreNumeric, videoProofUrl, isDnf, dnfReps } = req.body;

      const workoutRow = await db.execute(sql`SELECT submission_deadline, name FROM competition_workouts WHERE id = ${workoutId}`);
      if (workoutRow.rows.length > 0) {
        const deadline = (workoutRow.rows[0] as any).submission_deadline;
        if (deadline && new Date(deadline) < new Date()) {
          return res.status(400).json({ error: "Score submission deadline has passed for this workout." });
        }
      }

      const reg = await db.execute(sql`
        SELECT cr.id FROM competition_registrations cr
        JOIN competitions c ON c.id = cr.competition_id
        WHERE c.slug = ${slug} AND cr.user_id = ${userId}
        AND cr.status IN ('confirmed', 'checked_in')
      `);
      if (reg.rows.length === 0) return res.status(403).json({ error: "Not registered" });

      const regId = (reg.rows[0] as any).id;
      const finalStatus = isDnf ? "dnf" : "pending";
      const finalScore = isDnf ? `DNF (${dnfReps ?? 0} reps)` : score;
      const finalScoreNumeric = isDnf ? null : (scoreNumeric ?? null);

      const existing = await db.execute(sql`
        SELECT id FROM competition_scores WHERE registration_id = ${regId} AND workout_id = ${workoutId}
      `);

      if (existing.rows.length > 0) {
        await db.execute(sql`
          UPDATE competition_scores SET
            score = ${finalScore}, score_numeric = ${finalScoreNumeric},
            status = ${finalStatus}, video_proof_url = ${videoProofUrl || null},
            dnf_reps = ${isDnf ? (dnfReps ?? 0) : null},
            submitted_at = NOW()
          WHERE registration_id = ${regId} AND workout_id = ${workoutId}
        `);
      } else {
        await db.execute(sql`
          INSERT INTO competition_scores (id, registration_id, workout_id, score, score_numeric, submitted_by, status, video_proof_url, dnf_reps)
          VALUES (gen_random_uuid(), ${regId}, ${workoutId}, ${finalScore}, ${finalScoreNumeric}, ${userId}, ${finalStatus}, ${videoProofUrl || null}, ${isDnf ? (dnfReps ?? 0) : null})
        `);
      }

      const io = getIo();
      if (io) io.to("admin").emit("competition:score_submitted", { workoutId, regId });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit score" });
    }
  });

  // Get team members
  app.get("/api/competitions/:slug/teams/members", requireAuth, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const userId = (req.session as any).userId;
      const reg = await db.execute(sql`
        SELECT cr.id FROM competition_registrations cr
        JOIN competitions c ON c.id = cr.competition_id
        WHERE c.slug = ${slug} AND cr.user_id = ${userId}
      `);
      if (reg.rows.length === 0) return res.json([]);
      const regId = (reg.rows[0] as any).id;
      const members = await db.execute(sql`
        SELECT ctm.*, u.first_name, u.last_name, u.email
        FROM competition_team_members ctm
        JOIN users u ON u.id = ctm.user_id
        WHERE ctm.registration_id = ${regId}
        ORDER BY ctm.invited_at ASC
      `);
      res.json(members.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  // Update team name
  app.patch("/api/competitions/:slug/teams/name", requireAuth, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const userId = (req.session as any).userId;
      const { teamName } = req.body;
      if (!teamName) return res.status(400).json({ error: "Team name required" });
      await db.execute(sql`
        UPDATE competition_registrations cr
        SET team_name = ${teamName}
        FROM competitions c
        WHERE c.id = cr.competition_id AND c.slug = ${slug} AND cr.user_id = ${userId}
      `);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update team name" });
    }
  });

  // Invite teammate
  app.post("/api/competitions/:slug/teams/invite", requireAuth, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const userId = (req.session as any).userId;
      const { inviteEmail } = req.body;

      if (!inviteEmail) return res.status(400).json({ error: "Email required" });

      const reg = await db.execute(sql`
        SELECT cr.id, cr.team_name, c.name as competition_name, c.format as competition_format, u.first_name as captain_name, u.email as captain_email
        FROM competition_registrations cr
        JOIN competitions c ON c.id = cr.competition_id
        JOIN users u ON u.id = cr.user_id
        WHERE c.slug = ${slug} AND cr.user_id = ${userId}
      `);
      if (reg.rows.length === 0) return res.status(404).json({ error: "Registration not found" });
      const regRow = reg.rows[0] as any;

      // Prevent self-invite
      const captain = await db.execute(sql`SELECT email FROM users WHERE id = ${userId}`);
      const captainEmail = (captain.rows[0] as any)?.email;
      if (captainEmail && captainEmail.toLowerCase() === inviteEmail.toLowerCase()) {
        return res.status(400).json({ error: "You cannot invite yourself to your own team" });
      }

      // Enforce team size limit
      const formatTeamSize: Record<string, number> = { teams_of_2: 2, teams_of_3: 3, teams_of_4: 4 };
      const maxTeamSize = formatTeamSize[regRow.competition_format] ?? 4;
      const currentMembers = await db.execute(sql`
        SELECT COUNT(*) as count FROM competition_team_members
        WHERE registration_id = ${regRow.id} AND invite_status != 'declined' AND removed_at IS NULL
      `);
      const memberCount = parseInt((currentMembers.rows[0] as any)?.count ?? "0");
      if (memberCount >= maxTeamSize - 1) {
        return res.status(400).json({ error: `Your team is already at capacity (${maxTeamSize} members max)` });
      }

      const invitee = await db.execute(sql`SELECT id, first_name, email FROM users WHERE LOWER(email) = LOWER(${inviteEmail})`);
      const inviteeRow = invitee.rows.length > 0 ? (invitee.rows[0] as any) : null;

      // Prevent duplicate invites — check both by user_id (if registered) and by email
      const alreadyCheck = await db.execute(sql`
        SELECT id FROM competition_team_members
        WHERE registration_id = ${regRow.id}
          AND removed_at IS NULL
          AND (
            (user_id IS NOT NULL AND user_id = ${inviteeRow?.id ?? null})
            OR (invite_email IS NOT NULL AND LOWER(invite_email) = LOWER(${inviteEmail}))
          )
      `);
      if (alreadyCheck.rows.length > 0) return res.status(409).json({ error: "This person has already been invited to your team" });

      if (inviteeRow) {
        // Registered user: prevent accepting on another team
        const onOtherTeam = await db.execute(sql`
          SELECT ctm.id FROM competition_team_members ctm
          JOIN competition_registrations cr ON cr.id = ctm.registration_id
          JOIN competitions c ON c.id = cr.competition_id
          WHERE c.slug = ${slug} AND ctm.user_id = ${inviteeRow.id} AND ctm.invite_status = 'accepted' AND ctm.removed_at IS NULL
        `);
        if (onOtherTeam.rows.length > 0) return res.status(409).json({ error: "This athlete has already accepted an invitation on another team in this competition" });

        await db.execute(sql`
          INSERT INTO competition_team_members (id, registration_id, user_id, invite_email, role, invite_status)
          VALUES (gen_random_uuid(), ${regRow.id}, ${inviteeRow.id}, ${inviteEmail.toLowerCase()}, 'member', 'pending')
        `);
      } else {
        // Not yet registered — store email-only invite
        await db.execute(sql`
          INSERT INTO competition_team_members (id, registration_id, user_id, invite_email, role, invite_status)
          VALUES (gen_random_uuid(), ${regRow.id}, NULL, ${inviteEmail.toLowerCase()}, 'member', 'pending')
        `);
      }

      const { sendEmailWithRetry, wrapEmailTemplate } = await import("./email");
      const baseUrl = process.env.BASE_URL || "https://1strep.com";
      const myCompetitionsUrl = `${baseUrl}/my-competitions`;
      const signupUrl = `${baseUrl}/account?redirect=/my-competitions`;

      let emailHtml: string;
      let emailSubject: string;

      if (inviteeRow) {
        emailSubject = `Team invitation - ${regRow.competition_name}`;
        emailHtml = wrapEmailTemplate(`
          <tr><td style="padding:40px;">
            <h2 style="color:#ffffff;margin:0 0 20px;font-size:22px;">You've been invited to join a team!</h2>
            <p style="color:#B0B0B0;line-height:1.7;margin:0 0 16px;">
              Hi ${inviteeRow.first_name || "there"},
            </p>
            <p style="color:#B0B0B0;line-height:1.7;margin:0 0 20px;">
              <strong style="color:#FAFAF8;">${regRow.captain_name}</strong> has invited you to join
              ${regRow.team_name ? `their team <strong style="color:#FAFAF8;">"${regRow.team_name}"</strong>` : "their team"}
              for <strong style="color:#FAFAF8;">${regRow.competition_name}</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:24px auto;">
              <tr>
                <td style="background-color:#FAFAF8;border-radius:3px;">
                  <a href="${myCompetitionsUrl}" style="display:inline-block;padding:12px 32px;color:#080808;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:1px;font-family:Inter,Arial,sans-serif;text-transform:uppercase;">
                    Accept or Decline Invitation
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#6E6E6E;font-size:13px;line-height:1.6;margin:0;">
              Log in to your 1stRep account to accept or decline. The invitation will appear under "Team Invitations" on your competitions page.
            </p>
          </td></tr>
        `);
      } else {
        emailSubject = `Team invitation - ${regRow.competition_name}`;
        emailHtml = wrapEmailTemplate(`
          <tr><td style="padding:40px;">
            <h2 style="color:#ffffff;margin:0 0 20px;font-size:22px;">You've been invited to join a team!</h2>
            <p style="color:#B0B0B0;line-height:1.7;margin:0 0 20px;">
              <strong style="color:#FAFAF8;">${regRow.captain_name}</strong> has invited you to join
              ${regRow.team_name ? `their team <strong style="color:#FAFAF8;">"${regRow.team_name}"</strong>` : "their team"}
              for <strong style="color:#FAFAF8;">${regRow.competition_name}</strong> on 1stRep.
            </p>
            <p style="color:#B0B0B0;line-height:1.7;margin:0 0 24px;">
              Create your free 1stRep account to accept this invitation — your invite will be waiting automatically once you sign up with this email address.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td style="background-color:#FAFAF8;border-radius:3px;">
                  <a href="${signupUrl}" style="display:inline-block;padding:12px 32px;color:#080808;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:1px;font-family:Inter,Arial,sans-serif;text-transform:uppercase;">
                    Create Account &amp; Accept Invite
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#6E6E6E;font-size:13px;line-height:1.6;margin:0;">
              Already have a 1stRep account?
              <a href="${myCompetitionsUrl}" style="color:#FAFAF8;text-decoration:underline;">Log in here</a>
              and the invite will appear on your competitions page.
            </p>
          </td></tr>
        `);
      }

      const emailSent = await sendEmailWithRetry(inviteEmail, emailSubject, emailHtml, 3);
      if (!emailSent) {
        console.error(`[CompetitionInvite] All email attempts failed for ${inviteEmail} — invite saved but email not delivered`);
      }

      res.json({ success: true, newUser: !inviteeRow, emailSent });
    } catch (error) {
      res.status(500).json({ error: "Failed to send invite" });
    }
  });

  // Accept/decline team invite
  app.post("/api/competitions/:slug/teams/respond", requireAuth, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const userId = (req.session as any).userId;
      const { accept, shirtSize, waiverSigned } = req.body;

      // Get user's email so we can also match email-only invites
      const userRow = await db.execute(sql`SELECT email FROM users WHERE id = ${userId}`);
      const userEmail = (userRow.rows[0] as any)?.email ?? "";

      // If accepting, check if competition requires waiver
      if (accept) {
        const compRow = await db.execute(sql`
          SELECT c.waiver_text FROM competitions c
          JOIN competition_registrations cr ON cr.competition_id = c.id
          JOIN competition_team_members ctm ON ctm.registration_id = cr.id
          WHERE c.slug = ${slug} AND (ctm.user_id = ${userId} OR (ctm.user_id IS NULL AND LOWER(ctm.invite_email) = LOWER(${userEmail})))
          LIMIT 1
        `);
        const waiverText = (compRow.rows[0] as any)?.waiver_text;
        if (waiverText && !waiverSigned) {
          return res.status(400).json({ error: "You must agree to the waiver before accepting the invitation" });
        }
      }

      // Link any email-only invite records to this user first
      await db.execute(sql`
        UPDATE competition_team_members ctm
        SET user_id = ${userId}
        FROM competition_registrations cr
        JOIN competitions c ON c.id = cr.competition_id
        WHERE ctm.registration_id = cr.id
          AND c.slug = ${slug}
          AND ctm.user_id IS NULL
          AND LOWER(ctm.invite_email) = LOWER(${userEmail})
          AND ctm.removed_at IS NULL
      `);

      // Now update the invite status (works for both linked and pre-existing user_id invites)
      await db.execute(sql`
        UPDATE competition_team_members ctm
        SET invite_status = ${accept ? "accepted" : "declined"},
            accepted_at = ${accept ? sql`NOW()` : sql`NULL`},
            shirt_size = COALESCE(${shirtSize || null}, ctm.shirt_size),
            waiver_signed = ${accept && !!waiverSigned},
            waiver_signed_at = ${accept && waiverSigned ? sql`NOW()` : sql`NULL`}
        FROM competition_registrations cr
        JOIN competitions c ON c.id = cr.competition_id
        WHERE ctm.registration_id = cr.id AND c.slug = ${slug} AND ctm.user_id = ${userId}
          AND ctm.removed_at IS NULL
      `);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to respond to invite" });
    }
  });

  // Remove team member (captain only)
  app.delete("/api/competitions/:slug/teams/members/:memberId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { slug, memberId } = req.params;
      const userId = (req.session as any).userId;

      const reg = await db.execute(sql`
        SELECT cr.id FROM competition_registrations cr
        JOIN competitions c ON c.id = cr.competition_id
        WHERE c.slug = ${slug} AND cr.user_id = ${userId}
      `);
      if (!reg.rows.length) return res.status(403).json({ error: "Not authorised" });

      await db.execute(sql`
        UPDATE competition_team_members SET removed_at = NOW()
        WHERE id = ${memberId} AND registration_id = ${(reg.rows[0] as any).id}
      `);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to remove team member" }); }
  });

  // ── Admin routes ─────────────────────────────────────────────────────────

  // Admin: manually form a team from existing individual registrations
  app.post("/api/admin/competitions/:compId/form-team", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { compId } = req.params;
      const { captainRegId, memberRegIds, teamName } = req.body as { captainRegId: string; memberRegIds: string[]; teamName: string };

      if (!captainRegId) {
        return res.status(400).json({ error: "captainRegId required" });
      }

      // Verify captain registration belongs to this competition
      const captainRow = await db.execute(sql`
        SELECT cr.id, cr.user_id, u.first_name, u.last_name, u.email FROM competition_registrations cr
        JOIN users u ON u.id = cr.user_id
        WHERE cr.id = ${captainRegId} AND cr.competition_id = ${compId}
      `);
      if (!captainRow.rows.length) return res.status(404).json({ error: "Captain registration not found" });

      const name = teamName?.trim() || `${(captainRow.rows[0] as any).first_name}'s Team`;

      // Set team_name on captain's registration
      await db.execute(sql`UPDATE competition_registrations SET team_name = ${name} WHERE id = ${captainRegId}`);

      for (const membRegId of memberRegIds) {
        // Get the member's user_id from their registration
        const membRow = await db.execute(sql`
          SELECT cr.user_id, u.email, u.first_name, u.last_name FROM competition_registrations cr
          JOIN users u ON u.id = cr.user_id
          WHERE cr.id = ${membRegId} AND cr.competition_id = ${compId}
        `);
        if (!membRow.rows.length) continue;
        const m = membRow.rows[0] as any;

        // Remove any existing team_member entry linking this user to any team in this competition to avoid duplicates
        await db.execute(sql`
          DELETE FROM competition_team_members ctm
          USING competition_registrations cr
          WHERE ctm.registration_id = cr.id AND cr.competition_id = ${compId} AND ctm.user_id = ${m.user_id}
        `);

        // Create accepted team_member record under captain's registration
        await db.execute(sql`
          INSERT INTO competition_team_members (id, registration_id, user_id, invite_email, role, invite_status, waiver_signed, accepted_at)
          VALUES (gen_random_uuid(), ${captainRegId}, ${m.user_id}, ${m.email}, 'member', 'accepted', true, NOW())
        `);

        // Also set team_name on the member's own registration for display
        await db.execute(sql`UPDATE competition_registrations SET team_name = ${name} WHERE id = ${membRegId}`);
      }

      res.json({ success: true, teamName: name });
    } catch (error) {
      console.error("Form team error:", error);
      res.status(500).json({ error: "Failed to form team" });
    }
  });

  // Admin: add a single member to an existing team (by captain's registration ID)
  app.post("/api/admin/competitions/:compId/registrations/:captainRegId/add-member", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { compId, captainRegId } = req.params;
      const { memberRegId } = req.body as { memberRegId: string };
      if (!memberRegId) return res.status(400).json({ error: "memberRegId required" });

      // Get captain registration (must belong to this competition)
      const captainRow = await db.execute(sql`
        SELECT cr.id, cr.team_name, cr.user_id FROM competition_registrations cr
        WHERE cr.id = ${captainRegId} AND cr.competition_id = ${compId}
      `);
      if (!captainRow.rows.length) return res.status(404).json({ error: "Captain registration not found" });
      const captain = captainRow.rows[0] as any;
      const teamName = captain.team_name || "Team";

      // Get member registration (must belong to this competition)
      const membRow = await db.execute(sql`
        SELECT cr.user_id, u.email, u.first_name, u.last_name FROM competition_registrations cr
        JOIN users u ON u.id = cr.user_id
        WHERE cr.id = ${memberRegId} AND cr.competition_id = ${compId}
      `);
      if (!membRow.rows.length) return res.status(404).json({ error: "Member registration not found" });
      const m = membRow.rows[0] as any;

      // Remove any existing CTM records for this user in this competition (avoid duplicates)
      await db.execute(sql`
        DELETE FROM competition_team_members ctm
        USING competition_registrations cr
        WHERE ctm.registration_id = cr.id AND cr.competition_id = ${compId} AND ctm.user_id = ${m.user_id}
      `);

      // Create accepted CTM record under captain's registration
      await db.execute(sql`
        INSERT INTO competition_team_members (id, registration_id, user_id, invite_email, role, invite_status, waiver_signed, accepted_at)
        VALUES (gen_random_uuid(), ${captainRegId}, ${m.user_id}, ${m.email}, 'member', 'accepted', true, NOW())
      `);

      // Sync team_name on member's registration
      await db.execute(sql`UPDATE competition_registrations SET team_name = ${teamName} WHERE id = ${memberRegId}`);

      res.json({ success: true });
    } catch (error) {
      console.error("Add member error:", error);
      res.status(500).json({ error: "Failed to add member" });
    }
  });

  // Admin: list ALL competitions (including drafts and private)
  // Admin: dedicated team-view — returns teams grouped by team_name with full member info
  app.get("/api/admin/competitions/:compId/teams", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { compId } = req.params;

      // All registrations for this competition (to determine which are captains)
      const allRegs = await db.execute(sql`
        SELECT cr.id, cr.team_name, cr.status, cr.payment_status, cr.shirt_size, cr.registered_at,
          u.id as user_id, u.first_name, u.last_name, u.email,
          cc.name as category_name
        FROM competition_registrations cr
        JOIN users u ON u.id = cr.user_id
        JOIN competition_categories cc ON cc.id = cr.category_id
        WHERE cr.competition_id = ${compId}
        ORDER BY cr.registered_at ASC
      `);

      // All team members for this competition
      const allMembers = await db.execute(sql`
        SELECT ctm.id, ctm.registration_id, ctm.user_id, ctm.invite_status, ctm.role,
          ctm.shirt_size as ctm_shirt_size,
          COALESCE(ctm.waiver_signed, false) as waiver_signed,
          ctm.invite_email,
          COALESCE(m_u.first_name, '(Invited)') as first_name,
          COALESCE(m_u.last_name, '') as last_name,
          COALESCE(m_u.email, ctm.invite_email) as email
        FROM competition_team_members ctm
        JOIN competition_registrations cr ON cr.id = ctm.registration_id
        LEFT JOIN users m_u ON m_u.id = ctm.user_id
        WHERE cr.competition_id = ${compId} AND ctm.removed_at IS NULL
        ORDER BY ctm.role DESC, ctm.id ASC
      `);

      const regs = allRegs.rows as any[];
      const members = allMembers.rows as any[];

      // Build a map: registration_id → members[]
      const membersByReg: Record<string, any[]> = {};
      for (const m of members) {
        if (!membersByReg[m.registration_id]) membersByReg[m.registration_id] = [];
        membersByReg[m.registration_id].push(m);
      }

      // Build a set of user_ids that are members (not captains) in a team
      const memberUserIds = new Set(members.map((m: any) => m.user_id).filter(Boolean));

      // Groups by team_name
      const teams: Record<string, { captain: any; members: any[]; noTeamRegs: any[] }> = {};
      const noTeam: any[] = [];

      for (const reg of regs) {
        if (!reg.team_name) { noTeam.push(reg); continue; }
        if (!teams[reg.team_name]) teams[reg.team_name] = { captain: null, members: [], noTeamRegs: [] };
        const g = teams[reg.team_name];
        const regMembers = membersByReg[reg.id] ?? [];
        if (regMembers.length > 0 && !g.captain) {
          // This registration is the captain (has team_members under it)
          g.captain = { ...reg, shirt_size: reg.shirt_size };
          g.members = regMembers.map((m: any) => ({
            ...m,
            shirt_size: m.ctm_shirt_size // prefer ctm shirt_size (set at invite acceptance)
          }));
        } else if (!memberUserIds.has(reg.user_id)) {
          // This registration's user is not a member under any captain → treat as standalone in team
          g.noTeamRegs.push(reg);
        }
        // If the user IS a member under the captain, skip their own registration (deduplicated)
      }

      // If no captain found for a group, promote the first standalone reg
      for (const g of Object.values(teams)) {
        if (!g.captain && g.noTeamRegs.length > 0) {
          g.captain = g.noTeamRegs.shift()!;
        }
      }

      res.json({
        teams: Object.entries(teams).map(([teamName, g]) => ({ teamName, ...g })),
        noTeam,
      });
    } catch (error) {
      console.error("Admin teams view error:", error);
      res.status(500).json({ error: "Failed to fetch team view" });
    }
  });

  app.get("/api/admin/competitions", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql.raw(`
        SELECT c.*,
          (SELECT COUNT(*) FROM competition_categories WHERE competition_id = c.id) as category_count,
          (SELECT COUNT(*) FROM competition_registrations WHERE competition_id = c.id) as registration_count,
          (SELECT COUNT(*) FROM competition_registrations WHERE competition_id = c.id AND payment_status = 'paid') as paid_count
        FROM competitions c
        ORDER BY c.start_date ASC
        LIMIT 200
      `));
      res.json(result.rows);
    } catch (error) {
      console.error("Admin list competitions error:", error);
      res.status(500).json({ error: "Failed to fetch competitions" });
    }
  });

  // Bulk check-in
  app.post("/api/competitions/:id/registrations/bulk-checkin", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { registrationIds } = req.body;
      if (!Array.isArray(registrationIds) || !registrationIds.length) return res.status(400).json({ error: "registrationIds required" });
      for (const regId of registrationIds) {
        await db.execute(sql`UPDATE competition_registrations SET status = 'checked_in', checked_in_at = NOW() WHERE id = ${regId}`);
      }
      res.json({ success: true, count: registrationIds.length });
    } catch { res.status(500).json({ error: "Failed to bulk check-in" }); }
  });

  // Manually confirm registration
  app.put("/api/competitions/:id/registrations/:regId/confirm", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      await db.execute(sql`
        UPDATE competition_registrations SET status = 'confirmed', payment_status = 'paid'
        WHERE id = ${req.params.regId} AND competition_id = ${req.params.id}
      `);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to confirm registration" }); }
  });

  // Cancel/withdraw registration
  app.delete("/api/competitions/:id/registrations/:regId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      const reg = await db.execute(sql`
        SELECT * FROM competition_registrations WHERE id = ${req.params.regId} AND competition_id = ${req.params.id}
      `);
      if (!reg.rows.length) return res.status(404).json({ error: "Registration not found" });
      const r = reg.rows[0] as any;

      await db.execute(sql`
        UPDATE competition_registrations
        SET status = 'withdrawn', cancelled_at = NOW(), cancellation_reason = ${reason || null}
        WHERE id = ${req.params.regId}
      `);

      await db.execute(sql`UPDATE competition_categories SET current_participants = GREATEST(0, current_participants - 1) WHERE id = ${r.category_id}`);
      await db.execute(sql`UPDATE competitions SET current_participants = GREATEST(0, current_participants - 1) WHERE id = ${r.competition_id}`);

      if (r.payment_status === "paid" && r.amount_paid > 0) {
        console.log(`[Competition] Cancelled paid registration ${req.params.regId} — Square payment link ID: ${r.stripe_payment_intent_id}. Manual refund may be required via Square dashboard.`);
      }

      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to cancel registration" }); }
  });

  // ── Promo Code Admin CRUD ─────────────────────────────────────────────────

  app.get("/api/competitions/:id/promo-codes", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`SELECT * FROM competition_promo_codes WHERE competition_id = ${req.params.id} ORDER BY created_at DESC`);
      res.json(result.rows);
    } catch { res.status(500).json({ error: "Failed to fetch promo codes" }); }
  });

  app.post("/api/competitions/:id/promo-codes", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { code, discountType, discountValue, maxUses, expiresAt } = req.body;
      if (!code || !discountValue) return res.status(400).json({ error: "Code and discountValue required" });
      const result = await db.execute(sql`
        INSERT INTO competition_promo_codes (id, competition_id, code, discount_type, discount_value, max_uses, expires_at)
        VALUES (gen_random_uuid(), ${req.params.id}, UPPER(${code}), ${discountType || "percentage"}, ${parseInt(discountValue)}, ${maxUses ? parseInt(maxUses) : null}, ${expiresAt || null})
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (e: any) {
      if (e.code === "23505") return res.status(409).json({ error: "A promo code with that name already exists" });
      res.status(500).json({ error: "Failed to create promo code" });
    }
  });

  app.put("/api/competitions/:id/promo-codes/:promoId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { isActive } = req.body;
      await db.execute(sql`UPDATE competition_promo_codes SET is_active = ${isActive} WHERE id = ${req.params.promoId}`);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to update promo code" }); }
  });

  app.delete("/api/competitions/:id/promo-codes/:promoId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      await db.execute(sql`DELETE FROM competition_promo_codes WHERE id = ${req.params.promoId} AND competition_id = ${req.params.id}`);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to delete promo code" }); }
  });

  // ── Admin: Host Enquiries ─────────────────────────────────────────────────

  app.get("/api/admin/competition-enquiries", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT e.*, u.email as user_email
        FROM competition_host_enquiries e
        LEFT JOIN users u ON u.id = e.user_id
        ORDER BY e.created_at DESC
        LIMIT 200
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Admin enquiry list error:", error);
      res.status(500).json({ error: "Failed to fetch enquiries" });
    }
  });

  app.post("/api/admin/competition-enquiries/:id/approve", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { tier, adminNotes } = req.body;
      if (!tier) return res.status(400).json({ error: "Tier required for approval" });

      const enquiryRes = await db.execute(sql`SELECT * FROM competition_host_enquiries WHERE id = ${id}`);
      if (!enquiryRes.rows.length) return res.status(404).json({ error: "Enquiry not found" });
      const enquiry = enquiryRes.rows[0] as any;

      // Mark approved
      await db.execute(sql`
        UPDATE competition_host_enquiries
        SET status = 'approved', approved_tier = ${tier}, admin_notes = ${adminNotes || null}, reviewed_at = NOW()
        WHERE id = ${id}
      `);

      // Look up or find user
      let userId = enquiry.user_id;
      if (!userId) {
        const u = await db.execute(sql`SELECT id FROM users WHERE email = ${enquiry.email} LIMIT 1`);
        userId = u.rows[0]?.id ?? null;
      }

      // Create subscription if user exists
      if (userId) {
        const tierRes = await db.execute(sql`SELECT * FROM competition_pricing_config WHERE tier = ${tier} LIMIT 1`);
        const t = tierRes.rows[0] as any;
        await db.execute(sql`
          INSERT INTO competition_subscriptions (id, user_id, tier, status, competitions_limit, created_at, updated_at)
          VALUES (gen_random_uuid(), ${userId}, ${tier}, 'active', ${t?.max_competitions || null}, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `);
      }

      // Send approval email
      try {
        const TIER_NAMES: Record<string, string> = { starter: "Starter", single: "Single Event", pro: "Pro Monthly", white_label: "White Label" };
        const tierName = TIER_NAMES[tier] || tier;
        const { sendEmail } = await import("./email");
        await sendEmail(
          enquiry.email,
          `Your 1stRep hosting application has been approved — ${tierName} plan`,
          `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0d0d0d; color: #f5f5f0; padding: 32px; border-radius: 8px;"><div style="text-align: center; margin-bottom: 24px;"><span style="color: #C9A84C; font-weight: 900; font-size: 20px; letter-spacing: 0.1em;">1STREP</span></div><h2 style="color: #ffffff;">You're approved, ${enquiry.name}!</h2><p style="color: #aaaaaa; line-height: 1.6;">We're delighted to confirm that your hosting application has been approved on the <strong style="color: #C9A84C;">${tierName}</strong> plan.</p>${userId ? `<p style="color: #aaaaaa; line-height: 1.6;">Your account has been activated. You can now log in and start building your competition.</p><div style="margin: 24px 0; text-align: center;"><a href="${process.env.BASE_URL || "https://1strep.com"}/organiser" style="background: #C9A84C; color: #000000; font-weight: 700; padding: 12px 28px; border-radius: 6px; text-decoration: none; display: inline-block;">Go to Competition Dashboard</a></div>` : `<p style="color: #aaaaaa; line-height: 1.6;">To get started, create your free 1stRep account using this email address, and your hosting access will be linked automatically.</p><div style="margin: 24px 0; text-align: center;"><a href="${process.env.BASE_URL || "https://1strep.com"}/register" style="background: #C9A84C; color: #000000; font-weight: 700; padding: 12px 28px; border-radius: 6px; text-decoration: none; display: inline-block;">Create Your Account</a></div>`}${adminNotes ? `<p style="color: #aaaaaa; line-height: 1.6;"><strong style="color: #ffffff;">Note from our team:</strong><br>${adminNotes.replace(/\n/g, "<br>")}</p>` : ""}<p style="color: #666666; font-size: 13px; margin-top: 24px;">Questions? Reply to this email or contact competitions@1strep.com</p></div>`,
        );
      } catch (emailErr) {
        console.error("Failed to send approval email:", emailErr);
      }

      res.json({ success: true, userFound: !!userId });
    } catch (error) {
      console.error("Approve enquiry error:", error);
      res.status(500).json({ error: "Failed to approve enquiry" });
    }
  });

  app.post("/api/admin/competition-enquiries/:id/reject", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;

      const enquiryRes = await db.execute(sql`SELECT * FROM competition_host_enquiries WHERE id = ${id}`);
      if (!enquiryRes.rows.length) return res.status(404).json({ error: "Enquiry not found" });
      const enquiry = enquiryRes.rows[0] as any;

      await db.execute(sql`
        UPDATE competition_host_enquiries
        SET status = 'rejected', admin_notes = ${adminNotes || null}, reviewed_at = NOW()
        WHERE id = ${id}
      `);

      try {
        const { sendEmail } = await import("./email");
        await sendEmail(
          enquiry.email,
          "Update on your 1stRep hosting enquiry",
          `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0d0d0d; color: #f5f5f0; padding: 32px; border-radius: 8px;"><div style="text-align: center; margin-bottom: 24px;"><span style="color: #C9A84C; font-weight: 900; font-size: 20px; letter-spacing: 0.1em;">1STREP</span></div><h2 style="color: #ffffff;">Hi ${enquiry.name},</h2><p style="color: #aaaaaa; line-height: 1.6;">Thank you for your interest in hosting a competition with 1stRep. After reviewing your application, we're unable to proceed at this time.</p>${adminNotes ? `<p style="color: #aaaaaa; line-height: 1.6;"><strong style="color: #ffffff;">Note from our team:</strong><br>${adminNotes.replace(/\n/g, "<br>")}</p>` : ""}<p style="color: #aaaaaa; line-height: 1.6;">If you'd like to discuss this further, please reply to this email or contact us at competitions@1strep.com.</p><p style="color: #666666; font-size: 13px; margin-top: 24px;">— The 1stRep Team</p></div>`,
        );
      } catch (emailErr) {
        console.error("Failed to send rejection email:", emailErr);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Reject enquiry error:", error);
      res.status(500).json({ error: "Failed to reject enquiry" });
    }
  });

  // ── Organiser self-service routes ──────────────────────────────────────────

  // Helper: verify user is organiser of given competition id
  async function assertOrganiserOf(compId: string, userId: string): Promise<boolean> {
    const r = await db.execute(sql`SELECT id FROM competitions WHERE id = ${compId} AND organiser_id = ${userId}`);
    return r.rows.length > 0;
  }

  // List my hosted competitions
  app.get("/api/organiser/competitions", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    try {
      const result = await db.execute(sql`
        SELECT c.*,
          (SELECT COUNT(*) FROM competition_registrations cr WHERE cr.competition_id = c.id)::int AS registration_count,
          (SELECT COUNT(*) FROM competition_categories cc WHERE cc.competition_id = c.id)::int AS category_count,
          (SELECT COUNT(*) FROM competition_workouts cw WHERE cw.competition_id = c.id)::int AS workout_count
        FROM competitions c
        WHERE c.organiser_id = ${userId}
        ORDER BY c.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Organiser list error:", error);
      res.status(500).json({ error: "Failed to fetch competitions" });
    }
  });

  // Create a competition (organiser — requires active subscription)
  app.post("/api/organiser/competitions", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    try {
      const sub = await db.execute(sql`SELECT * FROM competition_subscriptions WHERE user_id = ${userId} AND status = 'active' LIMIT 1`);
      if (sub.rows.length === 0) return res.status(403).json({ error: "Active host subscription required" });

      const { name, description, type, format, location, venue, address,
        startDate, endDate, registrationOpenDate, registrationCloseDate,
        maxParticipants, entryFee, isPublic, rules } = req.body;

      if (!name || !startDate || !endDate) {
        return res.status(400).json({ error: "Name, start date and end date are required" });
      }

      const baseSlug = slugify(name);
      const existing = await db.execute(sql`SELECT slug FROM competitions WHERE slug LIKE ${baseSlug + '%'} ORDER BY slug DESC LIMIT 1`);
      let slug = baseSlug;
      if (existing.rows.length > 0) {
        const lastSlug = (existing.rows[0] as any).slug;
        const num = parseInt(lastSlug.replace(baseSlug, "").replace("-", "") || "0") + 1;
        slug = `${baseSlug}-${num}`;
      }

      const result = await db.execute(sql`
        INSERT INTO competitions
          (id, name, slug, description, type, format, location, venue, address,
           start_date, end_date, registration_open_date, registration_close_date,
           max_participants, entry_fee, is_public, rules, organiser_id, status)
        VALUES
          (gen_random_uuid(), ${name}, ${slug}, ${description || null}, ${type || "single_day"},
           ${format || "individual"}, ${location || null}, ${venue || null}, ${address || null},
           ${startDate}, ${endDate}, ${registrationOpenDate || null}, ${registrationCloseDate || null},
           ${maxParticipants || null}, ${entryFee || 0}, ${isPublic ?? false},
           ${rules || null}, ${userId}, 'draft')
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Organiser create competition error:", error);
      res.status(500).json({ error: "Failed to create competition" });
    }
  });

  // Update own competition
  app.put("/api/organiser/competitions/:id", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    if (!await assertOrganiserOf(req.params.id, userId)) return res.status(403).json({ error: "Forbidden" });
    try {
      const { name, description, type, format, location, venue, address,
        startDate, endDate, registrationOpenDate, registrationCloseDate,
        maxParticipants, entryFee, isPublic, rules, status } = req.body;
      await db.execute(sql`
        UPDATE competitions SET
          name = COALESCE(${name ?? null}, name),
          description = COALESCE(${description ?? null}, description),
          type = COALESCE(${type ? sql`${type}::competition_type` : sql`NULL`}, type),
          format = COALESCE(${format ? sql`${format}::competition_format` : sql`NULL`}, format),
          location = COALESCE(${location ?? null}, location),
          venue = COALESCE(${venue ?? null}, venue),
          address = COALESCE(${address ?? null}, address),
          start_date = COALESCE(${startDate ? new Date(startDate) : null}, start_date),
          end_date = COALESCE(${endDate ? new Date(endDate) : null}, end_date),
          registration_open_date = ${registrationOpenDate ? new Date(registrationOpenDate) : null},
          registration_close_date = ${registrationCloseDate ? new Date(registrationCloseDate) : null},
          max_participants = ${maxParticipants ?? null},
          entry_fee = COALESCE(${entryFee ?? null}, entry_fee),
          is_public = COALESCE(${isPublic ?? null}, is_public),
          rules = COALESCE(${rules ?? null}, rules),
          status = COALESCE(${status ? sql`${status}::competition_status` : sql`NULL`}, status)
        WHERE id = ${req.params.id}
      `);
      res.json({ success: true });
    } catch (error) {
      console.error("Organiser update competition error:", error);
      res.status(500).json({ error: "Failed to update competition" });
    }
  });

  // Publish own competition
  app.post("/api/organiser/competitions/:id/publish", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    if (!await assertOrganiserOf(req.params.id, userId)) return res.status(403).json({ error: "Forbidden" });
    try {
      await db.execute(sql`UPDATE competitions SET status = 'registration_open', is_public = true WHERE id = ${req.params.id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to publish competition" });
    }
  });

  // Registrations for own competition
  app.get("/api/organiser/competitions/:id/registrations", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    if (!await assertOrganiserOf(req.params.id, userId)) return res.status(403).json({ error: "Forbidden" });
    try {
      const result = await db.execute(sql`
        SELECT cr.*, cc.name as category_name,
          u.email, u.first_name, u.last_name
        FROM competition_registrations cr
        JOIN competition_categories cc ON cc.id = cr.category_id
        JOIN users u ON u.id = cr.user_id
        WHERE cr.competition_id = ${req.params.id}
        ORDER BY cr.registered_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  // Confirm a registration (organiser)
  app.put("/api/organiser/competitions/:id/registrations/:regId/confirm", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    if (!await assertOrganiserOf(req.params.id, userId)) return res.status(403).json({ error: "Forbidden" });
    try {
      await db.execute(sql`UPDATE competition_registrations SET status = 'confirmed' WHERE id = ${req.params.regId} AND competition_id = ${req.params.id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm registration" });
    }
  });

  // Check-in a registration (organiser)
  app.put("/api/organiser/competitions/:id/registrations/:regId/check-in", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    if (!await assertOrganiserOf(req.params.id, userId)) return res.status(403).json({ error: "Forbidden" });
    try {
      await db.execute(sql`UPDATE competition_registrations SET status = 'checked_in', checked_in_at = NOW() WHERE id = ${req.params.regId} AND competition_id = ${req.params.id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to check in" });
    }
  });

  // Cancel a registration (organiser)
  app.delete("/api/organiser/competitions/:id/registrations/:regId", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    if (!await assertOrganiserOf(req.params.id, userId)) return res.status(403).json({ error: "Forbidden" });
    try {
      await db.execute(sql`UPDATE competition_registrations SET status = 'withdrawn' WHERE id = ${req.params.regId} AND competition_id = ${req.params.id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel registration" });
    }
  });

  // Add category (organiser)
  app.post("/api/organiser/competitions/:id/categories", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    if (!await assertOrganiserOf(req.params.id, userId)) return res.status(403).json({ error: "Forbidden" });
    try {
      const { name, description, maxParticipants, difficultyLevel, gender, ageMin, ageMax } = req.body;
      const result = await db.execute(sql`
        INSERT INTO competition_categories
          (id, competition_id, name, description, max_participants, difficulty_level, gender, age_min, age_max)
        VALUES
          (gen_random_uuid(), ${req.params.id}, ${name}, ${description || null}, ${maxParticipants || null},
           ${difficultyLevel || "open"}, ${gender || "any"}, ${ageMin || null}, ${ageMax || null})
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to add category" });
    }
  });

  // Delete category (organiser)
  app.delete("/api/organiser/competitions/:id/categories/:catId", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    if (!await assertOrganiserOf(req.params.id, userId)) return res.status(403).json({ error: "Forbidden" });
    try {
      await db.execute(sql`DELETE FROM competition_categories WHERE id = ${req.params.catId} AND competition_id = ${req.params.id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Add workout (organiser)
  app.post("/api/organiser/competitions/:id/workouts", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    if (!await assertOrganiserOf(req.params.id, userId)) return res.status(403).json({ error: "Forbidden" });
    try {
      const { name, description, type, timeCap, sortOrder, isPublic, submissionDeadline } = req.body;
      const result = await db.execute(sql`
        INSERT INTO competition_workouts
          (id, competition_id, name, description, type, time_cap, sort_order, is_public, submission_deadline)
        VALUES
          (gen_random_uuid(), ${req.params.id}, ${name}, ${description || null}, ${type || "for_time"},
           ${timeCap || null}, ${sortOrder || 0}, ${isPublic ?? false}, ${submissionDeadline || null})
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to add workout" });
    }
  });

  // Delete workout (organiser)
  app.delete("/api/organiser/competitions/:id/workouts/:workoutId", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    if (!await assertOrganiserOf(req.params.id, userId)) return res.status(403).json({ error: "Forbidden" });
    try {
      await db.execute(sql`DELETE FROM competition_workouts WHERE id = ${req.params.workoutId} AND competition_id = ${req.params.id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workout" });
    }
  });

  // Edit category (organiser)
  app.put("/api/organiser/competitions/:id/categories/:catId", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    if (!await assertOrganiserOf(req.params.id, userId)) return res.status(403).json({ error: "Forbidden" });
    try {
      const { name, description, difficultyLevel, gender, ageMin, ageMax, maxParticipants } = req.body;
      await db.execute(sql`
        UPDATE competition_categories SET
          name = COALESCE(${name ?? null}, name),
          description = ${description ?? null},
          difficulty_level = COALESCE(${difficultyLevel ?? null}, difficulty_level),
          gender = COALESCE(${gender ?? null}, gender),
          age_min = ${ageMin ?? null},
          age_max = ${ageMax ?? null},
          max_participants = ${maxParticipants ?? null}
        WHERE id = ${req.params.catId} AND competition_id = ${req.params.id}
      `);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  // Edit workout (organiser)
  app.put("/api/organiser/competitions/:id/workouts/:workoutId", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    if (!await assertOrganiserOf(req.params.id, userId)) return res.status(403).json({ error: "Forbidden" });
    try {
      const { name, description, type, timeCap, sortOrder, isPublic, submissionDeadline } = req.body;
      await db.execute(sql`
        UPDATE competition_workouts SET
          name = COALESCE(${name ?? null}, name),
          description = ${description ?? null},
          type = COALESCE(${type ?? null}, type),
          time_cap = ${timeCap ?? null},
          sort_order = COALESCE(${sortOrder ?? null}, sort_order),
          is_public = COALESCE(${isPublic ?? null}, is_public),
          submission_deadline = ${submissionDeadline ?? null}
        WHERE id = ${req.params.workoutId} AND competition_id = ${req.params.id}
      `);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update workout" });
    }
  });

  // Delete competition (organiser — own only, must be draft or cancelled)
  app.delete("/api/organiser/competitions/:id", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    if (!await assertOrganiserOf(req.params.id, userId)) return res.status(403).json({ error: "Forbidden" });
    try {
      // Only allow deleting drafts or cancelled competitions
      const check = await db.execute(sql`SELECT status FROM competitions WHERE id = ${req.params.id}`);
      const status = (check.rows[0] as any)?.status;
      if (!["draft", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Only draft or cancelled competitions can be deleted" });
      }
      await db.execute(sql`DELETE FROM competition_workouts WHERE competition_id = ${req.params.id}`);
      await db.execute(sql`DELETE FROM competition_categories WHERE competition_id = ${req.params.id}`);
      await db.execute(sql`DELETE FROM competitions WHERE id = ${req.params.id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete competition" });
    }
  });

  // ── Admin CRUD for competitions ──────────────────────────────────────────

  app.post("/api/competitions", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const { name, description, type, format, location, venue, address,
        startDate, endDate, registrationOpenDate, registrationCloseDate,
        maxParticipants, entryFee, isPublic, rules, waiverText } = req.body;

      if (!name || !startDate || !endDate) {
        return res.status(400).json({ error: "Name, start date and end date are required" });
      }

      const baseSlug = slugify(name);
      const existing = await db.execute(sql`SELECT slug FROM competitions WHERE slug LIKE ${baseSlug + '%'} ORDER BY slug DESC LIMIT 1`);
      let slug = baseSlug;
      if (existing.rows.length > 0) {
        const lastSlug = (existing.rows[0] as any).slug;
        const num = parseInt(lastSlug.replace(baseSlug, "").replace("-", "") || "0") + 1;
        slug = `${baseSlug}-${num}`;
      }

      const result = await db.execute(sql`
        INSERT INTO competitions
          (id, name, slug, description, type, format, location, venue, address,
           start_date, end_date, registration_open_date, registration_close_date,
           max_participants, entry_fee, is_public, rules, waiver_text, organiser_id, status)
        VALUES
          (gen_random_uuid(), ${name}, ${slug}, ${description || null}, ${type || "single_day"},
           ${format || "individual"}, ${location || null}, ${venue || null}, ${address || null},
           ${startDate}, ${endDate}, ${registrationOpenDate || null}, ${registrationCloseDate || null},
           ${maxParticipants || null}, ${entryFee || 0}, ${isPublic || false},
           ${rules || null}, ${waiverText || null}, ${userId}, 'draft')
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Create competition error:", error);
      res.status(500).json({ error: "Failed to create competition" });
    }
  });

  app.put("/api/competitions/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, type, format, location, venue, address,
        startDate, endDate, registrationOpenDate, registrationCloseDate,
        maxParticipants, entryFee, isPublic, status, rules, bannerImage, waiverText } = req.body;

      await db.execute(sql`
        UPDATE competitions SET
          name = COALESCE(${name ?? null}, name),
          description = COALESCE(${description ?? null}, description),
          type = COALESCE(${type ? sql`${type}::competition_type` : sql`NULL`}, type),
          format = COALESCE(${format ? sql`${format}::competition_format` : sql`NULL`}, format),
          location = COALESCE(${location ?? null}, location),
          venue = COALESCE(${venue ?? null}, venue),
          address = COALESCE(${address ?? null}, address),
          start_date = COALESCE(${startDate ? new Date(startDate) : null}, start_date),
          end_date = COALESCE(${endDate ? new Date(endDate) : null}, end_date),
          registration_open_date = ${registrationOpenDate ? new Date(registrationOpenDate) : null},
          registration_close_date = ${registrationCloseDate ? new Date(registrationCloseDate) : null},
          max_participants = ${maxParticipants ?? null},
          entry_fee = COALESCE(${entryFee ?? null}, entry_fee),
          is_public = COALESCE(${isPublic ?? null}, is_public),
          status = COALESCE(${status ? sql`${status}::competition_status` : sql`NULL`}, status),
          rules = COALESCE(${rules ?? null}, rules),
          waiver_text = ${waiverText !== undefined ? (waiverText || null) : sql`waiver_text`},
          banner_image = COALESCE(${bannerImage ?? null}, banner_image),
          updated_at = NOW()
        WHERE id = ${id}
      `);
      res.json({ success: true });
    } catch (error) {
      console.error("PUT /api/competitions/:id error:", error);
      res.status(500).json({ error: "Failed to update competition", detail: String(error) });
    }
  });

  app.post("/api/competitions/:id/categories", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, maxParticipants, difficultyLevel, gender, ageMin, ageMax } = req.body;
      const result = await db.execute(sql`
        INSERT INTO competition_categories
          (id, competition_id, name, description, max_participants, difficulty_level, gender, age_min, age_max)
        VALUES
          (gen_random_uuid(), ${id}, ${name}, ${description || null}, ${maxParticipants || null},
           ${difficultyLevel || "open"}, ${gender || "any"}, ${ageMin || null}, ${ageMax || null})
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to add category" });
    }
  });

  app.put("/api/competitions/:id/categories/:catId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, description, difficultyLevel, gender, ageMin, ageMax, maxParticipants } = req.body;
      await db.execute(sql`
        UPDATE competition_categories SET
          name = COALESCE(${name ?? null}, name),
          description = ${description ?? null},
          difficulty_level = COALESCE(${difficultyLevel ?? null}, difficulty_level),
          gender = COALESCE(${gender ?? null}, gender),
          age_min = ${ageMin ?? null},
          age_max = ${ageMax ?? null},
          max_participants = ${maxParticipants ?? null}
        WHERE id = ${req.params.catId} AND competition_id = ${req.params.id}
      `);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/competitions/:id/categories/:catId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      await db.execute(sql`DELETE FROM competition_categories WHERE id = ${req.params.catId} AND competition_id = ${req.params.id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  app.post("/api/competitions/:id/workouts", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, type, timeCap, sortOrder, isPublic, submissionDeadline } = req.body;
      const result = await db.execute(sql`
        INSERT INTO competition_workouts
          (id, competition_id, name, description, type, time_cap, sort_order, is_public, submission_deadline)
        VALUES
          (gen_random_uuid(), ${id}, ${name}, ${description || null}, ${type || "for_time"},
           ${timeCap || null}, ${sortOrder || 0}, ${isPublic || false}, ${submissionDeadline || null})
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to add workout" });
    }
  });

  app.put("/api/competitions/:id/workouts/:workoutId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { workoutId } = req.params;
      const { name, description, type, timeCap, sortOrder, isPublic, scoresVisible, submissionDeadline } = req.body;
      await db.execute(sql`
        UPDATE competition_workouts SET
          name = COALESCE(${name ?? null}, name),
          description = COALESCE(${description ?? null}, description),
          type = COALESCE(${type ?? null}, type),
          time_cap = CASE WHEN ${timeCap !== undefined} THEN ${timeCap ?? null} ELSE time_cap END,
          sort_order = COALESCE(${sortOrder ?? null}, sort_order),
          is_public = CASE WHEN ${isPublic !== undefined && isPublic !== null} THEN ${isPublic ?? false} ELSE is_public END,
          scores_visible = CASE WHEN ${scoresVisible !== undefined && scoresVisible !== null} THEN ${scoresVisible ?? false} ELSE scores_visible END,
          submission_deadline = CASE WHEN ${submissionDeadline !== undefined} THEN ${submissionDeadline || null} ELSE submission_deadline END
        WHERE id = ${workoutId}
      `);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update workout" });
    }
  });

  // PATCH visibility only — lightweight toggle for is_public
  app.patch("/api/competitions/:id/workouts/:workoutId/visibility", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { workoutId } = req.params;
      const { isPublic } = req.body;
      await db.execute(sql`UPDATE competition_workouts SET is_public = ${Boolean(isPublic)} WHERE id = ${workoutId}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update visibility" });
    }
  });

  // Create empty heat manually
  app.post("/api/competitions/:id/heats", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { workoutId, startTime } = req.body;
      if (!workoutId) return res.status(400).json({ error: "workoutId required" });
      const maxHeat = await db.execute(sql`
        SELECT COALESCE(MAX(heat_number), 0) as max FROM competition_heats WHERE workout_id = ${workoutId}
      `);
      const nextNum = Number((maxHeat.rows[0] as any).max) + 1;
      const heat = await db.execute(sql`
        INSERT INTO competition_heats (id, workout_id, heat_number, start_time, capacity)
        VALUES (gen_random_uuid(), ${workoutId}, ${nextNum}, ${startTime ? new Date(startTime) : null}, 10)
        RETURNING id, heat_number
      `);
      res.json({ success: true, heat: heat.rows[0] });
    } catch (error) {
      res.status(500).json({ error: "Failed to create heat" });
    }
  });

  // Add athlete to a heat
  app.post("/api/competitions/:id/heats/:heatId/assignments", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { heatId } = req.params;
      const { registrationId } = req.body;
      if (!registrationId) return res.status(400).json({ error: "registrationId required" });
      // Remove any existing assignment for this registration in this workout's heats
      await db.execute(sql`
        DELETE FROM competition_heat_assignments
        WHERE registration_id = ${registrationId}
          AND heat_id IN (
            SELECT cha2.heat_id FROM competition_heat_assignments cha2
            JOIN competition_heats ch2 ON ch2.id = cha2.heat_id
            WHERE ch2.workout_id = (SELECT workout_id FROM competition_heats WHERE id = ${heatId})
          )
      `);
      const maxLane = await db.execute(sql`
        SELECT COALESCE(MAX(lane_number), 0) as max FROM competition_heat_assignments WHERE heat_id = ${heatId}
      `);
      const nextLane = Number((maxLane.rows[0] as any).max) + 1;
      await db.execute(sql`
        INSERT INTO competition_heat_assignments (id, heat_id, registration_id, lane_number)
        VALUES (gen_random_uuid(), ${heatId}, ${registrationId}, ${nextLane})
      `);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add assignment" });
    }
  });

  // Remove athlete from a heat
  app.delete("/api/competitions/:id/heats/:heatId/assignments/:assignmentId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      await db.execute(sql`DELETE FROM competition_heat_assignments WHERE id = ${req.params.assignmentId}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove assignment" });
    }
  });

  // Delete a heat entirely
  app.delete("/api/competitions/:id/heats/:heatId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { heatId } = req.params;
      await db.execute(sql`DELETE FROM competition_heat_assignments WHERE heat_id = ${heatId}`);
      await db.execute(sql`DELETE FROM competition_heats WHERE id = ${heatId}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete heat" });
    }
  });

  app.delete("/api/competitions/:id/workouts/:workoutId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      await db.execute(sql`DELETE FROM competition_workouts WHERE id = ${req.params.workoutId}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workout" });
    }
  });

  app.get("/api/competitions/:id/registrations", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT cr.*, cc.name as category_name,
          u.email, u.first_name, u.last_name,
          COALESCE((
            SELECT JSON_AGG(JSON_BUILD_OBJECT(
              'id', ctm.id,
              'user_id', ctm.user_id,
              'first_name', COALESCE(tm_u.first_name, '(Invited)'),
              'last_name', COALESCE(tm_u.last_name, ''),
              'email', COALESCE(tm_u.email, ctm.invite_email),
              'role', ctm.role,
              'invite_status', ctm.invite_status,
              'shirt_size', ctm.shirt_size,
              'waiver_signed', ctm.waiver_signed
            ) ORDER BY ctm.role DESC)
            FROM competition_team_members ctm
            LEFT JOIN users tm_u ON tm_u.id = ctm.user_id
            WHERE ctm.registration_id = cr.id AND ctm.removed_at IS NULL
          ), '[]'::json) as team_members
        FROM competition_registrations cr
        JOIN competition_categories cc ON cc.id = cr.category_id
        JOIN users u ON u.id = cr.user_id
        WHERE cr.competition_id = ${req.params.id}
        ORDER BY cr.registered_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  // Admin: remove a team member (soft-delete)
  app.delete("/api/admin/competitions/:compId/registrations/:regId/members/:memberId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { regId, memberId } = req.params;
      await db.execute(sql`
        UPDATE competition_team_members
        SET removed_at = NOW()
        WHERE id = ${memberId} AND registration_id = ${regId} AND removed_at IS NULL
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  // Admin: transfer captaincy to an existing accepted team member
  // Swap captain between two registrations that share a team_name (no CTM record needed)
  app.post("/api/admin/competitions/:compId/swap-captain", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { compId } = req.params;
      const { currentCaptainRegId, newCaptainRegId } = req.body;
      if (!currentCaptainRegId || !newCaptainRegId) return res.status(400).json({ error: "Both registration IDs required" });

      const regsResult = await db.execute(sql`
        SELECT id, user_id, team_name FROM competition_registrations
        WHERE id IN (${currentCaptainRegId}, ${newCaptainRegId}) AND competition_id = ${compId}
      `);
      const regs = regsResult.rows as any[];
      if (regs.length !== 2) return res.status(404).json({ error: "One or both registrations not found" });
      const oldCap = regs.find((r: any) => r.id === currentCaptainRegId);
      const newCap = regs.find((r: any) => r.id === newCaptainRegId);
      if (!oldCap || !newCap) return res.status(404).json({ error: "Registrations not found" });
      if (oldCap.team_name !== newCap.team_name) return res.status(400).json({ error: "Registrations are not on the same team" });

      const { default: crypto } = await import("crypto");

      // Move all existing CTM records under oldCaptainReg to newCaptainReg
      await db.execute(sql`
        UPDATE competition_team_members SET registration_id = ${newCaptainRegId}
        WHERE registration_id = ${currentCaptainRegId} AND removed_at IS NULL
          AND user_id != ${newCap.user_id}
      `);
      // Remove any existing CTM row for newCaptain under the oldCaptainReg (they're becoming captain)
      await db.execute(sql`
        UPDATE competition_team_members SET removed_at = NOW()
        WHERE registration_id IN (${currentCaptainRegId}, ${newCaptainRegId})
          AND user_id = ${newCap.user_id} AND removed_at IS NULL
      `);
      // Ensure old captain has a CTM row under the new captain's registration
      const existingOldCap = await db.execute(sql`
        SELECT id FROM competition_team_members
        WHERE registration_id = ${newCaptainRegId} AND user_id = ${oldCap.user_id} AND removed_at IS NULL
      `);
      if (!existingOldCap.rows.length) {
        await db.execute(sql`
          INSERT INTO competition_team_members (id, registration_id, user_id, role, invite_status, accepted_at)
          VALUES (${crypto.randomUUID()}, ${newCaptainRegId}, ${oldCap.user_id}, 'member', 'accepted', NOW())
        `);
      }
      res.json({ success: true });
    } catch (err) {
      console.error("swap-captain error:", err);
      res.status(500).json({ error: "Failed to swap captain" });
    }
  });

  // Remove a registration from its team (clears team_name only, does not delete registration)
  app.delete("/api/admin/competitions/:compId/registrations/:regId/remove-from-team", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { compId, regId } = req.params;
      await db.execute(sql`
        UPDATE competition_registrations SET team_name = NULL WHERE id = ${regId} AND competition_id = ${compId}
      `);
      // Also soft-delete any CTM records this registration owns
      await db.execute(sql`
        UPDATE competition_team_members SET removed_at = NOW() WHERE registration_id = ${regId} AND removed_at IS NULL
      `);
      res.json({ success: true });
    } catch (err) {
      console.error("remove-from-team error:", err);
      res.status(500).json({ error: "Failed to remove from team" });
    }
  });

  app.post("/api/admin/competitions/:compId/registrations/:regId/members/:memberId/make-captain", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { regId, memberId } = req.params;

      // Fetch current registration (need current captain user_id)
      const regResult = await db.execute(sql`
        SELECT cr.id, cr.user_id, cr.competition_id
        FROM competition_registrations cr
        WHERE cr.id = ${regId}
      `);
      if (!regResult.rows.length) return res.status(404).json({ error: "Registration not found" });
      const reg = regResult.rows[0] as any;

      // Fetch the target team member (must be accepted and not removed)
      const memberResult = await db.execute(sql`
        SELECT id, user_id, role
        FROM competition_team_members
        WHERE id = ${memberId} AND registration_id = ${regId} AND removed_at IS NULL
      `);
      if (!memberResult.rows.length) return res.status(404).json({ error: "Team member not found" });
      const member = memberResult.rows[0] as any;
      if (!member.user_id) return res.status(400).json({ error: "Team member has not yet accepted their invite" });
      if (member.user_id === reg.user_id) return res.status(400).json({ error: "This person is already the captain" });

      const { default: crypto } = await import("crypto");
      const oldCaptainUserId = reg.user_id;
      const newCaptainUserId = member.user_id;

      // 1. Promote: update the registration owner to the new captain
      await db.execute(sql`
        UPDATE competition_registrations SET user_id = ${newCaptainUserId} WHERE id = ${regId}
      `);

      // 2. Remove the new captain's team_member row (they are now the registration owner)
      await db.execute(sql`
        UPDATE competition_team_members SET removed_at = NOW()
        WHERE id = ${memberId} AND registration_id = ${regId}
      `);

      // 3. Add the old captain as a regular member (accepted, so they remain on the team)
      await db.execute(sql`
        INSERT INTO competition_team_members (id, registration_id, user_id, role, invite_status)
        VALUES (${crypto.randomUUID()}, ${regId}, ${oldCaptainUserId}, 'member', 'accepted')
      `);

      res.json({ success: true });
    } catch (err) {
      console.error("make-captain error:", err);
      res.status(500).json({ error: "Failed to transfer captaincy" });
    }
  });

  app.delete("/api/competitions/:id/registrations/:regId/purge", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const reg = await db.execute(sql`SELECT * FROM competition_registrations WHERE id = ${req.params.regId} AND competition_id = ${req.params.id}`);
      if (!reg.rows.length) return res.status(404).json({ error: "Registration not found" });
      const r = reg.rows[0] as any;
      if (r.status !== "withdrawn") return res.status(400).json({ error: "Only withdrawn registrations can be permanently deleted" });
      await db.execute(sql`DELETE FROM competition_team_members WHERE registration_id = ${req.params.regId}`);
      await db.execute(sql`DELETE FROM competition_registrations WHERE id = ${req.params.regId}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to permanently delete registration" });
    }
  });

  app.put("/api/competitions/:id/registrations/:regId/check-in", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      await db.execute(sql`
        UPDATE competition_registrations
        SET status = 'checked_in', checked_in_at = NOW()
        WHERE id = ${req.params.regId} AND competition_id = ${req.params.id}
      `);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to check in athlete" });
    }
  });

  app.post("/api/competitions/:id/scores", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { registrationId, workoutId, score, scoreNumeric, status, dnfReps } = req.body;
      const userId = (req.session as any).userId;
      const resolvedStatus = ["validated", "pending", "dnf", "dns", "dq"].includes(status) ? status : "validated";
      const resolvedDnfReps = resolvedStatus === "dnf" ? (dnfReps ?? null) : null;

      const existing = await db.execute(sql`
        SELECT id FROM competition_scores WHERE registration_id = ${registrationId} AND workout_id = ${workoutId}
      `);

      if (existing.rows.length > 0) {
        await db.execute(sql`
          UPDATE competition_scores SET
            score = ${score}, score_numeric = ${scoreNumeric}, status = ${resolvedStatus},
            dnf_reps = ${resolvedDnfReps}, submitted_by = ${userId}, submitted_at = NOW()
          WHERE registration_id = ${registrationId} AND workout_id = ${workoutId}
        `);
      } else {
        await db.execute(sql`
          INSERT INTO competition_scores (id, registration_id, workout_id, score, score_numeric, submitted_by, status, dnf_reps)
          VALUES (gen_random_uuid(), ${registrationId}, ${workoutId}, ${score}, ${scoreNumeric}, ${userId}, ${resolvedStatus}, ${resolvedDnfReps})
        `);
      }

      const reg = await db.execute(sql`SELECT competition_id, category_id FROM competition_registrations WHERE id = ${registrationId}`);
      if (reg.rows.length > 0) {
        const { competition_id, category_id } = reg.rows[0] as any;
        await refreshLeaderboardCache(competition_id, category_id);
        const io = getIo();
        if (io) {
          io.to(`competition:${competition_id}`).emit("leaderboard:update", { competitionId: competition_id, categoryId: category_id });
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save score" });
    }
  });

  app.put("/api/competitions/:id/scores/:scoreId/validate", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { scoreId } = req.params;
      const { status, rejectionReason } = req.body;

      await db.execute(sql`
        UPDATE competition_scores SET status = ${status}, rejection_reason = ${rejectionReason || null}
        WHERE id = ${scoreId}
      `);

      if (status === "validated") {
        const score = await db.execute(sql`
          SELECT cs.registration_id, cr.competition_id, cr.category_id
          FROM competition_scores cs
          JOIN competition_registrations cr ON cr.id = cs.registration_id
          WHERE cs.id = ${scoreId}
        `);
        if (score.rows.length > 0) {
          const { competition_id, category_id } = score.rows[0] as any;
          await refreshLeaderboardCache(competition_id, category_id);
          const io = getIo();
          if (io) io.to(`competition:${competition_id}`).emit("leaderboard:update", { competitionId: competition_id, categoryId: category_id });
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate score" });
    }
  });

  // PATCH individual heat start time
  app.patch("/api/competitions/:id/heats/:heatId/start-time", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { heatId } = req.params;
      const { startTime } = req.body;
      if (!startTime) return res.status(400).json({ error: "startTime is required" });
      await db.execute(sql`
        UPDATE competition_heats SET start_time = ${new Date(startTime)} WHERE id = ${heatId}
      `);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update heat time" });
    }
  });

  app.post("/api/competitions/:id/heats/generate", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { workoutId, heatSize, startTime, intervalMinutes } = req.body;

      const registrations = await db.execute(sql`
        SELECT id FROM competition_registrations
        WHERE competition_id = ${id} AND status IN ('confirmed', 'checked_in')
        ORDER BY registered_at
      `);

      const size = heatSize || 10;
      const interval = Math.max(1, parseInt(intervalMinutes) || 20);
      const regs = registrations.rows as any[];
      const heatCount = Math.ceil(regs.length / size);

      const existingHeats = await db.execute(sql`SELECT id FROM competition_heats WHERE workout_id = ${workoutId}`);
      for (const heat of existingHeats.rows as any[]) {
        await db.execute(sql`DELETE FROM competition_heat_assignments WHERE heat_id = ${heat.id}`);
      }
      await db.execute(sql`DELETE FROM competition_heats WHERE workout_id = ${workoutId}`);

      const startDt = startTime ? new Date(startTime) : new Date();

      for (let h = 0; h < heatCount; h++) {
        const heatRegs = regs.slice(h * size, (h + 1) * size);
        const heatStart = new Date(startDt.getTime() + h * interval * 60 * 1000);

        const heat = await db.execute(sql`
          INSERT INTO competition_heats (id, workout_id, heat_number, start_time, capacity)
          VALUES (gen_random_uuid(), ${workoutId}, ${h + 1}, ${heatStart}, ${size})
          RETURNING id
        `);
        const heatId = (heat.rows[0] as any).id;

        for (let lane = 0; lane < heatRegs.length; lane++) {
          await db.execute(sql`
            INSERT INTO competition_heat_assignments (id, heat_id, registration_id, lane_number)
            VALUES (gen_random_uuid(), ${heatId}, ${heatRegs[lane].id}, ${lane + 1})
          `);
        }
      }

      res.json({ success: true, heatsGenerated: heatCount });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate heats" });
    }
  });

  app.post("/api/competitions/:id/leaderboard/refresh", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { categoryId } = req.body;

      const cats = categoryId
        ? [{ id: categoryId }]
        : (await db.execute(sql`SELECT id FROM competition_categories WHERE competition_id = ${id}`)).rows;

      for (const cat of cats as any[]) {
        await refreshLeaderboardCache(id, cat.id);
      }

      const io = getIo();
      if (io) io.to(`competition:${id}`).emit("leaderboard:update", { competitionId: id });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh leaderboard" });
    }
  });

  app.get("/api/competitions/:id/export/athletes", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT u.first_name, u.last_name, u.email, cc.name as category, cr.status, cr.payment_status, cr.registered_at
        FROM competition_registrations cr
        JOIN users u ON u.id = cr.user_id
        JOIN competition_categories cc ON cc.id = cr.category_id
        WHERE cr.competition_id = ${req.params.id}
        ORDER BY cc.name, u.last_name
      `);

      const rows = result.rows as any[];
      const csv = ["First Name,Last Name,Email,Category,Status,Payment,Registered At",
        ...rows.map(r => `${r.first_name},${r.last_name},${r.email},${r.category},${r.status},${r.payment_status},${r.registered_at}`)
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="athletes-${req.params.id}.csv"`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to export" });
    }
  });

  app.delete("/api/competitions/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.execute(sql`DELETE FROM competition_heat_assignments WHERE heat_id IN (SELECT id FROM competition_heats WHERE workout_id IN (SELECT id FROM competition_workouts WHERE competition_id = ${id}))`);
      await db.execute(sql`DELETE FROM competition_heats WHERE workout_id IN (SELECT id FROM competition_workouts WHERE competition_id = ${id})`);
      await db.execute(sql`DELETE FROM competition_scores WHERE registration_id IN (SELECT id FROM competition_registrations WHERE competition_id = ${id})`);
      await db.execute(sql`DELETE FROM competition_team_members WHERE registration_id IN (SELECT id FROM competition_registrations WHERE competition_id = ${id})`);
      await db.execute(sql`DELETE FROM competition_registrations WHERE competition_id = ${id}`);
      await db.execute(sql`DELETE FROM competition_workouts WHERE competition_id = ${id}`);
      await db.execute(sql`DELETE FROM competition_categories WHERE competition_id = ${id}`);
      await db.execute(sql`DELETE FROM competitions WHERE id = ${id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete competition" });
    }
  });
}
