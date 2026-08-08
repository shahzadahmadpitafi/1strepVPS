# 1stRep E-Commerce Platform
## Comprehensive Project Handover Document

**Document Version:** 1.0  
**Date:** February 2026  
**Platform:** 1stRep Premium Fitness Apparel  
**Live URL:** https://1strep.com

---

# TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Features & Functionality](#4-features--functionality)
5. [User Roles & Access](#5-user-roles--access)
6. [Database Architecture](#6-database-architecture)
7. [Payment Systems](#7-payment-systems)
8. [API Endpoints](#8-api-endpoints)
9. [User Interface](#9-user-interface)
10. [Deployment & Hosting](#10-deployment--hosting)
11. [Security Implementation](#11-security-implementation)
12. [Maintenance Guide](#12-maintenance-guide)

---

# 1. PROJECT OVERVIEW

## 1.1 Business Description

**1stRep** is a premium e-commerce platform specialising in high-quality fitness apparel with a tactical/outdoor aesthetic, designed specifically for the UK market. The platform operates a dual business model:

- **B2C (Business-to-Consumer):** Direct retail sales to individual customers
- **B2B (Business-to-Business):** Wholesale and reseller marketplace with dedicated dashboards

## 1.2 Key Business Objectives

- Sell premium fitness apparel directly to consumers
- Enable approved resellers to sell 1stRep products via branded storefronts
- Allow wholesalers to purchase bulk orders at discounted prices
- Provide vendors with point-of-sale terminals for in-person sales
- Track commissions and manage payouts to resellers

## 1.3 Target Market

- UK-based fitness enthusiasts
- Gym owners and personal trainers (resellers)
- Fitness apparel retailers (wholesalers)
- Outdoor and tactical gear enthusiasts

---

# 2. TECHNOLOGY STACK

## 2.1 Frontend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.3.1 |
| **TypeScript** | Type-safe JavaScript | 5.6.3 |
| **Vite** | Build Tool & Dev Server | 5.4.19 |
| **Tailwind CSS** | Styling Framework | 3.4.17 |
| **Wouter** | Client-side Routing | 3.3.5 |
| **TanStack Query** | Server State Management | 5.60.5 |
| **Radix UI** | Accessible UI Components | Various |
| **Framer Motion** | Animations | 11.13.1 |
| **Recharts** | Data Visualisation | 2.15.2 |
| **Socket.IO Client** | Real-time Communication | 4.8.1 |

## 2.2 Backend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime Environment | 20.x |
| **Express.js** | Web Framework | 4.21.2 |
| **TypeScript** | Type-safe JavaScript | 5.6.3 |
| **Drizzle ORM** | Database ORM | 0.39.1 |
| **Socket.IO** | WebSocket Server | 4.8.1 |
| **Passport.js** | Authentication | 0.7.0 |
| **bcryptjs** | Password Hashing | 3.0.2 |
| **Zod** | Schema Validation | 3.24.2 |

## 2.3 Database & Storage

| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary Database (Neon Serverless) |
| **Google Cloud Storage** | Object Storage for Images |
| **Replit Object Storage** | Secondary File Storage |

## 2.4 Payment Integrations

| Provider | Purpose |
|----------|---------|
| **Square** | Primary payment processor (Cards, Apple Pay, Google Pay) |
| **PayPal** | Alternative payment method |
| **Stripe Connect** | Reseller commission payouts |

## 2.5 External Services

| Service | Purpose |
|---------|---------|
| **Gmail API** | Transactional emails (via Google APIs) |
| **OpenAI API** | AI-powered customer service chatbot |
| **Postcodes.io** | UK postal code lookup |

---

# 3. PROJECT STRUCTURE

```
1strep/
├── client/                      # Frontend application
│   └── src/
│       ├── App.tsx             # Main application component with routing
│       ├── main.tsx            # Application entry point
│       ├── index.css           # Global styles and Tailwind configuration
│       ├── components/         # Reusable UI components
│       │   ├── ui/            # shadcn/ui base components
│       │   ├── admin/         # Admin-specific components
│       │   ├── epos/          # EPOS system components
│       │   └── reseller/      # Reseller-specific components
│       ├── contexts/          # React Context providers
│       │   └── CartContext.tsx # Shopping cart state management
│       ├── hooks/             # Custom React hooks
│       ├── lib/               # Utility functions and helpers
│       └── pages/             # Page components (70+ pages)
│
├── server/                     # Backend application
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # All API route definitions
│   ├── storage.ts             # Database operations (Storage interface)
│   ├── db.ts                  # Database connection
│   ├── squareRoutes.ts        # Square payment routes
│   ├── paypal.ts              # PayPal integration
│   ├── email-service.ts       # Email notification service
│   ├── email.ts               # Email templates
│   ├── googleAuth.ts          # Google OAuth configuration
│   ├── replitAuth.ts          # Replit authentication
│   ├── objectStorage.ts       # Cloud storage operations
│   ├── socketServer.ts        # WebSocket server
│   ├── vite.ts                # Vite development server integration
│   ├── middleware/            # Express middleware
│   └── services/              # Business logic services
│
├── shared/                     # Shared code between frontend/backend
│   └── schema.ts              # Database schema (Drizzle ORM)
│
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
├── package.json               # Project dependencies
├── tailwind.config.ts         # Tailwind CSS configuration
├── vite.config.ts             # Vite build configuration
├── tsconfig.json              # TypeScript configuration
└── drizzle.config.ts          # Database migration configuration
```

---

# 4. FEATURES & FUNCTIONALITY

## 4.1 Customer-Facing Features

### Shopping Experience
- **Product Catalogue:** Browse products with filtering by category, size, colour, gender, and activity type
- **Advanced Search:** Full-text search with autocomplete
- **Product Details:** High-quality images, size guides, colour variants, stock status
- **Quick View:** Preview products without leaving the page
- **Wishlist:** Save favourite items for later
- **Size Guide:** Detailed sizing information with fit recommendations

### Shopping Cart & Checkout
- **Persistent Cart:** Cart survives browser sessions
- **Guest Checkout:** Purchase without creating an account
- **Multiple Payment Methods:** Square (card/Apple Pay/Google Pay), PayPal
- **Coupon Codes:** Apply discount codes at checkout
- **Referral Discounts:** Use referral codes for discounts
- **Address Lookup:** Automatic city population from UK postcode
- **Click & Collect:** Option to collect from partner stores

### Customer Account
- **Registration/Login:** Email/password or Google OAuth
- **Order History:** View past orders and track current ones
- **Order Tracking:** Visual timeline with carrier tracking links
- **Returns Portal:** Self-service return requests (30-day window)
- **Order Feedback:** Rate and review delivered orders
- **Profile Management:** Update personal details and preferences

### Customer Support
- **AI Chatbot:** 24/7 automated customer service
- **Support Tickets:** Submit and track support requests
- **Live Chat:** Real-time chat with support agents
- **FAQ Section:** Comprehensive help articles
- **Contact Forms:** General enquiries and feedback

## 4.2 Reseller Features

### Reseller Dashboard
- **Sales Analytics:** Revenue, orders, and performance metrics
- **Product Management:** Add own products (with licensing)
- **Storefront Builder:** Customise branded storefront appearance
- **Commission Tracking:** View earned commissions
- **Payout Requests:** Request commission payouts
- **Stripe Connect:** Connect bank account for direct payouts

### Reseller EPOS (Point of Sale)
- **In-Person Sales:** Sell products at physical locations
- **5 Payment Methods:** Tap/Insert, Card, Cash, QR Pay, PayPal
- **Barcode Scanning:** Quick product lookup
- **Receipt Generation:** Digital receipts
- **Order Management:** Track EPOS orders

### Reseller Storefront
- **Custom Branding:** Logo, colours, and styling
- **Product Selection:** Choose which products to sell
- **Custom Pricing:** Set own prices with commission rules
- **Storefront EPOS:** Point of sale for storefront products
- **Customer Management:** View storefront customers

### Licensing System
- **Trial Tier:** Free, 5 products, 30-day trial
- **Bronze Tier:** £29.99/month, 25 products
- **Silver Tier:** £49.99/month, 100 products
- **Gold Tier:** £99.99/month, unlimited products

## 4.3 Wholesaler Features

### Wholesaler Dashboard
- **Product Catalogue:** Browse at wholesale prices
- **Order Submission:** Create wholesale order requests
- **Order Tracking:** Monitor order status through lifecycle
- **Payment Processing:** Pay for approved orders via Stripe

### Order Lifecycle
1. **Pending:** Order submitted for review
2. **Approved:** Admin approves, payment enabled
3. **Paid:** Payment processed
4. **Processing:** Order being prepared
5. **Shipped:** Order dispatched
6. **Delivered:** Order completed

## 4.4 Vendor Features

### Vendor Dashboard
- **Sales Overview:** Track revenue and orders
- **Inventory Management:** View stock levels
- **Order Processing:** Manage incoming orders
- **Performance Analytics:** Sales trends and reports

### Vendor EPOS
- **Point of Sale Terminal:** Process in-store sales
- **Multiple Payment Methods:** Card, cash, QR codes
- **Customer Lookup:** Find existing customers
- **Receipt Printing:** Generate sales receipts

## 4.5 Admin Features

### Dashboard & Analytics
- **Sales Dashboard:** Real-time revenue, orders, and metrics
- **Customer Analytics:** Customer lifetime value, segments
- **Product Performance:** Best sellers, low performers
- **Commission Analytics:** Reseller earnings and payouts
- **Smart Reports:** Exportable business intelligence

### Product Management
- **Product CRUD:** Create, edit, delete products
- **Variant Management:** Sizes, colours, SKUs
- **Image Upload:** Multi-image upload with validation
- **Inventory Tracking:** Stock levels and alerts
- **Category Management:** Product sections and categories

### Order Management
- **Order Processing:** View and update order status
- **Shipping Integration:** Carrier selection and tracking
- **Refund Processing:** Handle returns and refunds
- **Wholesale Orders:** Approve and process B2B orders

### User Management
- **Customer CRM:** 360-degree customer view
- **RFM Analysis:** Customer segmentation (Champions, Loyal, At Risk)
- **Lifecycle Tracking:** New, active, at risk, churned, VIP
- **Bulk Actions:** Export, email campaigns
- **Customer Health Scoring:** Automated engagement scores

### B2B Management
- **Reseller Applications:** Review and approve applicants
- **Reseller Management:** Edit tiers, commissions, access
- **Wholesaler Management:** Approve and manage wholesalers
- **Partner Management:** Track partner performance

### Marketing Tools
- **Coupon Management:** Create and manage discount codes
- **Referral Program:** Track referrals and rewards
- **Announcement Banner:** Site-wide promotional banners
- **Popup Messages:** Marketing popups
- **Email Campaigns:** Customer communication

### System Settings
- **Homepage Themes:** Switch between 4 visual themes
- **Store Locations:** Manage click & collect locations
- **Warehouse Management:** Multiple warehouse support
- **Admin Team:** Invite team members with role-based access
- **Chatbot Training:** Manage AI knowledge base

---

# 5. USER ROLES & ACCESS

## 5.1 Role Hierarchy

| Role | Description | Access Level |
|------|-------------|--------------|
| **Customer** | Regular shoppers | Shop, checkout, account management |
| **Reseller** | Approved partners | Dashboard, EPOS, storefront, commissions |
| **Wholesaler** | Bulk buyers | Wholesale catalogue, order requests |
| **Vendor** | Store operators | Vendor EPOS, inventory, orders |
| **Admin** | Platform managers | Full system access |

## 5.2 Admin Departments

Admins can have access to specific departments:

- **Full Access:** Complete admin privileges
- **Products:** Product and inventory management
- **Orders:** Order processing and fulfilment
- **Customers:** CRM and customer support
- **Resellers:** Reseller and partner management
- **Support:** Support tickets and chat
- **Coupons:** Discount code management
- **Settings:** Site configuration

## 5.3 Authentication Methods

- **Email/Password:** Traditional registration with email verification
- **Google OAuth:** Sign in with Google account
- **Replit Auth:** Sign in with Replit account (developer access)

---

# 6. DATABASE ARCHITECTURE

## 6.1 Core Tables

### Users & Authentication
- `users` - User profiles (customers, resellers, admins)
- `auth_identities` - Multi-provider authentication links
- `local_credentials` - Password storage (separated for security)
- `password_reset_otps` - Password reset verification codes
- `admin_team_members` - Admin staff with department access
- `user_measurements` - Body measurements for size recommendations

### Products & Inventory
- `products` - Product catalogue
- `product_variants` - Size/colour combinations with stock
- `product_sections` - Homepage product categories
- `product_activity_types` - Activity categorisation (yoga, running, etc.)
- `product_images` - Product image gallery
- `warehouses` - Warehouse locations
- `warehouse_inventory` - Stock per warehouse
- `stock_transfers` - Inter-warehouse transfers

### Orders & Commerce
- `carts` - Shopping carts
- `cart_items` - Cart contents
- `orders` - Customer orders
- `order_items` - Order line items
- `order_status_history` - Order status timeline
- `wholesale_orders` - B2B wholesale orders
- `wholesale_order_items` - Wholesale line items
- `returns` - Return requests

### Resellers & B2B
- `resellers` - Reseller profiles
- `reseller_applications` - Application submissions
- `reseller_products` - Products on reseller storefronts
- `reseller_payouts` - Commission payout records
- `reseller_epos_sales` - In-person sales records
- `storefront_orders` - Orders from reseller storefronts

### Marketing & CRM
- `coupons` - Discount codes
- `referral_links` - Referral programme tracking
- `wishlists` - Customer wishlists
- `back_in_stock_alerts` - Stock notification subscriptions
- `customer_interactions` - CRM activity log
- `order_feedback` - Customer reviews

### Support & Communication
- `support_tickets` - Customer support tickets
- `ticket_messages` - Support ticket conversations
- `chatbot_knowledge` - AI chatbot training data
- `admin_notifications` - System notifications

### Site Configuration
- `site_settings` - Global platform settings
- `announcement_banners` - Promotional banners
- `popup_messages` - Marketing popups
- `hero_images` - Homepage hero images
- `hero_videos` - Homepage video backgrounds
- `store_locations` - Click & collect locations

## 6.2 Key Relationships

```
users ──────┬─── orders
            ├─── carts
            ├─── wishlists
            ├─── support_tickets
            └─── resellers (if approved)

products ───┬─── product_variants
            ├─── product_images
            └─── order_items

resellers ──┬─── reseller_products
            ├─── reseller_epos_sales
            ├─── storefront_orders
            └─── reseller_payouts

orders ─────┬─── order_items
            ├─── order_status_history
            └─── returns
```

---

# 7. PAYMENT SYSTEMS

## 7.1 Square Integration (Primary)

**Used For:** All customer checkout payments, EPOS payments

### Payment Methods Supported
- Credit/Debit Cards (Visa, Mastercard, Amex)
- Apple Pay
- Google Pay

### Implementation
- Square Hosted Checkout for web payments
- Square Terminal API for EPOS card readers
- QR Code payment links for in-person sales

### Configuration
```
Environment Variables:
- SQUARE_APPLICATION_ID
- SQUARE_ACCESS_TOKEN
- SQUARE_LOCATION_ID
```

## 7.2 PayPal Integration

**Used For:** Alternative payment method at checkout

### Features
- PayPal account payments
- PayPal card processing
- Pay Later options

### Configuration
```
Environment Variables:
- PAYPAL_CLIENT_ID
- PAYPAL_CLIENT_SECRET
```

## 7.3 Stripe Connect (Reseller Payouts)

**Used For:** Direct commission payments to reseller bank accounts

### Features
- Express account onboarding
- Identity verification
- Instant bank transfers
- Payout tracking

### Configuration
```
Environment Variables:
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET
```

---

# 8. API ENDPOINTS

## 8.1 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new customer |
| POST | `/api/auth/login` | Customer login |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with OTP |
| GET | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/google/callback` | Google OAuth callback |

## 8.2 Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get product details |
| GET | `/api/products/by-color` | Products grouped by colour |
| POST | `/api/admin/products` | Create product (admin) |
| PUT | `/api/admin/products/:id` | Update product (admin) |
| DELETE | `/api/admin/products/:id` | Delete product (admin) |

## 8.3 Cart & Checkout Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get current cart |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:itemId` | Update cart item |
| DELETE | `/api/cart/:itemId` | Remove from cart |
| POST | `/api/checkout/complete` | Complete order |

## 8.4 Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | User's orders |
| GET | `/api/orders/:id` | Order details |
| GET | `/api/orders/:id/tracking` | Order tracking |
| POST | `/api/orders/:id/return` | Request return |

## 8.5 Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/orders` | All orders |
| PUT | `/api/admin/orders/:id/status` | Update order status |
| GET | `/api/admin/customers` | Customer list |
| GET | `/api/admin/analytics` | Sales analytics |
| GET | `/api/admin/resellers` | Reseller list |
| PUT | `/api/admin/resellers/:id` | Update reseller |

## 8.6 Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/square/checkout` | Create Square checkout |
| POST | `/api/square/checkout/complete` | Complete Square payment |
| POST | `/api/paypal/create-order` | Create PayPal order |
| POST | `/api/paypal/capture-order` | Capture PayPal payment |

---

# 9. USER INTERFACE

## 9.1 Design System

### Visual Identity
- **Theme:** Dark-first design with tactical blue accents
- **Primary Colour:** Emerald green (#10B981)
- **Background:** Charcoal/dark grey
- **Typography:** Inter font family
- **Border Radius:** Consistent rounded corners

### Homepage Themes (Admin Selectable)
1. **Tactical Dark:** Military-inspired dark theme
2. **Modern Light:** Clean light theme
3. **Dynamic Gradient:** Gradient-based design
4. **Clean Minimal:** Simplified minimal design

## 9.2 Key Pages

### Public Pages
- Home (/) - Dynamic homepage with hero and products
- Shop (/shop-clean) - Product catalogue with filters
- Product Detail (/product/:id) - Individual product page
- Cart (/cart) - Shopping cart
- Checkout (/checkout) - Payment and delivery
- About Us (/about) - Company information
- Contact (/contact-support) - Support contact form

### Customer Account Pages
- Login (/customer-login) - Customer authentication
- Profile (/customer-profile) - Account settings
- Orders (/customer-orders) - Order history
- Wishlist (/wishlist) - Saved products
- Order Tracking (/order-tracking) - Delivery status

### Admin Pages (50+ pages)
- Dashboard (/admin/dashboard) - Overview and analytics
- Products (/admin/products) - Product management
- Orders (/admin/orders) - Order processing
- Customers (/admin/crm) - Customer CRM
- Resellers (/admin/resellers) - Reseller management
- Marketing (/admin/marketing) - Campaigns and coupons

### Reseller Pages
- Dashboard (/reseller/dashboard) - Reseller home
- EPOS (/reseller/epos) - Point of sale
- Storefront EPOS (/reseller/storefront-epos) - Storefront sales

### B2B Pages
- Wholesaler Dashboard (/wholesaler-dashboard) - Wholesale ordering
- Vendor Dashboard (/vendor-dashboard) - Vendor operations
- Vendor EPOS (/vendor-epos) - Vendor point of sale

## 9.3 Responsive Design

- **Mobile First:** All pages optimised for mobile devices
- **Breakpoints:** 
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Mobile Navigation:** Bottom navigation bar for key actions
- **Touch Friendly:** Large tap targets for mobile users

---

# 10. DEPLOYMENT & HOSTING

## 10.1 Hosting Platform

**Platform:** Replit  
**Domain:** 1strep.com (custom domain)  
**Development URL:** https://1strep.replit.app

## 10.2 Environment Variables

### Required Secrets
```
DATABASE_URL           - PostgreSQL connection string
SQUARE_APPLICATION_ID  - Square app ID
SQUARE_ACCESS_TOKEN    - Square API token
SQUARE_LOCATION_ID     - Square location
PAYPAL_CLIENT_ID       - PayPal client ID
PAYPAL_CLIENT_SECRET   - PayPal secret
STRIPE_SECRET_KEY      - Stripe API key
STRIPE_PUBLISHABLE_KEY - Stripe public key
STRIPE_WEBHOOK_SECRET  - Stripe webhook verification
```

### Object Storage
```
DEFAULT_OBJECT_STORAGE_BUCKET_ID
PUBLIC_OBJECT_SEARCH_PATHS
PRIVATE_OBJECT_DIR
```

## 10.3 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Push database changes
npm run db:push
```

## 10.4 Deployment Process

1. Make code changes
2. Test locally with `npm run dev`
3. Commit changes to Git
4. Click "Publish" in Replit to deploy
5. Monitor logs for any errors

---

# 11. SECURITY IMPLEMENTATION

## 11.1 Authentication Security

- **Password Hashing:** bcryptjs with salt rounds
- **Session Management:** Express sessions with PostgreSQL store
- **OAuth 2.0:** Google OAuth for social login
- **HTTPS Only:** All traffic encrypted via TLS
- **Session Cookies:** Secure, HTTP-only cookies

## 11.2 API Security

- **Rate Limiting:** Express rate limit on sensitive endpoints
- **Input Validation:** Zod schema validation on all inputs
- **SQL Injection Prevention:** Parameterised queries via Drizzle ORM
- **XSS Protection:** Helmet middleware for security headers
- **CORS:** Configured for trusted origins

## 11.3 Payment Security

- **PCI Compliance:** All card data handled by Square/PayPal
- **No Card Storage:** Card details never touch our servers
- **Tokenisation:** Payment tokens for secure processing
- **Webhook Verification:** Signed webhooks from payment providers

## 11.4 Data Protection

- **UK GDPR Compliant:** Cookie consent, privacy policy
- **PECR Compliant:** Marketing consent management
- **Data Encryption:** Sensitive data encrypted at rest
- **Access Control:** Role-based permissions

---

# 12. MAINTENANCE GUIDE

## 12.1 Common Tasks

### Adding a New Product
1. Login to Admin Dashboard
2. Go to Products section
3. Click "Add Product"
4. Fill in product details
5. Upload images
6. Set variant stock levels
7. Save product

### Processing Orders
1. Go to Orders section
2. View pending orders
3. Update status (Confirmed → Shipped → Delivered)
4. Add tracking number when shipping
5. Customer receives automated emails

### Approving Resellers
1. Go to Reseller Management
2. View pending applications
3. Review business details
4. Approve or reject application
5. Set tier and commission rate

### Managing Inventory
1. Go to Smart Inventory
2. View low stock alerts
3. Update stock levels
4. Process stock transfers between warehouses

## 12.2 Troubleshooting

### Common Issues

**Orders not completing:**
- Check Square/PayPal credentials
- Verify webhook endpoints are active
- Check server logs for errors

**Images not uploading:**
- Verify object storage connection
- Check file size limits
- Ensure valid image formats

**Emails not sending:**
- Verify Gmail API credentials
- Check email service configuration
- Review email templates

### Checking Logs

1. Go to Replit Console
2. View application logs
3. Look for error messages
4. Check specific endpoints for issues

## 12.3 Backup Procedures

- **Database:** Automatic daily backups via Neon
- **Code:** Git version control with commit history
- **Images:** Stored in Google Cloud Storage with redundancy

## 12.4 Future Enhancement Ideas

1. **Mobile App:** Native iOS/Android applications
2. **SMS Notifications:** Text message order updates
3. **Subscription Products:** Recurring product subscriptions
4. **Affiliate Programme:** Expanded partner network
5. **Multi-Currency:** Support for international sales
6. **Advanced Analytics:** Business intelligence dashboard
7. **Inventory Forecasting:** AI-powered stock predictions

---

# APPENDIX

## A. Contact Information

For technical support with this platform:
- Development Team: [Your Contact]
- Platform Hosting: Replit Support

## B. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial release with full feature set |

## C. Glossary

| Term | Definition |
|------|------------|
| EPOS | Electronic Point of Sale - in-person payment terminal |
| B2B | Business-to-Business sales |
| B2C | Business-to-Consumer sales |
| CRM | Customer Relationship Management |
| RFM | Recency, Frequency, Monetary - customer analysis |
| SKU | Stock Keeping Unit - unique product identifier |
| Webhook | HTTP callback for real-time notifications |

---

---

**Platform Designed & Developed by Qanzak Global**  
*Professional E-Commerce Solutions*

---

**Document prepared for 1stRep Platform Handover**  
**All rights reserved © 2026**
