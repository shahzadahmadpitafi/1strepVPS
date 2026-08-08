# 1stRep Premium E-Commerce Platform

## Overview
1stRep is a premium e-commerce platform specializing in high-quality fitness apparel with a tactical/outdoor aesthetic for the UK market. It serves both B2C retail customers and B2B resellers, featuring dedicated dashboards, robust inventory management, and a multi-tenant reseller storefront system. The platform aims to secure a significant market share by offering distinctive style, product quality, and powerful B2B functionalities.

## User Preferences
Preferred communication style: Simple, everyday language.
Language: British English (UK spelling for all user-facing text)

## System Architecture

### UI/UX Design
The platform utilizes a dark-first design with tactical blue accents and charcoal backgrounds, using the Inter font family. It incorporates custom `shadcn/ui` components for consistency, ensures a mobile-first responsive design, and features a dynamic multi-theme homepage system controllable by administrators.

### Technical Implementation
The frontend is built with React 18, TypeScript, Wouter for routing, Tailwind CSS for styling, React Context API for cart state, and TanStack Query for server state, with Vite as the build tool. The backend uses Node.js and Express.js, offering a RESTful API in TypeScript. Session management is handled by Express sessions with PostgreSQL storage. Authentication supports traditional email/password (using `bcryptjs`) and social login via Replit Auth. Drizzle ORM is used for database interactions. Real-time inventory updates and chat functionalities are implemented with Socket.IO WebSockets.

### Feature Specifications
Core e-commerce features include a persistent shopping cart, a product catalog with advanced filtering, a multi-step checkout process, customer profiles, and Square payment integration (for card/Apple Pay/Google Pay). PayPal is also available as an alternative payment method. Enhanced functionalities include a quick-add cart flow, a persistent wishlist, an admin-controlled announcement banner, and a virtual try-on system. The platform is UK GDPR/PECR compliant, includes a comprehensive order management system for admins, and an AI-powered customer service chatbot. Admin team management offers email invitations and department-based permissions.

Inventory management includes atomic stock reduction, comprehensive tracking, automatic reorder alerts, and a warehouse management system supporting multiple locations and stock transfers. Variant-level status (Available, Coming Soon, Pre-Order, Out of Stock) is displayed on product pages and managed via admin. Homepage product sections dynamically reorder based on user analytics. An admin notification system provides real-time alerts for new orders, support tickets, and applications. The platform also includes a referral program and a support ticket system with a live chat portal via WebSockets.

The multi-tenant reseller marketplace supports end-to-end purchasing, intelligent order classification, automatic commission calculation, and CRM reporting. It features social login, saved payment methods, a 5-tier loyalty program, back-in-stock alerts, abandoned cart recovery, Net Terms payment for B2B, bulk order upload, an RFQ/quote system, multi-user B2B accounts, and API integration for partners. Distinct Wholesaler and Reseller roles have separate application and login flows, dedicated dashboards, and Stripe Connect integration for split payments. Resellers can optionally be enabled to sell their own products via a licensing system (Trial, Bronze, Silver, Gold tiers).

### Competition & Event Management System
Full competition hosting and management platform integrated into 1stRep. Key features:
- **Competitions** (`/competitions`): Public listing of all active competitions with filter tabs (upcoming/live/past), search, and status indicators
- **Competition Detail** (`/competitions/:slug`): Tabs for Overview, Workouts, Leaderboard, Schedule, and Registration. Real-time leaderboard via Socket.IO
- **Live Leaderboard Display** (`/competitions/:slug/leaderboard`): TV/projector-optimised full-screen display with auto-scroll, real-time Socket.IO updates, 1stRep branding
- **My Competitions** (`/my-competitions`): Athlete dashboard showing upcoming and past registrations
- **Admin Competition Management** (`/admin/competitions`): Full CRUD for competitions, categories, workouts, registrations, check-in, scoring, heat generation, and leaderboard control
- **Database Tables**: `competitions`, `competition_categories`, `competition_workouts`, `competition_registrations`, `competition_team_members`, `competition_scores`, `competition_heats`, `competition_heat_assignments`, `competition_leaderboard_cache`
- **Scoring Engine** (`server/services/scoringEngine.ts`): Point-per-place rankings, tie count-back resolution, multi-workout type support
- **API Routes** (`server/competitionRoutes.ts`): Public, auth, and admin routes; pay-first Square checkout flow for paid competitions. Free competitions use the direct `/register` route.
- **Navigation**: "COMPETITIONS" added to main site header between "1R COLLECTION" and "RESELLERS"; "Competition Management" added to admin sidebar
- **Pay-First Square Registration Flow**: For paid competitions, NO registration record is created until payment is confirmed. Flow: POST `/create-square-checkout` (returns Square hosted checkout URL, NO DB write) → save `{slug, squarePaymentLinkId, categoryId, teamName, waiverSigned, promoCodeId}` to sessionStorage → redirect to Square hosted page → return with `?payment_complete=1` → POST `/confirm-square-registration` (verifies Square order.state === COMPLETED, then creates confirmed registration). The `stripe_payment_intent_id` DB column is reused to store the Square paymentLinkId for idempotency. Located in `CompetitionDetail.tsx` (frontend) and `competitionRoutes.ts` (backend).
- **My Competitions Tab**: `CustomerProfile.tsx` (at `/account`) has a 3rd tab "My Competitions" querying `/api/competitions/my/registrations`. Shows competition name, date, location, category, payment status (confirmed/pending badge), heat assignment (heat number, start time, lane), and team members with invite status badges. The `my/registrations` endpoint was enhanced to include heat data and team member joins.

### Commission Payout System
Direct commission payouts to resellers via Stripe Connect Express accounts:
- **Reseller Bank Connection**: Resellers can connect their bank account via Stripe Connect in their Earnings panel
- **Stripe Onboarding**: Complete Stripe Express onboarding to verify identity and add bank details
- **Direct Payouts**: Admin can send commission payments directly to resellers' bank accounts via Stripe transfers
- **Multiple Payment Methods**: Supports Bank Transfer (manual), PayPal, and Stripe Connect (instant)
- **Payout Request Flow**: Resellers can request payouts; admin approves and processes via their preferred method
- **Balance Tracking**: Available balance calculated from delivered storefront orders and EPOS sales

### Subscription Tier Pricing
Admin-configurable subscription tier pricing system for reseller product licences. Features:
- **Trial**: Free tier with limited products (default 5), 30-day trial period
- **Bronze**: Entry-level paid tier (default £29.99/month, 25 products)
- **Silver**: Mid-tier (default £49.99/month, 100 products)
- **Gold**: Premium tier (default £99.99/month, unlimited products)

Admins can edit tier prices and product limits from the Licence Requests page in the admin dashboard. The system uses a `subscription_tier_pricing` database table with Zod validation on API endpoints.

### Wholesaler Ordering System
The B2B wholesaler ordering system allows approved wholesalers to browse 1stRep catalogue products at wholesale prices and submit order requests for admin approval. The order lifecycle follows: pending → approved → paid → processing → shipped → delivered. Key features include:
- WholesalerDashboard for browsing products with wholesale pricing and order management
- Admin approval workflow before payment can be made
- Stripe payment integration for approved orders
- AdminWholesaleOrders management page with full lifecycle controls
- Real-time admin notifications for new orders and payment confirmations

The CRM system offers a 360-degree customer intelligence platform with customer lifecycle management (new, active, at_risk, churned, vip, champion), RFM analysis (Champions, Loyal, At Risk, New Customer), and health scoring. Advanced filtering and bulk actions (e.g., CSV export, win-back campaigns) are supported.

Post-delivery customer experience includes order status tracking with a visual timeline, status history, and automatic carrier tracking links. A customer feedback system allows anonymous star ratings and comments. A self-service returns management portal handles return requests with a 30-day window, specific item selection, and status tracking. Automated email notifications cover order confirmation, shipping, and delivery.

### System Design
The database design supports users, resellers, products, orders, inventory, and CRM data, implementing role-based access control. The multi-tenant reseller marketplace provides unique, branded storefronts with custom branding, product selection, custom pricing, and flexible commission rules. Business logic includes a tiered discount system for resellers with credit limits, an application/approval process, and admin management tools.

## Critical Infrastructure Notes

### SIGHUP Fix (Server Stability)
Replit's infrastructure sends a **SIGHUP** signal to workflow processes approximately **28 seconds** after startup (when the controlling pty session refreshes). Node.js's default SIGHUP behaviour is to **terminate the process silently**. This caused consistent crashes with no error output.

**Fix**: `process.on('SIGHUP', ...)` in `server/index.ts` overrides the default behaviour and keeps the server running. **Never remove this handler** or the server will crash at ~28 seconds after every restart.

### Production Mode
The app runs in `NODE_ENV=production` mode, serving pre-compiled assets from `dist/`. Always run `npm run build` before testing changes. The workflow command is:
```
while true; do NODE_ENV=production node dist/index.js; echo 'Server exited, restarting in 3s...'; sleep 3; done
```

## External Dependencies

- **Database**: `@neondatabase/serverless` (PostgreSQL)
- **Payment Processing**: Square Web Payments SDK (primary - card/Apple Pay/Google Pay), PayPal, Stripe Connect (for reseller commission payouts)
- **Email Service**: Gmail API via `googleapis` (Replit Gmail connector)
- **AI Services**: OpenAI API
- **Server State Management**: `@tanstack/react-query`
- **UI Components**: `@radix-ui/`
- **Password Hashing**: `bcryptjs`
- **Session Storage**: `connect-pg-simple`
- **Real-time Communication**: `socket.io`, `socket.io-client`