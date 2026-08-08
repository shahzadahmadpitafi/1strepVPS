const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Qanzak Global — Marketing Proposal for 1stRep</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', sans-serif;
    background: #fff;
    color: #1a1a2e;
    font-size: 13px;
    line-height: 1.7;
  }

  /* COVER PAGE */
  .cover {
    width: 100%;
    min-height: 100vh;
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a3e 40%, #0d1f3c 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 60px 40px;
    position: relative;
    overflow: hidden;
    page-break-after: always;
  }

  .cover::before {
    content: '';
    position: absolute;
    top: -100px; left: -100px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%);
    border-radius: 50%;
  }

  .cover::after {
    content: '';
    position: absolute;
    bottom: -80px; right: -80px;
    width: 350px; height: 350px;
    background: radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%);
    border-radius: 50%;
  }

  .cover-accent {
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, #6366f1, #10b981);
    border-radius: 2px;
    margin: 0 auto 32px;
  }

  .cover-tag {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #10b981;
    margin-bottom: 20px;
  }

  .cover h1 {
    font-size: 42px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.15;
    margin-bottom: 10px;
    letter-spacing: -0.5px;
  }

  .cover h1 span {
    background: linear-gradient(90deg, #6366f1, #10b981);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .cover-sub {
    font-size: 15px;
    color: rgba(255,255,255,0.55);
    font-weight: 400;
    margin-top: 6px;
    margin-bottom: 48px;
    letter-spacing: 0.3px;
  }

  .cover-divider {
    width: 1px;
    height: 50px;
    background: linear-gradient(180deg, transparent, rgba(255,255,255,0.2), transparent);
    margin: 0 auto 40px;
  }

  .cover-meta {
    display: flex;
    gap: 60px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .cover-meta-item {
    text-align: center;
  }

  .cover-meta-item .label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    margin-bottom: 6px;
  }

  .cover-meta-item .value {
    font-size: 14px;
    font-weight: 600;
    color: rgba(255,255,255,0.9);
  }

  .cover-logo {
    position: absolute;
    top: 36px;
    left: 40px;
    font-size: 16px;
    font-weight: 800;
    color: rgba(255,255,255,0.9);
    letter-spacing: -0.3px;
  }

  .cover-logo span {
    color: #10b981;
  }

  .cover-footer {
    position: absolute;
    bottom: 28px;
    left: 0; right: 0;
    text-align: center;
    font-size: 10px;
    color: rgba(255,255,255,0.2);
    letter-spacing: 1px;
  }

  /* CONTENT PAGES */
  .page {
    padding: 56px 56px;
    max-width: 100%;
    page-break-after: always;
  }

  .page:last-child {
    page-break-after: auto;
  }

  /* HEADER BAR ON CONTENT PAGES */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f5;
  }

  .page-header-logo {
    font-size: 13px;
    font-weight: 800;
    color: #1a1a2e;
    letter-spacing: -0.2px;
  }

  .page-header-logo span { color: #10b981; }

  .page-header-tag {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #6366f1;
  }

  /* SECTION TITLES */
  .section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: #10b981;
    margin-bottom: 10px;
  }

  h2 {
    font-size: 26px;
    font-weight: 800;
    color: #1a1a2e;
    line-height: 1.2;
    margin-bottom: 6px;
    letter-spacing: -0.4px;
  }

  .section-intro {
    font-size: 13.5px;
    color: #64748b;
    margin-bottom: 32px;
    line-height: 1.75;
    max-width: 580px;
  }

  h3 {
    font-size: 15px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 8px;
    margin-top: 28px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  h3::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 16px;
    background: linear-gradient(180deg, #6366f1, #10b981);
    border-radius: 2px;
    flex-shrink: 0;
  }

  p {
    color: #475569;
    margin-bottom: 12px;
    font-size: 13px;
    line-height: 1.8;
  }

  /* HIGHLIGHT BOX */
  .highlight-box {
    background: linear-gradient(135deg, #f0f4ff, #f0fff8);
    border: 1px solid #e0e7ff;
    border-left: 4px solid #6366f1;
    border-radius: 10px;
    padding: 20px 24px;
    margin: 24px 0;
  }

  .highlight-box p {
    margin: 0;
    color: #1a1a2e;
    font-weight: 500;
    font-size: 13px;
  }

  /* TWO COLUMN GRID */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 20px 0;
  }

  .card {
    background: #f8fafc;
    border: 1px solid #e8ecf0;
    border-radius: 12px;
    padding: 20px;
  }

  .card-icon {
    font-size: 20px;
    margin-bottom: 10px;
  }

  .card h4 {
    font-size: 13px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 6px;
  }

  .card p {
    font-size: 12px;
    color: #64748b;
    margin: 0;
    line-height: 1.7;
  }

  /* RATE BOX */
  .rate-section {
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a3e 100%);
    border-radius: 16px;
    padding: 40px;
    margin-top: 32px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .rate-section::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%);
    border-radius: 50%;
  }

  .rate-section::after {
    content: '';
    position: absolute;
    bottom: -40px; left: -40px;
    width: 160px; height: 160px;
    background: radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%);
    border-radius: 50%;
  }

  .rate-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: #10b981;
    margin-bottom: 16px;
    position: relative; z-index: 1;
  }

  .rate-amount {
    font-size: 58px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -2px;
    line-height: 1;
    position: relative; z-index: 1;
  }

  .rate-amount span {
    font-size: 28px;
    font-weight: 600;
    color: rgba(255,255,255,0.6);
    vertical-align: super;
    letter-spacing: 0;
  }

  .rate-period {
    font-size: 14px;
    color: rgba(255,255,255,0.45);
    margin-top: 6px;
    font-weight: 400;
    position: relative; z-index: 1;
  }

  .rate-note {
    font-size: 11.5px;
    color: rgba(255,255,255,0.4);
    margin-top: 20px;
    position: relative; z-index: 1;
    line-height: 1.6;
  }

  /* LIST STYLE */
  ul {
    list-style: none;
    padding: 0;
    margin: 8px 0 16px;
  }

  ul li {
    color: #475569;
    font-size: 12.5px;
    padding: 5px 0 5px 20px;
    position: relative;
    line-height: 1.7;
  }

  ul li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: #10b981;
    font-weight: 700;
    font-size: 11px;
    top: 6px;
  }

  /* TAG PILLS */
  .pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0 20px;
  }

  .pill {
    background: #f0f4ff;
    border: 1px solid #e0e7ff;
    color: #6366f1;
    font-size: 11px;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 20px;
    letter-spacing: 0.2px;
  }

  .pill.green {
    background: #f0fff8;
    border-color: #a7f3d0;
    color: #059669;
  }

  /* CLOSING PAGE */
  .closing {
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a3e 40%, #0d1f3c 100%);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 60px 40px;
    page-break-before: always;
    position: relative;
    overflow: hidden;
  }

  .closing::before {
    content: '';
    position: absolute;
    top: -100px; left: -100px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%);
    border-radius: 50%;
  }

  .closing h2 {
    font-size: 34px;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 16px;
    letter-spacing: -0.5px;
  }

  .closing h2 span {
    background: linear-gradient(90deg, #6366f1, #10b981);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .closing p {
    font-size: 14px;
    color: rgba(255,255,255,0.5);
    max-width: 420px;
    line-height: 1.8;
    margin: 0 auto 40px;
  }

  .contact-box {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 32px 48px;
    position: relative; z-index: 1;
  }

  .contact-box .contact-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #10b981;
    margin-bottom: 16px;
  }

  .contact-box .contact-name {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 6px;
  }

  .contact-box .contact-detail {
    font-size: 13px;
    color: rgba(255,255,255,0.45);
    margin: 3px 0;
  }

  .closing-logo {
    position: absolute;
    top: 36px;
    left: 40px;
    font-size: 16px;
    font-weight: 800;
    color: rgba(255,255,255,0.9);
  }

  .closing-logo span { color: #10b981; }

  .closing-footer {
    position: absolute;
    bottom: 28px;
    left: 0; right: 0;
    text-align: center;
    font-size: 10px;
    color: rgba(255,255,255,0.15);
    letter-spacing: 1px;
  }

  .badge-row {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 36px;
  }

  .badge {
    background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.3);
    color: rgba(255,255,255,0.7);
    font-size: 11px;
    font-weight: 500;
    padding: 6px 16px;
    border-radius: 20px;
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-logo">Qanzak<span>Global</span></div>

  <div class="cover-tag">Marketing Proposal</div>
  <div class="cover-accent"></div>
  <h1>Growing <span>1stRep</span><br/>Across the UK</h1>
  <div class="cover-sub">Organic Growth · Paid Advertising · Influencer Marketing</div>
  <div class="cover-divider"></div>

  <div class="cover-meta">
    <div class="cover-meta-item">
      <div class="label">Prepared For</div>
      <div class="value">1stRep</div>
    </div>
    <div class="cover-meta-item">
      <div class="label">Prepared By</div>
      <div class="value">Qanzak Global</div>
    </div>
    <div class="cover-meta-item">
      <div class="label">Market</div>
      <div class="value">United Kingdom</div>
    </div>
    <div class="cover-meta-item">
      <div class="label">Year</div>
      <div class="value">2025–2026</div>
    </div>
  </div>

  <div class="cover-footer">CONFIDENTIAL — PREPARED BY QANZAK GLOBAL</div>
</div>


<!-- PAGE 1: OVERVIEW -->
<div class="page">
  <div class="page-header">
    <div class="page-header-logo">Qanzak<span>Global</span></div>
    <div class="page-header-tag">Marketing Proposal — 1stRep</div>
  </div>

  <div class="section-label">About This Proposal</div>
  <h2>What Qanzak Global<br/>Will Do for 1stRep</h2>
  <p class="section-intro">
    Qanzak Global will take full ownership of 1stRep's digital marketing — covering organic growth, paid advertising, and influencer partnerships. Our approach targets two audiences in parallel: UK consumers who will buy 1stRep products, and UK entrepreneurs who will join 1stRep as reseller partners.
  </p>

  <div class="highlight-box">
    <p>We don't just run ads and report numbers. We build a full marketing presence for 1stRep that grows its brand, its customer base, and its reseller network — at the same time.</p>
  </div>

  <div class="two-col">
    <div class="card">
      <div class="card-icon">🛍️</div>
      <h4>Consumer Product Sales</h4>
      <p>Reaching UK shoppers who are looking for quality fashion products and converting them into loyal 1stRep customers.</p>
    </div>
    <div class="card">
      <div class="card-icon">🤝</div>
      <h4>Reseller Recruitment</h4>
      <p>Targeting UK entrepreneurs, side hustlers, and fashion sellers who want to build income as a 1stRep reseller partner.</p>
    </div>
  </div>

  <p>Both audiences are targeted with messaging and creative tailored to them specifically. A consumer who buys and loves 1stRep products is also a strong potential reseller — our strategy is designed to turn buyers into partners over time, creating a compounding growth effect for the business.</p>
</div>


<!-- PAGE 2: ORGANIC MARKETING -->
<div class="page">
  <div class="page-header">
    <div class="page-header-logo">Qanzak<span>Global</span></div>
    <div class="page-header-tag">Organic Marketing</div>
  </div>

  <div class="section-label">Section 01</div>
  <h2>Organic Marketing</h2>
  <p class="section-intro">Organic marketing builds lasting brand authority that keeps working long after each piece of content is published. It is the foundation everything else sits on.</p>

  <h3>Search Engine Optimisation</h3>
  <p>We will optimise 1stRep's website so it ranks on Google for searches made by UK consumers looking for fashion products and UK entrepreneurs looking for reseller opportunities. We will research the right keywords, optimise product pages and landing pages, and publish regular blog content that builds search authority month over month — so 1stRep earns traffic without paying for every click.</p>

  <h3>Google My Business</h3>
  <p>We will set up and maintain 1stRep's Google Business profile, ensuring the brand appears correctly in Google Search and Maps — building trust and credibility with UK customers from the first impression.</p>

  <h3>Facebook & Instagram — Organic</h3>
  <p>We will manage 1stRep's Facebook and Instagram accounts with a consistent, on-brand posting schedule. Content will cover product showcases, styling posts, seasonal campaigns, customer features, reseller spotlights, and engagement-driven content like polls and stories. We will also actively engage in UK Facebook Groups where potential customers and resellers spend time — building genuine presence in those communities rather than simply broadcasting.</p>

  <h3>TikTok & Instagram Reels</h3>
  <p>Short-form video is the single highest-reach organic format in the UK right now. We will create and publish regular TikTok and Reels content covering product reveals, styling content, behind-the-scenes, reseller success stories, and educational content about the 1stRep opportunity. This is where the largest volume of organic reach will come from, particularly with younger UK audiences.</p>

  <div class="pill-row">
    <span class="pill">Product Showcases</span>
    <span class="pill">Styling Content</span>
    <span class="pill">Reseller Spotlights</span>
    <span class="pill">Seasonal Campaigns</span>
    <span class="pill green">Day-in-the-Life</span>
    <span class="pill green">Earnings Reveals</span>
    <span class="pill green">Trending Sounds</span>
  </div>

  <h3>Email Marketing</h3>
  <p>We will build and manage an email marketing strategy for 1stRep — including a welcome sequence for new customers and reseller sign-ups, weekly product and offer newsletters, abandoned basket recovery, and campaign emails tied to key UK retail moments: January sales, Easter, Black Friday, and Christmas.</p>

  <h3>Community Building</h3>
  <p>We will build and manage a dedicated community space — a Facebook Group or similar — for 1stRep resellers to connect, share results, and support each other. A thriving reseller community creates brand loyalty, generates constant organic content, and is one of the most powerful long-term growth tools available for a platform like 1stRep.</p>
</div>


<!-- PAGE 3: PAID MARKETING -->
<div class="page">
  <div class="page-header">
    <div class="page-header-logo">Qanzak<span>Global</span></div>
    <div class="page-header-tag">Paid Marketing & Influencers</div>
  </div>

  <div class="section-label">Section 02</div>
  <h2>Paid Marketing</h2>
  <p class="section-intro">When the organic foundation is in place, paid advertising accelerates what is already working — reaching the right people faster, at scale.</p>

  <h3>Google Ads</h3>
  <p>We will run paid search and shopping campaigns targeting UK consumers actively searching for fashion products, and UK entrepreneurs searching for reseller opportunities. Google Shopping ads will place 1stRep's products — with images and prices — at the very top of relevant search results. Every campaign is tracked, optimised weekly, and reported on monthly. Nothing is left running on autopilot.</p>

  <h3>Facebook & Instagram Ads</h3>
  <p>We will run highly targeted Meta ad campaigns reaching UK consumers most likely to purchase 1stRep products, and UK side hustlers most likely to sign up as resellers. These are two separate campaign tracks with messaging and creative tailored to each audience. We will manage retargeting campaigns to bring back people who visited the site but did not convert, and lookalike campaigns to find new audiences that match the profile of 1stRep's best customers and most active resellers.</p>

  <div class="two-col">
    <div class="card">
      <div class="card-icon">🎯</div>
      <h4>Consumer Campaigns</h4>
      <p>Targeted at UK fashion buyers. Focus on product quality, style, and value. Driving direct sales through the 1stRep store.</p>
    </div>
    <div class="card">
      <div class="card-icon">📈</div>
      <h4>Reseller Recruitment Campaigns</h4>
      <p>Targeted at UK entrepreneurs. Focus on the income opportunity, ease of getting started, and 1stRep's support system.</p>
    </div>
  </div>

  <h3>TikTok Ads</h3>
  <p>Where appropriate, we will run TikTok paid campaigns to amplify top-performing organic content and reach a wider UK audience. TikTok's ad platform is particularly effective for fashion and lifestyle with a younger demographic — and the cost per result is still lower than Meta for many product categories in the UK right now.</p>

  <div class="section-label" style="margin-top: 36px;">Section 03</div>
  <h2>Influencer Marketing</h2>
  <p class="section-intro">Influencer partnerships bring 1stRep in front of established, trusted audiences — delivering reach and credibility that paid ads alone cannot replicate.</p>

  <p>We will identify, approach, and manage partnerships with UK-based influencers across Instagram and TikTok in the fashion, lifestyle, and entrepreneurship space. Our focus is on micro-influencers — those with between 10,000 and 100,000 followers — who have engaged, loyal audiences and strong trust with their community. These partnerships consistently outperform larger influencer deals for platforms like 1stRep.</p>

  <ul>
    <li>For consumer product promotion — influencers showcase 1stRep products through styling content, honest reviews, and shoppable affiliate links so their audience can buy directly</li>
    <li>For reseller recruitment — influencers in the UK side hustle and entrepreneurship space share their own experience with the 1stRep opportunity, reaching people already looking for what 1stRep offers</li>
    <li>All influencer relationships are fully managed by Qanzak Global — from initial outreach and negotiation through to content approval and performance reporting</li>
    <li>1stRep retains full visibility and sign-off on all influencer content before it is published</li>
  </ul>
</div>


<!-- PAGE 4: RATE -->
<div class="page">
  <div class="page-header">
    <div class="page-header-logo">Qanzak<span>Global</span></div>
    <div class="page-header-tag">Investment</div>
  </div>

  <div class="section-label">Our Rate</div>
  <h2>Simple, Transparent Pricing</h2>
  <p class="section-intro">One monthly retainer covers everything Qanzak Global does for 1stRep — organic content, SEO, social media management, ad campaign management, and influencer outreach. No hidden fees, no surprises.</p>

  <div class="rate-section">
    <div class="rate-label">Monthly Retainer — All Services Included</div>
    <div class="rate-amount"><span>£</span>1,200</div>
    <div class="rate-period">per month</div>
    <div class="rate-note">
      Ad spend, influencer fees, and platform costs are separate<br/>
      and agreed in advance — paid directly by 1stRep to the platforms.<br/><br/>
      We manage everything. You only pay for what you decide to run.
    </div>
  </div>

  <div class="two-col" style="margin-top: 24px;">
    <div class="card">
      <div class="card-icon">📋</div>
      <h4>What Is Included</h4>
      <ul style="margin:0;">
        <li>SEO & blog content management</li>
        <li>Google Ads campaign management</li>
        <li>Facebook & Instagram Ads management</li>
        <li>TikTok Ads management</li>
        <li>Organic social media management</li>
        <li>Email marketing management</li>
        <li>Influencer outreach & management</li>
        <li>Monthly performance reporting</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-icon">🤝</div>
      <h4>How We Work Together</h4>
      <ul style="margin:0;">
        <li>No long-term lock-in — start with 3 months</li>
        <li>All ad accounts remain owned by 1stRep</li>
        <li>Full transparency on all spend and results</li>
        <li>Direct communication — WhatsApp or email</li>
        <li>Monthly report delivered on the 5th</li>
        <li>Ads and influencer spend agreed before launch</li>
      </ul>
    </div>
  </div>
</div>


<!-- CLOSING PAGE -->
<div class="closing">
  <div class="closing-logo">Qanzak<span>Global</span></div>

  <div class="badge-row">
    <span class="badge">Organic Growth</span>
    <span class="badge">Paid Ads</span>
    <span class="badge">Influencer Marketing</span>
  </div>

  <h2>Let's Build <span>1stRep</span><br/>Together</h2>
  <p>We're ready to start. Get in touch to discuss the proposal and agree on a kickoff date that works for both teams.</p>

  <div class="contact-box">
    <div class="contact-label">Get In Touch</div>
    <div class="contact-name">Qanzak Global</div>
    <div class="contact-detail">qanzakglobal.com</div>
  </div>

  <div class="closing-footer">CONFIDENTIAL — PREPARED BY QANZAK GLOBAL FOR 1STREP</div>
</div>

</body>
</html>
`;

async function generatePDF() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const outputPath = path.join(__dirname, '..', 'Qanzak_Global_1stRep_Marketing_Proposal.pdf');

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });

  await browser.close();
  console.log(`PDF saved to: ${outputPath}`);
}

generatePDF().catch(console.error);
