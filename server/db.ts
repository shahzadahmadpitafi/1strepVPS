import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Standard pg.Pool uses persistent TCP connections (not WebSockets).
// This is far more stable for a long-running Express server than @neondatabase/serverless,
// which is designed for short-lived serverless functions and drops WebSocket connections frequently.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("error", (err) => {
  console.warn("⚠️ Database pool error (will reconnect):", err.message);
});

export const db = drizzle({ client: pool, schema });

// Check and create database indexes for better query performance (runs once, in background)
let indexesCreated = false;

export async function createDatabaseIndexes() {
  if (indexesCreated) {
    console.log("📊 Database indexes already checked this session");
    return;
  }
  indexesCreated = true;

  setImmediate(async () => {
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count FROM pg_indexes 
        WHERE indexname LIKE 'idx_orders_%' OR indexname LIKE 'idx_customer_orders_%' 
        OR indexname LIKE 'idx_users_%' OR indexname LIKE 'idx_products_%'
      `);

      const existingCount = parseInt(result.rows[0]?.count || "0");
      if (existingCount >= 10) {
        console.log(`📊 Database indexes already exist (${existingCount} found)`);
        return;
      }

      const indexes = [
        "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)",
        "CREATE INDEX IF NOT EXISTS idx_orders_reseller_id ON orders(reseller_id)",
        "CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON customer_orders(status)",
        "CREATE INDEX IF NOT EXISTS idx_customer_orders_user_id ON customer_orders(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_customer_orders_date ON customer_orders(order_date DESC)",
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
        "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
        "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)",
        "CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id)",
        "CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions(expire)",
      ];

      let created = 0;
      for (const indexSql of indexes) {
        try {
          await pool.query(indexSql);
          created++;
        } catch (error: any) {
          if (error.code !== "42P07" && error.code !== "42P01" && error.code !== "42703") {
            console.warn(`⚠️ Index: ${error.message}`);
          }
        }
      }

      console.log(`📊 Database indexes: ${created} verified/created`);
    } catch (error) {
      console.log("📊 Database index check skipped");
    }
  });

  console.log("🔄 Database indexes check scheduled");
}
