/**
 * Weekly Customer Email Digest Service
 * Sends a beautifully designed weekly email to all active customers featuring
 * the top product of the week and newly added products.
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import { sendEmail } from "./email";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailProduct {
  id: string;
  name: string;
  category: string;
  retailPrice: string;
  salePrice: string | null;
  imageUrl: string | null;
}

interface WeeklyEmailData {
  topProduct: EmailProduct | null;
  newProducts: EmailProduct[];
  weekLabel: string;
}

// ─── Colour palette — 1stRep Brand Identity v1.9 (monochrome only) ─────────
const C = {
  pageBg:   "#080808",   // brand black — outer wrapper
  panelBg:  "#0F0F0F",   // dark panel — main sections
  cardBg:   "#161616",   // card background — product cards / hero details
  border:   "#3A3A3A",   // border / divider
  heading:  "#FAFAF8",   // off-white — headlines, product names
  body:     "#B0B0B0",   // light grey — body text, category labels
  subtle:   "#6E6E6E",   // mid grey — subtle text, legal copy
  ctaBg:    "#FAFAF8",   // CTA button background (off-white per brand spec)
  ctaText:  "#080808",   // CTA button text (black on off-white)
  labelBg:  "#080808",   // label stripe background
};
const FONT = `Inter,'Helvetica Neue',Arial,sans-serif`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function productUrl(p: EmailProduct): string {
  return `https://1strep.com/product/${p.id}`;
}

/** Big price display used in hero section */
function priceHero(retail: string, sale: string | null): string {
  const r = parseFloat(retail);
  if (sale) {
    const s = parseFloat(sale);
    if (s < r) {
      const pct = Math.round(((r - s) / r) * 100);
      return `
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;padding-right:10px;">
              <span style="display:inline-block;background:${C.heading};color:${C.ctaText};
                font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
                padding:5px 10px;font-family:${FONT};">-${pct}%</span>
            </td>
            <td style="vertical-align:middle;">
              <span style="font-size:28px;font-weight:800;color:${C.heading};font-family:${FONT};
                letter-spacing:-0.5px;line-height:1;">£${s.toFixed(2)}</span>
              <span style="font-size:16px;color:${C.body};text-decoration:line-through;
                margin-left:8px;font-family:${FONT};">£${r.toFixed(2)}</span>
            </td>
          </tr>
        </table>`;
    }
  }
  return `<span style="font-size:28px;font-weight:800;color:${C.heading};font-family:${FONT};
    letter-spacing:-0.5px;">£${r.toFixed(2)}</span>`;
}

/** Compact price used in grid cards */
function priceCard(retail: string, sale: string | null): string {
  const r = parseFloat(retail);
  if (sale) {
    const s = parseFloat(sale);
    if (s < r) {
      return `<span style="font-size:16px;font-weight:800;color:${C.heading};
                font-family:${FONT};">£${s.toFixed(2)}</span>
              <span style="font-size:12px;color:${C.body};text-decoration:line-through;
                margin-left:6px;font-family:${FONT};">£${r.toFixed(2)}</span>`;
    }
  }
  return `<span style="font-size:16px;font-weight:800;color:${C.heading};
    font-family:${FONT};">£${r.toFixed(2)}</span>`;
}

function saleBadge(retail: string, sale: string | null): string {
  if (!sale) return "";
  const r = parseFloat(retail);
  const s = parseFloat(sale);
  if (s >= r) return "";
  const pct = Math.round(((r - s) / r) * 100);
  return `<div style="position:absolute;top:12px;left:12px;background:${C.heading};color:${C.ctaText};
    font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
    padding:4px 9px;font-family:${FONT};">SAVE ${pct}%</div>`;
}

function placeholderImg(name: string): string {
  return `https://placehold.co/800x800/161616/B0B0B0?text=${encodeURIComponent(name.charAt(0))}`;
}

/**
 * Converts any stored image URL into one that renders directly in email clients.
 * Dropbox shared links with dl=0 show the preview page — swap to dl=1 for raw image.
 */
function emailSafeImg(url: string | null, fallbackName: string): string {
  if (!url) return placeholderImg(fallbackName);
  if (url.includes("dropbox.com")) {
    return url.replace(/[?&]dl=0/, (m) => m.replace("dl=0", "dl=1"));
  }
  return url;
}

// ─── Email HTML builder ────────────────────────────────────────────────────────

export function buildWeeklyEmailHtml(opts: {
  firstName: string;
  data: WeeklyEmailData;
  unsubscribeToken: string;
}): string {
  const { firstName, data, unsubscribeToken } = opts;
  const name = firstName || "there";
  const unsubUrl = `https://1strep.com/unsubscribe?token=${unsubscribeToken}`;

  // ── 1. Hero: Top Product ──────────────────────────────────────────────────
  let heroHtml = "";
  if (data.topProduct) {
    const p = data.topProduct;
    const img = emailSafeImg(p.imageUrl, p.name);
    const url = productUrl(p);

    heroHtml = `
      <!-- TOP PICK LABEL -->
      <tr>
        <td style="background:${C.labelBg};padding:14px 40px;border-bottom:1px solid ${C.border};">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <span style="color:${C.heading};font-size:9px;font-weight:700;letter-spacing:4px;
                  text-transform:uppercase;font-family:${FONT};">THIS WEEK'S TOP PICK</span>
              </td>
              <td align="right">
                <span style="color:${C.subtle};font-size:9px;letter-spacing:2px;
                  text-transform:uppercase;font-family:${FONT};">MOST POPULAR</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- HERO IMAGE (full width) -->
      <tr>
        <td style="padding:0;background:${C.cardBg};line-height:0;font-size:0;">
          <a href="${url}" style="display:block;text-decoration:none;">
            <img src="${img}" alt="${p.name}" width="600"
              style="display:block;width:100%;max-width:600px;height:400px;object-fit:cover;
                object-position:center top;background:${C.cardBg};"
              onerror="this.style.height='300px'"/>
          </a>
        </td>
      </tr>

      <!-- HERO DETAILS -->
      <tr>
        <td style="background:${C.cardBg};padding:28px 40px 32px;border-bottom:1px solid ${C.border};">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom:6px;">
                <span style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;
                  color:${C.body};font-family:${FONT};">${p.category}</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:14px;">
                <h2 style="margin:0;font-size:28px;font-weight:900;color:${C.heading};letter-spacing:-0.5px;
                  line-height:1.1;font-family:${FONT};">${p.name}</h2>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                ${priceHero(p.retailPrice, p.salePrice)}
              </td>
            </tr>
            <tr>
              <td>
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right:12px;">
                      <a href="${url}" style="display:inline-block;background:${C.ctaBg};color:${C.ctaText};
                        font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;
                        text-decoration:none;padding:14px 36px;font-family:${FONT};">SHOP NOW</a>
                    </td>
                    <td>
                      <a href="https://1strep.com/shop" style="display:inline-block;background:transparent;
                        color:${C.heading};border:1px solid ${C.border};font-size:11px;font-weight:700;
                        letter-spacing:2.5px;text-transform:uppercase;text-decoration:none;
                        padding:13px 28px;font-family:${FONT};">VIEW ALL</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px;">
                <span style="font-size:11px;color:${C.body};font-family:${FONT};">
                  Free delivery over £75 &nbsp; · &nbsp; 30-day returns &nbsp; · &nbsp; UK stock
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

  // ── 2. New Arrivals Grid ──────────────────────────────────────────────────
  let gridHtml = "";
  if (data.newProducts.length > 0) {
    const pairs: Array<[EmailProduct, EmailProduct | null]> = [];
    for (let i = 0; i < data.newProducts.length; i += 2) {
      pairs.push([data.newProducts[i], data.newProducts[i + 1] ?? null]);
    }

    const productCard = (p: EmailProduct): string => {
      const img = emailSafeImg(p.imageUrl, p.name);
      const url = productUrl(p);
      const hasSale = p.salePrice && parseFloat(p.salePrice) < parseFloat(p.retailPrice);
      return `
          <td width="270" style="vertical-align:top;width:270px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
              style="background:${C.cardBg};border:1px solid ${C.border};">
              <tr>
                <td style="padding:0;line-height:0;font-size:0;position:relative;">
                  <a href="${url}" style="display:block;text-decoration:none;line-height:0;">
                    <img src="${img}" alt="${p.name}" width="270"
                      style="display:block;width:100%;height:270px;object-fit:cover;
                        object-position:center;background:${C.cardBg};" />
                  </a>
                  ${hasSale ? `
                  <div style="background:${C.heading};color:${C.ctaText};font-size:8px;font-weight:700;
                    letter-spacing:2px;text-transform:uppercase;padding:4px 9px;
                    font-family:${FONT};display:inline-block;
                    position:absolute;top:0;left:0;">SALE</div>` : ""}
                </td>
              </tr>
              <tr>
                <td style="padding:14px 16px 20px;">
                  <p style="margin:0 0 3px;font-size:8px;font-weight:700;letter-spacing:2.5px;
                    text-transform:uppercase;color:${C.body};font-family:${FONT};">${p.category}</p>
                  <a href="${url}" style="text-decoration:none;">
                    <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:${C.heading};
                      line-height:1.25;font-family:${FONT};">${p.name}</p>
                  </a>
                  <p style="margin:0 0 14px;">${priceCard(p.retailPrice, p.salePrice)}</p>
                  <a href="${url}" style="display:inline-block;background:${C.ctaBg};color:${C.ctaText};
                    font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
                    text-decoration:none;padding:10px 20px;font-family:${FONT};">ADD TO BAG</a>
                </td>
              </tr>
            </table>
          </td>`;
    };

    const emptyCard = (): string => `<td width="270" style="width:270px;"></td>`;

    const rowsHtml = pairs.map(([left, right]) => `
        <tr>
          ${productCard(left)}
          <td width="20" style="width:20px;min-width:20px;"></td>
          ${right ? productCard(right) : emptyCard()}
        </tr>
        <tr><td colspan="3" style="height:20px;"></td></tr>`).join("");

    gridHtml = `
      <!-- NEW ARRIVALS HEADER -->
      <tr>
        <td style="background:${C.panelBg};padding:32px 40px 20px;border-top:2px solid ${C.heading};">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <p style="margin:0 0 2px;font-size:9px;font-weight:700;letter-spacing:4px;
                  text-transform:uppercase;color:${C.body};font-family:${FONT};">Just Added</p>
                <h2 style="margin:0;font-size:24px;font-weight:900;color:${C.heading};
                  letter-spacing:-0.3px;font-family:${FONT};">New This Week</h2>
              </td>
              <td align="right" style="vertical-align:bottom;">
                <a href="https://1strep.com/shop" style="font-size:10px;font-weight:700;
                  letter-spacing:2px;text-transform:uppercase;color:${C.heading};
                  text-decoration:none;font-family:${FONT};">SHOP ALL &rarr;</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- PRODUCT GRID -->
      <tr>
        <td style="background:${C.panelBg};padding:0 40px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${rowsHtml}
          </table>
        </td>
      </tr>`;
  }

  // ── 3. Value strip ────────────────────────────────────────────────────────
  const valueHtml = `
      <tr>
        <td style="background:${C.labelBg};border-top:1px solid ${C.border};border-bottom:1px solid ${C.border};padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="25%" style="text-align:center;padding:22px 8px;
                border-right:1px solid ${C.border};">
                <p style="margin:0 0 3px;font-size:20px;font-weight:900;color:${C.heading};
                  font-family:${FONT};">FREE</p>
                <p style="margin:0;font-size:9px;font-weight:600;letter-spacing:2px;
                  text-transform:uppercase;color:${C.body};font-family:${FONT};">Delivery Over £75</p>
              </td>
              <td width="25%" style="text-align:center;padding:22px 8px;
                border-right:1px solid ${C.border};">
                <p style="margin:0 0 3px;font-size:20px;font-weight:900;color:${C.heading};
                  font-family:${FONT};">30</p>
                <p style="margin:0;font-size:9px;font-weight:600;letter-spacing:2px;
                  text-transform:uppercase;color:${C.body};font-family:${FONT};">Day Returns</p>
              </td>
              <td width="25%" style="text-align:center;padding:22px 8px;
                border-right:1px solid ${C.border};">
                <p style="margin:0 0 3px;font-size:20px;font-weight:900;color:${C.heading};
                  font-family:${FONT};">UK</p>
                <p style="margin:0;font-size:9px;font-weight:600;letter-spacing:2px;
                  text-transform:uppercase;color:${C.body};font-family:${FONT};">Operated</p>
              </td>
              <td width="25%" style="text-align:center;padding:22px 8px;">
                <p style="margin:0 0 3px;font-size:20px;font-weight:900;color:${C.heading};
                  font-family:${FONT};">PRO</p>
                <p style="margin:0;font-size:9px;font-weight:600;letter-spacing:2px;
                  text-transform:uppercase;color:${C.body};font-family:${FONT};">Grade Quality</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;

  // ── 4. Shop CTA ───────────────────────────────────────────────────────────
  const ctaHtml = `
      <tr>
        <td style="background:${C.cardBg};padding:44px 40px;text-align:center;
          border-top:1px solid ${C.border};">
          <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:4px;
            text-transform:uppercase;color:${C.body};font-family:${FONT};">Explore More</p>
          <h2 style="margin:0 0 12px;font-size:26px;font-weight:900;color:${C.heading};
            letter-spacing:-0.5px;font-family:${FONT};">The Full 1stRep Collection</h2>
          <p style="margin:0 auto 28px;max-width:400px;font-size:14px;color:${C.body};
            line-height:1.65;font-family:${FONT};">
            Performance apparel built for athletes who show up.
            New drops, bestsellers, and limited pieces.
          </p>
          <a href="https://1strep.com/shop"
            style="display:inline-block;background:${C.ctaBg};color:${C.ctaText};
              font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;
              text-decoration:none;padding:16px 44px;font-family:${FONT};">SHOP THE COLLECTION</a>
        </td>
      </tr>`;

  // ── 5. Footer ─────────────────────────────────────────────────────────────
  const footerHtml = `
      <tr>
        <td style="background:${C.labelBg};padding:36px 40px 28px;border-top:1px solid ${C.border};">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom:20px;border-bottom:1px solid ${C.border};">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <img src="https://1strep.com/1strep-header-logo.png" alt="1stRep"
                        width="100" style="display:block;max-width:100px;height:auto;" />
                      <p style="margin:8px 0 0;font-size:10px;color:${C.subtle};
                        font-family:${FONT};">Wear Your Standards.</p>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <a href="https://1strep.com/shop" style="color:${C.body};font-size:10px;
                        font-weight:600;letter-spacing:1.5px;text-transform:uppercase;
                        text-decoration:none;margin-left:20px;font-family:${FONT};">Shop</a>
                      <a href="https://1strep.com/account" style="color:${C.body};font-size:10px;
                        font-weight:600;letter-spacing:1.5px;text-transform:uppercase;
                        text-decoration:none;margin-left:20px;font-family:${FONT};">Account</a>
                      <a href="https://1strep.com/contact" style="color:${C.body};font-size:10px;
                        font-weight:600;letter-spacing:1.5px;text-transform:uppercase;
                        text-decoration:none;margin-left:20px;font-family:${FONT};">Contact</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:20px;">
                <p style="margin:0 0 8px;font-size:11px;color:${C.subtle};font-family:${FONT};line-height:1.6;">
                  You are receiving this weekly digest because you have a registered account at 1stRep.
                  If you no longer wish to receive these emails,
                  <a href="${unsubUrl}" style="color:${C.body};text-decoration:underline;font-family:${FONT};">unsubscribe here</a>.
                </p>
                <p style="margin:0;font-size:10px;color:${C.subtle};font-family:${FONT};">
                  &copy; ${new Date().getFullYear()} 1stRep Ltd. Registered in England &amp; Wales.
                  &nbsp;|&nbsp;
                  <a href="https://1strep.com/privacy" style="color:${C.subtle};text-decoration:underline;
                    font-family:${FONT};">Privacy Policy</a>
                  &nbsp;|&nbsp;
                  <a href="https://1strep.com/terms" style="color:${C.subtle};text-decoration:underline;
                    font-family:${FONT};">Terms</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;

  // ── Full document ─────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>Your Weekly 1stRep Update</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none;
          display:block; }
    body { margin:0 !important; padding:0 !important; width:100% !important;
           background-color:#080808 !important; }
    a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
    .email-body { background-color:#080808 !important; }
    @media only screen and (max-width:620px) {
      .email-container { width:100% !important; }
      .hero-img { height:260px !important; }
      .product-img { height:180px !important; }
      .product-col { display:block !important; width:100% !important; padding:0 0 20px 0 !important; }
      .product-gap { display:none !important; }
      .stack-col { display:block !important; width:100% !important; }
    }
  </style>
</head>
<body class="email-body" style="margin:0;padding:0;background:#080808;">

  <!-- Preview text -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;
    color:transparent;line-height:1px;">
    Hi ${name} — your weekly 1stRep digest: top picks and new arrivals inside.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:#080808;">
    <tr>
      <td align="center" style="padding:24px 12px;">

        <!-- EMAIL CONTAINER (600px) -->
        <table class="email-container" role="presentation" width="600" cellpadding="0"
          cellspacing="0" border="0"
          style="max-width:600px;width:100%;background:${C.panelBg};border:1px solid ${C.border};">

          <!-- HEADER: Logo -->
          <tr>
            <td style="background:${C.labelBg};padding:28px 40px;text-align:center;
              border-bottom:2px solid ${C.heading};">
              <img src="https://1strep.com/1strep-header-logo.png" alt="1stRep"
                width="130" style="display:inline-block;max-width:130px;height:auto;" />
              <p style="margin:10px 0 0;font-size:10px;letter-spacing:4px;text-transform:uppercase;
                color:${C.subtle};font-family:${FONT};">Weekly Edit &nbsp; · &nbsp; ${data.weekLabel}</p>
            </td>
          </tr>

          <!-- PERSONALISED GREETING -->
          <tr>
            <td style="background:${C.panelBg};padding:28px 40px 20px;">
              <p style="margin:0;font-size:15px;color:${C.body};font-family:${FONT};line-height:1.6;">
                Hi <strong style="color:${C.heading};">${name}</strong> — this week's top pick and latest drops from 1stRep.
              </p>
            </td>
          </tr>

          ${heroHtml}

          ${gridHtml}

          ${valueHtml}

          ${ctaHtml}

          ${footerHtml}

        </table>

        <p style="margin:16px 0 0;font-size:10px;color:#3A3A3A;text-align:center;font-family:${FONT};">
          1stRep Ltd &nbsp;·&nbsp; United Kingdom &nbsp;·&nbsp;
          <a href="${unsubUrl}" style="color:#3A3A3A;text-decoration:underline;">Unsubscribe</a>
        </p>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

export async function getWeeklyEmailData(opts?: { maxNewProducts?: number; newProductsDays?: number }): Promise<WeeklyEmailData> {
  const maxNew = opts?.maxNewProducts ?? 6;
  const dayWindow = opts?.newProductsDays ?? 14;
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekLabel = weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "long" }) +
    " – " + weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const topProductResult = await db.execute(sql`
    SELECT p.id::text, p.name, p.category,
           p.retail_price::text as "retailPrice",
           p.sale_price::text as "salePrice",
           COALESCE(
             (SELECT pi.url FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.is_primary DESC, pi.sort_order ASC
              LIMIT 1),
             p.image_url
           ) as "imageUrl"
    FROM products p
    WHERE p.is_active = true
      AND p.is_deleted = false
    ORDER BY RANDOM()
    LIMIT 1
  `);

  // First try: products added within the configured day window
  let newProductsResult = await db.execute(sql`
    SELECT p.id::text, p.name, p.category,
           p.retail_price::text as "retailPrice",
           p.sale_price::text as "salePrice",
           COALESCE(
             (SELECT pi.url FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.is_primary DESC, pi.sort_order ASC
              LIMIT 1),
             p.image_url
           ) as "imageUrl"
    FROM products p
    WHERE p.is_active = true
      AND p.is_deleted = false
      AND p.created_at >= NOW() - (${dayWindow} || ' days')::interval
    ORDER BY p.created_at DESC
    LIMIT ${maxNew}
  `);

  // Fallback: if no products fall in the window, show the most recently added real products
  if (newProductsResult.rows.length === 0) {
    newProductsResult = await db.execute(sql`
      SELECT p.id::text, p.name, p.category,
             p.retail_price::text as "retailPrice",
             p.sale_price::text as "salePrice",
             COALESCE(
               (SELECT pi.url FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.is_primary DESC, pi.sort_order ASC
                LIMIT 1),
               p.image_url
             ) as "imageUrl"
      FROM products p
      WHERE p.is_active = true
        AND p.is_deleted = false
      ORDER BY p.created_at DESC
      LIMIT ${maxNew}
    `);
  }

  return {
    topProduct: (topProductResult.rows[0] as EmailProduct | undefined) ?? null,
    newProducts: newProductsResult.rows as EmailProduct[],
    weekLabel,
  };
}

export async function sendWeeklyEmails(): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  try {
    const cfg = await getWeeklyEmailConfig();
    const data = await getWeeklyEmailData({ maxNewProducts: cfg.maxNewProducts, newProductsDays: cfg.newProductsDays });

    const customersResult = await db.execute(sql`
      SELECT u.id, u.email, u.first_name as "firstName",
             up.weekly_digest_unsubscribe_token as "unsubscribeToken"
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      WHERE u.role = 'customer'
        AND u.email IS NOT NULL
        AND (up.weekly_digest_opted_in IS NULL OR up.weekly_digest_opted_in = true)
      LIMIT 1000
    `);

    for (const customer of customersResult.rows as Array<{ id: number; email: string; firstName: string | null; unsubscribeToken: string | null }>) {
      try {
        const token = customer.unsubscribeToken ?? `${customer.id}-${Date.now()}`;
        const html = buildWeeklyEmailHtml({
          firstName: customer.firstName ?? "",
          data,
          unsubscribeToken: token,
        });

        const success = await sendEmail(
          customer.email,
          `Your Weekly 1stRep Update — ${data.weekLabel}`,
          html,
        );

        if (success) {
          sent++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`Failed to send weekly email to ${customer.email}:`, err);
        failed++;
      }
    }
  } catch (err) {
    console.error("Failed to fetch weekly email data:", err);
  }

  console.log(`Weekly emails: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

// ─── Config helpers (used by admin routes & cron scheduler) ──────────────────

export interface WeeklyEmailConfig {
  enabled: boolean;
  sendDayOfWeek: number;
  sendHour: number;
  newProductsDays: number;
  maxNewProducts: number;
  subjectTemplate: string;
  lastSentAt: Date | null;
  lastSentCount: number | null;
}

export async function getWeeklyEmailConfig(): Promise<WeeklyEmailConfig> {
  const result = await db.execute(sql`
    SELECT enabled,
           send_day_of_week  AS "sendDayOfWeek",
           send_hour         AS "sendHour",
           new_products_days AS "newProductsDays",
           max_new_products  AS "maxNewProducts",
           subject_template  AS "subjectTemplate",
           last_sent_at      AS "lastSentAt",
           last_sent_count   AS "lastSentCount"
    FROM weekly_email_config
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    return {
      enabled: false,
      sendDayOfWeek: 2,
      sendHour: 19,
      newProductsDays: 14,
      maxNewProducts: 6,
      subjectTemplate: "Your Weekly 1stRep Update",
      lastSentAt: null,
      lastSentCount: null,
    };
  }

  const row = result.rows[0] as any;
  return {
    enabled: row.enabled,
    sendDayOfWeek: Number(row.sendDayOfWeek),
    sendHour: Number(row.sendHour),
    newProductsDays: Number(row.newProductsDays),
    maxNewProducts: Number(row.maxNewProducts),
    subjectTemplate: row.subjectTemplate,
    lastSentAt: row.lastSentAt ? new Date(row.lastSentAt) : null,
    lastSentCount: row.lastSentCount !== null ? Number(row.lastSentCount) : null,
  };
}

export async function upsertWeeklyEmailConfig(data: {
  enabled: boolean;
  sendDayOfWeek: number;
  sendHour: number;
  newProductsDays: number;
  maxNewProducts: number;
  subjectTemplate: string;
}): Promise<void> {
  await db.execute(sql`
    INSERT INTO weekly_email_config
      (id, enabled, send_day_of_week, send_hour, new_products_days, max_new_products, subject_template, updated_at)
    VALUES
      (1, ${data.enabled}, ${data.sendDayOfWeek}, ${data.sendHour}, ${data.newProductsDays}, ${data.maxNewProducts}, ${data.subjectTemplate}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      enabled           = EXCLUDED.enabled,
      send_day_of_week  = EXCLUDED.send_day_of_week,
      send_hour         = EXCLUDED.send_hour,
      new_products_days = EXCLUDED.new_products_days,
      max_new_products  = EXCLUDED.max_new_products,
      subject_template  = EXCLUDED.subject_template,
      updated_at        = NOW()
  `);
}

/** Alias used by the cron scheduler and the send-now admin route */
export async function sendWeeklyEmail(trigger: "scheduler" | "manual"): Promise<{ sent: number; failed: number }> {
  console.log(`[WeeklyEmail] sendWeeklyEmail called — trigger: ${trigger}`);
  const result = await sendWeeklyEmails();

  if (result.sent > 0 || trigger === "manual") {
    // Record last-sent timestamp
    await db.execute(sql`
      UPDATE weekly_email_config
      SET last_sent_at    = NOW(),
          last_sent_count = ${result.sent}
      WHERE id = 1
    `);
  }

  return result;
}
