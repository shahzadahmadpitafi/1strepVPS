import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { join } from 'path';

function createPracticalResellerGuide() {
  console.log('🚀 Creating Practical 1stRep Reseller Guide PDF...');
  
  const outputPath = join(process.cwd(), 'public', '1stRep-Reseller-User-Guide.pdf');
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: '1stRep Reseller User Guide',
      Author: '1stRep',
      Subject: 'How to use your 1stRep reseller account',
    }
  });

  const stream = createWriteStream(outputPath);
  doc.pipe(stream);

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
       .text('How to Use Your Reseller Account', margin, 390, { align: 'center' });
    
    doc.fillColor('#999999')
       .fontSize(12)
       .text('Version 1.0 | 2025', margin, 700, { align: 'center' });
    
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

  function addParagraph(text: string, y: number) {
    doc.fillColor('#333333')
       .fontSize(10)
       .font('Helvetica')
       .text(text, margin, y, { width: contentWidth, align: 'justify' });
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

  function addNumberedStep(number: number, text: string, y: number) {
    doc.fillColor('#3B82F6')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(`${number}.`, margin, y);
    
    doc.fillColor('#333333')
       .fontSize(10)
       .font('Helvetica')
       .text(text, margin + 20, y, { width: contentWidth - 20 });
    return y + doc.heightOfString(text, { width: contentWidth - 20 }) + 12;
  }

  function addInfoBox(title: string, content: string, y: number) {
    const boxHeight = 80;
    doc.rect(margin, y, contentWidth, boxHeight)
       .fillAndStroke('#E3F2FD', '#2196F3');
    
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

  // Chapter 1: Getting Started
  addChapterTitle('Getting Started');
  let y = margin + 60;
  
  y = addParagraph('Welcome! This guide will show you how to use your 1stRep reseller account. Once approved, you can start selling premium fitness apparel through your own branded storefront.', y);

  y = addSection('What You Get', y + 10);
  y = addBulletPoint('Your own branded storefront where customers can shop', y);
  y = addBulletPoint('Access to our full product catalog', y);
  y = addBulletPoint('Wholesale pricing based on your tier', y);
  y = addBulletPoint('Commission on every sale through your store', y);
  y = addBulletPoint('Dashboard to track everything', y);

  y = addSection('Quick Setup', y + 20);
  y = addNumberedStep(1, 'Log in to your reseller dashboard with your email and password', y);
  y = addNumberedStep(2, 'Choose your storefront colors (represents your brand)', y);
  y = addNumberedStep(3, 'Select products you want to sell', y);
  y = addNumberedStep(4, 'Share your storefront link with customers', y);
  y = addNumberedStep(5, 'Start earning commissions!', y);

  y = addInfoBox('Your Storefront Link', 'You\'ll get a unique URL like: 1strep.com/store/your-business-name. Share this link anywhere - social media, email, business cards.', y + 10);

  // Chapter 2: Your Dashboard
  doc.addPage();
  addChapterTitle('Your Dashboard Overview');
  y = margin + 60;

  y = addParagraph('Your dashboard is where you manage everything. Here\'s what you\'ll see when you log in:', y);

  y = addSection('Main Dashboard Tabs', y + 15);
  y = addBulletPoint('Overview - See your total orders, revenue, and commission earned', y);
  y = addBulletPoint('Storefront - Customize your store colors and look', y);
  y = addBulletPoint('Products - Choose which products to sell', y);
  y = addBulletPoint('Orders - See customer orders from your storefront', y);
  y = addBulletPoint('Analytics - View your sales performance', y);
  y = addBulletPoint('Messages - Contact support if you need help', y);

  y = addSection('Key Numbers You\'ll See', y + 20);
  y = addSubsection('Total Orders', y);
  y = addParagraph('How many customers have ordered through your storefront', y);
  
  y = addSubsection('Monthly Revenue', y + 5);
  y = addParagraph('Total sales this month from your customers', y);
  
  y = addSubsection('Commission Earned', y + 5);
  y = addParagraph('The money you\'ve earned - this gets paid to you monthly', y);
  
  y = addSubsection('Credit Available', y + 5);
  y = addParagraph('If you want to buy stock for yourself, this shows how much credit you have', y);

  // Chapter 3: Setting Up Your Storefront
  doc.addPage();
  addChapterTitle('Setting Up Your Storefront');
  y = margin + 60;

  y = addParagraph('Make your storefront look like your brand in just a few clicks.', y);

  y = addSection('Customize Your Look', y + 15);
  y = addNumberedStep(1, 'Go to "Storefront" tab in your dashboard', y);
  y = addNumberedStep(2, 'Click "Settings" or "Customize"', y);
  y = addNumberedStep(3, 'Choose your primary color (main brand color)', y);
  y = addNumberedStep(4, 'Choose your accent color (for buttons and highlights)', y);
  y = addNumberedStep(5, 'Add your business name', y);
  y = addNumberedStep(6, 'Click "Save Changes"', y);

  y = addInfoBox('Color Tips', 'Choose colors that represent your brand. Dark colors like black, navy, or charcoal work great with our products. Keep it simple and professional.', y + 10);

  y = addSection('Your Storefront Is Live', y + 10);
  y = addParagraph('Once you save your settings, your storefront is immediately live. Customers can start shopping right away at your unique link.', y);

  // Chapter 4: Adding Products
  doc.addPage();
  addChapterTitle('Adding Products to Your Store');
  y = margin + 60;

  y = addParagraph('Choose which 1stRep products you want to sell in your storefront. You don\'t stock anything - we handle all inventory and shipping.', y);

  y = addSection('How to Add Products', y + 15);
  y = addNumberedStep(1, 'Go to "Products" tab', y);
  y = addNumberedStep(2, 'Click "Browse Catalog"', y);
  y = addNumberedStep(3, 'Browse our products - hoodies, t-shirts, leggings, shorts, etc.', y);
  y = addNumberedStep(4, 'Click "Add to My Store" on products you like', y);
  y = addNumberedStep(5, 'Products appear in your storefront immediately', y);

  y = addSection('Product Categories', y + 15);
  y = addBulletPoint('Hoodies & Jumpers', y);
  y = addBulletPoint('T-Shirts', y);
  y = addBulletPoint('Leggings', y);
  y = addBulletPoint('Shorts', y);
  y = addBulletPoint('Vests & Crop Tops', y);
  y = addBulletPoint('Jackets', y);
  y = addBulletPoint('Hats', y);
  y = addBulletPoint('Accessories', y);

  y = addSection('Tips for Choosing Products', y + 20);
  y = addBulletPoint('Start with 10-20 products - don\'t overwhelm customers', y);
  y = addBulletPoint('Pick products your audience would like', y);
  y = addBulletPoint('Mix different categories (tops, bottoms, accessories)', y);
  y = addBulletPoint('You can add or remove products anytime', y);

  y = addInfoBox('No Inventory Needed', 'You never need to buy or store products. When customers order from your storefront, we ship directly to them and you earn commission.', y + 10);

  // Chapter 5: Understanding Earnings
  doc.addPage();
  addChapterTitle('How You Earn Money');
  y = margin + 60;

  y = addParagraph('You earn commission on every sale made through your storefront. Here\'s how it works:', y);

  y = addSection('Commission Rates', y + 15);
  y = addParagraph('Your commission depends on the product and your tier. Typically:', y + 5);
  y = addBulletPoint('Bronze Tier - Around 15-20% commission', y);
  y = addBulletPoint('Silver Tier - Around 20-25% commission', y);
  y = addBulletPoint('Gold Tier - Around 25-30% commission', y);
  y = addBulletPoint('Platinum Tier - Custom rates, often 30%+', y);

  y = addSection('Example Earnings', y + 20);
  y = addParagraph('Customer buys a hoodie for £60:', y);
  y = addBulletPoint('At 25% commission = You earn £15', y);
  y = addBulletPoint('At 30% commission = You earn £18', y);
  
  y = addParagraph('Customer buys 5 items totaling £200:', y + 10);
  y = addBulletPoint('At 25% commission = You earn £50', y);
  y = addBulletPoint('At 30% commission = You earn £60', y);

  y = addSection('When Do You Get Paid?', y + 20);
  y = addParagraph('Commissions are paid monthly around the 15th of each month for the previous month\'s sales. Payment goes directly to your bank account.', y);

  y = addInfoBox('Track Your Earnings', 'Go to Analytics tab to see exactly how much you\'ve earned, which products sell best, and your monthly trends.', y + 10);

  // Chapter 6: Managing Orders
  doc.addPage();
  addChapterTitle('Managing Customer Orders');
  y = margin + 60;

  y = addParagraph('When customers buy from your storefront, you can track everything in your dashboard.', y);

  y = addSection('Viewing Orders', y + 15);
  y = addNumberedStep(1, 'Go to "Orders" tab', y);
  y = addNumberedStep(2, 'Click "Customer Orders"', y);
  y = addNumberedStep(3, 'See all orders from your storefront', y);

  y = addSection('What You\'ll See', y + 15);
  y = addBulletPoint('Order number and date', y);
  y = addBulletPoint('Customer name and email', y);
  y = addBulletPoint('What they ordered', y);
  y = addBulletPoint('Total amount', y);
  y = addBulletPoint('Your commission from that order', y);
  y = addBulletPoint('Order status (Pending, Paid, Shipped, Delivered)', y);

  y = addSection('Order Status Explained', y + 20);
  y = addBulletPoint('Pending - Order just placed, payment processing', y);
  y = addBulletPoint('Paid - Payment received, we\'re preparing to ship', y);
  y = addBulletPoint('Shipped - Package sent to customer with tracking', y);
  y = addBulletPoint('Delivered - Customer received their order', y);

  y = addInfoBox('We Handle Everything', 'You don\'t pack or ship anything. We handle all fulfillment, shipping, and tracking. You just track your sales and earnings.', y + 10);

  y = addSection('If Customers Contact You', y + 10);
  y = addParagraph('Sometimes customers may ask you questions. You can:', y);
  y = addBulletPoint('Check order status in your dashboard', y);
  y = addBulletPoint('Contact our support team via Messages tab for help', y);
  y = addBulletPoint('Direct customers to our support for returns or issues', y);

  // Chapter 7: Wholesale Orders (Optional)
  doc.addPage();
  addChapterTitle('Buying Stock for Yourself (Optional)');
  y = margin + 60;

  y = addParagraph('Besides earning commission, you can also buy products at wholesale prices to sell yourself (at events, your gym, etc.).', y);

  y = addSection('Wholesale Pricing', y + 15);
  y = addParagraph('Based on your tier, you get discounts:', y);
  y = addBulletPoint('Bronze - 10% off retail prices', y);
  y = addBulletPoint('Silver - 15% off retail prices', y);
  y = addBulletPoint('Gold - 20% off retail prices', y);
  y = addBulletPoint('Platinum - 25% off retail prices', y);

  y = addSection('How to Order Stock', y + 20);
  y = addNumberedStep(1, 'Go to "Orders" tab', y);
  y = addNumberedStep(2, 'Click "Place Stock Order"', y);
  y = addNumberedStep(3, 'Add products to cart', y);
  y = addNumberedStep(4, 'See your wholesale prices', y);
  y = addNumberedStep(5, 'Choose payment: Credit Account or Card', y);
  y = addNumberedStep(6, 'Confirm order - products ship to your address', y);

  y = addSection('Credit Account', y + 15);
  y = addParagraph('Each tier has a credit limit for wholesale orders:', y);
  y = addBulletPoint('Bronze - £1,000 credit limit', y);
  y = addBulletPoint('Silver - £5,000 credit limit', y);
  y = addBulletPoint('Gold - £10,000 credit limit', y);
  y = addBulletPoint('Platinum - £25,000 credit limit', y);

  y = addParagraph('You pay back the credit monthly (NET 30 terms = due in 30 days).', y + 10);

  // Chapter 8: Marketing Your Store
  doc.addPage();
  addChapterTitle('Getting Customers to Your Storefront');
  y = margin + 60;

  y = addParagraph('Here\'s how to drive traffic to your storefront and make sales:', y);

  y = addSection('Share Your Link Everywhere', y + 15);
  y = addBulletPoint('Post on Instagram, Facebook, TikTok', y);
  y = addBulletPoint('Add to your email signature', y);
  y = addBulletPoint('Put on business cards', y);
  y = addBulletPoint('Share in your gym or fitness studio', y);
  y = addBulletPoint('Include in your newsletter or emails', y);
  y = addBulletPoint('Add to your website or blog', y);

  y = addSection('Social Media Tips', y + 20);
  y = addBulletPoint('Post product photos with your storefront link', y);
  y = addBulletPoint('Share when new products are added', y);
  y = addBulletPoint('Create workout content and mention your store', y);
  y = addBulletPoint('Use Instagram Stories with swipe-up links', y);
  y = addBulletPoint('Collaborate with fitness influencers', y);

  y = addSection('Offline Marketing', y + 20);
  y = addBulletPoint('Put your storefront link on flyers at your gym', y);
  y = addBulletPoint('Create QR codes people can scan', y);
  y = addBulletPoint('Set up a booth at fitness events', y);
  y = addBulletPoint('Offer exclusive discounts to gym members', y);

  y = addInfoBox('Track What Works', 'Check your Analytics tab to see where customers are coming from and which products sell best. Focus on what works!', y + 10);

  // Chapter 9: Tips for Success
  doc.addPage();
  addChapterTitle('Tips for Success');
  y = margin + 60;

  y = addSection('Product Selection', y);
  y = addBulletPoint('Start with bestsellers - check which products are popular', y);
  y = addBulletPoint('Match your audience - gym gear for gym-goers, athleisure for lifestyle', y);
  y = addBulletPoint('Update seasonally - lighter items in summer, hoodies in winter', y);
  y = addBulletPoint('Don\'t overload - 15-25 products is perfect to start', y);

  y = addSection('Customer Service', y + 20);
  y = addBulletPoint('Respond quickly to customer questions', y);
  y = addBulletPoint('Be honest about sizing - use our size guides', y);
  y = addBulletPoint('Follow up after purchases to build loyalty', y);
  y = addBulletPoint('Use the Messages tab to get help from our team', y);

  y = addSection('Growing Your Business', y + 20);
  y = addBulletPoint('Post consistently on social media', y);
  y = addBulletPoint('Build an email list of interested customers', y);
  y = addBulletPoint('Reinvest commission earnings into paid ads', y);
  y = addBulletPoint('Track which products sell and promote those', y);
  y = addBulletPoint('Ask happy customers for reviews and testimonials', y);

  y = addSection('Common Mistakes to Avoid', y + 20);
  y = addBulletPoint('Don\'t add too many products at once', y);
  y = addBulletPoint('Don\'t ignore your analytics - they show what works', y);
  y = addBulletPoint('Don\'t forget to share your link regularly', y);
  y = addBulletPoint('Don\'t try to compete on price - focus on value', y);

  // Chapter 10: Getting Help
  doc.addPage();
  addChapterTitle('Getting Help & Support');
  y = margin + 60;

  y = addSection('Dashboard Messages', y);
  y = addParagraph('This is the best way to get help:', y);
  y = addNumberedStep(1, 'Go to "Messages" tab in your dashboard', y);
  y = addNumberedStep(2, 'Click "New Message"', y);
  y = addNumberedStep(3, 'Describe your question or issue', y);
  y = addNumberedStep(4, 'Get a response within 24 hours', y);

  y = addSection('Common Questions', y + 15);
  
  y = addSubsection('How do I change my storefront colors?', y);
  y = addParagraph('Go to Storefront → Settings → Choose new colors → Save Changes', y);

  y = addSubsection('How do I add more products?', y + 5);
  y = addParagraph('Go to Products → Browse Catalog → Click "Add to My Store" on any product', y);

  y = addSubsection('When do I get paid?', y + 5);
  y = addParagraph('Around the 15th of each month for the previous month\'s sales', y);

  y = addSubsection('Can I remove products from my store?', y + 5);
  y = addParagraph('Yes! Go to Products → My Products → Click remove on any product', y);

  y = addSubsection('How do I track my earnings?', y + 5);
  y = addParagraph('Go to Analytics tab to see all your earnings, sales, and trends', y);

  y = addSection('Email Support', y + 20);
  y = addParagraph('For general inquiries: resellers@1strep.com', y);
  y = addParagraph('We respond within 24 hours on business days', y);

  y = addInfoBox('You\'re Not Alone', 'We want you to succeed! Don\'t hesitate to reach out if you need help, have questions, or want advice on growing your business.', y + 15);

  // Closing Page
  doc.addPage();
  doc.fillColor('#000000')
     .fontSize(36)
     .font('Helvetica-Bold')
     .text('You\'re Ready to Sell!', margin, 200, { align: 'center' });
  
  doc.fontSize(14)
     .font('Helvetica')
     .text('Now you know everything you need to run your 1stRep reseller business.', margin, 270, { 
       align: 'center',
       width: contentWidth 
     });
  
  doc.fontSize(14)
     .font('Helvetica')
     .text('Log in, set up your storefront, add products, and start sharing your link!', margin, 310, { 
       align: 'center',
       width: contentWidth 
     });
  
  doc.fillColor('#3B82F6')
     .fontSize(20)
     .font('Helvetica-Bold')
     .text('Welcome to 1stRep!', margin, 370, { align: 'center' });
  
  doc.fillColor('#666666')
     .fontSize(12)
     .font('Helvetica')
     .text('Questions? Message us in your dashboard or email resellers@1strep.com', margin, 500, { 
       align: 'center',
       width: contentWidth 
     });
  
  doc.text('© 2025 1stRep Premium E-Commerce Platform', margin, 530, { 
       align: 'center',
       width: contentWidth 
     });

  doc.end();

  stream.on('finish', () => {
    console.log('✅ Practical guide PDF created!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📥 Download at: /1stRep-Reseller-User-Guide.pdf`);
  });

  stream.on('error', (err) => {
    console.error('❌ Error creating PDF:', err);
  });
}

createPracticalResellerGuide();
