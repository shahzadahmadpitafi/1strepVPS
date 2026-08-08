import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { join } from 'path';

function createResellerGuidePDF() {
  console.log('🚀 Creating 1stRep Reseller User Guide PDF...');
  
  const outputPath = join(process.cwd(), 'public', '1stRep-Reseller-User-Guide.pdf');
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: '1stRep Reseller User Guide',
      Author: '1stRep',
      Subject: 'Complete guide for 1stRep reseller partners',
      Keywords: 'reseller, guide, 1stRep, ecommerce'
    }
  });

  const stream = createWriteStream(outputPath);
  doc.pipe(stream);

  // Helper functions
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);

  function addCoverPage() {
    doc.rect(0, 0, pageWidth, pageHeight).fill('#000000');
    doc.fillColor('#FFFFFF')
       .fontSize(60)
       .font('Helvetica-Bold')
       .text('1stRep', margin, 250, { align: 'center' });
    
    doc.fillColor('#3B82F6')
       .fontSize(32)
       .font('Helvetica')
       .text('Reseller User Guide', margin, 330, { align: 'center' });
    
    doc.fillColor('#FFFFFF')
       .fontSize(16)
       .text('Your Complete Guide to Success', margin, 390, { align: 'center' });
    
    doc.fillColor('#999999')
       .fontSize(12)
       .text('Version 1.0 | 2025', margin, 700, { align: 'center' });
    
    doc.addPage();
  }

  function addTableOfContents() {
    doc.fillColor('#000000')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('Table of Contents', margin, margin);
    
    const contents = [
      '1. Welcome to 1stRep Reseller Program',
      '2. Getting Started',
      '3. Application Process',
      '4. Your Reseller Dashboard',
      '5. Managing Your Storefront',
      '6. Product Management',
      '7. Pricing & Commissions',
      '8. Order Management',
      '9. Credit System',
      '10. Team Management',
      '11. Analytics & Reporting',
      '12. Best Practices',
      '13. Frequently Asked Questions',
      '14. Support & Contact'
    ];
    
    let y = margin + 60;
    doc.fontSize(12).font('Helvetica');
    
    contents.forEach(item => {
      doc.text(item, margin + 20, y);
      y += 25;
    });
    
    doc.addPage();
  }

  function addChapterTitle(title: string) {
    doc.fillColor('#000000')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text(title, margin, margin);
    
    doc.moveTo(margin, margin + 40)
       .lineTo(pageWidth - margin, margin + 40)
       .lineWidth(3)
       .strokeColor('#3B82F6')
       .stroke();
  }

  function addSection(title: string, y: number) {
    doc.fillColor('#1A1A1A')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(title, margin, y);
    return y + 25;
  }

  function addSubsection(title: string, y: number) {
    doc.fillColor('#333333')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(title, margin, y);
    return y + 20;
  }

  function addParagraph(text: string, y: number, options: any = {}) {
    doc.fillColor('#333333')
       .fontSize(10)
       .font('Helvetica')
       .text(text, margin, y, { width: contentWidth, align: 'justify', ...options });
    return y + doc.heightOfString(text, { width: contentWidth }) + 10;
  }

  function addBulletPoint(text: string, y: number) {
    doc.fillColor('#333333')
       .fontSize(10)
       .font('Helvetica')
       .text('•', margin, y)
       .text(text, margin + 15, y, { width: contentWidth - 15 });
    return y + doc.heightOfString(text, { width: contentWidth - 15 }) + 8;
  }

  function addInfoBox(title: string, content: string, y: number, color: string = '#E3F2FD') {
    const boxHeight = 80;
    doc.rect(margin, y, contentWidth, boxHeight)
       .fillAndStroke(color, '#2196F3');
    
    doc.fillColor('#000000')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(title, margin + 10, y + 10, { width: contentWidth - 20 });
    
    doc.fillColor('#333333')
       .fontSize(9)
       .font('Helvetica')
       .text(content, margin + 10, y + 30, { width: contentWidth - 20 });
    
    return y + boxHeight + 15;
  }

  // Cover Page
  addCoverPage();

  // Table of Contents
  addTableOfContents();

  // Chapter 1: Welcome
  addChapterTitle('1. Welcome to 1stRep Reseller Program');
  let y = margin + 60;
  
  y = addParagraph(
    'Welcome to the 1stRep Reseller Program! We\'re excited to partner with you in bringing premium fitness apparel to customers worldwide. This comprehensive guide will help you make the most of your reseller account and build a successful business with 1stRep.',
    y
  );

  y = addSection('What You\'ll Get', y + 10);
  y = addBulletPoint('Wholesale Pricing - Access exclusive wholesale prices with tiered discounts', y);
  y = addBulletPoint('Branded Storefront - Your own customizable online store', y);
  y = addBulletPoint('Commission Earnings - Earn on every sale with transparent tracking', y);
  y = addBulletPoint('Priority Support - Dedicated support team for your success', y);
  y = addBulletPoint('Marketing Materials - Product images and promotional content', y);
  y = addBulletPoint('Real-Time Analytics - Track sales, earnings, and customer behavior', y);

  y = addSection('Reseller Tiers', y + 20);
  y = addParagraph('Our reseller program features a tiered system that rewards performance:', y);
  
  y += 10;
  y = addSubsection('Bronze Tier', y);
  y = addBulletPoint('10% discount on wholesale prices', y);
  y = addBulletPoint('£1,000 credit limit', y);
  y = addBulletPoint('Entry level with basic dashboard access', y);

  y += 5;
  y = addSubsection('Silver Tier', y);
  y = addBulletPoint('15% discount on wholesale prices', y);
  y = addBulletPoint('£5,000 credit limit', y);
  y = addBulletPoint('Priority support and advanced analytics', y);

  y += 5;
  y = addSubsection('Gold Tier', y);
  y = addBulletPoint('20% discount on wholesale prices', y);
  y = addBulletPoint('£10,000 credit limit', y);
  y = addBulletPoint('Dedicated account manager and early product access', y);

  y += 5;
  y = addSubsection('Platinum Tier', y);
  y = addBulletPoint('25% discount on wholesale prices', y);
  y = addBulletPoint('£25,000 credit limit', y);
  y = addBulletPoint('Custom pricing, exclusive products, marketing support', y);

  y = addInfoBox(
    'Tier Progression',
    'Your tier is upgraded based on sales volume, order frequency, and payment history. Contact your account manager about advancement opportunities.',
    y + 15
  );

  // Chapter 2: Getting Started
  doc.addPage();
  addChapterTitle('2. Getting Started');
  y = margin + 60;

  y = addSection('Quick Start Checklist', y);
  y = addParagraph('Follow these 10 steps to get your reseller business up and running:', y);
  
  const steps = [
    'Complete your reseller application',
    'Wait for approval (typically 2-3 business days)',
    'Receive your login credentials via email',
    'Log in to your reseller dashboard',
    'Customize your storefront branding',
    'Select products for your store',
    'Set up your payment preferences',
    'Review and publish your storefront',
    'Share your storefront URL with customers',
    'Start selling and earning!'
  ];

  steps.forEach((step, index) => {
    y = addBulletPoint(`${index + 1}. ${step}`, y);
  });

  y = addSection('System Requirements', y + 15);
  y = addParagraph('To access your reseller dashboard, you\'ll need:', y);
  y = addBulletPoint('Modern web browser (Chrome, Firefox, Safari, Edge - latest version)', y);
  y = addBulletPoint('Stable internet connection', y);
  y = addBulletPoint('Email account for notifications', y);
  y = addBulletPoint('Business information (VAT number if applicable)', y);

  // Chapter 3: Application Process
  doc.addPage();
  addChapterTitle('3. Application Process');
  y = margin + 60;

  y = addSection('Who Can Apply?', y);
  y = addParagraph('We welcome applications from:', y);
  y = addBulletPoint('Established retail businesses', y);
  y = addBulletPoint('Fitness centers and gyms', y);
  y = addBulletPoint('Online retailers and e-commerce stores', y);
  y = addBulletPoint('Personal trainers and fitness professionals', y);
  y = addBulletPoint('Social media influencers with engaged audiences', y);
  y = addBulletPoint('Corporate wellness programs', y);

  y = addSection('Application Requirements', y + 15);
  y = addParagraph('To apply, you\'ll need to provide the following information:', y);
  y = addBulletPoint('Business Name - Legal name of your business', y);
  y = addBulletPoint('Contact Person - Primary contact name', y);
  y = addBulletPoint('Email Address - Business email for communications', y);
  y = addBulletPoint('Phone Number - Business phone number', y);
  y = addBulletPoint('Business Address - Physical business location', y);
  y = addBulletPoint('Business Type - Description of your business model', y);

  y = addSection('Application Timeline', y + 15);
  y = addInfoBox(
    'What Happens Next?',
    '1. Submission - Submit application  2. Confirmation - Immediate email  3. Review - 2-3 business days  4. Decision - Email notification  5. Onboarding - Login credentials if approved',
    y
  );

  y = addSection('Approval Criteria', y + 10);
  y = addParagraph('We evaluate applications based on:', y);
  y = addBulletPoint('Business legitimacy and track record', y);
  y = addBulletPoint('Target market alignment with our brand', y);
  y = addBulletPoint('Sales channel and customer reach', y);
  y = addBulletPoint('Marketing capabilities', y);
  y = addBulletPoint('Credit worthiness and financial stability', y);

  // Chapter 4: Dashboard
  doc.addPage();
  addChapterTitle('4. Your Reseller Dashboard');
  y = margin + 60;

  y = addSection('Dashboard Overview', y);
  y = addParagraph('Your reseller dashboard is your command center for managing your entire business.', y);

  y = addSection('Key Metrics Display', y + 10);
  y = addBulletPoint('Total Orders - Lifetime count of customer orders', y);
  y = addBulletPoint('Monthly Revenue - Sales revenue for current month', y);
  y = addBulletPoint('Commission Earned - Your earnings from storefront sales', y);
  y = addBulletPoint('Credit Available - Remaining credit limit for wholesale orders', y);
  y = addBulletPoint('Pending Orders - Orders awaiting fulfillment', y);
  y = addBulletPoint('Low Stock Alerts - Products requiring restock', y);

  y = addSection('Navigation Sections', y + 15);
  y = addBulletPoint('Overview - Dashboard home with key metrics', y);
  y = addBulletPoint('Storefront - Customize your branded store', y);
  y = addBulletPoint('Products - Select and manage your catalog', y);
  y = addBulletPoint('Orders - View customer orders and wholesale requests', y);
  y = addBulletPoint('Analytics - Sales reports and performance data', y);
  y = addBulletPoint('Team - Manage team member access', y);
  y = addBulletPoint('Messages - Communication with admin team', y);
  y = addBulletPoint('Settings - Account and profile configuration', y);

  // Chapter 5: Storefront Management
  doc.addPage();
  addChapterTitle('5. Managing Your Storefront');
  y = margin + 60;

  y = addSection('Storefront Customization', y);
  y = addParagraph('Your storefront is your brand\'s digital home. Make it uniquely yours with these options:', y);

  y = addSubsection('Branding Options', y + 10);
  y = addBulletPoint('Primary Color - Choose a color that represents your brand', y);
  y = addBulletPoint('Accent Color - Select a complementary color for highlights', y);
  y = addBulletPoint('Business Name - Display your business name prominently', y);
  y = addBulletPoint('Logo - Upload your business logo (recommended: 200x60px PNG)', y);
  y = addBulletPoint('Custom Domain - Connect your own domain (e.g., shop.yourbrand.com)', y);

  y = addInfoBox(
    'Branding Tip',
    'Choose colors that complement 1stRep\'s product photography. Darker, sophisticated colors often work best with our tactical/outdoor aesthetic.',
    y + 10,
    '#E3F2FD'
  );

  y = addSection('Custom Domain Setup', y + 10);
  y = addParagraph('Steps to use your own domain name:', y);
  y = addBulletPoint('Purchase a domain from your preferred registrar', y);
  y = addBulletPoint('Navigate to Storefront → Settings in your dashboard', y);
  y = addBulletPoint('Enter your custom domain', y);
  y = addBulletPoint('Follow the DNS configuration instructions', y);
  y = addBulletPoint('Wait for DNS propagation (usually 24-48 hours)', y);

  y = addSection('Storefront URL', y + 15);
  y = addParagraph('Your default storefront URL format: https://1strep.com/store/[your-business-slug]', y);
  y = addParagraph('Example: https://1strep.com/store/fitness-pro-london', y);

  // Chapter 6: Product Management
  doc.addPage();
  addChapterTitle('6. Product Management');
  y = margin + 60;

  y = addSection('Selecting Products', y);
  y = addParagraph('Choose which 1stRep products to feature in your storefront.', y);

  y = addSubsection('Product Selection Strategy', y + 10);
  y = addBulletPoint('Know Your Audience - Select products matching your customer demographics', y);
  y = addBulletPoint('Start Small - Begin with 10-20 core products, expand based on demand', y);
  y = addBulletPoint('Seasonal Mix - Balance year-round staples with seasonal items', y);
  y = addBulletPoint('Price Range - Offer options at different price points', y);
  y = addBulletPoint('Gender Balance - Consider your audience\'s gender breakdown', y);

  y = addSection('Available Product Categories', y + 15);
  y = addBulletPoint('Hoodies & Jumpers - Premium sweatshirts and hooded tops', y);
  y = addBulletPoint('T-Shirts - Performance and casual tees', y);
  y = addBulletPoint('Leggings - High-performance activewear bottoms', y);
  y = addBulletPoint('Shorts - Training and lifestyle shorts', y);
  y = addBulletPoint('Vests & Crop Tops - Sleeveless performance wear', y);
  y = addBulletPoint('Jackets - Outerwear and training jackets', y);
  y = addBulletPoint('Hats - Caps and headwear accessories', y);
  y = addBulletPoint('Accessories - Bags, water bottles, and gear', y);

  y = addSection('Adding Products to Your Store', y + 15);
  y = addParagraph('How to add products:', y);
  y = addBulletPoint('Navigate to Products → Browse Catalog', y);
  y = addBulletPoint('Use filters to find products by category, gender, or price', y);
  y = addBulletPoint('Click "Add to My Store" on desired products', y);
  y = addBulletPoint('Optionally set custom pricing', y);
  y = addBulletPoint('Products appear in your storefront immediately', y);

  y = addInfoBox(
    'Inventory Management',
    'All inventory is managed by 1stRep. You don\'t need to stock products. Orders are fulfilled directly by us, and you earn commission on each sale.',
    y + 10,
    '#D4EDDA'
  );

  // Chapter 7: Pricing & Commissions
  doc.addPage();
  addChapterTitle('7. Pricing & Commissions');
  y = margin + 60;

  y = addSection('Understanding Pricing', y);
  y = addParagraph('There are three key price points to understand:', y);
  y = addBulletPoint('Retail Price - Standard customer price on main store (e.g., £50.00)', y);
  y = addBulletPoint('Wholesale Price - Your discounted price based on tier (e.g., £40.00 at 20% off)', y);
  y = addBulletPoint('Storefront Price - Price customers see on your branded storefront (e.g., £48.00)', y);

  y = addSection('Commission Structure', y + 15);
  y = addParagraph('When customers purchase through your storefront, you earn commission. The system follows a 6-level priority system:', y);

  y = addSubsection('Commission Rule Priority (Highest to Lowest)', y + 10);
  y = addBulletPoint('1. Specific Product + Specific Reseller (highest priority)', y);
  y = addBulletPoint('2. Specific Product + All Resellers', y);
  y = addBulletPoint('3. Specific Category + Specific Reseller', y);
  y = addBulletPoint('4. Specific Category + All Resellers', y);
  y = addBulletPoint('5. All Products + Specific Reseller', y);
  y = addBulletPoint('6. All Products + All Resellers (default fallback)', y);

  y = addInfoBox(
    'How It Works',
    'The system automatically applies the highest priority rule that matches. For example, if you have a custom commission on a specific product, that takes precedence over category or default rates.',
    y + 10,
    '#E3F2FD'
  );

  y = addSection('Commission Types', y + 10);
  y = addBulletPoint('Percentage - Commission as % of product price (e.g., 20% of £50 = £10)', y);
  y = addBulletPoint('Fixed Amount - Flat commission per item (e.g., £12 per item sold)', y);

  y = addSection('Commission Calculation Example', y + 15);
  y = addInfoBox(
    'Sample Transaction',
    'Product: Elite Training Hoodie | Retail: £60 | Your Price: £60 | Commission: 25% | Customer Pays: £60 | Your Earnings: £15 | Platform Share: £45',
    y,
    '#D4EDDA'
  );

  // Chapter 8: Order Management
  doc.addPage();
  addChapterTitle('8. Order Management');
  y = margin + 60;

  y = addSection('Two Types of Orders', y);
  
  y = addSubsection('1. Customer Orders (Storefront Sales)', y + 10);
  y = addBulletPoint('Fulfillment - Handled entirely by 1stRep', y);
  y = addBulletPoint('Payment - Processed through 1stRep\'s Stripe account', y);
  y = addBulletPoint('Shipping - Sent directly from our warehouse to customer', y);
  y = addBulletPoint('Your Role - Monitor sales, provide support, earn commission', y);
  y = addBulletPoint('Commission - Automatically tracked and credited', y);

  y = addSubsection('2. Wholesale Orders (Stock Requests)', y + 10);
  y = addBulletPoint('Pricing - Wholesale prices based on your tier discount', y);
  y = addBulletPoint('Payment - Deducted from credit limit or paid upfront', y);
  y = addBulletPoint('Shipping - Sent to your business address', y);
  y = addBulletPoint('Your Role - Manage inventory, sell through your channels', y);
  y = addBulletPoint('Minimum Order - £200 minimum for wholesale orders', y);

  y = addSection('Order Status Workflow', y + 15);
  y = addBulletPoint('Pending - Order placed, awaiting payment confirmation', y);
  y = addBulletPoint('Paid - Payment received, preparing for shipment', y);
  y = addBulletPoint('Shipped - Order dispatched with tracking number', y);
  y = addBulletPoint('Delivered - Order received by customer', y);

  y = addInfoBox(
    'Customer Support',
    'While 1stRep handles fulfillment, your customers may contact you with questions. View order details in your dashboard and communicate with our support team via Messages.',
    y + 10,
    '#E3F2FD'
  );

  // Chapter 9: Credit System
  doc.addPage();
  addChapterTitle('9. Credit System');
  y = margin + 60;

  y = addSection('How Credit Works', y);
  y = addParagraph('Your credit account operates like a revolving credit line for wholesale inventory purchases.', y);

  y = addSection('Credit Limits by Tier', y + 10);
  y = addBulletPoint('Bronze - £1,000 initial credit limit (can be increased)', y);
  y = addBulletPoint('Silver - £5,000 initial credit limit (can be increased)', y);
  y = addBulletPoint('Gold - £10,000 initial credit limit (can be increased)', y);
  y = addBulletPoint('Platinum - £25,000 initial credit limit (custom limits available)', y);

  y = addSection('Payment Terms', y + 15);
  y = addBulletPoint('NET 30 - Payment due 30 days after invoice (standard)', y);
  y = addBulletPoint('NET 60 - Available for Silver tier and above', y);
  y = addBulletPoint('NET 90 - Available for Gold tier and above', y);
  y = addBulletPoint('Custom Terms - Negotiable for Platinum tier', y);

  y = addSection('Making Payments', y + 15);
  y = addParagraph('Pay your credit balance through your dashboard:', y);
  y = addBulletPoint('Navigate to Settings → Billing', y);
  y = addBulletPoint('View current balance and payment history', y);
  y = addBulletPoint('Click "Make Payment"', y);
  y = addBulletPoint('Enter payment amount and select payment method', y);
  y = addBulletPoint('Confirm payment and receive updated balance', y);

  y = addInfoBox(
    'Late Payment Policy',
    '5% late fee after 7 days past due. Credit frozen if 30+ days overdue. Account may be suspended if 60+ days overdue. Good payment history can increase your limit.',
    y + 10,
    '#FFF3CD'
  );

  // Chapter 10: Team Management
  doc.addPage();
  addChapterTitle('10. Team Management');
  y = margin + 60;

  y = addSection('Adding Team Members', y);
  y = addParagraph('As your business grows, add team members with different access levels to help manage your account.', y);

  y = addSection('Permission Levels', y + 10);
  y = addBulletPoint('View Only - Can view but cannot make changes (accountants, analysts)', y);
  y = addBulletPoint('Can Order - Can place wholesale orders within limits (purchasing managers)', y);
  y = addBulletPoint('Can Approve - Can approve orders and make changes (store managers)', y);
  y = addBulletPoint('Admin - Full access including team and billing (business owners)', y);

  y = addSection('Inviting Team Members', y + 15);
  y = addParagraph('Steps to add a team member:', y);
  y = addBulletPoint('Navigate to Team → Manage Team', y);
  y = addBulletPoint('Click "Add Team Member"', y);
  y = addBulletPoint('Enter their email address and name', y);
  y = addBulletPoint('Select their permission level', y);
  y = addBulletPoint('Optionally add department assignment', y);
  y = addBulletPoint('Click "Send Invitation"', y);
  y = addBulletPoint('They receive email with login credentials', y);

  y = addInfoBox(
    'Best Practice',
    'Assign the minimum permissions necessary for each role. This protects your account security and prevents accidental changes.',
    y + 10,
    '#E3F2FD'
  );

  // Chapter 11: Analytics & Reporting
  doc.addPage();
  addChapterTitle('11. Analytics & Reporting');
  y = margin + 60;

  y = addSection('Available Reports', y);
  y = addParagraph('Your dashboard provides comprehensive analytics to help you understand and grow your business.', y);

  y = addSection('Sales Analytics', y + 10);
  y = addBulletPoint('Revenue Trends - Daily, weekly, monthly sales tracking', y);
  y = addBulletPoint('Commission Earnings - Track earnings by product and category', y);
  y = addBulletPoint('Top Products - Best-selling items in your storefront', y);
  y = addBulletPoint('Customer Insights - Acquisition, retention, lifetime value', y);
  y = addBulletPoint('Conversion Rates - Store visits vs purchases', y);
  y = addBulletPoint('Geographic Data - Where your customers are located', y);

  y = addSection('Exporting Data', y + 15);
  y = addBulletPoint('CSV Format - For spreadsheet analysis', y);
  y = addBulletPoint('PDF Format - For presentations and sharing', y);
  y = addBulletPoint('Date Ranges - Custom date ranges for any report', y);
  y = addBulletPoint('Scheduled Reports - Receive weekly/monthly reports via email', y);

  y = addSection('Key Metrics to Monitor', y + 15);
  y = addBulletPoint('Conversion Rate - % of visitors who purchase (target: 2-4%)', y);
  y = addBulletPoint('Average Order Value - Average spend per transaction', y);
  y = addBulletPoint('Customer Retention - % who return (target: 20-30%)', y);
  y = addBulletPoint('Cart Abandonment - % of carts not completed (lower is better)', y);

  // Chapter 12: Best Practices
  doc.addPage();
  addChapterTitle('12. Best Practices');
  y = margin + 60;

  y = addSection('Marketing Your Storefront', y);
  
  y = addSubsection('Digital Marketing', y + 10);
  y = addBulletPoint('Social Media - Share your URL on Instagram, Facebook, TikTok', y);
  y = addBulletPoint('Email Marketing - Send newsletters featuring new products', y);
  y = addBulletPoint('Influencer Partnerships - Collaborate with fitness influencers', y);
  y = addBulletPoint('Content Marketing - Create fitness-related blog posts or videos', y);
  y = addBulletPoint('Paid Advertising - Use Facebook/Instagram ads to drive traffic', y);
  y = addBulletPoint('SEO - Optimize your storefront for search engines', y);

  y = addSubsection('In-Person Marketing', y + 10);
  y = addBulletPoint('Business Cards - Include your storefront URL', y);
  y = addBulletPoint('QR Codes - Create codes linking to your store for gym displays', y);
  y = addBulletPoint('Events - Set up booths at fitness events or competitions', y);
  y = addBulletPoint('Partnerships - Partner with local gyms for exclusive discounts', y);
  y = addBulletPoint('Referral Program - Reward customers who refer new buyers', y);

  y = addSection('Customer Service Excellence', y + 15);
  y = addBulletPoint('Respond to customer inquiries within 24 hours', y);
  y = addBulletPoint('Provide accurate product information and sizing guidance', y);
  y = addBulletPoint('Proactively communicate any delays or issues', y);
  y = addBulletPoint('Follow up after delivery to ensure satisfaction', y);
  y = addBulletPoint('Address complaints professionally and promptly', y);
  y = addBulletPoint('Use Messages section to escalate issues to support', y);

  y = addSection('Financial Management', y + 15);
  y = addBulletPoint('Monitor Credit - Track balance and payment due dates', y);
  y = addBulletPoint('Cash Flow - Plan wholesale orders around sales cycles', y);
  y = addBulletPoint('Profit Margins - Calculate margins considering commission rates', y);
  y = addBulletPoint('Record Keeping - Export monthly sales reports for accounting', y);
  y = addBulletPoint('Growth Investment - Reinvest commission earnings into marketing', y);

  // Chapter 13: FAQ
  doc.addPage();
  addChapterTitle('13. Frequently Asked Questions');
  y = margin + 60;

  y = addSection('Account & Application', y);
  
  y = addSubsection('Q: How long does approval take?', y + 10);
  y = addParagraph('A: Typically 2-3 business days. You\'ll receive an email notification with the decision.', y);

  y = addSubsection('Q: What if my application is rejected?', y + 5);
  y = addParagraph('A: You may reapply after 6 months. We\'ll provide feedback to help strengthen your next application.', y);

  y = addSubsection('Q: Can I have multiple storefronts?', y + 5);
  y = addParagraph('A: Yes, contact your account manager to discuss multi-storefront options for additional fees.', y);

  y = addSection('Products & Pricing', y + 15);
  
  y = addSubsection('Q: Do I need to stock inventory?', y + 10);
  y = addParagraph('A: No! For storefront sales, we handle all inventory and fulfillment. You only stock inventory if you place wholesale orders for your own retail operations.', y);

  y = addSubsection('Q: Can I sell on Amazon or eBay?', y + 5);
  y = addParagraph('A: You must get written approval before selling on third-party marketplaces. Contact your account manager.', y);

  y = addSubsection('Q: How often do you add new products?', y + 5);
  y = addParagraph('A: We release new products quarterly, with exclusive early access for Gold and Platinum tier resellers.', y);

  y = addSection('Orders & Fulfillment', y + 15);
  
  y = addSubsection('Q: How long does shipping take?', y + 10);
  y = addParagraph('A: UK orders: 2-5 business days. International: 7-14 business days. Expedited options available.', y);

  y = addSubsection('Q: What if a customer wants to return?', y + 5);
  y = addParagraph('A: Direct them to our 30-day return policy. Returns are processed through 1stRep\'s system, and commission is adjusted accordingly.', y);

  y = addSection('Payments & Commissions', y + 15);
  
  y = addSubsection('Q: When do I receive commission payments?', y + 10);
  y = addParagraph('A: Commissions are paid monthly, around the 15th of each month, for the previous month\'s confirmed sales.', y);

  y = addSubsection('Q: How are commissions paid?', y + 5);
  y = addParagraph('A: Direct bank transfer to your registered business account. Set up payment details in Settings → Billing.', y);

  // Chapter 14: Support
  doc.addPage();
  addChapterTitle('14. Support & Contact');
  y = margin + 60;

  y = addSection('Getting Help', y);
  y = addParagraph('We\'re here to support your success. Multiple support channels are available based on your needs.', y);

  y = addSection('Dashboard Messaging', y + 10);
  y = addInfoBox(
    'Recommended For: Order issues, product questions, account management',
    'Navigate to Messages in dashboard, click New Message, select category, describe issue. Response within 24 hours. Message history saved for reference.',
    y,
    '#D4EDDA'
  );

  y = addSection('Email Support', y + 10);
  y = addParagraph('Email: resellers@1strep.com', y);
  y = addParagraph('Response Time: Within 24 hours on business days', y);
  y = addParagraph('Best For: General inquiries, documentation requests, partnership discussions', y);

  y = addSection('Phone Support', y + 15);
  y = addParagraph('Phone: +44 (0) 20 XXXX XXXX (Gold and Platinum tiers)', y);
  y = addParagraph('Hours: Monday-Friday, 9 AM - 5 PM GMT', y);
  y = addParagraph('Best For: Urgent issues, technical problems, complex questions', y);

  y = addSection('Account Manager', y + 15);
  y = addParagraph('Gold and Platinum tier resellers are assigned dedicated account managers who provide:', y);
  y = addBulletPoint('Personalized business support and strategy', y);
  y = addBulletPoint('Direct contact via email and phone', y);
  y = addBulletPoint('Quarterly business reviews', y);
  y = addBulletPoint('Custom commission negotiations', y);
  y = addBulletPoint('Priority access to new products', y);
  y = addBulletPoint('Marketing and growth assistance', y);

  y = addSection('Training & Resources', y + 15);
  y = addBulletPoint('Video Tutorials - Dashboard walkthrough and feature guides', y);
  y = addBulletPoint('Marketing Materials - Product images and brand guidelines', y);
  y = addBulletPoint('Webinars - Monthly training on sales strategies', y);
  y = addBulletPoint('Knowledge Base - Searchable articles covering all topics', y);
  y = addBulletPoint('Community Forum - Connect with other resellers', y);

  y = addSection('Emergency Contact', y + 15);
  y = addInfoBox(
    'Urgent Issues Only',
    'For payment failures, storefront down, security concerns, or critical data loss. Email: urgent@1strep.com with subject "URGENT: [Your Issue]". Response within 2 hours, 24/7.',
    y,
    '#FFF3CD'
  );

  // Closing Page
  doc.addPage();
  doc.fillColor('#000000')
     .fontSize(36)
     .font('Helvetica-Bold')
     .text('Thank You!', margin, 200, { align: 'center' });
  
  doc.fontSize(14)
     .font('Helvetica')
     .text('We\'re excited to partner with you on this journey.', margin, 270, { 
       align: 'center',
       width: contentWidth 
     });
  
  doc.text('Together, we\'ll bring premium fitness apparel to customers worldwide.', margin, 300, { 
       align: 'center',
       width: contentWidth 
     });
  
  doc.fillColor('#3B82F6')
     .fontSize(20)
     .font('Helvetica-Bold')
     .text('Welcome to the 1stRep Family!', margin, 370, { align: 'center' });
  
  doc.fillColor('#666666')
     .fontSize(12)
     .font('Helvetica')
     .text('Questions? Contact us anytime at resellers@1strep.com', margin, 500, { 
       align: 'center',
       width: contentWidth 
     });
  
  doc.text('© 2025 1stRep Premium E-Commerce Platform. All rights reserved.', margin, 530, { 
       align: 'center',
       width: contentWidth 
     });

  // Finalize PDF
  doc.end();

  stream.on('finish', () => {
    console.log('✅ PDF generated successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📥 Download at: /1stRep-Reseller-User-Guide.pdf`);
  });

  stream.on('error', (err) => {
    console.error('❌ Error creating PDF:', err);
  });
}

// Run the generation
createResellerGuidePDF();
