import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ChevronRight, ExternalLink, Menu, X, ArrowUp, FileText, AlertTriangle, Info } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────
interface Section {
  id: string;
  num: string;
  title: string;
  sub?: { id: string; num: string; title: string }[];
}

// ─── All sidebar sections ───────────────────────────────────────────────
const SECTIONS: Section[] = [
  {
    id: "ch1", num: "1", title: "Admin Dashboard Overview",
    sub: [{ id: "ch1-sidebar", num: "1.1", title: "Sidebar Section Reference" }],
  },
  {
    id: "ch2", num: "2", title: "Site Settings & Appearance",
    sub: [
      { id: "ch2-general", num: "2.1", title: "General Settings" },
      { id: "ch2-banner", num: "2.2", title: "Announcement Banner" },
      { id: "ch2-theme", num: "2.3", title: "Theme" },
      { id: "ch2-email-tpl", num: "2.4", title: "Email Templates" },
    ],
  },
  {
    id: "ch3", num: "3", title: "Hero Images & Videos",
    sub: [
      { id: "ch3-images", num: "3.1", title: "Hero Images" },
      { id: "ch3-videos", num: "3.2", title: "Hero Videos" },
    ],
  },
  {
    id: "ch4", num: "4", title: "Team Management",
    sub: [{ id: "ch4-roles", num: "4.1", title: "Role Reference Table" }],
  },
  {
    id: "ch5", num: "5", title: "Document Library",
    sub: [
      { id: "ch5-upload", num: "5.1", title: "Uploading a Document" },
      { id: "ch5-download", num: "5.2", title: "Downloading" },
      { id: "ch5-delete", num: "5.3", title: "Deleting" },
    ],
  },
  {
    id: "ch6", num: "6", title: "Community Events",
  },
  {
    id: "ch7", num: "7", title: "Reports & Business Intelligence",
    sub: [
      { id: "ch7-sales", num: "7.1", title: "Sales Reports" },
      { id: "ch7-product", num: "7.2", title: "Product Reports" },
      { id: "ch7-customer", num: "7.3", title: "Customer Reports" },
      { id: "ch7-influencer", num: "7.4", title: "Influencer Reports" },
      { id: "ch7-b2b", num: "7.5", title: "B2B / Reseller Reports" },
    ],
  },
  {
    id: "ch8", num: "8", title: "Loyalty Programme Config",
  },
  {
    id: "ch9", num: "9", title: "Vendor Portal",
  },
  {
    id: "ch10", num: "10", title: "Security & Maintenance",
    sub: [
      { id: "ch10-session", num: "10.1", title: "Session & Auth" },
      { id: "ch10-env", num: "10.2", title: "Environment Variables" },
      { id: "ch10-backup", num: "10.3", title: "Database Backups" },
      { id: "ch10-maint", num: "10.4", title: "Maintenance Mode" },
    ],
  },
];

// ─── Small shared atoms ─────────────────────────────────────────────────
function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 my-4 p-4 rounded-md bg-amber-50 border border-amber-200">
      <Info className="shrink-0 mt-0.5 text-amber-600" size={16} />
      <p className="text-sm text-amber-900 leading-relaxed">{children}</p>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 my-4 p-4 rounded-md bg-red-50 border border-red-200">
      <AlertTriangle className="shrink-0 mt-0.5 text-red-600" size={16} />
      <p className="text-sm text-red-900 leading-relaxed font-medium">{children}</p>
    </div>
  );
}

function BulletItem({ label, detail }: { label: string; detail?: string }) {
  return (
    <li className="flex gap-2 items-start py-1">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
      {detail ? (
        <span className="text-sm text-gray-700 leading-relaxed">
          <span className="font-semibold text-gray-900">{label}</span>
          {" — "}
          <span>{detail}</span>
        </span>
      ) : (
        <span className="text-sm text-gray-700 leading-relaxed">{label}</span>
      )}
    </li>
  );
}

function NumberedItem({ n, label, detail }: { n: number; label: string; detail?: string }) {
  return (
    <li className="flex gap-3 items-start py-1.5">
      <span className="shrink-0 w-6 h-6 rounded-full bg-gray-900 text-amber-400 text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <span className="text-sm text-gray-700 leading-relaxed">
        {detail ? (
          <>
            <span className="font-semibold text-gray-900">{label}:</span>{" "}
            <span>{detail}</span>
          </>
        ) : (
          label
        )}
      </span>
    </li>
  );
}

function SubSection({ id, num, title }: { id: string; num: string; title: string }) {
  return (
    <h3 id={id} className="flex items-center gap-2 text-base font-bold text-gray-900 mt-8 mb-3 scroll-mt-24">
      <span className="text-amber-500 font-mono text-sm">{num}</span>
      {title}
    </h3>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4 rounded-md border border-gray-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-900">
            {headers.map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-amber-400 font-semibold text-xs uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-gray-700 align-top leading-snug border-b border-gray-100 last:border-b-0">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChapterCard({ id, num, title, children }: { id: string; num: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 mb-10">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-gray-100">
        <span className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-900 text-amber-400 font-bold text-sm shrink-0">
          {num}
        </span>
        <h2 className="text-xl font-bold text-gray-900 leading-tight">{title}</h2>
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────
export default function AdminGuideSettings() {
  const [activeId, setActiveId] = useState("ch1");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll spy
  useEffect(() => {
    const allIds = SECTIONS.flatMap(s => [s.id, ...(s.sub?.map(sub => sub.id) ?? [])]);
    const onScroll = () => {
      setShowTop(window.scrollY > 400);
      for (let i = allIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(allIds[i]);
        if (el && el.getBoundingClientRect().top <= 100) {
          setActiveId(allIds[i]);
          return;
        }
      }
      setActiveId(allIds[0]);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setSidebarOpen(false);
  }

  const isActive = (id: string) => activeId === id;

  // ─── Sidebar ────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <nav className="space-y-0.5">
      {SECTIONS.map(s => (
        <div key={s.id}>
          <button
            onClick={() => scrollTo(s.id)}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
              ${isActive(s.id) ? "bg-amber-50 text-amber-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            <span className="shrink-0 text-xs font-mono text-amber-500 w-6">{s.num}.</span>
            <span className="leading-snug">{s.title}</span>
          </button>
          {s.sub && (
            <div className="ml-5 space-y-0.5 mt-0.5">
              {s.sub.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => scrollTo(sub.id)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors
                    ${isActive(sub.id) ? "text-amber-600 font-semibold bg-amber-50" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
                >
                  <ChevronRight size={10} className="shrink-0 text-gray-300" />
                  <span className="font-mono text-[10px] text-amber-400 shrink-0">{sub.num}</span>
                  <span className="leading-snug">{sub.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800 shadow-md">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-lg tracking-tight">1ST</span>
              <span className="text-amber-400 font-black text-lg tracking-tight">REP</span>
              <span className="hidden sm:block text-gray-500 text-sm ml-2">/ Platform Docs</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">
              Doc 8 of 8 — Administration & Settings
            </span>
            <Link href="/admin/documents">
              <a className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                <FileText size={13} />
                <span className="hidden sm:block">Document Library</span>
              </a>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-14 bottom-0 w-72 bg-white shadow-xl overflow-y-auto p-4">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3 px-1">Contents</p>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 flex gap-8">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 scrollbar-thin">
            <div className="mb-4 px-1">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">In this guide</p>
              <div className="h-0.5 w-8 bg-amber-400 rounded" />
            </div>
            <SidebarContent />
          </div>
        </aside>

        {/* ── Main content ── */}
        <main ref={contentRef} className="flex-1 min-w-0">
          {/* Hero banner */}
          <div className="bg-gray-900 rounded-xl p-8 mb-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ background: "radial-gradient(circle at 70% 50%, #C9A84C 0%, transparent 70%)" }} />
            <div className="relative">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-3">
                <FileText size={12} />
                Platform Administration Guide
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3">
                Administration &<br />
                <span className="text-amber-400">Settings</span> Guide
              </h1>
              <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
                System-wide configuration, team management, homepage content, reports, and
                platform settings for the 1stRep platform. For Qanzak Global internal use.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {["10 Chapters", "Admin Role Required", "Last Updated Mar 2026"].map(tag => (
                  <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full border border-gray-700">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ─────────────────── CHAPTER 1 ─────────────────── */}
          <ChapterCard id="ch1" num="1" title="Admin Dashboard Overview">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              The Admin Dashboard at <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">/admin</code> is
              the control centre for the entire 1stRep platform. It is accessible only to users with
              the <strong>admin</strong> role. The dashboard is divided into sections accessible via the
              collapsible left sidebar.
            </p>

            <SubSection id="ch1-sidebar" num="1.1" title="Sidebar Section Reference" />
            <DataTable
              headers={["Sidebar Section", "What It Covers"]}
              rows={[
                ["Overview", "Key platform KPIs at a glance"],
                ["Orders", "All customer, EPOS, and wholesale orders"],
                ["Reports", "Revenue, performance, and analytics reports"],
                ["B2B Partners", "Reseller management"],
                ["B2B Access", "Reseller capability permissions"],
                ["Licence Requests", "Reseller programme applications"],
                ["Wholesale Orders", "Bulk purchase orders from resellers"],
                ["Commission Payouts", "Earning payouts for reseller partners"],
                ["Partner Analytics", "Performance data per B2B partner"],
                ["Products", "Product catalogue management"],
                ["Categories", "Product category structure"],
                ["Product Sections", "Homepage curated sections"],
                ["Activity Types", "Sport/activity tags for products"],
                ["Coupons", "Discount codes for promotions"],
                ["Inventory", "Stock levels across warehouses"],
                ["Warehouses", "Warehouse location management"],
                ["Store Locations", "Public-facing store locator entries"],
                ["Add Inventory", "Record new stock arrivals"],
                ["Image Manager", "Product image library"],
                ["Customers (CRM)", "Customer profiles and history"],
                ["Marketing", "Email campaigns and templates"],
                ["Support Tickets", "Customer support queue"],
                ["Return Requests", "Return and refund management"],
                ["Reviews", "Product review moderation"],
                ["Chatbot", "AI chatbot knowledge base"],
                ["Popup Messages", "Website popup management"],
                ["Influencer Applications", "New influencer programme applications"],
                ["Manage Influencers", "Active influencer profiles"],
                ["Influencer Content", "Submitted social post log"],
                ["Influencer Credits", "Credit balances and redemptions"],
                ["Community Events", "Events shown on the website"],
                ["Team", "Internal team member management"],
                ["Document Library", "Team document repository"],
                ["Settings", "Platform-wide configuration"],
              ]}
            />
          </ChapterCard>

          {/* ─────────────────── CHAPTER 2 ─────────────────── */}
          <ChapterCard id="ch2" num="2" title="Site Settings & Appearance">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Admin &gt; Settings provides global configuration for the platform. Key areas:
            </p>

            <SubSection id="ch2-general" num="2.1" title="General Settings" />
            <ul className="space-y-0.5 mb-4">
              <BulletItem label="Site name" detail="displayed in browser tab titles and emails" />
              <BulletItem label="Contact email" detail="the from-address for all system emails" />
              <BulletItem label="Default currency" detail="currently GBP (£) — do not change without developer involvement" />
              <BulletItem label="Free shipping threshold" detail="orders above this value automatically qualify for free shipping" />
            </ul>

            <SubSection id="ch2-banner" num="2.2" title="Announcement Banner" />
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              Toggle the top-of-page announcement banner on/off. Set the banner message, background
              colour, and text colour. Changes take effect immediately for all visitors. Common uses:
            </p>
            <ul className="space-y-0.5 mb-4">
              <BulletItem label={'Free delivery threshold — e.g. "Free UK delivery on orders over \u00a350"'} />
              <BulletItem label={'Sale notification — e.g. "Summer Sale now on \u2014 up to 30% off"'} />
              <BulletItem label={'Operational notice — e.g. "Dispatch times may be extended 20\u201327 Dec"'} />
            </ul>

            <SubSection id="ch2-theme" num="2.3" title="Theme" />
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              The platform uses the <strong>clean_minimal</strong> theme. Do not change the theme
              setting without developer review, as it affects the entire visual design system.
            </p>

            <SubSection id="ch2-email-tpl" num="2.4" title="Email Templates" />
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              Customise the content of each automated email. Click an email type, edit the subject
              line and body, and save. All emails use the 1stRep branded wrapper — only the body
              content is editable here. Editable templates include:
            </p>
            <ul className="space-y-0.5">
              <BulletItem label="Order confirmation" detail="sent automatically on every successful order" />
              <BulletItem label="Shipping notification" detail="sent when an order is marked as Shipped" />
              <BulletItem label="Welcome email" detail="sent when a new customer registers" />
              <BulletItem label="Influencer welcome" detail="sent when an influencer is approved" />
              <BulletItem label="Return approved/rejected" detail="sent on return request decision" />
              <BulletItem label="Password reset" detail="sent when a customer requests a password reset" />
            </ul>
          </ChapterCard>

          {/* ─────────────────── CHAPTER 3 ─────────────────── */}
          <ChapterCard id="ch3" num="3" title="Hero Images & Videos">
            <SubSection id="ch3-images" num="3.1" title="Hero Images" />
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              The homepage hero section displays full-width image slides. Manage them in Admin &gt; Hero Images:
            </p>
            <ol className="space-y-1 mb-4">
              <NumberedItem n={1} label='Click "Add Hero Image" to upload a new image' />
              <NumberedItem n={2} label="Enter a title and optional subtitle that appears over the image" />
              <NumberedItem n={3} label="Add a call-to-action button text and URL" />
              <NumberedItem n={4} label="Set the display order using drag-and-drop reordering" />
              <NumberedItem n={5} label="Toggle individual images active or inactive" />
            </ol>
            <Note>
              Hero images should be high-resolution and landscape-oriented (minimum 1920×1080px).
              Avoid text-heavy images as the overlay text may conflict. A dark gradient overlay is
              applied automatically for readability.
            </Note>

            <SubSection id="ch3-videos" num="3.2" title="Hero Videos" />
            <p className="text-sm text-gray-600 leading-relaxed">
              The homepage can also feature autoplay background videos. Manage in Admin &gt; Hero Videos.
              Videos should be in MP4 format and ideally compressed for web (under 20MB). Like
              images, videos can be reordered and toggled on/off.
            </p>
          </ChapterCard>

          {/* ─────────────────── CHAPTER 4 ─────────────────── */}
          <ChapterCard id="ch4" num="4" title="Team Management">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Admin &gt; Team manages internal team member accounts. Team members can have roles that
              grant different levels of access:
            </p>

            <SubSection id="ch4-roles" num="4.1" title="Role Reference Table" />
            <DataTable
              headers={["Role", "Access"]}
              rows={[
                ["admin", "Full access to all admin sections"],
                ["staff", "Limited access — can view orders and customers but cannot change settings"],
                ["vendor", "Access to vendor portal only"],
                ["reseller", "Access to EPOS terminal and reseller dashboard only"],
                ["influencer", "Access to influencer dashboard only"],
                ["customer", "Access to customer storefront and account only"],
              ]}
            />
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              To add a new team member: ask them to register on the platform as a regular customer
              first, then update their role in Admin &gt; Team by finding their account and changing
              the role dropdown.
            </p>
            <Warning>
              Role changes take effect immediately. Assigning the "admin" role gives full unrestricted
              access to the entire platform. Only assign this role to trusted senior team members.
            </Warning>
          </ChapterCard>

          {/* ─────────────────── CHAPTER 5 ─────────────────── */}
          <ChapterCard id="ch5" num="5" title="Document Library (Admin)">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Admin &gt; Document Library (<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">/admin/documents</code>) is
              a shared repository of internal documents — guides, policies, training materials, SOPs,
              and reference files. All logged-in staff members can view and download documents.
              Only admins can upload or delete them.
            </p>

            <SubSection id="ch5-upload" num="5.1" title="Uploading a Document" />
            <ol className="space-y-1 mb-4">
              <NumberedItem n={1} label="Navigate to /admin/documents and click Upload Document" />
              <NumberedItem n={2} label="Enter a document title and optional description" />
              <NumberedItem n={3} label="Select a category" detail="General, Training, Influencer, Reseller, Legal, etc." />
              <NumberedItem n={4} label="Select the file (PDF, DOCX, XLSX, or other supported formats)" />
              <NumberedItem n={5} label="Click Upload — the document appears in the library immediately" />
            </ol>

            <SubSection id="ch5-download" num="5.2" title="Downloading a Document" />
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Click <strong>Download</strong> on any document in the library. The file is retrieved
              from object storage and downloaded to your device. Documents are served with the original filename.
            </p>

            <SubSection id="ch5-delete" num="5.3" title="Deleting a Document" />
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              Click <strong>Delete</strong> on a document and confirm. This removes the file from
              both object storage and the database.
            </p>
            <Warning>
              Deleted documents cannot be recovered — ensure you have a backup copy before deleting.
            </Warning>
          </ChapterCard>

          {/* ─────────────────── CHAPTER 6 ─────────────────── */}
          <ChapterCard id="ch6" num="6" title="Community Events">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Admin &gt; Community Events manages events displayed on the website's Events page. Each event has:
            </p>
            <ul className="space-y-0.5 mb-4">
              <BulletItem label="Title and description" />
              <BulletItem label="Date and time" />
              <BulletItem label="Location" detail="venue name and full address" />
              <BulletItem label="Event type" detail="e.g. Competition, Community Workout, Brand Collaboration" />
              <BulletItem label="Optional event image" />
              <BulletItem label="RSVP / Ticket link" detail="optional URL for external booking" />
              <BulletItem label="Active toggle" detail="hide an event from the website without deleting it" />
            </ul>
            <Note>
              Create events well in advance to give customers time to plan. Past events are automatically
              removed from the public events page but remain in the admin view for records.
            </Note>
          </ChapterCard>

          {/* ─────────────────── CHAPTER 7 ─────────────────── */}
          <ChapterCard id="ch7" num="7" title="Reports & Business Intelligence">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Admin &gt; Reports (<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">/admin/reports</code>) is
              the primary reporting tool. Data can be filtered by date range. Reports are generated in
              real time from the live database — there is no caching delay.
            </p>

            <SubSection id="ch7-sales" num="7.1" title="Sales Reports" />
            <div className="grid sm:grid-cols-2 gap-2 mb-4">
              {["Total revenue by date range", "Orders by channel (online, EPOS, wholesale)", "Average order value over time", "Revenue by product category", "Refund and cancellation rate"].map(item => (
                <div key={item} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-md border border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span className="text-xs text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            <SubSection id="ch7-product" num="7.2" title="Product Reports" />
            <div className="grid sm:grid-cols-2 gap-2 mb-4">
              {["Best-selling products by unit and revenue", "Slow-moving stock report", "Product performance over time", "Variant-level analysis (which sizes and colours sell most)"].map(item => (
                <div key={item} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-md border border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span className="text-xs text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            <SubSection id="ch7-customer" num="7.3" title="Customer Reports" />
            <div className="grid sm:grid-cols-2 gap-2 mb-4">
              {["New vs returning customer split", "Customer lifetime value distribution", "Loyalty programme engagement rates", "Geographic breakdown of orders"].map(item => (
                <div key={item} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-md border border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span className="text-xs text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            <SubSection id="ch7-influencer" num="7.4" title="Influencer Programme Reports" />
            <div className="grid sm:grid-cols-2 gap-2 mb-4">
              {["Revenue attributable to influencer codes", "Tracking link clicks per influencer", "Content submissions over time", "Credits awarded vs credits redeemed"].map(item => (
                <div key={item} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-md border border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span className="text-xs text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            <SubSection id="ch7-b2b" num="7.5" title="B2B / Reseller Reports" />
            <div className="grid sm:grid-cols-2 gap-2">
              {["Revenue by reseller partner", "Commission earned vs paid", "EPOS transaction volume by location", "Wholesale order fulfilment times"].map(item => (
                <div key={item} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-md border border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span className="text-xs text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </ChapterCard>

          {/* ─────────────────── CHAPTER 8 ─────────────────── */}
          <ChapterCard id="ch8" num="8" title="Loyalty Programme Configuration">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              The loyalty programme is configured in Admin &gt; Settings &gt; Loyalty (or Admin &gt; Loyalty
              Rewards). Key settings:
            </p>
            <ul className="space-y-0.5 mb-4">
              <BulletItem label="Points per £ spent" detail="how many loyalty points are earned per pound of purchase" />
              <BulletItem label="Points value" detail="what each loyalty point is worth when redeemed (e.g. 1 point = £0.01)" />
              <BulletItem label="Tier thresholds" detail="cumulative points needed to reach each tier" />
              <BulletItem label="Tier rewards" detail="what each tier unlocks (e.g. Gold tier gets 2× points on every purchase)" />
              <BulletItem label="Expiry policy" detail="whether points expire after a period of inactivity" />
            </ul>
            <DataTable
              headers={["Tier", "Points Threshold", "Benefits"]}
              rows={[
                ["Bronze", "0 points", "Entry level — base earn rate"],
                ["Silver", "500 points", "1.25× earn multiplier"],
                ["Gold", "1,500 points", "1.5× earn multiplier + early access to sales"],
                ["Platinum", "5,000 points", "2× earn multiplier + exclusive rewards"],
              ]}
            />
            <p className="text-sm text-gray-600 leading-relaxed">
              Rewards can be configured individually — for example, a free product at 1,000 points,
              or a 10% discount voucher at 500 points. Manage individual rewards in Admin &gt; Loyalty Rewards.
            </p>
          </ChapterCard>

          {/* ─────────────────── CHAPTER 9 ─────────────────── */}
          <ChapterCard id="ch9" num="9" title="Vendor Portal">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              The Vendor Portal at <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">/vendor</code> is
              for brand and product vendors who supply products to 1stRep. Vendors have their own login and can:
            </p>
            <ul className="space-y-0.5 mb-4">
              <BulletItem label="View their products listed on 1stRep" />
              <BulletItem label="Upload and manage product images" />
              <BulletItem label="View sales analytics for their own products" />
              <BulletItem label="Request price changes or product updates" />
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed">
              Admins manage vendor accounts from the backend. A vendor account is a user with
              the <strong>vendor</strong> role. Vendor capabilities can be adjusted per account.
              Vendors cannot access any customer data, orders from other vendors, or admin settings.
            </p>
          </ChapterCard>

          {/* ─────────────────── CHAPTER 10 ─────────────────── */}
          <ChapterCard id="ch10" num="10" title="Platform Security & Maintenance">
            <SubSection id="ch10-session" num="10.1" title="Session & Authentication" />
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              The platform uses server-side sessions stored in PostgreSQL. Sessions expire after a
              configurable timeout period. Passwords are hashed using bcrypt. OAuth (Google login)
              is handled by Passport.js.
            </p>

            <SubSection id="ch10-env" num="10.2" title="Environment Variables" />
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              The following critical environment variables must always be set and must never be
              committed to source control:
            </p>
            <DataTable
              headers={["Variable", "Purpose"]}
              rows={[
                ["DATABASE_URL", "PostgreSQL connection string"],
                ["SESSION_SECRET", "Signs session cookies — must be a long random string"],
                ["STRIPE_SECRET_KEY", "Stripe API secret for payment processing"],
                ["STRIPE_PUBLISHABLE_KEY", "Stripe public key for frontend"],
                ["STRIPE_WEBHOOK_SECRET", "Validates incoming Stripe webhook events"],
                ["SENDGRID_API_KEY", "Sends transactional emails via SendGrid"],
                ["DEFAULT_OBJECT_STORAGE_BUCKET_ID", "Replit object storage bucket for file uploads"],
                ["GOOGLE_CLIENT_ID", "Google OAuth app client ID"],
                ["GOOGLE_CLIENT_SECRET", "Google OAuth app client secret"],
              ]}
            />

            <SubSection id="ch10-backup" num="10.3" title="Database Backups" />
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              The Replit PostgreSQL database is backed up automatically by the platform. However, for
              critical operations (major schema changes, mass data imports), always request a manual
              backup snapshot before proceeding.
            </p>

            <SubSection id="ch10-maint" num="10.4" title="Maintenance Mode" />
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              If the platform needs to be taken offline for maintenance, coordinate with the
              development team (Qanzak Global). There is no built-in maintenance mode toggle —
              taking the server offline requires stopping the workflow in the Replit environment.
            </p>
            <Warning>
              Never take the platform offline during peak trading hours without advance notice to
              the reseller network. Always schedule maintenance for early morning (3–5 AM GMT).
            </Warning>
          </ChapterCard>

          {/* ─── Footer ─── */}
          <div className="mt-12 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-gray-900 font-black text-sm">1ST<span className="text-amber-500">REP</span></span>
              <span className="text-gray-400 text-xs">Platform Administration & Settings Guide</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-xs">Qanzak Global · Confidential · March 2026</span>
              <Link href="/admin/documents">
                <a className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600 transition-colors">
                  <ExternalLink size={11} />
                  All Guides
                </a>
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* ── Back to top ── */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-gray-900 text-amber-400 shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
        >
          <ArrowUp size={16} />
        </button>
      )}
    </div>
  );
}
