import PDFDocument from 'pdfkit';
import { Client } from '@replit/object-storage';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || 'replit-objstore-1ddee8e0-6dd7-4c50-a942-b80ccf4dddaa';
const objClient = new Client({ bucketId });

// ─── COLOURS ────────────────────────────────
const BLACK  = '#0D0D0D';
const GOLD   = '#C9A84C';
const CHALK  = '#F5F5F0';
const GREY   = '#555555';
const LGREY  = '#888888';
const NOTEbg = '#FFFBEF';
const NOTEBC = NOTEbg;
const NOTEBORDER = '#C9A84C';
const WARNBG = '#FFF0F0';

// ─── PDF BUILDER HELPER ──────────────────────
function buildPdf(fn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 55, size: 'A4', bufferPages: true, info: { Creator: '1stRep Platform', Author: 'Qanzak Global' } });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    fn(doc);
    doc.end();
  });
}

// ─── LAYOUT HELPERS ──────────────────────────
function drawHeader(doc, title, subtitle, docNum, total) {
  const W = doc.page.width;
  // Black banner
  doc.rect(0, 0, W, 108).fill(BLACK);
  // Thin gold accent line
  doc.rect(0, 108, W, 2).fill(GOLD);
  // Logo wordmark
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(28).text('1ST', 55, 28, { continued: true });
  doc.fillColor(GOLD).text('REP');
  // Tagline
  doc.fillColor('#888888').font('Helvetica').fontSize(8.5)
     .text('OFFICIAL PLATFORM GUIDE', 55, 64);
  // Doc counter badge (top right)
  const badge = `Doc ${docNum} / ${total}`;
  doc.fillColor('#888888').font('Helvetica').fontSize(8)
     .text(badge, W - 180, 34, { width: 130, align: 'right' });
  doc.fillColor('#666666').fontSize(7.5)
     .text('Qanzak Global  •  Confidential', W - 180, 48, { width: 130, align: 'right' });

  // Title block (below banner)
  doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(22).text(title, 55, 130);
  doc.fillColor(GREY).font('Helvetica').fontSize(11).text(subtitle, 55, doc.y + 3, { width: W - 110 });
  // Thin gold rule
  doc.moveDown(0.7);
  doc.moveTo(55, doc.y).lineTo(W - 55, doc.y).strokeColor(GOLD).lineWidth(1).stroke();
  doc.moveDown(1);
  doc.fillColor(BLACK).font('Helvetica').fontSize(10.5);
}

function chapterTitle(doc, num, text) {
  doc.addPage();
  const W = doc.page.width;
  const y = doc.y;
  // Badge circle (filled black)
  const cx = 55 + 12, cy = y + 12;
  doc.circle(cx, cy, 12).fill(BLACK);
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(10)
     .text(String(num), cx - 9, cy - 6, { width: 18, align: 'center' });
  // Chapter title text
  doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(15)
     .text(text, 80, y + 4);
  // Thin gold underline
  doc.moveTo(55, doc.y + 3).lineTo(W - 55, doc.y + 3).strokeColor(GOLD).lineWidth(0.7).stroke();
  doc.moveDown(0.9);
  doc.fillColor(BLACK).font('Helvetica').fontSize(10.5);
}

function sectionTitle(doc, text) {
  doc.moveDown(0.8);
  doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(12).text(text);
  doc.moveTo(55, doc.y + 1).lineTo(doc.page.width - 55, doc.y + 1)
     .strokeColor('#E8E0CC').lineWidth(0.6).stroke();
  doc.moveDown(0.4);
  doc.fillColor(BLACK).font('Helvetica').fontSize(10.5);
}

function subSection(doc, text) {
  doc.moveDown(0.5);
  doc.fillColor('#444444').font('Helvetica-Bold').fontSize(10.5).text(text);
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(10.5);
}

function body(doc, text) {
  doc.fillColor('#333333').font('Helvetica').fontSize(10.5).text(text, { lineGap: 2.5 });
  doc.moveDown(0.35);
}

function bullet(doc, label, detail) {
  if (detail) {
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(10.5).text('\u2022  ', { continued: true });
    doc.fillColor(BLACK).font('Helvetica-Bold').text(`${label}`, { continued: true });
    doc.fillColor('#555555').font('Helvetica').text(` \u2014 ${detail}`, { lineGap: 2 });
  } else {
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(10.5).text('\u2022  ', { continued: true });
    doc.fillColor(BLACK).font('Helvetica').text(label, { lineGap: 2 });
  }
}

function numbered(doc, n, label, detail) {
  if (detail) {
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(10.5).text(`${n}.  `, { continued: true });
    doc.fillColor(BLACK).font('Helvetica-Bold').text(`${label}`, { continued: true });
    doc.fillColor('#555555').font('Helvetica').text(`: ${detail}`, { lineGap: 2 });
  } else {
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(10.5).text(`${n}.  `, { continued: true });
    doc.fillColor(BLACK).font('Helvetica').text(label, { lineGap: 2 });
  }
}

function note(doc, text) {
  doc.moveDown(0.5);
  const W = doc.page.width;
  const boxW = W - 110;
  const startY = doc.y;
  // Estimate height based on text
  const lines = Math.ceil(text.length / 90) + 1;
  const boxH = Math.max(30, lines * 14 + 12);
  // Amber left accent bar
  doc.rect(55, startY, 3, boxH).fill(GOLD);
  // Amber background
  doc.rect(58, startY, boxW - 3, boxH).fill('#FFFBEC');
  // Label
  doc.fillColor('#92600A').font('Helvetica-Bold').fontSize(8)
     .text('NOTE', 70, startY + 6);
  // Text
  doc.fillColor('#5A3E0A').font('Helvetica').fontSize(9.5)
     .text(text, 70, startY + 17, { width: boxW - 24, lineGap: 2 });
  doc.y = startY + boxH + 6;
  doc.fillColor(BLACK).font('Helvetica').fontSize(10.5);
}

function warning(doc, text) {
  doc.moveDown(0.5);
  const W = doc.page.width;
  const boxW = W - 110;
  const startY = doc.y;
  const lines = Math.ceil(text.length / 90) + 1;
  const boxH = Math.max(30, lines * 14 + 12);
  // Red left accent bar
  doc.rect(55, startY, 3, boxH).fill('#CC0000');
  // Red tint background
  doc.rect(58, startY, boxW - 3, boxH).fill('#FFF1F1');
  doc.fillColor('#8B0000').font('Helvetica-Bold').fontSize(8)
     .text('IMPORTANT', 70, startY + 6);
  doc.fillColor('#6B0000').font('Helvetica').fontSize(9.5)
     .text(text, 70, startY + 17, { width: boxW - 24, lineGap: 2 });
  doc.y = startY + boxH + 6;
  doc.fillColor(BLACK).font('Helvetica').fontSize(10.5);
}

function table(doc, headers, rows) {
  const W = doc.page.width;
  const colW = (W - 110) / headers.length;
  const startX = 55;
  let y = doc.y;
  // Header row — dark background
  doc.rect(startX, y, W - 110, 22).fill(BLACK);
  headers.forEach((h, i) => {
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(8.5)
       .text(h.toUpperCase(), startX + i * colW + 6, y + 6, { width: colW - 12 });
  });
  y += 22;
  // Data rows
  rows.forEach((row, ri) => {
    const rowH = 20;
    doc.rect(startX, y, W - 110, rowH).fill(ri % 2 === 0 ? CHALK : '#FFFFFF');
    row.forEach((cell, ci) => {
      doc.fillColor('#222222').font('Helvetica').fontSize(9)
         .text(String(cell), startX + ci * colW + 6, y + 5, { width: colW - 12, lineGap: 1 });
    });
    y += rowH;
  });
  // Bottom border
  doc.moveTo(startX, y).lineTo(W - 55, y).strokeColor('#DDDDDD').lineWidth(0.5).stroke();
  doc.y = y + 10;
}

function drawFooters(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // Thin gold line above footer
    doc.moveTo(55, doc.page.height - 30).lineTo(doc.page.width - 55, doc.page.height - 30)
       .strokeColor('#C9A84C').lineWidth(0.5).stroke();
    doc.fillColor('#AAAAAA').font('Helvetica').fontSize(7.5)
       .text(
         `1stRep  \u2022  Confidential Internal Documentation  \u2022  Qanzak Global  \u2022  Page ${i + 1}`,
         0, doc.page.height - 22, { align: 'center', width: doc.page.width }
       );
  }
}

async function uploadAndRegister(buffer, fileName, title, description, category) {
  // Delete old version if exists
  try {
    await pool.query(`DELETE FROM team_documents WHERE file_name = $1`, [fileName]);
  } catch (_) {}

  const objectPath = `team-documents/${Date.now()}-${fileName}`;
  const result = await objClient.uploadFromBytes(objectPath, buffer);
  if (!result.ok) throw new Error(`Upload failed: ${result.error?.message}`);

  await pool.query(
    `INSERT INTO team_documents (title, description, category, file_name, file_type, file_size, object_path, uploaded_by_name)
     VALUES ($1,$2,$3,$4,'application/pdf',$5,$6,'1stRep System')`,
    [title, description, category, fileName, buffer.length, objectPath]
  );
  console.log(`  ✅  ${title}`);
}

// ══════════════════════════════════════════════════════════════════
// DOCUMENT 1 — Platform Overview & Getting Started
// ══════════════════════════════════════════════════════════════════
async function doc1() {
  const buf = await buildPdf(doc => {
    drawHeader(doc, 'Platform Overview & Getting Started', 'The complete introduction to the 1stRep multi-sided platform', '1', '8');

    // TOC
    sectionTitle(doc, 'Contents of This Document');
    body(doc, 'Chapter 1 — What is 1stRep?\nChapter 2 — Strategic Positioning\nChapter 3 — Platform Architecture\nChapter 4 — User Roles & Permissions\nChapter 5 — Key URLs & Navigation\nChapter 6 — Brand Identity & Standards\nChapter 7 — Tech Stack Overview\nChapter 8 — First-Time Setup Checklist');

    chapterTitle(doc, 1, 'What is 1stRep?');
    body(doc, '1stRep is a premium gymwear and activewear brand built for serious athletes, fitness professionals, and lifestyle consumers. The digital platform, developed and maintained by Qanzak Global, serves three distinct audiences simultaneously:');
    bullet(doc, 'Customers', 'people who shop directly from the online storefront');
    bullet(doc, 'Resellers', 'gym owners, retailers, and partners who sell through physical EPOS terminals');
    bullet(doc, 'Influencers', 'content creators who promote 1stRep on social media in return for credits and commissions');
    doc.moveDown(0.3);
    body(doc, 'The platform is fully integrated — orders from all three channels flow into the same fulfilment system, inventory is shared, and analytics are unified.');

    chapterTitle(doc, 2, 'Strategic Positioning');
    body(doc, 'The commercial strategy for 1stRep is:');
    bullet(doc, '70% Reseller Acquisition', 'primary growth via B2B partnerships with gyms, sports retailers, and fitness centres who use the EPOS terminal to sell in-person');
    bullet(doc, '30% Direct-to-Consumer (DTC)', 'online storefront and influencer-driven traffic for individual purchases');
    doc.moveDown(0.3);
    body(doc, 'This means reseller partner onboarding, EPOS reliability, and wholesale order fulfilment are the highest-priority operational areas. The influencer programme supports DTC by driving tracked website traffic and conversions through personalised discount codes and tracking links.');

    chapterTitle(doc, 3, 'Platform Architecture');
    sectionTitle(doc, '3.1 Frontend');
    body(doc, 'The frontend is a React single-page application (SPA) built with Vite and TypeScript. It uses TanStack Query for server-state management, Wouter for client-side routing, and shadcn/ui with Tailwind CSS for the design system. All pages are served from the same Express server with Vite in development and from the /dist/public directory in production.');

    sectionTitle(doc, '3.2 Backend');
    body(doc, 'The backend is an Express.js API written in TypeScript. It handles all business logic, authentication, payment processing, and database operations. Sessions are managed server-side using express-session with PostgreSQL storage.');

    sectionTitle(doc, '3.3 Database');
    body(doc, 'PostgreSQL is the primary database, accessed via the Drizzle ORM. All tables use either UUID or serial primary keys. The database includes tables for: users, products, orders, inventory, resellers, influencers, CRM, documents, events, and many more.');

    sectionTitle(doc, '3.4 Object Storage');
    body(doc, 'Replit Object Storage is used for all file uploads — product images, documents, vendor assets. Files are stored in a single bucket with the following directory structure:');
    bullet(doc, 'team-documents/', 'internal team guides and documents');
    bullet(doc, 'public/', 'publicly accessible assets like product images');
    bullet(doc, '.private/', 'private assets like vendor uploads');

    sectionTitle(doc, '3.5 Payments');
    body(doc, 'Stripe is the payment processor for all customer transactions. Square is used as a secondary payment processor for reseller EPOS transactions. Email is sent via SendGrid.');

    chapterTitle(doc, 4, 'User Roles & Permissions');
    table(doc,
      ['Role', 'Access Level', 'Primary Location'],
      [
        ['Customer', 'Shop, wishlist, orders, reviews', '/shop-clean, /account'],
        ['Reseller', 'EPOS terminal, storefront, wholesale orders', '/reseller/epos, /reseller/dashboard'],
        ['Influencer', 'Credits, discount codes, tracking', '/influencer-dashboard'],
        ['Vendor', 'Own products, analytics, images', '/vendor'],
        ['Admin', 'Full platform access', '/admin'],
      ]
    );
    note(doc, 'Admin accounts cannot be created through the platform UI — they must be set directly in the database by a developer.');

    chapterTitle(doc, 5, 'Key URLs & Navigation');
    table(doc,
      ['Section', 'URL', 'Who Uses It'],
      [
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
      ]
    );

    chapterTitle(doc, 6, 'Brand Identity & Standards');
    sectionTitle(doc, '6.1 Colours');
    bullet(doc, 'Brand Black #0D0D0D', 'primary background, headers, main text');
    bullet(doc, 'Brand Gold #C9A84C', 'accents, calls to action, highlights — maximum 15% of any layout');
    bullet(doc, 'Chalk White #F5F5F0', 'light background surfaces');
    bullet(doc, 'Never use bright white #FFFFFF', 'always use chalk white for backgrounds');

    sectionTitle(doc, '6.2 Typography');
    bullet(doc, 'Display / Headings', 'Bebas Neue — used for large titles and hero text');
    bullet(doc, 'Body / UI', 'Inter — used for all body copy, labels, and UI text');

    sectionTitle(doc, '6.3 Writing Style');
    bullet(doc, 'Brand name', 'always written as "1stRep" — never "1st Rep" or "FirstRep"');
    bullet(doc, 'Programme naming', '"Influencer Programme" — never "Athlete Programme" or "Ambassador Programme"');
    bullet(doc, 'Currency', 'always use £ (GBP) with two decimal places for amounts');

    chapterTitle(doc, 7, 'Tech Stack Overview');
    table(doc,
      ['Layer', 'Technology'],
      [
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
        ['Real-time', 'WebSocket (socket.io)'],
      ]
    );

    chapterTitle(doc, 8, 'First-Time Setup Checklist');
    body(doc, 'When setting up a new environment or handing over to a new team:');
    numbered(doc, 1, 'Set all required environment variables', 'DATABASE_URL, STRIPE_SECRET_KEY, SENDGRID_API_KEY, SESSION_SECRET, DEFAULT_OBJECT_STORAGE_BUCKET_ID');
    numbered(doc, 2, 'Run database migrations', 'npm run db:push in the project root');
    numbered(doc, 3, 'Seed the database', 'the server seeds automatically on first start');
    numbered(doc, 4, 'Create the first admin account', 'register a user then update their role to "admin" in the database');
    numbered(doc, 5, 'Configure Stripe webhook', 'point stripe webhook to /api/webhook/stripe');
    numbered(doc, 6, 'Upload product images', 'use the Image Manager in Admin > Image Manager');
    numbered(doc, 7, 'Add reseller accounts', 'use Admin > B2B Partners > Add Partner');
    numbered(doc, 8, 'Configure announcement banner', 'Admin > Settings > Announcement Banner');

    drawFooters(doc);
  });
  await uploadAndRegister(buf, 'platform-overview.pdf', 'Platform Overview & Getting Started', 'Complete introduction to 1stRep: architecture, roles, URLs, brand standards, and setup checklist', 'general');
}

// ══════════════════════════════════════════════════════════════════
// DOCUMENT 2 — Customer Storefront Guide
// ══════════════════════════════════════════════════════════════════
async function doc2() {
  const buf = await buildPdf(doc => {
    drawHeader(doc, 'Customer Storefront Guide', 'Everything a customer needs to shop, manage orders, and use their account on 1stRep', '2', '8');

    sectionTitle(doc, 'Contents');
    body(doc, 'Chapter 1 — Creating & Managing an Account\nChapter 2 — Browsing & Searching Products\nChapter 3 — The Shopping Cart\nChapter 4 — Discount Codes & Promotions\nChapter 5 — Checkout & Payment\nChapter 6 — Orders & Tracking\nChapter 7 — Returns & Refunds\nChapter 8 — Wishlist\nChapter 9 — Product Reviews\nChapter 10 — Loyalty Programme');

    chapterTitle(doc, 1, 'Creating & Managing an Account');
    sectionTitle(doc, '1.1 Registration');
    body(doc, 'New customers can register by clicking Sign Up in the top navigation bar. Required fields are:');
    bullet(doc, 'First name and last name');
    bullet(doc, 'Email address (used for order confirmations and login)');
    bullet(doc, 'Password (minimum 8 characters)');
    body(doc, 'Alternatively, customers can sign in with their Google account using the "Continue with Google" button, which skips the registration form entirely.');
    note(doc, 'Email addresses must be unique. If a customer tries to register with an email already in use, they will be prompted to log in instead.');

    sectionTitle(doc, '1.2 Logging In');
    body(doc, 'Navigate to /login. Enter the registered email and password and click Sign In. If the customer has forgotten their password, they can use the "Forgot Password" link to receive a reset email.');

    sectionTitle(doc, '1.3 Account Settings');
    body(doc, 'From the account menu (top right), customers can:');
    bullet(doc, 'Update their name, email, and phone number');
    bullet(doc, 'Change their password');
    bullet(doc, 'Save and manage delivery addresses');
    bullet(doc, 'View their loyalty points balance');
    bullet(doc, 'Set marketing email preferences');

    chapterTitle(doc, 2, 'Browsing & Searching Products');
    sectionTitle(doc, '2.1 Storefront Navigation');
    body(doc, 'The main shop is at /shop-clean. Products are displayed in a responsive grid layout. The page auto-loads more products as the customer scrolls (infinite scroll).');

    sectionTitle(doc, '2.2 Filtering & Sorting');
    body(doc, 'Customers can narrow results using the left sidebar filter panel:');
    bullet(doc, 'Category', 'filter by product type (e.g. shorts, tops, accessories)');
    bullet(doc, 'Colour', 'filter by available colour options');
    bullet(doc, 'Size', 'filter by size — only sizes with stock in any variant are shown');
    bullet(doc, 'Activity Type', 'filter by sport or use-case (e.g. CrossFit, Running, HIIT)');
    bullet(doc, 'Price Range', 'set a minimum and maximum price');
    body(doc, 'Sort options include: Newest, Price Low to High, Price High to Low, and Most Popular.');

    sectionTitle(doc, '2.3 Product Detail Page');
    body(doc, 'Clicking a product opens its detail page which shows:');
    bullet(doc, 'Product name, description, and full specification');
    bullet(doc, 'All colour variants with a colour swatch selector');
    bullet(doc, 'All size options — greyed out sizes are out of stock');
    bullet(doc, 'Current stock level indicator (In Stock / Low Stock / Out of Stock)');
    bullet(doc, 'Product images with zoom on hover');
    bullet(doc, 'A size guide link');
    bullet(doc, 'Related products section');
    bullet(doc, 'Customer reviews section');

    chapterTitle(doc, 3, 'The Shopping Cart');
    body(doc, 'When a customer clicks "Add to Cart", the item is immediately added to their persistent cart (stored server-side). The cart icon in the header shows the current item count and updates in real time.');
    body(doc, 'From the cart panel, customers can:');
    bullet(doc, 'Increase or decrease quantities for each item');
    bullet(doc, 'Remove individual items');
    bullet(doc, 'See the subtotal update live as quantities change');
    bullet(doc, 'Proceed directly to checkout');
    note(doc, 'Cart contents are saved across sessions. If a customer adds items while logged out and then logs in, those items are merged with their account cart.');

    chapterTitle(doc, 4, 'Discount Codes & Promotions');
    sectionTitle(doc, '4.1 Influencer Codes');
    body(doc, 'Customers may receive a personalised discount code from a 1stRep influencer. These codes (e.g. SLUG10) give a percentage discount off the order total. The influencer earns a credit when their code is used.');

    sectionTitle(doc, '4.2 Admin Coupons');
    body(doc, 'The admin team can create general promotion coupons (e.g. SUMMER20). These work the same way as influencer codes — the customer enters them at checkout to receive the stated discount.');

    sectionTitle(doc, '4.3 How to Apply a Code');
    numbered(doc, 1, 'Add items to the cart and proceed to checkout');
    numbered(doc, 2, 'In the Order Summary panel, find the "Discount Code" field');
    numbered(doc, 3, 'Type or paste the code and click Apply');
    numbered(doc, 4, 'The discounted amount is shown and the total updates automatically');
    warning(doc, 'Only one discount code can be applied per order. Codes cannot be combined.');

    chapterTitle(doc, 5, 'Checkout & Payment');
    sectionTitle(doc, '5.1 Checkout Steps');
    numbered(doc, 1, 'Contact information', 'email address for confirmation');
    numbered(doc, 2, 'Delivery address', 'full UK address with postcode');
    numbered(doc, 3, 'Shipping method', 'choose from available options with prices and estimated delivery times');
    numbered(doc, 4, 'Payment', 'enter card details, use Apple Pay, or Google Pay');
    numbered(doc, 5, 'Order confirmation', 'a confirmation page and email are sent automatically');

    sectionTitle(doc, '5.2 Payment Methods');
    bullet(doc, 'Debit or Credit Card', 'Visa, Mastercard, Amex — processed securely by Stripe');
    bullet(doc, 'Apple Pay', 'available on Safari / iOS devices');
    bullet(doc, 'Google Pay', 'available on Chrome / Android devices');
    note(doc, 'Card details are never stored on the 1stRep servers. All payment data is handled entirely by Stripe\'s PCI-compliant infrastructure.');

    sectionTitle(doc, '5.3 Shipping Options');
    body(doc, 'Shipping options and their prices are configured by the admin team. Typical options include:');
    bullet(doc, 'Standard Delivery', '3–5 working days');
    bullet(doc, 'Express Delivery', '1–2 working days');
    bullet(doc, 'Free Delivery', 'applied automatically above a configured order threshold');

    chapterTitle(doc, 6, 'Orders & Tracking');
    sectionTitle(doc, '6.1 Viewing Orders');
    body(doc, 'Customers can see all their orders under Account > My Orders. Each order shows:');
    bullet(doc, 'Order number and date');
    bullet(doc, 'Current status with a visual progress indicator');
    bullet(doc, 'Items ordered, sizes, quantities, and individual prices');
    bullet(doc, 'Total paid including any discounts applied');
    bullet(doc, 'Shipping address and selected delivery method');

    sectionTitle(doc, '6.2 Order Statuses');
    table(doc,
      ['Status', 'Meaning'],
      [
        ['Pending', 'Order placed but not yet confirmed by the team'],
        ['Processing', 'Order confirmed and being prepared for dispatch'],
        ['Shipped', 'Order dispatched — tracking number available'],
        ['Delivered', 'Carrier has confirmed delivery'],
        ['Cancelled', 'Order cancelled before fulfilment'],
        ['Refunded', 'Order refunded in full or in part'],
      ]
    );

    sectionTitle(doc, '6.3 Tracking');
    body(doc, 'Once an order is shipped, a tracking number is added by the admin team. Customers see a "Track My Order" button in the order detail view. Clicking it opens the carrier tracking page directly. Supported carriers include Royal Mail, DPD, Evri, UPS, FedEx, and DHL — detected automatically from the tracking number format.');

    chapterTitle(doc, 7, 'Returns & Refunds');
    sectionTitle(doc, '7.1 Submitting a Return Request');
    numbered(doc, 1, 'Go to Account > My Orders and find the relevant order');
    numbered(doc, 2, 'Click "Request Return" on the order');
    numbered(doc, 3, 'Select the item(s) you wish to return');
    numbered(doc, 4, 'Choose a reason from the dropdown (Wrong size, Faulty, Changed mind, etc.)');
    numbered(doc, 5, 'Add any additional notes and submit');

    sectionTitle(doc, '7.2 Return Processing');
    body(doc, 'The admin team reviews return requests in the Admin Dashboard under Return Requests. They can:');
    bullet(doc, 'Approve the return', 'customer is notified by email with return instructions');
    bullet(doc, 'Reject the return', 'customer is notified with the reason');
    body(doc, 'Approved returns are refunded to the original payment method within 5–10 business days after the product is received.');
    note(doc, 'The 1stRep return policy should be displayed on the website. This document covers only the system mechanics, not the specific policy terms.');

    chapterTitle(doc, 8, 'Wishlist');
    body(doc, 'Customers can save products to a wishlist by clicking the heart icon on any product card or product detail page. The wishlist is account-linked and persists across devices. From Account > Wishlist, customers can:');
    bullet(doc, 'View all saved items');
    bullet(doc, 'Move items directly to the cart with one click');
    bullet(doc, 'Remove items from the wishlist');
    note(doc, 'Wishlist is only available to logged-in customers.');

    chapterTitle(doc, 9, 'Product Reviews');
    sectionTitle(doc, '9.1 Leaving a Review');
    body(doc, 'After an order status is updated to Delivered, the customer can leave a review for each product in that order:');
    numbered(doc, 1, 'Go to Account > My Orders');
    numbered(doc, 2, 'Click "Leave Review" next to the delivered product');
    numbered(doc, 3, 'Select a star rating (1–5) and write a review text');
    numbered(doc, 4, 'Submit — the review is sent to the admin for approval');

    sectionTitle(doc, '9.2 Review Visibility');
    body(doc, 'Reviews are visible on the product detail page once an admin approves them. The average star rating is shown on the product card in the shop grid. Unapproved or rejected reviews are not visible to other customers.');

    chapterTitle(doc, 10, 'Loyalty Programme');
    body(doc, 'Customers automatically earn loyalty points on every purchase. Points can be redeemed for discounts on future orders. The loyalty programme has tiers:');
    bullet(doc, 'Bronze', 'entry level — earned on first purchase');
    bullet(doc, 'Silver', 'after reaching a points threshold');
    bullet(doc, 'Gold', 'higher tier with better redemption rates');
    bullet(doc, 'Platinum', 'top tier — unlocks exclusive rewards');
    body(doc, 'Points balance and redemption options are shown in Account > Loyalty. The admin team configures points rates and tier thresholds from the Admin Dashboard.');

    drawFooters(doc);
  });
  await uploadAndRegister(buf, 'customer-storefront-guide.pdf', 'Customer Storefront Guide', 'Complete guide for customers: accounts, shopping, checkout, orders, tracking, returns, wishlist, reviews, and loyalty', 'general');
}

// ══════════════════════════════════════════════════════════════════
// DOCUMENT 3 — Orders & Fulfilment Management
// ══════════════════════════════════════════════════════════════════
async function doc3() {
  const buf = await buildPdf(doc => {
    drawHeader(doc, 'Orders & Fulfilment Management', 'How all order types are managed, processed, and fulfilled across the 1stRep platform', '3', '8');

    sectionTitle(doc, 'Contents');
    body(doc, 'Chapter 1 — Order Types & Sources\nChapter 2 — The Admin Orders View\nChapter 3 — Processing an Order\nChapter 4 — Updating Order Status\nChapter 5 — Tracking Numbers & Carriers\nChapter 6 — Cancellations & Refunds\nChapter 7 — Wholesale / B2B Orders\nChapter 8 — EPOS Orders\nChapter 9 — Order Emails\nChapter 10 — Reports & Analytics');

    chapterTitle(doc, 1, 'Order Types & Sources');
    body(doc, 'The platform processes four types of orders, all visible in the same Admin Orders view:');
    table(doc,
      ['Order Type', 'Source', 'Payment Processor'],
      [
        ['Online Customer Order', 'Customer checkout on /shop-clean', 'Stripe'],
        ['EPOS Sale', 'Reseller using /reseller/epos terminal', 'Square / Cash / Other'],
        ['Wholesale Order', 'B2B partner bulk purchase', 'Invoice / Stripe'],
        ['Admin-Created Order', 'Admin creates manually in the dashboard', 'Manual'],
      ]
    );
    body(doc, 'All order types share the same status workflow and fulfilment process. Regardless of source, the admin team manages them from the same interface.');

    chapterTitle(doc, 2, 'The Admin Orders View');
    body(doc, 'Navigate to Admin > Orders. The orders list shows all orders across all channels. At the top, filter tabs allow you to quickly view orders by status:');
    bullet(doc, 'All', 'every order regardless of status');
    bullet(doc, 'Pending', 'orders awaiting processing');
    bullet(doc, 'Processing', 'orders confirmed and being picked/packed');
    bullet(doc, 'Shipped', 'orders that have been dispatched');
    bullet(doc, 'Delivered', 'orders confirmed as received by the customer');
    bullet(doc, 'Cancelled', 'orders that were cancelled before fulfilment');
    doc.moveDown(0.3);
    body(doc, 'Each order row shows: order number, customer name, order date, total value, item count, source channel, and current status. The search bar at the top lets you search by order number, customer name, or email address. Click any order row to open the full detail view.');

    chapterTitle(doc, 3, 'Processing an Order');
    sectionTitle(doc, '3.1 Order Detail View');
    body(doc, 'The order detail view shows:');
    bullet(doc, 'Order information', 'order number, date, source channel, payment method');
    bullet(doc, 'Customer information', 'name, email, phone — with a link to their CRM profile');
    bullet(doc, 'Line items', 'each product with variant (size, colour), quantity, unit price, and line total');
    bullet(doc, 'Price breakdown', 'subtotal, discount applied, shipping cost, and grand total');
    bullet(doc, 'Delivery address', 'full shipping address');
    bullet(doc, 'Order timeline', 'a log of every status change with timestamp and who made the change');
    bullet(doc, 'Internal notes', 'a notes field for the team to add internal comments (not visible to customer)');

    sectionTitle(doc, '3.2 Picking & Packing Workflow');
    numbered(doc, 1, 'When an order arrives with status Pending, the team should review it for any issues');
    numbered(doc, 2, 'Verify stock is available in the warehouse inventory system');
    numbered(doc, 3, 'Update the status to Processing once the order is confirmed and being prepared');
    numbered(doc, 4, 'Pick and pack the items according to the line items list');
    numbered(doc, 5, 'Once dispatched, update to Shipped and enter the tracking number');
    numbered(doc, 6, 'The customer is automatically notified by email at each status change');

    chapterTitle(doc, 4, 'Updating Order Status');
    body(doc, 'In the order detail view, click the status dropdown and select the new status. Then click Save. The system will:');
    bullet(doc, 'Log the status change in the order timeline');
    bullet(doc, 'Record the admin user who made the change');
    bullet(doc, 'Send a notification email to the customer automatically (for key status changes)');
    note(doc, 'Status changes are irreversible in the UI — you cannot move an order backward in status. If a mistake is made, contact a developer to correct it in the database.');

    chapterTitle(doc, 5, 'Tracking Numbers & Carriers');
    sectionTitle(doc, '5.1 Adding a Tracking Number');
    body(doc, 'When updating an order to Shipped, you must also enter the tracking number in the tracking field. The system automatically detects the carrier based on the tracking number format:');
    table(doc,
      ['Carrier', 'Tracking Number Format', 'Example'],
      [
        ['Royal Mail', 'Starts with letters, 13 chars total', 'AB123456789GB'],
        ['DPD', '14 digits', '12345678901234'],
        ['Evri (Hermes)', 'Starts with H', 'H1234567890'],
        ['UPS', 'Starts with 1Z', '1Z999AA10123456784'],
        ['FedEx', '12 or 15 digits', '123456789012'],
        ['DHL', '10 digits', '1234567890'],
        ['Yodel', 'JD followed by digits', 'JD000060007567345622'],
      ]
    );
    body(doc, 'Once a tracking number is entered, a "Track Parcel" link appears in the customer\'s order view and in their shipping confirmation email, linking directly to the carrier\'s tracking page.');

    chapterTitle(doc, 6, 'Cancellations & Refunds');
    sectionTitle(doc, '6.1 Cancelling an Order');
    body(doc, 'An order can be cancelled if it has not yet been shipped. Change the status to Cancelled in the order detail view. This does not automatically process a refund — refunds must be processed separately through Stripe.');

    sectionTitle(doc, '6.2 Processing a Refund');
    body(doc, 'Refunds are initiated from the Stripe Dashboard (not the 1stRep admin panel). Log in to dashboard.stripe.com, find the payment, and issue a full or partial refund. The refund will appear on the customer\'s bank statement within 5–10 business days.');
    warning(doc, 'Always cancel the order in the 1stRep admin panel AND refund in Stripe. Doing only one without the other creates inconsistent records.');

    sectionTitle(doc, '6.3 Return-Driven Refunds');
    body(doc, 'When a customer submits a return request that is approved (see Return Requests section), the admin team must also initiate the refund in Stripe once the returned goods are received. The return request approval in the platform does not automatically trigger a Stripe refund.');

    chapterTitle(doc, 7, 'Wholesale / B2B Orders');
    body(doc, 'Wholesale orders are placed by B2B reseller partners and typically involve large quantities at reduced unit prices. They are visible in Admin > Wholesale Orders as well as in the main Orders view. Additional features for wholesale orders:');
    bullet(doc, 'Invoice generation', 'the system can generate a PDF invoice for each wholesale order');
    bullet(doc, 'Payment recording', 'record payment receipt manually or link to a Stripe payment');
    bullet(doc, 'Commission calculation', 'if the reseller earns a commission, it is calculated and tracked here');
    bullet(doc, 'Bulk status updates', 'update multiple wholesale order items at once');

    chapterTitle(doc, 8, 'EPOS Orders');
    body(doc, 'Orders created through the reseller EPOS terminal appear in the main Orders view tagged with the source channel "EPOS" and the reseller\'s name. These are processed identically to online orders for fulfilment purposes. Key differences:');
    bullet(doc, 'Payment is recorded as the method chosen at the EPOS terminal', 'Card, Cash, or Other');
    bullet(doc, 'Delivery address may be the reseller\'s premises for direct dispatch to their location');
    bullet(doc, 'Commission for the reseller is calculated based on their agreed rate');

    chapterTitle(doc, 9, 'Order Emails');
    body(doc, 'The system automatically sends emails at the following points in the order lifecycle:');
    table(doc,
      ['Trigger', 'Email Sent', 'Recipient'],
      [
        ['Order placed', 'Order confirmation with items and total', 'Customer'],
        ['Status → Processing', 'Your order is being prepared', 'Customer'],
        ['Status → Shipped', 'Your order is on its way + tracking link', 'Customer'],
        ['Status → Delivered', 'Your order has been delivered', 'Customer'],
        ['Status → Cancelled', 'Your order has been cancelled', 'Customer'],
        ['Return approved', 'Return approval + instructions', 'Customer'],
        ['Return rejected', 'Return declined with reason', 'Customer'],
      ]
    );
    body(doc, 'Email templates are customisable in Admin > Settings > Email Templates. All emails use the 1stRep branded template with the black header and gold logo.');

    chapterTitle(doc, 10, 'Reports & Analytics');
    body(doc, 'Admin > Reports (at /admin/reports) provides a comprehensive view of order performance:');
    bullet(doc, 'Total revenue by date range');
    bullet(doc, 'Order count and average order value');
    bullet(doc, 'Revenue breakdown by channel (online vs EPOS vs wholesale)');
    bullet(doc, 'Top-selling products and variants');
    bullet(doc, 'Orders by status distribution');
    bullet(doc, 'Discount code usage and revenue impact');
    bullet(doc, 'Refund rate and value');
    body(doc, 'Data can be filtered by date range. Reports are generated in real time from the live database — there is no caching delay.');

    drawFooters(doc);
  });
  await uploadAndRegister(buf, 'orders-fulfilment-guide.pdf', 'Orders & Fulfilment Management', 'Detailed guide for all order types: processing, statuses, tracking, wholesale, EPOS, cancellations, and refunds', 'training');
}

// ══════════════════════════════════════════════════════════════════
// DOCUMENT 4 — Products, Inventory & Warehouse Guide
// ══════════════════════════════════════════════════════════════════
async function doc4() {
  const buf = await buildPdf(doc => {
    drawHeader(doc, 'Products, Inventory & Warehouse Guide', 'Managing the 1stRep product catalogue, stock levels, and warehouse operations', '4', '8');

    sectionTitle(doc, 'Contents');
    body(doc, 'Chapter 1 — Product Structure\nChapter 2 — Adding & Editing Products\nChapter 3 — Product Variants (Sizes & Colours)\nChapter 4 — Categories & Activity Types\nChapter 5 — Product Sections (Homepage)\nChapter 6 — Warehouse Inventory\nChapter 7 — Adding & Adjusting Stock\nChapter 8 — Warehouses & Store Locations\nChapter 9 — Smart Inventory & Alerts\nChapter 10 — Image Manager');

    chapterTitle(doc, 1, 'Product Structure');
    body(doc, 'Products in the 1stRep system are structured in a hierarchy:');
    bullet(doc, 'Product', 'the top-level item (e.g. "1stRep Performance Shorts")');
    bullet(doc, 'Product Variant', 'a specific combination of size and colour (e.g. "Medium / Black"). Each variant has its own SKU, price, and stock quantity field in the product_variants table.');
    bullet(doc, 'Warehouse Inventory', 'the actual physical stock count stored per variant per warehouse. This is the definitive stock figure — always use this, not the productVariants.stockQuantity field.');
    warning(doc, 'The real, live stock count is in the warehouseInventory.quantity column. The productVariants.stockQuantity field may not always reflect physical stock accurately. Always refer to Warehouse Inventory for stock decisions.');

    chapterTitle(doc, 2, 'Adding & Editing Products');
    sectionTitle(doc, '2.1 Adding a New Product');
    numbered(doc, 1, 'Go to Admin > Products and click "Add Product"');
    numbered(doc, 2, 'Enter the product name (this is used to auto-generate the URL slug)');
    numbered(doc, 3, 'Enter the description — supports plain text and basic formatting');
    numbered(doc, 4, 'Set the base price (in GBP)');
    numbered(doc, 5, 'Select the category from the dropdown');
    numbered(doc, 6, 'Select applicable activity types (e.g. CrossFit, Running)');
    numbered(doc, 7, 'Upload the main product image and any additional images');
    numbered(doc, 8, 'Toggle the product to Active when ready to publish');
    numbered(doc, 9, 'Save — the product will appear in the shop immediately');

    sectionTitle(doc, '2.2 Editing an Existing Product');
    body(doc, 'Click any product in Admin > Products to open the edit view. All fields are editable. Changes are applied immediately on save. Toggling a product to Inactive removes it from the shop but retains all historical data and order references.');

    sectionTitle(doc, '2.3 Deleting a Product');
    body(doc, 'Soft deletion is used — deleted products are marked inactive and hidden from the shop but remain in the database for order history integrity. View soft-deleted products via the "Deleted Products" tab in Admin > Products.');
    warning(doc, 'Never hard-delete a product that has been sold. This would break order history for all customers who purchased it.');

    chapterTitle(doc, 3, 'Product Variants');
    sectionTitle(doc, '3.1 What is a Variant?');
    body(doc, 'A variant represents one specific purchasable version of a product. For example, a product "Performance Shorts" may have 12 variants: 4 sizes (S, M, L, XL) × 3 colours (Black, Navy, Grey). Each variant has:');
    bullet(doc, 'SKU', 'a unique stock-keeping unit code (e.g. PS-BLK-M for Performance Shorts Black Medium)');
    bullet(doc, 'Price', 'can differ from the base product price if needed');
    bullet(doc, 'Stock quantity', 'linked to warehouse inventory');
    bullet(doc, 'Colour and Size labels');
    bullet(doc, 'Active status', 'individual variants can be deactivated without affecting others');

    sectionTitle(doc, '3.2 Adding Variants');
    body(doc, 'From the product edit view, scroll to the Variants section. Click "Add Variant" and fill in the size, colour, SKU, and price. Repeat for each combination. You can bulk-generate variants using the "Generate All Combinations" button if all sizes and colours are already defined.');

    chapterTitle(doc, 4, 'Categories & Activity Types');
    sectionTitle(doc, '4.1 Categories');
    body(doc, 'Categories group products by type (e.g. Shorts, Tops, Footwear, Accessories). Manage categories in Admin > Categories:');
    bullet(doc, 'Add a new category', 'enter name and an optional description');
    bullet(doc, 'Reorder categories', 'drag to change the display order in the shop sidebar');
    bullet(doc, 'Edit or delete', 'but do not delete a category that still has active products assigned to it');

    sectionTitle(doc, '4.2 Activity Types');
    body(doc, 'Activity types are sport-based tags (e.g. CrossFit, Running, HIIT, Yoga, Boxing). Products can have multiple activity types. Customers can filter by activity type in the shop. Manage in Admin > Activity Types.');

    chapterTitle(doc, 5, 'Product Sections (Homepage)');
    body(doc, 'The homepage can feature curated product sections (e.g. "New Arrivals", "Best Sellers", "Staff Picks"). Each section is a manually curated list of products. Manage in Admin > Product Sections:');
    bullet(doc, 'Create a new section', 'give it a title and optional subtitle');
    bullet(doc, 'Add products to a section', 'search for and select products to include');
    bullet(doc, 'Reorder sections', 'drag to change the homepage display order');
    bullet(doc, 'Toggle section visibility', 'hide a section without deleting it');

    chapterTitle(doc, 6, 'Warehouse Inventory');
    sectionTitle(doc, '6.1 Overview');
    body(doc, 'The Warehouse Inventory system tracks physical stock across one or more warehouse locations. Each warehouse holds stock for specific product variants. The inventory view in Admin > Inventory shows:');
    bullet(doc, 'Variant', 'product name, size, and colour');
    bullet(doc, 'SKU', 'the variant\'s unique identifier');
    bullet(doc, 'Warehouse', 'which location holds this stock');
    bullet(doc, 'Quantity on hand', 'current physical stock count');
    bullet(doc, 'Reserved quantity', 'stock reserved for pending orders');
    bullet(doc, 'Available quantity', 'on hand minus reserved');

    sectionTitle(doc, '6.2 Why Warehouse Inventory is the Source of Truth');
    body(doc, 'The warehouseInventory table is updated every time a sale is made (online or EPOS) and every time stock is added. It is the single source of truth for stock decisions. The productVariants.stockQuantity field is a secondary cached value and should not be relied upon for operations.');

    chapterTitle(doc, 7, 'Adding & Adjusting Stock');
    sectionTitle(doc, '7.1 Adding New Stock');
    body(doc, 'When a new delivery arrives at the warehouse:');
    numbered(doc, 1, 'Go to Admin > Add Inventory');
    numbered(doc, 2, 'Select the product and variant');
    numbered(doc, 3, 'Select the warehouse location receiving the stock');
    numbered(doc, 4, 'Enter the quantity being added');
    numbered(doc, 5, 'Add optional notes (e.g. "Delivery ref INV-001234")');
    numbered(doc, 6, 'Click Add Stock — the warehouse inventory updates immediately');

    sectionTitle(doc, '7.2 Stock Adjustments');
    body(doc, 'If stock needs to be corrected (e.g. after a stock count reveals a discrepancy), use the adjustment feature:');
    numbered(doc, 1, 'Find the variant in Admin > Inventory');
    numbered(doc, 2, 'Click Adjust');
    numbered(doc, 3, 'Enter the new correct quantity (not a delta — enter the actual count)');
    numbered(doc, 4, 'Enter a reason for the adjustment');
    numbered(doc, 5, 'Save — all adjustments are logged with user and timestamp');

    sectionTitle(doc, '7.3 Bulk Import');
    body(doc, 'Large stock imports (e.g. after a full stock count) can be done via CSV import. Navigate to Admin > Add Inventory > Bulk Import. The CSV format requires columns: sku, warehouse_id, quantity. Download the template from the same page.');

    chapterTitle(doc, 8, 'Warehouses & Store Locations');
    sectionTitle(doc, '8.1 Warehouses');
    body(doc, 'The platform supports multiple warehouse locations. Manage them in Admin > Warehouses:');
    bullet(doc, 'Add a warehouse', 'enter name, address, and a short code');
    bullet(doc, 'Assign stock', 'stock can be assigned to any warehouse when adding inventory');
    bullet(doc, 'View stock by warehouse', 'filter the inventory view by warehouse location');

    sectionTitle(doc, '8.2 Store Locations');
    body(doc, 'Store Locations (Admin > Store Locations) are the physical retail points shown on the Store Locator page (/store-locator). These are separate from warehouses — a store location is where customers can visit or collect, while a warehouse is where stock is held for fulfilment. Each store location has: name, full address, opening hours, phone number, and a map pin (lat/long coordinates).');

    chapterTitle(doc, 9, 'Smart Inventory & Alerts');
    body(doc, 'Smart Inventory (/admin/smart-inventory) provides automated monitoring and alerts:');
    bullet(doc, 'Low Stock Alerts', 'automatically flags variants with stock below a configurable threshold');
    bullet(doc, 'Reorder Suggestions', 'based on sales velocity, suggests when to reorder and in what quantity');
    bullet(doc, 'Warehouse Intelligence', 'at /admin/warehouse-intelligence, provides deeper analytics on stock movement, stockout risk, and overstock');
    bullet(doc, 'Product Performance', 'at /admin/product-performance, shows which products are selling fastest and which are slow-moving');
    note(doc, 'Smart Inventory alerts are informational — they do not auto-generate purchase orders. A team member must review alerts and place stock orders with suppliers manually.');

    chapterTitle(doc, 10, 'Image Manager');
    body(doc, 'Admin > Image Manager provides a visual library of all product images uploaded to object storage. Features:');
    bullet(doc, 'Upload new images', 'drag and drop or file picker — accepts JPG, PNG, and WebP');
    bullet(doc, 'View all uploaded images', 'with their object storage paths');
    bullet(doc, 'Copy image URL', 'to paste into a product image field');
    bullet(doc, 'Delete unused images', 'to keep the library clean');
    warning(doc, 'Do not delete an image that is currently assigned to a product. This will cause broken image placeholders in the shop.');

    drawFooters(doc);
  });
  await uploadAndRegister(buf, 'products-inventory-guide.pdf', 'Products, Inventory & Warehouse Guide', 'Managing the product catalogue, variants, categories, warehouse stock, adjustments, and smart inventory alerts', 'training');
}

// ══════════════════════════════════════════════════════════════════
// DOCUMENT 5 — Reseller, B2B Partners & Licence Guide
// ══════════════════════════════════════════════════════════════════
async function doc5() {
  const buf = await buildPdf(doc => {
    drawHeader(doc, 'Reseller, B2B Partners & Licence Guide', 'Complete guide to the 1stRep reseller programme, B2B licensing, EPOS terminal, and partner management', '5', '8');

    sectionTitle(doc, 'Contents');
    body(doc, 'Chapter 1 — Overview of the Reseller Programme\nChapter 2 — Partner Types & Commission Tiers\nChapter 3 — Licence Requests & Onboarding\nChapter 4 — B2B Access & Permissions\nChapter 5 — The EPOS Terminal\nChapter 6 — Wholesale Orders\nChapter 7 — Commission Payouts\nChapter 8 — Reseller Storefront\nChapter 9 — B2B Coupons & Promotions\nChapter 10 — Partner Analytics');

    chapterTitle(doc, 1, 'Overview of the Reseller Programme');
    body(doc, 'The reseller programme is the primary growth engine for 1stRep, representing 70% of the commercial strategy. Resellers are typically gym owners, fitness centres, sports retailers, and other businesses that sell 1stRep products to their customer base in person using the EPOS terminal.');
    body(doc, 'Key benefits for resellers:');
    bullet(doc, 'Access to the EPOS terminal', 'a professional point-of-sale interface to process in-person sales');
    bullet(doc, 'Wholesale pricing', 'products available at reduced wholesale rates');
    bullet(doc, 'Commission on sales', 'earn a percentage of every sale made through their terminal');
    bullet(doc, 'Branded storefront', 'a public-facing storefront page on the 1stRep website');
    bullet(doc, 'Wholesale ordering', 'ability to place bulk orders at further reduced rates');
    bullet(doc, 'B2B invoicing', 'formal invoice generation for business records');

    chapterTitle(doc, 2, 'Partner Types & Commission Tiers');
    sectionTitle(doc, '2.1 Partner Types');
    table(doc,
      ['Type', 'Description'],
      [
        ['Reseller', 'Standard B2B partner — sells via EPOS and/or storefront'],
        ['Premium Partner', 'Higher-volume reseller with enhanced commission and support'],
        ['Wholesale Partner', 'Buys stock in bulk at wholesale rates for own distribution'],
        ['Company Store', 'Corporate partner with a dedicated internal store for employees'],
      ]
    );

    sectionTitle(doc, '2.2 Commission Tiers');
    body(doc, 'Commission tiers define what percentage of each sale a reseller earns. Tiers are configured in Admin > Commission Tiers and can be customised per partner. Default tier structure:');
    table(doc,
      ['Tier', 'Commission Rate', 'Monthly Volume Threshold'],
      [
        ['Bronze', '5%', 'Under £2,000/month'],
        ['Silver', '8%', '£2,000–£5,000/month'],
        ['Gold', '12%', '£5,000–£10,000/month'],
        ['Elite', '15%', 'Over £10,000/month'],
      ]
    );
    body(doc, 'Partners automatically progress to higher tiers as their monthly sales volume increases. Tier adjustments can also be made manually in Admin > Commission Tiers > Adjust.');

    chapterTitle(doc, 3, 'Licence Requests & Onboarding');
    sectionTitle(doc, '3.1 How Resellers Apply');
    body(doc, 'Prospective resellers submit a licence request from the website. This captures:');
    bullet(doc, 'Business name and contact details');
    bullet(doc, 'Type of business (gym, retailer, online, etc.)');
    bullet(doc, 'Expected monthly sales volume');
    bullet(doc, 'Physical address if applicable');
    bullet(doc, 'Agreement to 1stRep\'s reseller terms and conditions');

    sectionTitle(doc, '3.2 Reviewing Licence Requests');
    body(doc, 'Navigate to Admin > Licence Requests. Pending requests are listed at the top. For each request you can:');
    numbered(doc, 1, 'Review all submitted details and business information');
    numbered(doc, 2, 'Click Approve to create a reseller account and send welcome credentials');
    numbered(doc, 3, 'Click Reject to decline and notify the applicant with a reason');
    numbered(doc, 4, 'Request more information by using the notes field and emailing the applicant');
    note(doc, 'Approving a licence request automatically: creates a reseller user account, generates a unique reseller code, sets up their commission tier, and sends a welcome email with login instructions.');

    sectionTitle(doc, '3.3 Manual Reseller Creation');
    body(doc, 'Admins can also create reseller accounts directly without a licence request. Go to Admin > B2B Partners and click "Add Partner". Fill in the business details, set the commission tier, and create the account. The reseller will receive a welcome email with their login credentials.');

    sectionTitle(doc, '3.4 Licence Settings');
    body(doc, 'Configure global licence settings in Admin > Licence Settings:');
    bullet(doc, 'Licence validity period', 'how long a licence is valid before renewal is required');
    bullet(doc, 'Auto-renewal', 'whether licences auto-renew or require manual renewal');
    bullet(doc, 'Fee structure', 'if there is a licence fee, configure the amount and billing cycle');
    bullet(doc, 'Terms & conditions', 'the text of the reseller agreement shown to applicants');

    chapterTitle(doc, 4, 'B2B Access & Permissions');
    body(doc, 'Admin > B2B Access controls what capabilities each reseller has on the platform. Capabilities can be toggled individually:');
    bullet(doc, 'EPOS Terminal Access', 'can use the point-of-sale terminal');
    bullet(doc, 'Wholesale Ordering', 'can place bulk wholesale orders');
    bullet(doc, 'Custom Pricing', 'can receive custom-negotiated product prices');
    bullet(doc, 'Storefront', 'has a public-facing storefront page on 1strep.com');
    bullet(doc, 'B2B Invoicing', 'can generate and receive formal invoices');
    bullet(doc, 'Credit Terms', 'can purchase on credit with payment terms (e.g. net 30)');
    body(doc, 'To change capabilities for a partner: go to Admin > B2B Partners, find the partner, and click "Manage Capabilities". Toggle the relevant capabilities and save.');

    chapterTitle(doc, 5, 'The EPOS Terminal');
    sectionTitle(doc, '5.1 Accessing the EPOS');
    body(doc, 'Resellers access the EPOS terminal at /reseller/epos after logging in with their reseller account. The terminal is a full-screen point-of-sale interface optimised for tablets. It should be kept open in a dedicated browser tab during trading hours.');

    sectionTitle(doc, '5.2 Product Browsing on EPOS');
    body(doc, 'All active 1stRep products are displayed in a grid. The reseller can:');
    bullet(doc, 'Search by name or SKU', 'using the search bar at the top');
    bullet(doc, 'Filter by category', 'using the category tab bar');
    bullet(doc, 'See current stock levels', 'shown on each product tile');
    bullet(doc, 'View product details', 'click a product to see full description and all variant options');

    sectionTitle(doc, '5.3 Building a Basket');
    body(doc, 'Click a product tile to open the variant selector. Choose the size and colour the customer wants. The item appears in the basket on the right side. From the basket:');
    bullet(doc, 'Adjust quantities', 'using + and – buttons');
    bullet(doc, 'Remove items', 'using the bin icon');
    bullet(doc, 'Apply a discount', 'using the Add Discount button (authorised codes or manual percentage)');
    bullet(doc, 'See the running total', 'updates in real time');

    sectionTitle(doc, '5.4 Processing a Sale');
    numbered(doc, 1, 'When the basket is complete, click "Charge" or "Process Sale"');
    numbered(doc, 2, 'Select the payment method: Card, Cash, or Other');
    numbered(doc, 3, 'For Card: charge the customer on your card reader and confirm in the EPOS');
    numbered(doc, 4, 'For Cash: enter the amount tendered and the system calculates and shows the change due');
    numbered(doc, 5, 'Click "Confirm Sale" to complete the transaction');
    numbered(doc, 6, 'A receipt summary is displayed — print or email it to the customer');

    sectionTitle(doc, '5.5 After a Sale');
    body(doc, 'Every EPOS sale is automatically:');
    bullet(doc, 'Logged in the system', 'visible in the reseller\'s orders and in the admin orders view');
    bullet(doc, 'Deducted from warehouse inventory', 'stock levels update immediately');
    bullet(doc, 'Included in commission calculations', 'earnings for the reseller are tracked');

    chapterTitle(doc, 6, 'Wholesale Orders');
    body(doc, 'Wholesale orders allow resellers to purchase large quantities at bulk pricing for their own stock. Navigate to Reseller Dashboard > Place Wholesale Order:');
    numbered(doc, 1, 'Browse products and add quantities to the wholesale basket');
    numbered(doc, 2, 'Review the wholesale prices (discounted from retail)');
    numbered(doc, 3, 'Submit the order — admin is notified to confirm');
    numbered(doc, 4, 'Admin approves and generates an invoice');
    numbered(doc, 5, 'Payment is made by the reseller against the invoice');
    numbered(doc, 6, 'Stock is allocated and dispatched to the reseller\'s address');
    body(doc, 'Admins manage wholesale orders in Admin > Wholesale Orders. Each order can have its status updated (Pending, Confirmed, Invoiced, Paid, Dispatched, Delivered).');

    chapterTitle(doc, 7, 'Commission Payouts');
    body(doc, 'Resellers earn a commission on every sale. Commissions accumulate and are paid out on a schedule configured by the admin team.');

    sectionTitle(doc, '7.1 Viewing Pending Payouts');
    body(doc, 'Go to Admin > Commission Payouts. This shows all pending commissions by reseller:');
    bullet(doc, 'Reseller name and tier');
    bullet(doc, 'Commission amount earned since last payout');
    bullet(doc, 'Total sales volume the commission is based on');
    bullet(doc, 'Scheduled payout date');

    sectionTitle(doc, '7.2 Processing a Payout');
    body(doc, 'For each pending payout, the admin can:');
    bullet(doc, 'Approve', 'marks the payout as approved and ready for payment');
    bullet(doc, 'Pay via Stripe', 'sends the payment directly to the reseller\'s Stripe connected account');
    bullet(doc, 'Mark as Paid', 'records a manual bank transfer as paid');
    bullet(doc, 'Reject', 'rejects the payout request with a reason (e.g. outstanding balance)');

    sectionTitle(doc, '7.3 Payout Schedules');
    body(doc, 'Configure payout frequency in Admin > Payout Schedules:');
    bullet(doc, 'Weekly', 'pay out every 7 days');
    bullet(doc, 'Bi-weekly', 'pay out every 14 days');
    bullet(doc, 'Monthly', 'pay out on a fixed day each month');
    bullet(doc, 'On request', 'reseller requests a payout manually when they choose');

    chapterTitle(doc, 8, 'Reseller Storefront');
    body(doc, 'Each reseller can have a public-facing storefront page on the 1stRep website. This page shows:');
    bullet(doc, 'The reseller\'s business name and logo');
    bullet(doc, 'A selection of 1stRep products they sell');
    bullet(doc, 'Contact information and location');
    bullet(doc, 'A link for customers to shop through this specific reseller');
    body(doc, 'The reseller configures their storefront from Reseller Dashboard > My Storefront. Admins can also edit and feature reseller storefronts from Admin > B2B Partners.');

    chapterTitle(doc, 9, 'B2B Coupons & Promotions');
    body(doc, 'B2B-specific coupons can be created for resellers, separate from customer-facing discount codes. Go to Admin > B2B Access > Coupons:');
    bullet(doc, 'Create a B2B coupon', 'set the code, discount amount/percentage, and which resellers it applies to');
    bullet(doc, 'Set an expiry date', 'optional — coupons can have a defined validity period');
    bullet(doc, 'Restrict to partners', 'optionally limit a coupon to specific reseller accounts');
    bullet(doc, 'View redemption history', 'see which resellers have used the coupon and when');

    chapterTitle(doc, 10, 'Partner Analytics');
    body(doc, 'Admin > Partner Analytics (/admin/commission-analytics) provides detailed performance data for all B2B partners:');
    bullet(doc, 'Revenue by partner', 'total sales generated by each reseller over a date range');
    bullet(doc, 'Commission earned vs paid out', 'track outstanding commission liability');
    bullet(doc, 'Sales volume trend', 'weekly/monthly sales volume chart per partner');
    bullet(doc, 'Top resellers', 'ranked list by revenue contribution');
    bullet(doc, 'Tier progression', 'track which resellers are approaching the next commission tier');
    body(doc, 'Individual partner performance can also be viewed from Admin > Partner Management (/admin/partner-management), which provides a per-partner drill-down with full order history and commission breakdown.');

    drawFooters(doc);
  });
  await uploadAndRegister(buf, 'reseller-b2b-licence-guide.pdf', 'Reseller, B2B Partners & Licence Guide', 'Complete guide to the reseller programme, B2B licensing, EPOS terminal, wholesale orders, commissions, and partner analytics', 'reseller');
}

// ══════════════════════════════════════════════════════════════════
// DOCUMENT 6 — Influencer Programme Complete Guide
// ══════════════════════════════════════════════════════════════════
async function doc6() {
  const buf = await buildPdf(doc => {
    drawHeader(doc, 'Influencer Programme Complete Guide', 'Everything about the 1stRep Influencer Programme — for influencers, admins, and the team', '6', '8');

    sectionTitle(doc, 'Contents');
    body(doc, 'Chapter 1 — Programme Overview & Strategy\nChapter 2 — Applying to the Programme\nChapter 3 — Admin: Reviewing Applications\nChapter 4 — Welcome Credit & Initial Setup\nChapter 5 — Discount Codes in Detail\nChapter 6 — Tracking Links & Visitor Analytics\nChapter 7 — Content Credits (£25 per Post)\nChapter 8 — Credit Redemption\nChapter 9 — Admin Influencer Credits Panel\nChapter 10 — Tiers & Progression');

    chapterTitle(doc, 1, 'Programme Overview & Strategy');
    body(doc, 'The 1stRep Influencer Programme is a partner programme for fitness content creators and social media personalities. Influencers promote 1stRep products to their audiences in exchange for credits that can be redeemed for products, gift vouchers, or cash payouts.');
    body(doc, 'The programme serves the 30% DTC (direct-to-consumer) pillar of 1stRep\'s strategy. Influencer-driven traffic is tracked via unique URLs, and influencer-driven purchases are tracked via personalised discount codes.');
    body(doc, 'Key metrics the programme is designed to generate:');
    bullet(doc, 'Tracked visitors', 'people who visit the website via an influencer\'s tracking link');
    bullet(doc, 'Code conversions', 'purchases made using an influencer\'s discount code');
    bullet(doc, 'Revenue attributable', 'total order value from influencer-driven purchases');

    chapterTitle(doc, 2, 'Applying to the Programme');
    sectionTitle(doc, '2.1 Application Page');
    body(doc, 'Prospective influencers visit /athlete-program and click "Apply Now". The application form collects:');
    bullet(doc, 'Full name and email address');
    bullet(doc, 'Instagram, TikTok, and YouTube handles');
    bullet(doc, 'Combined follower count');
    bullet(doc, 'Content niche / type of fitness content they create');
    bullet(doc, 'Why they want to join — a short message');
    note(doc, 'A minimum of 5,000 combined followers across all platforms is required. The admin team has discretion to approve applicants below this threshold for exceptional cases.');

    sectionTitle(doc, '2.2 After Submitting');
    body(doc, 'The applicant receives an automatic acknowledgement email. The application appears in the admin panel under Influencer Applications. Review time is up to 7 days from submission.');

    chapterTitle(doc, 3, 'Admin: Reviewing Applications');
    sectionTitle(doc, '3.1 Accessing Applications');
    body(doc, 'Navigate to Admin > Influencer Applications. Pending applications are listed at the top. Each application card shows the applicant\'s name, email, social handles, follower count, and their written message. Click on a card to expand the full application.');

    sectionTitle(doc, '3.2 Approving an Application');
    body(doc, 'Click the Approve button on the application card. The system will automatically:');
    numbered(doc, 1, 'Create an influencer profile linked to the applicant\'s user account');
    numbered(doc, 2, 'Set the initial tier to Bronze');
    numbered(doc, 3, 'Generate a unique tracking link slug based on their name');
    numbered(doc, 4, 'Create two default discount code variants: SLUG10 (10% off / 10% credit) and SLUG15 (15% off / 5% credit)');
    numbered(doc, 5, 'Award the £150 welcome credit and log the transaction');
    numbered(doc, 6, 'Send the influencer a welcome email with their dashboard login link and code details');

    sectionTitle(doc, '3.3 Rejecting an Application');
    body(doc, 'Click Reject and enter a reason. The applicant receives an email notifying them their application was unsuccessful. Rejected applications are retained in the system for 12 months before automatic deletion.');

    sectionTitle(doc, '3.4 Manual Influencer Creation');
    body(doc, 'Admins can create an influencer profile without a formal application. Go to Admin > Manage Influencers > Add Influencer. Enter: email, first name, last name, sport/niche, initial tier, discount percentage, and social handles. The welcome credit is granted automatically.');

    chapterTitle(doc, 4, 'Welcome Credit & Initial Setup');
    body(doc, 'Every approved influencer receives £150 welcome credit added to their account automatically. This credit:');
    bullet(doc, 'Appears immediately on the Influencer Dashboard under Credits');
    bullet(doc, 'Is logged as a transaction of type "welcome" in the transaction history');
    bullet(doc, 'Can be redeemed immediately for clothing, vouchers, or cash payout');
    body(doc, 'The welcome credit is a one-time grant. If an influencer is deactivated and then re-activated, the welcome credit is not re-granted. Only new accounts receive it.');

    chapterTitle(doc, 5, 'Discount Codes in Detail');
    sectionTitle(doc, '5.1 How Codes Work');
    body(doc, 'Each influencer has a base "slug" (their unique identifier, e.g. "johndoe"). Discount code variants are constructed as SLUG+SUFFIX, giving codes like JOHNDOE10 or JOHNDOE15. When a customer enters this code at checkout:');
    numbered(doc, 1, 'The system validates the code against the influencer_discount_variants table');
    numbered(doc, 2, 'The customer receives the configured discount (e.g. 10% off their order total)');
    numbered(doc, 3, 'The influencer\'s credit_balance is incremented by the configured credit percentage of the order value');
    numbered(doc, 4, 'A transaction is logged in influencer_credit_transactions of type "sale_commission"');

    sectionTitle(doc, '5.2 Default Code Variants');
    table(doc,
      ['Code', 'Customer Discount', 'Influencer Credit', 'Use Case'],
      [
        ['SLUG10', '10% off order total', '10% of order value', 'General promotion — balanced'],
        ['SLUG15', '15% off order total', '5% of order value', 'Higher discount — lower margin for influencer'],
      ]
    );

    sectionTitle(doc, '5.3 Custom Code Variants');
    body(doc, 'Influencers can create their own additional code variants from the Discount Codes tab on their dashboard. They specify:');
    bullet(doc, 'A code suffix', 'appended to their slug (e.g. "PROMO" creates JOHNDOEPROMO)');
    bullet(doc, 'Customer discount percentage', 'how much the customer gets off');
    bullet(doc, 'Influencer credit percentage', 'what credit the influencer earns per sale');
    note(doc, 'Influencers can only have one active code variant at a time. Creating a new variant deactivates the previous one. Admins can override this from the Admin Influencer Credits panel.');

    sectionTitle(doc, '5.4 Admin Code Management');
    body(doc, 'Admins can view, create, and deactivate code variants for any influencer from Admin > Influencer Credits. This is useful for setting up special event codes or correcting mistakes.');

    chapterTitle(doc, 6, 'Tracking Links & Visitor Analytics');
    sectionTitle(doc, '6.1 How Tracking Links Work');
    body(doc, 'Each influencer receives a unique tracking URL in the format:');
    body(doc, '      https://1strep.com/api/track/[their-slug]');
    body(doc, 'When a visitor clicks this link, the system:');
    numbered(doc, 1, 'Increments the tracking_link_clicks counter on the influencer\'s profile');
    numbered(doc, 2, 'Stores a ?ref=slug parameter in the visitor\'s session (stored as a cookie)');
    numbered(doc, 3, 'Redirects the visitor to the 1stRep homepage');
    body(doc, 'If the visitor then makes a purchase within their session, the purchase is attributed to the influencer and the influencer earns credit (as if they had used the discount code). A ?tracked=1 parameter prevents double-counting if the visitor visits via the tracking link more than once in the same session.');

    sectionTitle(doc, '6.2 Viewing Click Data');
    body(doc, 'Influencers can see their total click count on the Tracking Link tab of their dashboard. Admins can see click counts per influencer on Admin > Manage Influencers — each profile card shows "Link Clicks" in gold text. The Admin Influencer Credits panel (/admin/influencer-credits) also shows click counts alongside sales data.');

    chapterTitle(doc, 7, 'Content Credits (£25 per Post)');
    sectionTitle(doc, '7.1 How It Works');
    body(doc, 'Influencers earn £25 credit for every social media post they submit. The process is:');
    numbered(doc, 1, 'Influencer posts on Instagram, TikTok, or YouTube featuring 1stRep products');
    numbered(doc, 2, 'They tag @1stRepOfficial and use #1stRep in the post');
    numbered(doc, 3, 'They go to the Content tab of their Influencer Dashboard');
    numbered(doc, 4, 'They click "Submit a Post" and fill in: platform, content type, and post URL');
    numbered(doc, 5, 'On submission, £25 is added to their credit balance instantly — no admin approval needed');
    numbered(doc, 6, 'A transaction of type "post_approved" is logged in their credit history');

    sectionTitle(doc, '7.2 What is Recorded');
    body(doc, 'Each submission records: platform (Instagram/TikTok/YouTube), content type (photo/video/reel/story), post URL, submission timestamp, and the status (always auto-set to "approved").');

    sectionTitle(doc, '7.3 Viewing Submissions (Admin)');
    body(doc, 'Admin > Influencer Content shows all post submissions across all influencers. This serves as an audit log. The content is auto-approved but admins retain the ability to review URLs if there are any concerns about abuse.');

    chapterTitle(doc, 8, 'Credit Redemption');
    sectionTitle(doc, '8.1 Redemption Options');
    body(doc, 'Influencers can redeem their credit balance in three ways:');
    bullet(doc, 'Clothing Credit', 'applied as a discount code on their next 1stRep order');
    bullet(doc, 'Gift Voucher', 'converted to a gift voucher that can be given to anyone');
    bullet(doc, 'Cash / Bank Transfer', 'paid out directly to the influencer\'s bank account');

    sectionTitle(doc, '8.2 How to Request a Redemption');
    numbered(doc, 1, 'On the Influencer Dashboard, click "Redeem Credits"');
    numbered(doc, 2, 'Choose the redemption type from the three options');
    numbered(doc, 3, 'Enter the amount to redeem');
    numbered(doc, 4, 'Add any notes (e.g. bank account details for cash payout)');
    numbered(doc, 5, 'Submit — the request goes to the admin team for processing');

    sectionTitle(doc, '8.3 Admin: Processing Redemptions');
    body(doc, 'Redemption requests appear in Admin > Influencer Credits under the "Pending Redemptions" section. The admin can:');
    bullet(doc, 'Approve', 'mark as approved and process the payment / generate the voucher');
    bullet(doc, 'Complete', 'mark as completed once the physical payment or voucher has been sent');
    bullet(doc, 'Reject', 'decline with a reason (e.g. insufficient balance, unclear bank details)');
    note(doc, 'When a redemption is approved, the credit balance is automatically deducted from the influencer\'s account. The transaction is logged as type "redemption".');

    chapterTitle(doc, 9, 'Admin Influencer Credits Panel');
    body(doc, 'The Admin Influencer Credits panel at /admin/influencer-credits provides a full financial overview of the influencer programme:');
    sectionTitle(doc, '9.1 Influencer List');
    body(doc, 'Each influencer is shown with:');
    bullet(doc, 'Name, tier, and active discount code');
    bullet(doc, 'Current credit balance');
    bullet(doc, 'Total sales generated and link click count');
    bullet(doc, 'Count of pending redemption requests');
    bullet(doc, 'Transaction count (total credit events)');

    sectionTitle(doc, '9.2 Manual Credit Award');
    body(doc, 'Admins can manually award credit to any influencer at any time. Go to the influencer\'s row and click "Award Credit". Enter the amount and a reason. This is useful for:');
    bullet(doc, 'One-off bonus payments');
    bullet(doc, 'Correcting a missed automatic credit');
    bullet(doc, 'Rewards for special achievements or campaigns');

    sectionTitle(doc, '9.3 Transaction History');
    body(doc, 'Click on any influencer in the Credits panel to see their full transaction history. Each transaction shows: type, amount (+ or –), description, date, and who initiated it. Transaction types include:');
    table(doc,
      ['Type', 'Description'],
      [
        ['welcome', '£150 welcome credit on approval'],
        ['sale_commission', 'Credit earned when customer uses their code'],
        ['post_approved', '£25 credit for a submitted social post'],
        ['manual', 'Manually awarded by an admin'],
        ['redemption', 'Credit deducted on redemption request approval'],
        ['ref_purchase', 'Credit from a tracking-link attributed purchase'],
      ]
    );

    chapterTitle(doc, 10, 'Tiers & Progression');
    table(doc,
      ['Tier', 'Colour', 'Default Commission', 'Typical Status'],
      [
        ['Bronze', 'Orange/Brown', '10% credit on sales', 'All new influencers'],
        ['Silver', 'Grey/Silver', '12% credit on sales', 'Mid-level performers'],
        ['Gold', 'Yellow/Gold', '15% credit on sales', 'High performers'],
        ['Elite', 'Purple', '20% credit on sales', 'Top influencers'],
      ]
    );
    body(doc, 'Tiers are managed manually by the admin team in Admin > Manage Influencers > Edit. There is no automatic tier progression based on performance — it is a manual upgrade decision. Higher tiers can unlock additional benefits such as product gifting, garment drops, and exclusive commissions.');

    drawFooters(doc);
  });
  await uploadAndRegister(buf, 'influencer-programme-guide.pdf', 'Influencer Programme Complete Guide', 'Full guide: application, discount codes, tracking links, content credits, redemptions, admin panel, and tiers', 'influencer');
}

// ══════════════════════════════════════════════════════════════════
// DOCUMENT 7 — CRM, Marketing & Customer Support Guide
// ══════════════════════════════════════════════════════════════════
async function doc7() {
  const buf = await buildPdf(doc => {
    drawHeader(doc, 'CRM, Marketing & Customer Support Guide', 'Managing customers, running marketing campaigns, and handling support on the 1stRep platform', '7', '8');

    sectionTitle(doc, 'Contents');
    body(doc, 'Chapter 1 — Customer CRM Overview\nChapter 2 — Customer Profiles & Tags\nChapter 3 — VIP Customers\nChapter 4 — Marketing Campaigns & Email\nChapter 5 — Coupons & Promotions\nChapter 6 — Smart Notifications\nChapter 7 — Support Tickets\nChapter 8 — Product Reviews Management\nChapter 9 — Chatbot Management\nChapter 10 — Popup Messages & Announcements');

    chapterTitle(doc, 1, 'Customer CRM Overview');
    body(doc, 'The 1stRep CRM (Customer Relationship Management) system is accessible from Admin > Customers. It provides a centralised view of every registered customer with their full purchase history, interactions, support tickets, and marketing engagement. The CRM is built to support:');
    bullet(doc, 'Customer retention', 'identify loyal customers and reward them');
    bullet(doc, 'Issue resolution', 'quickly pull up a customer\'s history when they contact support');
    bullet(doc, 'Targeted marketing', 'segment customers by spend, activity, or tags');
    bullet(doc, 'VIP management', 'manually designate high-value customers for special treatment');

    chapterTitle(doc, 2, 'Customer Profiles & Tags');
    sectionTitle(doc, '2.1 Viewing a Customer Profile');
    body(doc, 'Click any customer in the CRM list to open their profile. The profile shows:');
    bullet(doc, 'Personal information', 'name, email, phone, registration date');
    bullet(doc, 'Order history', 'all orders with status, value, and date');
    bullet(doc, 'Total spend', 'lifetime value as a customer');
    bullet(doc, 'Loyalty points', 'current balance and tier');
    bullet(doc, 'Interaction log', 'a timeline of all customer interactions (email opens, logins, purchases, support tickets)');
    bullet(doc, 'Internal notes', 'private notes added by the team — visible only to admins');
    bullet(doc, 'Tags', 'labels applied to the customer for segmentation');

    sectionTitle(doc, '2.2 Adding Notes');
    body(doc, 'From the customer profile, scroll to the Notes section and click "Add Note". Notes are timestamped, attributed to the admin who wrote them, and visible to all admins. Use notes to record:');
    bullet(doc, 'A conversation you had with the customer');
    bullet(doc, 'Specific preferences or requirements');
    bullet(doc, 'Issues resolved and how');

    sectionTitle(doc, '2.3 Customer Tags');
    body(doc, 'Tags are labels that allow you to segment customers. Examples: "VIP", "Wholesale Buyer", "Competition Winner", "Refund History". To add a tag:');
    numbered(doc, 1, 'Open the customer profile');
    numbered(doc, 2, 'Click "Add Tag"');
    numbered(doc, 3, 'Select from existing tags or type a new one');
    body(doc, 'Tags can be managed globally in Admin > Marketing Tags. Tagged customers can be targeted in marketing campaigns.');

    chapterTitle(doc, 3, 'VIP Customers');
    body(doc, 'The VIP flag designates a customer as a high-value or priority customer. VIP customers may receive:');
    bullet(doc, 'Faster support response times');
    bullet(doc, 'Exclusive early access to new products');
    bullet(doc, 'Special discount codes or vouchers');
    body(doc, 'To mark a customer as VIP: open their profile and click "Set VIP". To remove VIP status, click the same button again. VIP status is visible to all admins in the customer list and on the customer\'s profile.');

    chapterTitle(doc, 4, 'Marketing Campaigns & Email');
    sectionTitle(doc, '4.1 The Marketing Section');
    body(doc, 'Admin > Marketing (/admin/marketing) is the hub for all outbound email campaigns. Features include:');
    bullet(doc, 'Campaign creation', 'compose and schedule email campaigns to customer segments');
    bullet(doc, 'Email templates', 'reusable templates for common emails (order confirmations, promotions, welcome emails)');
    bullet(doc, 'Audience segmentation', 'target campaigns by tag, spend threshold, loyalty tier, or registration date');
    bullet(doc, 'Campaign analytics', 'open rates, click rates, and unsubscribe rates for each campaign');

    sectionTitle(doc, '4.2 Creating a Campaign');
    numbered(doc, 1, 'Go to Admin > Marketing and click "Create Campaign"');
    numbered(doc, 2, 'Enter a campaign name and subject line');
    numbered(doc, 3, 'Choose an email template or write the email body in the rich text editor');
    numbered(doc, 4, 'Select the audience (all customers, tagged customers, or specific loyalty tiers)');
    numbered(doc, 5, 'Choose send immediately or schedule for a future date/time');
    numbered(doc, 6, 'Click Send or Schedule — the campaign status moves to Queued/Sent/Scheduled');
    warning(doc, 'Test campaigns by sending to a single internal email address before sending to your full customer list. A mistake sent to thousands of customers cannot be undone.');

    sectionTitle(doc, '4.3 Email Templates');
    body(doc, 'Manage email templates in Admin > Settings > Email Templates. Each template uses a standard 1stRep branded wrapper (black header, gold logo, clean body). Editable templates include:');
    bullet(doc, 'Order confirmation', 'sent automatically on every successful order');
    bullet(doc, 'Shipping notification', 'sent when an order is marked as Shipped');
    bullet(doc, 'Welcome email', 'sent when a new customer registers');
    bullet(doc, 'Influencer welcome', 'sent when an influencer is approved');
    bullet(doc, 'Return approved/rejected', 'sent on return request decision');
    bullet(doc, 'Password reset', 'sent when a customer requests a password reset');

    chapterTitle(doc, 5, 'Coupons & Promotions');
    body(doc, 'Admin > Coupons manages all promotional discount codes (as distinct from influencer discount codes). Coupon options:');
    bullet(doc, 'Code', 'the string customers enter at checkout (e.g. SUMMER20, WELCOME15)');
    bullet(doc, 'Discount type', 'percentage or fixed amount (e.g. 20% off or £10 off)');
    bullet(doc, 'Minimum order value', 'optional — code only applies above this threshold');
    bullet(doc, 'Usage limit', 'total number of times the code can be used across all customers');
    bullet(doc, 'Per-customer limit', 'how many times a single customer can use the same code');
    bullet(doc, 'Expiry date', 'optional — code stops working after this date');
    bullet(doc, 'Active / Inactive toggle', 'immediately enable or disable the code');
    body(doc, 'Create a coupon from Admin > Coupons > Add Coupon. Existing coupons can be edited or deactivated. Usage statistics (how many times used and total discount value given) are shown in the coupon list.');

    chapterTitle(doc, 6, 'Smart Notifications');
    body(doc, 'Admin > Smart Notifications (/admin/smart-notifications) is an automated notification system that alerts the team to important events:');
    bullet(doc, 'New order placed', 'notification when any order is created');
    bullet(doc, 'Low stock alert', 'when a variant falls below the configured threshold');
    bullet(doc, 'New return request', 'when a customer submits a return');
    bullet(doc, 'New influencer application', 'when someone applies to the influencer programme');
    bullet(doc, 'New licence request', 'when a business applies for a reseller licence');
    bullet(doc, 'Failed payment', 'when a payment attempt fails');
    body(doc, 'Notifications appear in the admin header bell icon and can also be sent as emails to configured recipients. Mark notifications as read individually or use "Mark All Read".');

    chapterTitle(doc, 7, 'Support Tickets');
    body(doc, 'Admin > Support Tickets shows all customer support requests. Customers can raise a support ticket from their account area. Each ticket shows:');
    bullet(doc, 'Subject and initial message from the customer');
    bullet(doc, 'Status: Open, In Progress, or Resolved');
    bullet(doc, 'Priority: Low, Medium, High, or Urgent');
    bullet(doc, 'Assignee: which team member is handling it');
    bullet(doc, 'Thread of messages between customer and team');
    body(doc, 'To respond to a ticket: click it, type your reply in the message box, and click Send. The customer receives an email with your reply and can respond via the platform or email. Close a ticket by setting the status to Resolved.');

    chapterTitle(doc, 8, 'Product Reviews Management');
    body(doc, 'Admin > Reviews (/admin/reviews) shows all product reviews submitted by customers. Reviews are held for approval before being published on the product page. Actions available:');
    bullet(doc, 'Approve', 'review becomes visible on the product page immediately');
    bullet(doc, 'Reject', 'review is hidden and the customer is not notified');
    bullet(doc, 'Delete', 'permanently removes the review');
    body(doc, 'Approved reviews contribute to the product\'s average star rating shown in the shop grid. Review moderation should aim for a 48-hour turnaround so customers get timely feedback that their review was received.');

    chapterTitle(doc, 9, 'Chatbot Management');
    body(doc, 'The 1stRep website has an AI-powered chatbot widget that answers common customer questions. The chatbot\'s knowledge base is managed in Admin > Chatbot:');
    bullet(doc, 'View existing knowledge entries', 'FAQ-style question and answer pairs');
    bullet(doc, 'Add new knowledge', 'click "Add Knowledge" and enter a question and answer');
    bullet(doc, 'Edit existing entries', 'update answers when policies or products change');
    bullet(doc, 'Seed from templates', 'use "Seed Knowledge" to add a set of standard gymwear retail FAQs');
    note(doc, 'The chatbot only answers questions that match entries in the knowledge base. If customers ask questions not covered, add them to the knowledge base to improve coverage over time.');

    chapterTitle(doc, 10, 'Popup Messages & Announcements');
    sectionTitle(doc, '10.1 Popup Messages');
    body(doc, 'Admin > Popup Messages manages modal pop-ups that appear to visitors on the website. Typical uses:');
    bullet(doc, 'Limited-time promotions', 'e.g. "Summer Sale — 20% off today only"');
    bullet(doc, 'New product launches', 'draw attention to new arrivals');
    bullet(doc, 'Events or announcements', 'upcoming community events or collaborations');
    body(doc, 'Create a popup with a title, message body, optional button text and URL, and set it as active. Only one popup should be active at a time. Deactivate the current popup before setting a new one.');

    sectionTitle(doc, '10.2 Announcement Banner');
    body(doc, 'The announcement banner is a thin coloured strip at the very top of every page (above the main navigation). Manage it in Admin > Settings > Announcement Banner. Set the message text, background colour, and text colour. Toggle it on or off. Common uses:');
    bullet(doc, 'Free delivery threshold', 'e.g. "Free UK delivery on orders over £50"');
    bullet(doc, 'Sale notification', 'e.g. "Summer Sale now on — up to 30% off"');
    bullet(doc, 'Operational notice', 'e.g. "Dispatch times may be extended 20–27 Dec"');

    drawFooters(doc);
  });
  await uploadAndRegister(buf, 'crm-marketing-support-guide.pdf', 'CRM, Marketing & Customer Support Guide', 'Managing customers, CRM profiles, tags, VIP, marketing campaigns, email, coupons, support tickets, reviews, chatbot, and popups', 'training');
}

// ══════════════════════════════════════════════════════════════════
// DOCUMENT 8 — Platform Administration & Settings Guide
// ══════════════════════════════════════════════════════════════════
async function doc8() {
  const buf = await buildPdf(doc => {
    drawHeader(doc, 'Platform Administration & Settings Guide', 'System-wide configuration, team management, homepage content, reports, and platform settings', '8', '8');

    sectionTitle(doc, 'Contents');
    body(doc, 'Chapter 1 — Admin Dashboard Overview\nChapter 2 — Site Settings & Appearance\nChapter 3 — Hero Images & Videos\nChapter 4 — Team Management\nChapter 5 — Document Library (Admin)\nChapter 6 — Community Events\nChapter 7 — Reports & Business Intelligence\nChapter 8 — Loyalty Programme Configuration\nChapter 9 — Vendor Portal\nChapter 10 — Platform Security & Maintenance');

    chapterTitle(doc, 1, 'Admin Dashboard Overview');
    body(doc, 'The Admin Dashboard at /admin is the control centre for the entire 1stRep platform. It is accessible only to users with the "admin" role. The dashboard is divided into sections accessible via the collapsible left sidebar:');
    table(doc,
      ['Sidebar Section', 'What It Covers'],
      [
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
      ]
    );

    chapterTitle(doc, 2, 'Site Settings & Appearance');
    body(doc, 'Admin > Settings provides global configuration for the platform. Key areas:');

    sectionTitle(doc, '2.1 General Settings');
    bullet(doc, 'Site name', 'displayed in browser tab titles and emails');
    bullet(doc, 'Contact email', 'the from-address for system emails');
    bullet(doc, 'Default currency', 'currently GBP (£) — do not change without developer involvement');
    bullet(doc, 'Free shipping threshold', 'orders above this value qualify for free shipping');

    sectionTitle(doc, '2.2 Announcement Banner');
    body(doc, 'Toggle the top-of-page announcement banner on/off. Set the banner message, background colour, and text colour. Changes take effect immediately for all visitors.');

    sectionTitle(doc, '2.3 Theme');
    body(doc, 'The platform uses the "clean_minimal" theme. Do not change the theme setting without developer review, as it affects the entire visual design system.');

    sectionTitle(doc, '2.4 Email Templates');
    body(doc, 'Customise the content of each automated email. Click an email type, edit the subject line and body, and save. All emails use the 1stRep branded template wrapper — only the body content is editable here.');

    chapterTitle(doc, 3, 'Hero Images & Videos');
    sectionTitle(doc, '3.1 Hero Images');
    body(doc, 'The homepage hero section displays full-width image slides. Manage them in Admin > Hero Images:');
    numbered(doc, 1, 'Click "Add Hero Image" to upload a new image');
    numbered(doc, 2, 'Enter a title and optional subtitle that appears over the image');
    numbered(doc, 3, 'Add a call-to-action button text and URL');
    numbered(doc, 4, 'Set the display order using drag-and-drop reordering');
    numbered(doc, 5, 'Toggle individual images active or inactive');
    note(doc, 'Hero images should be high-resolution and landscape-oriented (minimum 1920×1080px). Avoid text-heavy images as the overlay text may conflict. A dark gradient overlay is applied automatically for readability.');

    sectionTitle(doc, '3.2 Hero Videos');
    body(doc, 'The homepage can also feature autoplay background videos. Manage in Admin > Hero Videos. Videos should be in MP4 format and ideally compressed for web (file size under 20MB). Like images, videos can be reordered and toggled on/off.');

    chapterTitle(doc, 4, 'Team Management');
    body(doc, 'Admin > Team manages internal team member accounts. This is distinct from customer accounts. Team members can have roles that grant different levels of access:');
    table(doc,
      ['Role', 'Access'],
      [
        ['admin', 'Full access to all admin sections'],
        ['staff', 'Limited access — can view orders and customers but cannot change settings'],
        ['vendor', 'Access to vendor portal only'],
        ['reseller', 'Access to EPOS terminal and reseller dashboard only'],
        ['influencer', 'Access to influencer dashboard only'],
        ['customer', 'Access to customer storefront and account only'],
      ]
    );
    body(doc, 'To add a new team member: ask them to register on the platform as a regular customer first, then update their role in Admin > Team by finding their account and changing the role dropdown.');
    warning(doc, 'Role changes take effect immediately. Assigning the "admin" role gives full unrestricted access to the entire platform. Only assign this role to trusted senior team members.');

    chapterTitle(doc, 5, 'Document Library (Admin)');
    body(doc, 'Admin > Document Library (/admin/documents) is a shared repository of internal documents — guides, policies, training materials, SOPs, and reference files. All logged-in staff members can view and download documents. Only admins can upload or delete them.');

    sectionTitle(doc, '5.1 Uploading a Document');
    numbered(doc, 1, 'Navigate to /admin/documents and click "Upload Document"');
    numbered(doc, 2, 'Enter a document title and optional description');
    numbered(doc, 3, 'Select a category: General, Training, Influencer, Reseller, Legal, etc.');
    numbered(doc, 4, 'Select the file (PDF, DOCX, XLSX, or other supported formats)');
    numbered(doc, 5, 'Click Upload — the document appears in the library immediately');

    sectionTitle(doc, '5.2 Downloading a Document');
    body(doc, 'Click "Download" on any document in the library. The file is retrieved from object storage and downloaded to your device. Documents are served with the original filename.');

    sectionTitle(doc, '5.3 Deleting a Document');
    body(doc, 'Click "Delete" on a document and confirm. This removes the file from both object storage and the database. Deleted documents cannot be recovered — ensure you have a backup copy before deleting.');

    chapterTitle(doc, 6, 'Community Events');
    body(doc, 'Admin > Community Events manages events displayed on the website\'s Events page (/events). Each event has:');
    bullet(doc, 'Title and description');
    bullet(doc, 'Date and time');
    bullet(doc, 'Location (venue name and address)');
    bullet(doc, 'Event type', 'e.g. Competition, Community Workout, Brand Collaboration');
    bullet(doc, 'Optional event image');
    bullet(doc, 'RSVP / Ticket link', 'optional URL for external booking');
    bullet(doc, 'Active toggle', 'hide an event from the website without deleting it');
    body(doc, 'Create events well in advance to give customers time to plan. Past events are automatically removed from the public events page but remain in the admin view.');

    chapterTitle(doc, 7, 'Reports & Business Intelligence');
    body(doc, 'Admin > Reports (/admin/reports) is the primary reporting tool. Available report categories:');

    sectionTitle(doc, '7.1 Sales Reports');
    bullet(doc, 'Total revenue by date range');
    bullet(doc, 'Orders by channel (online, EPOS, wholesale)');
    bullet(doc, 'Average order value over time');
    bullet(doc, 'Revenue by product category');
    bullet(doc, 'Refund and cancellation rate');

    sectionTitle(doc, '7.2 Product Reports');
    bullet(doc, 'Best-selling products by unit and revenue');
    bullet(doc, 'Slow-moving stock report');
    bullet(doc, 'Product performance over time');
    bullet(doc, 'Variant-level analysis (which sizes and colours sell most)');

    sectionTitle(doc, '7.3 Customer Reports');
    bullet(doc, 'New vs returning customer split');
    bullet(doc, 'Customer lifetime value distribution');
    bullet(doc, 'Loyalty programme engagement rates');
    bullet(doc, 'Geographic breakdown of orders');

    sectionTitle(doc, '7.4 Influencer Programme Reports');
    bullet(doc, 'Revenue attributable to influencer codes');
    bullet(doc, 'Tracking link clicks per influencer');
    bullet(doc, 'Content submissions over time');
    bullet(doc, 'Credits awarded vs credits redeemed');

    sectionTitle(doc, '7.5 B2B / Reseller Reports');
    bullet(doc, 'Revenue by reseller partner');
    bullet(doc, 'Commission earned vs paid');
    bullet(doc, 'EPOS transaction volume by location');
    bullet(doc, 'Wholesale order fulfilment times');

    chapterTitle(doc, 8, 'Loyalty Programme Configuration');
    body(doc, 'The loyalty programme is configured in Admin > Settings > Loyalty (or Admin > Loyalty Rewards). Settings include:');
    bullet(doc, 'Points per £ spent', 'how many loyalty points are earned per pound of purchase');
    bullet(doc, 'Points value', 'what each loyalty point is worth when redeemed (e.g. 1 point = £0.01)');
    bullet(doc, 'Tier thresholds', 'cumulative points needed to reach each tier');
    bullet(doc, 'Tier rewards', 'what each tier unlocks (e.g. Gold tier gets 2× points on every purchase)');
    bullet(doc, 'Expiry policy', 'whether points expire after a period of inactivity');
    body(doc, 'Rewards can be configured individually — for example, a free product at 1000 points, or a 10% discount voucher at 500 points. Manage rewards in Admin > Loyalty Rewards.');

    chapterTitle(doc, 9, 'Vendor Portal');
    body(doc, 'The Vendor Portal at /vendor is for brand and product vendors who supply products to 1stRep. Vendors have their own login and can:');
    bullet(doc, 'View their products listed on 1stRep');
    bullet(doc, 'Upload and manage product images');
    bullet(doc, 'View sales analytics for their products');
    bullet(doc, 'Request price changes or product updates');
    body(doc, 'Admins manage vendor accounts from the backend. A vendor account is a user with the "vendor" role. Vendor capabilities can be adjusted per account. Vendors cannot access any customer data, orders from other vendors, or admin settings.');

    chapterTitle(doc, 10, 'Platform Security & Maintenance');
    sectionTitle(doc, '10.1 Session & Authentication');
    body(doc, 'The platform uses server-side sessions stored in PostgreSQL. Sessions expire after a configurable timeout period. Passwords are hashed using bcrypt. OAuth (Google login) is handled by Passport.js.');

    sectionTitle(doc, '10.2 Environment Variables');
    body(doc, 'The following critical environment variables must always be set and must never be committed to source control:');
    table(doc,
      ['Variable', 'Purpose'],
      [
        ['DATABASE_URL', 'PostgreSQL connection string'],
        ['SESSION_SECRET', 'Signs session cookies — must be a long random string'],
        ['STRIPE_SECRET_KEY', 'Stripe API secret for payment processing'],
        ['STRIPE_PUBLISHABLE_KEY', 'Stripe public key for frontend'],
        ['STRIPE_WEBHOOK_SECRET', 'Validates incoming Stripe webhook events'],
        ['SENDGRID_API_KEY', 'Sends transactional emails via SendGrid'],
        ['DEFAULT_OBJECT_STORAGE_BUCKET_ID', 'Replit object storage bucket for file uploads'],
        ['GOOGLE_CLIENT_ID', 'Google OAuth app client ID'],
        ['GOOGLE_CLIENT_SECRET', 'Google OAuth app client secret'],
      ]
    );

    sectionTitle(doc, '10.3 Database Backups');
    body(doc, 'The Replit PostgreSQL database is backed up automatically by the platform. However, for critical operations (major schema changes, mass data imports), always request a manual backup snapshot before proceeding.');

    sectionTitle(doc, '10.4 Maintenance Mode');
    body(doc, 'If the platform needs to be taken offline for maintenance, coordinate with the development team (Qanzak Global). There is no built-in maintenance mode toggle — taking the server offline requires stopping the workflow in the Replit environment.');

    drawFooters(doc);
  });
  await uploadAndRegister(buf, 'platform-admin-settings-guide.pdf', 'Platform Administration & Settings Guide', 'Admin dashboard overview, site settings, hero images, team management, documents, events, reports, loyalty, vendor portal, and security', 'training');
}

// ═══════════════════════════════
// MAIN
// ═══════════════════════════════
(async () => {
  console.log('\n1stRep — Generating detailed platform guides...\n');
  try {
    await doc1(); await doc2(); await doc3(); await doc4();
    await doc5(); await doc6(); await doc7(); await doc8();
    console.log('\n✅  All 8 detailed guides uploaded to Document Library.\n');
  } catch (err) {
    console.error('\n❌  Error:', err.message, '\n', err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
