import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import { join } from 'path';

const resellerGuideHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>1stRep Reseller User Guide</title>
  <style>
    @page {
      margin: 40px 50px;
      size: A4;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      font-size: 11pt;
    }
    
    .cover-page {
      page-break-after: always;
      text-align: center;
      padding-top: 200px;
      background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
      color: white;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    
    .cover-page h1 {
      font-size: 48pt;
      font-weight: bold;
      margin-bottom: 20px;
      letter-spacing: 2px;
    }
    
    .cover-page h2 {
      font-size: 28pt;
      font-weight: 300;
      margin-bottom: 40px;
      color: #3b82f6;
    }
    
    .cover-page .version {
      font-size: 12pt;
      margin-top: 80px;
      color: #999;
    }
    
    h1 {
      color: #000;
      font-size: 24pt;
      margin-top: 30px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 3px solid #3b82f6;
      page-break-before: always;
    }
    
    h1:first-of-type {
      page-break-before: avoid;
    }
    
    h2 {
      color: #1a1a1a;
      font-size: 18pt;
      margin-top: 25px;
      margin-bottom: 12px;
    }
    
    h3 {
      color: #333;
      font-size: 14pt;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    p {
      margin-bottom: 10px;
      text-align: justify;
    }
    
    ul, ol {
      margin-left: 25px;
      margin-bottom: 15px;
    }
    
    li {
      margin-bottom: 8px;
    }
    
    .info-box {
      background-color: #e3f2fd;
      border-left: 4px solid #2196F3;
      padding: 15px;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    .warning-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    .success-box {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    
    th {
      background-color: #000;
      color: white;
      font-weight: bold;
    }
    
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    .step-number {
      display: inline-block;
      width: 30px;
      height: 30px;
      background-color: #3b82f6;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 30px;
      font-weight: bold;
      margin-right: 10px;
    }
    
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    
    .feature-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-left: 3px solid #3b82f6;
    }
    
    .feature-card h4 {
      color: #3b82f6;
      margin-bottom: 8px;
      font-size: 12pt;
    }
    
    footer {
      position: fixed;
      bottom: 0;
      left: 50px;
      right: 50px;
      font-size: 9pt;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 10px;
      text-align: center;
    }
    
    .page-number:before {
      counter-increment: page;
      content: "Page " counter(page);
    }
    
    code {
      background-color: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
    }
    
    .toc {
      page-break-after: always;
    }
    
    .toc ul {
      list-style: none;
      margin-left: 0;
    }
    
    .toc li {
      margin-bottom: 12px;
      padding-left: 20px;
    }
    
    .toc a {
      text-decoration: none;
      color: #333;
    }
    
    .highlight {
      background-color: #ffeb3b;
      padding: 2px 4px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <h1>1stRep</h1>
    <h2>Reseller User Guide</h2>
    <p style="font-size: 14pt; margin-top: 20px;">Your Complete Guide to Success</p>
    <p class="version">Version 1.0 | 2025</p>
  </div>

  <!-- Table of Contents -->
  <div class="toc">
    <h1>Table of Contents</h1>
    <ul>
      <li><a href="#welcome">1. Welcome to 1stRep Reseller Program</a></li>
      <li><a href="#getting-started">2. Getting Started</a></li>
      <li><a href="#application">3. Application Process</a></li>
      <li><a href="#dashboard">4. Your Reseller Dashboard</a></li>
      <li><a href="#storefront">5. Managing Your Storefront</a></li>
      <li><a href="#products">6. Product Management</a></li>
      <li><a href="#pricing">7. Pricing & Commissions</a></li>
      <li><a href="#orders">8. Order Management</a></li>
      <li><a href="#credit">9. Credit System</a></li>
      <li><a href="#team">10. Team Management</a></li>
      <li><a href="#analytics">11. Analytics & Reporting</a></li>
      <li><a href="#best-practices">12. Best Practices</a></li>
      <li><a href="#faq">13. Frequently Asked Questions</a></li>
      <li><a href="#support">14. Support & Contact</a></li>
    </ul>
  </div>

  <!-- Chapter 1: Welcome -->
  <div id="welcome">
    <h1>1. Welcome to 1stRep Reseller Program</h1>
    
    <p>Welcome to the 1stRep Reseller Program! We're excited to partner with you in bringing premium fitness apparel to customers worldwide. This comprehensive guide will help you make the most of your reseller account and build a successful business with 1stRep.</p>
    
    <h2>What You'll Get</h2>
    
    <div class="feature-grid">
      <div class="feature-card">
        <h4>Wholesale Pricing</h4>
        <p>Access exclusive wholesale prices with tiered discounts based on your performance.</p>
      </div>
      <div class="feature-card">
        <h4>Branded Storefront</h4>
        <p>Your own customizable online store with your brand colors and domain.</p>
      </div>
      <div class="feature-card">
        <h4>Commission Earnings</h4>
        <p>Earn commissions on every sale through your storefront with transparent tracking.</p>
      </div>
      <div class="feature-card">
        <h4>Priority Support</h4>
        <p>Dedicated support team to help you succeed and grow your business.</p>
      </div>
      <div class="feature-card">
        <h4>Marketing Materials</h4>
        <p>Access to product images, descriptions, and promotional content.</p>
      </div>
      <div class="feature-card">
        <h4>Real-Time Analytics</h4>
        <p>Track your sales, earnings, and customer behavior with detailed reports.</p>
      </div>
    </div>

    <h2>Reseller Tiers</h2>
    
    <p>Our reseller program features a tiered system that rewards performance:</p>
    
    <table>
      <thead>
        <tr>
          <th>Tier</th>
          <th>Discount</th>
          <th>Credit Limit</th>
          <th>Benefits</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Bronze</strong></td>
          <td>10%</td>
          <td>£1,000</td>
          <td>Entry level, basic dashboard</td>
        </tr>
        <tr>
          <td><strong>Silver</strong></td>
          <td>15%</td>
          <td>£5,000</td>
          <td>Priority support, advanced analytics</td>
        </tr>
        <tr>
          <td><strong>Gold</strong></td>
          <td>20%</td>
          <td>£10,000</td>
          <td>Dedicated account manager, early product access</td>
        </tr>
        <tr>
          <td><strong>Platinum</strong></td>
          <td>25%</td>
          <td>£25,000</td>
          <td>Custom pricing, exclusive products, marketing support</td>
        </tr>
      </tbody>
    </table>
    
    <div class="info-box">
      <strong>Tier Progression:</strong> Your tier is upgraded based on sales volume, order frequency, and payment history. Speak with your account manager about tier advancement opportunities.
    </div>
  </div>

  <!-- Chapter 2: Getting Started -->
  <div id="getting-started">
    <h1>2. Getting Started</h1>
    
    <h2>Quick Start Checklist</h2>
    
    <p>Follow these steps to get your reseller business up and running:</p>
    
    <ol style="font-size: 12pt; line-height: 2;">
      <li><span class="step-number">1</span>Complete your reseller application</li>
      <li><span class="step-number">2</span>Wait for approval (typically 2-3 business days)</li>
      <li><span class="step-number">3</span>Receive your login credentials via email</li>
      <li><span class="step-number">4</span>Log in to your reseller dashboard</li>
      <li><span class="step-number">5</span>Customize your storefront branding</li>
      <li><span class="step-number">6</span>Select products for your store</li>
      <li><span class="step-number">7</span>Set up your payment preferences</li>
      <li><span class="step-number">8</span>Review and publish your storefront</li>
      <li><span class="step-number">9</span>Share your storefront URL with customers</li>
      <li><span class="step-number">10</span>Start selling and earning!</li>
    </ol>

    <h2>System Requirements</h2>
    
    <p>To access your reseller dashboard, you'll need:</p>
    <ul>
      <li>Modern web browser (Chrome, Firefox, Safari, Edge - latest version)</li>
      <li>Stable internet connection</li>
      <li>Email account for notifications</li>
      <li>Business information (VAT number if applicable)</li>
    </ul>
  </div>

  <!-- Chapter 3: Application Process -->
  <div id="application">
    <h1>3. Application Process</h1>
    
    <h2>Who Can Apply?</h2>
    
    <p>We welcome applications from:</p>
    <ul>
      <li>Established retail businesses</li>
      <li>Fitness centers and gyms</li>
      <li>Online retailers and e-commerce stores</li>
      <li>Personal trainers and fitness professionals</li>
      <li>Social media influencers with engaged audiences</li>
      <li>Corporate wellness programs</li>
    </ul>

    <h2>Application Requirements</h2>
    
    <p>To apply, you'll need to provide:</p>
    
    <table>
      <thead>
        <tr>
          <th>Information</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Business Name</td>
          <td>Legal name of your business</td>
        </tr>
        <tr>
          <td>Contact Person</td>
          <td>Primary contact name</td>
        </tr>
        <tr>
          <td>Email Address</td>
          <td>Business email for communications</td>
        </tr>
        <tr>
          <td>Phone Number</td>
          <td>Business phone number</td>
        </tr>
        <tr>
          <td>Business Address</td>
          <td>Physical business location</td>
        </tr>
        <tr>
          <td>Business Type</td>
          <td>Description of your business model</td>
        </tr>
      </tbody>
    </table>

    <h2>Application Timeline</h2>
    
    <div class="info-box">
      <h3>What Happens Next?</h3>
      <ol>
        <li><strong>Submission:</strong> You submit your application through our reseller portal</li>
        <li><strong>Confirmation:</strong> You receive an immediate email confirming receipt</li>
        <li><strong>Review:</strong> Our team reviews your application (2-3 business days)</li>
        <li><strong>Decision:</strong> You receive approval or feedback via email</li>
        <li><strong>Onboarding:</strong> If approved, you receive login credentials and access</li>
      </ol>
    </div>

    <h2>Approval Criteria</h2>
    
    <p>We evaluate applications based on:</p>
    <ul>
      <li>Business legitimacy and track record</li>
      <li>Target market alignment with our brand</li>
      <li>Sales channel and customer reach</li>
      <li>Marketing capabilities</li>
      <li>Credit worthiness and financial stability</li>
    </ul>

    <div class="warning-box">
      <strong>Reapplication Policy:</strong> If your application is not approved, you may reapply after 6 months. We encourage you to strengthen your business profile and application during this time.
    </div>
  </div>

  <!-- Chapter 4: Dashboard -->
  <div id="dashboard">
    <h1>4. Your Reseller Dashboard</h1>
    
    <h2>Dashboard Overview</h2>
    
    <p>Your reseller dashboard is your command center for managing your entire business. Here's what you'll find:</p>

    <h3>Key Metrics Display</h3>
    
    <div class="feature-grid">
      <div class="feature-card">
        <h4>Total Orders</h4>
        <p>Lifetime count of customer orders through your storefront</p>
      </div>
      <div class="feature-card">
        <h4>Monthly Revenue</h4>
        <p>Sales revenue for the current month</p>
      </div>
      <div class="feature-card">
        <h4>Commission Earned</h4>
        <p>Your earnings from storefront sales</p>
      </div>
      <div class="feature-card">
        <h4>Credit Available</h4>
        <p>Remaining credit limit for wholesale orders</p>
      </div>
      <div class="feature-card">
        <h4>Pending Orders</h4>
        <p>Orders awaiting fulfillment</p>
      </div>
      <div class="feature-card">
        <h4>Low Stock Alerts</h4>
        <p>Products requiring restock</p>
      </div>
    </div>

    <h2>Navigation Sections</h2>
    
    <table>
      <thead>
        <tr>
          <th>Section</th>
          <th>Purpose</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Overview</strong></td>
          <td>Dashboard home with key metrics and quick actions</td>
        </tr>
        <tr>
          <td><strong>Storefront</strong></td>
          <td>Customize your branded store appearance and settings</td>
        </tr>
        <tr>
          <td><strong>Products</strong></td>
          <td>Select and manage products in your catalog</td>
        </tr>
        <tr>
          <td><strong>Orders</strong></td>
          <td>View customer orders and wholesale stock requests</td>
        </tr>
        <tr>
          <td><strong>Analytics</strong></td>
          <td>Sales reports, customer insights, and performance data</td>
        </tr>
        <tr>
          <td><strong>Team</strong></td>
          <td>Manage team member access and permissions</td>
        </tr>
        <tr>
          <td><strong>Messages</strong></td>
          <td>Communication with 1stRep admin team</td>
        </tr>
        <tr>
          <td><strong>Settings</strong></td>
          <td>Account settings, payment preferences, and profile</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Chapter 5: Storefront Management -->
  <div id="storefront">
    <h1>5. Managing Your Storefront</h1>
    
    <h2>Storefront Customization</h2>
    
    <p>Your storefront is your brand's digital home. Make it uniquely yours with these customization options:</p>

    <h3>Branding Options</h3>
    
    <ul>
      <li><strong>Primary Color:</strong> Choose a color that represents your brand identity</li>
      <li><strong>Accent Color:</strong> Select a complementary color for highlights and CTAs</li>
      <li><strong>Business Name:</strong> Display your business name prominently</li>
      <li><strong>Logo:</strong> Upload your business logo (recommended: 200x60px, PNG format)</li>
      <li><strong>Custom Domain:</strong> Connect your own domain name (e.g., shop.yourbrand.com)</li>
    </ul>

    <div class="info-box">
      <strong>Branding Tip:</strong> Choose colors that complement 1stRep's product photography. Darker, sophisticated colors often work best with our tactical/outdoor aesthetic.
    </div>

    <h3>Storefront Settings</h3>
    
    <table>
      <thead>
        <tr>
          <th>Setting</th>
          <th>Options</th>
          <th>Recommendation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Store Status</td>
          <td>Active / Inactive</td>
          <td>Active once products are selected</td>
        </tr>
        <tr>
          <td>Product Display</td>
          <td>Grid / List view</td>
          <td>Grid for visual appeal</td>
        </tr>
        <tr>
          <td>Sort Order</td>
          <td>Newest / Popular / Price</td>
          <td>Set based on your strategy</td>
        </tr>
        <tr>
          <td>Show Prices</td>
          <td>Yes / No</td>
          <td>Yes for transparency</td>
        </tr>
        <tr>
          <td>Contact Info</td>
          <td>Email / Phone</td>
          <td>Provide for customer support</td>
        </tr>
      </tbody>
    </table>

    <h2>Custom Domain Setup</h2>
    
    <p>To use your own domain name:</p>
    <ol>
      <li>Purchase a domain from your preferred registrar</li>
      <li>In your dashboard, navigate to Storefront → Settings</li>
      <li>Enter your custom domain (e.g., shop.yourbrand.com)</li>
      <li>Follow the DNS configuration instructions provided</li>
      <li>Wait for DNS propagation (usually 24-48 hours)</li>
      <li>Your storefront will be accessible at your custom domain</li>
    </ol>

    <div class="warning-box">
      <strong>Technical Note:</strong> You'll need access to your domain's DNS settings. Contact your domain registrar if you need assistance with DNS configuration.
    </div>

    <h2>Storefront URL</h2>
    
    <p>Your default storefront URL format:</p>
    <code>https://1strep.com/store/[your-business-slug]</code>
    
    <p>Example: <code>https://1strep.com/store/fitness-pro-london</code></p>
  </div>

  <!-- Chapter 6: Product Management -->
  <div id="products">
    <h1>6. Product Management</h1>
    
    <h2>Selecting Products</h2>
    
    <p>Choose which 1stRep products to feature in your storefront:</p>

    <h3>Product Selection Strategy</h3>
    
    <ul>
      <li><strong>Know Your Audience:</strong> Select products that match your customer demographics</li>
      <li><strong>Start Small:</strong> Begin with 10-20 core products, expand based on demand</li>
      <li><strong>Seasonal Mix:</strong> Balance year-round staples with seasonal items</li>
      <li><strong>Price Range:</strong> Offer options at different price points</li>
      <li><strong>Gender Balance:</strong> Consider your audience's gender breakdown</li>
    </ul>

    <h3>Available Product Categories</h3>
    
    <div class="feature-grid">
      <div class="feature-card">
        <h4>Hoodies & Jumpers</h4>
        <p>Premium sweatshirts and hooded tops</p>
      </div>
      <div class="feature-card">
        <h4>T-Shirts</h4>
        <p>Performance and casual tees</p>
      </div>
      <div class="feature-card">
        <h4>Leggings</h4>
        <p>High-performance activewear bottoms</p>
      </div>
      <div class="feature-card">
        <h4>Shorts</h4>
        <p>Training and lifestyle shorts</p>
      </div>
      <div class="feature-card">
        <h4>Vests & Crop Tops</h4>
        <p>Sleeveless performance wear</p>
      </div>
      <div class="feature-card">
        <h4>Jackets</h4>
        <p>Outerwear and training jackets</p>
      </div>
      <div class="feature-card">
        <h4>Hats</h4>
        <p>Caps and headwear accessories</p>
      </div>
      <div class="feature-card">
        <h4>Accessories</h4>
        <p>Bags, water bottles, and gear</p>
      </div>
    </div>

    <h2>Adding Products to Your Store</h2>
    
    <ol>
      <li>Navigate to <strong>Products → Browse Catalog</strong></li>
      <li>Use filters to find products by category, gender, or price</li>
      <li>Click <strong>"Add to My Store"</strong> on desired products</li>
      <li>Optionally set custom pricing (see Chapter 7)</li>
      <li>Products appear in your storefront immediately</li>
    </ol>

    <h2>Product Information</h2>
    
    <p>Each product includes:</p>
    <ul>
      <li>High-quality product images (multiple angles)</li>
      <li>Detailed descriptions and features</li>
      <li>Size charts and fit information</li>
      <li>Available colors and variants</li>
      <li>Current stock levels</li>
      <li>Recommended retail price</li>
      <li>Your wholesale price (based on tier)</li>
    </ul>

    <div class="success-box">
      <strong>Inventory Management:</strong> All inventory is managed by 1stRep. You don't need to stock products. Orders from your storefront are fulfilled directly by us, and you earn commission on each sale.
    </div>
  </div>

  <!-- Chapter 7: Pricing & Commissions -->
  <div id="pricing">
    <h1>7. Pricing & Commissions</h1>
    
    <h2>Understanding Pricing</h2>
    
    <p>There are three key price points to understand:</p>

    <table>
      <thead>
        <tr>
          <th>Price Type</th>
          <th>Definition</th>
          <th>Example</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Retail Price</strong></td>
          <td>Standard customer price on 1stRep main store</td>
          <td>£50.00</td>
        </tr>
        <tr>
          <td><strong>Wholesale Price</strong></td>
          <td>Your discounted price for stock orders (based on tier)</td>
          <td>£40.00 (20% off)</td>
        </tr>
        <tr>
          <td><strong>Storefront Price</strong></td>
          <td>Price customers see on your branded storefront</td>
          <td>£48.00 (custom)</td>
        </tr>
      </tbody>
    </table>

    <h2>Commission Structure</h2>
    
    <p>When customers purchase through your storefront, you earn commission on each sale. The commission calculation follows a sophisticated priority system:</p>

    <h3>Commission Rule Priority</h3>
    
    <ol>
      <li><strong>Specific Product + Specific Reseller</strong> (Highest Priority)
        <ul>
          <li>Custom commission for you on a specific product</li>
          <li>Example: 30% commission on "Elite Training Hoodie" for your store</li>
        </ul>
      </li>
      <li><strong>Specific Product + All Resellers</strong>
        <ul>
          <li>Commission for everyone on a specific product</li>
          <li>Example: 25% commission on new product launches</li>
        </ul>
      </li>
      <li><strong>Specific Category + Specific Reseller</strong>
        <ul>
          <li>Custom commission for you on a product category</li>
          <li>Example: 28% commission on all "Hoodies" for your store</li>
        </ul>
      </li>
      <li><strong>Specific Category + All Resellers</strong>
        <ul>
          <li>Commission for everyone on a category</li>
          <li>Example: 22% commission on all accessories</li>
        </ul>
      </li>
      <li><strong>All Products + Specific Reseller</strong>
        <ul>
          <li>Your custom default commission rate</li>
          <li>Example: 20% commission on everything you sell</li>
        </ul>
      </li>
      <li><strong>All Products + All Resellers</strong> (Lowest Priority)
        <ul>
          <li>Default commission for everyone</li>
          <li>Example: 15% commission as baseline</li>
        </ul>
      </li>
    </ol>

    <div class="info-box">
      <strong>How It Works:</strong> The system automatically applies the highest priority rule that matches. For example, if you have a custom commission on "Elite Training Hoodie" (Priority 1), that takes precedence over category or default rates.
    </div>

    <h3>Commission Types</h3>
    
    <table>
      <thead>
        <tr>
          <th>Type</th>
          <th>Description</th>
          <th>Example</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Percentage</strong></td>
          <td>Commission as % of product price</td>
          <td>20% of £50 = £10 commission</td>
        </tr>
        <tr>
          <td><strong>Fixed Amount</strong></td>
          <td>Flat commission per item</td>
          <td>£12 per item sold</td>
        </tr>
      </tbody>
    </table>

    <h2>Custom Pricing</h2>
    
    <p>You can set custom prices for products in your storefront:</p>

    <div class="warning-box">
      <strong>Pricing Guidelines:</strong>
      <ul>
        <li>Cannot price below recommended retail price</li>
        <li>Cannot price more than 20% above recommended retail</li>
        <li>Must maintain brand value and market positioning</li>
        <li>Commission calculated on actual selling price</li>
      </ul>
    </div>

    <h2>Commission Calculation Example</h2>
    
    <div class="success-box">
      <h3>Sample Transaction Breakdown:</h3>
      <p><strong>Product:</strong> Elite Training Hoodie</p>
      <p><strong>Retail Price:</strong> £60.00</p>
      <p><strong>Your Storefront Price:</strong> £60.00</p>
      <p><strong>Applicable Commission Rule:</strong> 25% (category-specific)</p>
      
      <hr style="margin: 10px 0;">
      
      <p><strong>Customer Pays:</strong> £60.00</p>
      <p><strong>Your Commission (25%):</strong> £15.00</p>
      <p><strong>Platform Share:</strong> £45.00</p>
      
      <hr style="margin: 10px 0;">
      
      <p><strong>You Earn:</strong> <span class="highlight">£15.00 per sale</span></p>
    </div>

    <h2>Minimum Order Thresholds</h2>
    
    <p>Some commission rules may have minimum order requirements:</p>
    <ul>
      <li>Order must meet minimum subtotal to qualify for special rates</li>
      <li>Example: 30% commission on orders over £500</li>
      <li>Standard rates apply to orders below threshold</li>
    </ul>
  </div>

  <!-- Chapter 8: Order Management -->
  <div id="orders">
    <h1>8. Order Management</h1>
    
    <h2>Two Types of Orders</h2>

    <h3>1. Customer Orders (Storefront Sales)</h3>
    
    <p>These are orders placed by your customers through your branded storefront:</p>
    
    <ul>
      <li><strong>Fulfillment:</strong> Handled entirely by 1stRep</li>
      <li><strong>Payment:</strong> Processed through 1stRep's Stripe account</li>
      <li><strong>Shipping:</strong> Sent directly from our warehouse to customer</li>
      <li><strong>Your Role:</strong> Monitor sales, provide customer support, earn commission</li>
      <li><strong>Commission:</strong> Automatically tracked and credited to your account</li>
    </ul>

    <h3>2. Wholesale Orders (Stock Requests)</h3>
    
    <p>These are orders you place to purchase inventory for your own retail operations:</p>
    
    <ul>
      <li><strong>Pricing:</strong> Wholesale prices based on your tier discount</li>
      <li><strong>Payment:</strong> Deducted from your credit limit or paid upfront</li>
      <li><strong>Shipping:</strong> Sent to your business address</li>
      <li><strong>Your Role:</strong> Manage inventory, sell through your own channels</li>
      <li><strong>Minimum Order:</strong> £200 minimum for wholesale orders</li>
    </ul>

    <h2>Viewing Customer Orders</h2>
    
    <p>Navigate to <strong>Orders → Customer Orders</strong> to see:</p>
    
    <table>
      <thead>
        <tr>
          <th>Information</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Order Number</td>
          <td>Unique tracking reference</td>
        </tr>
        <tr>
          <td>Date</td>
          <td>When order was placed</td>
        </tr>
        <tr>
          <td>Customer</td>
          <td>Customer name and email</td>
        </tr>
        <tr>
          <td>Products</td>
          <td>Items ordered with quantities</td>
        </tr>
        <tr>
          <td>Total</td>
          <td>Order total amount</td>
        </tr>
        <tr>
          <td>Your Commission</td>
          <td>Your earnings from this order</td>
        </tr>
        <tr>
          <td>Status</td>
          <td>Pending / Paid / Shipped / Delivered</td>
        </tr>
      </tbody>
    </table>

    <h2>Order Status Workflow</h2>
    
    <ol style="font-size: 11pt;">
      <li><strong>Pending:</strong> Order placed, awaiting payment confirmation</li>
      <li><strong>Paid:</strong> Payment received, preparing for shipment</li>
      <li><strong>Shipped:</strong> Order dispatched with tracking number</li>
      <li><strong>Delivered:</strong> Order received by customer</li>
    </ol>

    <div class="info-box">
      <strong>Customer Support:</strong> While 1stRep handles fulfillment, your customers may contact you with questions. You can view order details in your dashboard and communicate with our support team via the Messages section for assistance.
    </div>

    <h2>Placing Wholesale Orders</h2>
    
    <p>To order stock for your own retail operations:</p>
    
    <ol>
      <li>Navigate to <strong>Orders → Place Stock Order</strong></li>
      <li>Browse products and add to cart</li>
      <li>Review cart and wholesale pricing</li>
      <li>Choose payment method:
        <ul>
          <li>Credit Account (if credit available)</li>
          <li>Card Payment (Stripe)</li>
        </ul>
      </li>
      <li>Confirm shipping address</li>
      <li>Submit order</li>
      <li>Receive confirmation email with tracking</li>
    </ol>

    <div class="warning-box">
      <strong>Credit Limit:</strong> Wholesale orders deduct from your available credit. Monitor your credit balance to ensure sufficient funds for orders.
    </div>
  </div>

  <!-- Chapter 9: Credit System -->
  <div id="credit">
    <h1>9. Credit System</h1>
    
    <h2>How Credit Works</h2>
    
    <p>Your credit account operates like a revolving credit line specifically for wholesale inventory purchases:</p>

    <h3>Credit Limits by Tier</h3>
    
    <table>
      <thead>
        <tr>
          <th>Tier</th>
          <th>Initial Credit Limit</th>
          <th>Can Be Increased?</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Bronze</td>
          <td>£1,000</td>
          <td>Yes, upon review</td>
        </tr>
        <tr>
          <td>Silver</td>
          <td>£5,000</td>
          <td>Yes, upon review</td>
        </tr>
        <tr>
          <td>Gold</td>
          <td>£10,000</td>
          <td>Yes, upon review</td>
        </tr>
        <tr>
          <td>Platinum</td>
          <td>£25,000</td>
          <td>Yes, custom limits available</td>
        </tr>
      </tbody>
    </table>

    <h2>Using Your Credit</h2>
    
    <div class="feature-grid">
      <div class="feature-card">
        <h4>Available Credit</h4>
        <p>The amount you can currently use for wholesale orders</p>
      </div>
      <div class="feature-card">
        <h4>Credit Used</h4>
        <p>Outstanding balance from previous orders</p>
      </div>
      <div class="feature-card">
        <h4>Credit Limit</h4>
        <p>Maximum credit available to you</p>
      </div>
      <div class="feature-card">
        <h4>Payment Due</h4>
        <p>Amount and date of next payment</p>
      </div>
    </div>

    <h2>Payment Terms</h2>
    
    <p>Credit purchases follow these payment schedules:</p>
    
    <ul>
      <li><strong>NET 30:</strong> Payment due 30 days after invoice date (standard)</li>
      <li><strong>NET 60:</strong> Available for Silver tier and above</li>
      <li><strong>NET 90:</strong> Available for Gold tier and above</li>
      <li><strong>Custom Terms:</strong> Negotiable for Platinum tier</li>
    </ul>

    <h2>Making Payments</h2>
    
    <p>Pay your credit balance through your dashboard:</p>
    
    <ol>
      <li>Navigate to <strong>Settings → Billing</strong></li>
      <li>View current balance and payment history</li>
      <li>Click <strong>"Make Payment"</strong></li>
      <li>Enter payment amount (minimum or custom)</li>
      <li>Select payment method (card on file or new card)</li>
      <li>Confirm payment</li>
      <li>Receive confirmation and updated credit balance</li>
    </ol>

    <div class="warning-box">
      <strong>Late Payment Policy:</strong>
      <ul>
        <li>5% late fee after 7 days past due date</li>
        <li>Credit account frozen if payment 30+ days overdue</li>
        <li>Account may be suspended if payment 60+ days overdue</li>
        <li>Good payment history can increase your credit limit</li>
      </ul>
    </div>

    <h2>Requesting Credit Increase</h2>
    
    <p>To request a higher credit limit:</p>
    
    <ol>
      <li>Navigate to <strong>Settings → Credit Account</strong></li>
      <li>Click <strong>"Request Credit Increase"</strong></li>
      <li>Provide business justification and requested amount</li>
      <li>Submit for review</li>
      <li>Receive decision within 3-5 business days</li>
    </ol>

    <div class="success-box">
      <strong>Tips for Approval:</strong>
      <ul>
        <li>Maintain perfect payment history</li>
        <li>Demonstrate consistent sales growth</li>
        <li>Provide updated financial documents if requested</li>
        <li>Show clear business expansion plans</li>
      </ul>
    </div>
  </div>

  <!-- Chapter 10: Team Management -->
  <div id="team">
    <h1>10. Team Management</h1>
    
    <h2>Adding Team Members</h2>
    
    <p>As your business grows, you can add team members with different access levels to help manage your reseller account.</p>

    <h3>Permission Levels</h3>
    
    <table>
      <thead>
        <tr>
          <th>Level</th>
          <th>Access</th>
          <th>Use Case</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>View Only</strong></td>
          <td>Can view orders, reports, and products but cannot make changes</td>
          <td>Accountants, analysts, interns</td>
        </tr>
        <tr>
          <td><strong>Can Order</strong></td>
          <td>Can place wholesale orders within credit limits</td>
          <td>Purchasing managers, inventory staff</td>
        </tr>
        <tr>
          <td><strong>Can Approve</strong></td>
          <td>Can approve orders and make storefront changes</td>
          <td>Store managers, marketing leads</td>
        </tr>
        <tr>
          <td><strong>Admin</strong></td>
          <td>Full access including team management and billing</td>
          <td>Business owners, partners</td>
        </tr>
      </tbody>
    </table>

    <h2>Inviting Team Members</h2>
    
    <ol>
      <li>Navigate to <strong>Team → Manage Team</strong></li>
      <li>Click <strong>"Add Team Member"</strong></li>
      <li>Enter their email address and name</li>
      <li>Select their permission level</li>
      <li>Optionally add department assignment</li>
      <li>Click <strong>"Send Invitation"</strong></li>
      <li>They receive an email with login credentials</li>
      <li>They can access the dashboard with their assigned permissions</li>
    </ol>

    <h2>Department Access</h2>
    
    <p>Assign team members to specific departments:</p>
    
    <ul>
      <li><strong>Products:</strong> Product selection and catalog management</li>
      <li><strong>Inventory:</strong> Stock levels and reorder management</li>
      <li><strong>Orders:</strong> Order processing and fulfillment</li>
      <li><strong>Customers:</strong> Customer service and support</li>
      <li><strong>Settings:</strong> Account and storefront configuration</li>
    </ul>

    <div class="info-box">
      <strong>Best Practice:</strong> Assign the minimum permissions necessary for each role. This protects your account security and prevents accidental changes.
    </div>

    <h2>Managing Team Members</h2>
    
    <p>You can modify team member access at any time:</p>
    
    <ul>
      <li>Edit permissions and department access</li>
      <li>Temporarily suspend access</li>
      <li>Remove team members completely</li>
      <li>View activity logs for each team member</li>
      <li>Reset passwords if needed</li>
    </ul>
  </div>

  <!-- Chapter 11: Analytics & Reporting -->
  <div id="analytics">
    <h1>11. Analytics & Reporting</h1>
    
    <h2>Available Reports</h2>
    
    <p>Your dashboard provides comprehensive analytics to help you understand and grow your business:</p>

    <h3>Sales Analytics</h3>
    
    <div class="feature-grid">
      <div class="feature-card">
        <h4>Revenue Trends</h4>
        <p>Daily, weekly, monthly sales tracking with trend analysis</p>
      </div>
      <div class="feature-card">
        <h4>Commission Earnings</h4>
        <p>Track your earnings by product, category, and time period</p>
      </div>
      <div class="feature-card">
        <h4>Top Products</h4>
        <p>Best-selling items in your storefront</p>
      </div>
      <div class="feature-card">
        <h4>Customer Insights</h4>
        <p>Customer acquisition, retention, and lifetime value</p>
      </div>
      <div class="feature-card">
        <h4>Conversion Rates</h4>
        <p>Store visits vs. purchases, cart abandonment</p>
      </div>
      <div class="feature-card">
        <h4>Geographic Data</h4>
        <p>Where your customers are located</p>
      </div>
    </div>

    <h2>Exporting Data</h2>
    
    <p>All reports can be exported for further analysis:</p>
    
    <ul>
      <li><strong>CSV Format:</strong> For spreadsheet analysis (Excel, Google Sheets)</li>
      <li><strong>PDF Format:</strong> For presentations and sharing</li>
      <li><strong>Date Ranges:</strong> Custom date ranges for any report</li>
      <li><strong>Scheduled Reports:</strong> Receive weekly/monthly reports via email</li>
    </ul>

    <h2>Key Metrics to Monitor</h2>
    
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>What It Means</th>
          <th>Target</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Conversion Rate</td>
          <td>% of visitors who make a purchase</td>
          <td>2-4% is typical</td>
        </tr>
        <tr>
          <td>Average Order Value</td>
          <td>Average spend per transaction</td>
          <td>Aim to increase over time</td>
        </tr>
        <tr>
          <td>Customer Retention</td>
          <td>% of customers who return</td>
          <td>20-30% is good</td>
        </tr>
        <tr>
          <td>Cart Abandonment</td>
          <td>% of carts not completed</td>
          <td>Lower is better (<70%)</td>
        </tr>
        <tr>
          <td>Traffic Sources</td>
          <td>Where visitors come from</td>
          <td>Diversify channels</td>
        </tr>
      </tbody>
    </table>

    <div class="success-box">
      <strong>Growth Strategy:</strong> Use analytics to identify your best-selling products, understand customer preferences, and optimize your product selection and marketing efforts.
    </div>
  </div>

  <!-- Chapter 12: Best Practices -->
  <div id="best-practices">
    <h1>12. Best Practices</h1>
    
    <h2>Marketing Your Storefront</h2>

    <h3>Digital Marketing</h3>
    
    <ul>
      <li><strong>Social Media:</strong> Share your storefront URL on Instagram, Facebook, TikTok</li>
      <li><strong>Email Marketing:</strong> Send newsletters featuring new products to your customer list</li>
      <li><strong>Influencer Partnerships:</strong> Collaborate with fitness influencers in your niche</li>
      <li><strong>Content Marketing:</strong> Create blog posts, videos, or guides related to fitness</li>
      <li><strong>Paid Advertising:</strong> Use Facebook/Instagram ads to drive traffic to your store</li>
      <li><strong>SEO:</strong> Optimize your storefront for search engines with relevant keywords</li>
    </ul>

    <h3>In-Person Marketing</h3>
    
    <ul>
      <li><strong>Business Cards:</strong> Include your storefront URL on cards</li>
      <li><strong>QR Codes:</strong> Create QR codes linking to your store for gym displays</li>
      <li><strong>Events:</strong> Set up booths at fitness events, competitions, or expos</li>
      <li><strong>Partnerships:</strong> Partner with local gyms to offer exclusive discounts</li>
      <li><strong>Referral Program:</strong> Reward customers who refer new buyers</li>
    </ul>

    <h2>Customer Service Excellence</h2>
    
    <div class="info-box">
      <strong>Remember:</strong> While 1stRep handles fulfillment, you represent the brand to your customers. Excellent service builds loyalty and repeat business.
    </div>

    <h3>Service Standards</h3>
    
    <ul>
      <li>Respond to customer inquiries within 24 hours</li>
      <li>Provide accurate product information and sizing guidance</li>
      <li>Proactively communicate any delays or issues</li>
      <li>Follow up after delivery to ensure satisfaction</li>
      <li>Address complaints professionally and promptly</li>
      <li>Use the Messages section to escalate issues to 1stRep support</li>
    </ul>

    <h2>Product Curation</h2>
    
    <h3>Seasonal Strategy</h3>
    
    <table>
      <thead>
        <tr>
          <th>Season</th>
          <th>Featured Products</th>
          <th>Marketing Focus</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Spring</td>
          <td>T-shirts, shorts, lightweight jackets</td>
          <td>Outdoor training, new season</td>
        </tr>
        <tr>
          <td>Summer</td>
          <td>Vests, crop tops, shorts, accessories</td>
          <td>Beach body, performance</td>
        </tr>
        <tr>
          <td>Autumn</td>
          <td>Hoodies, leggings, jackets</td>
          <td>Back to gym, layering</td>
        </tr>
        <tr>
          <td>Winter</td>
          <td>Hoodies, joggers, jackets, hats</td>
          <td>Cold weather training</td>
        </tr>
      </tbody>
    </table>

    <h2>Financial Management</h2>
    
    <ul>
      <li><strong>Monitor Credit:</strong> Keep track of credit balance and payment due dates</li>
      <li><strong>Cash Flow:</strong> Plan wholesale orders around your sales cycles</li>
      <li><strong>Profit Margins:</strong> Calculate your margins considering commission rates</li>
      <li><strong>Record Keeping:</strong> Export monthly sales reports for accounting</li>
      <li><strong>Growth Investment:</strong> Reinvest commission earnings into marketing</li>
    </ul>

    <h2>Common Mistakes to Avoid</h2>
    
    <div class="warning-box">
      <h3>Don't Make These Errors:</h3>
      <ol>
        <li>Selecting too many products initially - start focused</li>
        <li>Pricing too high or too low - follow recommended ranges</li>
        <li>Ignoring analytics - data drives smart decisions</li>
        <li>Poor customer communication - responsiveness matters</li>
        <li>Maxing out credit without sales plan - manage cash flow</li>
        <li>Inconsistent branding - maintain professional image</li>
        <li>Neglecting social media - your main marketing channel</li>
        <li>Not following up with customers - build relationships</li>
      </ol>
    </div>
  </div>

  <!-- Chapter 13: FAQs -->
  <div id="faq">
    <h1>13. Frequently Asked Questions</h1>
    
    <h2>Account & Application</h2>
    
    <h3>Q: How long does approval take?</h3>
    <p>A: Typically 2-3 business days. You'll receive an email notification with the decision.</p>
    
    <h3>Q: What if my application is rejected?</h3>
    <p>A: You may reapply after 6 months. We'll provide feedback to help strengthen your next application.</p>
    
    <h3>Q: Can I have multiple storefronts?</h3>
    <p>A: Yes, contact your account manager to discuss multi-storefront options for additional fees.</p>

    <h2>Products & Pricing</h2>
    
    <h3>Q: Do I need to stock inventory?</h3>
    <p>A: No! For storefront sales, we handle all inventory and fulfillment. You only stock inventory if you place wholesale orders for your own retail operations.</p>
    
    <h3>Q: Can I sell 1stRep products on Amazon or eBay?</h3>
    <p>A: You must get written approval before selling on third-party marketplaces. Contact your account manager.</p>
    
    <h3>Q: How often do you add new products?</h3>
    <p>A: We release new products quarterly, with exclusive early access for Gold and Platinum tier resellers.</p>
    
    <h3>Q: Can I suggest products to add to the catalog?</h3>
    <p>A: Absolutely! We value reseller feedback. Submit suggestions through the Messages section.</p>

    <h2>Orders & Fulfillment</h2>
    
    <h3>Q: How long does shipping take?</h3>
    <p>A: UK orders: 2-5 business days. International: 7-14 business days. Expedited options available.</p>
    
    <h3>Q: What if a customer wants to return a product?</h3>
    <p>A: Direct them to our 30-day return policy. Returns are processed through 1stRep's system, and commission is adjusted accordingly.</p>
    
    <h3>Q: Can customers track their orders?</h3>
    <p>A: Yes, they receive tracking numbers via email once orders ship. You can also view tracking in your dashboard.</p>
    
    <h3>Q: What happens if a product is out of stock?</h3>
    <p>A: Out-of-stock products are automatically hidden from your storefront. You'll receive notifications when items are back in stock.</p>

    <h2>Payments & Commissions</h2>
    
    <h3>Q: When do I receive commission payments?</h3>
    <p>A: Commissions are paid monthly, around the 15th of each month, for the previous month's confirmed sales.</p>
    
    <h3>Q: How are commissions paid?</h3>
    <p>A: Direct bank transfer to your registered business account. Set up payment details in Settings → Billing.</p>
    
    <h3>Q: What if a customer cancels or returns an order?</h3>
    <p>A: Commission is reversed for cancelled or returned orders to maintain accurate earnings.</p>
    
    <h3>Q: Can I see a breakdown of my commission by product?</h3>
    <p>A: Yes, detailed commission reports are available in Analytics → Commission Breakdown.</p>

    <h2>Technical & Support</h2>
    
    <h3>Q: Can I integrate my storefront with my existing website?</h3>
    <p>A: Yes, you can embed products or link to your storefront. API integration is available for Platinum tier.</p>
    
    <h3>Q: Is there a mobile app?</h3>
    <p>A: The dashboard is mobile-responsive and works on all devices. A dedicated app is in development.</p>
    
    <h3>Q: How do I reset my password?</h3>
    <p>A: Click "Forgot Password" on the login page, or contact support for immediate assistance.</p>
    
    <h3>Q: Can I export my customer data?</h3>
    <p>A: Customer data belongs to 1stRep for privacy reasons, but you can export anonymized sales reports.</p>
  </div>

  <!-- Chapter 14: Support -->
  <div id="support">
    <h1>14. Support & Contact</h1>
    
    <h2>Getting Help</h2>
    
    <p>We're here to support your success. Multiple support channels are available based on your needs:</p>

    <h3>Dashboard Messaging</h3>
    
    <div class="success-box">
      <strong>Recommended for:</strong> Order issues, product questions, account management
      <ul>
        <li>Navigate to <strong>Messages</strong> in your dashboard</li>
        <li>Click <strong>"New Message"</strong></li>
        <li>Select message category and describe your issue</li>
        <li>Receive response within 24 hours (usually much faster)</li>
        <li>Message history saved for reference</li>
      </ul>
    </div>

    <h3>Email Support</h3>
    
    <p><strong>Email:</strong> resellers@1strep.com</p>
    <p><strong>Response Time:</strong> Within 24 hours on business days</p>
    <p><strong>Best For:</strong> General inquiries, documentation requests, partnership discussions</p>

    <h3>Phone Support</h3>
    
    <p><strong>Phone:</strong> +44 (0) 20 XXXX XXXX (Available for Gold and Platinum tiers)</p>
    <p><strong>Hours:</strong> Monday-Friday, 9 AM - 5 PM GMT</p>
    <p><strong>Best For:</strong> Urgent issues, technical problems, complex questions</p>

    <h3>Account Manager</h3>
    
    <p>Gold and Platinum tier resellers are assigned dedicated account managers:</p>
    
    <ul>
      <li>Personalized business support and strategy</li>
      <li>Direct contact via email and phone</li>
      <li>Quarterly business reviews</li>
      <li>Custom commission negotiations</li>
      <li>Priority access to new products</li>
      <li>Marketing and growth assistance</li>
    </ul>

    <h2>Training & Resources</h2>
    
    <h3>Reseller Resources</h3>
    
    <ul>
      <li><strong>Video Tutorials:</strong> Dashboard walkthrough, best practices, feature guides</li>
      <li><strong>Marketing Materials:</strong> Product images, brand guidelines, social media templates</li>
      <li><strong>Webinars:</strong> Monthly training sessions on sales strategies and new features</li>
      <li><strong>Knowledge Base:</strong> Searchable articles covering all aspects of the platform</li>
      <li><strong>Community Forum:</strong> Connect with other resellers, share tips and experiences</li>
    </ul>

    <h2>Providing Feedback</h2>
    
    <p>Your input helps us improve the platform and product offerings:</p>
    
    <ul>
      <li><strong>Feature Requests:</strong> Suggest new dashboard features or capabilities</li>
      <li><strong>Product Suggestions:</strong> Request specific products or categories</li>
      <li><strong>User Experience:</strong> Report bugs or usability issues</li>
      <li><strong>Success Stories:</strong> Share your wins to be featured in our newsletter</li>
    </ul>

    <div class="info-box">
      <strong>Submit Feedback:</strong> Navigate to <strong>Messages → Feedback</strong> in your dashboard, or email feedback@1strep.com
    </div>

    <h2>Emergency Contact</h2>
    
    <p>For critical, time-sensitive issues:</p>
    
    <div class="warning-box">
      <strong>Urgent Issues Only:</strong>
      <ul>
        <li>Payment processing failures affecting customer orders</li>
        <li>Storefront down or inaccessible</li>
        <li>Security concerns or unauthorized access</li>
        <li>Critical data loss or corruption</li>
      </ul>
      <p><strong>Emergency Email:</strong> urgent@1strep.com</p>
      <p><strong>Subject Line:</strong> Start with "URGENT: [Your Issue]"</p>
      <p><strong>Response Time:</strong> Within 2 hours, 24/7</p>
    </div>

    <h2>Terms & Policies</h2>
    
    <p>Important documents and agreements:</p>
    
    <ul>
      <li><strong>Reseller Agreement:</strong> Your contract terms and conditions</li>
      <li><strong>Pricing Policy:</strong> Guidelines for product pricing in your storefront</li>
      <li><strong>Brand Guidelines:</strong> How to represent 1stRep brand</li>
      <li><strong>Return Policy:</strong> Customer return and refund procedures</li>
      <li><strong>Privacy Policy:</strong> How customer data is handled</li>
      <li><strong>Payment Terms:</strong> Credit and payment schedule details</li>
    </ul>

    <p>Access all documents in <strong>Settings → Legal Documents</strong></p>
  </div>

  <!-- Closing Page -->
  <div style="page-break-before: always; text-align: center; padding-top: 200px;">
    <h1 style="border: none;">Thank You!</h1>
    
    <p style="font-size: 14pt; margin: 30px 0; line-height: 1.8;">
      We're excited to partner with you on this journey.<br>
      Together, we'll bring premium fitness apparel to customers worldwide.
    </p>
    
    <div style="margin: 50px 0;">
      <p style="font-size: 18pt; font-weight: bold; color: #3b82f6;">Welcome to the 1stRep Family!</p>
    </div>
    
    <div style="margin-top: 100px; font-size: 12pt; color: #666;">
      <p><strong>Questions?</strong> Contact us anytime at resellers@1strep.com</p>
      <p style="margin-top: 20px;">© 2025 1stRep Premium E-Commerce Platform. All rights reserved.</p>
    </div>
  </div>

  <footer>
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span>1stRep Reseller User Guide</span>
      <span class="page-number"></span>
      <span>© 2025 1stRep</span>
    </div>
  </footer>
</body>
</html>
`;

async function generatePDF() {
  console.log('🚀 Starting PDF generation...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  await page.setContent(resellerGuideHTML, {
    waitUntil: 'networkidle0'
  });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm'
    },
    displayHeaderFooter: false,
  });
  
  await browser.close();
  
  // Save to public directory for download
  const outputPath = join(process.cwd(), 'public', '1stRep-Reseller-User-Guide.pdf');
  writeFileSync(outputPath, pdfBuffer);
  
  console.log('✅ PDF generated successfully!');
  console.log(`📁 Saved to: ${outputPath}`);
  console.log(`📥 Download URL: /1stRep-Reseller-User-Guide.pdf`);
  
  return outputPath;
}

// Run the generation
generatePDF()
  .then((path) => {
    console.log('\n✨ Complete! Your reseller guide is ready for download.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error generating PDF:', error);
    process.exit(1);
  });
