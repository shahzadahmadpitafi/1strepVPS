import PDFDocument from 'pdfkit';
import { Client } from '@replit/object-storage';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || 'replit-objstore-1ddee8e0-6dd7-4c50-a942-b80ccf4dddaa';
const client = new Client({ bucketId });

const BRAND_BLACK = '#0D0D0D';
const BRAND_GOLD  = '#C9A84C';
const BRAND_CHALK = '#F5F5F0';

function buildPdf(fn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4', info: { Creator: '1stRep Platform' } });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    fn(doc);
    doc.end();
  });
}

function header(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, 110).fill(BRAND_BLACK);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(28).text('1ST', 50, 35, { continued: true });
  doc.fillColor(BRAND_GOLD).text('REP');
  doc.fillColor('#FFFFFF').font('Helvetica').fontSize(11).text('Platform Guide', 50, 72);
  doc.moveDown(4);
  doc.fillColor(BRAND_BLACK).font('Helvetica-Bold').fontSize(22).text(title, 50, 130);
  doc.fillColor('#555555').font('Helvetica').fontSize(11).text(subtitle, 50, doc.y + 6);
  doc.moveTo(50, doc.y + 12).lineTo(doc.page.width - 50, doc.y + 12).strokeColor(BRAND_GOLD).lineWidth(2).stroke();
  doc.moveDown(1.5);
  doc.fillColor(BRAND_BLACK);
}

function sectionTitle(doc, text) {
  doc.moveDown(0.8);
  doc.fillColor(BRAND_BLACK).font('Helvetica-Bold').fontSize(14).text(text);
  doc.moveTo(50, doc.y + 2).lineTo(doc.page.width - 50, doc.y + 2).strokeColor(BRAND_GOLD).lineWidth(1).stroke();
  doc.moveDown(0.5);
  doc.fillColor(BRAND_BLACK).font('Helvetica').fontSize(11);
}

function bullet(doc, text) {
  const x = doc.x;
  doc.font('Helvetica').fontSize(11).fillColor(BRAND_BLACK);
  doc.text(`\u2022  ${text}`, { indent: 10, lineGap: 3 });
}

function note(doc, text) {
  doc.rect(50, doc.y, doc.page.width - 100, 30).fill('#FFF8E7');
  doc.fillColor('#7a5c00').font('Helvetica-Oblique').fontSize(10).text(`  Note: ${text}`, 58, doc.y - 24, { width: doc.page.width - 116 });
  doc.fillColor(BRAND_BLACK).font('Helvetica').fontSize(11);
  doc.moveDown(0.8);
}

function footer(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor('#999999').font('Helvetica').fontSize(9)
      .text(`1stRep Platform — Confidential Internal Guide  |  Page ${i + 1}`, 50, doc.page.height - 35, { align: 'center', width: doc.page.width - 100 });
  }
}

async function uploadAndRegister(buffer, fileName, title, description, category) {
  const objectPath = `team-documents/${Date.now()}-${fileName}`;
  const uploadResult = await client.uploadFromBytes(objectPath, buffer);
  if (!uploadResult.ok) throw new Error(`Upload failed for ${fileName}: ${uploadResult.error?.message}`);

  await pool.query(
    `INSERT INTO team_documents (title, description, category, file_name, file_type, file_size, object_path, uploaded_by_name)
     VALUES ($1, $2, $3, $4, 'application/pdf', $5, $6, '1stRep System')
     ON CONFLICT DO NOTHING`,
    [title, description, category, fileName, buffer.length, objectPath]
  );
  console.log(`✅ Uploaded: ${title}`);
}

// ─────────────────────────────────────────────
// DOC 1: Platform Overview & Getting Started
// ─────────────────────────────────────────────
async function doc1() {
  const buf = await buildPdf(doc => {
    header(doc, 'Platform Overview & Getting Started', 'A complete introduction to the 1stRep platform');

    sectionTitle(doc, '1. What is 1stRep?');
    doc.font('Helvetica').fontSize(11).text(
      '1stRep is a premium gymwear platform that operates across three distinct audiences: customers who shop online, resellers who operate physical EPOS terminals, and influencers who promote the brand on social media. The platform is built and managed by Qanzak Global.'
    );

    sectionTitle(doc, '2. Platform Sections');
    bullet(doc, 'Customer Storefront — public-facing shop at /shop-clean');
    bullet(doc, 'Reseller EPOS Terminal — point-of-sale terminal for resellers at /reseller/epos');
    bullet(doc, 'Influencer Dashboard — credits, codes and tracking at /influencer-dashboard');
    bullet(doc, 'Admin Dashboard — full management at /admin');
    bullet(doc, 'Vendor Portal — for brand/product vendors at /vendor');

    sectionTitle(doc, '3. User Roles');
    bullet(doc, 'Customer — can browse, purchase, wishlist, and leave reviews');
    bullet(doc, 'Reseller — can use the EPOS terminal and manage their storefront');
    bullet(doc, 'Influencer — has a discount code, tracking link, and credit balance');
    bullet(doc, 'Vendor — can manage their own products and view analytics');
    bullet(doc, 'Admin — full access to all sections of the platform');

    sectionTitle(doc, '4. Strategic Focus');
    bullet(doc, '70% reseller acquisition — primary growth channel via EPOS partnerships');
    bullet(doc, '30% direct-to-consumer (DTC) — online storefront and influencer-driven traffic');

    sectionTitle(doc, '5. Brand Identity');
    bullet(doc, 'Black: #0D0D0D — primary background and text');
    bullet(doc, 'Gold: #C9A84C — accents, calls to action (max 15% of any design)');
    bullet(doc, 'Chalk White: #F5F5F0 — light backgrounds');
    bullet(doc, 'Display font: Bebas Neue | Body font: Inter');

    sectionTitle(doc, '6. Key URLs at a Glance');
    bullet(doc, 'Homepage: /');
    bullet(doc, 'Shop: /shop-clean');
    bullet(doc, 'Influencer Programme info page: /athlete-program');
    bullet(doc, 'Influencer Dashboard: /influencer-dashboard');
    bullet(doc, 'Admin Dashboard: /admin');
    bullet(doc, 'Reseller Dashboard: /reseller/dashboard');
    bullet(doc, 'EPOS Terminal: /reseller/epos');

    footer(doc);
  });

  await uploadAndRegister(buf, 'platform-overview.pdf', 'Platform Overview & Getting Started', 'Introduction to all sections, user roles, and strategy of the 1stRep platform', 'general');
}

// ─────────────────────────────────────────────
// DOC 2: Customer Storefront Guide
// ─────────────────────────────────────────────
async function doc2() {
  const buf = await buildPdf(doc => {
    header(doc, 'Customer Storefront Guide', 'How customers browse, shop, and manage their orders');

    sectionTitle(doc, '1. Creating an Account');
    bullet(doc, 'Visit the homepage and click Sign Up');
    bullet(doc, 'Enter your name, email address, and a password');
    bullet(doc, 'Verify your email if prompted, then log in');
    bullet(doc, 'Customers can also log in with their Google account');

    sectionTitle(doc, '2. Browsing & Shopping');
    bullet(doc, 'Navigate to /shop-clean to view all available products');
    bullet(doc, 'Filter by category, colour, or size using the sidebar filters');
    bullet(doc, 'Click any product to view full details, size guide, and stock levels');
    bullet(doc, 'Select your size and click Add to Cart');
    bullet(doc, 'A live cart icon in the header shows your current total');

    sectionTitle(doc, '3. Using Discount Codes');
    bullet(doc, 'Influencer codes (e.g. SLUG10) give customers a % discount at checkout');
    bullet(doc, 'Enter the code in the Discount Code field at checkout');
    bullet(doc, 'The discount is applied instantly before payment');
    note(doc, 'Influencer codes also earn the influencer a credit when used — they benefit when you use their code.');

    sectionTitle(doc, '4. Checkout & Payment');
    bullet(doc, 'Proceed to checkout from your cart');
    bullet(doc, 'Enter your delivery address and choose a shipping option');
    bullet(doc, 'Pay securely via Stripe (cards, Apple Pay, Google Pay)');
    bullet(doc, 'A confirmation email is sent automatically after payment');

    sectionTitle(doc, '5. Orders & Tracking');
    bullet(doc, 'Go to Account > My Orders to see all past orders');
    bullet(doc, 'Click any order to see its status, items, and tracking number');
    bullet(doc, 'Tracking numbers link directly to the carrier tracking page');
    bullet(doc, 'Order statuses: Pending → Processing → Shipped → Delivered');

    sectionTitle(doc, '6. Returns');
    bullet(doc, 'Go to Account > Returns and click Request Return');
    bullet(doc, 'Select the order and item(s) to return and provide a reason');
    bullet(doc, 'The admin team will review and approve / reject the request');
    bullet(doc, 'Approved returns receive a refund to the original payment method');

    sectionTitle(doc, '7. Wishlist');
    bullet(doc, 'Click the heart icon on any product to add it to your wishlist');
    bullet(doc, 'Access your wishlist via Account > Wishlist');
    bullet(doc, 'Move items from your wishlist to your cart with one click');

    sectionTitle(doc, '8. Reviews');
    bullet(doc, 'After receiving an order, you can leave a review for each product');
    bullet(doc, 'Go to Account > My Orders and click Leave Review on a delivered item');
    bullet(doc, 'Reviews are visible on the product page once approved by admin');

    footer(doc);
  });

  await uploadAndRegister(buf, 'customer-storefront-guide.pdf', 'Customer Storefront Guide', 'Step-by-step guide for customers: shopping, checkout, orders, returns, and wishlist', 'general');
}

// ─────────────────────────────────────────────
// DOC 3: Influencer Programme Guide
// ─────────────────────────────────────────────
async function doc3() {
  const buf = await buildPdf(doc => {
    header(doc, 'Influencer Programme Guide', 'How the 1stRep Influencer Programme works — for influencers and team members');

    sectionTitle(doc, '1. Programme Overview');
    doc.font('Helvetica').fontSize(11).text(
      'The 1stRep Influencer Programme rewards content creators and fitness personalities who promote the brand on social media. Influencers receive welcome credit, a personalised discount code, a tracking link, and earn additional credits for every social post they submit.'
    );

    sectionTitle(doc, '2. Applying to the Programme');
    bullet(doc, 'Visit /athlete-program and click Apply Now');
    bullet(doc, 'Complete the application form: name, email, social handles, follower count, and a short bio');
    bullet(doc, 'The admin team reviews the application within 7 days');
    bullet(doc, 'Approved applicants are notified by email and a profile is created');
    note(doc, 'Applicants must have an active social media presence (5,000+ combined followers).');

    sectionTitle(doc, '3. Welcome Credit');
    bullet(doc, 'Every approved influencer automatically receives £150 welcome credit');
    bullet(doc, 'This appears in their Influencer Dashboard under the Credits tab');
    bullet(doc, 'Credits can be redeemed for clothing, gift vouchers, or cash payouts');

    sectionTitle(doc, '4. Discount Codes');
    bullet(doc, 'Each influencer gets a unique discount code (e.g. SLUG10)');
    bullet(doc, 'Default variants: SLUG10 gives customers 10% off and earns the influencer 10% credit');
    bullet(doc, 'SLUG15 gives customers 15% off and earns the influencer 5% credit');
    bullet(doc, 'Influencers can create additional code variants from their dashboard (Discount Codes tab)');
    bullet(doc, 'When a customer uses the code at checkout, the influencer\'s credit balance is updated automatically');

    sectionTitle(doc, '5. Tracking Link');
    bullet(doc, 'Each influencer has a unique tracking URL: 1strep.com/api/track/[slug]');
    bullet(doc, 'Every click on this link is counted and shown on their dashboard');
    bullet(doc, 'Influencers can copy and share this link from the Tracking Link tab');
    bullet(doc, 'The dashboard shows total clicks — this represents visitor traffic driven by the influencer');

    sectionTitle(doc, '6. Earning Content Credits (£25 per post)');
    bullet(doc, 'Influencers earn £25 for every social media post they submit');
    bullet(doc, 'Post on Instagram, TikTok or YouTube and tag @1stRepOfficial with #1stRep');
    bullet(doc, 'Then go to the Content tab on the Influencer Dashboard and click Submit a Post');
    bullet(doc, 'Enter the platform, content type, and paste the post URL');
    bullet(doc, 'The £25 credit is added to the account instantly upon submission — no admin approval needed');
    note(doc, 'The post URL is required. Only submit posts that genuinely feature 1stRep products.');

    sectionTitle(doc, '7. Redeeming Credits');
    bullet(doc, 'Click Redeem Credits on the dashboard (Credits tab or Overview quick actions)');
    bullet(doc, 'Choose a redemption type: Clothing Credit, Gift Voucher, or Cash/Bank Payout');
    bullet(doc, 'Enter the amount and any notes, then submit the request');
    bullet(doc, 'The admin team processes redemptions and marks them completed');
    bullet(doc, 'All redemption history is visible on the Credits tab');

    sectionTitle(doc, '8. Influencer Dashboard Tabs');
    bullet(doc, 'Credits — credit balance, transaction history, and redemption requests');
    bullet(doc, 'Discount Codes — view and create personalised discount code variants');
    bullet(doc, 'Tracking Link — copy tracking URL and view total click count');
    bullet(doc, 'My Content — submit post links and view content credit history');
    bullet(doc, 'Overview — summary stats and quick action buttons');

    footer(doc);
  });

  await uploadAndRegister(buf, 'influencer-programme-guide.pdf', 'Influencer Programme Guide', 'Full guide to the 1stRep Influencer Programme: applying, earning credits, discount codes, and tracking', 'influencer');
}

// ─────────────────────────────────────────────
// DOC 4: Admin Dashboard Guide
// ─────────────────────────────────────────────
async function doc4() {
  const buf = await buildPdf(doc => {
    header(doc, 'Admin Dashboard Guide', 'How to manage the entire 1stRep platform from the admin panel');

    sectionTitle(doc, '1. Accessing the Admin Panel');
    bullet(doc, 'Navigate to /admin and log in with an admin account');
    bullet(doc, 'The left sidebar contains all sections — use the toggle button to collapse it');
    bullet(doc, 'Admin accounts must be set up directly in the database by a developer');

    sectionTitle(doc, '2. Orders Management');
    bullet(doc, 'Go to Orders in the sidebar to see all customer and EPOS orders');
    bullet(doc, 'Filter by status: Pending, Processing, Shipped, Delivered, Cancelled');
    bullet(doc, 'Click any order to view full details: items, customer, shipping address');
    bullet(doc, 'Update order status and add a tracking number from the order detail view');
    bullet(doc, 'Tracking numbers automatically generate a carrier tracking link');

    sectionTitle(doc, '3. Products & Inventory');
    bullet(doc, 'Go to Products to view, add, edit, and remove products');
    bullet(doc, 'Each product has variants (size/colour combinations) with their own stock levels');
    bullet(doc, 'Real stock levels are in Warehouse Inventory — check this for accurate stock counts');
    bullet(doc, 'Product images can be uploaded via the image manager or object storage');
    bullet(doc, 'Products can be toggled active/inactive without deletion');

    sectionTitle(doc, '4. Influencer Applications');
    bullet(doc, 'Go to Influencer Applications in the sidebar');
    bullet(doc, 'View pending applications with full details: bio, handles, follower count');
    bullet(doc, 'Click Approve to create an influencer profile and auto-send the welcome credit (£150)');
    bullet(doc, 'Click Reject to decline the application — notes can be added');
    bullet(doc, 'Approved applicants are automatically set up with discount codes and a tracking link');

    sectionTitle(doc, '5. Manage Influencers');
    bullet(doc, 'Go to Manage Influencers to see all active influencer profiles');
    bullet(doc, 'Each card shows: sales generated, orders, link clicks, followers, and join date');
    bullet(doc, '"Link Clicks" shows how many visitors came to the site via that influencer\'s tracking link');
    bullet(doc, 'Click Edit to update an influencer\'s tier, discount %, bio, or active status');
    bullet(doc, 'Click Add Influencer to manually create a profile without an application');
    bullet(doc, 'Tiers: Bronze, Silver, Gold, Elite — can affect benefits in future extensions');

    sectionTitle(doc, '6. Influencer Credits');
    bullet(doc, 'Go to Influencer Credits (/admin/influencer-credits) for full credit management');
    bullet(doc, 'View every influencer\'s credit balance, active code, and pending redemptions');
    bullet(doc, 'Use Award Credit to manually add credit to any influencer\'s account');
    bullet(doc, 'Approve or reject redemption requests from influencers');
    bullet(doc, 'All credit transactions are logged and viewable per influencer');

    sectionTitle(doc, '7. Influencer Content');
    bullet(doc, 'Go to Influencer Content in the sidebar');
    bullet(doc, 'See all content post submissions from influencers');
    bullet(doc, 'Credits are now awarded automatically on submission — no manual approval needed');
    bullet(doc, 'This section serves as an archive and audit log of submitted posts');

    sectionTitle(doc, '8. Document Library');
    bullet(doc, 'Go to Document Library in the sidebar');
    bullet(doc, 'Upload PDF, Word, or other files for the team by clicking Upload Document');
    bullet(doc, 'Documents are categorised (general, influencer, reseller, training, etc.)');
    bullet(doc, 'All logged-in staff can view and download documents');
    bullet(doc, 'Only admins can upload or delete documents');

    sectionTitle(doc, '9. Returns Management');
    bullet(doc, 'Go to Return Requests to see all pending and processed return requests');
    bullet(doc, 'Click a request to see the order, reason, and items being returned');
    bullet(doc, 'Approve or reject with notes — the customer is notified by email');

    sectionTitle(doc, '10. Site Settings & Content');
    bullet(doc, 'Hero images, announcement banners, and popup messages can be managed from the Admin Dashboard');
    bullet(doc, 'The chatbot knowledge base can be updated from the Chatbot section');
    bullet(doc, 'Community events can be managed from the Events section');

    footer(doc);
  });

  await uploadAndRegister(buf, 'admin-dashboard-guide.pdf', 'Admin Dashboard Guide', 'Complete guide for admins: orders, products, influencers, returns, documents, and site settings', 'training');
}

// ─────────────────────────────────────────────
// DOC 5: Reseller EPOS Terminal Guide
// ─────────────────────────────────────────────
async function doc5() {
  const buf = await buildPdf(doc => {
    header(doc, 'Reseller EPOS Terminal Guide', 'How to use the 1stRep point-of-sale terminal as a reseller');

    sectionTitle(doc, '1. What is the EPOS Terminal?');
    doc.font('Helvetica').fontSize(11).text(
      'The EPOS (Electronic Point of Sale) terminal allows resellers to process in-person sales of 1stRep products directly from a tablet or computer. Orders placed through the EPOS are automatically logged in the system and feed into the same fulfilment workflow as online orders.'
    );

    sectionTitle(doc, '2. Accessing the EPOS Terminal');
    bullet(doc, 'Log in with your reseller account at /login');
    bullet(doc, 'Navigate to /reseller/epos or use the EPOS button in your dashboard');
    bullet(doc, 'The terminal is optimised for tablet use in landscape mode');
    bullet(doc, 'Keep the terminal open in a dedicated browser tab during trading hours');

    sectionTitle(doc, '3. Browsing Products on the EPOS');
    bullet(doc, 'All available 1stRep products are displayed in a grid layout');
    bullet(doc, 'Use the search bar at the top to find a product by name or SKU');
    bullet(doc, 'Filter by category using the category tabs');
    bullet(doc, 'Each product tile shows the price and available stock level');
    bullet(doc, 'Products with zero stock are greyed out and cannot be added to the basket');

    sectionTitle(doc, '4. Building a Basket');
    bullet(doc, 'Click a product to add it to the current basket');
    bullet(doc, 'A size/colour selector appears — select the variant the customer wants');
    bullet(doc, 'The item is added to the basket on the right panel');
    bullet(doc, 'Adjust quantities using the + and – buttons in the basket');
    bullet(doc, 'Remove an item by clicking the bin icon next to it');

    sectionTitle(doc, '5. Applying Discounts');
    bullet(doc, 'Click Add Discount in the basket panel to apply a percentage discount');
    bullet(doc, 'Enter a discount code or a manual percentage if authorised');
    bullet(doc, 'The discounted total is shown immediately');
    note(doc, 'Only use discount codes or percentages that have been authorised by the 1stRep admin team.');

    sectionTitle(doc, '6. Processing Payment');
    bullet(doc, 'When the basket is complete, click Charge / Process Sale');
    bullet(doc, 'Select the payment method: Card, Cash, or Other');
    bullet(doc, 'For card payments, process through your card reader — enter the amount manually');
    bullet(doc, 'For cash payments, enter the amount tendered and the system shows change due');
    bullet(doc, 'Click Confirm Sale to complete the transaction');

    sectionTitle(doc, '7. After the Sale');
    bullet(doc, 'A receipt summary is shown on screen — print or email to the customer');
    bullet(doc, 'The order is automatically logged in the system under your reseller account');
    bullet(doc, 'Stock levels are updated immediately after the sale is confirmed');
    bullet(doc, 'You can view all your past EPOS sales from /reseller/dashboard under Orders');

    sectionTitle(doc, '8. Reseller Dashboard');
    bullet(doc, 'Go to /reseller/dashboard to view your storefront performance');
    bullet(doc, 'See total sales, order counts, and best-selling products');
    bullet(doc, 'Your storefront page (for online click-and-collect or online presence) is managed here');
    bullet(doc, 'Contact the admin team via the platform if you need stock adjustments or support');

    sectionTitle(doc, '9. Troubleshooting');
    bullet(doc, 'If the EPOS is slow, clear your browser cache and reload the page');
    bullet(doc, 'If a product is showing as out of stock but you have physical stock, contact admin');
    bullet(doc, 'If a sale fails to process, do not retry — check your dashboard first to confirm the order was not created');
    bullet(doc, 'For urgent support, contact the Qanzak Global team directly');

    footer(doc);
  });

  await uploadAndRegister(buf, 'reseller-epos-guide.pdf', 'Reseller EPOS Terminal Guide', 'Step-by-step guide for resellers on using the EPOS terminal, processing sales, and viewing reports', 'reseller');
}

// ─────────────────────────────────────────────
// Run all
// ─────────────────────────────────────────────
(async () => {
  console.log('Generating and uploading 1stRep platform guides...\n');
  try {
    await doc1();
    await doc2();
    await doc3();
    await doc4();
    await doc5();
    console.log('\n✅ All 5 guides uploaded to Document Library successfully.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
