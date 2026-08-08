import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ChevronRight, ExternalLink, Menu, X, ArrowUp, FileText, AlertTriangle, Info, BookOpen } from "lucide-react";
import { GUIDE_BY_SLUG, type Block, type GuideData } from "@/data/docsGuideData";

// ─── Atoms ──────────────────────────────────────────────────────────────────
function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 my-4 p-4 rounded-md bg-amber-50 border border-amber-200">
      <Info className="shrink-0 mt-0.5 text-amber-600" size={15} />
      <p className="text-sm text-amber-900 leading-relaxed">{children}</p>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 my-4 p-4 rounded-md bg-red-50 border border-red-200">
      <AlertTriangle className="shrink-0 mt-0.5 text-red-600" size={15} />
      <p className="text-sm text-red-900 leading-relaxed font-medium">{children}</p>
    </div>
  );
}

function Bullet({ label, detail }: { label: string; detail?: string }) {
  return (
    <li className="flex gap-2.5 items-start py-1.5">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
      <span className="text-sm text-gray-700 leading-relaxed">
        {detail ? (
          <><span className="font-semibold text-gray-900">{label}</span>{" — "}<span>{detail}</span></>
        ) : label}
      </span>
    </li>
  );
}

function Numbered({ n, label, detail }: { n: number; label: string; detail?: string }) {
  return (
    <li className="flex gap-3 items-start py-1.5">
      <span className="shrink-0 w-6 h-6 rounded-full bg-gray-900 text-amber-400 text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <span className="text-sm text-gray-700 leading-relaxed">
        {detail ? (
          <><span className="font-semibold text-gray-900">{label}:</span>{" "}<span>{detail}</span></>
        ) : label}
      </span>
    </li>
  );
}

function SubHead({ id, num, title }: { id: string; num: string; title: string }) {
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
                <td key={ci} className="px-4 py-2.5 text-gray-700 align-top leading-snug border-b border-gray-100">
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

function Grid({ items }: { items: string[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2 my-4">
      {items.map(item => (
        <div key={item} className="flex items-start gap-2 p-3 bg-gray-50 rounded-md border border-gray-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
          <span className="text-xs text-gray-700 leading-snug">{item}</span>
        </div>
      ))}
    </div>
  );
}

function renderBlock(b: Block, i: number) {
  switch (b.type) {
    case 'p':
      return <p key={i} className="text-sm text-gray-600 leading-relaxed mb-3">{b.text}</p>;
    case 'note':
      return <Note key={i}>{b.text}</Note>;
    case 'warning':
      return <Warning key={i}>{b.text}</Warning>;
    case 'bullets':
      return (
        <ul key={i} className="space-y-0.5 mb-4">
          {b.items.map((it, j) => <Bullet key={j} label={it.label} detail={it.detail} />)}
        </ul>
      );
    case 'numbered':
      return (
        <ol key={i} className="space-y-1 mb-4">
          {b.items.map((it, j) => <Numbered key={j} n={j + 1} label={it.label} detail={it.detail} />)}
        </ol>
      );
    case 'table':
      return <DataTable key={i} headers={b.headers} rows={b.rows} />;
    case 'grid':
      return <Grid key={i} items={b.items} />;
    case 'sub':
      return <SubHead key={i} id={b.id} num={b.num} title={b.title} />;
    case 'code':
      return <code key={i} className="block bg-gray-100 px-3 py-2 rounded text-xs font-mono my-3">{b.text}</code>;
    default:
      return null;
  }
}

function ChapterCard({ id, num, title, blocks }: { id: string; num: string; title: string; blocks: Block[] }) {
  return (
    <section id={id} className="scroll-mt-20 mb-10">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-gray-100">
        <span className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-900 text-amber-400 font-bold text-sm shrink-0">
          {num}
        </span>
        <h2 className="text-xl font-bold text-gray-900 leading-tight">{title}</h2>
      </div>
      <div>{blocks.map(renderBlock)}</div>
    </section>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AdminDocViewer() {
  const params = useParams<{ slug: string }>();
  const [location] = useLocation();
  const guide: GuideData | undefined = GUIDE_BY_SLUG[params.slug ?? ''];
  const isAdminPath = location.startsWith('/admin');
  const backHref = isAdminPath ? '/admin/documents' : '/reseller-dashboard';
  const backLabel = isAdminPath ? 'Document Library' : 'Back to Dashboard';

  const [activeId, setActiveId] = useState('ch1');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    if (!guide) return;
    const allIds = guide.nav.flatMap(s => [s.id, ...(s.sub?.map(sub => sub.id) ?? [])]);
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
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [guide]);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSidebarOpen(false);
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto mb-4 text-gray-300" size={48} />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Guide not found</h1>
          <p className="text-gray-500 text-sm mb-4">The guide "{params.slug}" does not exist.</p>
          <Link href={backHref}>
            <a className="text-amber-600 text-sm hover:underline">{backLabel}</a>
          </Link>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <nav className="space-y-0.5">
      {guide.nav.map(s => (
        <div key={s.id}>
          <button
            onClick={() => scrollTo(s.id)}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
              ${activeId === s.id ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
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
                    ${activeId === sub.id ? 'text-amber-600 font-semibold bg-amber-50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
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
            <button className="lg:hidden text-gray-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)}>
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
              Doc {guide.docNum} of {guide.docTotal}
            </span>
            <Link href={backHref}>
              <a className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                <FileText size={13} />
                <span className="hidden sm:block">{backLabel}</span>
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
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
            <div className="mb-4 px-1">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">In this guide</p>
              <div className="h-0.5 w-8 bg-amber-400 rounded" />
            </div>
            <SidebarContent />
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0">
          {/* Hero */}
          <div className="bg-gray-900 rounded-xl p-8 mb-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 70% 50%, #C9A84C 0%, transparent 70%)' }} />
            <div className="relative">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-3">
                <FileText size={12} />
                Platform Guide
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3">
                {guide.title}<br />
                <span className="text-amber-400">{guide.titleAccent}</span>
              </h1>
              <p className="text-gray-400 text-sm max-w-lg leading-relaxed">{guide.subtitle}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {guide.chips.map(chip => (
                  <span key={chip} className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full border border-gray-700">{chip}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Chapters */}
          {guide.chapters.map(ch => (
            <ChapterCard key={ch.id} id={ch.id} num={ch.num} title={ch.title} blocks={ch.blocks} />
          ))}

          {/* All Guides grid */}
          <div className="mt-12 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <BookOpen size={14} className="text-amber-500" />
              All Platform Guides
            </h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { slug: 'platform-overview', label: 'Platform Overview & Getting Started' },
                { slug: 'customer-storefront', label: 'Customer Storefront Guide' },
                { slug: 'orders-fulfilment', label: 'Orders & Fulfilment Management' },
                { slug: 'products-inventory', label: 'Products, Inventory & Warehouse Guide' },
                { slug: 'reseller-b2b', label: 'Reseller, B2B Partners & Licence Guide' },
                { slug: 'influencer-programme', label: 'Influencer Programme Complete Guide' },
                { slug: 'crm-marketing', label: 'CRM, Marketing & Customer Support Guide' },
                { slug: 'platform-admin-settings', label: 'Platform Administration & Settings Guide' },
              ].map(g => (
                <Link key={g.slug} href={`/admin/docs/${g.slug}`}>
                  <a className={`flex items-center gap-2 p-3 rounded-md border text-xs transition-colors
                    ${g.slug === guide.slug
                      ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <ExternalLink size={10} className="shrink-0" />
                    {g.label}
                  </a>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-gray-900 font-black text-sm">1ST<span className="text-amber-500">REP</span></span>
              <span className="text-gray-400 text-xs">{guide.title} {guide.titleAccent}</span>
            </div>
            <span className="text-gray-400 text-xs">Qanzak Global · Confidential · March 2026</span>
          </div>
        </main>
      </div>

      {/* Back to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-gray-900 text-amber-400 shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
        >
          <ArrowUp size={16} />
        </button>
      )}
    </div>
  );
}
