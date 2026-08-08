// ─── Shared content types ────────────────────────────────────────────────────
export type Block =
  | { type: 'p'; text: string }
  | { type: 'bullets'; items: { label: string; detail?: string }[] }
  | { type: 'numbered'; items: { label: string; detail?: string }[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'note'; text: string }
  | { type: 'warning'; text: string }
  | { type: 'grid'; items: string[] }
  | { type: 'sub'; id: string; num: string; title: string }
  | { type: 'code'; text: string };

export interface Chapter {
  id: string;
  num: string;
  title: string;
  blocks: Block[];
}

export interface NavSub {
  id: string;
  num: string;
  title: string;
}

export interface NavSection {
  id: string;
  num: string;
  title: string;
  sub?: NavSub[];
}

export interface GuideData {
  slug: string;
  docNum: string;
  docTotal: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  chips: string[];
  nav: NavSection[];
  chapters: Chapter[];
}

// ════════════════════════════════════════════════════════════════════════════
// DOC 1 — Platform Overview & Getting Started
// ════════════════════════════════════════════════════════════════════════════
export const doc1: GuideData = {
  slug: 'platform-overview',
  docNum: '1', docTotal: '8',
  title: 'Platform Overview &', titleAccent: 'Getting Started',
  subtitle: 'A complete introduction to the 1stRep multi-sided platform, architecture, user roles, and setup.',
  chips: ['8 Chapters', 'All Roles', 'Last Updated Mar 2026'],
  nav: [
    { id: 'ch1', num: '1', title: 'What is 1stRep?' },
    { id: 'ch2', num: '2', title: 'Strategic Positioning' },
    { id: 'ch3', num: '3', title: 'Platform Architecture', sub: [
      { id: 'ch3-fe', num: '3.1', title: 'Frontend' },
      { id: 'ch3-be', num: '3.2', title: 'Backend' },
      { id: 'ch3-db', num: '3.3', title: 'Database' },
      { id: 'ch3-os', num: '3.4', title: 'Object Storage' },
      { id: 'ch3-pay', num: '3.5', title: 'Payments' },
    ]},
    { id: 'ch4', num: '4', title: 'User Roles & Permissions' },
    { id: 'ch5', num: '5', title: 'Key URLs & Navigation' },
    { id: 'ch6', num: '6', title: 'Brand Identity & Standards', sub: [
      { id: 'ch6-col', num: '6.1', title: 'Colours' },
      { id: 'ch6-type', num: '6.2', title: 'Typography' },
      { id: 'ch6-write', num: '6.3', title: 'Writing Style' },
    ]},
    { id: 'ch7', num: '7', title: 'Tech Stack Overview' },
    { id: 'ch8', num: '8', title: 'First-Time Setup Checklist' },
  ],
  chapters: [
    {
      id: 'ch1', num: '1', title: 'What is 1stRep?',
      blocks: [
        { type: 'p', text: '1stRep is a premium gymwear and activewear brand built for serious athletes, fitness professionals, and lifestyle consumers. The digital platform, developed and maintained by Qanzak Global, serves three distinct audiences simultaneously:' },
        { type: 'bullets', items: [
          { label: 'Customers', detail: 'people who shop directly from the online storefront' },
          { label: 'Resellers', detail: 'gym owners, retailers, and partners who sell through physical EPOS terminals' },
          { label: 'Influencers', detail: 'content creators who promote 1stRep on social media in return for credits and commissions' },
        ]},
        { type: 'p', text: 'The platform is fully integrated — orders from all three channels flow into the same fulfilment system, inventory is shared, and analytics are unified.' },
      ],
    },
    {
      id: 'ch2', num: '2', title: 'Strategic Positioning',
      blocks: [
        { type: 'bullets', items: [
          { label: '70% Reseller Acquisition', detail: 'primary growth via B2B partnerships with gyms, sports retailers, and fitness centres who use the EPOS terminal to sell in-person' },
          { label: '30% Direct-to-Consumer (DTC)', detail: 'online storefront and influencer-driven traffic for individual purchases' },
        ]},
        { type: 'p', text: 'This means reseller partner onboarding, EPOS reliability, and wholesale order fulfilment are the highest-priority operational areas. The influencer programme supports DTC by driving tracked website traffic and conversions through personalised discount codes and tracking links.' },
      ],
    },
    {
      id: 'ch3', num: '3', title: 'Platform Architecture',
      blocks: [
        { type: 'sub', id: 'ch3-fe', num: '3.1', title: 'Frontend' },
        { type: 'p', text: 'React 18 + TypeScript + Vite SPA. Uses TanStack Query v5 for server state, Wouter for routing, shadcn/ui + Tailwind CSS for design. All pages served from the same Express server.' },
        { type: 'sub', id: 'ch3-be', num: '3.2', title: 'Backend' },
        { type: 'p', text: 'Express.js API in TypeScript. Handles all business logic, auth, payment processing, and database operations. Sessions managed server-side using express-session with PostgreSQL storage.' },
        { type: 'sub', id: 'ch3-db', num: '3.3', title: 'Database' },
        { type: 'p', text: 'PostgreSQL via Drizzle ORM. Tables use UUID or serial primary keys. Covers: users, products, orders, inventory, resellers, influencers, CRM, documents, events, and more.' },
        { type: 'sub', id: 'ch3-os', num: '3.4', title: 'Object Storage' },
        { type: 'bullets', items: [
          { label: 'team-documents/', detail: 'internal team guides and documents' },
          { label: 'public/', detail: 'publicly accessible assets like product images' },
          { label: '.private/', detail: 'private assets like vendor uploads' },
        ]},
        { type: 'sub', id: 'ch3-pay', num: '3.5', title: 'Payments' },
        { type: 'p', text: 'Stripe is the payment processor for all customer transactions. Square is the secondary processor for reseller EPOS transactions. Email is sent via SendGrid.' },
      ],
    },
    {
      id: 'ch4', num: '4', title: 'User Roles & Permissions',
      blocks: [
        { type: 'table', headers: ['Role', 'Access Level', 'Primary Location'], rows: [
          ['Customer', 'Shop, wishlist, orders, reviews', '/shop-clean, /account'],
          ['Reseller', 'EPOS terminal, storefront, wholesale orders', '/reseller/epos, /reseller/dashboard'],
          ['Influencer', 'Credits, discount codes, tracking', '/influencer-dashboard'],
          ['Vendor', 'Own products, analytics, images', '/vendor'],
          ['Admin', 'Full platform access', '/admin'],
        ]},
        { type: 'note', text: 'Admin accounts cannot be created through the platform UI — they must be set directly in the database by a developer.' },
      ],
    },
    {
      id: 'ch5', num: '5', title: 'Key URLs & Navigation',
      blocks: [
        { type: 'table', headers: ['Section', 'URL', 'Who Uses It'], rows: [
          ['Homepage', '/', 'All visitors'],
          ['Shop', '/shop-clean', 'Customers'],
          ['Product detail', '/product/:slug', 'Customers'],
          ['Account', '/account', 'Customers'],
          ['Reseller Dashboard', '/reseller/dashboard', 'Resellers'],
          ['EPOS Terminal', '/reseller/epos', 'Resellers'],
          ['Influencer Programme Info', '/athlete-program', 'Applicants'],
          ['Influencer Dashboard', '/influencer-dashboard', 'Influencers'],
          ['Admin Panel', '/admin', 'Admins'],
          ['Admin Reports', '/admin/reports', 'Admins'],
          ['Admin Influencer Credits', '/admin/influencer-credits', 'Admins'],
          ['Admin Document Library', '/admin/documents', 'All staff'],
          ['Vendor Portal', '/vendor', 'Vendors'],
          ['Store Locator', '/store-locator', 'All visitors'],
        ]},
      ],
    },
    {
      id: 'ch6', num: '6', title: 'Brand Identity & Standards',
      blocks: [
        { type: 'sub', id: 'ch6-col', num: '6.1', title: 'Colours' },
        { type: 'bullets', items: [
          { label: 'Brand Black #0D0D0D', detail: 'primary background, headers, main text' },
          { label: 'Brand Gold #C9A84C', detail: 'accents, calls to action, highlights — maximum 15% of any layout' },
          { label: 'Chalk White #F5F5F0', detail: 'light background surfaces — never use pure #FFFFFF' },
        ]},
        { type: 'sub', id: 'ch6-type', num: '6.2', title: 'Typography' },
        { type: 'bullets', items: [
          { label: 'Display / Headings', detail: 'Bebas Neue — used for large titles and hero text' },
          { label: 'Body / UI', detail: 'Inter — used for all body copy, labels, and UI text' },
        ]},
        { type: 'sub', id: 'ch6-write', num: '6.3', title: 'Writing Style' },
        { type: 'bullets', items: [
          { label: 'Brand name', detail: 'always written as "1stRep" — never "1st Rep" or "FirstRep"' },
          { label: 'Programme naming', detail: '"Influencer Programme" — never "Athlete Programme"' },
          { label: 'Currency', detail: 'always use £ (GBP) with two decimal places' },
        ]},
      ],
    },
    {
      id: 'ch7', num: '7', title: 'Tech Stack Overview',
      blocks: [
        { type: 'table', headers: ['Layer', 'Technology'], rows: [
          ['Frontend Framework', 'React 18 + TypeScript + Vite'],
          ['UI Components', 'shadcn/ui + Tailwind CSS'],
          ['Routing', 'Wouter'],
          ['Server State', 'TanStack Query v5'],
          ['Forms', 'React Hook Form + Zod'],
          ['Backend', 'Express.js + TypeScript'],
          ['Database', 'PostgreSQL + Drizzle ORM'],
          ['File Storage', 'Replit Object Storage (GCS)'],
          ['Payments (online)', 'Stripe'],
          ['Payments (EPOS)', 'Square'],
          ['Email', 'SendGrid'],
          ['Auth', 'Passport.js (local + Google OAuth)'],
        ]},
      ],
    },
    {
      id: 'ch8', num: '8', title: 'First-Time Setup Checklist',
      blocks: [
        { type: 'numbered', items: [
          { label: 'Set all required environment variables', detail: 'DATABASE_URL, STRIPE_SECRET_KEY, SENDGRID_API_KEY, SESSION_SECRET, DEFAULT_OBJECT_STORAGE_BUCKET_ID' },
          { label: 'Run database migrations', detail: 'npm run db:push in the project root' },
          { label: 'Seed the database', detail: 'the server seeds automatically on first start' },
          { label: 'Create the first admin account', detail: 'register a user then update their role to "admin" in the database' },
          { label: 'Configure Stripe webhook', detail: 'point stripe webhook to /api/webhook/stripe' },
          { label: 'Upload product images', detail: 'use the Image Manager in Admin > Image Manager' },
          { label: 'Add reseller accounts', detail: 'use Admin > B2B Partners > Add Partner' },
          { label: 'Configure announcement banner', detail: 'Admin > Settings > Announcement Banner' },
        ]},
      ],
    },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// DOC 2 — Customer Storefront Guide
// ════════════════════════════════════════════════════════════════════════════
export const doc2: GuideData = {
  slug: 'customer-storefront',
  docNum: '2', docTotal: '8',
  title: 'Customer', titleAccent: 'Storefront Guide',
  subtitle: 'Everything customers need to browse, shop, manage orders, and use their account on 1stRep.',
  chips: ['10 Chapters', 'Customer Role', 'Last Updated Mar 2026'],
  nav: [
    { id: 'ch1', num: '1', title: 'Creating & Managing an Account', sub: [
      { id: 'ch1-reg', num: '1.1', title: 'Registration' },
      { id: 'ch1-login', num: '1.2', title: 'Logging In' },
      { id: 'ch1-settings', num: '1.3', title: 'Account Settings' },
    ]},
    { id: 'ch2', num: '2', title: 'Browsing & Searching Products', sub: [
      { id: 'ch2-nav', num: '2.1', title: 'Storefront Navigation' },
      { id: 'ch2-filter', num: '2.2', title: 'Filtering & Sorting' },
      { id: 'ch2-detail', num: '2.3', title: 'Product Detail Page' },
    ]},
    { id: 'ch3', num: '3', title: 'The Shopping Cart' },
    { id: 'ch4', num: '4', title: 'Discount Codes & Promotions' },
    { id: 'ch5', num: '5', title: 'Checkout & Payment', sub: [
      { id: 'ch5-steps', num: '5.1', title: 'Checkout Steps' },
      { id: 'ch5-pay', num: '5.2', title: 'Payment Methods' },
      { id: 'ch5-ship', num: '5.3', title: 'Shipping Options' },
    ]},
    { id: 'ch6', num: '6', title: 'Orders & Tracking', sub: [
      { id: 'ch6-view', num: '6.1', title: 'Viewing Orders' },
      { id: 'ch6-status', num: '6.2', title: 'Order Statuses' },
      { id: 'ch6-track', num: '6.3', title: 'Tracking' },
    ]},
    { id: 'ch7', num: '7', title: 'Returns & Refunds' },
    { id: 'ch8', num: '8', title: 'Wishlist' },
    { id: 'ch9', num: '9', title: 'Product Reviews' },
    { id: 'ch10', num: '10', title: 'Loyalty Programme' },
  ],
  chapters: [
    {
      id: 'ch1', num: '1', title: 'Creating & Managing an Account',
      blocks: [
        { type: 'sub', id: 'ch1-reg', num: '1.1', title: 'Registration' },
        { type: 'p', text: 'New customers register by clicking Sign Up in the top navigation bar. Required fields: first name, last name, email address, and password (minimum 8 characters). Alternatively, sign in with Google to skip the form entirely.' },
        { type: 'note', text: 'Email addresses must be unique. If an email already in use, the customer is prompted to log in instead.' },
        { type: 'sub', id: 'ch1-login', num: '1.2', title: 'Logging In' },
        { type: 'p', text: 'Navigate to /login. Enter the registered email and password and click Sign In. Use the "Forgot Password" link to receive a reset email.' },
        { type: 'sub', id: 'ch1-settings', num: '1.3', title: 'Account Settings' },
        { type: 'bullets', items: [
          { label: 'Update name, email, and phone number' },
          { label: 'Change password' },
          { label: 'Save and manage delivery addresses' },
          { label: 'View loyalty points balance' },
          { label: 'Set marketing email preferences' },
        ]},
      ],
    },
    {
      id: 'ch2', num: '2', title: 'Browsing & Searching Products',
      blocks: [
        { type: 'sub', id: 'ch2-nav', num: '2.1', title: 'Storefront Navigation' },
        { type: 'p', text: 'The main shop is at /shop-clean. Products are displayed in a responsive grid layout with infinite scroll as the customer reaches the bottom of the page.' },
        { type: 'sub', id: 'ch2-filter', num: '2.2', title: 'Filtering & Sorting' },
        { type: 'bullets', items: [
          { label: 'Category', detail: 'filter by product type (e.g. shorts, tops, accessories)' },
          { label: 'Colour', detail: 'filter by available colour options' },
          { label: 'Size', detail: 'only sizes with stock in any variant are shown' },
          { label: 'Activity Type', detail: 'filter by sport or use-case (e.g. CrossFit, Running, HIIT)' },
          { label: 'Price Range', detail: 'set a minimum and maximum price' },
        ]},
        { type: 'p', text: 'Sort options: Newest, Price Low to High, Price High to Low, and Most Popular.' },
        { type: 'sub', id: 'ch2-detail', num: '2.3', title: 'Product Detail Page' },
        { type: 'bullets', items: [
          { label: 'Product name, description, and full specification' },
          { label: 'All colour variants with a swatch selector' },
          { label: 'Size options — greyed out sizes are out of stock' },
          { label: 'Stock level indicator (In Stock / Low Stock / Out of Stock)' },
          { label: 'Product images with zoom on hover' },
          { label: 'Size guide link' },
          { label: 'Related products and customer reviews' },
        ]},
      ],
    },
    {
      id: 'ch3', num: '3', title: 'The Shopping Cart',
      blocks: [
        { type: 'p', text: 'When a customer clicks "Add to Cart", the item is immediately added to their persistent cart (stored server-side). The cart icon in the header shows the current item count and updates in real time.' },
        { type: 'bullets', items: [
          { label: 'Increase or decrease quantities for each item' },
          { label: 'Remove individual items' },
          { label: 'See the subtotal update live as quantities change' },
          { label: 'Proceed directly to checkout' },
        ]},
        { type: 'note', text: 'Cart contents are saved across sessions. Items added while logged out are merged with the account cart on login.' },
      ],
    },
    {
      id: 'ch4', num: '4', title: 'Discount Codes & Promotions',
      blocks: [
        { type: 'bullets', items: [
          { label: 'Influencer codes', detail: 'e.g. SLUG10 — give a % discount; the influencer earns credit when used' },
          { label: 'Admin coupons', detail: 'general promotion codes created by the admin team' },
        ]},
        { type: 'numbered', items: [
          { label: 'Add items to the cart and proceed to checkout' },
          { label: 'In the Order Summary panel, find the "Discount Code" field' },
          { label: 'Type or paste the code and click Apply' },
          { label: 'The discounted amount is shown and the total updates automatically' },
        ]},
        { type: 'warning', text: 'Only one discount code can be applied per order. Codes cannot be combined.' },
      ],
    },
    {
      id: 'ch5', num: '5', title: 'Checkout & Payment',
      blocks: [
        { type: 'sub', id: 'ch5-steps', num: '5.1', title: 'Checkout Steps' },
        { type: 'numbered', items: [
          { label: 'Contact information', detail: 'email address for confirmation' },
          { label: 'Delivery address', detail: 'full UK address with postcode' },
          { label: 'Shipping method', detail: 'available options with prices and estimated delivery times' },
          { label: 'Payment', detail: 'enter card details, use Apple Pay, or Google Pay' },
          { label: 'Order confirmation', detail: 'confirmation page and email sent automatically' },
        ]},
        { type: 'sub', id: 'ch5-pay', num: '5.2', title: 'Payment Methods' },
        { type: 'bullets', items: [
          { label: 'Debit or Credit Card', detail: 'Visa, Mastercard, Amex — processed securely by Stripe' },
          { label: 'Apple Pay', detail: 'available on Safari / iOS devices' },
          { label: 'Google Pay', detail: 'available on Chrome / Android devices' },
        ]},
        { type: 'note', text: 'Card details are never stored on the 1stRep servers. All payment data is handled entirely by Stripe\'s PCI-compliant infrastructure.' },
        { type: 'sub', id: 'ch5-ship', num: '5.3', title: 'Shipping Options' },
        { type: 'bullets', items: [
          { label: 'Standard Delivery', detail: '3–5 working days' },
          { label: 'Express Delivery', detail: '1–2 working days' },
          { label: 'Free Delivery', detail: 'applied automatically above a configured order threshold' },
        ]},
      ],
    },
    {
      id: 'ch6', num: '6', title: 'Orders & Tracking',
      blocks: [
        { type: 'sub', id: 'ch6-view', num: '6.1', title: 'Viewing Orders' },
        { type: 'bullets', items: [
          { label: 'Order number and date' },
          { label: 'Current status with a visual progress indicator' },
          { label: 'Items ordered, sizes, quantities, and individual prices' },
          { label: 'Total paid including any discounts applied' },
          { label: 'Shipping address and selected delivery method' },
        ]},
        { type: 'sub', id: 'ch6-status', num: '6.2', title: 'Order Statuses' },
        { type: 'table', headers: ['Status', 'Meaning'], rows: [
          ['Pending', 'Order placed but not yet confirmed by the team'],
          ['Processing', 'Order confirmed and being prepared for dispatch'],
          ['Shipped', 'Order dispatched — tracking number available'],
          ['Delivered', 'Carrier has confirmed delivery'],
          ['Cancelled', 'Order cancelled before fulfilment'],
          ['Refunded', 'Order refunded in full or in part'],
        ]},
        { type: 'sub', id: 'ch6-track', num: '6.3', title: 'Tracking' },
        { type: 'p', text: 'Once an order is shipped, a tracking number is added by the admin team. Customers see a "Track My Order" button in their order detail view. Supported carriers: Royal Mail, DPD, Evri, UPS, FedEx, DHL — detected automatically from the tracking number format.' },
      ],
    },
    {
      id: 'ch7', num: '7', title: 'Returns & Refunds',
      blocks: [
        { type: 'numbered', items: [
          { label: 'Go to Account > My Orders and find the relevant order' },
          { label: 'Click "Request Return" on the order' },
          { label: 'Select the item(s) you wish to return' },
          { label: 'Choose a reason (Wrong size, Faulty, Changed mind, etc.)' },
          { label: 'Add any notes and submit' },
        ]},
        { type: 'p', text: 'The admin team reviews return requests and can approve or reject with a reason. Approved returns are refunded to the original payment method within 5–10 business days after the product is received.' },
      ],
    },
    {
      id: 'ch8', num: '8', title: 'Wishlist',
      blocks: [
        { type: 'p', text: 'Customers save products to a wishlist by clicking the heart icon on any product card or detail page. The wishlist is account-linked and persists across devices.' },
        { type: 'bullets', items: [
          { label: 'View all saved items' },
          { label: 'Move items directly to the cart with one click' },
          { label: 'Remove items from the wishlist' },
        ]},
        { type: 'note', text: 'Wishlist is only available to logged-in customers.' },
      ],
    },
    {
      id: 'ch9', num: '9', title: 'Product Reviews',
      blocks: [
        { type: 'numbered', items: [
          { label: 'Go to Account > My Orders' },
          { label: 'Click "Leave Review" next to a delivered product' },
          { label: 'Select a star rating (1–5) and write a review text' },
          { label: 'Submit — sent to the admin for approval before going live' },
        ]},
        { type: 'p', text: 'Approved reviews appear on the product detail page. The average star rating is shown on the product card in the shop grid.' },
      ],
    },
    {
      id: 'ch10', num: '10', title: 'Loyalty Programme',
      blocks: [
        { type: 'p', text: 'Customers automatically earn loyalty points on every purchase. Points can be redeemed for discounts on future orders.' },
        { type: 'table', headers: ['Tier', 'Requirement', 'Benefit'], rows: [
          ['Bronze', 'Entry level — first purchase', 'Base earn rate'],
          ['Silver', 'Reach points threshold', '1.25× earn multiplier'],
          ['Gold', 'Higher threshold', '1.5× earn + early sale access'],
          ['Platinum', 'Top tier', '2× earn + exclusive rewards'],
        ]},
        { type: 'p', text: 'Points balance and redemption options are shown in Account > Loyalty. The admin team configures points rates and tier thresholds from the Admin Dashboard.' },
      ],
    },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// DOC 3 — Orders & Fulfilment Management
// ════════════════════════════════════════════════════════════════════════════
export const doc3: GuideData = {
  slug: 'orders-fulfilment',
  docNum: '3', docTotal: '8',
  title: 'Orders &', titleAccent: 'Fulfilment Management',
  subtitle: 'How all order types are managed, processed, and fulfilled across the 1stRep platform.',
  chips: ['10 Chapters', 'Admin Role', 'Last Updated Mar 2026'],
  nav: [
    { id: 'ch1', num: '1', title: 'Order Types & Sources' },
    { id: 'ch2', num: '2', title: 'The Admin Orders View' },
    { id: 'ch3', num: '3', title: 'Processing an Order', sub: [
      { id: 'ch3-detail', num: '3.1', title: 'Order Detail View' },
      { id: 'ch3-pick', num: '3.2', title: 'Picking & Packing Workflow' },
    ]},
    { id: 'ch4', num: '4', title: 'Updating Order Status' },
    { id: 'ch5', num: '5', title: 'Tracking Numbers & Carriers' },
    { id: 'ch6', num: '6', title: 'Cancellations & Refunds', sub: [
      { id: 'ch6-cancel', num: '6.1', title: 'Cancelling an Order' },
      { id: 'ch6-refund', num: '6.2', title: 'Processing a Refund' },
    ]},
    { id: 'ch7', num: '7', title: 'Wholesale / B2B Orders' },
    { id: 'ch8', num: '8', title: 'EPOS Orders' },
    { id: 'ch9', num: '9', title: 'Order Emails' },
    { id: 'ch10', num: '10', title: 'Reports & Analytics' },
  ],
  chapters: [
    {
      id: 'ch1', num: '1', title: 'Order Types & Sources',
      blocks: [
        { type: 'table', headers: ['Order Type', 'Source', 'Payment Processor'], rows: [
          ['Online Customer Order', 'Customer checkout on /shop-clean', 'Stripe'],
          ['EPOS Sale', 'Reseller using /reseller/epos terminal', 'Square / Cash / Other'],
          ['Wholesale Order', 'B2B partner bulk purchase', 'Invoice / Stripe'],
          ['Admin-Created Order', 'Admin creates manually in the dashboard', 'Manual'],
        ]},
        { type: 'p', text: 'All order types share the same status workflow and fulfilment process. Regardless of source, the admin team manages them from the same Orders interface.' },
      ],
    },
    {
      id: 'ch2', num: '2', title: 'The Admin Orders View',
      blocks: [
        { type: 'p', text: 'Navigate to Admin > Orders. Filter tabs allow you to quickly view orders by status:' },
        { type: 'bullets', items: [
          { label: 'All', detail: 'every order regardless of status' },
          { label: 'Pending', detail: 'orders awaiting processing' },
          { label: 'Processing', detail: 'orders confirmed and being picked/packed' },
          { label: 'Shipped', detail: 'orders that have been dispatched' },
          { label: 'Delivered', detail: 'orders confirmed as received by the customer' },
          { label: 'Cancelled', detail: 'orders that were cancelled before fulfilment' },
        ]},
        { type: 'p', text: 'Each row shows: order number, customer name, date, total value, item count, source channel, and current status. Use the search bar to search by order number, customer name, or email.' },
      ],
    },
    {
      id: 'ch3', num: '3', title: 'Processing an Order',
      blocks: [
        { type: 'sub', id: 'ch3-detail', num: '3.1', title: 'Order Detail View' },
        { type: 'bullets', items: [
          { label: 'Order information', detail: 'order number, date, source channel, payment method' },
          { label: 'Customer information', detail: 'name, email, phone — with a link to their CRM profile' },
          { label: 'Line items', detail: 'each product with variant, quantity, unit price, and line total' },
          { label: 'Price breakdown', detail: 'subtotal, discount applied, shipping cost, and grand total' },
          { label: 'Delivery address', detail: 'full shipping address' },
          { label: 'Order timeline', detail: 'log of every status change with timestamp and who made the change' },
          { label: 'Internal notes', detail: 'a notes field for the team — not visible to the customer' },
        ]},
        { type: 'sub', id: 'ch3-pick', num: '3.2', title: 'Picking & Packing Workflow' },
        { type: 'numbered', items: [
          { label: 'When an order arrives with status Pending, review it for any issues' },
          { label: 'Verify stock is available in the warehouse inventory system' },
          { label: 'Update the status to Processing once the order is confirmed' },
          { label: 'Pick and pack the items according to the line items list' },
          { label: 'Once dispatched, update to Shipped and enter the tracking number' },
          { label: 'The customer is automatically notified by email at each status change' },
        ]},
      ],
    },
    {
      id: 'ch4', num: '4', title: 'Updating Order Status',
      blocks: [
        { type: 'p', text: 'In the order detail view, click the status dropdown and select the new status. Then click Save. The system will log the change, record the admin user who made it, and send a notification email to the customer.' },
        { type: 'note', text: 'Status changes are logged but cannot be reversed in the UI. If a mistake is made, contact a developer to correct it in the database.' },
      ],
    },
    {
      id: 'ch5', num: '5', title: 'Tracking Numbers & Carriers',
      blocks: [
        { type: 'p', text: 'When updating an order to Shipped, enter the tracking number in the tracking field. The system automatically detects the carrier:' },
        { type: 'table', headers: ['Carrier', 'Tracking Format', 'Example'], rows: [
          ['Royal Mail', 'Letters + 13 chars total', 'AB123456789GB'],
          ['DPD', '14 digits', '12345678901234'],
          ['Evri (Hermes)', 'Starts with H', 'H1234567890'],
          ['UPS', 'Starts with 1Z', '1Z999AA10123456784'],
          ['FedEx', '12 or 15 digits', '123456789012'],
          ['DHL', '10 digits', '1234567890'],
          ['Yodel', 'JD followed by digits', 'JD000060007567345622'],
        ]},
        { type: 'p', text: 'Once a tracking number is entered, a "Track Parcel" link appears in the customer\'s order view and in their shipping confirmation email.' },
      ],
    },
    {
      id: 'ch6', num: '6', title: 'Cancellations & Refunds',
      blocks: [
        { type: 'sub', id: 'ch6-cancel', num: '6.1', title: 'Cancelling an Order' },
        { type: 'p', text: 'An order can be cancelled if it has not yet been shipped. Change the status to Cancelled in the order detail view. This does not automatically process a refund — refunds must be processed separately through Stripe.' },
        { type: 'sub', id: 'ch6-refund', num: '6.2', title: 'Processing a Refund' },
        { type: 'p', text: 'Refunds are initiated from the Stripe Dashboard (not the 1stRep admin panel). Log in to dashboard.stripe.com, find the payment, and issue a full or partial refund. The refund appears on the customer\'s bank statement within 5–10 business days.' },
        { type: 'warning', text: 'Always cancel the order in the 1stRep admin panel AND refund in Stripe. Doing only one without the other creates inconsistent records.' },
      ],
    },
    {
      id: 'ch7', num: '7', title: 'Wholesale / B2B Orders',
      blocks: [
        { type: 'bullets', items: [
          { label: 'Invoice generation', detail: 'the system can generate a PDF invoice for each wholesale order' },
          { label: 'Payment recording', detail: 'record payment receipt manually or link to a Stripe payment' },
          { label: 'Commission calculation', detail: 'if the reseller earns a commission, it is calculated and tracked here' },
          { label: 'Bulk status updates', detail: 'update multiple wholesale order items at once' },
        ]},
      ],
    },
    {
      id: 'ch8', num: '8', title: 'EPOS Orders',
      blocks: [
        { type: 'p', text: 'Orders created through the reseller EPOS terminal appear in the main Orders view tagged with the source channel "EPOS" and the reseller\'s name. Key differences from online orders:' },
        { type: 'bullets', items: [
          { label: 'Payment recorded as method chosen at EPOS', detail: 'Card, Cash, or Other' },
          { label: 'Delivery address may be the reseller\'s premises for direct dispatch' },
          { label: 'Commission for the reseller is calculated based on their agreed rate' },
        ]},
      ],
    },
    {
      id: 'ch9', num: '9', title: 'Order Emails',
      blocks: [
        { type: 'table', headers: ['Trigger', 'Email Sent', 'Recipient'], rows: [
          ['Order placed', 'Order confirmation with items and total', 'Customer'],
          ['Status → Processing', 'Your order is being prepared', 'Customer'],
          ['Status → Shipped', 'Your order is on its way + tracking link', 'Customer'],
          ['Status → Delivered', 'Your order has been delivered', 'Customer'],
          ['Status → Cancelled', 'Your order has been cancelled', 'Customer'],
          ['Return approved', 'Return approval + instructions', 'Customer'],
          ['Return rejected', 'Return declined with reason', 'Customer'],
        ]},
      ],
    },
    {
      id: 'ch10', num: '10', title: 'Reports & Analytics',
      blocks: [
        { type: 'grid', items: [
          'Total revenue by date range',
          'Order count and average order value',
          'Revenue breakdown by channel (online vs EPOS vs wholesale)',
          'Top-selling products and variants',
          'Orders by status distribution',
          'Discount code usage and revenue impact',
          'Refund rate and value',
        ]},
        { type: 'p', text: 'Data can be filtered by date range. Reports are generated in real time from the live database — there is no caching delay.' },
      ],
    },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// DOC 4 — Products, Inventory & Warehouse Guide
// ════════════════════════════════════════════════════════════════════════════
export const doc4: GuideData = {
  slug: 'products-inventory',
  docNum: '4', docTotal: '8',
  title: 'Products, Inventory &', titleAccent: 'Warehouse Guide',
  subtitle: 'Managing the 1stRep product catalogue, stock levels, and warehouse operations.',
  chips: ['10 Chapters', 'Admin Role', 'Last Updated Mar 2026'],
  nav: [
    { id: 'ch1', num: '1', title: 'Product Structure' },
    { id: 'ch2', num: '2', title: 'Adding & Editing Products', sub: [
      { id: 'ch2-add', num: '2.1', title: 'Adding a New Product' },
      { id: 'ch2-edit', num: '2.2', title: 'Editing an Existing Product' },
      { id: 'ch2-del', num: '2.3', title: 'Deleting a Product' },
    ]},
    { id: 'ch3', num: '3', title: 'Product Variants', sub: [
      { id: 'ch3-what', num: '3.1', title: 'What is a Variant?' },
      { id: 'ch3-add', num: '3.2', title: 'Adding Variants' },
    ]},
    { id: 'ch4', num: '4', title: 'Categories & Activity Types' },
    { id: 'ch5', num: '5', title: 'Product Sections (Homepage)' },
    { id: 'ch6', num: '6', title: 'Warehouse Inventory', sub: [
      { id: 'ch6-ov', num: '6.1', title: 'Overview' },
      { id: 'ch6-truth', num: '6.2', title: 'Source of Truth' },
    ]},
    { id: 'ch7', num: '7', title: 'Adding & Adjusting Stock', sub: [
      { id: 'ch7-add', num: '7.1', title: 'Adding New Stock' },
      { id: 'ch7-adj', num: '7.2', title: 'Stock Adjustments' },
      { id: 'ch7-bulk', num: '7.3', title: 'Bulk Import' },
    ]},
    { id: 'ch8', num: '8', title: 'Warehouses & Store Locations' },
    { id: 'ch9', num: '9', title: 'Smart Inventory & Alerts' },
    { id: 'ch10', num: '10', title: 'Image Manager' },
  ],
  chapters: [
    {
      id: 'ch1', num: '1', title: 'Product Structure',
      blocks: [
        { type: 'bullets', items: [
          { label: 'Product', detail: 'the top-level item (e.g. "1stRep Performance Shorts")' },
          { label: 'Product Variant', detail: 'a specific combination of size and colour. Each variant has its own SKU, price, and stock quantity field.' },
          { label: 'Warehouse Inventory', detail: 'the actual physical stock count stored per variant per warehouse — this is the definitive stock figure.' },
        ]},
        { type: 'warning', text: 'The real, live stock count is in the warehouseInventory.quantity column. The productVariants.stockQuantity field may not always be accurate. Always use Warehouse Inventory for stock decisions.' },
      ],
    },
    {
      id: 'ch2', num: '2', title: 'Adding & Editing Products',
      blocks: [
        { type: 'sub', id: 'ch2-add', num: '2.1', title: 'Adding a New Product' },
        { type: 'numbered', items: [
          { label: 'Go to Admin > Products and click "Add Product"' },
          { label: 'Enter the product name (used to auto-generate the URL slug)' },
          { label: 'Enter the description — supports plain text and basic formatting' },
          { label: 'Set the base price (in GBP)' },
          { label: 'Select the category and applicable activity types' },
          { label: 'Upload the main product image and any additional images' },
          { label: 'Toggle the product to Active when ready to publish' },
          { label: 'Save — the product appears in the shop immediately' },
        ]},
        { type: 'sub', id: 'ch2-edit', num: '2.2', title: 'Editing an Existing Product' },
        { type: 'p', text: 'Click any product in Admin > Products to open the edit view. All fields are editable. Changes apply immediately on save. Toggling a product to Inactive removes it from the shop but retains all historical data.' },
        { type: 'sub', id: 'ch2-del', num: '2.3', title: 'Deleting a Product' },
        { type: 'p', text: 'Soft deletion is used — deleted products are marked inactive and hidden from the shop but remain in the database. View soft-deleted products via the "Deleted Products" tab.' },
        { type: 'warning', text: 'Never hard-delete a product that has been sold. This would break order history for all customers who purchased it.' },
      ],
    },
    {
      id: 'ch3', num: '3', title: 'Product Variants',
      blocks: [
        { type: 'sub', id: 'ch3-what', num: '3.1', title: 'What is a Variant?' },
        { type: 'p', text: 'A variant represents one specific purchasable version of a product. For example, "Performance Shorts" may have 12 variants: 4 sizes × 3 colours. Each variant has:' },
        { type: 'bullets', items: [
          { label: 'SKU', detail: 'a unique stock-keeping unit code (e.g. PS-BLK-M)' },
          { label: 'Price', detail: 'can differ from the base product price if needed' },
          { label: 'Stock quantity', detail: 'linked to warehouse inventory' },
          { label: 'Colour and Size labels' },
          { label: 'Active status', detail: 'individual variants can be deactivated without affecting others' },
        ]},
        { type: 'sub', id: 'ch3-add', num: '3.2', title: 'Adding Variants' },
        { type: 'p', text: 'From the product edit view, scroll to the Variants section. Click "Add Variant" and fill in the size, colour, SKU, and price. Use "Generate All Combinations" to bulk-create all size × colour combinations at once.' },
      ],
    },
    {
      id: 'ch4', num: '4', title: 'Categories & Activity Types',
      blocks: [
        { type: 'bullets', items: [
          { label: 'Categories', detail: 'group products by type (e.g. Shorts, Tops). Manage in Admin > Categories. Can be reordered by drag-and-drop.' },
          { label: 'Activity Types', detail: 'sport-based tags (e.g. CrossFit, Running). Products can have multiple. Customers can filter by activity type. Manage in Admin > Activity Types.' },
        ]},
      ],
    },
    {
      id: 'ch5', num: '5', title: 'Product Sections (Homepage)',
      blocks: [
        { type: 'p', text: 'The homepage can feature curated product sections (e.g. "New Arrivals", "Best Sellers"). Each section is a manually curated list of products. Manage in Admin > Product Sections:' },
        { type: 'bullets', items: [
          { label: 'Create a new section', detail: 'give it a title and optional subtitle' },
          { label: 'Add products to a section', detail: 'search for and select products to include' },
          { label: 'Reorder sections', detail: 'drag to change the homepage display order' },
          { label: 'Toggle section visibility', detail: 'hide a section without deleting it' },
        ]},
      ],
    },
    {
      id: 'ch6', num: '6', title: 'Warehouse Inventory',
      blocks: [
        { type: 'sub', id: 'ch6-ov', num: '6.1', title: 'Overview' },
        { type: 'bullets', items: [
          { label: 'Variant', detail: 'product name, size, and colour' },
          { label: 'SKU', detail: 'the variant\'s unique identifier' },
          { label: 'Warehouse', detail: 'which location holds this stock' },
          { label: 'Quantity on hand', detail: 'current physical stock count' },
          { label: 'Reserved quantity', detail: 'stock reserved for pending orders' },
          { label: 'Available quantity', detail: 'on hand minus reserved' },
        ]},
        { type: 'sub', id: 'ch6-truth', num: '6.2', title: 'Source of Truth' },
        { type: 'p', text: 'The warehouseInventory table is updated every time a sale is made (online or EPOS) and every time stock is added. It is the single source of truth for all stock decisions.' },
      ],
    },
    {
      id: 'ch7', num: '7', title: 'Adding & Adjusting Stock',
      blocks: [
        { type: 'sub', id: 'ch7-add', num: '7.1', title: 'Adding New Stock' },
        { type: 'numbered', items: [
          { label: 'Go to Admin > Add Inventory' },
          { label: 'Select the product and variant' },
          { label: 'Select the warehouse location receiving the stock' },
          { label: 'Enter the quantity being added' },
          { label: 'Add optional notes (e.g. "Delivery ref INV-001234")' },
          { label: 'Click Add Stock — the warehouse inventory updates immediately' },
        ]},
        { type: 'sub', id: 'ch7-adj', num: '7.2', title: 'Stock Adjustments' },
        { type: 'numbered', items: [
          { label: 'Find the variant in Admin > Inventory' },
          { label: 'Click Adjust' },
          { label: 'Enter the new correct quantity (not a delta — enter the actual count)' },
          { label: 'Enter a reason for the adjustment' },
          { label: 'Save — all adjustments are logged with user and timestamp' },
        ]},
        { type: 'sub', id: 'ch7-bulk', num: '7.3', title: 'Bulk Import' },
        { type: 'p', text: 'Large stock imports can be done via CSV import. Navigate to Admin > Add Inventory > Bulk Import. Required CSV columns: sku, warehouse_id, quantity. Download the template from the same page.' },
      ],
    },
    {
      id: 'ch8', num: '8', title: 'Warehouses & Store Locations',
      blocks: [
        { type: 'bullets', items: [
          { label: 'Warehouses', detail: 'manage in Admin > Warehouses. Each has a name, address, and short code. Stock is assigned to warehouses when adding inventory.' },
          { label: 'Store Locations', detail: 'manage in Admin > Store Locations. Physical retail points shown on the Store Locator page. Each has: name, address, opening hours, phone, and map coordinates.' },
        ]},
        { type: 'note', text: 'Store Locations are distinct from Warehouses. A store is where customers visit; a warehouse is where stock is held for fulfilment.' },
      ],
    },
    {
      id: 'ch9', num: '9', title: 'Smart Inventory & Alerts',
      blocks: [
        { type: 'bullets', items: [
          { label: 'Low Stock Alerts', detail: 'automatically flags variants with stock below a configurable threshold' },
          { label: 'Reorder Suggestions', detail: 'based on sales velocity, suggests when to reorder and in what quantity' },
          { label: 'Warehouse Intelligence', detail: 'at /admin/warehouse-intelligence — analytics on stock movement, stockout risk, and overstock' },
          { label: 'Product Performance', detail: 'at /admin/product-performance — shows which products are selling fastest and which are slow-moving' },
        ]},
        { type: 'note', text: 'Smart Inventory alerts are informational only — they do not auto-generate purchase orders. A team member must review alerts and place stock orders with suppliers manually.' },
      ],
    },
    {
      id: 'ch10', num: '10', title: 'Image Manager',
      blocks: [
        { type: 'bullets', items: [
          { label: 'Upload new images', detail: 'drag and drop or file picker — accepts JPG, PNG, and WebP' },
          { label: 'View all uploaded images', detail: 'with their object storage paths' },
          { label: 'Copy image URL', detail: 'to paste into a product image field' },
          { label: 'Delete unused images', detail: 'to keep the library clean' },
        ]},
        { type: 'warning', text: 'Do not delete an image that is currently assigned to a product. This will cause broken image placeholders in the shop.' },
      ],
    },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// DOC 5 — Reseller, B2B Partners & Licence Guide
// ════════════════════════════════════════════════════════════════════════════
export const doc5: GuideData = {
  slug: 'reseller-b2b',
  docNum: '5', docTotal: '8',
  title: 'Reseller, B2B Partners &', titleAccent: 'Licence Guide',
  subtitle: 'Complete guide to the 1stRep reseller programme, B2B licensing, EPOS terminal, and partner management.',
  chips: ['10 Chapters', 'Reseller & Admin', 'Last Updated Mar 2026'],
  nav: [
    { id: 'ch1', num: '1', title: 'Overview of the Reseller Programme' },
    { id: 'ch2', num: '2', title: 'Partner Types & Commission Tiers' },
    { id: 'ch3', num: '3', title: 'Licence Requests & Onboarding', sub: [
      { id: 'ch3-apply', num: '3.1', title: 'How Resellers Apply' },
      { id: 'ch3-review', num: '3.2', title: 'Reviewing Licence Requests' },
      { id: 'ch3-manual', num: '3.3', title: 'Manual Reseller Creation' },
      { id: 'ch3-settings', num: '3.4', title: 'Licence Settings' },
    ]},
    { id: 'ch4', num: '4', title: 'B2B Access & Permissions' },
    { id: 'ch5', num: '5', title: 'The EPOS Terminal', sub: [
      { id: 'ch5-access', num: '5.1', title: 'Accessing the EPOS' },
      { id: 'ch5-browse', num: '5.2', title: 'Product Browsing' },
      { id: 'ch5-basket', num: '5.3', title: 'Building a Basket' },
      { id: 'ch5-process', num: '5.4', title: 'Processing a Sale' },
    ]},
    { id: 'ch6', num: '6', title: 'Wholesale Orders' },
    { id: 'ch7', num: '7', title: 'Commission Payouts', sub: [
      { id: 'ch7-view', num: '7.1', title: 'Viewing Pending Payouts' },
      { id: 'ch7-process', num: '7.2', title: 'Processing a Payout' },
      { id: 'ch7-sched', num: '7.3', title: 'Payout Schedules' },
    ]},
    { id: 'ch8', num: '8', title: 'Reseller Storefront' },
    { id: 'ch9', num: '9', title: 'B2B Coupons & Promotions' },
    { id: 'ch10', num: '10', title: 'Partner Analytics' },
  ],
  chapters: [
    { id: 'ch1', num: '1', title: 'Overview of the Reseller Programme', blocks: [
      { type: 'p', text: 'The reseller programme is the primary growth engine for 1stRep, representing 70% of the commercial strategy. Resellers are gym owners, fitness centres, sports retailers, and other businesses that sell 1stRep products in person using the EPOS terminal.' },
      { type: 'bullets', items: [
        { label: 'EPOS terminal', detail: 'a professional point-of-sale interface to process in-person sales' },
        { label: 'Wholesale pricing', detail: 'products available at reduced wholesale rates' },
        { label: 'Commission on sales', detail: 'earn a percentage of every sale made through their terminal' },
        { label: 'Branded storefront', detail: 'a public-facing storefront page on the 1stRep website' },
        { label: 'B2B invoicing', detail: 'formal invoice generation for business records' },
      ]},
    ]},
    { id: 'ch2', num: '2', title: 'Partner Types & Commission Tiers', blocks: [
      { type: 'table', headers: ['Type', 'Description'], rows: [
        ['Reseller', 'Standard B2B partner — sells via EPOS and/or storefront'],
        ['Premium Partner', 'Higher-volume reseller with enhanced commission and support'],
        ['Wholesale Partner', 'Buys stock in bulk at wholesale rates for own distribution'],
        ['Company Store', 'Corporate partner with a dedicated internal store for employees'],
      ]},
      { type: 'table', headers: ['Tier', 'Commission Rate', 'Monthly Volume Threshold'], rows: [
        ['Bronze', '5%', 'Under £2,000/month'],
        ['Silver', '8%', '£2,000–£5,000/month'],
        ['Gold', '12%', '£5,000–£10,000/month'],
        ['Elite', '15%', 'Over £10,000/month'],
      ]},
      { type: 'p', text: 'Partners automatically progress to higher tiers as their monthly sales volume increases. Tier adjustments can also be made manually in Admin > Commission Tiers > Adjust.' },
    ]},
    { id: 'ch3', num: '3', title: 'Licence Requests & Onboarding', blocks: [
      { type: 'sub', id: 'ch3-apply', num: '3.1', title: 'How Resellers Apply' },
      { type: 'bullets', items: [
        { label: 'Business name and contact details' },
        { label: 'Type of business (gym, retailer, online, etc.)' },
        { label: 'Expected monthly sales volume' },
        { label: 'Physical address if applicable' },
        { label: 'Agreement to the reseller terms and conditions' },
      ]},
      { type: 'sub', id: 'ch3-review', num: '3.2', title: 'Reviewing Licence Requests' },
      { type: 'p', text: 'Navigate to Admin > Licence Requests. For each pending request:' },
      { type: 'numbered', items: [
        { label: 'Review all submitted details and business information' },
        { label: 'Click Approve to create a reseller account and send welcome credentials' },
        { label: 'Click Reject to decline and notify the applicant with a reason' },
        { label: 'Request more information using the notes field' },
      ]},
      { type: 'note', text: 'Approving a licence request automatically: creates a reseller user account, generates a unique reseller code, sets up their commission tier, and sends a welcome email.' },
      { type: 'sub', id: 'ch3-manual', num: '3.3', title: 'Manual Reseller Creation' },
      { type: 'p', text: 'Admins can create reseller accounts directly without a licence request. Go to Admin > B2B Partners and click "Add Partner". Fill in the business details, set the commission tier, and create the account.' },
      { type: 'sub', id: 'ch3-settings', num: '3.4', title: 'Licence Settings' },
      { type: 'bullets', items: [
        { label: 'Licence validity period', detail: 'how long a licence is valid before renewal is required' },
        { label: 'Auto-renewal', detail: 'whether licences auto-renew or require manual renewal' },
        { label: 'Fee structure', detail: 'configure the amount and billing cycle if there is a licence fee' },
      ]},
    ]},
    { id: 'ch4', num: '4', title: 'B2B Access & Permissions', blocks: [
      { type: 'p', text: 'Admin > B2B Access controls what capabilities each reseller has. Capabilities can be toggled individually:' },
      { type: 'bullets', items: [
        { label: 'EPOS Terminal Access', detail: 'can use the point-of-sale terminal' },
        { label: 'Wholesale Ordering', detail: 'can place bulk wholesale orders' },
        { label: 'Custom Pricing', detail: 'can receive custom-negotiated product prices' },
        { label: 'Storefront', detail: 'has a public-facing storefront page on 1strep.com' },
        { label: 'B2B Invoicing', detail: 'can generate and receive formal invoices' },
        { label: 'Credit Terms', detail: 'can purchase on credit with payment terms (e.g. net 30)' },
      ]},
    ]},
    { id: 'ch5', num: '5', title: 'The EPOS Terminal', blocks: [
      { type: 'sub', id: 'ch5-access', num: '5.1', title: 'Accessing the EPOS' },
      { type: 'p', text: 'Resellers access the EPOS terminal at /reseller/epos after logging in with their reseller account. The terminal is a full-screen point-of-sale interface optimised for tablets. Keep it open in a dedicated browser tab during trading hours.' },
      { type: 'sub', id: 'ch5-browse', num: '5.2', title: 'Product Browsing on EPOS' },
      { type: 'bullets', items: [
        { label: 'Search by name or SKU', detail: 'using the search bar at the top' },
        { label: 'Filter by category', detail: 'using the category tab bar' },
        { label: 'See current stock levels', detail: 'shown on each product tile — greyed out if out of stock' },
      ]},
      { type: 'sub', id: 'ch5-basket', num: '5.3', title: 'Building a Basket' },
      { type: 'bullets', items: [
        { label: 'Click a product tile', detail: 'opens the variant selector (size and colour)' },
        { label: 'Adjust quantities', detail: 'using + and – buttons in the basket panel' },
        { label: 'Remove items', detail: 'using the bin icon next to each item' },
        { label: 'Apply a discount', detail: 'using the Add Discount button — authorised codes or manual percentage' },
      ]},
      { type: 'sub', id: 'ch5-process', num: '5.4', title: 'Processing a Sale' },
      { type: 'numbered', items: [
        { label: 'When the basket is complete, click "Charge" or "Process Sale"' },
        { label: 'Select the payment method: Card, Cash, or Other' },
        { label: 'For Card: charge the customer on your card reader and confirm in the EPOS' },
        { label: 'For Cash: enter the amount tendered — the system shows change due' },
        { label: 'Click "Confirm Sale" to complete the transaction' },
        { label: 'A receipt summary is displayed — print or email it to the customer' },
      ]},
    ]},
    { id: 'ch6', num: '6', title: 'Wholesale Orders', blocks: [
      { type: 'numbered', items: [
        { label: 'Browse products and add quantities to the wholesale basket' },
        { label: 'Review the wholesale prices (discounted from retail)' },
        { label: 'Submit the order — admin is notified to confirm' },
        { label: 'Admin approves and generates an invoice' },
        { label: 'Payment is made by the reseller against the invoice' },
        { label: 'Stock is allocated and dispatched to the reseller\'s address' },
      ]},
      { type: 'p', text: 'Admins manage wholesale orders in Admin > Wholesale Orders. Statuses: Pending, Confirmed, Invoiced, Paid, Dispatched, Delivered.' },
    ]},
    { id: 'ch7', num: '7', title: 'Commission Payouts', blocks: [
      { type: 'sub', id: 'ch7-view', num: '7.1', title: 'Viewing Pending Payouts' },
      { type: 'bullets', items: [
        { label: 'Reseller name and tier' },
        { label: 'Commission amount earned since last payout' },
        { label: 'Total sales volume the commission is based on' },
        { label: 'Scheduled payout date' },
      ]},
      { type: 'sub', id: 'ch7-process', num: '7.2', title: 'Processing a Payout' },
      { type: 'bullets', items: [
        { label: 'Approve', detail: 'marks the payout as approved and ready for payment' },
        { label: 'Pay via Stripe', detail: 'sends the payment directly to the reseller\'s Stripe connected account' },
        { label: 'Mark as Paid', detail: 'records a manual bank transfer as paid' },
        { label: 'Reject', detail: 'rejects the payout request with a reason' },
      ]},
      { type: 'sub', id: 'ch7-sched', num: '7.3', title: 'Payout Schedules' },
      { type: 'bullets', items: [
        { label: 'Weekly', detail: 'pay out every 7 days' },
        { label: 'Bi-weekly', detail: 'pay out every 14 days' },
        { label: 'Monthly', detail: 'pay out on a fixed day each month' },
        { label: 'On request', detail: 'reseller requests a payout manually when they choose' },
      ]},
    ]},
    { id: 'ch8', num: '8', title: 'Reseller Storefront', blocks: [
      { type: 'bullets', items: [
        { label: 'The reseller\'s business name and logo' },
        { label: 'A selection of 1stRep products they sell' },
        { label: 'Contact information and location' },
        { label: 'A link for customers to shop through this specific reseller' },
      ]},
      { type: 'p', text: 'The reseller configures their storefront from Reseller Dashboard > My Storefront. Admins can also edit and feature reseller storefronts from Admin > B2B Partners.' },
    ]},
    { id: 'ch9', num: '9', title: 'B2B Coupons & Promotions', blocks: [
      { type: 'bullets', items: [
        { label: 'Create a B2B coupon', detail: 'set the code, discount amount/percentage, and which resellers it applies to' },
        { label: 'Set an expiry date', detail: 'optional — coupons can have a defined validity period' },
        { label: 'Restrict to partners', detail: 'optionally limit a coupon to specific reseller accounts' },
        { label: 'View redemption history', detail: 'see which resellers have used the coupon and when' },
      ]},
    ]},
    { id: 'ch10', num: '10', title: 'Partner Analytics', blocks: [
      { type: 'grid', items: [
        'Revenue by partner over a date range',
        'Commission earned vs paid out',
        'Sales volume trend per partner (weekly/monthly)',
        'Top resellers ranked by revenue contribution',
        'Tier progression tracking',
        'EPOS transaction volume by location',
      ]},
      { type: 'p', text: 'Individual partner performance is available in Admin > Partner Management (/admin/partner-management) with full order history and commission breakdown.' },
    ]},
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// DOC 6 — Influencer Programme Complete Guide
// ════════════════════════════════════════════════════════════════════════════
export const doc6: GuideData = {
  slug: 'influencer-programme',
  docNum: '6', docTotal: '8',
  title: 'Influencer Programme', titleAccent: 'Complete Guide',
  subtitle: 'Everything about the 1stRep Influencer Programme — for influencers, admins, and the team.',
  chips: ['10 Chapters', 'Influencer & Admin', 'Last Updated Mar 2026'],
  nav: [
    { id: 'ch1', num: '1', title: 'Programme Overview & Strategy' },
    { id: 'ch2', num: '2', title: 'Applying to the Programme' },
    { id: 'ch3', num: '3', title: 'Admin: Reviewing Applications', sub: [
      { id: 'ch3-access', num: '3.1', title: 'Accessing Applications' },
      { id: 'ch3-approve', num: '3.2', title: 'Approving an Application' },
      { id: 'ch3-reject', num: '3.3', title: 'Rejecting an Application' },
    ]},
    { id: 'ch4', num: '4', title: 'Welcome Credit & Initial Setup' },
    { id: 'ch5', num: '5', title: 'Discount Codes in Detail', sub: [
      { id: 'ch5-how', num: '5.1', title: 'How Codes Work' },
      { id: 'ch5-default', num: '5.2', title: 'Default Code Variants' },
      { id: 'ch5-custom', num: '5.3', title: 'Custom Code Variants' },
    ]},
    { id: 'ch6', num: '6', title: 'Tracking Links & Visitor Analytics' },
    { id: 'ch7', num: '7', title: 'Content Credits (£25 per Post)' },
    { id: 'ch8', num: '8', title: 'Credit Redemption' },
    { id: 'ch9', num: '9', title: 'Admin Influencer Credits Panel' },
    { id: 'ch10', num: '10', title: 'Tiers & Progression' },
  ],
  chapters: [
    { id: 'ch1', num: '1', title: 'Programme Overview & Strategy', blocks: [
      { type: 'p', text: 'The 1stRep Influencer Programme rewards fitness content creators and social media personalities who promote the brand. Influencers receive welcome credit, a personalised discount code, a tracking link, and earn additional credits for every social post they submit.' },
      { type: 'bullets', items: [
        { label: 'Tracked visitors', detail: 'people who visit the website via an influencer\'s tracking link' },
        { label: 'Code conversions', detail: 'purchases made using an influencer\'s discount code' },
        { label: 'Revenue attributable', detail: 'total order value from influencer-driven purchases' },
      ]},
    ]},
    { id: 'ch2', num: '2', title: 'Applying to the Programme', blocks: [
      { type: 'p', text: 'Prospective influencers visit /athlete-program and click "Apply Now". The application form collects: full name and email, Instagram, TikTok, and YouTube handles, combined follower count, content niche, and why they want to join.' },
      { type: 'note', text: 'A minimum of 5,000 combined followers is required. The admin team has discretion to approve exceptional cases below this threshold.' },
      { type: 'p', text: 'The applicant receives an automatic acknowledgement email. Review time is up to 7 days from submission.' },
    ]},
    { id: 'ch3', num: '3', title: 'Admin: Reviewing Applications', blocks: [
      { type: 'sub', id: 'ch3-access', num: '3.1', title: 'Accessing Applications' },
      { type: 'p', text: 'Navigate to Admin > Influencer Applications. Pending applications are listed at the top with: name, email, social handles, follower count, and written message.' },
      { type: 'sub', id: 'ch3-approve', num: '3.2', title: 'Approving an Application' },
      { type: 'p', text: 'Click the Approve button. The system automatically:' },
      { type: 'numbered', items: [
        { label: 'Creates an influencer profile linked to the applicant\'s user account' },
        { label: 'Sets the initial tier to Bronze' },
        { label: 'Generates a unique tracking link slug based on their name' },
        { label: 'Creates two default discount code variants (SLUG10 and SLUG15)' },
        { label: 'Awards the £150 welcome credit and logs the transaction' },
        { label: 'Sends the influencer a welcome email with dashboard login link and code details' },
      ]},
      { type: 'sub', id: 'ch3-reject', num: '3.3', title: 'Rejecting an Application' },
      { type: 'p', text: 'Click Reject and enter a reason. The applicant receives an email notifying them their application was unsuccessful. Rejected applications are retained for 12 months.' },
    ]},
    { id: 'ch4', num: '4', title: 'Welcome Credit & Initial Setup', blocks: [
      { type: 'p', text: 'Every approved influencer receives £150 welcome credit added automatically. This credit:' },
      { type: 'bullets', items: [
        { label: 'Appears immediately in the Influencer Dashboard under Credits' },
        { label: 'Is logged as a transaction of type "welcome"' },
        { label: 'Can be redeemed immediately for clothing, vouchers, or cash payout' },
      ]},
      { type: 'note', text: 'The welcome credit is a one-time grant. If an influencer is deactivated and re-activated, the welcome credit is not re-granted.' },
    ]},
    { id: 'ch5', num: '5', title: 'Discount Codes in Detail', blocks: [
      { type: 'sub', id: 'ch5-how', num: '5.1', title: 'How Codes Work' },
      { type: 'numbered', items: [
        { label: 'Customer enters the code at checkout' },
        { label: 'System validates the code against the influencer_discount_variants table' },
        { label: 'Customer receives the configured discount (e.g. 10% off their order total)' },
        { label: 'Influencer\'s credit_balance is incremented by the configured credit percentage' },
        { label: 'A transaction of type "sale_commission" is logged' },
      ]},
      { type: 'sub', id: 'ch5-default', num: '5.2', title: 'Default Code Variants' },
      { type: 'table', headers: ['Code', 'Customer Discount', 'Influencer Credit', 'Use Case'], rows: [
        ['SLUG10', '10% off order total', '10% of order value', 'General promotion — balanced'],
        ['SLUG15', '15% off order total', '5% of order value', 'Higher discount — lower margin for influencer'],
      ]},
      { type: 'sub', id: 'ch5-custom', num: '5.3', title: 'Custom Code Variants' },
      { type: 'p', text: 'Influencers can create additional code variants from the Discount Codes tab on their dashboard. They specify: a code suffix, customer discount percentage, and influencer credit percentage.' },
      { type: 'note', text: 'Only one code variant can be active at a time. Creating a new variant deactivates the previous one.' },
    ]},
    { id: 'ch6', num: '6', title: 'Tracking Links & Visitor Analytics', blocks: [
      { type: 'p', text: 'Each influencer receives a unique tracking URL in the format: https://1strep.com/api/track/[their-slug]' },
      { type: 'p', text: 'When a visitor clicks this link, the system: increments the tracking_link_clicks counter, stores a ?ref=slug parameter in the visitor\'s session, and redirects to the 1stRep homepage. If the visitor makes a purchase within their session, it is attributed to the influencer.' },
      { type: 'bullets', items: [
        { label: 'Influencer Dashboard', detail: 'total click count shown on the Tracking Link tab' },
        { label: 'Admin > Manage Influencers', detail: 'each profile card shows "Link Clicks" in gold text' },
        { label: 'Admin Influencer Credits', detail: 'click counts alongside sales data' },
      ]},
    ]},
    { id: 'ch7', num: '7', title: 'Content Credits (£25 per Post)', blocks: [
      { type: 'numbered', items: [
        { label: 'Post on Instagram, TikTok or YouTube featuring 1stRep products' },
        { label: 'Tag @1stRepOfficial and use #1stRep in the post' },
        { label: 'Go to the Content tab of the Influencer Dashboard' },
        { label: 'Click "Submit a Post" and fill in: platform, content type, and post URL' },
        { label: '£25 credit is added to the account instantly — no admin approval needed' },
        { label: 'A transaction of type "post_approved" is logged in their credit history' },
      ]},
      { type: 'note', text: 'Credits are awarded automatically on submission. The post URL is required. Only submit posts that genuinely feature 1stRep products.' },
    ]},
    { id: 'ch8', num: '8', title: 'Credit Redemption', blocks: [
      { type: 'bullets', items: [
        { label: 'Clothing Credit', detail: 'applied as a discount code on their next 1stRep order' },
        { label: 'Gift Voucher', detail: 'converted to a gift voucher that can be given to anyone' },
        { label: 'Cash / Bank Transfer', detail: 'paid out directly to the influencer\'s bank account' },
      ]},
      { type: 'numbered', items: [
        { label: 'Click "Redeem Credits" on the Influencer Dashboard' },
        { label: 'Choose the redemption type from the three options' },
        { label: 'Enter the amount to redeem' },
        { label: 'Add notes (e.g. bank account details for cash payout)' },
        { label: 'Submit — the request goes to the admin team for processing' },
      ]},
    ]},
    { id: 'ch9', num: '9', title: 'Admin Influencer Credits Panel', blocks: [
      { type: 'p', text: 'The Admin Influencer Credits panel at /admin/influencer-credits shows:' },
      { type: 'bullets', items: [
        { label: 'Name, tier, and active discount code' },
        { label: 'Current credit balance' },
        { label: 'Total sales generated and link click count' },
        { label: 'Count of pending redemption requests' },
      ]},
      { type: 'table', headers: ['Transaction Type', 'Description'], rows: [
        ['welcome', '£150 welcome credit on approval'],
        ['sale_commission', 'Credit earned when customer uses their code'],
        ['post_approved', '£25 credit for a submitted social post'],
        ['manual', 'Manually awarded by an admin'],
        ['redemption', 'Credit deducted on redemption request approval'],
        ['ref_purchase', 'Credit from a tracking-link attributed purchase'],
      ]},
    ]},
    { id: 'ch10', num: '10', title: 'Tiers & Progression', blocks: [
      { type: 'table', headers: ['Tier', 'Default Commission', 'Typical Status'], rows: [
        ['Bronze', '10% credit on sales', 'All new influencers'],
        ['Silver', '12% credit on sales', 'Mid-level performers'],
        ['Gold', '15% credit on sales', 'High performers'],
        ['Elite', '20% credit on sales', 'Top influencers'],
      ]},
      { type: 'note', text: 'Tiers are managed manually by the admin team in Admin > Manage Influencers > Edit. There is no automatic tier progression — it is a manual upgrade decision.' },
    ]},
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// DOC 7 — CRM, Marketing & Customer Support Guide
// ════════════════════════════════════════════════════════════════════════════
export const doc7: GuideData = {
  slug: 'crm-marketing',
  docNum: '7', docTotal: '8',
  title: 'CRM, Marketing &', titleAccent: 'Customer Support',
  subtitle: 'Managing customers, running marketing campaigns, and handling support on the 1stRep platform.',
  chips: ['10 Chapters', 'Admin Role', 'Last Updated Mar 2026'],
  nav: [
    { id: 'ch1', num: '1', title: 'Customer CRM Overview' },
    { id: 'ch2', num: '2', title: 'Customer Profiles & Tags', sub: [
      { id: 'ch2-view', num: '2.1', title: 'Viewing a Customer Profile' },
      { id: 'ch2-notes', num: '2.2', title: 'Adding Notes' },
      { id: 'ch2-tags', num: '2.3', title: 'Customer Tags' },
    ]},
    { id: 'ch3', num: '3', title: 'VIP Customers' },
    { id: 'ch4', num: '4', title: 'Marketing Campaigns & Email', sub: [
      { id: 'ch4-section', num: '4.1', title: 'The Marketing Section' },
      { id: 'ch4-create', num: '4.2', title: 'Creating a Campaign' },
      { id: 'ch4-tpl', num: '4.3', title: 'Email Templates' },
    ]},
    { id: 'ch5', num: '5', title: 'Coupons & Promotions' },
    { id: 'ch6', num: '6', title: 'Smart Notifications' },
    { id: 'ch7', num: '7', title: 'Support Tickets' },
    { id: 'ch8', num: '8', title: 'Product Reviews Management' },
    { id: 'ch9', num: '9', title: 'Chatbot Management' },
    { id: 'ch10', num: '10', title: 'Popup Messages & Announcements' },
  ],
  chapters: [
    { id: 'ch1', num: '1', title: 'Customer CRM Overview', blocks: [
      { type: 'p', text: 'The 1stRep CRM is accessible from Admin > Customers. It provides a centralised view of every registered customer with their full purchase history, interactions, support tickets, and marketing engagement.' },
      { type: 'bullets', items: [
        { label: 'Customer retention', detail: 'identify loyal customers and reward them' },
        { label: 'Issue resolution', detail: 'quickly pull up a customer\'s history when they contact support' },
        { label: 'Targeted marketing', detail: 'segment customers by spend, activity, or tags' },
        { label: 'VIP management', detail: 'manually designate high-value customers for special treatment' },
      ]},
    ]},
    { id: 'ch2', num: '2', title: 'Customer Profiles & Tags', blocks: [
      { type: 'sub', id: 'ch2-view', num: '2.1', title: 'Viewing a Customer Profile' },
      { type: 'bullets', items: [
        { label: 'Personal information', detail: 'name, email, phone, registration date' },
        { label: 'Order history', detail: 'all orders with status, value, and date' },
        { label: 'Total spend', detail: 'lifetime value as a customer' },
        { label: 'Loyalty points', detail: 'current balance and tier' },
        { label: 'Interaction log', detail: 'timeline of all customer interactions' },
        { label: 'Internal notes', detail: 'private notes added by the team — visible only to admins' },
        { label: 'Tags', detail: 'labels applied to the customer for segmentation' },
      ]},
      { type: 'sub', id: 'ch2-notes', num: '2.2', title: 'Adding Notes' },
      { type: 'p', text: 'From the customer profile, scroll to the Notes section and click "Add Note". Notes are timestamped, attributed to the admin who wrote them, and visible to all admins. Use notes to record conversations, preferences, or issues resolved.' },
      { type: 'sub', id: 'ch2-tags', num: '2.3', title: 'Customer Tags' },
      { type: 'p', text: 'Tags are labels that allow you to segment customers. Examples: "VIP", "Wholesale Buyer", "Competition Winner". To add a tag, open the customer profile, click "Add Tag", and select from existing tags or create a new one. Tagged customers can be targeted in marketing campaigns.' },
    ]},
    { id: 'ch3', num: '3', title: 'VIP Customers', blocks: [
      { type: 'p', text: 'The VIP flag designates a customer as a high-value or priority customer. VIP customers may receive:' },
      { type: 'bullets', items: [
        { label: 'Faster support response times' },
        { label: 'Exclusive early access to new products' },
        { label: 'Special discount codes or vouchers' },
      ]},
      { type: 'p', text: 'To mark a customer as VIP: open their profile and click "Set VIP". To remove VIP status, click the same button again. VIP status is visible to all admins in the customer list.' },
    ]},
    { id: 'ch4', num: '4', title: 'Marketing Campaigns & Email', blocks: [
      { type: 'sub', id: 'ch4-section', num: '4.1', title: 'The Marketing Section' },
      { type: 'bullets', items: [
        { label: 'Campaign creation', detail: 'compose and schedule email campaigns to customer segments' },
        { label: 'Email templates', detail: 'reusable templates for common emails' },
        { label: 'Audience segmentation', detail: 'target by tag, spend threshold, loyalty tier, or registration date' },
        { label: 'Campaign analytics', detail: 'open rates, click rates, and unsubscribe rates' },
      ]},
      { type: 'sub', id: 'ch4-create', num: '4.2', title: 'Creating a Campaign' },
      { type: 'numbered', items: [
        { label: 'Go to Admin > Marketing and click "Create Campaign"' },
        { label: 'Enter a campaign name and subject line' },
        { label: 'Choose an email template or write the email body in the rich text editor' },
        { label: 'Select the audience (all customers, tagged customers, or specific loyalty tiers)' },
        { label: 'Choose send immediately or schedule for a future date/time' },
        { label: 'Click Send or Schedule' },
      ]},
      { type: 'warning', text: 'Test campaigns by sending to a single internal email address before sending to your full customer list. A mistake sent to thousands of customers cannot be undone.' },
      { type: 'sub', id: 'ch4-tpl', num: '4.3', title: 'Email Templates' },
      { type: 'bullets', items: [
        { label: 'Order confirmation', detail: 'sent automatically on every successful order' },
        { label: 'Shipping notification', detail: 'sent when an order is marked as Shipped' },
        { label: 'Welcome email', detail: 'sent when a new customer registers' },
        { label: 'Influencer welcome', detail: 'sent when an influencer is approved' },
        { label: 'Return approved/rejected', detail: 'sent on return request decision' },
      ]},
    ]},
    { id: 'ch5', num: '5', title: 'Coupons & Promotions', blocks: [
      { type: 'bullets', items: [
        { label: 'Code', detail: 'the string customers enter at checkout (e.g. SUMMER20)' },
        { label: 'Discount type', detail: 'percentage or fixed amount (e.g. 20% off or £10 off)' },
        { label: 'Minimum order value', detail: 'optional — code only applies above this threshold' },
        { label: 'Usage limit', detail: 'total number of times the code can be used across all customers' },
        { label: 'Per-customer limit', detail: 'how many times a single customer can use the same code' },
        { label: 'Expiry date', detail: 'optional — code stops working after this date' },
        { label: 'Active / Inactive toggle', detail: 'immediately enable or disable the code' },
      ]},
    ]},
    { id: 'ch6', num: '6', title: 'Smart Notifications', blocks: [
      { type: 'grid', items: [
        'New order placed',
        'Low stock alert',
        'New return request',
        'New influencer application',
        'New licence request',
        'Failed payment',
      ]},
      { type: 'p', text: 'Notifications appear in the admin header bell icon and can also be sent as emails to configured recipients. Mark notifications as read individually or use "Mark All Read".' },
    ]},
    { id: 'ch7', num: '7', title: 'Support Tickets', blocks: [
      { type: 'bullets', items: [
        { label: 'Subject and initial message from the customer' },
        { label: 'Status: Open, In Progress, or Resolved' },
        { label: 'Priority: Low, Medium, High, or Urgent' },
        { label: 'Assignee: which team member is handling it' },
        { label: 'Thread of messages between customer and team' },
      ]},
      { type: 'p', text: 'To respond: click the ticket, type your reply, and click Send. The customer receives an email with your reply. Close a ticket by setting the status to Resolved.' },
    ]},
    { id: 'ch8', num: '8', title: 'Product Reviews Management', blocks: [
      { type: 'bullets', items: [
        { label: 'Approve', detail: 'review becomes visible on the product page immediately' },
        { label: 'Reject', detail: 'review is hidden — the customer is not notified' },
        { label: 'Delete', detail: 'permanently removes the review' },
      ]},
      { type: 'note', text: 'Review moderation should aim for a 48-hour turnaround so customers receive timely confirmation that their review was received.' },
    ]},
    { id: 'ch9', num: '9', title: 'Chatbot Management', blocks: [
      { type: 'bullets', items: [
        { label: 'View existing knowledge entries', detail: 'FAQ-style question and answer pairs' },
        { label: 'Add new knowledge', detail: 'click "Add Knowledge" and enter a question and answer' },
        { label: 'Edit existing entries', detail: 'update answers when policies or products change' },
        { label: 'Seed from templates', detail: 'use "Seed Knowledge" to add a set of standard gymwear retail FAQs' },
      ]},
      { type: 'note', text: 'The chatbot only answers questions that match entries in the knowledge base. If customers ask questions not covered, add them to the knowledge base.' },
    ]},
    { id: 'ch10', num: '10', title: 'Popup Messages & Announcements', blocks: [
      { type: 'bullets', items: [
        { label: 'Popup Messages', detail: 'modal pop-ups that appear to visitors. Create with a title, message body, optional button text and URL, and set as active. Only one popup should be active at a time.' },
        { label: 'Announcement Banner', detail: 'a thin strip at the very top of every page. Manage in Admin > Settings > Announcement Banner. Set message text, background colour, and text colour. Toggle on or off.' },
      ]},
    ]},
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// DOC 8 — Platform Administration & Settings Guide
// (Same content as AdminGuideSettings.tsx but in data format)
// ════════════════════════════════════════════════════════════════════════════
export const doc8: GuideData = {
  slug: 'platform-admin-settings',
  docNum: '8', docTotal: '8',
  title: 'Administration &', titleAccent: 'Settings Guide',
  subtitle: 'System-wide configuration, team management, homepage content, reports, and platform settings.',
  chips: ['10 Chapters', 'Admin Role Required', 'Last Updated Mar 2026'],
  nav: [
    { id: 'ch1', num: '1', title: 'Admin Dashboard Overview', sub: [
      { id: 'ch1-sidebar', num: '1.1', title: 'Sidebar Section Reference' },
    ]},
    { id: 'ch2', num: '2', title: 'Site Settings & Appearance', sub: [
      { id: 'ch2-general', num: '2.1', title: 'General Settings' },
      { id: 'ch2-banner', num: '2.2', title: 'Announcement Banner' },
      { id: 'ch2-theme', num: '2.3', title: 'Theme' },
      { id: 'ch2-email-tpl', num: '2.4', title: 'Email Templates' },
    ]},
    { id: 'ch3', num: '3', title: 'Hero Images & Videos', sub: [
      { id: 'ch3-images', num: '3.1', title: 'Hero Images' },
      { id: 'ch3-videos', num: '3.2', title: 'Hero Videos' },
    ]},
    { id: 'ch4', num: '4', title: 'Team Management', sub: [
      { id: 'ch4-roles', num: '4.1', title: 'Role Reference Table' },
    ]},
    { id: 'ch5', num: '5', title: 'Document Library', sub: [
      { id: 'ch5-upload', num: '5.1', title: 'Uploading a Document' },
      { id: 'ch5-download', num: '5.2', title: 'Downloading' },
      { id: 'ch5-delete', num: '5.3', title: 'Deleting' },
    ]},
    { id: 'ch6', num: '6', title: 'Community Events' },
    { id: 'ch7', num: '7', title: 'Reports & Business Intelligence', sub: [
      { id: 'ch7-sales', num: '7.1', title: 'Sales Reports' },
      { id: 'ch7-product', num: '7.2', title: 'Product Reports' },
      { id: 'ch7-customer', num: '7.3', title: 'Customer Reports' },
      { id: 'ch7-influencer', num: '7.4', title: 'Influencer Reports' },
      { id: 'ch7-b2b', num: '7.5', title: 'B2B / Reseller Reports' },
    ]},
    { id: 'ch8', num: '8', title: 'Loyalty Programme Config' },
    { id: 'ch9', num: '9', title: 'Vendor Portal' },
    { id: 'ch10', num: '10', title: 'Security & Maintenance', sub: [
      { id: 'ch10-session', num: '10.1', title: 'Session & Auth' },
      { id: 'ch10-env', num: '10.2', title: 'Environment Variables' },
      { id: 'ch10-backup', num: '10.3', title: 'Database Backups' },
      { id: 'ch10-maint', num: '10.4', title: 'Maintenance Mode' },
    ]},
  ],
  chapters: [
    { id: 'ch1', num: '1', title: 'Admin Dashboard Overview', blocks: [
      { type: 'p', text: 'The Admin Dashboard at /admin is the control centre for the entire 1stRep platform. Accessible only to users with the admin role, it is divided into sections via the collapsible left sidebar.' },
      { type: 'sub', id: 'ch1-sidebar', num: '1.1', title: 'Sidebar Section Reference' },
      { type: 'table', headers: ['Sidebar Section', 'What It Covers'], rows: [
        ['Overview', 'Key platform KPIs at a glance'],
        ['Orders', 'All customer, EPOS, and wholesale orders'],
        ['Reports', 'Revenue, performance, and analytics reports'],
        ['B2B Partners', 'Reseller management'],
        ['B2B Access', 'Reseller capability permissions'],
        ['Licence Requests', 'Reseller programme applications'],
        ['Wholesale Orders', 'Bulk purchase orders from resellers'],
        ['Commission Payouts', 'Earning payouts for reseller partners'],
        ['Partner Analytics', 'Performance data per B2B partner'],
        ['Products', 'Product catalogue management'],
        ['Categories', 'Product category structure'],
        ['Product Sections', 'Homepage curated sections'],
        ['Activity Types', 'Sport/activity tags for products'],
        ['Coupons', 'Discount codes for promotions'],
        ['Inventory', 'Stock levels across warehouses'],
        ['Warehouses', 'Warehouse location management'],
        ['Store Locations', 'Public-facing store locator entries'],
        ['Add Inventory', 'Record new stock arrivals'],
        ['Image Manager', 'Product image library'],
        ['Customers (CRM)', 'Customer profiles and history'],
        ['Marketing', 'Email campaigns and templates'],
        ['Support Tickets', 'Customer support queue'],
        ['Return Requests', 'Return and refund management'],
        ['Reviews', 'Product review moderation'],
        ['Chatbot', 'AI chatbot knowledge base'],
        ['Popup Messages', 'Website popup management'],
        ['Influencer Applications', 'New influencer programme applications'],
        ['Manage Influencers', 'Active influencer profiles'],
        ['Influencer Content', 'Submitted social post log'],
        ['Influencer Credits', 'Credit balances and redemptions'],
        ['Community Events', 'Events shown on the website'],
        ['Team', 'Internal team member management'],
        ['Document Library', 'Team document repository'],
        ['Settings', 'Platform-wide configuration'],
      ]},
    ]},
    { id: 'ch2', num: '2', title: 'Site Settings & Appearance', blocks: [
      { type: 'sub', id: 'ch2-general', num: '2.1', title: 'General Settings' },
      { type: 'bullets', items: [
        { label: 'Site name', detail: 'displayed in browser tab titles and emails' },
        { label: 'Contact email', detail: 'the from-address for all system emails' },
        { label: 'Default currency', detail: 'currently GBP — do not change without developer involvement' },
        { label: 'Free shipping threshold', detail: 'orders above this value qualify for free shipping' },
      ]},
      { type: 'sub', id: 'ch2-banner', num: '2.2', title: 'Announcement Banner' },
      { type: 'p', text: 'Toggle the top-of-page announcement banner on/off. Set the banner message, background colour, and text colour. Changes take effect immediately for all visitors.' },
      { type: 'sub', id: 'ch2-theme', num: '2.3', title: 'Theme' },
      { type: 'p', text: 'The platform uses the clean_minimal theme. Do not change the theme setting without developer review, as it affects the entire visual design system.' },
      { type: 'sub', id: 'ch2-email-tpl', num: '2.4', title: 'Email Templates' },
      { type: 'bullets', items: [
        { label: 'Order confirmation', detail: 'sent automatically on every successful order' },
        { label: 'Shipping notification', detail: 'sent when an order is marked as Shipped' },
        { label: 'Welcome email', detail: 'sent when a new customer registers' },
        { label: 'Influencer welcome', detail: 'sent when an influencer is approved' },
        { label: 'Return approved/rejected', detail: 'sent on return request decision' },
        { label: 'Password reset', detail: 'sent when a customer requests a password reset' },
      ]},
    ]},
    { id: 'ch3', num: '3', title: 'Hero Images & Videos', blocks: [
      { type: 'sub', id: 'ch3-images', num: '3.1', title: 'Hero Images' },
      { type: 'numbered', items: [
        { label: 'Click "Add Hero Image" to upload a new image' },
        { label: 'Enter a title and optional subtitle that appears over the image' },
        { label: 'Add a call-to-action button text and URL' },
        { label: 'Set the display order using drag-and-drop reordering' },
        { label: 'Toggle individual images active or inactive' },
      ]},
      { type: 'note', text: 'Hero images should be high-resolution and landscape-oriented (minimum 1920×1080px). A dark gradient overlay is applied automatically for readability.' },
      { type: 'sub', id: 'ch3-videos', num: '3.2', title: 'Hero Videos' },
      { type: 'p', text: 'Manage in Admin > Hero Videos. Videos should be in MP4 format and compressed for web (under 20MB). Videos can be reordered and toggled on/off.' },
    ]},
    { id: 'ch4', num: '4', title: 'Team Management', blocks: [
      { type: 'sub', id: 'ch4-roles', num: '4.1', title: 'Role Reference Table' },
      { type: 'table', headers: ['Role', 'Access'], rows: [
        ['admin', 'Full access to all admin sections'],
        ['staff', 'Limited access — can view orders and customers but cannot change settings'],
        ['vendor', 'Access to vendor portal only'],
        ['reseller', 'Access to EPOS terminal and reseller dashboard only'],
        ['influencer', 'Access to influencer dashboard only'],
        ['customer', 'Access to customer storefront and account only'],
      ]},
      { type: 'warning', text: 'Role changes take effect immediately. Assigning the "admin" role gives full unrestricted access to the entire platform. Only assign this role to trusted senior team members.' },
    ]},
    { id: 'ch5', num: '5', title: 'Document Library', blocks: [
      { type: 'p', text: 'Admin > Document Library (/admin/documents) is a shared repository of internal documents. All logged-in staff members can view and download. Only admins can upload or delete.' },
      { type: 'sub', id: 'ch5-upload', num: '5.1', title: 'Uploading a Document' },
      { type: 'numbered', items: [
        { label: 'Navigate to /admin/documents and click "Upload Document"' },
        { label: 'Enter a document title and optional description' },
        { label: 'Select a category: General, Training, Influencer, Reseller, Legal, etc.' },
        { label: 'Select the file (PDF, DOCX, XLSX, or other supported formats)' },
        { label: 'Click Upload — the document appears in the library immediately' },
      ]},
      { type: 'sub', id: 'ch5-download', num: '5.2', title: 'Downloading a Document' },
      { type: 'p', text: 'Click "Download" on any document. The file is retrieved from object storage and downloaded to your device with the original filename.' },
      { type: 'sub', id: 'ch5-delete', num: '5.3', title: 'Deleting a Document' },
      { type: 'warning', text: 'Deleted documents cannot be recovered — ensure you have a backup copy before deleting.' },
    ]},
    { id: 'ch6', num: '6', title: 'Community Events', blocks: [
      { type: 'bullets', items: [
        { label: 'Title and description' },
        { label: 'Date and time' },
        { label: 'Location', detail: 'venue name and full address' },
        { label: 'Event type', detail: 'e.g. Competition, Community Workout, Brand Collaboration' },
        { label: 'Optional event image' },
        { label: 'RSVP / Ticket link', detail: 'optional URL for external booking' },
        { label: 'Active toggle', detail: 'hide an event from the website without deleting it' },
      ]},
      { type: 'note', text: 'Create events well in advance to give customers time to plan. Past events are automatically removed from the public events page but remain in the admin view.' },
    ]},
    { id: 'ch7', num: '7', title: 'Reports & Business Intelligence', blocks: [
      { type: 'sub', id: 'ch7-sales', num: '7.1', title: 'Sales Reports' },
      { type: 'grid', items: ['Total revenue by date range', 'Orders by channel (online, EPOS, wholesale)', 'Average order value over time', 'Revenue by product category', 'Refund and cancellation rate'] },
      { type: 'sub', id: 'ch7-product', num: '7.2', title: 'Product Reports' },
      { type: 'grid', items: ['Best-selling products by unit and revenue', 'Slow-moving stock report', 'Product performance over time', 'Variant-level analysis (which sizes and colours sell most)'] },
      { type: 'sub', id: 'ch7-customer', num: '7.3', title: 'Customer Reports' },
      { type: 'grid', items: ['New vs returning customer split', 'Customer lifetime value distribution', 'Loyalty programme engagement rates', 'Geographic breakdown of orders'] },
      { type: 'sub', id: 'ch7-influencer', num: '7.4', title: 'Influencer Programme Reports' },
      { type: 'grid', items: ['Revenue attributable to influencer codes', 'Tracking link clicks per influencer', 'Content submissions over time', 'Credits awarded vs credits redeemed'] },
      { type: 'sub', id: 'ch7-b2b', num: '7.5', title: 'B2B / Reseller Reports' },
      { type: 'grid', items: ['Revenue by reseller partner', 'Commission earned vs paid', 'EPOS transaction volume by location', 'Wholesale order fulfilment times'] },
    ]},
    { id: 'ch8', num: '8', title: 'Loyalty Programme Configuration', blocks: [
      { type: 'bullets', items: [
        { label: 'Points per £ spent', detail: 'how many loyalty points are earned per pound of purchase' },
        { label: 'Points value', detail: 'what each loyalty point is worth when redeemed (e.g. 1 point = £0.01)' },
        { label: 'Tier thresholds', detail: 'cumulative points needed to reach each tier' },
        { label: 'Tier rewards', detail: 'what each tier unlocks (e.g. Gold tier gets 2× points per purchase)' },
        { label: 'Expiry policy', detail: 'whether points expire after a period of inactivity' },
      ]},
      { type: 'table', headers: ['Tier', 'Points Threshold', 'Benefits'], rows: [
        ['Bronze', '0 points', 'Entry level — base earn rate'],
        ['Silver', '500 points', '1.25× earn multiplier'],
        ['Gold', '1,500 points', '1.5× earn multiplier + early access to sales'],
        ['Platinum', '5,000 points', '2× earn multiplier + exclusive rewards'],
      ]},
    ]},
    { id: 'ch9', num: '9', title: 'Vendor Portal', blocks: [
      { type: 'bullets', items: [
        { label: 'View their products listed on 1stRep' },
        { label: 'Upload and manage product images' },
        { label: 'View sales analytics for their own products' },
        { label: 'Request price changes or product updates' },
      ]},
      { type: 'p', text: 'A vendor account is a user with the "vendor" role. Vendors cannot access any customer data, orders from other vendors, or admin settings.' },
    ]},
    { id: 'ch10', num: '10', title: 'Security & Maintenance', blocks: [
      { type: 'sub', id: 'ch10-session', num: '10.1', title: 'Session & Authentication' },
      { type: 'p', text: 'Server-side sessions stored in PostgreSQL. Sessions expire after a configurable timeout. Passwords hashed using bcrypt. OAuth (Google login) handled by Passport.js.' },
      { type: 'sub', id: 'ch10-env', num: '10.2', title: 'Environment Variables' },
      { type: 'table', headers: ['Variable', 'Purpose'], rows: [
        ['DATABASE_URL', 'PostgreSQL connection string'],
        ['SESSION_SECRET', 'Signs session cookies — must be a long random string'],
        ['STRIPE_SECRET_KEY', 'Stripe API secret for payment processing'],
        ['STRIPE_PUBLISHABLE_KEY', 'Stripe public key for frontend'],
        ['STRIPE_WEBHOOK_SECRET', 'Validates incoming Stripe webhook events'],
        ['SENDGRID_API_KEY', 'Sends transactional emails via SendGrid'],
        ['DEFAULT_OBJECT_STORAGE_BUCKET_ID', 'Replit object storage bucket for file uploads'],
        ['GOOGLE_CLIENT_ID', 'Google OAuth app client ID'],
        ['GOOGLE_CLIENT_SECRET', 'Google OAuth app client secret'],
      ]},
      { type: 'sub', id: 'ch10-backup', num: '10.3', title: 'Database Backups' },
      { type: 'p', text: 'The Replit PostgreSQL database is backed up automatically by the platform. For critical operations (major schema changes, mass data imports), always request a manual backup snapshot before proceeding.' },
      { type: 'sub', id: 'ch10-maint', num: '10.4', title: 'Maintenance Mode' },
      { type: 'p', text: 'There is no built-in maintenance mode toggle. Coordinate with the development team (Qanzak Global) to take the platform offline for maintenance.' },
      { type: 'warning', text: 'Never take the platform offline during peak trading hours without advance notice to the reseller network. Always schedule maintenance for early morning (3–5 AM GMT).' },
    ]},
  ],
};

// ─── Index ───────────────────────────────────────────────────────────────────
export const ALL_GUIDES: GuideData[] = [doc1, doc2, doc3, doc4, doc5, doc6, doc7, doc8];

export const GUIDE_BY_SLUG = Object.fromEntries(ALL_GUIDES.map(g => [g.slug, g]));
