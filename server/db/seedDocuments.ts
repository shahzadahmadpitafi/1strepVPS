import { Client } from "@replit/object-storage";
import { db } from "../db";
import { teamDocuments } from "../../shared/schema";
import { count } from "drizzle-orm";

// ─── Document catalogue (fileName → metadata) ───────────────────────────────
const KNOWN_DOCS: Record<string, { title: string; description: string; category: string }> = {
  "platform-overview.pdf": {
    title: "Platform Overview & Getting Started",
    description: "Complete introduction to the 1stRep multi-sided platform, architecture, user roles, and first-time setup.",
    category: "general",
  },
  "customer-storefront-guide.pdf": {
    title: "Customer Storefront Guide",
    description: "Everything customers need to browse, shop, manage orders, and use their account on 1stRep.",
    category: "general",
  },
  "orders-fulfilment-guide.pdf": {
    title: "Orders & Fulfilment Management",
    description: "How all order types are managed, processed, and fulfilled across the 1stRep platform.",
    category: "general",
  },
  "products-inventory-guide.pdf": {
    title: "Products, Inventory & Warehouse Guide",
    description: "Managing the 1stRep product catalogue, stock levels, and warehouse operations.",
    category: "general",
  },
  "reseller-b2b-licence-guide.pdf": {
    title: "Reseller, B2B Partners & Licence Guide",
    description: "Complete guide to the 1stRep reseller programme, B2B licensing, EPOS terminal, and partner management.",
    category: "reseller",
  },
  "influencer-programme-guide.pdf": {
    title: "Influencer Programme Complete Guide",
    description: "Everything about the 1stRep Influencer Programme — for influencers, admins, and the team.",
    category: "influencer",
  },
  "crm-marketing-support-guide.pdf": {
    title: "CRM, Marketing & Customer Support Guide",
    description: "Managing customers, running marketing campaigns, and handling support on the 1stRep platform.",
    category: "general",
  },
  "platform-admin-settings-guide.pdf": {
    title: "Platform Administration & Settings Guide",
    description: "System-wide configuration, team management, homepage content, reports, and platform settings.",
    category: "general",
  },
  "1st_rep_reseller_influencer_model_FULL16.03.26.pdf": {
    title: "1stRep Reseller & Influencer Business Model",
    description: "Full reseller and influencer business model document — March 2026.",
    category: "general",
  },
};

// ─── Main seed function ───────────────────────────────────────────────────────
export async function seedDocumentsFromStorage(force = false): Promise<void> {
  try {
    // Check if any documents exist already (skip unless forced)
    if (!force) {
      const [{ value: docCount }] = await db.select({ value: count() }).from(teamDocuments);
      if (docCount > 0) {
        console.log(`📂 Documents already exist (${docCount} found) - skipping document seeding`);
        return;
      }
    }

    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) {
      console.warn("⚠️  No DEFAULT_OBJECT_STORAGE_BUCKET_ID set — skipping document seeding");
      return;
    }

    console.log("📄 No documents found — seeding from object storage...");
    const objClient = new Client({ bucketId });

    const listResult = await objClient.list({ prefix: "team-documents/" });
    if (!listResult.ok) {
      console.warn("⚠️  Could not list object storage:", listResult.error?.message);
      return;
    }

    const allObjects = listResult.value;

    // For each known filename, pick the most recent copy from storage
    const latestByFile: Record<string, { path: string; ts: number }> = {};

    for (const obj of allObjects) {
      const name = obj.name; // e.g. "team-documents/1774284794823-platform-overview.pdf"
      const withoutPrefix = name.replace("team-documents/", "");
      const dashIdx = withoutPrefix.indexOf("-");
      if (dashIdx === -1) continue;

      const ts = parseInt(withoutPrefix.slice(0, dashIdx));
      const fileName = withoutPrefix.slice(dashIdx + 1);

      if (!KNOWN_DOCS[fileName]) continue;

      if (!latestByFile[fileName] || ts > latestByFile[fileName].ts) {
        latestByFile[fileName] = { path: name, ts };
      }
    }

    let seeded = 0;
    for (const [fileName, { path }] of Object.entries(latestByFile)) {
      const meta = KNOWN_DOCS[fileName];
      try {
        await db.insert(teamDocuments).values({
          title: meta.title,
          description: meta.description,
          category: meta.category,
          fileName,
          fileType: "application/pdf",
          fileSize: 0,
          objectPath: path,
          uploadedByName: "1stRep System",
        });
        console.log(`  ✅  Registered: ${meta.title}`);
        seeded++;
      } catch (err: any) {
        console.warn(`  ⚠️  Failed to register ${fileName}:`, err.message);
      }
    }

    console.log(`📄 Document seeding complete — ${seeded} document(s) registered.`);
  } catch (error) {
    console.error("❌ Error seeding documents from storage:", error);
  }
}
