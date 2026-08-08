const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'Premium E-Commerce Platform - Video Tutorial Script',
    Author: 'Qanzak Global',
    Subject: 'Video Tutorial Script',
  }
});

doc.pipe(fs.createWriteStream('Premium_Ecommerce_Tutorial_Script.pdf'));

// Helper functions
const addTitle = (text, size = 22) => {
  doc.fontSize(size).font('Helvetica-Bold').fillColor('#1a1a2e').text(text);
  doc.moveDown(0.5);
};

const addSubtitle = (text, size = 14) => {
  doc.fontSize(size).font('Helvetica-Bold').fillColor('#16213e').text(text);
  doc.moveDown(0.3);
};

const addBody = (text, size = 11) => {
  doc.fontSize(size).font('Helvetica').fillColor('#333333').text(text, { align: 'justify' });
  doc.moveDown(0.3);
};

const addScript = (text) => {
  doc.fontSize(11).font('Helvetica-Oblique').fillColor('#444444')
    .text(text, { indent: 20 });
  doc.moveDown(0.3);
};

const addBullet = (text) => {
  doc.fontSize(11).font('Helvetica').fillColor('#333333')
    .text(`• ${text}`, { indent: 15 });
};

const addAction = (text) => {
  doc.fontSize(10).font('Helvetica').fillColor('#666666')
    .text(`→ ${text}`, { indent: 25 });
};

const addPageBreak = () => {
  doc.addPage();
};

const addHorizontalLine = () => {
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
  doc.moveDown(0.5);
};

// Cover Page
doc.fontSize(28).font('Helvetica-Bold').fillColor('#1a1a2e')
  .text('Premium E-Commerce Platform', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(16).font('Helvetica').fillColor('#666666')
  .text('Complete Video Tutorial Script', { align: 'center' });
doc.moveDown(3);
doc.fontSize(12).font('Helvetica').fillColor('#888888')
  .text('Recording Guidelines', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica').fillColor('#666666')
  .text('Estimated Duration: 45-60 minutes', { align: 'center' });
doc.text('Format: Screen Recording with Voiceover', { align: 'center' });
doc.text('Resolution: 1920x1080 or higher', { align: 'center' });
doc.moveDown(4);
doc.fontSize(10).font('Helvetica-Oblique').fillColor('#999999')
  .text('Built by Qanzak Global', { align: 'center' });

// INTRODUCTION
addPageBreak();
addTitle('Introduction');
addHorizontalLine();

addBody('Show the homepage with hero video playing');
doc.moveDown(0.3);

addScript('"Welcome to this premium e-commerce platform designed specifically for fitness apparel brands. Whether you\'re launching your own clothing line or building a multi-vendor marketplace, this platform provides everything you need to succeed.');
doc.moveDown(0.2);
addScript('In this walkthrough, I\'ll show you every feature - from the customer-facing storefront to the admin dashboard, the EPOS systems, and the B2B marketplace.');
doc.moveDown(0.2);
addScript('Let\'s dive in."');

doc.moveDown(0.5);
addSubtitle('Platform Overview');
addBody('Scroll slowly down the homepage');

addScript('"This platform features:');
addBullet('Modern glassmorphism design with cinematic hero videos');
addBullet('Complete e-commerce with Stripe payment processing');
addBullet('Dual B2B marketplace for vendors and resellers');
addBullet('Three professional EPOS systems for in-person sales');
addBullet('Comprehensive inventory and order management');
addBullet('Full UK GDPR compliance');
addBullet('And much more..."');

// CUSTOMER SHOPPING EXPERIENCE
addPageBreak();
addTitle('Customer Shopping Experience');
addHorizontalLine();

addSubtitle('Homepage');
addBody('Navigate to the homepage');

addScript('"The homepage makes a powerful first impression with full-screen hero videos that automatically rotate. This creates an immersive, premium feel.');
doc.moveDown(0.2);
addScript('The announcement banner at the top is fully customizable to promote sales or important updates.');
doc.moveDown(0.2);
addScript('Navigation is clean and intuitive with gender-based filtering and quick access to all categories."');

doc.moveDown(0.3);
addAction('Let hero videos cycle through transitions');
addAction('Point out the announcement banner');
addAction('Hover over navigation items');
addAction('Show cart icon and wishlist');

doc.moveDown(0.5);
addSubtitle('Product Browsing');
addBody('Navigate to the shop page');

addScript('"The shop displays products in a beautiful grid layout. Customers can filter by category, size, color, and price range. Filtering is instant with no page reloads.');
doc.moveDown(0.2);
addScript('Each product card shows key information at a glance - image, name, price, and available colors."');

doc.moveDown(0.3);
addAction('Apply category filter');
addAction('Apply size filter');
addAction('Show price range slider');
addAction('Hover over product cards');

doc.moveDown(0.5);
addSubtitle('Product Details');
addBody('Click on any product');

addScript('"The product page gives customers everything they need - high-quality images with zoom, detailed descriptions, size guides, and reviews.');
doc.moveDown(0.2);
addScript('The size selector shows available stock. Adding to cart is instant with visual feedback."');

doc.moveDown(0.3);
addAction('Click through product images');
addAction('Open size guide');
addAction('Select size and color');
addAction('Click Add to Cart');
addAction('Show cart sliding in');

addPageBreak();
addSubtitle('Shopping Cart');
addBody('Open the cart');

addScript('"The cart provides a clear summary of all items. Customers can adjust quantities or remove items.');
doc.moveDown(0.2);
addScript('The free shipping progress bar shows how much more to spend for free shipping. This threshold is configurable by admins.');
doc.moveDown(0.2);
addScript('Subtotals update in real-time."');

doc.moveDown(0.3);
addAction('Adjust quantity');
addAction('Point out free shipping progress bar');
addAction('Show subtotal calculation');
addAction('Click Checkout');

doc.moveDown(0.5);
addSubtitle('Checkout');
addBody('Navigate to checkout');

addScript('"The streamlined checkout collects shipping details, contact info, and payment on one page.');
doc.moveDown(0.2);
addScript('Stripe handles secure payment processing with 256-bit SSL encryption.');
doc.moveDown(0.2);
addScript('Customers can apply discount codes and select shipping methods."');

doc.moveDown(0.3);
addAction('Fill in shipping details');
addAction('Show order summary');
addAction('Point out trust badges');
addAction('Show Stripe payment element');

doc.moveDown(0.5);
addSubtitle('Customer Account');
addBody('Navigate to customer login and account');

addScript('"Registered customers access their personal dashboard to view order history, track shipments, manage wishlists, and update settings.');
doc.moveDown(0.2);
addScript('The wishlist lets customers save items for later - great for increasing return visits."');

doc.moveDown(0.3);
addAction('Show login options');
addAction('Navigate through account tabs');
addAction('Show order history');
addAction('Open wishlist');

// VENDOR SYSTEM
addPageBreak();
addTitle('Vendor System');
addHorizontalLine();

addSubtitle('Vendor Registration');
addBody('Navigate to vendor application');

addScript('"Vendors are independent sellers who create and list their own products. Registration is straightforward - they provide business details and wait for admin approval.');
doc.moveDown(0.2);
addScript('This approval workflow ensures quality control."');

doc.moveDown(0.3);
addAction('Click Apply as Vendor');
addAction('Show registration form');
addAction('Explain required information');

doc.moveDown(0.5);
addSubtitle('Vendor Dashboard');
addBody('Navigate to vendor dashboard');

addScript('"Once approved, vendors access their dedicated dashboard - their command center for managing products.');
doc.moveDown(0.2);
addScript('Key metrics display at a glance: total products, sales, revenue, and pending orders."');

doc.moveDown(0.3);
addAction('Show dashboard overview');
addAction('Point out metrics cards');
addAction('Navigate through sections');

doc.moveDown(0.5);
addSubtitle('Creating Products');
addBody('Go to product creation');

addScript('"Creating a product is intuitive. Vendors enter name, description, pricing, and category. They upload images and set inventory levels.');
doc.moveDown(0.2);
addScript('The variant system allows different sizes and colors, each with its own stock level."');

doc.moveDown(0.3);
addAction('Click Add New Product');
addAction('Fill in product details');
addAction('Upload images');
addAction('Add size and color variants');
addAction('Set pricing and inventory');
addAction('Save the product');

addPageBreak();
addSubtitle('Managing Products');
addBody('Show product list');

addScript('"Vendors can view all products, edit details, update stock, and disable listings. The interface makes bulk management easy.');
doc.moveDown(0.2);
addScript('Sales analytics help vendors understand which products perform best."');

doc.moveDown(0.3);
addAction('Show product list');
addAction('Edit a product');
addAction('Update inventory');
addAction('Show sales statistics');

// RESELLER SYSTEM
addPageBreak();
addTitle('Reseller System');
addHorizontalLine();

addSubtitle('Reseller Registration');
addBody('Navigate to reseller application');

addScript('"Resellers purchase products at wholesale prices and resell to their customers. They focus on sales, not product creation.');
doc.moveDown(0.2);
addScript('Business verification ensures legitimate wholesale accounts."');

doc.moveDown(0.3);
addAction('Click Apply as Reseller');
addAction('Show registration form');
addAction('Explain approval process');

doc.moveDown(0.5);
addSubtitle('Reseller Dashboard');
addBody('Navigate to reseller dashboard');

addScript('"The reseller dashboard is designed for efficient ordering and sales management. Wholesale pricing, available products, and order status all in one place.');
doc.moveDown(0.2);
addScript('Features include bulk ordering and real-time inventory visibility."');

doc.moveDown(0.3);
addAction('Show dashboard overview');
addAction('Point out wholesale pricing');
addAction('Show available products');

doc.moveDown(0.5);
addSubtitle('Wholesale Ordering');
addBody('Show ordering process');

addScript('"Resellers browse the full catalog at wholesale prices. The discount tier system rewards larger orders.');
doc.moveDown(0.2);
addScript('Orders can be placed individually or in bulk using CSV upload."');

doc.moveDown(0.3);
addAction('Browse wholesale catalog');
addAction('Show tiered pricing');
addAction('Add items to order');
addAction('Show bulk upload option');

doc.moveDown(0.5);
addSubtitle('Branded Storefront');
addBody('Show storefront options');

addScript('"Each reseller can have their own branded storefront with custom branding, product selection, and pricing. This creates a white-label experience."');

doc.moveDown(0.3);
addAction('Show storefront customization');
addAction('Demonstrate brand settings');
addAction('Show customer-facing store');

addPageBreak();
addSubtitle('Commission & Reporting');
addBody('Show reseller analytics');

addScript('"The intelligent commission engine calculates earnings automatically. Resellers have full visibility into sales, commissions, and payouts through comprehensive reporting."');

doc.moveDown(0.3);
addAction('Show commission dashboard');
addAction('Display sales reports');
addAction('Show CRM features');
addAction('Export reports');

// ADMIN DASHBOARD
addPageBreak();
addTitle('Admin Dashboard');
addHorizontalLine();

addSubtitle('Dashboard Overview');
addBody('Log in and show main dashboard');

addScript('"The admin dashboard manages every aspect of the e-commerce operation. Critical metrics display at a glance - revenue, orders, customers, inventory.');
doc.moveDown(0.2);
addScript('Charts show trends over time for data-driven decisions."');

doc.moveDown(0.3);
addAction('Point out metric cards');
addAction('Show revenue chart');
addAction('Highlight recent orders');
addAction('Show top products');

doc.moveDown(0.5);
addSubtitle('Product Management');
addBody('Navigate to Products');

addScript('"Full catalog management is available. Add products, edit existing ones, manage variants, control visibility.');
doc.moveDown(0.2);
addScript('Bulk actions update multiple products simultaneously - essential for promotions."');

doc.moveDown(0.3);
addAction('Show product list with filters');
addAction('Add a new product');
addAction('Edit existing product');
addAction('Manage variants');
addAction('Demonstrate barcode scanning');

doc.moveDown(0.5);
addSubtitle('Order Management');
addBody('Navigate to Orders');

addScript('"Every order flows through this system. View details, update status, process refunds, communicate with customers.');
doc.moveDown(0.2);
addScript('Intelligent classification separates customer, vendor, and reseller orders automatically."');

doc.moveDown(0.3);
addAction('Show order list with filters');
addAction('View order details');
addAction('Update order status');
addAction('Show shipping labels');
addAction('Demonstrate refunds');

addPageBreak();
addSubtitle('Customer Management');
addBody('Navigate to Customers');

addScript('"The customer database tracks every user, their order history, and lifetime value. Segment customers for targeted marketing and identify VIPs."');

doc.moveDown(0.3);
addAction('Show customer list');
addAction('View customer details');
addAction('Show order history');
addAction('Point out loyalty tiers');

doc.moveDown(0.5);
addSubtitle('Inventory Management');
addBody('Navigate to Inventory');

addScript('"Real-time inventory tracking prevents overselling and alerts when stock runs low. Barcode scanning makes physical counts fast and accurate."');

doc.moveDown(0.3);
addAction('Show inventory dashboard');
addAction('Demonstrate low stock alerts');
addAction('Show barcode scanner');
addAction('Update stock levels');
addAction('Show inventory history');

doc.moveDown(0.5);
addSubtitle('B2B Partner Management');
addBody('Navigate to vendor/reseller management');

addScript('"Manage B2B partners from one location. Approve or reject applications, set commission rates, monitor performance.');
doc.moveDown(0.2);
addScript('CRM features provide insight into each partner\'s activity."');

doc.moveDown(0.3);
addAction('Show pending applications');
addAction('Approve/reject workflow');
addAction('Set commission rates');
addAction('View performance');

doc.moveDown(0.5);
addSubtitle('Team Management');
addBody('Navigate to Team');

addScript('"Invite team members with role-based permissions. Create admins, customer service reps, or inventory managers with appropriate access.');
doc.moveDown(0.2);
addScript('Email invitations sent automatically. Revoke access instantly if needed."');

doc.moveDown(0.3);
addAction('Show team member list');
addAction('Invite new member');
addAction('Set permissions');
addAction('Show department assignment');

addPageBreak();
addSubtitle('Settings & Configuration');
addBody('Navigate to Settings');

addScript('"The settings panel controls every configurable aspect of the store."');

doc.moveDown(0.5);
addBody('Shipping Settings:');
addScript('"Configure free shipping thresholds and standard costs. Toggle free shipping for promotions. Changes apply instantly."');
addAction('Show shipping settings');
addAction('Adjust threshold');
addAction('Set shipping cost');
addAction('Save and verify in cart');

doc.moveDown(0.5);
addBody('Hero Video Management:');
addScript('"Upload and manage hero videos for the homepage. External CDN URLs keep the site fast."');
addAction('Show video management');
addAction('Add a video URL');
addAction('Reorder videos');

doc.moveDown(0.5);
addBody('Announcement Banner:');
addScript('"Create announcements that display site-wide. Set colors, text, and destinations."');
addAction('Edit announcement text');
addAction('Change colors');
addAction('Toggle visibility');

doc.moveDown(0.5);
addSubtitle('Analytics & Reports');
addBody('Navigate to Analytics');

addScript('"The analytics suite tracks sales trends, top products, customer behavior, and marketing performance. Export reports for external analysis."');

doc.moveDown(0.3);
addAction('Show sales charts');
addAction('Display top products');
addAction('Show customer metrics');
addAction('Export a report');

// EPOS SYSTEMS
addPageBreak();
addTitle('EPOS Systems');
addHorizontalLine();

addBody('Navigate to EPOS selection');

addScript('"Three professional point-of-sale systems handle in-person transactions - pop-up shops, trade shows, or retail locations."');

doc.moveDown(0.5);
addSubtitle('Guest Terminal');
addBody('Navigate to guest terminal');

addScript('"The Guest Terminal handles staff-assisted sales. Enter products manually or scan barcodes, apply discounts, process card and cash payments.');
doc.moveDown(0.2);
addScript('The interface is optimized for quick transactions with touch-friendly buttons."');

doc.moveDown(0.3);
addAction('Add products to cart');
addAction('Scan a barcode');
addAction('Apply a discount');
addAction('Process cash payment');
addAction('Process card payment');
addAction('Show receipt printing');

doc.moveDown(0.5);
addSubtitle('Reseller Terminal');
addBody('Navigate to reseller terminal');

addScript('"The Reseller Terminal provides B2B partners a dedicated POS with wholesale pricing automatically applied. Sales track against their account for commission."');

doc.moveDown(0.3);
addAction('Login as reseller');
addAction('Show wholesale pricing');
addAction('Complete a transaction');
addAction('Show sale attribution');

doc.moveDown(0.5);
addSubtitle('Customer Self-Checkout');
addBody('Navigate to self-checkout');

addScript('"Self-Checkout lets customers complete purchases independently. Perfect for high-traffic environments.');
doc.moveDown(0.2);
addScript('Clear visual feedback guides customers through each step."');

doc.moveDown(0.3);
addAction('Scan items');
addAction('Review cart');
addAction('Complete payment');
addAction('Show confirmation');

addPageBreak();
addSubtitle('Receipt & Printing');
addBody('Show receipt functionality');

addScript('"All EPOS systems generate professional receipts - printed or emailed. Receipts include transaction details, branding, and return policy."');

doc.moveDown(0.3);
addAction('Show receipt preview');
addAction('Print a receipt');
addAction('Email receipt option');

// SECURITY & COMPLIANCE
addPageBreak();
addTitle('Security & Compliance');
addHorizontalLine();

addSubtitle('Authentication');
addBody('Show login options');

addScript('"Multiple authentication methods available - email/password, Google OAuth, and Replit Auth.');
doc.moveDown(0.2);
addScript('Password reset uses secure OTP verification via email."');

doc.moveDown(0.3);
addAction('Show login page options');
addAction('Demonstrate password reset');

doc.moveDown(0.5);
addSubtitle('GDPR Compliance');
addBody('Navigate to legal pages');

addScript('"For UK and EU markets, GDPR compliance is essential. Pre-built privacy policy, terms of service, and cookie policy pages included.');
doc.moveDown(0.2);
addScript('Cookie consent maintains a full audit trail of user preferences."');

doc.moveDown(0.3);
addAction('Show cookie consent banner');
addAction('Navigate to privacy policy');
addAction('Show terms of service');

doc.moveDown(0.5);
addSubtitle('Secure Payments');
addBody('Show checkout page');

addScript('"All payments process through Stripe - the industry leader in security. Card data goes directly to Stripe\'s PCI-compliant infrastructure."');

doc.moveDown(0.3);
addAction('Point out Stripe badge');
addAction('Show secure connection');
addAction('Mention 256-bit SSL');

// ADDITIONAL FEATURES
addPageBreak();
addTitle('Additional Features');
addHorizontalLine();

addSubtitle('AI Customer Service');
addBody('Show chatbot');

addScript('"The built-in AI chatbot handles common questions automatically. It uses keyword matching with an OpenAI fallback for complex queries."');

doc.moveDown(0.3);
addAction('Open chatbot');
addAction('Ask a question');
addAction('Show AI response');

doc.moveDown(0.5);
addSubtitle('Email Notifications');

addScript('"Automated emails keep customers informed - order confirmations, shipping updates, delivery notifications. Sent through SendGrid or Gmail."');

doc.moveDown(0.5);
addSubtitle('Wishlist & Alerts');
addBody('Show wishlist');

addScript('"Customers save items to wishlists and receive notifications when out-of-stock items return. This recovers significant lost sales."');

doc.moveDown(0.5);
addSubtitle('Abandoned Cart Recovery');

addScript('"Automated abandoned cart emails remind customers about items left behind. This can boost revenue by 10-15%."');

// TECHNICAL OVERVIEW
addPageBreak();
addTitle('Technical Overview');
addHorizontalLine();

addScript('"For technical audiences:');
doc.moveDown(0.3);
addScript('Frontend built with React 18 and TypeScript using Tailwind CSS. Backend runs Node.js with Express. PostgreSQL database with Drizzle ORM.');
doc.moveDown(0.3);
addScript('Architecture designed for scalability with clean separation and robust API layer. Fully typed codebase following modern best practices."');

// CLOSING
addPageBreak();
addTitle('Closing');
addHorizontalLine();

addBody('Return to homepage');

addScript('"Let\'s recap what this platform offers:');
doc.moveDown(0.3);
addScript('For customers: Beautiful shopping experience with secure checkout.');
doc.moveDown(0.2);
addScript('For vendors: Complete platform to list and sell products.');
doc.moveDown(0.2);
addScript('For resellers: Wholesale pricing, branded storefronts, commission tracking.');
doc.moveDown(0.2);
addScript('For admins: Total control over every aspect of the business.');
doc.moveDown(0.2);
addScript('Plus three EPOS systems, GDPR compliance, and enterprise-grade security."');

doc.moveDown(0.5);
addBody('Show contact information');

addScript('"This platform is ready to power your business. Whether starting fresh or migrating, we\'re here to help.');
doc.moveDown(0.3);
addScript('Built by Qanzak Global.');
doc.moveDown(0.3);
addScript('Thank you for watching."');

// URL REFERENCE
addPageBreak();
addTitle('URL Reference');
addHorizontalLine();

const urls = [
  { feature: 'Homepage', url: '/' },
  { feature: 'Shop', url: '/shop-clean' },
  { feature: 'Product Details', url: '/product/:id' },
  { feature: 'Checkout', url: '/checkout' },
  { feature: 'Customer Login', url: '/login' },
  { feature: 'Customer Account', url: '/account' },
  { feature: 'Admin Login', url: '/admin-login' },
  { feature: 'Admin Dashboard', url: '/admin' },
  { feature: 'Vendor Application', url: '/vendor' },
  { feature: 'Vendor Dashboard', url: '/vendor/dashboard' },
  { feature: 'Reseller Application', url: '/reseller' },
  { feature: 'Reseller Dashboard', url: '/reseller/dashboard' },
  { feature: 'B2B Login', url: '/b2b-login' },
  { feature: 'Guest EPOS', url: '/epos/guest-terminal' },
  { feature: 'Reseller EPOS', url: '/epos/reseller-terminal' },
  { feature: 'Self-Checkout', url: '/epos/self-checkout' },
  { feature: 'Privacy Policy', url: '/privacy-policy' },
  { feature: 'Terms of Service', url: '/terms-of-service' },
];

doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333')
  .text('Feature', 50, doc.y, { width: 200, continued: true })
  .text('URL', { width: 250 });
doc.moveDown(0.3);
doc.moveTo(50, doc.y).lineTo(400, doc.y).stroke('#cccccc');
doc.moveDown(0.3);

urls.forEach(item => {
  doc.fontSize(10).font('Helvetica').fillColor('#333333')
    .text(item.feature, 50, doc.y, { width: 200, continued: true })
    .font('Courier').fillColor('#0066cc')
    .text(item.url, { width: 250 });
  doc.moveDown(0.2);
});

// RECORDING TIPS
addPageBreak();
addTitle('Recording Tips');
addHorizontalLine();

addSubtitle('Preparation');
addBullet('Have sample products with images ready');
addBullet('Create test accounts for customer, vendor, reseller');
addBullet('Have sample orders in different statuses');
addBullet('Configure settings to show various states');

doc.moveDown(0.5);
addSubtitle('During Recording');
addBullet('Speak slowly and clearly');
addBullet('Pause at important moments');
addBullet('Use smooth mouse movements');
addBullet('Wait for page loads to complete');

doc.moveDown(0.5);
addSubtitle('Post-Production');
addBullet('Add chapter markers');
addBullet('Include intro/outro music');
addBullet('Add callout graphics');
addBullet('Consider subtitles');

doc.moveDown(0.5);
addSubtitle('Recommended Software');
addBullet('Screen recording: OBS Studio, Loom, Camtasia');
addBullet('Editing: DaVinci Resolve, Premiere Pro, Final Cut Pro');
addBullet('Graphics: Canva, After Effects');

doc.moveDown(2);
addHorizontalLine();
doc.fontSize(10).font('Helvetica-Oblique').fillColor('#888888')
  .text('End of Script', { align: 'center' });
doc.moveDown(0.3);
doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a2e')
  .text('Built by Qanzak Global', { align: 'center' });

doc.end();
console.log('PDF generated successfully: Premium_Ecommerce_Tutorial_Script.pdf');
