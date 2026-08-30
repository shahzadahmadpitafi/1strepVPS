import { db, pool } from "../db";
import { products, announcementBanner, chatbotKnowledge, productVariants, siteSettings, productSections, productActivityTypes } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { seedDocumentsFromStorage } from "./seedDocuments";

// Helper function to ensure critical tables exist
async function ensureCriticalTablesExist() {
  console.log("🔧 Checking for missing database tables...");
  
  // Check and create warehouses table if missing
  try {
    const warehouseCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'warehouses'
      );
    `);
    
    const exists = warehouseCheck.rows[0]?.exists;
    
    if (!exists) {
      console.log("📦 Creating warehouses table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS warehouses (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          code VARCHAR(50) UNIQUE NOT NULL,
          address TEXT NOT NULL,
          city VARCHAR(100) NOT NULL,
          postal_code VARCHAR(20) NOT NULL,
          country VARCHAR(100) DEFAULT 'UK' NOT NULL,
          contact_name VARCHAR(255),
          contact_phone VARCHAR(50),
          contact_email VARCHAR(255),
          is_primary BOOLEAN DEFAULT FALSE NOT NULL,
          is_active BOOLEAN DEFAULT TRUE NOT NULL,
          capacity INTEGER,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ Warehouses table created");
    }
  } catch (error) {
    console.error("Error checking/creating warehouses table:", error);
  }
  
  // Check and create warehouse_inventory table if missing
  try {
    const inventoryCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'warehouse_inventory'
      );
    `);
    
    const exists = inventoryCheck.rows[0]?.exists;
    
    if (!exists) {
      console.log("📦 Creating warehouse_inventory table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS warehouse_inventory (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          warehouse_id VARCHAR NOT NULL,
          product_id VARCHAR NOT NULL,
          size VARCHAR(50),
          color VARCHAR(100),
          quantity INTEGER DEFAULT 0 NOT NULL,
          location VARCHAR(100),
          min_stock_level INTEGER DEFAULT 10 NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ Warehouse inventory table created");
    }
  } catch (error) {
    console.error("Error checking/creating warehouse_inventory table:", error);
  }
  
  // Ensure pending_website_checkouts table exists (ghost payment prevention)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pending_website_checkouts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_link_id VARCHAR UNIQUE NOT NULL,
        square_order_id VARCHAR,
        customer_info JSONB NOT NULL,
        cart_items JSONB NOT NULL,
        subtotal NUMERIC(10,2),
        shipping NUMERIC(10,2),
        total NUMERIC(10,2),
        coupon JSONB,
        terms_accepted_at VARCHAR,
        user_id VARCHAR,
        status VARCHAR DEFAULT 'pending',
        order_number VARCHAR,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      )
    `);
    console.log("✅ pending_website_checkouts table checked/created");
  } catch (err) {
    console.error("Error ensuring pending_website_checkouts table:", err);
  }

  // Check and add missing columns to products table
  const productColumnsToCheck = [
    { name: 'model_info', type: 'TEXT' },
    { name: 'is_protected', type: 'BOOLEAN DEFAULT FALSE' },
    { name: 'is_deleted', type: 'BOOLEAN DEFAULT FALSE' },
    { name: 'deleted_at', type: 'TIMESTAMP' },
    { name: 'deleted_by', type: 'VARCHAR' },
    { name: 'detailed_description', type: 'TEXT' },
    { name: 'hover_image_url', type: 'TEXT' },
    { name: 'video_url', type: 'TEXT' },
    { name: 'barcode_descriptor', type: 'TEXT' },
    { name: 'is_hero_product', type: 'BOOLEAN DEFAULT FALSE' },
    { name: 'collections', type: 'TEXT[]' },
    { name: 'gender', type: 'VARCHAR DEFAULT \'unisex\'' },
    { name: 'activity_type', type: 'VARCHAR DEFAULT \'general\'' },
    { name: 'sale_price', type: 'DECIMAL(8,2)' }, // Sale price for discount display
    { name: 'wholesale_sale_price', type: 'DECIMAL(8,2)' }, // Sale price for resellers
  ];
  
  for (const col of productColumnsToCheck) {
    try {
      const columnCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'products'
          AND column_name = ${col.name}
        );
      `);
      
      const exists = columnCheck.rows[0]?.exists;
      
      if (!exists) {
        console.log(`📝 Adding ${col.name} column to products table...`);
        await db.execute(sql.raw(`ALTER TABLE products ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`));
        console.log(`✅ ${col.name} column added`);
      }
    } catch (error) {
      console.error(`Error checking/adding ${col.name} column:`, error);
    }
  }
  
  // Check and add missing columns to product_images table
  try {
    const hoverUrlCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'product_images'
        AND column_name = 'hover_url'
      );
    `);
    
    if (!hoverUrlCheck.rows[0]?.exists) {
      console.log("📝 Adding hover_url column to product_images table...");
      await db.execute(sql`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS hover_url TEXT;`);
      console.log("✅ hover_url column added");
    }
  } catch (error) {
    console.error("Error checking/adding hover_url column:", error);
  }
  
  // Check and add columns to product_variants table
  const variantColumnsToCheck = [
    { name: 'pack_quantity', type: 'INTEGER NOT NULL DEFAULT 1' },
    { name: 'sale_price', type: 'DECIMAL(8,2)' }, // Variant-level sale price override for retail
    { name: 'wholesale_sale_price', type: 'DECIMAL(8,2)' }, // Variant-level sale price override for resellers
  ];
  
  for (const col of variantColumnsToCheck) {
    try {
      const columnCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'product_variants'
          AND column_name = ${col.name}
        );
      `);
      
      const exists = columnCheck.rows[0]?.exists;
      
      if (!exists) {
        console.log(`📝 Adding ${col.name} column to product_variants table...`);
        await db.execute(sql.raw(`ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`));
        console.log(`✅ ${col.name} column added to product_variants`);
      }
    } catch (error) {
      console.error(`Error checking/adding ${col.name} column to product_variants:`, error);
    }
  }
  
  // Check and add missing columns to site_settings table
  const siteSettingsColumnsToCheck = [
    { name: 'show_hero_products', type: 'BOOLEAN NOT NULL DEFAULT true' },
  ];
  
  for (const col of siteSettingsColumnsToCheck) {
    try {
      const columnCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'site_settings'
          AND column_name = ${col.name}
        );
      `);
      
      const exists = columnCheck.rows[0]?.exists;
      
      if (!exists) {
        console.log(`📝 Adding ${col.name} column to site_settings table...`);
        await db.execute(sql.raw(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`));
        console.log(`✅ ${col.name} column added to site_settings`);
      }
    } catch (error) {
      console.error(`Error checking/adding ${col.name} column to site_settings:`, error);
    }
  }

  // Check and add missing columns to reseller_licences table
  const resellerLicenceColumnsToCheck = [
    { name: 'trial_requested_at', type: 'TIMESTAMP' },
    { name: 'trial_approved_at', type: 'TIMESTAMP' },
    { name: 'trial_approved_by', type: 'VARCHAR' },
    { name: 'trial_started_at', type: 'TIMESTAMP' },
    { name: 'trial_ends_at', type: 'TIMESTAMP' },
    { name: 'activated_at', type: 'TIMESTAMP' },
    { name: 'expires_at', type: 'TIMESTAMP' },
    { name: 'cancelled_at', type: 'TIMESTAMP' },
    { name: 'cancellation_reason', type: 'TEXT' },
    { name: 'stripe_subscription_id', type: 'TEXT' },
    { name: 'stripe_customer_id', type: 'TEXT' },
    { name: 'stripe_price_id', type: 'TEXT' },
    { name: 'price_amount', type: 'DECIMAL(10,2)' },
    { name: 'currency', type: "VARCHAR(3) DEFAULT 'GBP'" },
    { name: 'product_limit', type: 'INTEGER' },
  ];

  for (const col of resellerLicenceColumnsToCheck) {
    try {
      const columnCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'reseller_licences'
          AND column_name = ${col.name}
        );
      `);
      const exists = columnCheck.rows[0]?.exists;
      if (!exists) {
        console.log(`📝 Adding ${col.name} column to reseller_licences table...`);
        await db.execute(sql.raw(`ALTER TABLE reseller_licences ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`));
        console.log(`✅ ${col.name} column added to reseller_licences`);
      }
    } catch (error) {
      console.error(`Error checking/adding ${col.name} column to reseller_licences:`, error);
    }
  }

  // Check and create athlete_tier enum and athlete_profiles table
  try {
    const athleteProfilesCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'athlete_profiles'
      );
    `);
    
    const athleteProfilesExists = athleteProfilesCheck.rows[0]?.exists;
    
    if (!athleteProfilesExists) {
      console.log("🏃 Creating athlete_tier enum and athlete_profiles table...");
      
      // Create enum if it doesn't exist
      await db.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'athlete_tier') THEN
            CREATE TYPE athlete_tier AS ENUM ('bronze', 'silver', 'gold', 'elite');
          END IF;
        END
        $$;
      `);
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS athlete_profiles (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          application_id VARCHAR REFERENCES athlete_applications(id),
          tier athlete_tier NOT NULL DEFAULT 'bronze',
          discount_code TEXT NOT NULL UNIQUE,
          discount_percentage INTEGER NOT NULL DEFAULT 50,
          sport TEXT NOT NULL,
          instagram TEXT,
          tiktok TEXT,
          youtube TEXT,
          bio TEXT,
          profile_image_url TEXT,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          is_featured BOOLEAN NOT NULL DEFAULT FALSE,
          onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
          total_sales_generated TEXT NOT NULL DEFAULT '0',
          total_orders_generated INTEGER NOT NULL DEFAULT 0,
          joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
          last_active_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ athlete_profiles table created");
    }
  } catch (error) {
    console.error("Error checking/creating athlete_profiles table:", error);
  }

  // Check and create athlete_content_submissions table
  try {
    const contentSubmissionsCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'athlete_content_submissions'
      );
    `);
    
    const contentSubmissionsExists = contentSubmissionsCheck.rows[0]?.exists;
    
    if (!contentSubmissionsExists) {
      console.log("📸 Creating athlete_content_submissions table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS athlete_content_submissions (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          athlete_profile_id VARCHAR NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
          content_type TEXT NOT NULL,
          platform TEXT NOT NULL,
          content_url TEXT,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          reviewed_at TIMESTAMP,
          reviewed_by VARCHAR REFERENCES users(id),
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ athlete_content_submissions table created");
    }
  } catch (error) {
    console.error("Error checking/creating athlete_content_submissions table:", error);
  }

  // Check for company_stores table
  try {
    const storesResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'company_stores'
      );
    `);
    const storesTableExists = storesResult.rows[0]?.exists;
    
    if (!storesTableExists) {
      console.log("📍 Creating company_stores table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS company_stores (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          phone TEXT,
          hours TEXT,
          features TEXT[],
          image_url TEXT,
          map_url TEXT,
          display_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ company_stores table created");
    }
  } catch (error) {
    console.error("Error checking/creating company_stores table:", error);
  }

  // Check and create product_reviews table if missing
  try {
    const reviewsCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'product_reviews'
      );
    `);
    const exists = reviewsCheck.rows[0]?.exists;
    if (!exists) {
      console.log("⭐ Creating product_reviews table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS product_reviews (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id VARCHAR NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          rating INTEGER NOT NULL,
          comment TEXT NOT NULL,
          is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          UNIQUE (product_id, user_id)
        );
      `);
      console.log("✅ product_reviews table created");
    }
  } catch (error) {
    console.error("Error checking/creating product_reviews table:", error);
  }

  // Ensure is_recovered column exists on admin_notifications
  // Use pool.query() (direct pg) for DDL — more reliable than Drizzle's execute()
  try {
    // First check if column exists to give clear log output
    const colCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'admin_notifications' AND column_name = 'is_recovered'
    `);
    if (colCheck.rows.length === 0) {
      await pool.query(`
        ALTER TABLE admin_notifications
        ADD COLUMN IF NOT EXISTS is_recovered boolean NOT NULL DEFAULT false
      `);
      console.log("✅ Added is_recovered column to admin_notifications");
    } else {
      console.log("✅ is_recovered column already exists on admin_notifications");
    }
  } catch (error) {
    console.error("❌ Error adding is_recovered column:", error);
  }

  // Ensure order_email_log table exists
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_email_log (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id varchar NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        email_type varchar(50) NOT NULL,
        sent_at timestamp DEFAULT now(),
        recipient varchar NOT NULL,
        subject varchar NOT NULL,
        success boolean NOT NULL DEFAULT true
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_order_email_log_order_id ON order_email_log(order_id)
    `);
    // Add subject column to order_email_log if it doesn't exist (drizzle schema)
    await pool.query(`ALTER TABLE order_email_log ADD COLUMN IF NOT EXISTS subject text`);
    console.log("✅ order_email_log table checked/created");
  } catch (error) {
    console.error("❌ Error creating order_email_log table:", error);
  }

  // Add own_square_paid column to customer_orders if missing
  try {
    await pool.query(`ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS own_square_paid boolean DEFAULT false`);
    console.log("✅ customer_orders.own_square_paid column ensured");
  } catch (error) {
    console.error("❌ Error creating order_email_log table:", error);
  }

  // Add sms_last_error / sms_last_error_at columns to customer_orders if missing
  try {
    await pool.query(`ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS sms_last_error text`);
    await pool.query(`ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS sms_last_error_at timestamp`);
    console.log("✅ customer_orders.sms_last_error columns ensured");
  } catch (error) {
    console.error("❌ Error adding sms_last_error columns:", error);
  }

  // Add review_sms_sent_at column to customer_orders if missing
  try {
    await pool.query(`ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS review_sms_sent_at timestamp`);
    console.log("✅ customer_orders.review_sms_sent_at column ensured");
  } catch (error) {
    console.error("❌ Error adding review_sms_sent_at column:", error);
  }

  // Add fixed_credits_per_order column to influencer_discount_variants if missing
  // (present in shared/schema.ts but was never migrated onto the live DB —
  // broke creating any new discount variant with a 500 error)
  try {
    await pool.query(`ALTER TABLE influencer_discount_variants ADD COLUMN IF NOT EXISTS fixed_credits_per_order integer NOT NULL DEFAULT 0`);
    console.log("✅ influencer_discount_variants.fixed_credits_per_order column ensured");
  } catch (error) {
    console.error("❌ Error ensuring influencer_discount_variants.fixed_credits_per_order column:", error);
  }

  // Ensure stock_alert_subscriptions table exists
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_alert_subscriptions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id varchar NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        variant_id varchar,
        notification_sent boolean NOT NULL DEFAULT false,
        created_at timestamp DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_alert_subscriptions_user_id ON stock_alert_subscriptions(user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_alert_subscriptions_product_id ON stock_alert_subscriptions(product_id)
    `);
    console.log("✅ stock_alert_subscriptions table checked/created");
  } catch (error) {
    console.error("❌ Error creating stock_alert_subscriptions table:", error);
  }

  // Ensure commission_earner_type enum + commissions table commission_type column exist
  try {
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE commission_earner_type AS ENUM ('reseller', 'vendor');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await pool.query(`
      ALTER TABLE commissions
        ADD COLUMN IF NOT EXISTS commission_type commission_earner_type NOT NULL DEFAULT 'reseller';
    `);
    await pool.query(`
      ALTER TABLE commission_payouts
        ADD COLUMN IF NOT EXISTS commission_type commission_earner_type NOT NULL DEFAULT 'reseller';
    `);
    console.log("✅ commission_earner_type enum + columns checked/created");
  } catch (error) {
    console.error("❌ Error ensuring commission_earner_type:", error);
  }

  // Ensure shirt_size columns exist for competition registrations/team members
  try {
    await pool.query(`
      ALTER TABLE competition_registrations
        ADD COLUMN IF NOT EXISTS shirt_size VARCHAR(10);
    `);
    await pool.query(`
      ALTER TABLE competition_team_members
        ADD COLUMN IF NOT EXISTS shirt_size VARCHAR(10);
    `);
    await pool.query(`
      ALTER TABLE competition_team_members
        ADD COLUMN IF NOT EXISTS waiver_signed BOOLEAN DEFAULT FALSE;
    `);
    await pool.query(`
      ALTER TABLE competition_team_members
        ADD COLUMN IF NOT EXISTS waiver_signed_at TIMESTAMP;
    `);
    console.log("✅ shirt_size columns checked/created on competition tables");
  } catch (error) {
    console.error("❌ Error ensuring shirt_size columns:", error);
  }

  console.log("✅ Database table check complete");
}

// Seed data for announcement banner
const bannerSeedData = {
  message: "Summer Sale: 50% OFF | Limited Time Only",
  isVisible: true,
  backgroundColor: "#000000",
  textColor: "#ffffff",
};

// Seed data for product sections
const productSectionsSeedData = [
  { name: "Hoodies and Jumpers", slug: "hoodies-and-jumpers", description: "", displayOrder: 1, isActive: true },
  { name: "T-Shirts", slug: "t-shirts", description: "", displayOrder: 2, isActive: true },
  { name: "Leggings", slug: "leggings", description: "", displayOrder: 3, isActive: true },
  { name: "Vests & Crop Tops", slug: "vests-crop-tops", description: "", displayOrder: 4, isActive: true },
  { name: "Shorts", slug: "shorts", description: "", displayOrder: 5, isActive: true },
  { name: "Jackets", slug: "jackets", description: "", displayOrder: 6, isActive: true },
  { name: "Hats", slug: "hats", description: "", displayOrder: 7, isActive: true },
  { name: "Accessories", slug: "accessories", description: "", displayOrder: 8, isActive: true },
];

// Seed data for product activity types
const productActivityTypesSeedData = [
  { name: "Gym", slug: "gym", description: "", displayOrder: 1, isActive: true },
  { name: "Running", slug: "running", description: "", displayOrder: 2, isActive: true },
  { name: "Yoga", slug: "yoga", description: "", displayOrder: 3, isActive: true },
  { name: "CrossFit", slug: "crossfit", description: "", displayOrder: 4, isActive: true },
  { name: "Casual", slug: "casual", description: "", displayOrder: 5, isActive: true },
  { name: "Training", slug: "training", description: "", displayOrder: 6, isActive: true },
];

// Product seed data is now empty - add real products through the admin dashboard
const productsSeedData: any[] = [];

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // First, ensure all critical tables exist (fixes production schema issues)
    await ensureCriticalTablesExist();

    // Always ensure banner has correct colors (fixes production banner)
    console.log("📢 Ensuring announcement banner has correct colors...");
    const existingBanner = await db.select().from(announcementBanner).limit(1);
    
    if (existingBanner.length === 0) {
      await db.insert(announcementBanner).values(bannerSeedData);
      console.log("✅ Announcement banner created");
    } else {
      // Update banner colors if they're different (fixes old blue banner)
      await db.update(announcementBanner)
        .set({ 
          backgroundColor: bannerSeedData.backgroundColor,
          textColor: bannerSeedData.textColor 
        })
        .where(eq(announcementBanner.id, existingBanner[0].id));
      console.log("✅ Announcement banner colors updated");
    }

    // Seed product sections
    console.log("📂 Checking product sections...");
    const existingSections = await db.select().from(productSections).limit(1);
    
    if (existingSections.length > 0) {
      console.log("✅ Product sections already exist - skipping seeding");
    } else {
      console.log("📂 Seeding product sections...");
      try {
        await db.insert(productSections).values(productSectionsSeedData);
        console.log(`✅ Successfully seeded ${productSectionsSeedData.length} product sections`);
      } catch (error) {
        console.error("❌ Failed to seed product sections:", error);
      }
    }

    // Seed product activity types
    console.log("🏃 Checking product activity types...");
    const existingActivityTypes = await db.select().from(productActivityTypes).limit(1);
    
    if (existingActivityTypes.length > 0) {
      console.log("✅ Product activity types already exist - skipping seeding");
    } else {
      console.log("🏃 Seeding product activity types...");
      try {
        await db.insert(productActivityTypes).values(productActivityTypesSeedData);
        console.log(`✅ Successfully seeded ${productActivityTypesSeedData.length} product activity types`);
      } catch (error) {
        console.error("❌ Failed to seed product activity types:", error);
      }
    }

    // Check if products already exist
    const existingProducts = await db.select().from(products).limit(1);
    
    let allProducts: typeof products.$inferSelect[] = [];
    if (existingProducts.length > 0) {
      console.log("✅ Products already exist - skipping product seeding");
      allProducts = await db.select().from(products);
    } else if (productsSeedData.length > 0) {
      // Seed products only if there's seed data
      console.log("🛍️ Seeding products...");
      try {
        allProducts = await db.insert(products).values(productsSeedData).returning();
        console.log(`✅ Successfully seeded ${productsSeedData.length} products`);
      } catch (error) {
        console.error("❌ Failed to seed products:", error);
        return;
      }
    } else {
      console.log("📦 No seed products defined - ready for real product uploads");
      allProducts = [];
    }

    // Seed product variants based on sizes and colors
    console.log("📦 Checking product variants...");
    const existingVariants = await db.select().from(productVariants).limit(1);
    
    if (existingVariants.length > 0) {
      console.log("✅ Product variants already exist - skipping variant seeding");
    } else if (allProducts.length === 0) {
      console.log("📦 No products to create variants for - ready for real product uploads");
    } else {
      console.log("📦 Seeding product variants...");
      try {
        const variantsToInsert = [];
        
        for (const product of allProducts) {
          // Use product's actual sizes and colors from database
          const sizes = product.sizes || [];
          const colors = product.colors || [];
          
          if (sizes.length === 0 || colors.length === 0) {
            console.warn(`⚠️  Product ${product.name} has no sizes or colors defined`);
            continue;
          }
          
          // Get stock quantity from seed data (products don't have stock, variants do)
          const seedData = productsSeedData.find(sd => sd.sku === product.sku);
          const totalStock = seedData?.stockQuantity || 100; // Default to 100 if not in seed data
          
          // Calculate stock per variant (distribute evenly with remainder to first variants)
          const variantCount = sizes.length * colors.length;
          const baseStock = Math.floor(totalStock / variantCount);
          const remainder = totalStock % variantCount;
          
          let remainderUsed = 0;
          
          // Create variants for each size/color combination
          for (const size of sizes) {
            for (const color of colors) {
              // Add 1 extra stock to first N variants where N = remainder
              const stockForVariant = baseStock + (remainderUsed < remainder ? 1 : 0);
              remainderUsed++;
              
              if (isNaN(stockForVariant)) {
                console.error(`❌ NaN stock for product ${product.name} (SKU: ${product.sku})`);
                console.error('   Debug:', { totalStock, variantCount, baseStock, remainder, stockForVariant });
                throw new Error(`Invalid stock quantity for product ${product.name}`);
              }
              
              // Generate unique SKU (remove # and use full color code to avoid duplicates)
              const colorCode = color.replace(/#/g, '').substring(0, 6).toUpperCase();
              
              variantsToInsert.push({
                productId: product.id,
                size,
                color,
                sku: `${product.sku}-${size}-${colorCode}`,
                retailPrice: product.retailPrice,
                wholesalePrice: product.wholesalePrice,
                costPrice: product.costPrice,
                stockQuantity: stockForVariant,
                isActive: true,
              });
            }
          }
        }
        
        if (variantsToInsert.length === 0) {
          console.error("❌ No variants were created! Check product sizes/colors in database.");
          throw new Error("Variant seeding failed - no variants created");
        }
        
        await db.insert(productVariants).values(variantsToInsert);
        console.log(`✅ Successfully seeded ${variantsToInsert.length} product variants`);
      } catch (error) {
        console.error("❌ Failed to seed product variants:", error);
      }
    }

    // Seed chatbot knowledge base
    console.log("🤖 Checking chatbot knowledge base...");
    const existingKnowledge = await db.select().from(chatbotKnowledge).limit(1);
    
    if (existingKnowledge.length === 0) {
      console.log("📚 Seeding chatbot knowledge base...");
      const chatbotSeedData = [
        {
          question: "What is your shipping policy?",
          answer: "Standard UK delivery takes 3-5 business days and costs £4.99. Express delivery (1-2 business days) is available for £9.99. Free shipping on orders over £50. International shipping varies by destination.",
          category: "shipping",
          tags: ["shipping", "delivery", "policy"],
          isActive: true,
          priority: 10,
        },
        {
          question: "What are your shipping policies?",
          answer: "We offer standard UK delivery (3-5 business days, £4.99) and express delivery (1-2 business days, £9.99). Orders over £50 ship free within the UK. International shipping available with costs calculated at checkout.",
          category: "shipping",
          tags: ["shipping", "delivery", "policies"],
          isActive: true,
          priority: 10,
        },
        {
          question: "How long does shipping take?",
          answer: "Standard UK delivery takes 3-5 business days. Express delivery takes 1-2 business days. International shipping typically takes 7-14 business days depending on your location.",
          category: "shipping",
          tags: ["shipping", "delivery", "time"],
          isActive: true,
          priority: 9,
        },
        {
          question: "What is your return policy?",
          answer: "We offer a 30-day return policy for unworn, unwashed items with original tags attached. Returns are free within the UK. Contact our support team to initiate a return.",
          category: "returns",
          tags: ["returns", "refund", "policy"],
          isActive: true,
          priority: 9,
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit and debit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay. All payments are securely processed through Stripe.",
          category: "payment",
          tags: ["payment", "checkout", "cards"],
          isActive: true,
          priority: 8,
        },
        {
          question: "What sizes do you offer?",
          answer: "We offer sizes from XS to XXL for most items. Each product page includes a detailed size guide with measurements. Check the size guide for each specific item as sizing may vary between products.",
          category: "sizing",
          tags: ["sizes", "fit", "measurements"],
          isActive: true,
          priority: 8,
        },
      ];
      
      try {
        await db.insert(chatbotKnowledge).values(chatbotSeedData);
        console.log(`✅ Successfully seeded ${chatbotSeedData.length} chatbot knowledge entries`);
      } catch (error) {
        console.error("❌ Failed to seed chatbot knowledge:", error);
      }
    } else {
      console.log("✅ Chatbot knowledge already exists - skipping seeding");
    }

    // Seed site settings (theme and chatbot visibility)
    console.log("⚙️  Checking site settings...");
    const existingSettings = await db.select().from(siteSettings).limit(1);
    
    if (existingSettings.length === 0) {
      console.log("⚙️  Seeding site settings...");
      try {
        await db.insert(siteSettings).values({
          activeTheme: "clean_minimal",
          chatbotVisible: true,
        });
        console.log("✅ Site settings seeded successfully");
      } catch (error) {
        console.error("❌ Failed to seed site settings:", error);
      }
    } else {
      // Force migration: Ensure Clean Minimal is the active theme
      // This ensures production database uses the correct theme
      const currentTheme = existingSettings[0]?.activeTheme;
      if (currentTheme !== "clean_minimal") {
        console.log(`🔄 Migrating theme from ${currentTheme} to clean_minimal...`);
        try {
          await db.update(siteSettings)
            .set({ activeTheme: "clean_minimal", updatedAt: new Date() })
            .where(eq(siteSettings.id, existingSettings[0].id));
          console.log("✅ Theme migrated to clean_minimal successfully");
        } catch (error) {
          console.error("❌ Failed to migrate theme:", error);
        }
      } else {
        console.log("✅ Site settings already use clean_minimal theme");
      }
    }

    // Seed documents from object storage if none exist
    await seedDocumentsFromStorage();

    // ── Seed competitions ─────────────────────────────────────────────────
    console.log("🏆 Checking competitions...");
    try {
      // Always attempt to insert competitions — ON CONFLICT DO NOTHING is safe
      const competitions = [
          {
            id: "d491693f-3a77-4791-b665-6b5543604399",
            name: "1stRep Community Throwdown",
            slug: "1strep-community-throwdown",
            description: "The 1stRep Community Throwdown is our free, community-first event celebrating the athletes, resellers, and partners that make the 1stRep family what it is.\n\nThis is an accessible, fun event — all fitness levels welcome. Workouts are programmed to be inclusive with Rx and scaled options. Expect giveaways, brand activations, and the best community vibes in the game. No entry fee. Just show up and compete.",
            type: "single_day", format: "teams_of_2", location: "Birmingham", venue: "1stRep HQ Gym", address: "Unit 14, Aston Business Park, Birmingham, B6 7RL",
            start_date: "2026-04-25 10:00:00", end_date: "2026-04-25 17:00:00", registration_close_date: "2026-04-23 23:59:00",
            max_participants: null, entry_fee: 0, is_public: true, status: "registration_open",
            rules: "1. Open to all fitness levels — this is a community event, not elite competition.\n2. Scaled options available for every workout.\n3. Bring your own water bottle — hydration stations on site.\n4. 1stRep gear giveaways for podium finishers in each category.\n5. Results are final — but this is for fun, not points.",
          },
          {
            id: "c495f32b-8f51-4681-9fcf-308ab15fb5cd",
            name: "Primal Ultra",
            slug: "primal-ultra-manchester",
            description: "Primal Ultra is an individual challenge event designed to test your athletic ceiling across 5 workouts in a single day. No teams, no partners — just you versus the clock and the barbell.\n\nWorkouts span all domains: aerobic capacity, gymnastic skill, Olympic lifting, and raw strength. The athlete with the lowest combined points total wins.",
            type: "single_day", format: "individual", location: "Manchester", venue: "Primal CrossFit", address: "8 Trafford Park Rd, Trafford Park, Manchester, M17 1PA",
            start_date: "2026-04-17 09:00:00", end_date: "2026-04-17 18:00:00", registration_close_date: "2026-04-14 23:59:00",
            max_participants: null, entry_fee: 7500, is_public: true, status: "registration_open",
            rules: "1. Rx athletes must complete all movements as prescribed — no substitutions.\n2. Scaled athletes may substitute specified movements but must declare all subs at check-in.\n3. Athletes failing to start a workout forfeit points for that event.\n4. Ties are broken by comparing individual event rankings (count-back).\n5. Athletes must be present for the mandatory briefing at 08:30.",
          },
          {
            id: "8304ed30-b69b-4ea8-a943-53723357e69c",
            name: "Ring Muscle Up Workshop",
            slug: "ring-muscle-up-workshop",
            description: "A half-day technical workshop focused exclusively on ring muscle-ups. Whether you're learning from scratch or cleaning up your kip, this workshop breaks it all down with progressions, drills, and coached reps.\n\nSmall group format (max 12) ensures you get individual coaching time. Suitable for anyone with a strict pull-up and a desire to get their first muscle-up.",
            type: "single_day", format: "individual", location: "Kings Langley", venue: "Gymnastic Bodies UK", address: "11 Station Road, Kings Langley, Hertfordshire, WD4 8LB",
            start_date: "2026-04-12 10:00:00", end_date: "2026-04-12 14:00:00", registration_close_date: "2026-04-11 23:59:00",
            max_participants: 12, entry_fee: 2000, is_public: true, status: "registration_open",
            rules: "1. Participants must be able to perform 5 strict pull-ups as a baseline.\n2. Bring your own chalk — liquid chalk only.\n3. Gym rings are provided but athletes may use their own if standard size.\n4. Comfortable attire required — no jeans or restrictive clothing.\n5. Arrive 10 minutes before start time.",
          },
          {
            id: "6f9aa2c9-e2e3-49fb-be23-1be2cf7d0746",
            name: "The Hybrid Series 002 — Redline",
            slug: "hybrid-series-002-redline",
            description: "Hybrid Series 002 is the second event in an ongoing series designed to push hybrid athletes to their absolute limit. This edition — 'Redline' — features max-effort cardiovascular tests combined with strength cycling.\n\nPairs format, online scoring available with a submission window. Perfect for remote teams who want to benchmark against the field.",
            type: "hybrid", format: "teams_of_2", location: "Benton", venue: "Redline Performance", address: "Whitley Rd, Benton, Newcastle upon Tyne, NE12 9TN",
            start_date: "2026-04-12 09:00:00", end_date: "2026-04-12 17:00:00", registration_close_date: "2026-04-10 23:59:00",
            max_participants: null, entry_fee: 3000, is_public: true, status: "registration_open",
            rules: "1. Online submissions require video evidence of all reps.\n2. Time-stamped videos only — no editing or cutting.\n3. Score disputes must be raised within 24 hours of submission.\n4. Remote teams must submit videos through the official submission portal.\n5. In-person teams are scored by judges — no video required.",
          },
          {
            id: "f98158be-054b-4197-bc1b-5156274603f9",
            name: "Battle of Bristol",
            slug: "battle-of-bristol",
            description: "The South West's biggest team throwdown returns for 2026. Battle of Bristol spans two days with a different energy on each — Day 1 is technical and skill-heavy, Day 2 is raw and brutal.\n\nPairs from across the country descend on Bristol for prize money, glory, and bragging rights. Over 200 athletes competed in 2025 — 2026 is set to be even bigger.",
            type: "multi_day", format: "teams_of_2", location: "Bristol", venue: "CrossFit Clifton", address: "Unit 3, Ashton Gate Trading Estate, Bristol, BS3 2HG",
            start_date: "2026-04-18 09:00:00", end_date: "2026-04-19 17:00:00", registration_close_date: "2026-04-15 23:59:00",
            max_participants: null, entry_fee: 9600, is_public: true, status: "registration_open",
            rules: "1. Both athletes must compete in all workouts — no single athlete can complete a team workout alone.\n2. All scores must be submitted within 10 minutes of workout completion.\n3. Video evidence is required for online score submissions.\n4. Movement standards are published 48 hours before each workout.\n5. Judges may require athletes to repeat a rep — athletes must comply immediately.",
          },
          {
            id: "a3aafb6f-a209-4739-81de-a7a61bbd76a9",
            name: "Manor Games",
            slug: "manor-games-london",
            description: "The Manor Games is London's premier team fitness competition. Teams of 4 will face gruelling combinations of gymnastics, weightlifting, and cardio across 4 events.\n\nHeld at the iconic Battersea Power Station complex, expect a full-day spectacle with DJ, food stalls, and a rooftop afterparty. This is THE event of the London season.",
            type: "single_day", format: "teams_of_4", location: "London", venue: "BatterseaFit", address: "Battersea Power Station, Circus Rd W, London, SW8 4LG",
            start_date: "2026-04-18 08:00:00", end_date: "2026-04-18 19:00:00", registration_close_date: "2026-04-14 23:59:00",
            max_participants: null, entry_fee: 16000, is_public: true, status: "registration_open",
            rules: "1. Teams must have at least one female athlete.\n2. Workouts must be completed in the sequence specified — no parallel execution unless stated.\n3. Barbells must be shared as stated in workout standards.\n4. Teams must designate a captain before the event — captains speak to judges on behalf of teams.\n5. Protest periods are 5 minutes immediately following a workout result posting.",
          },
          {
            id: "6a0cbd84-9e21-4aa3-aeae-4810d4e2ac81",
            name: "Hybrid Erg Games — Spring Series",
            slug: "hybrid-erg-games-spring",
            description: "The Hybrid Erg Games Spring Series is a multi-discipline ergometer competition combining Concept2 rowing, SkiErg, BikeErg, and Echo Bike work with classic barbell movements.\n\nTeams of 3 will alternate across machines and barbells in relay-style workouts. Perfect for gym teams and CrossFit boxes looking to put their engine to the test.",
            type: "single_day", format: "teams_of_3", location: "Bolton", venue: "Hybrid Performance Lab", address: "Olympian Court, Bolton, Greater Manchester, BL6 4JE",
            start_date: "2026-04-12 10:00:00", end_date: "2026-04-12 17:00:00", registration_close_date: "2026-04-09 23:59:00",
            max_participants: null, entry_fee: 6000, is_public: true, status: "registration_open",
            rules: "1. All Concept2 machines must be set to damper 5 (standard setting).\n2. Echo Bike resistance is self-regulated.\n3. Barbell collars must be in place before lifting commences.\n4. Rowers/bikers must be seated before beginning their segment.\n5. No outside equipment other than wrist wraps and belt is permitted.",
          },
          {
            id: "8e49f6a5-3e98-4235-a0a6-c854171ba3b2",
            name: "SierraLima Throwdown — Same Sex Pairs",
            slug: "sierralimatraining-throwdown-pairs",
            description: "The Sierra Lima Throwdown returns with an all-day pairs event across two days. Day 1 features skill-based movements and gymnastics. Day 2 goes heavy with barbell cycling and grip work.\n\nSet in the heart of Leigh, this is one of the North West's most anticipated throwdowns. Limited spots — book early.",
            type: "multi_day", format: "teams_of_2", location: "Leigh", venue: "SierraLima Training", address: "14 Twist Lane, Leigh, Greater Manchester, WN7 4BL",
            start_date: "2026-04-11 09:00:00", end_date: "2026-04-12 17:00:00", registration_close_date: "2026-04-08 23:59:00",
            max_participants: null, entry_fee: 9000, is_public: true, status: "registration_open",
            rules: "1. Same-sex pairs only (Male Pairs and Female Pairs categories).\n2. Athletes may only compete in their registered category.\n3. Day 1 athletes must also compete on Day 2 to be eligible for overall ranking.\n4. Judges have the right to call a 'no rep' — the athlete must complete another rep before continuing.\n5. Standard CrossFit movement standards apply unless otherwise stated in the workout briefing.",
          },
          {
            id: "51b17cac-705b-4fe9-93a4-92171be2cfee",
            name: "HYROX Triples",
            slug: "hyrox-triples",
            description: "A HYROX-style triples event featuring 8 functional fitness stations alternating with running. Teams of 3 share the work — strategy matters as much as fitness.\n\nFull HYROX format: 8 x 1km runs + 8 stations (Ski Erg, Sled Push, Sled Pull, Burpee Broad Jumps, Rowing, Farmers Carry, Sandbag Lunges, Wall Balls). Teams divide reps however they choose.",
            type: "single_day", format: "teams_of_3", location: "Wellington", venue: "Wellington Sports Complex", address: "Corams Lane, Wellington, Somerset, TA21 8LL",
            start_date: "2026-04-04 08:00:00", end_date: "2026-04-04 17:00:00", registration_close_date: "2026-04-01 23:59:00",
            max_participants: null, entry_fee: 10000, is_public: true, status: "registration_open",
            rules: "1. All runners must complete their own 1km run — no substitution.\n2. Station reps may be divided however the team chooses.\n3. Timing chips must be worn at all times.\n4. All movements must meet rep standards or they will not count.\n5. Teams must stay within designated lanes during sled movements.",
          },
          {
            id: "edb93e60-f3f4-4c8c-a2b5-27f94131aaae",
            name: "FBX Full Send 26",
            slug: "fbx-full-send-26",
            description: "Full Send 26 is back for another year of pure chaos and max effort. Expect heavy barbells, brutal cardio, and the kind of suffering you paid good money for. This is not a beginner-friendly event — come ready to leave it all on the floor. Teams of 2 will tackle 3 workouts across the day.\n\nSpectator friendly, full catering on site, live music between events.",
            type: "single_day", format: "teams_of_2", location: "Chorley", venue: "FBX Performance Centre", address: "Unit 7, Chorley Business Park, Chorley, Lancashire, PR7 1NB",
            start_date: "2026-03-28 09:00:00", end_date: "2026-03-28 18:00:00", registration_close_date: "2026-03-25 23:59:00",
            max_participants: null, entry_fee: 8000, is_public: true, status: "registration_open",
            rules: "1. All athletes must present a valid photo ID at check-in.\n2. Equipment must comply with competition standards.\n3. Judges' decisions are final.\n4. No equipment modifications during workouts.\n5. Sportsmanship is mandatory — unsportsmanlike conduct will result in disqualification.\n6. Athletes must complete all workouts to be eligible for overall ranking.\n7. Scaled options available but must be declared at registration.",
          },
        ];

        // Seed competitions (safe to run always)
        for (const c of competitions) {
          try {
            await db.execute(sql`
              INSERT INTO competitions (id, name, slug, description, type, format, location, venue, address,
                start_date, end_date, registration_close_date, max_participants, entry_fee, currency,
                is_public, status, rules)
              VALUES (
                ${c.id}, ${c.name}, ${c.slug}, ${c.description},
                ${c.type}::competition_type, ${c.format}::competition_format,
                ${c.location}, ${c.venue}, ${c.address},
                ${c.start_date}::timestamp, ${c.end_date}::timestamp,
                ${c.registration_close_date}::timestamp,
                ${c.max_participants}, ${c.entry_fee}, 'GBP',
                ${c.is_public}, ${c.status}::competition_status, ${c.rules}
              )
              ON CONFLICT (id) DO NOTHING
            `);
          } catch (err) { console.error(`❌ Failed to insert competition ${c.slug}:`, err); }
        }

        // Seed categories per competition (self-healing — fills gaps from partial previous runs)
        const allCategories = [
          // 1stRep Community Throwdown
          { id: "0b3f9bd1-9b11-443c-9b48-fbbee297b52a", competition_id: "d491693f-3a77-4791-b665-6b5543604399", name: "Female Pairs — Open", max_participants: 20, difficulty_level: "open", gender: "female" },
          { id: "e7ea18fb-a2c5-4403-8eb8-b4aa6964136a", competition_id: "d491693f-3a77-4791-b665-6b5543604399", name: "Male Pairs — Open", max_participants: 20, difficulty_level: "open", gender: "male" },
          { id: "a7066cf3-1309-4823-a970-b48d12cfcd54", competition_id: "d491693f-3a77-4791-b665-6b5543604399", name: "Mixed Pairs — Open", max_participants: 40, difficulty_level: "open", gender: "mixed" },
          // Primal Ultra
          { id: "b2091a42-8ace-4264-94b5-ca399eb8e30a", competition_id: "c495f32b-8f51-4681-9fcf-308ab15fb5cd", name: "Female Rx", max_participants: 30, difficulty_level: "rx", gender: "female" },
          { id: "08c7aae1-6383-43cd-9833-d99706fc1474", competition_id: "c495f32b-8f51-4681-9fcf-308ab15fb5cd", name: "Female Scaled", max_participants: 25, difficulty_level: "scaled", gender: "female" },
          { id: "5ed07ec4-5e1d-4e1e-9667-39c76afc1b35", competition_id: "c495f32b-8f51-4681-9fcf-308ab15fb5cd", name: "Male Rx", max_participants: 30, difficulty_level: "rx", gender: "male" },
          { id: "56b78c93-bb48-41ee-a9b9-4e9150843d2a", competition_id: "c495f32b-8f51-4681-9fcf-308ab15fb5cd", name: "Male Scaled", max_participants: 25, difficulty_level: "scaled", gender: "male" },
          // Ring Muscle Up Workshop
          { id: "13ca8151-110c-4c60-96ca-8eca12e21330", competition_id: "8304ed30-b69b-4ea8-a943-53723357e69c", name: "Individual", max_participants: 12, difficulty_level: "open", gender: "any" },
          // Hybrid Series 002 Redline
          { id: "d5961d16-260b-4681-bf5e-4be57998639e", competition_id: "6f9aa2c9-e2e3-49fb-be23-1be2cf7d0746", name: "Female Pairs", max_participants: 20, difficulty_level: "open", gender: "female" },
          { id: "2a4a580e-fe2a-4ebc-af4f-58ef8df58fdc", competition_id: "6f9aa2c9-e2e3-49fb-be23-1be2cf7d0746", name: "Male Pairs", max_participants: 20, difficulty_level: "open", gender: "male" },
          { id: "abcaaf6f-a80b-47d0-a471-da6c7707bfa8", competition_id: "6f9aa2c9-e2e3-49fb-be23-1be2cf7d0746", name: "Mixed Pairs", max_participants: 25, difficulty_level: "open", gender: "mixed" },
          // Battle of Bristol
          { id: "fdd7054e-d3d6-4e0c-83ff-c4c61df509ae", competition_id: "f98158be-054b-4197-bc1b-5156274603f9", name: "Female Rx", max_participants: 25, difficulty_level: "rx", gender: "female" },
          { id: "5087a627-7dc9-4f93-adde-d1fa16a9ddb5", competition_id: "f98158be-054b-4197-bc1b-5156274603f9", name: "Female Scaled", max_participants: 20, difficulty_level: "scaled", gender: "female" },
          { id: "2d6b9b4b-72dd-42ee-9396-463b63d22f5d", competition_id: "f98158be-054b-4197-bc1b-5156274603f9", name: "Male Rx", max_participants: 25, difficulty_level: "rx", gender: "male" },
          { id: "070774bc-5e6f-45e3-b0fa-e289c8a713fe", competition_id: "f98158be-054b-4197-bc1b-5156274603f9", name: "Male Scaled", max_participants: 20, difficulty_level: "scaled", gender: "male" },
          { id: "6ca0cdc5-f3c8-4b1e-baa1-a119a10760cb", competition_id: "f98158be-054b-4197-bc1b-5156274603f9", name: "Mixed Rx", max_participants: 25, difficulty_level: "rx", gender: "mixed" },
          // Manor Games
          { id: "0e80001e-adfc-437d-bb90-5f493d453f09", competition_id: "a3aafb6f-a209-4739-81de-a7a61bbd76a9", name: "Mixed Intermediate", max_participants: 40, difficulty_level: "intermediate", gender: "mixed" },
          { id: "0de42610-8f2b-42bd-a41b-cf9dbf093d4b", competition_id: "a3aafb6f-a209-4739-81de-a7a61bbd76a9", name: "Mixed Rx", max_participants: 40, difficulty_level: "rx", gender: "mixed" },
          { id: "f6ef2b7d-baeb-41d0-9c27-5092b249ebeb", competition_id: "a3aafb6f-a209-4739-81de-a7a61bbd76a9", name: "Mixed Scaled", max_participants: 30, difficulty_level: "scaled", gender: "mixed" },
          // Hybrid Erg Games Spring
          { id: "8f1e536b-ca54-4712-9d33-22bb1cec8c1d", competition_id: "6a0cbd84-9e21-4aa3-aeae-4810d4e2ac81", name: "Men's Open", max_participants: 20, difficulty_level: "open", gender: "male" },
          { id: "9392c538-c06a-43ce-b3ed-18a5b5fa9bbb", competition_id: "6a0cbd84-9e21-4aa3-aeae-4810d4e2ac81", name: "Open Mixed", max_participants: 30, difficulty_level: "open", gender: "mixed" },
          { id: "721b27f4-6ab6-4f7b-998c-08e9bf739d2d", competition_id: "6a0cbd84-9e21-4aa3-aeae-4810d4e2ac81", name: "Women's Open", max_participants: 20, difficulty_level: "open", gender: "female" },
          // SierraLima Throwdown
          { id: "96b91971-c1fd-4952-9732-a4f0b651c4b2", competition_id: "8e49f6a5-3e98-4235-a0a6-c854171ba3b2", name: "Female Pairs", max_participants: 30, difficulty_level: "rx", gender: "female" },
          { id: "bac243d3-6191-4410-903f-5b39c9921329", competition_id: "8e49f6a5-3e98-4235-a0a6-c854171ba3b2", name: "Female Pairs Scaled", max_participants: 20, difficulty_level: "scaled", gender: "female" },
          { id: "592c0873-b7e1-4fff-b3c6-727a8cd95a2a", competition_id: "8e49f6a5-3e98-4235-a0a6-c854171ba3b2", name: "Male Pairs", max_participants: 30, difficulty_level: "rx", gender: "male" },
          { id: "e1446a01-9ded-4cd1-9a8f-c5c76ad0a6f1", competition_id: "8e49f6a5-3e98-4235-a0a6-c854171ba3b2", name: "Male Pairs Scaled", max_participants: 20, difficulty_level: "scaled", gender: "male" },
          // HYROX Triples
          { id: "a900ca57-09a0-45b3-a41b-92818fa5e995", competition_id: "51b17cac-705b-4fe9-93a4-92171be2cfee", name: "Men's Open", max_participants: 25, difficulty_level: "open", gender: "male" },
          { id: "5f5c9224-8580-4ce4-8bef-1529ad93c8ec", competition_id: "51b17cac-705b-4fe9-93a4-92171be2cfee", name: "Mixed Open", max_participants: 40, difficulty_level: "open", gender: "mixed" },
          { id: "28675443-d8fe-428e-ab39-11a23f97f41f", competition_id: "51b17cac-705b-4fe9-93a4-92171be2cfee", name: "Women's Open", max_participants: 25, difficulty_level: "open", gender: "female" },
          // FBX Full Send 26
          { id: "a38dbb26-18f4-418d-b2fa-4afe9c1ea9db", competition_id: "edb93e60-f3f4-4c8c-a2b5-27f94131aaae", name: "Female Rx", max_participants: 20, difficulty_level: "rx", gender: "female" },
          { id: "f9ec29a0-4e82-4714-8f15-2fa3d351fcf0", competition_id: "edb93e60-f3f4-4c8c-a2b5-27f94131aaae", name: "Male Rx", max_participants: 20, difficulty_level: "rx", gender: "male" },
          { id: "32719ad7-0263-4546-a5c8-f33321c09dee", competition_id: "edb93e60-f3f4-4c8c-a2b5-27f94131aaae", name: "Mixed Scaled", max_participants: 30, difficulty_level: "scaled", gender: "mixed" },
        ];

        for (const cat of allCategories) {
          try {
            await db.execute(sql`
              INSERT INTO competition_categories (id, competition_id, name, max_participants, difficulty_level, gender)
              VALUES (
                ${cat.id}, ${cat.competition_id}, ${cat.name},
                ${cat.max_participants},
                ${cat.difficulty_level}::difficulty_level,
                ${cat.gender}::competition_gender
              )
              ON CONFLICT (id) DO NOTHING
            `);
          } catch (err) { console.error(`❌ Failed to insert category ${cat.name}:`, err); }
        }

        // Seed workouts per competition
        const allWorkouts = [
          // FBX Full Send 26
          { id: "4e878c01-891d-4e82-9299-8be65fc7b869", competition_id: "edb93e60-f3f4-4c8c-a2b5-27f94131aaae", name: "The Opener", description: "AMRAP 12 mins: 10 Synchro Wall Balls (9/6kg), 8 Toes to Bar, 6 Synchro Burpees", type: "amrap", time_cap: 720, sort_order: 1, is_public: true },
          { id: "b811e727-aa4e-4b6f-aac4-974b14d61e41", competition_id: "edb93e60-f3f4-4c8c-a2b5-27f94131aaae", name: "Heavy Hitter", description: "For Time (15 min cap): 50 Cal Row, 40 Deadlifts (100/70kg), 30 Box Jump Overs, 20 Hang Cleans (60/40kg)", type: "for_time", time_cap: 900, sort_order: 2, is_public: true },
          { id: "392a7728-13a0-4ef9-b920-0ddde02f2808", competition_id: "edb93e60-f3f4-4c8c-a2b5-27f94131aaae", name: "The Final", description: "To be revealed on competition day", type: "for_time", time_cap: null, sort_order: 3, is_public: false },
          // HYROX Triples
          { id: "3eac52f1-1eea-4a8e-b646-00f1f2f77a73", competition_id: "51b17cac-705b-4fe9-93a4-92171be2cfee", name: "Station 1 — SkiErg", description: "3x 1000m SkiErg relay format", type: "for_time", time_cap: null, sort_order: 1, is_public: true },
          { id: "14d375e5-f7c0-44ce-9074-485d181f5f39", competition_id: "51b17cac-705b-4fe9-93a4-92171be2cfee", name: "Station 2 — Sled Push/Pull", description: "3x Sled Push 25m + Sled Pull 25m", type: "for_time", time_cap: null, sort_order: 2, is_public: true },
          { id: "de4bb0fb-f7eb-4e9f-b25b-ea759e013706", competition_id: "51b17cac-705b-4fe9-93a4-92171be2cfee", name: "Station 3 — Burpee Broad Jumps", description: "3x 25m Burpee Broad Jumps", type: "for_time", time_cap: null, sort_order: 3, is_public: true },
          { id: "d4c20d4c-cc33-4c58-8935-dd1916898b7a", competition_id: "51b17cac-705b-4fe9-93a4-92171be2cfee", name: "Station 4 — Wall Balls & Farmers Carry", description: "75 Wall Balls (team) + 3x 50m Farmers Carry (24/16kg)", type: "for_time", time_cap: null, sort_order: 4, is_public: true },
          // SierraLima Throwdown
          { id: "2c2c4e54-01ff-43f1-b94a-0d5cadf6fcc7", competition_id: "8e49f6a5-3e98-4235-a0a6-c854171ba3b2", name: "Grunt Work", description: "AMRAP 10 mins: 15 Cal Bike, 12 DB Snatches (22.5/15kg), 9 Bar Facing Burpees", type: "amrap", time_cap: 600, sort_order: 1, is_public: true },
          { id: "19d98328-af54-4599-a0d2-cbf37ec7a9a5", competition_id: "8e49f6a5-3e98-4235-a0a6-c854171ba3b2", name: "Lift Off", description: "Max Weight: Clean & Jerk ladder, 1 min per bar, ascending weight", type: "max_weight", time_cap: null, sort_order: 2, is_public: true },
          { id: "9c6ac98f-1d8e-491d-82c2-51714611a363", competition_id: "8e49f6a5-3e98-4235-a0a6-c854171ba3b2", name: "Endurance Test", description: "For Time: 2K Row + 100 Wall Balls + 50 Synchro Deadlifts", type: "for_time", time_cap: 1200, sort_order: 3, is_public: false },
          // Hybrid Series 002 Redline
          { id: "50cca451-770b-4c56-a598-1d392a0ccc49", competition_id: "6f9aa2c9-e2e3-49fb-be23-1be2cf7d0746", name: "Redline 1", description: "For Time: 2K Row + 50 Thrusters (30/20kg)", type: "for_time", time_cap: null, sort_order: 1, is_public: true },
          { id: "2fc58e25-1e2a-4e4c-9c33-6b4bf2432850", competition_id: "6f9aa2c9-e2e3-49fb-be23-1be2cf7d0746", name: "Redline 2", description: "AMRAP 8 mins: 5 Deadlifts (100/70kg), 10 Burpee Box Jump Overs", type: "amrap", time_cap: 480, sort_order: 2, is_public: true },
          { id: "25a77b35-f706-4b50-9280-919a935bd04c", competition_id: "6f9aa2c9-e2e3-49fb-be23-1be2cf7d0746", name: "Redline Final", description: "To be revealed", type: "for_time", time_cap: null, sort_order: 3, is_public: false },
          // Ring Muscle Up Workshop
          { id: "d587bb4c-9430-4b39-9aa3-542089117c14", competition_id: "8304ed30-b69b-4ea8-a943-53723357e69c", name: "Strict Muscle Up Test", description: "Max Reps: Strict Ring Muscle-ups in 3 minutes", type: "max_reps", time_cap: 180, sort_order: 1, is_public: true },
          { id: "1a577bf5-fe52-4eaa-8c60-d167e0261119", competition_id: "8304ed30-b69b-4ea8-a943-53723357e69c", name: "Kipping Technique", description: "Max Reps: Kipping Ring Muscle-ups in 2 minutes", type: "max_reps", time_cap: 120, sort_order: 2, is_public: true },
          // Hybrid Erg Games Spring
          { id: "a1ef2b8f-f03c-42bc-b2a3-e00ae188a278", competition_id: "6a0cbd84-9e21-4aa3-aeae-4810d4e2ac81", name: "Row Sprint", description: "Max Calories in 3 mins: Concept2 Rower relay (1 min each)", type: "max_calories", time_cap: 180, sort_order: 1, is_public: true },
          { id: "7176dda3-cae4-4f3a-9a61-ef5b1db9c50f", competition_id: "6a0cbd84-9e21-4aa3-aeae-4810d4e2ac81", name: "Bike Blitz", description: "Max Calories in 4 mins: Echo Bike relay", type: "max_calories", time_cap: 240, sort_order: 2, is_public: true },
          { id: "5fa8ee97-e456-4458-b3dd-b80429833428", competition_id: "6a0cbd84-9e21-4aa3-aeae-4810d4e2ac81", name: "Ski & Barbell Complex", description: "For Time: 1500m SkiErg + 30 Thrusters (40/30kg)", type: "for_time", time_cap: 600, sort_order: 3, is_public: true },
          { id: "b432c9fc-3961-4db6-91d9-ae8f93c90594", competition_id: "6a0cbd84-9e21-4aa3-aeae-4810d4e2ac81", name: "The Chipper", description: "For Time: 90 Cal Row, 60 KB Swings (24/16kg), 30 Synchro Burpees", type: "for_time", time_cap: 900, sort_order: 4, is_public: true },
          // Primal Ultra
          { id: "44da077c-4439-42c9-a262-ff10a6e9c262", competition_id: "c495f32b-8f51-4681-9fcf-308ab15fb5cd", name: "Endurance", description: "For Time: 5K Run", type: "for_time", time_cap: null, sort_order: 1, is_public: true },
          { id: "df040e8b-75a7-4109-b566-21859eda2408", competition_id: "c495f32b-8f51-4681-9fcf-308ab15fb5cd", name: "Strength", description: "Max Weight: Back Squat 1RM", type: "max_weight", time_cap: null, sort_order: 2, is_public: true },
          { id: "b70a04de-6cbf-48d9-9766-e98f432e230a", competition_id: "c495f32b-8f51-4681-9fcf-308ab15fb5cd", name: "Engine", description: "AMRAP 20 mins: 400m Run, 15 KB Swings, 10 Pull-ups, 5 Clean & Jerks", type: "amrap", time_cap: 1200, sort_order: 3, is_public: true },
          // Manor Games
          { id: "19783106-534f-4d2f-bb24-0da453bf9469", competition_id: "a3aafb6f-a209-4739-81de-a7a61bbd76a9", name: "Quad Squad", description: "AMRAP 15 mins: 20 Cal Row, 16 KB Swings, 12 Box Jumps, 8 Ring Dips", type: "amrap", time_cap: 900, sort_order: 1, is_public: true },
          { id: "997962c7-8578-45df-98a8-c2627d3d4c27", competition_id: "a3aafb6f-a209-4739-81de-a7a61bbd76a9", name: "The Relay", description: "For Time: 4x 400m Run + 15 Thrusters each", type: "for_time", time_cap: null, sort_order: 2, is_public: true },
          { id: "55dcca05-49df-4b82-a377-e69e2b6db105", competition_id: "a3aafb6f-a209-4739-81de-a7a61bbd76a9", name: "Strongman Medley", description: "For Time: Sled Push, Farmers Walk, Sandbag Carry, Tyre Flip relay", type: "for_time", time_cap: null, sort_order: 3, is_public: true },
          // Battle of Bristol
          { id: "3d6f4323-5747-4703-9df6-5e025400f6bb", competition_id: "f98158be-054b-4197-bc1b-5156274603f9", name: "Bristol Burner", description: "AMRAP 8 mins: 10 Chest to Bar Pull-ups, 10 Pistol Squats, 200m Run", type: "amrap", time_cap: 480, sort_order: 1, is_public: true },
          { id: "9f5d9820-8f94-41b3-b6cb-b6b01529ac67", competition_id: "f98158be-054b-4197-bc1b-5156274603f9", name: "West Country Grit", description: "For Time: 30 Power Cleans (70/50kg), 30 Ring Muscle-ups, 30 Power Cleans", type: "for_time", time_cap: 720, sort_order: 2, is_public: true },
          { id: "3c38b3cf-cac3-4134-b157-a85e0a3bb570", competition_id: "f98158be-054b-4197-bc1b-5156274603f9", name: "Day 2 Surprise", description: "To be revealed on Day 2", type: "for_time", time_cap: null, sort_order: 3, is_public: false },
          // 1stRep Community Throwdown
          { id: "57ce62f3-1b1e-497f-b2a0-f2e2f895ea76", competition_id: "d491693f-3a77-4791-b665-6b5543604399", name: "Community WOD", description: "AMRAP 12 mins: 10 Synchro Air Squats, 8 Synchro Push-ups, 6 Synchro Sit-ups, 200m Run together", type: "amrap", time_cap: 720, sort_order: 1, is_public: true },
          { id: "34f0db88-c369-441e-aa9b-8ae986b2c87a", competition_id: "d491693f-3a77-4791-b665-6b5543604399", name: "Partner Chipper", description: "For Time: 100 Wall Balls, 80 Cal Row, 60 Box Jumps, 40 Hang Cleans (40/30kg)", type: "for_time", time_cap: 900, sort_order: 2, is_public: true },
          { id: "5a49c394-2e30-4302-906b-d9c4c687a35e", competition_id: "d491693f-3a77-4791-b665-6b5543604399", name: "The Finisher", description: "To be revealed", type: "for_time", time_cap: null, sort_order: 3, is_public: false },
        ];

        for (const w of allWorkouts) {
          try {
            await db.execute(sql`
              INSERT INTO competition_workouts (id, competition_id, name, description, type, time_cap, sort_order, is_public, scores_visible)
              VALUES (
                ${w.id}, ${w.competition_id}, ${w.name}, ${w.description},
                ${w.type}::workout_type, ${w.time_cap}, ${w.sort_order}, ${w.is_public}, false
              )
              ON CONFLICT (id) DO NOTHING
            `);
          } catch (err) { console.error(`❌ Failed to insert workout ${w.name}:`, err); }
        }

        console.log(`✅ Seeded ${competitions.length} competitions, ${allCategories.length} categories, ${allWorkouts.length} workouts`);

        // Seed competition pricing config (idempotent)
        const pricingTiersToSeed = [
          {
            id: "8348360d-862d-4620-a66b-6d8a23789149",
            tier: "starter",
            name: "Starter",
            price: 0,
            billing_period: "free",
            features: JSON.stringify(["1 competition", "Up to 30 participants", "Basic leaderboard", "Manual scoring", "1stRep branding on leaderboard", "Free events only (no payment processing)"]),
            max_competitions: 1,
            max_participants_per_comp: 30,
            allow_payment_processing: false,
            allow_custom_branding: false,
            allow_online_qualifiers: false,
            allow_spectator_ticketing: false,
            sort_order: 1,
          },
          {
            id: "1f1aa18b-a215-4db8-89fe-f6c59136fd70",
            tier: "single",
            name: "Single Event",
            price: 6000,
            billing_period: "one_time",
            features: JSON.stringify(["1 competition", "Unlimited participants", "Full live leaderboard", "Live scoring & heat management", "Payment processing for entries", "CSV exports", "Custom categories"]),
            max_competitions: 1,
            max_participants_per_comp: null,
            allow_payment_processing: true,
            allow_custom_branding: false,
            allow_online_qualifiers: false,
            allow_spectator_ticketing: false,
            sort_order: 2,
          },
          {
            id: "c57b0aac-1705-4238-ad72-d3a71d2f7a54",
            tier: "pro",
            name: "Pro Monthly",
            price: 6000,
            billing_period: "monthly",
            features: JSON.stringify(["Unlimited competitions", "All Single Event features", "Online qualifiers & remote scoring", "Scheduled workout release", "Spectator ticketing", "Custom leaderboard branding", "Volunteer management", "Priority support"]),
            max_competitions: null,
            max_participants_per_comp: null,
            allow_payment_processing: true,
            allow_custom_branding: true,
            allow_online_qualifiers: true,
            allow_spectator_ticketing: true,
            sort_order: 3,
          },
          {
            id: "c48d5371-de30-477c-b9ee-f13e992af1c1",
            tier: "white_label",
            name: "White Label",
            price: 0,
            billing_period: "contact",
            features: JSON.stringify(["Everything in Pro", "Remove 1stRep branding entirely", "Custom domain support", "Dedicated account manager", "SLA guarantee", "Custom integrations on request"]),
            max_competitions: null,
            max_participants_per_comp: null,
            allow_payment_processing: true,
            allow_custom_branding: true,
            allow_online_qualifiers: true,
            allow_spectator_ticketing: true,
            sort_order: 4,
          },
        ];
        for (const pt of pricingTiersToSeed) {
          try {
            await db.execute(sql`
              INSERT INTO competition_pricing_config (
                id, tier, name, price, billing_period, features,
                max_competitions, max_participants_per_comp,
                allow_payment_processing, allow_custom_branding,
                allow_online_qualifiers, allow_spectator_ticketing,
                is_active, sort_order
              )
              VALUES (
                ${pt.id}, ${pt.tier}, ${pt.name}, ${pt.price}, ${pt.billing_period}, ${pt.features}::jsonb,
                ${pt.max_competitions}, ${pt.max_participants_per_comp},
                ${pt.allow_payment_processing}, ${pt.allow_custom_branding},
                ${pt.allow_online_qualifiers}, ${pt.allow_spectator_ticketing},
                true, ${pt.sort_order}
              )
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                price = EXCLUDED.price,
                features = EXCLUDED.features,
                is_active = true
            `);
          } catch (err) { console.error(`❌ Failed to insert pricing tier ${pt.tier}:`, err); }
        }
        console.log(`✅ Seeded ${pricingTiersToSeed.length} competition pricing tiers`);
    } catch (error) {
      console.error("❌ Failed to seed competitions:", error);
    }

    // ── One-time: create Sarah Kerr-Pasiecznik's £80 QR payment order ─────────
    // This payment was completed via Square QR link on 5 May 2026 at 19:29 but
    // was never saved to 1stRep because the EPOS tab closed before the polling
    // loop could capture it.  We insert it exactly once using ON CONFLICT DO NOTHING
    // on the order_number column.
    try {
      const sarahOrderNumber = '1ST-SARAH-20260505-RECOVERED';
      const existingCheck = await db.execute(sql`
        SELECT id FROM customer_orders WHERE order_number = ${sarahOrderNumber} LIMIT 1
      `);
      if (existingCheck.rows.length === 0) {
        const [sarahOrder] = await db.execute(sql`
          INSERT INTO customer_orders (
            order_number, status, customer_email,
            customer_first_name, customer_last_name,
            shipping_address, shipping_city, shipping_postal_code, shipping_country,
            subtotal, shipping_cost, tax_amount, discount_amount, total_amount,
            payment_method, is_paid, paid_at, order_date,
            notes, channel
          ) VALUES (
            ${sarahOrderNumber}, 'processing', 'sarahhelenkerr@hotmail.co.uk',
            'Sarah', 'Kerr-Pasiecznik',
            '', '', '', 'UK',
            '80.00', '0.00', '0.00', '0.00', '80.00',
            'square', true,
            '2026-05-05 19:29:00'::timestamptz,
            '2026-05-05 19:29:00'::timestamptz,
            'Recovered ghost website payment — Visa 6930 — items to confirm from Square dashboard',
            'website'
          ) RETURNING id
        `);
        const sarahOrderId = sarahOrder.rows[0]?.id;
        if (sarahOrderId) {
          await db.execute(sql`
            INSERT INTO customer_order_items (
              order_id, product_id, product_name, size, color,
              quantity, unit_price, total_price, sku
            ) VALUES (
              ${sarahOrderId}, null,
              'Items to confirm from Square dashboard (QR payment £80.00)',
              null, null, 1, '80.00', '80.00', null
            )
          `);
          console.log('✅ Created recovered order for Sarah Kerr-Pasiecznik (£80.00 QR payment, 5 May 2026)');
        }
      }
    } catch (err) {
      console.error('⚠️ Could not create Sarah Kerr-Pasiecznik recovery order:', err);
    }

    console.log("🎉 Database seeding completed!");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    // Don't throw - we don't want seeding errors to crash the app
  }
}
