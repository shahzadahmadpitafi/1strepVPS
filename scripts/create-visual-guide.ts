import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { join } from 'path';

function createVisualGuide() {
  console.log('🚀 Creating Visual Step-by-Step Guide...');
  
  const outputPath = join(process.cwd(), 'public', '1stRep-Reseller-User-Guide.pdf');
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: '1stRep Reseller User Guide',
      Author: '1stRep',
      Subject: 'Step-by-step guide to using your reseller dashboard',
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
       .text('Step-by-Step Dashboard Walkthrough', margin, 390, { align: 'center' });
    
    doc.fillColor('#999999')
       .fontSize(12)
       .text('Version 1.0 | 2025', margin, 700, { align: 'center' });
    
    doc.addPage();
  }

  function addScreenTitle(title: string, y: number) {
    doc.rect(margin, y, contentWidth, 35)
       .fillAndStroke('#000000', '#000000');
    
    doc.fillColor('#FFFFFF')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(title, margin + 10, y + 10);
    
    return y + 45;
  }

  function addStep(number: number, text: string, y: number) {
    doc.fillColor('#3B82F6')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(`Step ${number}:`, margin, y);
    
    doc.fillColor('#333333')
       .fontSize(10)
       .font('Helvetica')
       .text(text, margin + 50, y, { width: contentWidth - 50 });
    
    return y + doc.heightOfString(text, { width: contentWidth - 50 }) + 15;
  }

  function addUIElement(label: string, description: string, y: number) {
    doc.fillColor('#666666')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text(`[${label}]`, margin + 15, y);
    
    doc.fillColor('#333333')
       .fontSize(9)
       .font('Helvetica')
       .text(description, margin + 90, y, { width: contentWidth - 90 });
    
    return y + Math.max(20, doc.heightOfString(description, { width: contentWidth - 90 }) + 8);
  }

  function addNote(text: string, y: number) {
    const noteHeight = doc.heightOfString(text, { width: contentWidth - 30 }) + 20;
    doc.rect(margin, y, contentWidth, noteHeight)
       .fillAndStroke('#FFF9E6', '#FFD700');
    
    doc.fillColor('#000000')
       .fontSize(9)
       .font('Helvetica')
       .text(text, margin + 15, y + 10, { width: contentWidth - 30 });
    
    return y + noteHeight + 10;
  }

  function addSeparator(y: number) {
    doc.moveTo(margin, y)
       .lineTo(pageWidth - margin, y)
       .lineWidth(1)
       .strokeColor('#CCCCCC')
       .stroke();
    return y + 15;
  }

  // Cover Page
  addCoverPage();

  // Page 1: Logging In
  let y = margin;
  y = addScreenTitle('SCREEN 1: Login Page', y);
  
  y = addStep(1, 'Open your web browser and go to your 1stRep reseller portal URL', y);
  y = addStep(2, 'You will see the login screen with two input boxes:', y);
  
  y = addUIElement('Email field', 'Enter the email address you used to register', y);
  y = addUIElement('Password field', 'Enter your password', y);
  y = addUIElement('LOG IN button', 'Click this blue button to sign in', y);
  
  y = addNote('If you forgot your password, click "Forgot Password?" below the login button', y);
  
  y = addSeparator(y);
  y = addStep(3, 'After clicking LOG IN, you will be taken to your dashboard', y);

  // Page 2: Dashboard Overview
  doc.addPage();
  y = margin;
  y = addScreenTitle('SCREEN 2: Dashboard Home (Overview Tab)', y);
  
  y = addStep(1, 'When you first log in, you see the Overview dashboard. At the top you will see:', y);
  
  y = addUIElement('Sidebar Menu', 'Left side - shows all navigation options', y);
  y = addUIElement('Main Content', 'Center - shows your dashboard stats', y);
  
  y = addSeparator(y);
  y = addStep(2, 'In the sidebar menu, you will see these tabs (from top to bottom):', y);
  
  y = addUIElement('Overview', 'Main dashboard - you are here now', y);
  y = addUIElement('Storefront', 'Customize your store colors and branding', y);
  y = addUIElement('Products', 'Add products to your store', y);
  y = addUIElement('Orders', 'View customer orders', y);
  y = addUIElement('Analytics', 'See your sales reports', y);
  y = addUIElement('Team', 'Add team members (optional)', y);
  y = addUIElement('Messages', 'Contact support', y);
  y = addUIElement('Settings', 'Your account settings', y);
  
  y = addSeparator(y);
  y = addStep(3, 'In the main content area, you will see 4 stat cards:', y);
  
  y = addUIElement('Total Orders', 'Shows number of customer orders', y);
  y = addUIElement('Monthly Revenue', 'Shows this month\'s sales total', y);
  y = addUIElement('Commission Earned', 'Shows your earnings', y);
  y = addUIElement('Credit Available', 'Shows remaining credit for stock orders', y);

  // Page 3: Storefront Tab
  doc.addPage();
  y = margin;
  y = addScreenTitle('SCREEN 3: Storefront Tab - Customizing Your Store', y);
  
  y = addStep(1, 'Click "Storefront" in the left sidebar', y);
  y = addStep(2, 'You will see your storefront customization options:', y);
  
  y = addUIElement('Business Name', 'Text field - enter your business name', y);
  y = addUIElement('Primary Color', 'Color picker - click to choose your main brand color', y);
  y = addUIElement('Accent Color', 'Color picker - click to choose your accent color', y);
  y = addUIElement('Store Status', 'Toggle switch - turn your store ON or OFF', y);
  
  y = addSeparator(y);
  y = addStep(3, 'To change colors:', y);
  
  y = addNote('Click on the color box → A color picker will appear → Click on the color you want → Click outside to close → Your store updates automatically', y);
  
  y = addSeparator(y);
  y = addStep(4, 'At the bottom of the page:', y);
  
  y = addUIElement('SAVE CHANGES button', 'Blue button - click to save your customization', y);
  y = addUIElement('View Storefront button', 'Opens your live store in new tab', y);
  
  y = addSeparator(y);
  y = addStep(5, 'Your storefront URL will be shown at the top:', y);
  y = addNote('Example: 1strep.com/store/your-business-name - Copy this link to share with customers', y);

  // Page 4: Products Tab - Browsing
  doc.addPage();
  y = margin;
  y = addScreenTitle('SCREEN 4: Products Tab - Adding Products', y);
  
  y = addStep(1, 'Click "Products" in the left sidebar', y);
  y = addStep(2, 'You will see two sub-sections at the top:', y);
  
  y = addUIElement('My Products', 'Shows products currently in your store', y);
  y = addUIElement('Browse Catalog', 'Shows all available 1stRep products', y);
  
  y = addSeparator(y);
  y = addStep(3, 'Click "Browse Catalog" to see all products', y);
  y = addStep(4, 'You will see filter options at the top:', y);
  
  y = addUIElement('Category dropdown', 'Click to filter by product type (Hoodies, T-Shirts, etc.)', y);
  y = addUIElement('Gender dropdown', 'Click to filter by Men\'s or Women\'s products', y);
  y = addUIElement('Search box', 'Type to search for specific products', y);
  
  y = addSeparator(y);
  y = addStep(5, 'Each product card shows:', y);
  
  y = addUIElement('Product Image', 'Photo of the product', y);
  y = addUIElement('Product Name', 'Name of the item', y);
  y = addUIElement('Price', 'Retail price customers will pay', y);
  y = addUIElement('ADD TO STORE button', 'Green button - click to add this product to your store', y);
  
  y = addNote('When you click ADD TO STORE, the button changes to "REMOVE" and the product appears in your storefront immediately', y);

  // Page 5: Products Tab - Managing
  doc.addPage();
  y = margin;
  y = addScreenTitle('SCREEN 5: Products Tab - Managing Your Products', y);
  
  y = addStep(1, 'Click "My Products" at the top to see products in your store', y);
  y = addStep(2, 'Each product card shows:', y);
  
  y = addUIElement('Product Image', 'Photo of the product', y);
  y = addUIElement('Product Name', 'Name of the item', y);
  y = addUIElement('Status', 'Shows if product is "In Stock" or "Out of Stock"', y);
  y = addUIElement('REMOVE button', 'Red button - click to remove product from your store', y);
  
  y = addSeparator(y);
  y = addStep(3, 'To remove a product from your store:', y);
  y = addNote('Click the red REMOVE button → Product is removed from your storefront immediately → It will no longer show to customers', y);
  
  y = addSeparator(y);
  y = addStep(4, 'You can add it back anytime by going to Browse Catalog', y);

  // Page 6: Orders Tab
  doc.addPage();
  y = margin;
  y = addScreenTitle('SCREEN 6: Orders Tab - Viewing Customer Orders', y);
  
  y = addStep(1, 'Click "Orders" in the left sidebar', y);
  y = addStep(2, 'You will see two tabs at the top:', y);
  
  y = addUIElement('Customer Orders', 'Orders from your storefront customers', y);
  y = addUIElement('Stock Orders', 'Your wholesale orders (if you buy stock)', y);
  
  y = addSeparator(y);
  y = addStep(3, 'Click "Customer Orders" to see orders from your store', y);
  y = addStep(4, 'You will see a table with these columns:', y);
  
  y = addUIElement('Order #', 'Order number (e.g., #1001)', y);
  y = addUIElement('Date', 'When order was placed', y);
  y = addUIElement('Customer', 'Customer name', y);
  y = addUIElement('Items', 'Number of items ordered', y);
  y = addUIElement('Total', 'Order total amount', y);
  y = addUIElement('Status', 'Order status (Pending/Paid/Shipped/Delivered)', y);
  y = addUIElement('VIEW button', 'Click to see order details', y);
  
  y = addSeparator(y);
  y = addStep(5, 'Status badges are color-coded:', y);
  
  y = addUIElement('Yellow badge', 'Pending - waiting for payment', y);
  y = addUIElement('Blue badge', 'Paid - preparing to ship', y);
  y = addUIElement('Purple badge', 'Shipped - on the way to customer', y);
  y = addUIElement('Green badge', 'Delivered - customer received order', y);

  // Page 7: Order Details
  doc.addPage();
  y = margin;
  y = addScreenTitle('SCREEN 7: Order Details View', y);
  
  y = addStep(1, 'Click the VIEW button on any order to see details', y);
  y = addStep(2, 'A popup window will appear showing:', y);
  
  y = addUIElement('Order Number', 'At the top (e.g., Order #1001)', y);
  y = addUIElement('Order Date', 'When customer placed order', y);
  y = addUIElement('Customer Info', 'Name and email address', y);
  y = addUIElement('Shipping Address', 'Where order is being sent', y);
  
  y = addSeparator(y);
  y = addStep(3, 'Below that, you will see "Order Items" section:', y);
  
  y = addUIElement('Product Names', 'List of items ordered', y);
  y = addUIElement('Size/Color', 'Variant details for each item', y);
  y = addUIElement('Quantity', 'How many of each item', y);
  y = addUIElement('Price', 'Price per item', y);
  
  y = addSeparator(y);
  y = addStep(4, 'At the bottom:', y);
  
  y = addUIElement('Subtotal', 'Total before shipping', y);
  y = addUIElement('Shipping', 'Shipping cost', y);
  y = addUIElement('Total', 'Final amount paid', y);
  y = addUIElement('CLOSE button', 'Click to close this popup', y);

  // Page 8: Analytics Tab
  doc.addPage();
  y = margin;
  y = addScreenTitle('SCREEN 8: Analytics Tab - Sales Reports', y);
  
  y = addStep(1, 'Click "Analytics" in the left sidebar', y);
  y = addStep(2, 'You will see your sales dashboard with:', y);
  
  y = addUIElement('Date Range Selector', 'Dropdown at top - choose Last 7 Days, Last 30 Days, etc.', y);
  y = addUIElement('Sales Chart', 'Graph showing your daily sales', y);
  y = addUIElement('Top Products', 'List of your best-selling items', y);
  y = addUIElement('Revenue Breakdown', 'Pie chart of sales by category', y);
  
  y = addSeparator(y);
  y = addStep(3, 'To change the date range:', y);
  y = addNote('Click the date dropdown → Select a time period → Charts update automatically', y);
  
  y = addSeparator(y);
  y = addStep(4, 'At the bottom of the page:', y);
  
  y = addUIElement('EXPORT CSV button', 'Download your data as spreadsheet', y);
  y = addUIElement('EXPORT PDF button', 'Download printable report', y);

  // Page 9: Team Tab
  doc.addPage();
  y = margin;
  y = addScreenTitle('SCREEN 9: Team Tab - Managing Team Members', y);
  
  y = addStep(1, 'Click "Team" in the left sidebar', y);
  y = addStep(2, 'You will see a list of team members (if any) and:', y);
  
  y = addUIElement('ADD TEAM MEMBER button', 'Blue button at top right', y);
  
  y = addSeparator(y);
  y = addStep(3, 'To add a team member, click ADD TEAM MEMBER button', y);
  y = addStep(4, 'A form will appear with these fields:', y);
  
  y = addUIElement('Email', 'Enter team member\'s email address', y);
  y = addUIElement('Name', 'Enter their full name', y);
  y = addUIElement('Job Title', 'Enter their role (optional)', y);
  y = addUIElement('Departments', 'Select which areas they can access', y);
  y = addUIElement('ADD TEAM MEMBER button', 'Click to send invitation', y);
  y = addUIElement('CANCEL button', 'Click to close without adding', y);
  
  y = addSeparator(y);
  y = addStep(5, 'After clicking ADD TEAM MEMBER:', y);
  y = addNote('The person receives an email with login details → They can log in with their own account → You can remove them anytime', y);

  // Page 10: Messages Tab
  doc.addPage();
  y = margin;
  y = addScreenTitle('SCREEN 10: Messages Tab - Contacting Support', y);
  
  y = addStep(1, 'Click "Messages" in the left sidebar', y);
  y = addStep(2, 'You will see your message history and:', y);
  
  y = addUIElement('NEW MESSAGE button', 'Blue button at top right', y);
  y = addUIElement('Message List', 'Shows all your previous conversations', y);
  
  y = addSeparator(y);
  y = addStep(3, 'To send a new message, click NEW MESSAGE button', y);
  y = addStep(4, 'A form will appear with:', y);
  
  y = addUIElement('Subject field', 'Enter topic of your message', y);
  y = addUIElement('Category dropdown', 'Select type: Product Question, Order Issue, etc.', y);
  y = addUIElement('Message box', 'Type your question or issue', y);
  y = addUIElement('SEND MESSAGE button', 'Click to send to support team', y);
  y = addUIElement('CANCEL button', 'Click to close without sending', y);
  
  y = addSeparator(y);
  y = addStep(5, 'After sending:', y);
  y = addNote('Support team will respond within 24 hours → You will see their reply in the message list → Click on any message to read the full conversation', y);

  // Page 11: Settings Tab
  doc.addPage();
  y = margin;
  y = addScreenTitle('SCREEN 11: Settings Tab - Account Settings', y);
  
  y = addStep(1, 'Click "Settings" in the left sidebar', y);
  y = addStep(2, 'You will see several sections:', y);
  
  y = addUIElement('Profile Information', 'Your name, email, phone number', y);
  y = addUIElement('Business Information', 'Business name, address', y);
  y = addUIElement('Payment Settings', 'Bank details for commission payments', y);
  y = addUIElement('Change Password', 'Update your login password', y);
  
  y = addSeparator(y);
  y = addStep(3, 'To update your profile:', y);
  y = addNote('Edit any field → Click SAVE CHANGES button at bottom → Changes are saved immediately', y);
  
  y = addSeparator(y);
  y = addStep(4, 'To change your password:', y);
  y = addNote('Scroll to "Change Password" section → Enter current password → Enter new password → Enter new password again to confirm → Click UPDATE PASSWORD button', y);
  
  y = addSeparator(y);
  y = addStep(5, 'At the top right of any page:', y);
  
  y = addUIElement('Profile Icon', 'Click to see dropdown menu', y);
  y = addUIElement('LOG OUT option', 'Click to log out of your account', y);

  // Page 12: Quick Reference
  doc.addPage();
  y = margin;
  doc.fillColor('#000000')
     .fontSize(20)
     .font('Helvetica-Bold')
     .text('Quick Button Reference', margin, y);
  
  y += 40;
  
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Most Common Actions:', margin, y);
  
  y += 25;
  
  y = addUIElement('Add Products', 'Products tab → Browse Catalog → ADD TO STORE button', y);
  y = addUIElement('Remove Products', 'Products tab → My Products → REMOVE button', y);
  y = addUIElement('View Orders', 'Orders tab → Customer Orders → VIEW button', y);
  y = addUIElement('Change Colors', 'Storefront tab → Color pickers → SAVE CHANGES', y);
  y = addUIElement('Contact Support', 'Messages tab → NEW MESSAGE button', y);
  y = addUIElement('View Reports', 'Analytics tab → Choose date range', y);
  y = addUIElement('Add Team', 'Team tab → ADD TEAM MEMBER button', y);
  y = addUIElement('Update Profile', 'Settings tab → Edit fields → SAVE CHANGES', y);
  y = addUIElement('Log Out', 'Click profile icon (top right) → LOG OUT', y);

  y = addSeparator(y + 20);
  
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Button Colors:', margin, y);
  
  y += 25;
  
  y = addUIElement('Blue buttons', 'Main actions (Save, Add, Send)', y);
  y = addUIElement('Green buttons', 'Positive actions (Add to Store, Confirm)', y);
  y = addUIElement('Red buttons', 'Remove or delete actions', y);
  y = addUIElement('Gray buttons', 'Cancel or secondary actions', y);

  // Closing Page
  doc.addPage();
  doc.fillColor('#000000')
     .fontSize(32)
     .font('Helvetica-Bold')
     .text('You\'re All Set!', margin, 200, { align: 'center' });
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('You now know where every button is and what it does.', margin, 260, { 
       align: 'center',
       width: contentWidth 
     });
  
  doc.text('Log in and start clicking around to get comfortable with the system.', margin, 290, { 
       align: 'center',
       width: contentWidth 
     });
  
  doc.fillColor('#3B82F6')
     .fontSize(18)
     .font('Helvetica-Bold')
     .text('Need Help?', margin, 350, { align: 'center' });
  
  doc.fillColor('#333333')
     .fontSize(11)
     .font('Helvetica')
     .text('Go to Messages tab → Click NEW MESSAGE → Ask your question', margin, 390, { 
       align: 'center',
       width: contentWidth 
     });
  
  doc.fillColor('#666666')
     .fontSize(10)
     .text('© 2025 1stRep Premium E-Commerce Platform', margin, 500, { 
       align: 'center',
       width: contentWidth 
     });

  doc.end();

  stream.on('finish', () => {
    console.log('✅ Visual guide PDF created!');
    console.log(`📁 Saved to: ${outputPath}`);
  });

  stream.on('error', (err) => {
    console.error('❌ Error creating PDF:', err);
  });
}

createVisualGuide();
