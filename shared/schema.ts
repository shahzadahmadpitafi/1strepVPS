import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean, pgEnum, numeric, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["customer", "reseller", "vendor", "admin"]);

// Order status enum
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "shipped", "delivered", "cancelled"]);

// Customer order status enum (for customer-facing orders)
export const customerOrderStatusEnum = pgEnum("customer_order_status", ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]);

// Interaction type enum (for CRM tracking)
export const interactionTypeEnum = pgEnum("interaction_type", ["email", "support_ticket", "purchase", "cart_abandonment", "review", "complaint", "inquiry"]);

// Support ticket status enum
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "waiting_customer", "resolved", "closed"]);

// Support ticket priority enum
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);

// Reseller tier enum
export const resellerTierEnum = pgEnum("reseller_tier", ["bronze", "silver", "gold", "platinum"]);

// Reseller approval status enum
export const resellerApprovalStatusEnum = pgEnum("reseller_approval_status", ["pending", "approved", "rejected"]);

// Application type enum (what they're applying as)
export const applicationTypeEnum = pgEnum("application_type", ["reseller", "vendor"]);

// Vendor approval status enum
export const vendorApprovalStatusEnum = pgEnum("vendor_approval_status", ["pending", "approved", "rejected"]);

// Message type enum
export const messageTypeEnum = pgEnum("message_type", ["general", "order", "product", "support"]);

// Shipping carrier enum
export const shippingCarrierEnum = pgEnum("shipping_carrier", ["royal_mail", "dhl", "ups", "fedex", "dpd", "hermes", "other"]);

// Coupon type enum
export const couponTypeEnum = pgEnum("coupon_type", ["percentage", "fixed_amount", "free_shipping"]);

// Homepage theme enum
export const homepageThemeEnum = pgEnum("homepage_theme", ["tactical_dark", "modern_light", "dynamic_gradient", "clean_minimal"]);

// Product availability status enum
export const productAvailabilityEnum = pgEnum("product_availability", ["available", "upcoming", "out_of_stock", "discontinued"]);

// Variant availability status enum (for size/color combinations)
export const variantStatusEnum = pgEnum("variant_status", ["available", "coming_soon", "out_of_stock", "pre_order"]);

// Activity type enum (for categorizing products by activity)
export const activityTypeEnum = pgEnum("activity_type", ["training", "yoga", "running", "studio", "general"]);

// Product gender enum (for categorizing products by target gender)
export const productGenderEnum = pgEnum("product_gender", ["men", "women", "unisex"]);

// Reseller payment methods enum (for controlling which payment methods resellers can use)
export const resellerPaymentMethodsEnum = pgEnum("reseller_payment_methods", ["credit", "pay_now", "both"]);

// Auth provider enum (for multi-provider authentication)
export const authProviderEnum = pgEnum("auth_provider", ["local", "replit", "google", "github", "apple", "twitter"]);

// Admin department role enum (for admin team management)
export const adminDepartmentEnum = pgEnum("admin_department", [
  "full_access",        // Full admin access to everything
  "products",           // Can manage products
  "inventory",          // Can manage inventory
  "orders",             // Can manage orders
  "customers",          // Can manage customers (CRM)
  "resellers",          // Can manage resellers
  "support",            // Can manage support tickets
  "coupons",            // Can manage coupons
  "chatbot",            // Can manage chatbot
  "settings"            // Can manage site settings
]);

// Section gender filter enum (for filtering products in homepage sections)
export const sectionGenderFilterEnum = pgEnum("section_gender_filter", ["all", "men", "women"]);

// Product Sections table (dynamic product categories/sections)
export const productSections = pgTable("product_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  genderFilter: sectionGenderFilterEnum("gender_filter").default("all"), // Filter products by gender: all, men, women
  viewAllLink: text("view_all_link"), // Custom link for View All button (e.g., /shop-clean?category=Hoodies&gender=men)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product Activity Types table (dynamic activity types for categorization)
export const productActivityTypes = pgTable("product_activity_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table (customers, resellers, admins) - domain profile
// NOTE: Password is now nullable to support social login
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(), // Optional for social login users
  email: text("email").notNull().unique(),
  password: text("password"), // NULLABLE - migrated to local_credentials
  firstName: text("first_name"),
  lastName: text("last_name"),
  phoneNumber: text("phone_number"), // Customer phone for contact/SMS
  profileImageUrl: text("profile_image_url"), // For social login avatars
  stripeCustomerId: text("stripe_customer_id").unique(), // Stripe Customer ID for payments
  role: userRoleEnum("role").notNull().default("customer"),
  lastLoginAt: timestamp("last_login_at"), // Track last login for activity timeline
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Password reset OTPs table (for OTP-based forgot password functionality)
export const passwordResetOTPs = pgTable("password_reset_otps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset tokens table (for forgot password functionality) - DEPRECATED, kept for backward compatibility
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Auth Identities table - tracks authentication providers for each user
// Enables multi-provider auth (email/password, Google, GitHub, Apple, etc.)
export const authIdentities = pgTable("auth_identities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: authProviderEnum("provider").notNull(), // local, replit, google, github, etc.
  providerUserId: text("provider_user_id").notNull(), // Unique ID from the provider
  email: text("email"), // Email from provider (may differ from user.email)
  profileImageUrl: text("profile_image_url"), // Profile image from social provider
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Local Credentials table - stores hashed passwords for email/password auth
// Separated from users table to support multi-provider authentication
export const localCredentials = pgTable("local_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User measurements table (for virtual try-on 3D avatar sizing)
export const userMeasurements = pgTable("user_measurements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  heightCm: decimal("height_cm", { precision: 5, scale: 2 }),
  chestCm: decimal("chest_cm", { precision: 5, scale: 2 }),
  waistCm: decimal("waist_cm", { precision: 5, scale: 2 }),
  hipsCm: decimal("hips_cm", { precision: 5, scale: 2 }),
  shoulderWidthCm: decimal("shoulder_width_cm", { precision: 5, scale: 2 }),
  inseamCm: decimal("inseam_cm", { precision: 5, scale: 2 }),
  preferredSize: text("preferred_size"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Admin Team Members table (for managing admin team with department-specific access)
export const adminTeamMembers = pgTable("admin_team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  departments: text("departments").array().notNull(), // Array of department access: ["products", "inventory"]
  jobTitle: text("job_title"), // e.g., "Products Manager", "Support Specialist"
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id), // Admin who added them
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
  // Email notification preferences
  notifyNewOrders: boolean("notify_new_orders").notNull().default(false), // Receive new order notifications
  notifyShipping: boolean("notify_shipping").notNull().default(false), // Receive shipping update notifications
  notifyDelivery: boolean("notify_delivery").notNull().default(false), // Receive delivery confirmation notifications
  notifyLowStock: boolean("notify_low_stock").notNull().default(false), // Receive low stock alerts
  notifySupportTickets: boolean("notify_support_tickets").notNull().default(false), // Receive support ticket notifications
});

// Resellers table (wholesale accounts for business customers)
export const resellers = pgTable("resellers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  businessName: text("business_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  businessAddress: text("business_address").notNull(),
  phoneNumber: text("phone_number").notNull(),
  tier: resellerTierEnum("tier").notNull().default("bronze"),
  approvalStatus: resellerApprovalStatusEnum("approval_status").notNull().default("pending"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull().default("10.00"),
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }).notNull().default("1000.00"),
  currentCredit: decimal("current_credit", { precision: 10, scale: 2 }).notNull().default("0.00"),
  allowedPaymentMethods: resellerPaymentMethodsEnum("allowed_payment_methods").notNull().default("both"),
  isActive: boolean("is_active").notNull().default(true),
  registrationDate: timestamp("registration_date").defaultNow().notNull(),
  lastOrderDate: timestamp("last_order_date"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  stripeAccountId: text("stripe_account_id"),
  stripeOnboardingStatus: text("stripe_onboarding_status").default("not_started"),
  stripeChargesEnabled: boolean("stripe_charges_enabled").default(false),
  stripePayoutsEnabled: boolean("stripe_payouts_enabled").default(false),
  stripeAccountEmail: text("stripe_account_email"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }), // Commission percentage (0-100) set by admin
  // EPOS Security
  eposPinHash: text("epos_pin_hash"), // Hashed EPOS PIN for terminal security
  eposSessionDuration: integer("epos_session_duration").default(30), // Session timeout in minutes
  eposLastActivity: timestamp("epos_last_activity"), // Track last EPOS activity
  eposFailedAttempts: integer("epos_failed_attempts").default(0), // Track failed PIN attempts for rate limiting
  eposLockedUntil: timestamp("epos_locked_until"), // Lockout timestamp after too many failed attempts
  stripeCustomerId: text("stripe_customer_id"), // Stripe Customer ID for subscription billing
  // "Bring Your Own Stripe" — reseller's own Stripe account (bypasses Connect)
  ownStripePublishableKey: text("own_stripe_publishable_key"), // pk_live_... (safe to store in plain)
  ownStripeSecretKeyEnc: text("own_stripe_secret_key_enc"),   // AES-256-GCM encrypted sk_live_...
  ownStripeSetupAt: timestamp("own_stripe_setup_at"),
  // "Bring Your Own Square" — reseller's own Square account
  ownSquareAccessTokenEnc: text("own_square_access_token_enc"), // AES-256-GCM encrypted
  ownSquareLocationId: text("own_square_location_id"),
  ownSquareSetupAt: timestamp("own_square_setup_at"),
  // Simple EPOS bank details — for direct bank transfer payments on own-product sales
  eposBankAccountName: text("epos_bank_account_name"),
  eposBankSortCode: text("epos_bank_sort_code"),
  eposBankAccountNumber: text("epos_bank_account_number"),
});

// Category scope enum (global categories vs vendor-specific)
export const categoryScopeEnum = pgEnum("category_scope", ["global", "vendor"]);

// Product Categories table (for both 1stRep and vendor products)
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  scope: categoryScopeEnum("scope").notNull().default("global"), // global = 1stRep, vendor = vendor-specific
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: 'cascade' }), // null for global categories
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vendors table (user-created products in marketplace)
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  businessName: text("business_name").notNull(),
  businessDescription: text("business_description"),
  businessAddress: text("business_address"),
  phoneNumber: text("phone_number"),
  website: text("website"),
  approvalStatus: vendorApprovalStatusEnum("approval_status").notNull().default("pending"),
  isActive: boolean("is_active").notNull().default(true),
  registrationDate: timestamp("registration_date").defaultNow().notNull(),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  totalProductsCreated: integer("total_products_created").notNull().default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").notNull().default(0),
  // Stripe Connect fields for split payments
  stripeAccountId: text("stripe_account_id"), // Stripe Connected Account ID
  stripeOnboardingStatus: text("stripe_onboarding_status").default("not_started"), // not_started, pending, complete
  stripeChargesEnabled: boolean("stripe_charges_enabled").default(false),
  stripePayoutsEnabled: boolean("stripe_payouts_enabled").default(false),
  stripeAccountEmail: text("stripe_account_email"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }), // Commission percentage (0-100) set by admin
  // Capability flags
  canAddOwnProducts: boolean("can_add_own_products").notNull().default(false), // Default: wholesalers can only sell at wholesale, not add own products
  // EPOS Security
  eposPinHash: text("epos_pin_hash"), // Hashed EPOS PIN for terminal security
  eposSessionDuration: integer("epos_session_duration").default(30), // Session timeout in minutes
  eposLastActivity: timestamp("epos_last_activity"), // Track last EPOS activity
  eposFailedAttempts: integer("epos_failed_attempts").default(0), // Track failed PIN attempts for rate limiting
  eposLockedUntil: timestamp("epos_locked_until"), // Lockout timestamp after too many failed attempts
  stripeCustomerId: text("stripe_customer_id"), // Stripe Customer ID for subscription billing
});

// Vendor Products table (products created by vendors)
export const vendorProducts = pgTable("vendor_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  detailedDescription: text("detailed_description"),
  category: text("category").notNull(),
  sku: text("sku").notNull().unique(),
  retailPrice: decimal("retail_price", { precision: 8, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  hoverImageUrl: text("hover_image_url"),
  videoUrl: text("video_url"),
  sizes: text("sizes").array(),
  colors: text("colors").array(),
  materials: text("materials"),
  careInstructions: text("care_instructions"),
  isActive: boolean("is_active").notNull().default(true),
  availabilityStatus: productAvailabilityEnum("availability_status").notNull().default("available"),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").notNull().default(0),
  totalSold: integer("total_sold").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vendor Product Variants table (size and color variants for vendor products)
export const vendorProductVariants = pgTable("vendor_product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorProductId: varchar("vendor_product_id").notNull().references(() => vendorProducts.id, { onDelete: 'cascade' }),
  size: text("size").notNull(),
  color: text("color").notNull().default(''),
  sku: text("sku").unique(),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueVariant: sql`UNIQUE (vendor_product_id, size, color)`,
}));

// EPOS Activity Log table for auditing
export const eposActivityLog = pgTable("epos_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  resellerId: varchar("reseller_id").references(() => resellers.id),
  activityType: text("activity_type").notNull(), // login, logout, transaction, lock, unlock, session_expired
  details: text("details"), // JSON string with additional details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// EPOS Terminals table (physical or virtual point of sale terminals)
export const eposTerminals = pgTable("epos_terminals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(), // Store location/address
  terminalCode: text("terminal_code").notNull().unique(), // Unique identifier like "EPOS-001"
  type: text("type").notNull().default("in_store"), // in_store, mobile, kiosk
  isActive: boolean("is_active").notNull().default(true),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vendor Reseller Permissions table (tracks which resellers can sell which vendor products)
export const vendorResellerPermissions = pgTable("vendor_reseller_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id, { onDelete: 'cascade' }),
  vendorProductId: varchar("vendor_product_id").notNull().references(() => vendorProducts.id, { onDelete: 'cascade' }),
  isApproved: boolean("is_approved").notNull().default(false),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniquePermission: sql`UNIQUE (vendor_id, reseller_id, vendor_product_id)`,
}));

// Products table (1stRep product catalog)
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  detailedDescription: text("detailed_description"),
  category: text("category").notNull(),
  activityType: activityTypeEnum("activity_type").default("general"),
  gender: productGenderEnum("gender").default("unisex"), // Target gender: men, women, or unisex (both)
  sku: text("sku").notNull().unique(),
  barcodeDescriptor: text("barcode_descriptor"), // Custom barcode text/code for the product
  retailPrice: decimal("retail_price", { precision: 8, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 8, scale: 2 }), // When set, product is on sale (retailPrice becomes "was" price)
  wholesalePrice: decimal("wholesale_price", { precision: 8, scale: 2 }).notNull(),
  wholesaleSalePrice: decimal("wholesale_sale_price", { precision: 8, scale: 2 }), // When set, resellers get this discounted wholesale price
  costPrice: decimal("cost_price", { precision: 8, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  hoverImageUrl: text("hover_image_url"),
  videoUrl: text("video_url"),
  sizes: text("sizes").array(),
  colors: text("colors").array(),
  features: text("features").array(),
  materials: text("materials"),
  careInstructions: text("care_instructions"),
  modelInfo: text("model_info"), // Model measurements: "Model is 6'1" / 185cm, chest 40" / 102cm, wearing size L"
  isActive: boolean("is_active").notNull().default(true),
  isHeroProduct: boolean("is_hero_product").notNull().default(false),
  collections: text("collections").array(), // Array of collection names: '1r-collection', 'active-range', 'leisure-range'
  availabilityStatus: productAvailabilityEnum("availability_status").notNull().default("available"),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").notNull().default(0),
  // Partner storefront fields - for resellers and vendors selling 1stRep products
  partnerCommissionRate: decimal("partner_commission_rate", { precision: 5, scale: 2 }).default("10.00"), // Commission percentage (0-100) partners earn when selling this product
  partnerStorefrontPrice: decimal("partner_storefront_price", { precision: 8, scale: 2 }), // Preset price for partner storefronts (if null, use retailPrice)
  // Product protection fields - prevent accidental deletion
  isProtected: boolean("is_protected").notNull().default(false), // Protected products cannot be deleted
  isDeleted: boolean("is_deleted").notNull().default(false), // Soft delete flag - product hidden but recoverable
  deletedAt: timestamp("deleted_at"), // When the product was soft deleted
  deletedBy: varchar("deleted_by"), // User ID who deleted the product
  pairedProductId: varchar("paired_product_id"), // Links to matching product (e.g., bra paired with leggings for outfit display)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product images (multiple images per product, with optional color association)
export const productImages = pgTable("product_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text("url").notNull(),
  hoverUrl: text("hover_url"), // Alternate image shown on hover for this color
  altText: text("alt_text"),
  color: text("color"), // Optional: associates this image with a specific color variant
  sortOrder: integer("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product variants (size-specific pricing and inventory)
export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  size: text("size").notNull(),
  color: text("color").notNull().default(''),
  sku: text("sku").unique(),
  barcodeDescriptor: text("barcode_descriptor"), // Custom barcode text/code for this specific variant
  packQuantity: integer("pack_quantity").notNull().default(1), // Number of items per box/pack (for bulk scanning)
  retailPrice: decimal("retail_price", { precision: 8, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 8, scale: 2 }), // Optional sale price for retail customers (variant-level override)
  wholesalePrice: decimal("wholesale_price", { precision: 8, scale: 2 }).notNull(),
  wholesaleSalePrice: decimal("wholesale_sale_price", { precision: 8, scale: 2 }), // Optional sale price for resellers (variant-level override)
  costPrice: decimal("cost_price", { precision: 8, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  status: variantStatusEnum("status").notNull().default("available"), // available, coming_soon, out_of_stock, pre_order
  expectedDate: timestamp("expected_date"), // Expected availability date for coming_soon items
  locationNote: text("location_note"), // Storage location/bin reference for this variant (e.g., "Shelf A3, Box 2")
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueVariant: sql`UNIQUE (product_id, size, color)`,
}));

// Product reviews (customer reviews for products)
export const productReviews = pgTable("product_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  isVerifiedPurchase: boolean("is_verified_purchase").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserProduct: sql`UNIQUE (product_id, user_id)`,
}));

// Reseller inventory (stock levels per reseller)
export const resellerInventory = pgTable("reseller_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  size: text("size"),
  color: text("color"),
  quantity: integer("quantity").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(5),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Warehouses table (physical warehouse locations)
export const warehouses = pgTable("warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // Short code like "WH-LON", "WH-MAN"
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("UK"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  capacity: integer("capacity"), // Max units the warehouse can hold
  isActive: boolean("is_active").notNull().default(true),
  isPrimary: boolean("is_primary").notNull().default(false), // Primary warehouse for new stock
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Warehouse inventory (stock levels per warehouse per product variant)
export const warehouseInventory = pgTable("warehouse_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id, { onDelete: 'cascade' }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: varchar("variant_id").references(() => productVariants.id, { onDelete: 'cascade' }),
  size: text("size"),
  color: text("color"),
  quantity: integer("quantity").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").notNull().default(0), // Stock reserved for pending orders
  minStockLevel: integer("min_stock_level").notNull().default(10), // Alert when stock falls below
  maxStockLevel: integer("max_stock_level"), // Optimal maximum stock level
  location: text("location"), // Bin/shelf location within warehouse e.g. "A1-B3"
  lastStockCheck: timestamp("last_stock_check"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueWarehouseProduct: sql`UNIQUE (warehouse_id, product_id, size, color)`,
}));

// Stock transfer status enum
export const stockTransferStatusEnum = pgEnum("stock_transfer_status", [
  "pending",
  "approved",
  "in_transit",
  "completed",
  "cancelled"
]);

// Stock transfers (move inventory between warehouses)
export const stockTransfers = pgTable("stock_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transferNumber: text("transfer_number").notNull().unique(),
  fromWarehouseId: varchar("from_warehouse_id").notNull().references(() => warehouses.id),
  toWarehouseId: varchar("to_warehouse_id").notNull().references(() => warehouses.id),
  status: stockTransferStatusEnum("status").notNull().default("pending"),
  initiatedBy: varchar("initiated_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  shippedAt: timestamp("shipped_at"),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Stock transfer items (individual products in a transfer)
export const stockTransferItems = pgTable("stock_transfer_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transferId: varchar("transfer_id").notNull().references(() => stockTransfers.id, { onDelete: 'cascade' }),
  productId: varchar("product_id").notNull().references(() => products.id),
  variantId: varchar("variant_id").references(() => productVariants.id),
  size: text("size"),
  color: text("color"),
  quantity: integer("quantity").notNull(),
  receivedQuantity: integer("received_quantity"), // Actual quantity received (may differ)
  notes: text("notes"),
});

// Orders table (reseller orders from 1stRep)
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id),
  vendorId: varchar("vendor_id"),
  orderNumber: text("order_number").notNull().unique(),
  status: orderStatusEnum("status").notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull().default("credit"),
  shippingAddress: text("shipping_address").notNull(),
  notes: text("notes"),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  confirmedDate: timestamp("confirmed_date"),
  shippedDate: timestamp("shipped_date"),
  deliveredDate: timestamp("delivered_date"),
  trackingNumber: text("tracking_number"),
});

// Order items table (individual products in orders)
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  size: text("size"),
  color: text("color"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 8, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Pricing tiers (different wholesale prices by tier)
export const pricingTiers = pgTable("pricing_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  tier: resellerTierEnum("tier").notNull(),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  minimumQuantity: integer("minimum_quantity").notNull().default(1),
});

// Stock alerts table (low stock notifications)
export const stockAlerts = pgTable("stock_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  size: text("size"),
  color: text("color"),
  currentQuantity: integer("current_quantity").notNull(),
  reorderLevel: integer("reorder_level").notNull(),
  isResolved: boolean("is_resolved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages table (admin-reseller communication)
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  messageType: messageTypeEnum("message_type").notNull().default("general"),
  subject: text("subject"),
  content: text("content").notNull(),
  orderId: varchar("order_id").references(() => orders.id),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order status history table (order timeline tracking)
export const orderStatusHistory = pgTable("order_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  status: orderStatusEnum("status").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Shipment details table (extended shipping information)
export const shipmentDetails = pgTable("shipment_details", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id).unique(),
  carrier: shippingCarrierEnum("carrier").notNull(),
  trackingNumber: text("tracking_number").notNull(),
  trackingUrl: text("tracking_url"),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  shippingCost: decimal("shipping_cost", { precision: 8, scale: 2 }),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  dimensions: text("dimensions"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notifications table (system notifications for resellers)
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id),
  type: text("type").notNull(), // 'order_update', 'message', 'stock_alert', 'approval', etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reseller activity log (audit trail for admin actions)
export const resellerActivityLog = pgTable("reseller_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id),
  actionType: text("action_type").notNull(), // 'profile_update', 'tier_change', 'credit_adjust', 'status_change', 'password_reset'
  description: text("description").notNull(),
  oldValue: text("old_value"), // JSON string of old values
  newValue: text("new_value"), // JSON string of new values
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// CRM TABLES - Customer Relationship Management
// ============================================

// Customer orders table (direct customer purchases from e-commerce)
export const customerOrders = pgTable("customer_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  orderNumber: text("order_number").notNull().unique(),
  status: customerOrderStatusEnum("status").notNull().default("pending"),
  
  // Customer info (for guest checkouts)
  customerEmail: text("customer_email").notNull(),
  customerFirstName: text("customer_first_name").notNull(),
  customerLastName: text("customer_last_name").notNull(),
  customerPhone: text("customer_phone"), // Phone number for delivery contact
  
  // Shipping info
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city").notNull(),
  shippingPostalCode: text("shipping_postal_code").notNull(),
  shippingCountry: text("shipping_country").notNull().default("UK"),
  
  // Pricing
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 8, scale: 2 }).notNull().default("0.00"),
  taxAmount: decimal("tax_amount", { precision: 8, scale: 2 }).notNull().default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Coupon info (for applied discounts)
  couponId: varchar("coupon_id").references(() => coupons.id),
  couponCode: text("coupon_code"), // Snapshot of code used
  discountAmount: decimal("discount_amount", { precision: 8, scale: 2 }).default("0.00"),
  shippingDiscountAmount: decimal("shipping_discount_amount", { precision: 8, scale: 2 }).default("0.00"),
  
  // Referral info (for referral program discounts)
  referralId: varchar("referral_id"), // References referrals.id but no FK to avoid circular deps
  referralDiscountAmount: decimal("referral_discount_amount", { precision: 8, scale: 2 }).default("0.00"),
  referralProcessed: boolean("referral_processed").default(false), // Idempotency guard for reward processing
  
  // Payment
  paymentMethod: text("payment_method").notNull(),
  paymentIntentId: text("payment_intent_id"),
  stripeSessionId: text("stripe_session_id"),
  isPaid: boolean("is_paid").notNull().default(false),
  // True when payment went directly to the reseller's own Square account (BYOS).
  // When true, 1stRep never held these funds and nothing is owed to the reseller.
  ownSquarePaid: boolean("own_square_paid").default(false),
  
  // Tracking
  trackingNumber: text("tracking_number"),
  // Set when an automatic order-related SMS (confirmation/shipped) fails to
  // send while Twilio is configured, so the failure is visible to admins
  // instead of silently vanishing — cleared is implicit (null = no failure).
  smsLastError: text("sms_last_error"),
  smsLastErrorAt: timestamp("sms_last_error_at"),
  notes: text("notes"),
  
  // Order source/channel tracking
  // Channels: 'website', 'customer_epos', 'reseller_storefront', 'reseller_epos', 'vendor_storefront', 'vendor_epos', 'admin'
  channel: text("channel").default("website"),
  resellerId: varchar("reseller_id").references(() => resellers.id), // Track reseller attribution for reseller sales
  vendorId: varchar("vendor_id").references(() => vendors.id), // Track vendor attribution for vendor sales
  eposTerminalId: varchar("epos_terminal_id").references(() => eposTerminals.id), // Track which EPOS terminal was used
  
  // Storefront attribution (for reseller/vendor storefront orders)
  storefrontId: varchar("storefront_id"), // ID of the storefront this order came from
  storefrontSlug: text("storefront_slug"), // Slug snapshot for reference
  
  // Review access token (secure, one-time use token for feedback submission)
  reviewAccessToken: varchar("review_access_token"),
  
  // Terms and conditions acceptance timestamp for fraud prevention
  termsAcceptedAt: timestamp("terms_accepted_at"),
  
  // Timestamps
  orderDate: timestamp("order_date").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),

  // Post-delivery review request tracking
  reviewEmailSentAt: timestamp("review_email_sent_at"),
  reviewSmsSentAt: timestamp("review_sms_sent_at"),
});

// Customer order items table
export const customerOrderItems = pgTable("customer_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => customerOrders.id),
  productId: varchar("product_id").references(() => products.id), // Nullable for vendor product orders
  vendorProductId: varchar("vendor_product_id"), // For vendor EPOS orders (no FK constraint due to circular deps)
  productName: text("product_name").notNull(),
  sku: text("sku"), // Product/variant SKU for warehouse picking
  barcodeDescriptor: text("barcode_descriptor"), // Custom barcode identifier for easy product identification
  locationNote: text("location_note"), // Storage location for warehouse picking (e.g., "Shelf A3, Box 2")
  size: text("size"),
  color: text("color"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 8, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  isPreOrder: boolean("is_pre_order").notNull().default(false), // Track if item was pre-ordered
  imageUrl: text("image_url"), // Product image for visual identification
});

// Customer order status history - tracks all status changes for audit trail
export const customerOrderStatusHistory = pgTable("customer_order_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => customerOrders.id),
  previousStatus: customerOrderStatusEnum("previous_status"),
  newStatus: customerOrderStatusEnum("new_status").notNull(),
  changedBy: varchar("changed_by").references(() => users.id),
  changedByName: text("changed_by_name"), // Store name for display
  notes: text("notes"),
  ipAddress: text("ip_address"), // For security audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order email log table - tracks when confirmation emails are sent
export const orderEmailLog = pgTable("order_email_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => customerOrders.id),
  sentBy: varchar("sent_by").references(() => users.id),
  sentByName: text("sent_by_name"),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject"),
  success: boolean("success").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderEmailLogSchema = createInsertSchema(orderEmailLog).omit({
  id: true,
  createdAt: true,
});
export type InsertOrderEmailLog = z.infer<typeof insertOrderEmailLogSchema>;
export type OrderEmailLog = typeof orderEmailLog.$inferSelect;

// Commission status enum
export const commissionStatusEnum = pgEnum("commission_status", [
  "pending",      // Commission earned but not yet confirmed (order in progress)
  "confirmed",    // Order delivered, commission confirmed
  "requested",    // Payout requested by reseller/vendor
  "approved",     // Payout approved by admin
  "paid",         // Commission has been paid out
  "cancelled"     // Order cancelled, commission voided
]);

// Commission earner type enum (reseller vs vendor)
export const commissionEarnerTypeEnum = pgEnum("commission_earner_type", ["reseller", "vendor"]);

// Commissions table - tracks earnings per order
export const commissions = pgTable("commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => customerOrders.id),
  orderNumber: text("order_number").notNull(),
  
  // Who earned this commission
  commissionType: commissionEarnerTypeEnum("commission_earner_type").notNull(),
  resellerId: varchar("reseller_id").references(() => resellers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  
  // Commission calculation
  orderTotal: decimal("order_total", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(), // Rate at time of order
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(), // Calculated commission
  
  // Status tracking
  status: commissionStatusEnum("status").notNull().default("pending"),
  
  // Payout tracking
  payoutId: varchar("payout_id").references(() => commissionPayouts.id),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
  paidAt: timestamp("paid_at"),
});

// Commission Payout Status enum
export const commissionPayoutStatusEnum = pgEnum("commission_payout_status", [
  "requested",    // Payout requested by reseller/vendor
  "approved",     // Admin approved the payout
  "processing",   // Payment is being processed
  "completed",    // Payment completed
  "rejected"      // Payout request rejected
]);

// Commission Payouts table - tracks payout requests and payments
export const commissionPayouts = pgTable("commission_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Who is requesting the payout
  commissionType: commissionEarnerTypeEnum("commission_earner_type").notNull(),
  resellerId: varchar("reseller_id").references(() => resellers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  
  // Payout details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: commissionPayoutStatusEnum("status").notNull().default("requested"),
  
  // Period this payout covers
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Payment details
  paymentMethod: text("payment_method"), // bank_transfer, stripe, etc.
  paymentReference: text("payment_reference"), // Transaction ID, reference number
  notes: text("notes"),
  
  // Admin actions
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
});

// Commission Tiers table - tiered commission rates based on sales volume
export const commissionTiers = pgTable("commission_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Bronze", "Silver", "Gold", "Platinum"
  partnerType: commissionEarnerTypeEnum("partner_type").notNull(), // reseller or vendor
  minSalesAmount: decimal("min_sales_amount", { precision: 12, scale: 2 }).notNull().default("0.00"), // Minimum total sales to qualify
  maxSalesAmount: decimal("max_sales_amount", { precision: 12, scale: 2 }), // Maximum sales for this tier (null = unlimited)
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(), // Commission percentage for this tier
  displayOrder: integer("display_order").notNull().default(0), // For ordering tiers
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Partner Sales Summary - tracks cumulative sales for tier calculation
export const partnerSalesSummary = pgTable("partner_sales_summary", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerType: commissionEarnerTypeEnum("partner_type").notNull(),
  resellerId: varchar("reseller_id").references(() => resellers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  currentTierId: varchar("current_tier_id").references(() => commissionTiers.id),
  totalSalesAmount: decimal("total_sales_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalCommissionEarned: decimal("total_commission_earned", { precision: 12, scale: 2 }).notNull().default("0.00"),
  currentMonthSales: decimal("current_month_sales", { precision: 12, scale: 2 }).notNull().default("0.00"),
  lastTierUpgradeAt: timestamp("last_tier_upgrade_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Commission Tier History - audit log of tier changes
export const commissionTierHistory = pgTable("commission_tier_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerType: commissionEarnerTypeEnum("partner_type").notNull(),
  resellerId: varchar("reseller_id").references(() => resellers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  previousTierId: varchar("previous_tier_id").references(() => commissionTiers.id),
  newTierId: varchar("new_tier_id").references(() => commissionTiers.id),
  previousRate: decimal("previous_rate", { precision: 5, scale: 2 }),
  newRate: decimal("new_rate", { precision: 5, scale: 2 }),
  salesAmountAtChange: decimal("sales_amount_at_change", { precision: 12, scale: 2 }),
  reason: text("reason"), // "auto_upgrade", "manual_adjustment", "tier_reset"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Coupons table (discount codes and promotions)
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // Case-insensitive unique coupon code
  description: text("description"),
  type: couponTypeEnum("type").notNull(), // percentage, fixed_amount, or free_shipping
  value: decimal("value", { precision: 8, scale: 2 }).notNull(), // percentage value or fixed amount
  minimumOrderTotal: decimal("minimum_order_total", { precision: 10, scale: 2 }).default("0.00"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  maxGlobalUses: integer("max_global_uses"), // null = unlimited
  maxUsesPerCustomer: integer("max_uses_per_customer").default(1),
  currentUses: integer("current_uses").notNull().default(0),
  firstOrderOnly: boolean("first_order_only").notNull().default(false), // Restrict to first-time customers only
  vendorId: varchar("vendor_id").references(() => vendors.id), // null = available to all, set = exclusive to this wholesaler
  productId: varchar("product_id"), // legacy single-product restriction (kept for backward compat)
  productIds: text("product_ids").array(), // multi-product restriction: null/empty = all products, array = specific products
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Coupon redemptions table (track coupon usage)
export const couponRedemptions = pgTable("coupon_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  couponId: varchar("coupon_id").notNull().references(() => coupons.id),
  orderId: varchar("order_id").notNull().references(() => customerOrders.id),
  userId: varchar("user_id").references(() => users.id), // null for guest checkouts
  customerEmail: text("customer_email").notNull(),
  discountAmount: decimal("discount_amount", { precision: 8, scale: 2 }).notNull(),
  shippingDiscountAmount: decimal("shipping_discount_amount", { precision: 8, scale: 2 }).notNull().default("0.00"),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
});

// Site settings table (global configuration)
export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activeTheme: homepageThemeEnum("active_theme").notNull().default("tactical_dark"),
  chatbotVisible: boolean("chatbot_visible").notNull().default(true),
  freeShippingEnabled: boolean("free_shipping_enabled").notNull().default(true),
  freeShippingThreshold: decimal("free_shipping_threshold", { precision: 10, scale: 2 }).notNull().default("75.00"),
  freeShippingRadiusMiles: decimal("free_shipping_radius_miles", { precision: 6, scale: 2 }).default("0"), // Free shipping within this radius in miles from store
  freeShippingPostcode: text("free_shipping_postcode").default(""), // Central postcode for radius-based free shipping
  standardShippingCost: decimal("standard_shipping_cost", { precision: 10, scale: 2 }).notNull().default("4.99"),
  inStoreCollectionEnabled: boolean("in_store_collection_enabled").notNull().default(true), // Allow customers to collect from stores
  heroSlideDuration: integer("hero_slide_duration").notNull().default(6), // Duration in seconds for hero slide transitions
  showColorsAsSeparateProducts: boolean("show_colors_as_separate_products").notNull().default(true), // When true, each color variant appears as a separate product card
  showHeroProducts: boolean("show_hero_products").notNull().default(true), // When true, products marked as "Hero Section" appear in the hero slideshow
  minimumPayoutAmount: decimal("minimum_payout_amount", { precision: 10, scale: 2 }).notNull().default("50.00"), // Minimum amount for reseller/vendor payout requests
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// Hero videos table (for admin-managed homepage background videos)
export const heroVideos = pgTable("hero_videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  videoUrl: text("video_url").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Hero images table (for admin-managed homepage background images)
export const heroImages = pgTable("hero_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Company stores table (for admin-managed store locations)
export const companyStores = pgTable("company_stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  hours: text("hours"),
  features: text("features").array(), // Array of features like "Personal Shopping", "Fitting Rooms", etc.
  imageUrl: text("image_url"),
  mapUrl: text("map_url"), // Google Maps embed or link
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanyStoreSchema = createInsertSchema(companyStores).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompanyStore = z.infer<typeof insertCompanyStoreSchema>;
export type CompanyStore = typeof companyStores.$inferSelect;

// Customer interactions table (CRM activity tracking)
export const customerInteractions = pgTable("customer_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  customerEmail: text("customer_email").notNull(),
  interactionType: interactionTypeEnum("interaction_type").notNull(),
  subject: text("subject"),
  content: text("content"),
  orderId: varchar("order_id").references(() => customerOrders.id),
  resellerId: varchar("reseller_id"), // Track which reseller acquired this customer
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id), // Admin user who created the interaction
});

// Customer notes table (internal admin notes on customers)
export const customerNotes = pgTable("customer_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id), // Admin user who created the note
});

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: text("ticket_number").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"), // Customer phone for callback
  
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").notNull().default("open"),
  priority: ticketPriorityEnum("priority").notNull().default("medium"),
  category: text("category"), // Issue category: shipping, returns, product, billing, general
  channel: text("channel").default("email"), // Contact channel: email, chat, phone, whatsapp, social
  
  orderId: varchar("order_id").references(() => customerOrders.id),
  resellerId: varchar("reseller_id"), // Track which reseller's customer this ticket is for
  assignedTo: varchar("assigned_to").references(() => users.id),
  
  // SLA Tracking
  slaDeadline: timestamp("sla_deadline"), // When response is due based on priority
  firstResponseAt: timestamp("first_response_at"), // When staff first responded
  slaBreached: boolean("sla_breached").default(false), // Whether SLA was missed
  responseTimeMinutes: integer("response_time_minutes"), // Time to first response in minutes
  resolutionTimeMinutes: integer("resolution_time_minutes"), // Total time to resolution in minutes
  
  // Customer portal access
  accessToken: text("access_token").unique(), // Secure token for customer to access their ticket
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

// Support ticket messages/responses
export const ticketMessages = pgTable("ticket_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => supportTickets.id),
  userId: varchar("user_id").references(() => users.id),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  isStaff: boolean("is_staff").notNull().default(false),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customer segments table (for marketing and analytics)
export const customerSegments = pgTable("customer_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  criteria: text("criteria").notNull(), // JSON string with segment rules
  customerCount: integer("customer_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer segment memberships (many-to-many)
export const customerSegmentMembers = pgTable("customer_segment_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  segmentId: varchar("segment_id").notNull().references(() => customerSegments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Customer analytics/metrics table
export const customerMetrics = pgTable("customer_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  acquisitionResellerId: varchar("acquisition_reseller_id"), // Track which reseller first acquired this customer
  
  // RFM Analysis
  lastPurchaseDate: timestamp("last_purchase_date"),
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).notNull().default("0.00"),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).notNull().default("0.00"),
  
  // Customer Lifetime Value
  lifetimeValue: decimal("lifetime_value", { precision: 12, scale: 2 }).notNull().default("0.00"),
  
  // Engagement
  emailsOpened: integer("emails_opened").notNull().default(0),
  emailsClicked: integer("emails_clicked").notNull().default(0),
  supportTicketsCreated: integer("support_tickets_created").notNull().default(0),
  
  // Risk indicators
  churnRisk: decimal("churn_risk", { precision: 5, scale: 2 }).default("0.00"), // 0-100%
  isVip: boolean("is_vip").notNull().default(false),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer activity log table (comprehensive activity timeline)
export const customerActivityLog = pgTable("customer_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityType: text("activity_type").notNull(), // login, logout, page_view, product_view, add_to_cart, remove_from_cart, wishlist_add, wishlist_remove, order_placed, order_cancelled, ticket_created, ticket_resolved, email_opened, email_clicked, profile_updated, password_changed
  activityDetails: text("activity_details"), // JSON string with additional context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  orderId: varchar("order_id"), // Reference to order if order-related
  productId: varchar("product_id"), // Reference to product if product-related
  ticketId: varchar("ticket_id"), // Reference to ticket if support-related
  campaignId: varchar("campaign_id"), // Reference to campaign if marketing-related
  sessionId: text("session_id"), // Track session for grouping activities
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  reseller: one(resellers, {
    fields: [users.id],
    references: [resellers.userId],
  }),
  measurements: one(userMeasurements, {
    fields: [users.id],
    references: [userMeasurements.userId],
  }),
}));

export const userMeasurementsRelations = relations(userMeasurements, ({ one }) => ({
  user: one(users, {
    fields: [userMeasurements.userId],
    references: [users.id],
  }),
}));

export const resellersRelations = relations(resellers, ({ one, many }) => ({
  user: one(users, {
    fields: [resellers.userId],
    references: [users.id],
  }),
  inventory: many(resellerInventory),
  orders: many(orders),
  stockAlerts: many(stockAlerts),
}));

export const productsRelations = relations(products, ({ many }) => ({
  inventory: many(resellerInventory),
  orderItems: many(orderItems),
  pricingTiers: many(pricingTiers),
  stockAlerts: many(stockAlerts),
}));

export const resellerInventoryRelations = relations(resellerInventory, ({ one }) => ({
  reseller: one(resellers, {
    fields: [resellerInventory.resellerId],
    references: [resellers.id],
  }),
  product: one(products, {
    fields: [resellerInventory.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  reseller: one(resellers, {
    fields: [orders.resellerId],
    references: [resellers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const pricingTiersRelations = relations(pricingTiers, ({ one }) => ({
  product: one(products, {
    fields: [pricingTiers.productId],
    references: [products.id],
  }),
}));

export const stockAlertsRelations = relations(stockAlerts, ({ one }) => ({
  reseller: one(resellers, {
    fields: [stockAlerts.resellerId],
    references: [resellers.id],
  }),
  product: one(products, {
    fields: [stockAlerts.productId],
    references: [products.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  profileImageUrl: true,
  firstName: true,
  lastName: true,
  role: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export const insertUserMeasurementsSchema = createInsertSchema(userMeasurements).omit({
  id: true,
  updatedAt: true,
});

export const insertResellerSchema = createInsertSchema(resellers).pick({
  userId: true,
  businessName: true,
  contactPerson: true,
  businessAddress: true,
  phoneNumber: true,
  tier: true,
  discountPercentage: true,
  creditLimit: true,
  isActive: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSectionSchema = createInsertSchema(productSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductActivityTypeSchema = createInsertSchema(productActivityTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).pick({
  userId: true,
  businessName: true,
  businessDescription: true,
  businessAddress: true,
  phoneNumber: true,
  website: true,
  isActive: true,
});

export const insertVendorProductSchema = createInsertSchema(vendorProducts).pick({
  vendorId: true,
  name: true,
  description: true,
  category: true,
  sku: true,
  retailPrice: true,
  imageUrl: true,
  sizes: true,
  colors: true,
  materials: true,
  careInstructions: true,
});

export const insertVendorProductVariantSchema = createInsertSchema(vendorProductVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  category: true,
  activityType: true,
  gender: true,
  sku: true,
  retailPrice: true,
  salePrice: true,
  wholesalePrice: true,
  costPrice: true,
  imageUrl: true,
  hoverImageUrl: true,
  videoUrl: true,
  sizes: true,
  colors: true,
  features: true,
  materials: true,
  careInstructions: true,
  modelInfo: true,
  isActive: true,
  isHeroProduct: true,
  collections: true,
  availabilityStatus: true,
  barcodeDescriptor: true,
  detailedDescription: true,
});

export const insertProductImageSchema = createInsertSchema(productImages).omit({
  id: true,
  createdAt: true,
});

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(1000),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  resellerId: true,
  orderNumber: true,
  totalAmount: true,
  discountAmount: true,
  finalAmount: true,
  paymentMethod: true,
  shippingAddress: true,
  notes: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  size: true,
  color: true,
  quantity: true,
  unitPrice: true,
  totalPrice: true,
});

export const insertInventorySchema = createInsertSchema(resellerInventory).pick({
  resellerId: true,
  productId: true,
  size: true,
  color: true,
  quantity: true,
  reorderLevel: true,
});

// Warehouse schemas
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWarehouseInventorySchema = createInsertSchema(warehouseInventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStockTransferSchema = createInsertSchema(stockTransfers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  shippedAt: true,
  completedAt: true,
});

export const insertStockTransferItemSchema = createInsertSchema(stockTransferItems).omit({
  id: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  resellerId: true,
  senderId: true,
  messageType: true,
  subject: true,
  content: true,
  orderId: true,
});

export const insertOrderStatusHistorySchema = createInsertSchema(orderStatusHistory).pick({
  orderId: true,
  status: true,
  notes: true,
  createdBy: true,
});

export const insertShipmentDetailsSchema = createInsertSchema(shipmentDetails).pick({
  orderId: true,
  carrier: true,
  trackingNumber: true,
  trackingUrl: true,
  estimatedDeliveryDate: true,
  shippingCost: true,
  weight: true,
  dimensions: true,
  notes: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  resellerId: true,
  type: true,
  title: true,
  message: true,
  link: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const insertAuthIdentitySchema = createInsertSchema(authIdentities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocalCredentialSchema = createInsertSchema(localCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAuthIdentity = z.infer<typeof insertAuthIdentitySchema>;
export type AuthIdentity = typeof authIdentities.$inferSelect;

export type InsertLocalCredential = z.infer<typeof insertLocalCredentialSchema>;
export type LocalCredential = typeof localCredentials.$inferSelect;

export type InsertUserMeasurements = z.infer<typeof insertUserMeasurementsSchema>;
export type UserMeasurements = typeof userMeasurements.$inferSelect;

export type InsertReseller = z.infer<typeof insertResellerSchema>;
export type Reseller = typeof resellers.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertProductSection = z.infer<typeof insertProductSectionSchema>;
export type ProductSection = typeof productSections.$inferSelect;

export type InsertProductActivityType = z.infer<typeof insertProductActivityTypeSchema>;
export type ProductActivityType = typeof productActivityTypes.$inferSelect;

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

export type InsertVendorProduct = z.infer<typeof insertVendorProductSchema>;
export type VendorProduct = typeof vendorProducts.$inferSelect;

export type InsertVendorProductVariant = z.infer<typeof insertVendorProductVariantSchema>;
export type VendorProductVariant = typeof vendorProductVariants.$inferSelect;

// Vendor Reseller Permissions schemas and types
export const insertVendorResellerPermissionSchema = createInsertSchema(vendorResellerPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
});

export type InsertVendorResellerPermission = z.infer<typeof insertVendorResellerPermissionSchema>;
export type VendorResellerPermission = typeof vendorResellerPermissions.$inferSelect;

// EPOS Terminals schemas and types
export const insertEposTerminalSchema = createInsertSchema(eposTerminals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastActivityAt: true,
});

export type InsertEposTerminal = z.infer<typeof insertEposTerminalSchema>;
export type EposTerminal = typeof eposTerminals.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type ProductImage = typeof productImages.$inferSelect;

export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;

export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type ProductReview = typeof productReviews.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type ResellerInventory = typeof resellerInventory.$inferSelect;

// Warehouse types
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;

export type InsertWarehouseInventory = z.infer<typeof insertWarehouseInventorySchema>;
export type WarehouseInventory = typeof warehouseInventory.$inferSelect;

export type InsertStockTransfer = z.infer<typeof insertStockTransferSchema>;
export type StockTransfer = typeof stockTransfers.$inferSelect;

export type InsertStockTransferItem = z.infer<typeof insertStockTransferItemSchema>;
export type StockTransferItem = typeof stockTransferItems.$inferSelect;

export type PricingTier = typeof pricingTiers.$inferSelect;
export type StockAlert = typeof stockAlerts.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertOrderStatusHistory = z.infer<typeof insertOrderStatusHistorySchema>;
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;

export type InsertShipmentDetails = z.infer<typeof insertShipmentDetailsSchema>;
export type ShipmentDetails = typeof shipmentDetails.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Reseller activity log Zod schemas
export const insertResellerActivityLogSchema = createInsertSchema(resellerActivityLog).pick({
  resellerId: true,
  adminUserId: true,
  actionType: true,
  description: true,
  oldValue: true,
  newValue: true,
});
export type InsertResellerActivityLog = z.infer<typeof insertResellerActivityLogSchema>;
export type ResellerActivityLog = typeof resellerActivityLog.$inferSelect;

// CRM Zod schemas for validation
export const insertCustomerOrderSchema = createInsertSchema(customerOrders).pick({
  userId: true,
  customerEmail: true,
  customerFirstName: true,
  customerLastName: true,
  shippingAddress: true,
  shippingCity: true,
  shippingPostalCode: true,
  shippingCountry: true,
  subtotal: true,
  shippingCost: true,
  taxAmount: true,
  totalAmount: true,
  paymentMethod: true,
  paymentIntentId: true,
  notes: true,
  channel: true,
  resellerId: true,
  vendorId: true,
  eposTerminalId: true,
});

export const insertCustomerOrderItemSchema = createInsertSchema(customerOrderItems).pick({
  orderId: true,
  productId: true,
  productName: true,
  size: true,
  color: true,
  quantity: true,
  unitPrice: true,
  totalPrice: true,
  isPreOrder: true,
});

export const insertCustomerInteractionSchema = createInsertSchema(customerInteractions).pick({
  userId: true,
  customerEmail: true,
  interactionType: true,
  subject: true,
  content: true,
  orderId: true,
  metadata: true,
  createdBy: true,
});

export const insertCustomerNoteSchema = createInsertSchema(customerNotes).pick({
  userId: true,
  note: true,
  createdBy: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).pick({
  userId: true,
  customerEmail: true,
  customerName: true,
  subject: true,
  description: true,
  priority: true,
  orderId: true,
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).pick({
  ticketId: true,
  userId: true,
  senderName: true,
  senderEmail: true,
  isStaff: true,
  message: true,
});

export const insertCustomerSegmentSchema = createInsertSchema(customerSegments).pick({
  name: true,
  description: true,
  criteria: true,
  isActive: true,
});

// CRM Type exports
export type InsertCustomerOrder = z.infer<typeof insertCustomerOrderSchema>;
export type CustomerOrder = typeof customerOrders.$inferSelect;

export type InsertCustomerOrderItem = z.infer<typeof insertCustomerOrderItemSchema>;
export type CustomerOrderItem = typeof customerOrderItems.$inferSelect;

// Customer order status history schemas
export const insertCustomerOrderStatusHistorySchema = createInsertSchema(customerOrderStatusHistory).pick({
  orderId: true,
  previousStatus: true,
  newStatus: true,
  changedBy: true,
  changedByName: true,
  notes: true,
  ipAddress: true,
});
export type InsertCustomerOrderStatusHistory = z.infer<typeof insertCustomerOrderStatusHistorySchema>;
export type CustomerOrderStatusHistory = typeof customerOrderStatusHistory.$inferSelect;

// Commission schemas
export const insertCommissionSchema = createInsertSchema(commissions).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
  paidAt: true,
});

export const insertCommissionPayoutSchema = createInsertSchema(commissionPayouts).omit({
  id: true,
  requestedAt: true,
  approvedAt: true,
  processedAt: true,
  completedAt: true,
  rejectedAt: true,
});

export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type Commission = typeof commissions.$inferSelect;

export type InsertCommissionPayout = z.infer<typeof insertCommissionPayoutSchema>;
export type CommissionPayout = typeof commissionPayouts.$inferSelect;

// Commission Tier schemas
export const insertCommissionTierSchema = createInsertSchema(commissionTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnerSalesSummarySchema = createInsertSchema(partnerSalesSummary).omit({
  id: true,
  updatedAt: true,
});

export const insertCommissionTierHistorySchema = createInsertSchema(commissionTierHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertCommissionTier = z.infer<typeof insertCommissionTierSchema>;
export type CommissionTier = typeof commissionTiers.$inferSelect;

export type InsertPartnerSalesSummary = z.infer<typeof insertPartnerSalesSummarySchema>;
export type PartnerSalesSummary = typeof partnerSalesSummary.$inferSelect;

export type InsertCommissionTierHistory = z.infer<typeof insertCommissionTierHistorySchema>;
export type CommissionTierHistory = typeof commissionTierHistory.$inferSelect;

export type InsertCustomerInteraction = z.infer<typeof insertCustomerInteractionSchema>;
export type CustomerInteraction = typeof customerInteractions.$inferSelect;

export type InsertCustomerNote = z.infer<typeof insertCustomerNoteSchema>;
export type CustomerNote = typeof customerNotes.$inferSelect;

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type TicketMessage = typeof ticketMessages.$inferSelect;

export type InsertCustomerSegment = z.infer<typeof insertCustomerSegmentSchema>;
export type CustomerSegment = typeof customerSegments.$inferSelect;

export type CustomerMetric = typeof customerMetrics.$inferSelect;

// Coupon Zod schemas for validation
export const insertCouponSchema = createInsertSchema(coupons).pick({
  code: true,
  description: true,
  type: true,
  value: true,
  minimumOrderTotal: true,
  startDate: true,
  endDate: true,
  maxGlobalUses: true,
  maxUsesPerCustomer: true,
  isActive: true,
  createdBy: true,
});

export const insertCouponRedemptionSchema = createInsertSchema(couponRedemptions).pick({
  couponId: true,
  orderId: true,
  userId: true,
  customerEmail: true,
  discountAmount: true,
  shippingDiscountAmount: true,
});

// Coupon Type exports
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;

export type InsertCouponRedemption = z.infer<typeof insertCouponRedemptionSchema>;
export type CouponRedemption = typeof couponRedemptions.$inferSelect;

// Site Settings schemas and types
export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({ id: true });
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;

export const insertHeroVideoSchema = createInsertSchema(heroVideos).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHeroVideo = z.infer<typeof insertHeroVideoSchema>;
export type HeroVideo = typeof heroVideos.$inferSelect;

export const insertHeroImageSchema = createInsertSchema(heroImages).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHeroImage = z.infer<typeof insertHeroImageSchema>;
export type HeroImage = typeof heroImages.$inferSelect;

// ============================================
// POPUP MESSAGES - Admin-controlled site popups
// ============================================

// Popup messages table (for site-wide announcements/welcome popups)
export const popupMessages = pgTable("popup_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  buttonText: text("button_text").default("Got it"),
  buttonLink: text("button_link"), // Optional link for the button
  imageUrl: text("image_url"), // Optional image for the popup
  backgroundColor: text("background_color").default("#1a1a2e"),
  textColor: text("text_color").default("#ffffff"),
  buttonColor: text("button_color").default("#3b82f6"),
  isActive: boolean("is_active").notNull().default(true),
  showOnce: boolean("show_once").notNull().default(true), // Show only once per session/visitor
  displayDelay: integer("display_delay").default(1000), // Delay in ms before showing
  priority: integer("priority").default(0), // Higher priority shows first
  startDate: timestamp("start_date"), // Optional start date
  endDate: timestamp("end_date"), // Optional end date
  targetPages: text("target_pages").array().default(sql`ARRAY['all']::text[]`), // Pages to show on: 'all', 'homepage', 'checkout', 'cart', 'products', etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

// Popup messages Zod schemas
export const insertPopupMessageSchema = createInsertSchema(popupMessages).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertPopupMessage = z.infer<typeof insertPopupMessageSchema>;
export type PopupMessage = typeof popupMessages.$inferSelect;

// ============================================
// PERSONALIZATION TABLES - Product Recommendations
// ============================================

// Product views tracking (for personalization and analytics)
export const productViews = pgTable("product_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"), // For anonymous users
  productId: varchar("product_id").notNull().references(() => products.id),
  category: text("category").notNull(), // Denormalized for quick querying
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  viewDuration: integer("view_duration"), // Seconds spent on product page
  source: text("source"), // 'search', 'category', 'recommendation', 'direct'
});

// Product recommendations (pre-calculated for performance)
export const productRecommendations = pgTable("product_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(), // Recommendation strength (0-100)
  reason: text("reason"), // 'viewed_similar', 'same_category', 'trending'
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
});

// Product views relations
export const productViewsRelations = relations(productViews, ({ one }) => ({
  user: one(users, {
    fields: [productViews.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [productViews.productId],
    references: [products.id],
  }),
}));

// Product recommendations relations
export const productRecommendationsRelations = relations(productRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [productRecommendations.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [productRecommendations.productId],
    references: [products.id],
  }),
}));

// Personalization Zod schemas
export const insertProductViewSchema = createInsertSchema(productViews)
  .pick({
    userId: true,
    sessionId: true,
    productId: true,
    category: true,
    viewDuration: true,
    source: true,
  })
  .extend({
    productId: z.string().min(1, "Product ID is required"),
    category: z.string().min(1, "Category is required"),
  });

export const insertProductRecommendationSchema = createInsertSchema(productRecommendations).pick({
  userId: true,
  productId: true,
  score: true,
  reason: true,
});

// Personalization Type exports
export type InsertProductView = z.infer<typeof insertProductViewSchema>;
export type ProductView = typeof productViews.$inferSelect;

export type InsertProductRecommendation = z.infer<typeof insertProductRecommendationSchema>;
export type ProductRecommendation = typeof productRecommendations.$inferSelect;

// ============================================
// WISHLIST SYSTEM
// ============================================

// User wishlist - Save favorite products for later
export const wishlists = pgTable("wishlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserProduct: sql`UNIQUE (user_id, product_id)`,
}));

// Wishlist relations
export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));

// Wishlist Zod schemas
export const insertWishlistSchema = createInsertSchema(wishlists).pick({
  userId: true,
  productId: true,
});

// Wishlist Type exports
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type Wishlist = typeof wishlists.$inferSelect;

// ============================================
// SHOPPING CART SYSTEM
// ============================================

// Shopping cart - Persist cart items for users
export const carts = pgTable("carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar("session_id"), // For guest users
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserCart: sql`UNIQUE (user_id)`,
  uniqueSessionCart: sql`UNIQUE (session_id)`,
}));

// Cart items - Individual products in cart
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cartId: varchar("cart_id").notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  size: text("size").notNull(),
  color: text("color").notNull(),
  quantity: integer("quantity").notNull().default(1),
  image: text("image"),
  category: text("category"),
  storefrontSlug: text("storefront_slug"),
  resellerId: varchar("reseller_id").references(() => resellers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cart relations
export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

// Cart Zod schemas
export const insertCartSchema = createInsertSchema(carts).pick({
  userId: true,
  sessionId: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  cartId: true,
  productId: true,
  name: true,
  price: true,
  size: true,
  color: true,
  quantity: true,
  image: true,
  category: true,
  storefrontSlug: true,
  resellerId: true,
});

// Cart Type exports
export type InsertCart = z.infer<typeof insertCartSchema>;
export type Cart = typeof carts.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;

// ============================================
// MULTI-TENANT RESELLER STOREFRONT SYSTEM
// ============================================

// Commission type enum
export const commissionTypeEnum = pgEnum("commission_type", ["percentage", "fixed_amount"]);

// Commission payment status enum
export const commissionPaymentStatusEnum = pgEnum("commission_payment_status", ["pending", "processing", "paid", "failed"]);

// Reseller Storefronts - Each reseller gets their own branded storefront
export const resellerStorefronts = pgTable("reseller_storefronts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id).unique(),
  slug: text("slug").notNull().unique(), // e.g., "johns-fitness-shop"
  storeName: text("store_name").notNull(),
  storeDescription: text("store_description"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  customDomain: text("custom_domain"), // Optional custom domain
  primaryColor: text("primary_color").default("#0073cf"),
  accentColor: text("accent_color").default("#005ba3"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reseller Products - Products that resellers have added to their storefront
export const resellerProducts = pgTable("reseller_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  customPrice: decimal("custom_price", { precision: 8, scale: 2 }), // Optional: reseller can set their own price
  isActive: boolean("is_active").notNull().default(true), // Reseller can hide/show products
  displayOrder: integer("display_order").default(0), // For sorting products
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Vendor Partner Products - 1stRep products that vendors have added to sell (earn commission)
export const vendorPartnerProducts = pgTable("vendor_partner_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  isActive: boolean("is_active").notNull().default(true), // Vendor can hide/show products
  displayOrder: integer("display_order").default(0), // For sorting products
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Partner type enum for commission overrides
export const partnerTypeEnum = pgEnum("partner_type", ["reseller", "vendor"]);

// Partner Commission Overrides - Per-partner, per-product commission rate overrides
// These override the default product.partnerCommissionRate for specific partners
export const partnerCommissionOverrides = pgTable("partner_commission_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerType: partnerTypeEnum("partner_type").notNull(), // 'reseller' or 'vendor'
  resellerId: varchar("reseller_id").references(() => resellers.id), // Set if partnerType = 'reseller'
  vendorId: varchar("vendor_id").references(() => vendors.id), // Set if partnerType = 'vendor'
  productId: varchar("product_id").references(() => products.id), // Specific product (null = all products)
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(), // Override commission percentage
  storefrontPrice: decimal("storefront_price", { precision: 8, scale: 2 }), // Optional override for storefront price
  notes: text("notes"), // Admin notes
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reseller Customer Orders - Orders placed through reseller storefronts
export const resellerCustomerOrders = pgTable("reseller_customer_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id),
  customerId: varchar("customer_id").references(() => users.id), // Can be null for guest checkout
  orderNumber: text("order_number").notNull().unique(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  billingAddress: text("billing_address").notNull(),
  phoneNumber: text("phone_number"),
  status: customerOrderStatusEnum("status").notNull().default("pending"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).notNull().default("0.00"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  platformCommission: decimal("platform_commission", { precision: 10, scale: 2 }).notNull(), // Amount platform keeps
  resellerEarnings: decimal("reseller_earnings", { precision: 10, scale: 2 }).notNull(), // Amount reseller earns
  stripePaymentIntentId: text("stripe_payment_intent_id"), // For payment tracking
  stripeTransferId: text("stripe_transfer_id"), // For commission transfer tracking
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
  channel: text("channel").default("storefront"), // 'storefront', 'reseller_epos' - tracks order source
  orderDate: timestamp("order_date").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
});

// Reseller Customer Order Items - Line items for reseller customer orders
export const resellerCustomerOrderItems = pgTable("reseller_customer_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => resellerCustomerOrders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(), // Snapshot at time of order
  productSku: text("product_sku").notNull(),
  size: text("size"),
  color: text("color"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 8, scale: 2 }).notNull(), // Price customer paid
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 8, scale: 2 }).notNull(), // Platform's cost
  imageUrl: text("image_url"),
});

// Commission Rules - Configurable commission rules per product/category/reseller
export const commissionRules = pgTable("commission_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Default Rule", "Premium Products Rule"
  description: text("description"),
  commissionType: commissionTypeEnum("commission_type").notNull().default("percentage"),
  commissionValue: decimal("commission_value", { precision: 8, scale: 2 }).notNull(), // Percentage or fixed amount
  productId: varchar("product_id").references(() => products.id), // Specific product (null = applies to all)
  categoryName: text("category_name"), // Specific category (null = applies to all)
  resellerId: varchar("reseller_id").references(() => resellers.id), // Specific reseller (null = applies to all)
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }), // Minimum order to qualify
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(0), // Higher priority rules are applied first
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Commission Payments - Track commission payments to resellers
export const commissionPayments = pgTable("commission_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id),
  orderId: varchar("order_id").references(() => resellerCustomerOrders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: commissionPaymentStatusEnum("status").notNull().default("pending"),
  paymentMethod: text("payment_method"), // 'stripe_transfer', 'bank_transfer', 'paypal'
  stripeTransferId: text("stripe_transfer_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  paidAt: timestamp("paid_at"),
});

// Payout Request Status Enum
export const payoutRequestStatusEnum = pgEnum("payout_request_status", [
  "pending",      // Awaiting admin review
  "approved",     // Admin approved, ready for payment
  "processing",   // Payment is being processed
  "paid",         // Successfully paid out
  "rejected",     // Admin rejected the request
  "cancelled"     // Reseller cancelled the request
]);

// Payout Method Enum
export const payoutMethodEnum = pgEnum("payout_method", [
  "bank_transfer",
  "paypal", 
  "stripe_connect"
]);

// Payout Recipient Type Enum
export const payoutRecipientTypeEnum = pgEnum("payout_recipient_type", [
  "reseller",
  "vendor"
]);

// Payout Request Type Enum (who initiated the payout)
export const payoutRequestTypeEnum = pgEnum("payout_request_type", [
  "recipient_request",  // Reseller/vendor requested the payout
  "admin_initiated"     // Admin initiated the payout directly
]);

// Payout Requests - Resellers/Vendors request their earned commission or admin initiates payment
export const payoutRequests = pgTable("payout_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").references(() => resellers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  recipientType: payoutRecipientTypeEnum("recipient_type").notNull().default("reseller"),
  requestType: payoutRequestTypeEnum("request_type").notNull().default("recipient_request"),
  requestNumber: text("request_number").notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: payoutRequestStatusEnum("status").notNull().default("pending"),
  payoutMethod: payoutMethodEnum("payout_method").notNull().default("bank_transfer"),
  bankAccountName: text("bank_account_name"),
  bankAccountNumber: text("bank_account_number"),
  bankSortCode: text("bank_sort_code"),
  paypalEmail: text("paypal_email"),
  stripeAccountId: text("stripe_account_id"),
  stripeTransferId: text("stripe_transfer_id"),
  transferError: text("transfer_error"),
  adminNotes: text("admin_notes"),
  resellerNotes: text("reseller_notes"),
  processedBy: varchar("processed_by").references(() => users.id),
  initiatedByAdminId: varchar("initiated_by_admin_id").references(() => users.id),
  payoutReason: text("payout_reason"),
  isAdjustment: boolean("is_adjustment").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  processedAt: timestamp("processed_at"),
  paidAt: timestamp("paid_at"),
  transactionReference: text("transaction_reference"),
});

// Payout Audit Logs - Detailed history of all payout status changes
export const payoutAuditLogs = pgTable("payout_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payoutId: varchar("payout_id").notNull().references(() => payoutRequests.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // created, approved, rejected, processing, paid, cancelled, updated
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  performedBy: varchar("performed_by").references(() => users.id),
  performedByName: text("performed_by_name"),
  performedByRole: text("performed_by_role"),
  notes: text("notes"),
  metadata: text("metadata"), // JSON string for additional data like transaction reference, stripe transfer id, etc.
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for payout audit logs
export const payoutAuditLogsRelations = relations(payoutAuditLogs, ({ one }) => ({
  payout: one(payoutRequests, {
    fields: [payoutAuditLogs.payoutId],
    references: [payoutRequests.id],
  }),
  performer: one(users, {
    fields: [payoutAuditLogs.performedBy],
    references: [users.id],
  }),
}));

// Relations for multi-tenant storefront tables
export const resellerStorefrontsRelations = relations(resellerStorefronts, ({ one, many }) => ({
  reseller: one(resellers, {
    fields: [resellerStorefronts.resellerId],
    references: [resellers.id],
  }),
  products: many(resellerProducts),
  orders: many(resellerCustomerOrders),
}));

export const resellerProductsRelations = relations(resellerProducts, ({ one }) => ({
  reseller: one(resellers, {
    fields: [resellerProducts.resellerId],
    references: [resellers.id],
  }),
  product: one(products, {
    fields: [resellerProducts.productId],
    references: [products.id],
  }),
}));

export const resellerCustomerOrdersRelations = relations(resellerCustomerOrders, ({ one, many }) => ({
  reseller: one(resellers, {
    fields: [resellerCustomerOrders.resellerId],
    references: [resellers.id],
  }),
  customer: one(users, {
    fields: [resellerCustomerOrders.customerId],
    references: [users.id],
  }),
  items: many(resellerCustomerOrderItems),
  commissionPayment: one(commissionPayments, {
    fields: [resellerCustomerOrders.id],
    references: [commissionPayments.orderId],
  }),
}));

export const resellerCustomerOrderItemsRelations = relations(resellerCustomerOrderItems, ({ one }) => ({
  order: one(resellerCustomerOrders, {
    fields: [resellerCustomerOrderItems.orderId],
    references: [resellerCustomerOrders.id],
  }),
  product: one(products, {
    fields: [resellerCustomerOrderItems.productId],
    references: [products.id],
  }),
}));

export const commissionRulesRelations = relations(commissionRules, ({ one }) => ({
  product: one(products, {
    fields: [commissionRules.productId],
    references: [products.id],
  }),
  reseller: one(resellers, {
    fields: [commissionRules.resellerId],
    references: [resellers.id],
  }),
}));

export const commissionPaymentsRelations = relations(commissionPayments, ({ one }) => ({
  reseller: one(resellers, {
    fields: [commissionPayments.resellerId],
    references: [resellers.id],
  }),
  order: one(resellerCustomerOrders, {
    fields: [commissionPayments.orderId],
    references: [resellerCustomerOrders.id],
  }),
}));

export const payoutRequestsRelations = relations(payoutRequests, ({ one }) => ({
  reseller: one(resellers, {
    fields: [payoutRequests.resellerId],
    references: [resellers.id],
  }),
  vendor: one(vendors, {
    fields: [payoutRequests.vendorId],
    references: [vendors.id],
  }),
  processedByUser: one(users, {
    fields: [payoutRequests.processedBy],
    references: [users.id],
  }),
  initiatedByAdmin: one(users, {
    fields: [payoutRequests.initiatedByAdminId],
    references: [users.id],
  }),
}));

// Zod schemas for multi-tenant storefront
export const insertResellerStorefrontSchema = createInsertSchema(resellerStorefronts).pick({
  resellerId: true,
  slug: true,
  storeName: true,
  storeDescription: true,
  logoUrl: true,
  bannerUrl: true,
  customDomain: true,
  primaryColor: true,
  accentColor: true,
  isActive: true,
});

export const insertResellerProductSchema = createInsertSchema(resellerProducts).pick({
  resellerId: true,
  productId: true,
  customPrice: true,
  isActive: true,
  displayOrder: true,
});

export const insertResellerCustomerOrderSchema = createInsertSchema(resellerCustomerOrders).pick({
  resellerId: true,
  customerId: true,
  orderNumber: true,
  customerEmail: true,
  customerName: true,
  shippingAddress: true,
  billingAddress: true,
  phoneNumber: true,
  status: true,
  subtotal: true,
  shippingCost: true,
  taxAmount: true,
  totalAmount: true,
  platformCommission: true,
  resellerEarnings: true,
  stripePaymentIntentId: true,
  trackingNumber: true,
  notes: true,
});

export const insertResellerCustomerOrderItemSchema = createInsertSchema(resellerCustomerOrderItems).pick({
  orderId: true,
  productId: true,
  productName: true,
  productSku: true,
  size: true,
  color: true,
  quantity: true,
  unitPrice: true,
  totalPrice: true,
  costPrice: true,
  imageUrl: true,
});

export const insertCommissionRuleSchema = createInsertSchema(commissionRules).pick({
  name: true,
  description: true,
  commissionType: true,
  commissionValue: true,
  productId: true,
  categoryName: true,
  resellerId: true,
  minOrderAmount: true,
  isActive: true,
  priority: true,
});

export const insertCommissionPaymentSchema = createInsertSchema(commissionPayments).pick({
  resellerId: true,
  orderId: true,
  amount: true,
  status: true,
  paymentMethod: true,
  stripeTransferId: true,
  notes: true,
});

export const insertPayoutRequestSchema = createInsertSchema(payoutRequests).pick({
  resellerId: true,
  vendorId: true,
  recipientType: true,
  requestType: true,
  requestNumber: true,
  amount: true,
  status: true,
  payoutMethod: true,
  bankAccountName: true,
  bankAccountNumber: true,
  bankSortCode: true,
  paypalEmail: true,
  stripeAccountId: true,
  resellerNotes: true,
  initiatedByAdminId: true,
  payoutReason: true,
  isAdjustment: true,
});

// Type exports for multi-tenant storefront
export type InsertResellerStorefront = z.infer<typeof insertResellerStorefrontSchema>;
export type ResellerStorefront = typeof resellerStorefronts.$inferSelect;

export type InsertResellerProduct = z.infer<typeof insertResellerProductSchema>;
export type ResellerProduct = typeof resellerProducts.$inferSelect;

export const insertVendorPartnerProductSchema = createInsertSchema(vendorPartnerProducts).pick({
  vendorId: true,
  productId: true,
  isActive: true,
  displayOrder: true,
});
export type InsertVendorPartnerProduct = z.infer<typeof insertVendorPartnerProductSchema>;
export type VendorPartnerProduct = typeof vendorPartnerProducts.$inferSelect;

export type InsertResellerCustomerOrder = z.infer<typeof insertResellerCustomerOrderSchema>;
export type ResellerCustomerOrder = typeof resellerCustomerOrders.$inferSelect;

export type InsertResellerCustomerOrderItem = z.infer<typeof insertResellerCustomerOrderItemSchema>;
export type ResellerCustomerOrderItem = typeof resellerCustomerOrderItems.$inferSelect;

export type InsertCommissionRule = z.infer<typeof insertCommissionRuleSchema>;
export type CommissionRule = typeof commissionRules.$inferSelect;

export type InsertCommissionPayment = z.infer<typeof insertCommissionPaymentSchema>;
export type CommissionPayment = typeof commissionPayments.$inferSelect;

export type InsertPayoutRequest = z.infer<typeof insertPayoutRequestSchema>;
export type PayoutRequest = typeof payoutRequests.$inferSelect;

export const insertPayoutAuditLogSchema = createInsertSchema(payoutAuditLogs).pick({
  payoutId: true,
  action: true,
  previousStatus: true,
  newStatus: true,
  performedBy: true,
  performedByName: true,
  performedByRole: true,
  notes: true,
  metadata: true,
  ipAddress: true,
  userAgent: true,
});
export type InsertPayoutAuditLog = z.infer<typeof insertPayoutAuditLogSchema>;
export type PayoutAuditLog = typeof payoutAuditLogs.$inferSelect;

export const insertPartnerCommissionOverrideSchema = createInsertSchema(partnerCommissionOverrides).pick({
  partnerType: true,
  resellerId: true,
  vendorId: true,
  productId: true,
  commissionRate: true,
  storefrontPrice: true,
  notes: true,
  isActive: true,
});
export type InsertPartnerCommissionOverride = z.infer<typeof insertPartnerCommissionOverrideSchema>;
export type PartnerCommissionOverride = typeof partnerCommissionOverrides.$inferSelect;

// Announcement banner table (for admin-controlled promotional banners)
export const announcementBanner = pgTable("announcement_banner", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  message: text("message").notNull(),
  isVisible: boolean("is_visible").notNull().default(false),
  backgroundColor: text("background_color").default("#2563eb"),
  textColor: text("text_color").default("#ffffff"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertAnnouncementBannerSchema = createInsertSchema(announcementBanner).pick({
  message: true,
  isVisible: true,
  backgroundColor: true,
  textColor: true,
});

export type InsertAnnouncementBanner = z.infer<typeof insertAnnouncementBannerSchema>;
export type AnnouncementBanner = typeof announcementBanner.$inferSelect;

// Section Analytics table (for tracking homepage section popularity)
export const sectionAnalytics = pgTable("section_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionName: text("section_name").notNull().unique(),
  viewCount: integer("view_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  lastResetDate: timestamp("last_reset_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSectionAnalyticsSchema = createInsertSchema(sectionAnalytics).pick({
  sectionName: true,
  viewCount: true,
  clickCount: true,
});

export type InsertSectionAnalytics = z.infer<typeof insertSectionAnalyticsSchema>;
export type SectionAnalytics = typeof sectionAnalytics.$inferSelect;

// Chatbot Knowledge Base table (for admin-managed Q&A content)
export const chatbotKnowledge = pgTable("chatbot_knowledge", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull().default("general"),
  tags: text("tags").array().default([]),
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

// Chatbot Conversations table (tracks customer chat sessions)
export const chatbotConversations = pgTable("chatbot_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  isActive: boolean("is_active").notNull().default(true),
});

// Chatbot Messages table (stores all chat messages)
export const chatbotMessages = pgTable("chatbot_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatbotConversations.id, { onDelete: 'cascade' }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Chatbot Unanswered Queries table (tracks questions the bot couldn't answer)
export const chatbotUnansweredQueries = pgTable("chatbot_unanswered_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => chatbotConversations.id, { onDelete: 'set null' }),
  userEmail: text("user_email"),
  userName: text("user_name"),
  question: text("question").notNull(),
  contactFormData: text("contact_form_data"),
  status: text("status").notNull().default("pending"),
  emailSent: boolean("email_sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
});

// Cookie Consent table (stores user cookie preferences for UK GDPR/PECR compliance)
export const cookieConsent = pgTable("cookie_consent", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).unique(),
  sessionId: text("session_id"),
  necessary: boolean("necessary").notNull().default(true),
  analytics: boolean("analytics").notNull().default(false),
  marketing: boolean("marketing").notNull().default(false),
  functional: boolean("functional").notNull().default(false),
  consentGivenAt: timestamp("consent_given_at").defaultNow().notNull(),
  consentUpdatedAt: timestamp("consent_updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Insert schemas
export const insertChatbotKnowledgeSchema = createInsertSchema(chatbotKnowledge).pick({
  question: true,
  answer: true,
  category: true,
  tags: true,
  isActive: true,
  priority: true,
});

export const insertChatbotConversationSchema = createInsertSchema(chatbotConversations).omit({
  id: true,
  startedAt: true,
});

export const insertChatbotMessageSchema = createInsertSchema(chatbotMessages).pick({
  conversationId: true,
  role: true,
  content: true,
});

export const insertChatbotUnansweredQuerySchema = createInsertSchema(chatbotUnansweredQueries).pick({
  conversationId: true,
  userEmail: true,
  userName: true,
  question: true,
  contactFormData: true,
});

export const insertCookieConsentSchema = createInsertSchema(cookieConsent).omit({
  id: true,
  consentGivenAt: true,
  consentUpdatedAt: true,
});

// Type exports
export type InsertChatbotKnowledge = z.infer<typeof insertChatbotKnowledgeSchema>;
export type ChatbotKnowledge = typeof chatbotKnowledge.$inferSelect;

export type InsertChatbotConversation = z.infer<typeof insertChatbotConversationSchema>;
export type ChatbotConversation = typeof chatbotConversations.$inferSelect;

export type InsertChatbotMessage = z.infer<typeof insertChatbotMessageSchema>;
export type ChatbotMessage = typeof chatbotMessages.$inferSelect;

export type InsertChatbotUnansweredQuery = z.infer<typeof insertChatbotUnansweredQuerySchema>;
export type ChatbotUnansweredQuery = typeof chatbotUnansweredQueries.$inferSelect;

export type InsertCookieConsent = z.infer<typeof insertCookieConsentSchema>;
export type CookieConsent = typeof cookieConsent.$inferSelect;

// ============================================================================
// NEW FEATURES: Top 10 Must-Have Modern B2C/B2B Features
// ============================================================================

// Loyalty Program enums
export const loyaltyTierEnum = pgEnum("loyalty_tier", ["bronze", "silver", "gold", "platinum", "vip"]);
export const rewardTypeEnum = pgEnum("reward_type", ["percentage_discount", "fixed_discount", "free_shipping", "free_product", "early_access"]);

// Payment terms enum (for B2B net terms)
export const paymentTermsEnum = pgEnum("payment_terms", ["net_30", "net_60", "net_90", "net_120"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "viewed", "partial", "paid", "overdue", "cancelled"]);

// Quote status enum
export const quoteStatusEnum = pgEnum("quote_status", ["draft", "sent", "viewed", "accepted", "rejected", "expired", "converted"]);

// B2B user permission enum
export const b2bPermissionEnum = pgEnum("b2b_permission", ["view_only", "can_order", "can_approve", "admin"]);

// ============================================================================
// 1. LOYALTY PROGRAM TABLES (B2C Feature)
// ============================================================================

// Loyalty Points table - tracks customer points balance
export const loyaltyPoints = pgTable("loyalty_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  currentPoints: integer("current_points").notNull().default(0),
  lifetimePoints: integer("lifetime_points").notNull().default(0),
  tier: loyaltyTierEnum("tier").notNull().default("bronze"),
  tierStartDate: timestamp("tier_start_date").defaultNow().notNull(),
  nextTierPoints: integer("next_tier_points").notNull().default(500),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Loyalty Transactions table - audit trail of all points earned/spent
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  points: integer("points").notNull(), // Positive for earned, negative for spent
  type: text("type").notNull(), // 'earned', 'redeemed', 'expired', 'adjusted'
  description: text("description").notNull(),
  orderId: varchar("order_id").references(() => customerOrders.id, { onDelete: 'set null' }),
  referenceId: varchar("reference_id"), // Can link to redemption, order, etc.
  expiresAt: timestamp("expires_at"), // Points can expire
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Loyalty Rewards table - admin-defined rewards catalog
export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pointsCost: integer("points_cost").notNull(),
  rewardType: rewardTypeEnum("reward_type").notNull(),
  rewardValue: decimal("reward_value", { precision: 10, scale: 2 }).notNull(), // Discount amount or product ID
  minTier: loyaltyTierEnum("min_tier").notNull().default("bronze"),
  isActive: boolean("is_active").notNull().default(true),
  expiryDays: integer("expiry_days").default(30), // How long after redemption
  usageLimit: integer("usage_limit"), // Max redemptions per customer (null = unlimited)
  totalAvailable: integer("total_available"), // Total inventory (null = unlimited)
  totalRedeemed: integer("total_redeemed").notNull().default(0),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Loyalty Redemptions table - tracks when customers redeem rewards
export const loyaltyRedemptions = pgTable("loyalty_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  rewardId: varchar("reward_id").notNull().references(() => loyaltyRewards.id),
  pointsSpent: integer("points_spent").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'used', 'expired', 'cancelled'
  couponCode: text("coupon_code").unique(), // Generated code for discount redemptions
  orderId: varchar("order_id").references(() => customerOrders.id, { onDelete: 'set null' }), // When used
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),
});

// ============================================================================
// 2. SAVED PAYMENT METHODS (B2C Feature)
// ============================================================================

// Saved Payment Methods table - tokenized cards via Stripe
export const savedPaymentMethods = pgTable("saved_payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripePaymentMethodId: text("stripe_payment_method_id").notNull().unique(), // Stripe PM ID
  stripeCustomerId: text("stripe_customer_id").notNull(), // Stripe Customer ID
  cardBrand: text("card_brand").notNull(), // visa, mastercard, amex, etc.
  cardLast4: text("card_last4").notNull(), // Last 4 digits
  cardExpMonth: integer("card_exp_month").notNull(),
  cardExpYear: integer("card_exp_year").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  billingName: text("billing_name"),
  billingPostalCode: text("billing_postal_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// 3. STOCK ALERTS (B2C Feature)
// ============================================================================

// Stock Alerts table - back-in-stock email notifications
export const stockAlertSubscriptions = pgTable("stock_alert_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: varchar("variant_id").references(() => productVariants.id, { onDelete: 'cascade' }), // Specific size/color
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }), // Logged-in users
  email: text("email").notNull(), // For guest subscriptions
  notified: boolean("notified").notNull().default(false),
  notifiedAt: timestamp("notified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// 4. ABANDONED CART TRACKING (B2C Feature)
// ============================================================================

// Abandoned Carts table - track carts for recovery emails
export const abandonedCarts = pgTable("abandoned_carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cartId: varchar("cart_id").notNull().references(() => carts.id, { onDelete: 'cascade' }).unique(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  email: text("email").notNull(),
  firstName: text("first_name"),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }).notNull(),
  itemCount: integer("item_count").notNull(),
  firstReminderSent: boolean("first_reminder_sent").notNull().default(false),
  firstReminderSentAt: timestamp("first_reminder_sent_at"),
  firstReminderSmsSent: boolean("first_reminder_sms_sent").notNull().default(false),
  firstReminderSmsSentAt: timestamp("first_reminder_sms_sent_at"),
  secondReminderSent: boolean("second_reminder_sent").notNull().default(false),
  secondReminderSentAt: timestamp("second_reminder_sent_at"),
  finalReminderSent: boolean("final_reminder_sent").notNull().default(false),
  finalReminderSentAt: timestamp("final_reminder_sent_at"),
  recovered: boolean("recovered").notNull().default(false),
  recoveredAt: timestamp("recovered_at"),
  recoveryOrderId: varchar("recovery_order_id").references(() => customerOrders.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// 5. B2B NET TERMS / INVOICING (B2B Feature)
// ============================================================================

// B2B Invoices table - for net terms payment
export const b2bInvoices = pgTable("b2b_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id, { onDelete: 'cascade' }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: 'set null' }), // B2B order
  status: invoiceStatusEnum("status").notNull().default("draft"),
  paymentTerms: paymentTermsEnum("payment_terms").notNull().default("net_30"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull().default("0.00"),
  amountDue: decimal("amount_due", { precision: 10, scale: 2 }).notNull(),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// B2B Invoice Payments table - track partial payments
export const b2bInvoicePayments = pgTable("b2b_invoice_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => b2bInvoices.id, { onDelete: 'cascade' }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // 'bank_transfer', 'card', 'check', 'credit_note'
  referenceNumber: text("reference_number"), // Bank ref, check number, etc.
  notes: text("notes"),
  processedBy: varchar("processed_by").references(() => users.id), // Admin who recorded it
  paidAt: timestamp("paid_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// 6. RFQ / QUOTE SYSTEM (B2B Feature)
// ============================================================================

// B2B Quotes table - request for quote system
export const b2bQuotes = pgTable("b2b_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteNumber: text("quote_number").notNull().unique(),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id, { onDelete: 'cascade' }),
  status: quoteStatusEnum("status").notNull().default("draft"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  validUntil: timestamp("valid_until").notNull(),
  notes: text("notes"),
  internalNotes: text("internal_notes"), // Admin only
  createdBy: varchar("created_by").notNull().references(() => users.id), // Admin who created
  acceptedBy: varchar("accepted_by").references(() => users.id), // Reseller user who accepted
  convertedOrderId: varchar("converted_order_id").references(() => orders.id), // If converted to order
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  acceptedAt: timestamp("accepted_at"),
  rejectedAt: timestamp("rejected_at"),
});

// B2B Quote Items table
export const b2bQuoteItems = pgTable("b2b_quote_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id").notNull().references(() => b2bQuotes.id, { onDelete: 'cascade' }),
  productId: varchar("product_id").notNull().references(() => products.id),
  variantId: varchar("variant_id").references(() => productVariants.id),
  productName: text("product_name").notNull(),
  size: text("size"),
  color: text("color"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 8, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// 7. MULTI-USER B2B ACCOUNTS (B2B Feature)
// ============================================================================

// B2B Account Users table - multiple users per reseller account
export const b2bAccountUsers = pgTable("b2b_account_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  permission: b2bPermissionEnum("permission").notNull().default("view_only"),
  isActive: boolean("is_active").notNull().default(true),
  jobTitle: text("job_title"),
  department: text("department"),
  canApproveUpTo: decimal("can_approve_up_to", { precision: 10, scale: 2 }), // Spending limit
  createdBy: varchar("created_by").notNull().references(() => users.id), // Who added them
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

// B2B Order Approvals table - approval workflow for large orders
export const b2bOrderApprovals = pgTable("b2b_order_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id),
  requestedBy: varchar("requested_by").notNull().references(() => users.id), // User who created order
  approvedBy: varchar("approved_by").references(() => users.id), // User who approved
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  orderTotal: decimal("order_total", { precision: 10, scale: 2 }).notNull(),
  requiredApprovalReason: text("required_approval_reason"), // Why approval needed
  approvalNotes: text("approval_notes"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
});

// ============================================================================
// 8. INVENTORY MANAGEMENT SYSTEM
// ============================================================================

// Inventory transaction type enum
export const inventoryTransactionTypeEnum = pgEnum("inventory_transaction_type", [
  "incoming",      // Stock received
  "outgoing",      // Stock sold/shipped
  "adjustment",    // Manual correction
  "return",        // Customer return
  "damage",        // Damaged goods
  "transfer"       // Transfer between locations
]);

// Inventory Transactions table - tracks all stock movements
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  variantId: varchar("variant_id").notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  type: inventoryTransactionTypeEnum("type").notNull(),
  quantity: integer("quantity").notNull(), // Positive for incoming, negative for outgoing
  batchNumber: text("batch_number"), // Batch/lot number for tracking
  supplier: text("supplier"), // Supplier name
  location: text("location").notNull().default("Main Warehouse"), // Storage location
  costPerUnit: decimal("cost_per_unit", { precision: 8, scale: 2 }), // Cost price for this batch
  notes: text("notes"),
  scannedBarcode: text("scanned_barcode"), // Barcode/SKU scanned
  performedBy: varchar("performed_by").references(() => users.id), // Admin who performed action
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inventory Batches table - groups transactions for incoming shipments
export const inventoryBatches = pgTable("inventory_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchNumber: text("batch_number").notNull().unique(),
  supplier: text("supplier").notNull(),
  receivedDate: timestamp("received_date").notNull(),
  totalItems: integer("total_items").notNull().default(0),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull().default("0.00"),
  status: text("status").notNull().default("received"), // 'pending', 'received', 'verified', 'completed'
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// 9. B2B ACCESS MANAGEMENT SYSTEM
// ============================================================================

// Partner type enum - distinguishes resellers from vendors
export const b2bPartnerTypeEnum = pgEnum("b2b_partner_type", ["reseller", "vendor"]);

// Partner capability enum - what actions partners can perform
export const b2bCapabilityEnum = pgEnum("b2b_capability", [
  "sell_1strep_products",    // Can sell 1stRep products
  "add_own_products",        // Can add their own products (resellers/vendors with license)
  "request_stock",           // Can request stock from 1stRep
  "manage_storefront",       // Can manage their storefront
  "view_analytics",          // Can view sales analytics
  "process_epos",            // Can use EPOS system
  "sell_wholesale"           // Can sell on wholesale (vendors)
]);

// Screen target type enum - where admin content can appear
export const b2bScreenTargetEnum = pgEnum("b2b_screen_target", [
  "dashboard",               // Main B2B dashboard
  "storefront",              // Reseller/vendor storefront
  "epos",                    // EPOS pages
  "product_catalog",         // Product browsing pages
  "checkout"                 // Checkout flow
]);

// Ad run mode enum - how ads are targeted
export const b2bAdRunModeEnum = pgEnum("b2b_ad_run_mode", [
  "all_partners",            // All B2B partners
  "all_resellers",           // All resellers only
  "all_vendors",             // All vendors only
  "specific_partners"        // Specific selected partners
]);

// B2B Partner Capabilities table - tracks what each partner can do
export const b2bPartnerCapabilities = pgTable("b2b_partner_capabilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerType: b2bPartnerTypeEnum("partner_type").notNull(),
  partnerId: varchar("partner_id").notNull(), // References reseller or vendor id
  capability: b2bCapabilityEnum("capability").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  grantedBy: varchar("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Optional expiration
  notes: text("notes"),
});

// Stock Requests table - when partners request stock from 1stRep
export const b2bStockRequests = pgTable("b2b_stock_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerType: b2bPartnerTypeEnum("partner_type").notNull(),
  partnerId: varchar("partner_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, fulfilled
  requestedProducts: text("requested_products").notNull(), // JSON array of product requests
  totalItems: integer("total_items").notNull().default(0),
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }),
  adminNotes: text("admin_notes"),
  partnerNotes: text("partner_notes"),
  requestedBy: varchar("requested_by").references(() => users.id),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// B2B Screen Regions table - defines controllable screen areas
export const b2bScreenRegions = pgTable("b2b_screen_regions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  targetType: b2bScreenTargetEnum("target_type").notNull(),
  routeScope: text("route_scope"), // Specific route pattern like /reseller/dashboard
  description: text("description"),
  maxContentSlots: integer("max_content_slots").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// B2B Screen Overrides table - admin content overrides for partner screens
export const b2bScreenOverrides = pgTable("b2b_screen_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  screenRegionId: varchar("screen_region_id").notNull().references(() => b2bScreenRegions.id, { onDelete: 'cascade' }),
  partnerType: b2bPartnerTypeEnum("partner_type"), // null = applies to all
  partnerId: varchar("partner_id"), // null = applies to all of type
  contentSlot: text("content_slot").notNull(), // JSON content to display
  priority: integer("priority").notNull().default(0), // Higher priority wins
  effectiveAt: timestamp("effective_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // null = no expiration
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// B2B Ad Campaigns table - admin ads for partner screens
export const b2bAdCampaigns = pgTable("b2b_ad_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  adContent: text("ad_content").notNull(), // JSON with title, image, link, etc.
  adType: text("ad_type").notNull().default("banner"), // banner, popup, inline
  displayLocation: text("display_location").notNull().default("both"), // website, epos, both
  status: text("status").notNull().default("draft"), // draft, active, paused, completed
  defaultDuration: integer("default_duration").default(30), // Days
  impressionCount: integer("impression_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// B2B Ad Campaign Assignments table - targets campaigns to partners/screens
export const b2bAdCampaignAssignments = pgTable("b2b_ad_campaign_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => b2bAdCampaigns.id, { onDelete: 'cascade' }),
  screenRegionId: varchar("screen_region_id").references(() => b2bScreenRegions.id, { onDelete: 'cascade' }),
  runMode: b2bAdRunModeEnum("run_mode").notNull().default("all_partners"),
  specificPartnerIds: text("specific_partner_ids"), // JSON array of partner ids when runMode = specific_partners
  partnerType: b2bPartnerTypeEnum("partner_type"), // Filter by type when runMode = all_resellers or all_vendors
  startAt: timestamp("start_at").defaultNow().notNull(),
  endAt: timestamp("end_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// B2B Partner Coupons table - admin-created coupons for partner storefronts
export const b2bPartnerCoupons = pgTable("b2b_partner_coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  partnerType: b2bPartnerTypeEnum("partner_type").notNull(),
  partnerId: varchar("partner_id").notNull(),
  discountType: text("discount_type").notNull().default("percentage"), // percentage, fixed_amount
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  startsAt: timestamp("starts_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// 10. LICENSE REQUEST SYSTEM
// ============================================================================

// License request status enum
export const licenseRequestStatusEnum = pgEnum("license_request_status", [
  "pending_review",      // Initial submission - awaiting admin review
  "awaiting_payment",    // Approved by admin - waiting for payment
  "payment_failed",      // Payment attempt failed
  "approved",            // Paid and fully approved
  "rejected",            // Rejected by admin
  "revoked"              // License was revoked after approval
]);

// License payment status enum
export const licensePaymentStatusEnum = pgEnum("license_payment_status", [
  "unpaid",              // No payment attempted
  "pending",             // Payment is processing
  "paid",                // Payment successful
  "refunded"             // Payment was refunded
]);

// License type enum
export const licenseTypeEnum = pgEnum("license_type", [
  "additional_reseller_products",  // Reseller can add their own products
  "vendor_wholesale_access"        // Vendor can sell on wholesale
]);

// License Settings table - admin configures fees
export const licenseSettings = pgTable("license_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseType: licenseTypeEnum("license_type").notNull().unique(),
  feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  currency: varchar("currency", { length: 3 }).notNull().default("GBP"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  requiresPayment: boolean("requires_payment").notNull().default(true),
  validityDays: integer("validity_days"), // null = permanent
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscription Tier Pricing - admin-configurable tier prices and product limits
export const subscriptionTierPricing = pgTable("subscription_tier_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tierName: varchar("tier_name", { length: 50 }).notNull().unique(), // trial, bronze, silver, gold
  displayName: varchar("display_name", { length: 100 }).notNull(),
  pricePerMonth: decimal("price_per_month", { precision: 10, scale: 2 }).notNull().default("0.00"),
  productLimit: integer("product_limit"), // null = unlimited
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// Reseller License Requests table - resellers request to add own products
export const resellerLicenseRequests = pgTable("reseller_license_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id),
  licenseType: licenseTypeEnum("license_type").notNull().default("additional_reseller_products"),
  status: licenseRequestStatusEnum("status").notNull().default("pending_review"),
  paymentStatus: licensePaymentStatusEnum("payment_status").notNull().default("unpaid"),
  
  // Request details
  justification: text("justification").notNull(), // Why they need the license
  expectedSkuCount: integer("expected_sku_count"), // How many products they plan to add
  businessCategory: text("business_category"), // What type of products
  
  // Fee and payment
  feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  currency: varchar("currency", { length: 3 }).notNull().default("GBP"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripePaymentMethodId: text("stripe_payment_method_id"),
  paidAt: timestamp("paid_at"),
  
  // Admin review
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  
  // License validity
  approvedAt: timestamp("approved_at"),
  expiresAt: timestamp("expires_at"), // null = permanent
  revokedAt: timestamp("revoked_at"),
  revocationReason: text("revocation_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vendor Wholesale Requests table - vendors request wholesale access
export const vendorWholesaleRequests = pgTable("vendor_wholesale_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  status: licenseRequestStatusEnum("status").notNull().default("pending_review"),
  
  // Request details
  justification: text("justification").notNull(), // Why they want wholesale access
  targetMarkets: text("target_markets"), // Which markets they want to serve
  expectedVolume: text("expected_volume"), // Expected order volume
  
  // Admin review
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  
  approvedAt: timestamp("approved_at"),
  revokedAt: timestamp("revoked_at"),
  revocationReason: text("revocation_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// 11. RESELLER LICENCE TIER SYSTEM
// ============================================================================

// Reseller licence tier enum (Bronze, Silver, Gold)
export const resellerLicenceTierEnum = pgEnum("reseller_licence_tier", [
  "bronze",   // £55/month - max 10 products
  "silver",   // £85/month - max 20 products
  "gold"      // £110/month - unlimited products
]);

// Reseller licence status enum
export const resellerLicenceStatusEnum = pgEnum("reseller_licence_status", [
  "pending_trial",  // Requested trial - awaiting admin approval
  "trial",          // 7-day free trial - unlimited access (approved by admin)
  "active",         // Paid and active licence
  "expired",        // Trial or subscription expired
  "cancelled"       // User cancelled their licence
]);

// Reseller Licences table - tracks tier-based subscriptions
export const resellerLicences = pgTable("reseller_licences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id),
  
  // Licence details
  tier: resellerLicenceTierEnum("tier"), // null during trial
  status: resellerLicenceStatusEnum("status").notNull().default("pending_trial"),
  productLimit: integer("product_limit"), // null = unlimited (trial or gold tier)
  
  // Trial request details
  trialRequestedAt: timestamp("trial_requested_at"),
  trialApprovedAt: timestamp("trial_approved_at"),
  trialApprovedBy: varchar("trial_approved_by").references(() => users.id),
  
  // Trial period (7 days free - starts when admin approves)
  trialStartedAt: timestamp("trial_started_at"),
  trialEndsAt: timestamp("trial_ends_at"), // trialStartedAt + 7 days
  
  // Subscription details
  activatedAt: timestamp("activated_at"), // When paid subscription started
  expiresAt: timestamp("expires_at"), // When current billing period ends
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  
  // Stripe subscription
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripePriceId: text("stripe_price_id"),
  
  // Pricing snapshot
  priceAmount: decimal("price_amount", { precision: 10, scale: 2 }), // e.g., 55.00, 85.00, 110.00
  currency: varchar("currency", { length: 3 }).default("GBP"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// INSERT SCHEMAS AND TYPE EXPORTS
// ============================================================================

// Reseller Licence schemas
export const insertResellerLicenceSchema = createInsertSchema(resellerLicences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Reseller Licence type exports
export type ResellerLicence = typeof resellerLicences.$inferSelect;
export type InsertResellerLicence = z.infer<typeof insertResellerLicenceSchema>;

// License System schemas
export const insertLicenseSettingsSchema = createInsertSchema(licenseSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResellerLicenseRequestSchema = createInsertSchema(resellerLicenseRequests).omit({
  id: true,
  status: true,
  paymentStatus: true,
  reviewedBy: true,
  reviewedAt: true,
  approvedAt: true,
  paidAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorWholesaleRequestSchema = createInsertSchema(vendorWholesaleRequests).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  approvedAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
});

// License System type exports
export type LicenseSettings = typeof licenseSettings.$inferSelect;
export type InsertLicenseSettings = z.infer<typeof insertLicenseSettingsSchema>;


export const insertSubscriptionTierPricingSchema = createInsertSchema(subscriptionTierPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type SubscriptionTierPricing = typeof subscriptionTierPricing.$inferSelect;
export type InsertSubscriptionTierPricing = z.infer<typeof insertSubscriptionTierPricingSchema>;

export type ResellerLicenseRequest = typeof resellerLicenseRequests.$inferSelect;
export type InsertResellerLicenseRequest = z.infer<typeof insertResellerLicenseRequestSchema>;

export type VendorWholesaleRequest = typeof vendorWholesaleRequests.$inferSelect;
export type InsertVendorWholesaleRequest = z.infer<typeof insertVendorWholesaleRequestSchema>;

// ============================================================================
// WHOLESALER ORDERS SYSTEM
// ============================================================================

// Wholesaler order status enum
export const wholesalerOrderStatusEnum = pgEnum("wholesaler_order_status", [
  "pending",       // Order submitted, awaiting admin review
  "approved",      // Admin approved, awaiting payment
  "paid",          // Payment received
  "processing",    // Order being prepared
  "shipped",       // Order shipped
  "delivered",     // Order delivered
  "rejected",      // Admin rejected the order
  "cancelled"      // Order cancelled
]);

// Wholesaler Orders table - vendors purchasing 1stRep products at wholesale
export const wholesalerOrders = pgTable("wholesaler_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(), // WO-0001 format
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  
  // Order details
  status: wholesalerOrderStatusEnum("status").notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("GBP"),
  notes: text("notes"), // Customer notes with order
  
  // Shipping details
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city").notNull(),
  shippingPostcode: text("shipping_postcode").notNull(),
  shippingCountry: text("shipping_country").notNull().default("United Kingdom"),
  contactPhone: text("contact_phone"),
  
  // Payment details
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripePaymentStatus: text("stripe_payment_status"),
  paidAt: timestamp("paid_at"),
  
  // Admin review
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  
  // Fulfilment
  shippedAt: timestamp("shipped_at"),
  trackingNumber: text("tracking_number"),
  trackingCarrier: text("tracking_carrier"),
  deliveredAt: timestamp("delivered_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wholesaler Order Items table - line items for each order
export const wholesalerOrderItems = pgTable("wholesaler_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => wholesalerOrders.id, { onDelete: 'cascade' }),
  productId: varchar("product_id").notNull().references(() => products.id),
  variantId: varchar("variant_id").references(() => productVariants.id),
  
  // Product snapshot
  productName: text("product_name").notNull(),
  productSku: text("product_sku").notNull(),
  variantSize: text("variant_size"),
  variantColor: text("variant_color"),
  
  // Pricing
  wholesalePrice: decimal("wholesale_price", { precision: 8, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Wholesaler Orders insert schemas
export const insertWholesalerOrderSchema = createInsertSchema(wholesalerOrders).omit({
  id: true,
  reviewedBy: true,
  reviewedAt: true,
  shippedAt: true,
  deliveredAt: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWholesalerOrderItemSchema = createInsertSchema(wholesalerOrderItems).omit({
  id: true,
  createdAt: true,
});

// Wholesaler Orders type exports
export type WholesalerOrder = typeof wholesalerOrders.$inferSelect;
export type InsertWholesalerOrder = z.infer<typeof insertWholesalerOrderSchema>;
export type WholesalerOrderItem = typeof wholesalerOrderItems.$inferSelect;
export type InsertWholesalerOrderItem = z.infer<typeof insertWholesalerOrderItemSchema>;

// Wholesaler Messages table - communication between wholesalers and admin
export const wholesalerMessages = pgTable("wholesaler_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  messageType: messageTypeEnum("message_type").notNull().default("general"),
  subject: text("subject"),
  content: text("content").notNull(),
  orderId: varchar("order_id").references(() => wholesalerOrders.id),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWholesalerMessageSchema = createInsertSchema(wholesalerMessages).omit({
  id: true,
  isRead: true,
  readAt: true,
  createdAt: true,
});

export type WholesalerMessage = typeof wholesalerMessages.$inferSelect;
export type InsertWholesalerMessage = z.infer<typeof insertWholesalerMessageSchema>;

// B2B Access Management schemas
export const insertB2bPartnerCapabilitySchema = createInsertSchema(b2bPartnerCapabilities).omit({
  id: true,
  grantedAt: true,
});

export const insertB2bStockRequestSchema = createInsertSchema(b2bStockRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processedAt: true,
});

export const insertB2bScreenRegionSchema = createInsertSchema(b2bScreenRegions).omit({
  id: true,
  createdAt: true,
});

export const insertB2bScreenOverrideSchema = createInsertSchema(b2bScreenOverrides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertB2bAdCampaignSchema = createInsertSchema(b2bAdCampaigns).omit({
  id: true,
  impressionCount: true,
  clickCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertB2bAdCampaignAssignmentSchema = createInsertSchema(b2bAdCampaignAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertB2bPartnerCouponSchema = createInsertSchema(b2bPartnerCoupons).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

// B2B Access Management type exports
export type B2bPartnerCapability = typeof b2bPartnerCapabilities.$inferSelect;
export type InsertB2bPartnerCapability = z.infer<typeof insertB2bPartnerCapabilitySchema>;

export type B2bStockRequest = typeof b2bStockRequests.$inferSelect;
export type InsertB2bStockRequest = z.infer<typeof insertB2bStockRequestSchema>;

export type B2bScreenRegion = typeof b2bScreenRegions.$inferSelect;
export type InsertB2bScreenRegion = z.infer<typeof insertB2bScreenRegionSchema>;

export type B2bScreenOverride = typeof b2bScreenOverrides.$inferSelect;
export type InsertB2bScreenOverride = z.infer<typeof insertB2bScreenOverrideSchema>;

export type B2bAdCampaign = typeof b2bAdCampaigns.$inferSelect;
export type InsertB2bAdCampaign = z.infer<typeof insertB2bAdCampaignSchema>;

export type B2bAdCampaignAssignment = typeof b2bAdCampaignAssignments.$inferSelect;
export type InsertB2bAdCampaignAssignment = z.infer<typeof insertB2bAdCampaignAssignmentSchema>;

export type B2bPartnerCoupon = typeof b2bPartnerCoupons.$inferSelect;
export type InsertB2bPartnerCoupon = z.infer<typeof insertB2bPartnerCouponSchema>;

// Loyalty Program schemas
export const insertLoyaltyPointsSchema = createInsertSchema(loyaltyPoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertLoyaltyRewardSchema = createInsertSchema(loyaltyRewards).omit({
  id: true,
  totalRedeemed: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoyaltyRedemptionSchema = createInsertSchema(loyaltyRedemptions).omit({
  id: true,
  redeemedAt: true,
  usedAt: true,
});

// Saved Payment Methods schemas
export const insertSavedPaymentMethodSchema = createInsertSchema(savedPaymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Stock Alerts schemas
export const insertStockAlertSubscriptionSchema = createInsertSchema(stockAlertSubscriptions).omit({
  id: true,
  notified: true,
  notifiedAt: true,
  createdAt: true,
});

// Abandoned Carts schemas
export const insertAbandonedCartSchema = createInsertSchema(abandonedCarts).omit({
  id: true,
  firstReminderSent: true,
  firstReminderSentAt: true,
  secondReminderSent: true,
  secondReminderSentAt: true,
  finalReminderSent: true,
  finalReminderSentAt: true,
  recovered: true,
  recoveredAt: true,
  createdAt: true,
  updatedAt: true,
});

// B2B Invoices schemas
export const insertB2bInvoiceSchema = createInsertSchema(b2bInvoices).omit({
  id: true,
  amountPaid: true,
  amountDue: true,
  createdAt: true,
  updatedAt: true,
});

export const insertB2bInvoicePaymentSchema = createInsertSchema(b2bInvoicePayments).omit({
  id: true,
  paidAt: true,
  createdAt: true,
});

// B2B Quotes schemas
export const insertB2bQuoteSchema = createInsertSchema(b2bQuotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
  viewedAt: true,
  acceptedAt: true,
  rejectedAt: true,
});

export const insertB2bQuoteItemSchema = createInsertSchema(b2bQuoteItems).omit({
  id: true,
  createdAt: true,
});

// B2B Multi-User schemas
export const insertB2bAccountUserSchema = createInsertSchema(b2bAccountUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const insertB2bOrderApprovalSchema = createInsertSchema(b2bOrderApprovals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  rejectedAt: true,
});

// Type exports
export type LoyaltyPoints = typeof loyaltyPoints.$inferSelect;
export type InsertLoyaltyPoints = z.infer<typeof insertLoyaltyPointsSchema>;

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;

export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type InsertLoyaltyReward = z.infer<typeof insertLoyaltyRewardSchema>;

export type LoyaltyRedemption = typeof loyaltyRedemptions.$inferSelect;
export type InsertLoyaltyRedemption = z.infer<typeof insertLoyaltyRedemptionSchema>;

export type SavedPaymentMethod = typeof savedPaymentMethods.$inferSelect;
export type InsertSavedPaymentMethod = z.infer<typeof insertSavedPaymentMethodSchema>;

export type StockAlertSubscription = typeof stockAlertSubscriptions.$inferSelect;
export type InsertStockAlertSubscription = z.infer<typeof insertStockAlertSubscriptionSchema>;

export type AbandonedCart = typeof abandonedCarts.$inferSelect;
export type InsertAbandonedCart = z.infer<typeof insertAbandonedCartSchema>;

export type B2bInvoice = typeof b2bInvoices.$inferSelect;
export type InsertB2bInvoice = z.infer<typeof insertB2bInvoiceSchema>;

export type B2bInvoicePayment = typeof b2bInvoicePayments.$inferSelect;
export type InsertB2bInvoicePayment = z.infer<typeof insertB2bInvoicePaymentSchema>;

export type B2bQuote = typeof b2bQuotes.$inferSelect;
export type InsertB2bQuote = z.infer<typeof insertB2bQuoteSchema>;

export type B2bQuoteItem = typeof b2bQuoteItems.$inferSelect;
export type InsertB2bQuoteItem = z.infer<typeof insertB2bQuoteItemSchema>;

export type B2bAccountUser = typeof b2bAccountUsers.$inferSelect;
export type InsertB2bAccountUser = z.infer<typeof insertB2bAccountUserSchema>;

export type B2bOrderApproval = typeof b2bOrderApprovals.$inferSelect;
export type InsertB2bOrderApproval = z.infer<typeof insertB2bOrderApprovalSchema>;

// Inventory Management schemas
export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertInventoryBatchSchema = createInsertSchema(inventoryBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;

export type InventoryBatch = typeof inventoryBatches.$inferSelect;
export type InsertInventoryBatch = z.infer<typeof insertInventoryBatchSchema>;

// Admin team members schemas and types
export const insertAdminTeamMemberSchema = createInsertSchema(adminTeamMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export type AdminTeamMember = typeof adminTeamMembers.$inferSelect;
export type InsertAdminTeamMember = z.infer<typeof insertAdminTeamMemberSchema>;

// ============================================================================
// MODERN CRM & MARKETING SYSTEM
// ============================================================================

// VIP Tier Benefits - defines what each loyalty tier receives
export const loyaltyTierBenefits = pgTable("loyalty_tier_benefits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tier: loyaltyTierEnum("tier").notNull().unique(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull().default("0"),
  freeShippingThreshold: decimal("free_shipping_threshold", { precision: 10, scale: 2 }), // null = no free shipping
  freeShippingUnlimited: boolean("free_shipping_unlimited").notNull().default(false),
  pointsMultiplier: decimal("points_multiplier", { precision: 3, scale: 2 }).notNull().default("1.00"), // e.g., 1.5x points
  earlyAccessDays: integer("early_access_days").notNull().default(0), // days before general release
  exclusiveProducts: boolean("exclusive_products").notNull().default(false),
  prioritySupport: boolean("priority_support").notNull().default(false),
  birthdayBonus: integer("birthday_bonus").notNull().default(0), // bonus points on birthday
  referralBonus: integer("referral_bonus").notNull().default(0), // bonus points for referrals
  quarterlyReward: decimal("quarterly_reward", { precision: 10, scale: 2 }), // gift card value
  customBenefits: text("custom_benefits"), // JSON array of additional perks
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Email Campaign Status enum
export const campaignStatusEnum = pgEnum("campaign_status", ["draft", "scheduled", "sending", "sent", "paused", "cancelled"]);
export const automationTriggerEnum = pgEnum("automation_trigger", ["welcome", "abandoned_cart", "post_purchase", "win_back", "birthday", "tier_upgrade", "back_in_stock", "custom"]);

// Email Templates - reusable email templates
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  previewText: text("preview_text"),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  category: text("category").notNull().default("general"), // general, promotional, transactional, automation
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Email Campaigns - marketing campaigns
export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  previewText: text("preview_text"),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  templateId: varchar("template_id").references(() => emailTemplates.id, { onDelete: 'set null' }),
  status: campaignStatusEnum("status").notNull().default("draft"),
  segmentId: varchar("segment_id").references(() => customerSegments.id, { onDelete: 'set null' }),
  segmentCriteria: text("segment_criteria"), // JSON criteria for ad-hoc segments
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  totalRecipients: integer("total_recipients").notNull().default(0),
  totalSent: integer("total_sent").notNull().default(0),
  totalDelivered: integer("total_delivered").notNull().default(0),
  totalOpens: integer("total_opens").notNull().default(0),
  uniqueOpens: integer("unique_opens").notNull().default(0),
  totalClicks: integer("total_clicks").notNull().default(0),
  uniqueClicks: integer("unique_clicks").notNull().default(0),
  totalUnsubscribes: integer("total_unsubscribes").notNull().default(0),
  totalBounces: integer("total_bounces").notNull().default(0),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).notNull().default("0"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Email Campaign Sends - individual email sends
export const emailCampaignSends = pgTable("email_campaign_sends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => emailCampaigns.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, delivered, bounced, failed
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  bouncedAt: timestamp("bounced_at"),
  bounceReason: text("bounce_reason"),
  openCount: integer("open_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Marketing Automations - automated email workflows
export const marketingAutomations = pgTable("marketing_automations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  trigger: automationTriggerEnum("trigger").notNull(),
  triggerConfig: text("trigger_config"), // JSON config for trigger conditions
  isActive: boolean("is_active").notNull().default(false),
  totalTriggered: integer("total_triggered").notNull().default(0),
  totalCompleted: integer("total_completed").notNull().default(0),
  totalConversions: integer("total_conversions").notNull().default(0),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).notNull().default("0"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Automation Steps - individual steps in an automation workflow
export const automationSteps = pgTable("automation_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  automationId: varchar("automation_id").notNull().references(() => marketingAutomations.id, { onDelete: 'cascade' }),
  stepOrder: integer("step_order").notNull(),
  stepType: text("step_type").notNull(), // email, delay, condition, action
  templateId: varchar("template_id").references(() => emailTemplates.id, { onDelete: 'set null' }),
  subject: text("subject"),
  htmlContent: text("html_content"),
  delayMinutes: integer("delay_minutes"), // for delay steps
  conditionConfig: text("condition_config"), // JSON for condition steps
  actionConfig: text("action_config"), // JSON for action steps (e.g., add tag, update segment)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Automation Enrollments - customers enrolled in automations
export const automationEnrollments = pgTable("automation_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  automationId: varchar("automation_id").notNull().references(() => marketingAutomations.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  currentStepId: varchar("current_step_id").references(() => automationSteps.id, { onDelete: 'set null' }),
  status: text("status").notNull().default("active"), // active, completed, exited, paused
  nextActionAt: timestamp("next_action_at"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  exitedAt: timestamp("exited_at"),
  exitReason: text("exit_reason"),
});

// Email Unsubscribes - track unsubscribed users
export const emailUnsubscribes = pgTable("email_unsubscribes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  email: text("email").notNull(),
  reason: text("reason"),
  campaignId: varchar("campaign_id").references(() => emailCampaigns.id, { onDelete: 'set null' }),
  unsubscribedAt: timestamp("unsubscribed_at").defaultNow().notNull(),
});

// Newsletter Subscriptions - track newsletter subscribers
export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  source: text("source").notNull().default("footer"), // footer, popup, checkout, etc.
  isActive: boolean("is_active").notNull().default(true),
  confirmedAt: timestamp("confirmed_at"), // For double opt-in
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Community Events
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: text("event_type").notNull(), // Workout, Launch, Running, Online, etc.
  eventDate: timestamp("event_date").notNull(),
  startTime: text("start_time").notNull(), // e.g., "10:00 AM"
  endTime: text("end_time").notNull(), // e.g., "12:00 PM"
  location: text("location").notNull(),
  imageUrl: text("image_url"),
  spots: integer("spots"), // null = unlimited
  registeredCount: integer("registered_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Event Registrations
export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  status: text("status").notNull().default("registered"), // registered, attended, cancelled
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
});

// Athlete Programme Applications
export const athleteApplications = pgTable("athlete_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  sport: text("sport").notNull(),
  followerCount: text("follower_count"),
  instagram: text("instagram"),
  tiktok: text("tiktok"),
  youtube: text("youtube"),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Athlete Profiles - for approved athletes with active accounts
export const athleteTierEnum = pgEnum("athlete_tier", ["bronze", "silver", "gold", "elite"]);

export const athleteProfiles = pgTable("athlete_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  applicationId: varchar("application_id").references(() => athleteApplications.id),
  tier: athleteTierEnum("tier").notNull().default("bronze"),
  discountCode: text("discount_code").notNull().unique(),
  discountPercentage: integer("discount_percentage").notNull().default(50),
  sport: text("sport").notNull(),
  instagram: text("instagram"),
  tiktok: text("tiktok"),
  youtube: text("youtube"),
  bio: text("bio"),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  totalSalesGenerated: text("total_sales_generated").notNull().default("0"),
  totalOrdersGenerated: integer("total_orders_generated").notNull().default(0),
  creditBalance: decimal("credit_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  trackingLink: varchar("tracking_link", { length: 100 }).unique(),
  trackingLinkClicks: integer("tracking_link_clicks").notNull().default(0),
  welcomeCreditGranted: boolean("welcome_credit_granted").notNull().default(false),
  garmentDropEligible: boolean("garment_drop_eligible").notNull().default(false),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
});

export const influencerCreditTransactions = pgTable("influencer_credit_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteProfileId: varchar("athlete_profile_id").notNull().references(() => athleteProfiles.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 50 }).notNull(), // welcome, post_approved, referral_sale, manual_adjust, redemption
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  orderId: varchar("order_id"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const influencerDiscountVariants = pgTable("influencer_discount_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteProfileId: varchar("athlete_profile_id").notNull().references(() => athleteProfiles.id, { onDelete: 'cascade' }),
  codeSuffix: varchar("code_suffix", { length: 30 }).notNull(),
  fullCode: varchar("full_code", { length: 100 }).notNull().unique(),
  customerDiscountPct: integer("customer_discount_pct").notNull(),
  influencerCreditPct: integer("influencer_credit_pct").notNull().default(0),
  fixedCreditsPerOrder: integer("fixed_credits_per_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(false),
  useCount: integer("use_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const influencerRedemptions = pgTable("influencer_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteProfileId: varchar("athlete_profile_id").notNull().references(() => athleteProfiles.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 50 }).notNull(), // clothing_credit, gift_voucher, giveaway_code
  creditAmount: decimal("credit_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending"), // pending, approved, fulfilled
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  adminId: varchar("admin_id").references(() => users.id),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Athlete Content Submissions - for content/collab submissions
export const athleteContentSubmissions = pgTable("athlete_content_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteProfileId: varchar("athlete_profile_id").notNull().references(() => athleteProfiles.id, { onDelete: 'cascade' }),
  contentType: text("content_type").notNull(), // photo, video, story, reel
  platform: text("platform").notNull(), // instagram, tiktok, youtube
  contentUrl: text("content_url"),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, featured
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  notes: text("notes"),
  // Performance metrics (entered by admin after reviewing the post)
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  reach: integer("reach").notNull().default(0),
  metricsUpdatedAt: timestamp("metrics_updated_at"),
  metricsNotes: text("metrics_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAthleteProfileSchema = createInsertSchema(athleteProfiles).omit({
  id: true,
  totalSalesGenerated: true,
  totalOrdersGenerated: true,
  creditBalance: true,
  trackingLinkClicks: true,
  welcomeCreditGranted: true,
  garmentDropEligible: true,
  joinedAt: true,
  lastActiveAt: true,
});

export const insertAthleteContentSubmissionSchema = createInsertSchema(athleteContentSubmissions).omit({
  id: true,
  reviewedAt: true,
  reviewedBy: true,
  createdAt: true,
});

export const insertInfluencerCreditTransactionSchema = createInsertSchema(influencerCreditTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertInfluencerDiscountVariantSchema = createInsertSchema(influencerDiscountVariants).omit({
  id: true,
  useCount: true,
  createdAt: true,
});

export const insertInfluencerRedemptionSchema = createInsertSchema(influencerRedemptions).omit({
  id: true,
  status: true,
  adminNotes: true,
  adminId: true,
  processedAt: true,
  createdAt: true,
});

export type AthleteProfile = typeof athleteProfiles.$inferSelect;
export type InsertAthleteProfile = z.infer<typeof insertAthleteProfileSchema>;
export type AthleteContentSubmission = typeof athleteContentSubmissions.$inferSelect;
export type InsertAthleteContentSubmission = z.infer<typeof insertAthleteContentSubmissionSchema>;
export type InfluencerCreditTransaction = typeof influencerCreditTransactions.$inferSelect;
export type InsertInfluencerCreditTransaction = z.infer<typeof insertInfluencerCreditTransactionSchema>;
export type InfluencerDiscountVariant = typeof influencerDiscountVariants.$inferSelect;
export type InsertInfluencerDiscountVariant = z.infer<typeof insertInfluencerDiscountVariantSchema>;
export type InfluencerRedemption = typeof influencerRedemptions.$inferSelect;
export type InsertInfluencerRedemption = z.infer<typeof insertInfluencerRedemptionSchema>;

// Marketing Tags - for customer tagging
export const marketingTags = pgTable("marketing_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#3B82F6"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customer Tags - assign tags to customers
export const customerTags = pgTable("customer_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tagId: varchar("tag_id").notNull().references(() => marketingTags.id, { onDelete: 'cascade' }),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  addedBy: varchar("added_by").references(() => users.id, { onDelete: 'set null' }),
});

// CRM/Marketing Insert Schemas
export const insertLoyaltyTierBenefitsSchema = createInsertSchema(loyaltyTierBenefits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  totalRecipients: true,
  totalSent: true,
  totalDelivered: true,
  totalOpens: true,
  uniqueOpens: true,
  totalClicks: true,
  uniqueClicks: true,
  totalUnsubscribes: true,
  totalBounces: true,
  revenue: true,
  sentAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailCampaignSendSchema = createInsertSchema(emailCampaignSends).omit({
  id: true,
  openCount: true,
  clickCount: true,
  createdAt: true,
});

export const insertMarketingAutomationSchema = createInsertSchema(marketingAutomations).omit({
  id: true,
  totalTriggered: true,
  totalCompleted: true,
  totalConversions: true,
  revenue: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAutomationStepSchema = createInsertSchema(automationSteps).omit({
  id: true,
  createdAt: true,
});

export const insertAutomationEnrollmentSchema = createInsertSchema(automationEnrollments).omit({
  id: true,
  startedAt: true,
});

export const insertEmailUnsubscribeSchema = createInsertSchema(emailUnsubscribes).omit({
  id: true,
  unsubscribedAt: true,
});

export const insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
  unsubscribedAt: true,
});

export const insertMarketingTagSchema = createInsertSchema(marketingTags).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerTagSchema = createInsertSchema(customerTags).omit({
  id: true,
  addedAt: true,
});

// CRM/Marketing Type Exports
export type LoyaltyTierBenefits = typeof loyaltyTierBenefits.$inferSelect;
export type InsertLoyaltyTierBenefits = z.infer<typeof insertLoyaltyTierBenefitsSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;

export type EmailCampaignSend = typeof emailCampaignSends.$inferSelect;
export type InsertEmailCampaignSend = z.infer<typeof insertEmailCampaignSendSchema>;

export type MarketingAutomation = typeof marketingAutomations.$inferSelect;
export type InsertMarketingAutomation = z.infer<typeof insertMarketingAutomationSchema>;

export type AutomationStep = typeof automationSteps.$inferSelect;
export type InsertAutomationStep = z.infer<typeof insertAutomationStepSchema>;

export type AutomationEnrollment = typeof automationEnrollments.$inferSelect;
export type InsertAutomationEnrollment = z.infer<typeof insertAutomationEnrollmentSchema>;

export type EmailUnsubscribe = typeof emailUnsubscribes.$inferSelect;
export type InsertEmailUnsubscribe = z.infer<typeof insertEmailUnsubscribeSchema>;

export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type InsertNewsletterSubscription = z.infer<typeof insertNewsletterSubscriptionSchema>;

export type MarketingTag = typeof marketingTags.$inferSelect;
export type InsertMarketingTag = z.infer<typeof insertMarketingTagSchema>;

export type CustomerTag = typeof customerTags.$inferSelect;
export type InsertCustomerTag = z.infer<typeof insertCustomerTagSchema>;

// ============================================================================
// REFERRAL PROGRAM SYSTEM
// ============================================================================

// Referral status enum
export const referralStatusEnum = pgEnum("referral_status", ["pending", "converted", "rewarded", "expired"]);

// Referral Program Settings - admin-configurable settings
export const referralProgramSettings = pgTable("referral_program_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isActive: boolean("is_active").notNull().default(true),
  referrerRewardType: text("referrer_reward_type").notNull().default("points"), // points, credit, percentage
  referrerRewardValue: numeric("referrer_reward_value", { precision: 10, scale: 2 }).notNull().default("500"), // 500 points or £5 credit or 10%
  refereeDiscountType: text("referee_discount_type").notNull().default("percentage"), // percentage, fixed
  refereeDiscountValue: numeric("referee_discount_value", { precision: 10, scale: 2 }).notNull().default("10"), // 10% or £10 off
  minPurchaseAmount: numeric("min_purchase_amount", { precision: 10, scale: 2 }).notNull().default("25"), // min purchase for referee
  maxReferralsPerMonth: integer("max_referrals_per_month").default(10),
  rewardExpiryDays: integer("reward_expiry_days").default(90),
  termsAndConditions: text("terms_and_conditions"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => users.id, { onDelete: 'set null' }),
});

// Referral Codes - unique codes for each customer
export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  customCode: varchar("custom_code", { length: 30 }), // optional custom vanity code
  totalReferrals: integer("total_referrals").notNull().default(0),
  successfulReferrals: integer("successful_referrals").notNull().default(0),
  totalEarned: numeric("total_earned", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Referrals - tracks individual referrals
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerUserId: varchar("referrer_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  refereeEmail: varchar("referee_email", { length: 255 }).notNull(),
  refereeUserId: varchar("referee_user_id").references(() => users.id, { onDelete: 'set null' }),
  referralCodeId: varchar("referral_code_id").notNull().references(() => referralCodes.id, { onDelete: 'cascade' }),
  status: referralStatusEnum("status").notNull().default("pending"),
  refereeOrderId: varchar("referee_order_id").references(() => customerOrders.id, { onDelete: 'set null' }),
  refereeOrderAmount: numeric("referee_order_amount", { precision: 10, scale: 2 }),
  referrerRewardAmount: numeric("referrer_reward_amount", { precision: 10, scale: 2 }),
  referrerRewardType: text("referrer_reward_type"), // points, credit
  referrerRewarded: boolean("referrer_rewarded").notNull().default(false),
  referrerRewardedAt: timestamp("referrer_rewarded_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  convertedAt: timestamp("converted_at"),
});

// Referral Rewards History - tracks all rewards given
export const referralRewards = pgTable("referral_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referralId: varchar("referral_id").notNull().references(() => referrals.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  rewardType: text("reward_type").notNull(), // points, credit, coupon
  rewardValue: numeric("reward_value", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  loyaltyTransactionId: varchar("loyalty_transaction_id").references(() => loyaltyTransactions.id, { onDelete: 'set null' }),
  couponId: varchar("coupon_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Referral Invitations - tracks sent invitations
export const referralInvitations = pgTable("referral_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referralCodeId: varchar("referral_code_id").notNull().references(() => referralCodes.id, { onDelete: 'cascade' }),
  senderUserId: varchar("sender_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientName: varchar("recipient_name", { length: 100 }),
  message: text("message"),
  status: text("status").notNull().default("sent"), // sent, opened, clicked, converted
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
});

// Referral Program Schemas
export const insertReferralProgramSettingsSchema = createInsertSchema(referralProgramSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  totalReferrals: true,
  successfulReferrals: true,
  totalEarned: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  convertedAt: true,
  referrerRewarded: true,
  referrerRewardedAt: true,
});

export const insertReferralRewardSchema = createInsertSchema(referralRewards).omit({
  id: true,
  createdAt: true,
});

export const insertReferralInvitationSchema = createInsertSchema(referralInvitations).omit({
  id: true,
  sentAt: true,
  openedAt: true,
  clickedAt: true,
});

// Referral Program Type Exports
export type ReferralProgramSettings = typeof referralProgramSettings.$inferSelect;
export type InsertReferralProgramSettings = z.infer<typeof insertReferralProgramSettingsSchema>;

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

export type ReferralReward = typeof referralRewards.$inferSelect;
export type InsertReferralReward = z.infer<typeof insertReferralRewardSchema>;

export type ReferralInvitation = typeof referralInvitations.$inferSelect;
export type InsertReferralInvitation = z.infer<typeof insertReferralInvitationSchema>;

// Admin notification type enum
export const adminNotificationTypeEnum = pgEnum("admin_notification_type", [
  "new_order",
  "low_stock",
  "support_ticket",
  "new_reseller",
  "new_vendor",
  "reseller_application",
  "vendor_application",
  "athlete_application",
  "order_cancelled",
  "payment_failed",
  "review_submitted",
  "stock_alert",
  "return_request",
  "system"
]);

// Admin Notifications - tracks notifications for admin users
export const adminNotifications = pgTable("admin_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: adminNotificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"), // URL to redirect when clicked
  isRead: boolean("is_read").notNull().default(false),
  isRecovered: boolean("is_recovered").notNull().default(false),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({
  id: true,
  createdAt: true,
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;

// ==========================================
// COMMISSION AUTOMATION ENGINE
// ==========================================

// Commission Adjustment Type enum
export const commissionAdjustmentTypeEnum = pgEnum("commission_adjustment_type", [
  "manual_increase",    // Admin manually increased commission
  "manual_decrease",    // Admin manually decreased commission
  "clawback",           // Commission clawed back due to refund/return
  "bonus",              // Bonus commission awarded
  "correction",         // Correcting a calculation error
  "tier_adjustment"     // Adjustment due to tier change
]);

// Commission Adjustments table - tracks all commission changes/clawbacks
export const commissionAdjustments = pgTable("commission_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commissionId: varchar("commission_id").references(() => commissions.id),
  orderId: varchar("order_id").references(() => customerOrders.id),
  
  // Partner info
  partnerType: commissionEarnerTypeEnum("partner_type").notNull(),
  resellerId: varchar("reseller_id").references(() => resellers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  
  // Adjustment details
  adjustmentType: commissionAdjustmentTypeEnum("adjustment_type").notNull(),
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }).notNull(),
  adjustedAmount: decimal("adjusted_amount", { precision: 10, scale: 2 }).notNull(),
  adjustmentDelta: decimal("adjustment_delta", { precision: 10, scale: 2 }).notNull(), // Positive or negative change
  reason: text("reason").notNull(),
  
  // Admin action
  adjustedBy: varchar("adjusted_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payout Schedule Frequency enum
export const payoutFrequencyEnum = pgEnum("payout_frequency", [
  "weekly",
  "biweekly",
  "monthly",
  "manual"
]);

// Payout Schedules table - automated payout scheduling for partners
export const payoutSchedules = pgTable("payout_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Partner info
  partnerType: commissionEarnerTypeEnum("partner_type").notNull(),
  resellerId: varchar("reseller_id").references(() => resellers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  
  // Schedule settings
  frequency: payoutFrequencyEnum("frequency").notNull().default("monthly"),
  dayOfWeek: integer("day_of_week"), // 0-6 for weekly (0=Sunday)
  dayOfMonth: integer("day_of_month"), // 1-28 for monthly
  minimumAmount: decimal("minimum_amount", { precision: 10, scale: 2 }).notNull().default("50.00"),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  lastPayoutAt: timestamp("last_payout_at"),
  nextPayoutAt: timestamp("next_payout_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Commission Analytics Summary - pre-computed monthly stats for faster queries
export const commissionAnalyticsSummary = pgTable("commission_analytics_summary", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Partner info
  partnerType: commissionEarnerTypeEnum("partner_type").notNull(),
  resellerId: varchar("reseller_id").references(() => resellers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  
  // Time period
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  
  // Aggregated stats
  totalOrders: integer("total_orders").notNull().default(0),
  totalOrderValue: decimal("total_order_value", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalCommissionEarned: decimal("total_commission_earned", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalCommissionPaid: decimal("total_commission_paid", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalAdjustments: decimal("total_adjustments", { precision: 12, scale: 2 }).notNull().default("0.00"),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).notNull().default("0.00"),
  averageCommissionRate: decimal("average_commission_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  
  // Growth metrics
  orderGrowthPercent: decimal("order_growth_percent", { precision: 7, scale: 2 }), // vs previous month
  revenueGrowthPercent: decimal("revenue_growth_percent", { precision: 7, scale: 2 }),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// SMART NOTIFICATIONS SYSTEM
// ==========================================

// Smart Notification Rule Type enum
export const smartNotificationRuleTypeEnum = pgEnum("smart_notification_rule_type", [
  "high_value_order",      // Order above threshold
  "low_performance",       // Partner below expected performance
  "payout_reminder",       // Upcoming or overdue payout
  "commission_milestone",  // Partner reached commission milestone
  "tier_upgrade",          // Partner upgraded tier
  "inactivity_warning",    // Partner inactive for X days
  "new_partner_order",     // New partner's first order
  "refund_alert",          // High refund rate or large refund
  "custom"                 // Custom rule
]);

// Notification Channel enum
export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app",
  "email",
  "both"
]);

// Smart Notification Rules table - configurable notification triggers
export const smartNotificationRules = pgTable("smart_notification_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: text("name").notNull(),
  description: text("description"),
  ruleType: smartNotificationRuleTypeEnum("rule_type").notNull(),
  
  // Rule conditions (JSON)
  conditions: text("conditions").notNull(), // JSON: { threshold: 500, comparison: "greater_than" }
  
  // Who receives this notification
  notifyAdmins: boolean("notify_admins").notNull().default(true),
  notifyPartner: boolean("notify_partner").notNull().default(false),
  channel: notificationChannelEnum("channel").notNull().default("in_app"),
  
  // Email template (if applicable)
  emailSubject: text("email_subject"),
  emailBody: text("email_body"),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(1), // 1-5, 5 being highest
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Smart Notification Log table - tracks all sent notifications
export const smartNotificationLog = pgTable("smart_notification_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  ruleId: varchar("rule_id").references(() => smartNotificationRules.id),
  ruleType: smartNotificationRuleTypeEnum("rule_type").notNull(),
  
  // Related entities
  partnerType: commissionEarnerTypeEnum("partner_type"),
  resellerId: varchar("reseller_id").references(() => resellers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  orderId: varchar("order_id").references(() => customerOrders.id),
  
  // Notification content
  title: text("title").notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON with additional context
  
  // Delivery status
  channel: notificationChannelEnum("channel").notNull(),
  emailSentAt: timestamp("email_sent_at"),
  inAppCreatedAt: timestamp("in_app_created_at"),
  
  // Tracking
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Commission Events table - detailed audit log of all commission-related events
export const commissionEvents = pgTable("commission_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  eventType: text("event_type").notNull(), // created, confirmed, adjusted, paid, clawed_back, cancelled
  commissionId: varchar("commission_id").references(() => commissions.id),
  orderId: varchar("order_id").references(() => customerOrders.id),
  
  // Partner info
  partnerType: commissionEarnerTypeEnum("partner_type").notNull(),
  resellerId: varchar("reseller_id").references(() => resellers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  
  // Event details
  previousValue: decimal("previous_value", { precision: 10, scale: 2 }),
  newValue: decimal("new_value", { precision: 10, scale: 2 }),
  description: text("description"),
  metadata: text("metadata"), // JSON for additional context
  
  // Actor
  performedBy: varchar("performed_by").references(() => users.id),
  performedBySystem: boolean("performed_by_system").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas and types for new tables
export const insertCommissionAdjustmentSchema = createInsertSchema(commissionAdjustments).omit({
  id: true,
  createdAt: true,
});

export const insertPayoutScheduleSchema = createInsertSchema(payoutSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommissionAnalyticsSummarySchema = createInsertSchema(commissionAnalyticsSummary).omit({
  id: true,
  updatedAt: true,
});

export const insertSmartNotificationRuleSchema = createInsertSchema(smartNotificationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmartNotificationLogSchema = createInsertSchema(smartNotificationLog).omit({
  id: true,
  createdAt: true,
});

export const insertCommissionEventSchema = createInsertSchema(commissionEvents).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type CommissionAdjustment = typeof commissionAdjustments.$inferSelect;
export type InsertCommissionAdjustment = z.infer<typeof insertCommissionAdjustmentSchema>;

export type PayoutSchedule = typeof payoutSchedules.$inferSelect;
export type InsertPayoutSchedule = z.infer<typeof insertPayoutScheduleSchema>;

export type CommissionAnalyticsSummary = typeof commissionAnalyticsSummary.$inferSelect;
export type InsertCommissionAnalyticsSummary = z.infer<typeof insertCommissionAnalyticsSummarySchema>;

export type SmartNotificationRule = typeof smartNotificationRules.$inferSelect;
export type InsertSmartNotificationRule = z.infer<typeof insertSmartNotificationRuleSchema>;

export type SmartNotificationLog = typeof smartNotificationLog.$inferSelect;
export type InsertSmartNotificationLog = z.infer<typeof insertSmartNotificationLogSchema>;

export type CommissionEvent = typeof commissionEvents.$inferSelect;
export type InsertCommissionEvent = z.infer<typeof insertCommissionEventSchema>;

// ============================================================================
// PRODUCT REVIEW REQUEST SYSTEM
// ============================================================================

// Review request status enum
export const reviewRequestStatusEnum = pgEnum("review_request_status", ["pending", "sent", "clicked", "reviewed", "expired"]);

// Review Request Campaigns - configurations for automated review requests
export const reviewRequestCampaigns = pgTable("review_request_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  previewText: text("preview_text"),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  
  // Timing settings
  delayDays: integer("delay_days").notNull().default(7), // Days after delivery to send
  reminderEnabled: boolean("reminder_enabled").notNull().default(false),
  reminderDelayDays: integer("reminder_delay_days").default(3), // Days after first request to send reminder
  
  // Incentives
  incentiveEnabled: boolean("incentive_enabled").notNull().default(false),
  incentiveType: text("incentive_type"), // points, discount, coupon
  incentiveValue: numeric("incentive_value", { precision: 10, scale: 2 }),
  incentiveDescription: text("incentive_description"),
  
  // Targeting
  productCategories: text("product_categories").array(), // Specific categories to target
  minOrderValue: numeric("min_order_value", { precision: 10, scale: 2 }),
  customerTiers: text("customer_tiers").array(), // Target specific loyalty tiers
  
  // Status
  isActive: boolean("is_active").notNull().default(false),
  
  // Stats
  totalSent: integer("total_sent").notNull().default(0),
  totalOpened: integer("total_opened").notNull().default(0),
  totalClicked: integer("total_clicked").notNull().default(0),
  totalReviewed: integer("total_reviewed").notNull().default(0),
  
  createdBy: varchar("created_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Review Requests - individual review requests sent to customers
export const reviewRequests = pgTable("review_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => reviewRequestCampaigns.id, { onDelete: 'set null' }),
  orderId: varchar("order_id").notNull().references(() => customerOrders.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: varchar("product_id").references(() => products.id, { onDelete: 'set null' }),
  
  // Request details
  email: text("email").notNull(),
  status: reviewRequestStatusEnum("status").notNull().default("pending"),
  
  // Tracking
  scheduledAt: timestamp("scheduled_at").notNull(),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  reviewedAt: timestamp("reviewed_at"),
  
  // Reminder tracking
  reminderSentAt: timestamp("reminder_sent_at"),
  
  // Unique token for tracking clicks
  token: text("token").notNull().unique(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for review system
export const insertReviewRequestCampaignSchema = createInsertSchema(reviewRequestCampaigns).omit({
  id: true,
  totalSent: true,
  totalOpened: true,
  totalClicked: true,
  totalReviewed: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewRequestSchema = createInsertSchema(reviewRequests).omit({
  id: true,
  createdAt: true,
});

// Type exports for review system
export type ReviewRequestCampaign = typeof reviewRequestCampaigns.$inferSelect;
export type InsertReviewRequestCampaign = z.infer<typeof insertReviewRequestCampaignSchema>;

export type ReviewRequest = typeof reviewRequests.$inferSelect;
export type InsertReviewRequest = z.infer<typeof insertReviewRequestSchema>;

// ============================================================================
// SMART INVENTORY MANAGEMENT SYSTEM
// ============================================================================

// Alert severity enum for inventory alerts
export const alertSeverityEnum = pgEnum("alert_severity", ["critical", "warning", "info"]);

// Demand class enum for product classification
export const demandClassEnum = pgEnum("demand_class", ["fast_mover", "steady", "slow_mover", "dead_stock", "new"]);

// Seasonality profile enum for products
export const seasonalityProfileEnum = pgEnum("seasonality_profile", ["all_year", "spring_summer", "autumn_winter", "holiday", "back_to_school"]);

// Alert type enum for inventory alerts
export const inventoryAlertTypeEnum = pgEnum("inventory_alert_type", [
  "low_stock",
  "out_of_stock", 
  "overstock",
  "dead_stock",
  "reorder_needed",
  "velocity_drop",
  "velocity_spike"
]);

// Bulk operation type enum
export const bulkOperationTypeEnum = pgEnum("bulk_operation_type", [
  "price_update",
  "status_change",
  "stock_adjustment",
  "category_change",
  "warehouse_transfer"
]);

// Bulk operation status enum
export const bulkOperationStatusEnum = pgEnum("bulk_operation_status", ["pending", "processing", "completed", "failed", "cancelled"]);

// Inventory Snapshots - time-series stock level tracking
export const inventorySnapshots = pgTable("inventory_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: 'cascade' }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: varchar("variant_id").references(() => productVariants.id, { onDelete: 'cascade' }),
  size: text("size"),
  color: text("color"),
  quantity: integer("quantity").notNull(),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
  snapshotDate: timestamp("snapshot_date").notNull().defaultNow(),
  snapshotType: text("snapshot_type").notNull().default("daily"), // daily, weekly, monthly, manual
});

// Sales Velocity Metrics - track how fast products sell
export const salesVelocityMetrics = pgTable("sales_velocity_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: varchar("variant_id").references(() => productVariants.id, { onDelete: 'cascade' }),
  size: text("size"),
  color: text("color"),
  
  // Velocity metrics
  salesLast7Days: integer("sales_last_7_days").notNull().default(0),
  salesLast30Days: integer("sales_last_30_days").notNull().default(0),
  salesLast90Days: integer("sales_last_90_days").notNull().default(0),
  avgDailySales: decimal("avg_daily_sales", { precision: 10, scale: 4 }).notNull().default("0"),
  daysOfStock: decimal("days_of_stock", { precision: 10, scale: 2 }), // How many days current stock will last
  turnoverRate: decimal("turnover_rate", { precision: 10, scale: 4 }), // Stock turnover rate
  
  // Classification
  demandClass: demandClassEnum("demand_class").notNull().default("new"),
  velocityTrend: text("velocity_trend").notNull().default("stable"), // increasing, stable, decreasing
  
  // Timestamps
  lastSaleDate: timestamp("last_sale_date"),
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Inventory Alert Rules - configurable thresholds for alerts
export const inventoryAlertRules = pgTable("inventory_alert_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  alertType: inventoryAlertTypeEnum("alert_type").notNull(),
  severity: alertSeverityEnum("severity").notNull(),
  
  // Thresholds
  thresholdValue: integer("threshold_value"), // e.g., stock below 10
  thresholdPercentage: decimal("threshold_percentage", { precision: 5, scale: 2 }), // e.g., 20% below min
  daysThreshold: integer("days_threshold"), // e.g., no sales in 90 days for dead stock
  
  // Scope
  appliesToAllProducts: boolean("applies_to_all_products").notNull().default(true),
  productCategories: text("product_categories").array(), // Specific categories
  warehouseIds: text("warehouse_ids").array(), // Specific warehouses
  
  // Actions
  autoCreateReorderSuggestion: boolean("auto_create_reorder_suggestion").notNull().default(false),
  notifyByEmail: boolean("notify_by_email").notNull().default(true),
  emailRecipients: text("email_recipients").array(),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Inventory Alert Events - active and historical alerts
export const inventoryAlertEvents = pgTable("inventory_alert_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleId: varchar("rule_id").references(() => inventoryAlertRules.id, { onDelete: 'set null' }),
  alertType: inventoryAlertTypeEnum("alert_type").notNull(),
  severity: alertSeverityEnum("severity").notNull(),
  
  // What triggered the alert
  productId: varchar("product_id").references(() => products.id, { onDelete: 'cascade' }),
  variantId: varchar("variant_id").references(() => productVariants.id, { onDelete: 'cascade' }),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: 'cascade' }),
  
  // Alert details
  title: text("title").notNull(),
  message: text("message").notNull(),
  currentValue: integer("current_value"), // Current stock level
  thresholdValue: integer("threshold_value"), // What triggered it
  suggestedAction: text("suggested_action"),
  
  // Status
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  
  // Snooze functionality
  snoozedUntil: timestamp("snoozed_until"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reorder Suggestions - AI-generated reorder recommendations
export const reorderSuggestions = pgTable("reorder_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: varchar("variant_id").references(() => productVariants.id, { onDelete: 'cascade' }),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: 'cascade' }),
  
  // Recommendation details
  currentStock: integer("current_stock").notNull(),
  suggestedOrderQuantity: integer("suggested_order_quantity").notNull(),
  reorderPoint: integer("reorder_point").notNull(), // When to reorder
  safetyStock: integer("safety_stock").notNull(), // Buffer stock
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  
  // Based on
  avgDailySales: decimal("avg_daily_sales", { precision: 10, scale: 4 }),
  leadTimeDays: integer("lead_time_days").notNull().default(7),
  daysOfStockRemaining: decimal("days_of_stock_remaining", { precision: 10, scale: 2 }),
  
  // Priority
  priority: alertSeverityEnum("priority").notNull().default("info"),
  urgencyScore: integer("urgency_score").notNull().default(0), // 0-100 score
  
  // Status
  status: text("status").notNull().default("pending"), // pending, approved, ordered, dismissed
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Suggestions expire if not acted upon
});

// Bulk Operation Jobs - track batch operations
export const bulkOperationJobs = pgTable("bulk_operation_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationType: bulkOperationTypeEnum("operation_type").notNull(),
  status: bulkOperationStatusEnum("status").notNull().default("pending"),
  
  // Job details
  name: text("name").notNull(),
  description: text("description"),
  totalItems: integer("total_items").notNull(),
  processedItems: integer("processed_items").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failureCount: integer("failure_count").notNull().default(0),
  
  // Parameters (JSON stored as text)
  parameters: text("parameters"), // JSON with operation-specific params like new price, new status
  affectedProductIds: text("affected_product_ids").array(),
  
  // Error tracking
  errorLog: text("error_log"), // JSON array of errors
  
  // Audit
  createdBy: varchar("created_by").notNull().references(() => users.id),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Warehouse Capacity History - track warehouse utilisation over time
export const warehouseCapacityHistory = pgTable("warehouse_capacity_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id, { onDelete: 'cascade' }),
  
  // Capacity metrics
  totalUnits: integer("total_units").notNull(),
  maxCapacity: integer("max_capacity"),
  utilisationPercentage: decimal("utilisation_percentage", { precision: 5, scale: 2 }),
  
  // Product breakdown
  uniqueProducts: integer("unique_products").notNull(),
  uniqueVariants: integer("unique_variants").notNull(),
  
  // Value metrics
  totalStockValue: decimal("total_stock_value", { precision: 12, scale: 2 }),
  
  snapshotDate: timestamp("snapshot_date").notNull().defaultNow(),
});

// Pick List - for order fulfilment
export const pickLists = pgTable("pick_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pickListNumber: text("pick_list_number").notNull().unique(),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id),
  
  // Status
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  
  // Assignment
  assignedTo: varchar("assigned_to").references(() => users.id),
  assignedAt: timestamp("assigned_at"),
  
  // Progress
  totalItems: integer("total_items").notNull(),
  pickedItems: integer("picked_items").notNull().default(0),
  
  // Timestamps
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pick List Items - individual items to pick
export const pickListItems = pgTable("pick_list_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pickListId: varchar("pick_list_id").notNull().references(() => pickLists.id, { onDelete: 'cascade' }),
  orderId: varchar("order_id"), // Can be customer_order or reseller order
  orderType: text("order_type").notNull().default("customer"), // customer, reseller
  
  // Product details
  productId: varchar("product_id").notNull().references(() => products.id),
  variantId: varchar("variant_id").references(() => productVariants.id),
  size: text("size"),
  color: text("color"),
  
  // Location
  binLocation: text("bin_location"),
  
  // Quantities
  quantityToPick: integer("quantity_to_pick").notNull(),
  quantityPicked: integer("quantity_picked").notNull().default(0),
  
  // Status
  isPicked: boolean("is_picked").notNull().default(false),
  pickedAt: timestamp("picked_at"),
  notes: text("notes"),
});

// Insert schemas for smart inventory tables
export const insertInventorySnapshotSchema = createInsertSchema(inventorySnapshots).omit({
  id: true,
});

export const insertSalesVelocityMetricSchema = createInsertSchema(salesVelocityMetrics).omit({
  id: true,
  calculatedAt: true,
  updatedAt: true,
});

export const insertInventoryAlertRuleSchema = createInsertSchema(inventoryAlertRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryAlertEventSchema = createInsertSchema(inventoryAlertEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReorderSuggestionSchema = createInsertSchema(reorderSuggestions).omit({
  id: true,
  createdAt: true,
});

export const insertBulkOperationJobSchema = createInsertSchema(bulkOperationJobs).omit({
  id: true,
  processedItems: true,
  successCount: true,
  failureCount: true,
  createdAt: true,
});

export const insertWarehouseCapacityHistorySchema = createInsertSchema(warehouseCapacityHistory).omit({
  id: true,
});

export const insertPickListSchema = createInsertSchema(pickLists).omit({
  id: true,
  pickedItems: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPickListItemSchema = createInsertSchema(pickListItems).omit({
  id: true,
});

// Type exports for smart inventory
export type InventorySnapshot = typeof inventorySnapshots.$inferSelect;
export type InsertInventorySnapshot = z.infer<typeof insertInventorySnapshotSchema>;

export type SalesVelocityMetric = typeof salesVelocityMetrics.$inferSelect;
export type InsertSalesVelocityMetric = z.infer<typeof insertSalesVelocityMetricSchema>;

export type InventoryAlertRule = typeof inventoryAlertRules.$inferSelect;
export type InsertInventoryAlertRule = z.infer<typeof insertInventoryAlertRuleSchema>;

export type InventoryAlertEvent = typeof inventoryAlertEvents.$inferSelect;
export type InsertInventoryAlertEvent = z.infer<typeof insertInventoryAlertEventSchema>;

export type ReorderSuggestion = typeof reorderSuggestions.$inferSelect;
export type InsertReorderSuggestion = z.infer<typeof insertReorderSuggestionSchema>;

export type BulkOperationJob = typeof bulkOperationJobs.$inferSelect;
export type InsertBulkOperationJob = z.infer<typeof insertBulkOperationJobSchema>;

export type WarehouseCapacityHistory = typeof warehouseCapacityHistory.$inferSelect;
export type InsertWarehouseCapacityHistory = z.infer<typeof insertWarehouseCapacityHistorySchema>;

export type PickList = typeof pickLists.$inferSelect;
export type InsertPickList = z.infer<typeof insertPickListSchema>;

export type PickListItem = typeof pickListItems.$inferSelect;
export type InsertPickListItem = z.infer<typeof insertPickListItemSchema>;

// ==================== ORDER REVIEWS & RETURNS ====================

// Return request status enum
export const returnStatusEnum = pgEnum("return_status", [
  "pending",      // Customer submitted request
  "approved",     // Request approved by admin
  "rejected",     // Request rejected
  "received",     // Item received back
  "refunded",     // Refund processed
  "completed"     // Return completed
]);

// Return reason enum
export const returnReasonEnum = pgEnum("return_reason", [
  "wrong_size",
  "wrong_item",
  "damaged",
  "not_as_described",
  "changed_mind",
  "quality_issue",
  "other"
]);

// Order reviews table (customer feedback after delivery)
export const orderReviews = pgTable("order_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => customerOrders.id),
  customerId: varchar("customer_id").references(() => users.id),
  customerEmail: text("customer_email").notNull(),
  overallRating: integer("overall_rating").notNull(), // 1-5 stars
  productQualityRating: integer("product_quality_rating"), // 1-5 stars
  deliveryRating: integer("delivery_rating"), // 1-5 stars
  serviceRating: integer("service_rating"), // 1-5 stars
  comment: text("comment"),
  wouldRecommend: boolean("would_recommend"),
  accessToken: varchar("access_token").notNull(), // Token for anonymous access
  isPublic: boolean("is_public").default(false), // Can be displayed publicly
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Return requests table
export const returnRequests = pgTable("return_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => customerOrders.id),
  customerId: varchar("customer_id").references(() => users.id),
  customerEmail: text("customer_email").notNull(),
  orderNumber: varchar("order_number").notNull(),
  status: returnStatusEnum("status").notNull().default("pending"),
  reason: returnReasonEnum("reason").notNull(),
  reasonDetails: text("reason_details"),
  itemsToReturn: text("items_to_return").notNull(), // JSON array of items
  totalRefundAmount: decimal("total_refund_amount", { precision: 10, scale: 2 }),
  returnLabel: text("return_label"), // URL to return shipping label
  returnTrackingNumber: varchar("return_tracking_number"),
  accessToken: varchar("access_token").notNull(), // Token for anonymous access
  adminNotes: text("admin_notes"),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  receivedAt: timestamp("received_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertOrderReviewSchema = createInsertSchema(orderReviews).omit({
  id: true,
  createdAt: true,
});

export const insertReturnRequestSchema = createInsertSchema(returnRequests).omit({
  id: true,
  processedAt: true,
  receivedAt: true,
  refundedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type OrderReview = typeof orderReviews.$inferSelect;
export type InsertOrderReview = z.infer<typeof insertOrderReviewSchema>;

export type ReturnRequest = typeof returnRequests.$inferSelect;
export type InsertReturnRequest = z.infer<typeof insertReturnRequestSchema>;

// ─── Team Documents ───────────────────────────────────────────────────────────
export const teamDocuments = pgTable("team_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull().default("general"),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(),
  objectPath: text("object_path").notNull(),
  uploadedBy: varchar("uploaded_by", { length: 255 }),
  uploadedByName: varchar("uploaded_by_name", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTeamDocumentSchema = createInsertSchema(teamDocuments).omit({
  id: true,
  createdAt: true,
});

export type TeamDocument = typeof teamDocuments.$inferSelect;
export type InsertTeamDocument = z.infer<typeof insertTeamDocumentSchema>;
// ─── Competition & Event Management ──────────────────────────────────────────

export const competitionTypeEnum = pgEnum("competition_type", [
  "single_day", "multi_day", "online", "hybrid"
]);

export const competitionFormatEnum = pgEnum("competition_format", [
  "individual", "teams_of_2", "teams_of_3", "teams_of_4", "mixed"
]);

export const competitionStatusEnum = pgEnum("competition_status", [
  "draft", "registration_open", "registration_closed", "live", "completed", "cancelled"
]);

export const difficultyLevelEnum = pgEnum("difficulty_level", [
  "rx", "scaled", "intermediate", "open", "custom"
]);

export const competitionGenderEnum = pgEnum("competition_gender", [
  "male", "female", "mixed", "any"
]);

export const workoutTypeEnum = pgEnum("workout_type", [
  "amrap", "for_time", "max_reps", "max_weight", "max_distance", "max_calories"
]);

export const registrationStatusEnum = pgEnum("registration_status", [
  "pending", "confirmed", "checked_in", "withdrawn", "disqualified"
]);

export const paymentStatusEnum = pgEnum("comp_payment_status", [
  "unpaid", "paid", "refunded"
]);

export const scoreStatusEnum = pgEnum("score_status", [
  "pending", "validated", "rejected"
]);

export const teamRoleEnum = pgEnum("team_role", ["captain", "member"]);

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending", "accepted", "declined"
]);

export const competitions = pgTable("competitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  type: competitionTypeEnum("type").notNull().default("single_day"),
  format: competitionFormatEnum("format").notNull().default("individual"),
  location: varchar("location", { length: 255 }),
  venue: varchar("venue", { length: 255 }),
  address: text("address"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  registrationOpenDate: timestamp("registration_open_date"),
  registrationCloseDate: timestamp("registration_close_date"),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").notNull().default(0),
  entryFee: integer("entry_fee").notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("GBP"),
  status: competitionStatusEnum("status").notNull().default("draft"),
  bannerImage: text("banner_image"),
  logoImage: text("logo_image"),
  organiserId: varchar("organiser_id").references(() => users.id),
  isPublic: boolean("is_public").notNull().default(false),
  rules: text("rules"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const competitionCategories = pgTable("competition_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull().references(() => competitions.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").notNull().default(0),
  difficultyLevel: difficultyLevelEnum("difficulty_level").notNull().default("open"),
  gender: competitionGenderEnum("gender").notNull().default("any"),
  ageMin: integer("age_min"),
  ageMax: integer("age_max"),
});

export const competitionWorkouts = pgTable("competition_workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull().references(() => competitions.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: workoutTypeEnum("type").notNull().default("for_time"),
  timeCap: integer("time_cap"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(false),
  scheduledReleaseDate: timestamp("scheduled_release_date"),
  submissionDeadline: timestamp("submission_deadline"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const competitionRegistrations = pgTable("competition_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull().references(() => competitions.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").notNull().references(() => competitionCategories.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  teamName: varchar("team_name", { length: 255 }),
  status: registrationStatusEnum("status").notNull().default("pending"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  promoCodeId: varchar("promo_code_id"),
  discountAmount: integer("discount_amount").notNull().default(0),
  amountPaid: integer("amount_paid").notNull().default(0),
  waiverSigned: boolean("waiver_signed").notNull().default(false),
  waiverSignedAt: timestamp("waiver_signed_at"),
  shirtSize: varchar("shirt_size", { length: 10 }),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
  checkedInAt: timestamp("checked_in_at"),
});

export const competitionTeamMembers = pgTable("competition_team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  registrationId: varchar("registration_id").notNull().references(() => competitionRegistrations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: teamRoleEnum("role").notNull().default("member"),
  inviteStatus: inviteStatusEnum("invite_status").notNull().default("pending"),
  shirtSize: varchar("shirt_size", { length: 10 }),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  removedAt: timestamp("removed_at"),
});

export const competitionPromoCodes = pgTable("competition_promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull().references(() => competitions.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 100 }).notNull(),
  discountType: varchar("discount_type", { length: 20 }).notNull().default("percentage"),
  discountValue: integer("discount_value").notNull(),
  maxUses: integer("max_uses"),
  usesCount: integer("uses_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const competitionScores = pgTable("competition_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  registrationId: varchar("registration_id").notNull().references(() => competitionRegistrations.id, { onDelete: "cascade" }),
  workoutId: varchar("workout_id").notNull().references(() => competitionWorkouts.id),
  score: text("score"),
  scoreNumeric: integer("score_numeric"),
  isPublic: boolean("is_public").notNull().default(true),
  submittedBy: varchar("submitted_by").references(() => users.id),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  status: scoreStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
});

export const competitionHeats = pgTable("competition_heats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workoutId: varchar("workout_id").notNull().references(() => competitionWorkouts.id, { onDelete: "cascade" }),
  heatNumber: integer("heat_number").notNull(),
  startTime: timestamp("start_time"),
  capacity: integer("capacity").notNull().default(10),
  laneAssignments: text("lane_assignments"),
});

export const competitionHeatAssignments = pgTable("competition_heat_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  heatId: varchar("heat_id").notNull().references(() => competitionHeats.id, { onDelete: "cascade" }),
  registrationId: varchar("registration_id").notNull().references(() => competitionRegistrations.id),
  laneNumber: integer("lane_number"),
});

export const competitionLeaderboardCache = pgTable("competition_leaderboard_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull().references(() => competitions.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").notNull().references(() => competitionCategories.id),
  registrationId: varchar("registration_id").notNull().references(() => competitionRegistrations.id),
  totalPoints: integer("total_points").notNull().default(0),
  rank: integer("rank").notNull().default(0),
  lastUpdatedAt: timestamp("last_updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertCompetitionSchema = createInsertSchema(competitions).omit({
  id: true, createdAt: true, updatedAt: true, currentParticipants: true,
});
export const insertCompetitionCategorySchema = createInsertSchema(competitionCategories).omit({
  id: true, currentParticipants: true,
});
export const insertCompetitionWorkoutSchema = createInsertSchema(competitionWorkouts).omit({
  id: true, createdAt: true,
});
export const insertCompetitionRegistrationSchema = createInsertSchema(competitionRegistrations).omit({
  id: true, registeredAt: true, checkedInAt: true, waiverSignedAt: true,
});
export const insertCompetitionScoreSchema = createInsertSchema(competitionScores).omit({
  id: true, submittedAt: true,
});

// Types
export type Competition = typeof competitions.$inferSelect;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type CompetitionCategory = typeof competitionCategories.$inferSelect;
export type InsertCompetitionCategory = z.infer<typeof insertCompetitionCategorySchema>;
export type CompetitionWorkout = typeof competitionWorkouts.$inferSelect;
export type InsertCompetitionWorkout = z.infer<typeof insertCompetitionWorkoutSchema>;
export type CompetitionRegistration = typeof competitionRegistrations.$inferSelect;
export type InsertCompetitionRegistration = z.infer<typeof insertCompetitionRegistrationSchema>;
export type CompetitionScore = typeof competitionScores.$inferSelect;
export type InsertCompetitionScore = z.infer<typeof insertCompetitionScoreSchema>;
export type CompetitionHeat = typeof competitionHeats.$inferSelect;
export type CompetitionHeatAssignment = typeof competitionHeatAssignments.$inferSelect;
export type CompetitionLeaderboardCache = typeof competitionLeaderboardCache.$inferSelect;

// ── Website Pending Checkouts ─────────────────────────────────────────────────
// Persists Square hosted-checkout sessions for website orders server-side so
// orders can be recovered if sessionStorage is lost (tab close, crash, etc.)
export const pendingWebsiteCheckouts = pgTable("pending_website_checkouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentLinkId: varchar("payment_link_id").notNull().unique(),
  squareOrderId: varchar("square_order_id"),
  customerInfo: json("customer_info").notNull(),
  cartItems: json("cart_items").notNull(),
  subtotal: numeric("subtotal"),
  shipping: numeric("shipping"),
  total: numeric("total"),
  coupon: json("coupon"),
  termsAcceptedAt: varchar("terms_accepted_at"),
  userId: varchar("user_id"),
  status: varchar("status").default("pending"),
  orderNumber: varchar("order_number"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ── EPOS Pending Payments ─────────────────────────────────────────────────────
// Persists QR/Square checkout sessions server-side so orders can be recovered
// even if the EPOS browser tab closes before the polling callback fires.
export const eposPendingPayments = pgTable("epos_pending_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referenceId: varchar("reference_id").notNull().unique(),
  paymentLinkId: varchar("payment_link_id"),
  squareOrderId: varchar("square_order_id"),
  resellerId: varchar("reseller_id").references(() => resellers.id),
  customerEmail: varchar("customer_email"),
  customerPhone: varchar("customer_phone"),
  customerFirstName: varchar("customer_first_name"),
  customerLastName: varchar("customer_last_name"),
  items: json("items").notNull(),
  totalAmount: varchar("total_amount").notNull(),
  subtotal: varchar("subtotal"),
  discountAmount: varchar("discount_amount").default("0"),
  couponCode: varchar("coupon_code"),
  couponId: varchar("coupon_id"),
  deliveryMethod: varchar("delivery_method"),
  deliveryAddress: json("delivery_address"),
  status: varchar("status").notNull().default("pending"),
  squarePaymentId: varchar("square_payment_id"),
  orderNumber: varchar("order_number"),
  ownSquare: boolean("own_square").default(false), // true = payment went to reseller's own Square account
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});
export type EposPendingPayment = typeof eposPendingPayments.$inferSelect;

// ─── Weekly Email Digest Config ───────────────────────────────────────────────
export const weeklyEmailConfig = pgTable("weekly_email_config", {
  id: integer("id").primaryKey().default(1),          // singleton row
  enabled: boolean("enabled").notNull().default(false),
  sendDayOfWeek: integer("send_day_of_week").notNull().default(2), // 0=Sun … 6=Sat, default Tuesday
  sendHour: integer("send_hour").notNull().default(19),            // 24h UK time, default 7 PM
  newProductsDays: integer("new_products_days").notNull().default(14),
  maxNewProducts: integer("max_new_products").notNull().default(6),
  subjectTemplate: text("subject_template").notNull().default("Your Weekly 1stRep Update 🏋️"),
  lastSentAt: timestamp("last_sent_at"),
  lastSentCount: integer("last_sent_count"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export type WeeklyEmailConfig = typeof weeklyEmailConfig.$inferSelect;

// Outreach Email Templates table (admin-created templates for direct/broadcast outreach)
export const outreachTemplates = pgTable("outreach_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
});
export type OutreachTemplate = typeof outreachTemplates.$inferSelect;
export const insertOutreachTemplateSchema = createInsertSchema(outreachTemplates).omit({ id: true, createdAt: true, updatedAt: true, lastUsedAt: true });
export type InsertOutreachTemplate = z.infer<typeof insertOutreachTemplateSchema>;

// Outreach Email Log table (tracks every direct/broadcast email sent via admin outreach tool)
export const outreachEmailLog = pgTable("outreach_email_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sentBy: varchar("sent_by").references(() => users.id),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("sent"), // sent | failed
  broadcastId: varchar("broadcast_id"), // groups broadcast sends together
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});
export type OutreachEmailLog = typeof outreachEmailLog.$inferSelect;
