import React, { useEffect, useState } from 'react';
import CodeBlock from '../components/CodeBlock';

const SECTIONS = [
  { id: 'quickstart', label: 'Quick Start' },
  { id: 'render-api', label: 'GET /api/render' },
  { id: 'sprite-api', label: 'GET /api/sprite' },
  { id: 'generate-api', label: 'POST /api/generate' },
  { id: 'status-api', label: 'GET /api/status' },
  { id: 'providers-health', label: 'GET /api/health/providers' },
  { id: 'cli', label: 'CLI Tooling (npx)' },
  { id: 'caching', label: 'Edge Caching & Performance' },
];

export default function Docs() {
  const [activeSection, setActiveSection] = useState('quickstart');

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (current) setActiveSection(current.target.id);
    }, { rootMargin: '-96px 0px -68% 0px' });
    SECTIONS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="hero-paper docs-hero relative isolate overflow-hidden rounded-[1.75rem] border border-blue-100 p-5 shadow-[0_20px_60px_-40px_rgba(30,64,175,.35)] sm:p-8 lg:p-10">
          <div className="hero-contour pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
          <div className="relative grid items-end gap-8 lg:grid-cols-[1fr_330px]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-blue-800 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                Developer guide · v3.5
              </div>
              <h1 className="display-type mt-5 text-4xl font-bold leading-[.98] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Less setup.<br /><span className="hero-blue-ink">More making.</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                The practical guide to serving icons, building sprites, generating vectors, and shipping with the Sednicon CLI.
              </p>
            </div>
            <div className="relative rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-[0_14px_40px_-24px_rgba(30,64,175,.32)] backdrop-blur sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-800">Your first icon</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 font-mono text-[10px] font-semibold text-emerald-700">GET · SVG</span>
              </div>
              <code className="mt-3 block break-all rounded-xl bg-[#f2f7ff] p-3 font-mono text-[11px] leading-5 text-blue-900">/api/render?q=heart&amp;color=2563eb&amp;size=24</code>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m13 2-3 8H4l7 12 3-8h6L13 2Z" /></svg>
                One URL. Recolored at the edge.
              </div>
            </div>
          </div>
          <div className="relative mt-7 flex flex-wrap gap-2 border-t border-blue-100 pt-4">
            {['URL-first delivery', 'Multi-set fallback', 'BYOK vector generation'].map((item) => (
              <span key={item} className="rounded-full border border-blue-100 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-blue-900">{item}</span>
            ))}
          </div>
        </header>

        <nav aria-label="Documentation sections" className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollTo(sec.id)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                activeSection === sec.id
                  ? 'border-blue-700 bg-blue-700 text-white shadow-sm'
                  : 'border-blue-100 bg-white/90 text-slate-600 hover:border-blue-300 hover:text-blue-800'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </nav>

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* ── STICKY SIDEBAR NAV ── */}
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24 rounded-2xl border border-blue-100 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85">
              <span className="px-2 text-[10px] font-bold uppercase tracking-[.18em] text-blue-700 dark:text-blue-300">
                In this guide
              </span>
              <nav className="mt-3 flex flex-col gap-1">
                {SECTIONS.map((sec, index) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollTo(sec.id)}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs transition ${
                      activeSection === sec.id
                        ? 'bg-blue-50 font-semibold text-blue-900 dark:bg-blue-950/60 dark:text-blue-100'
                        : 'text-slate-600 hover:bg-blue-50/70 hover:text-blue-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[9px] ${activeSection === sec.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {sec.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── CONTENT BODY ── */}
          <div className="space-y-5 lg:col-span-9">
            {/* 1. Quick Start */}
            <section id="quickstart" className="doc-section scroll-mt-28 space-y-5 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-sm shadow-blue-950/[.025] dark:border-zinc-800 dark:bg-zinc-900/90 sm:p-7">
              <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Quick Start
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Sednicon delivers SVGs on demand directly over HTTP. You do not need to install any npm packages or configure icon loaders.
              </p>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Standard HTML
                </h3>
                <CodeBlock
                  code={`<img src="https://sednicon.sednium.com/api/render?q=heart&color=ef4444&size=32" alt="Heart Icon" />`}
                  language="html"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  React / Next.js Component
                </h3>
                <CodeBlock
                  code={`export function Icon({ name, color = '000000', size = 24 }) {
  const url = \`https://sednicon.sednium.com/api/render?q=\${encodeURIComponent(name)}&color=\${color}&size=\${size}\`;
  return <img src={url} alt={name} width={size} height={size} loading="lazy" />;
}`}
                  language="jsx"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  CSS Background
                </h3>
                <CodeBlock
                  code={`.btn-cart::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url('https://sednicon.sednium.com/api/render?q=shopping_cart&color=2563eb&size=16');
  background-size: contain;
}`}
                  language="css"
                />
              </div>
            </section>

            {/* 2. GET /api/render */}
            <section id="render-api" className="doc-section scroll-mt-28 space-y-5 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-sm shadow-blue-950/[.025] dark:border-zinc-800 dark:bg-zinc-900/90 sm:p-7">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  GET
                </span>
                <h2 className="font-mono text-lg font-bold text-zinc-950 dark:text-zinc-50">
                  /api/render
                </h2>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Primary icon microservice endpoint. Resolves, recolors, transforms, and caches SVG icons on edge nodes.
              </p>

              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 font-mono text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    <tr>
                      <th className="p-3">Parameter</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Default</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono text-zinc-600 dark:divide-zinc-800 dark:text-zinc-400">
                    <tr>
                      <td className="p-3 text-zinc-950 dark:text-zinc-100">q</td>
                      <td className="p-3 text-blue-600">string</td>
                      <td className="p-3 text-zinc-400">—</td>
                      <td className="p-3 font-sans">Icon name or query string (e.g. <code>github</code>, <code>heart</code>, <code>mdi:alarm</code>).</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-zinc-950 dark:text-zinc-100">color</td>
                      <td className="p-3 text-blue-600">string</td>
                      <td className="p-3">black</td>
                      <td className="p-3 font-sans">Hex color (with or without leading <code>#</code>) or CSS color name.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-zinc-950 dark:text-zinc-100">size</td>
                      <td className="p-3 text-blue-600">number</td>
                      <td className="p-3">24</td>
                      <td className="p-3 font-sans">Pixel dimension for width and height (clamped between 1 and 2048).</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-zinc-950 dark:text-zinc-100">anim</td>
                      <td className="p-3 text-blue-600">string</td>
                      <td className="p-3">none</td>
                      <td className="p-3 font-sans">Built-in SVG keyframe animation: <code>spin</code>, <code>pulse</code>, or <code>bounce</code>.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-zinc-950 dark:text-zinc-100">style</td>
                      <td className="p-3 text-blue-600">string</td>
                      <td className="p-3">—</td>
                      <td className="p-3 font-sans">Style variant: <code>outline</code>, <code>filled</code>, <code>solid</code>, <code>regular</code>, <code>duotone</code>, <code>color</code>, <code>black</code>, <code>original</code>, <code>plain</code>, <code>light</code>, <code>dark</code>.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-zinc-950 dark:text-zinc-100">set</td>
                      <td className="p-3 text-blue-600">string</td>
                      <td className="p-3">auto</td>
                      <td className="p-3 font-sans">Override icon library (e.g. <code>lucide</code>, <code>tabler</code>, <code>devicon</code>, <code>svgl</code>, <code>crypto</code>).</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Resilient Multi-Provider Resolution Architecture
                </h4>
                <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs text-zinc-600 dark:text-zinc-400">
                  <li><strong>Tier 1 (Edge Cache):</strong> High-speed L1 in-memory LRU cache + non-blocking distributed L2 Upstash Redis.</li>
                  <li><strong>Tier 2 (Direct npm CDNs):</strong> Instant resolution from pinned packages (Lucide, Simple Icons, Tabler, Heroicons, Phosphor, Bootstrap, Feather, Octicons).</li>
                  <li><strong>Tier 3 (Universal extractors & mirrors):</strong> unpkg fallback, package-based Iconify JSON resolution, and a three-host Iconify API failover cluster.</li>
                  <li><strong>Tier 4 (Specialized Repos):</strong> Devicon (tech stacks), SVGL (modern branded vectors with dark/light modes), and Cryptocurrency Icons.</li>
                </ol>
              </div>
            </section>

            {/* 3. GET /api/sprite */}
            <section id="sprite-api" className="doc-section scroll-mt-28 space-y-5 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-sm shadow-blue-950/[.025] dark:border-zinc-800 dark:bg-zinc-900/90 sm:p-7">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  GET
                </span>
                <h2 className="font-mono text-lg font-bold text-zinc-950 dark:text-zinc-50">
                  /api/sprite
                </h2>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Combines multiple icons into a single SVG sprite sheet containing <code>&lt;symbol&gt;</code> elements, perfect for single-HTTP-request asset bundling.
              </p>

              <CodeBlock
                code={`<!-- The endpoint returns one SVG containing symbols for the requested icons. -->
<svg class="icon"><use href="https://sednicon.sednium.com/api/sprite?icons=github,twitter,linkedin&size=24&color=000000#github"></use></svg>
<svg class="icon"><use href="https://sednicon.sednium.com/api/sprite?icons=github,twitter,linkedin&size=24&color=000000#twitter"></use></svg>`}
                language="html"
              />
            </section>

            {/* 4. POST /api/generate */}
            <section id="generate-api" className="doc-section scroll-mt-28 space-y-5 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-sm shadow-blue-950/[.025] dark:border-zinc-800 dark:bg-zinc-900/90 sm:p-7">
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  POST
                </span>
                <h2 className="font-mono text-lg font-bold text-zinc-950 dark:text-zinc-50">
                  /api/generate
                </h2>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Generates clean vector SVG icons from natural language prompts using BYOK (Bring Your Own Key) LLM providers.
              </p>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Request Payload (JSON)
                </h3>
                <CodeBlock
                  code={`{
  "prompt": "a minimalist origami crane",
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "apiKey": "AIzaSy...",
  "size": 24,
  "color": "2563eb",
  "style": "fill",
  "strokeWidth": 2,
  "corner": "round"
}`}
                  language="json"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Response (JSON)
                </h3>
                <CodeBlock
                  code={`{
  "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 24 24\\">...</svg>",
  "provider": "gemini",
  "model": "gemini-2.5-flash"
}`}
                  language="json"
                />
              </div>
            </section>

            {/* 5. GET /api/status */}
            <section id="status-api" className="doc-section scroll-mt-28 space-y-5 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-sm shadow-blue-950/[.025] dark:border-zinc-800 dark:bg-zinc-900/90 sm:p-7">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  GET
                </span>
                <h2 className="font-mono text-lg font-bold text-zinc-950 dark:text-zinc-50">
                  /api/status
                </h2>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Telemetry endpoint reporting upstream health, cache performance, and edge latency.
              </p>
              <CodeBlock
                code={`{
  "status": "operational",
  "version": "3.5.0",
  "region": "edge",
  "dependencies": {
    "jsdelivr_npm": "operational",
    "iconify-json": "operational"
  },
  "cache": {
    "l1Items": 42,
    "l2Status": "connected"
  },
  "upstream_check_ms": 38,
  "timestamp": "2026-11-08T00:27:00.000Z"
}`}
                language="json"
              />
            </section>

            {/* 5.1 GET /api/health/providers */}
            <section id="providers-health" className="doc-section scroll-mt-28 space-y-5 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-sm shadow-blue-950/[.025] dark:border-zinc-800 dark:bg-zinc-900/90 sm:p-7">
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  GET
                </span>
                <h2 className="font-mono text-lg font-bold text-zinc-950 dark:text-zinc-50">
                  /api/health/providers
                </h2>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Live provider telemetry exposing circuit breaker states, rolling latency averages, and success rates without exposing sensitive credentials.
              </p>
              <CodeBlock
                code={`{
  "status": "operational",
  "timestamp": "2026-11-08T00:27:00.000Z",
  "providers": [
    {
      "id": "jsdelivr-npm",
      "health": "operational",
      "circuitState": "CLOSED",
      "avgLatencyMs": 35.2,
      "successRate": 1.0,
      "totalRequests": 184
    },
    {
      "id": "iconify-json",
      "health": "operational",
      "circuitState": "CLOSED",
      "avgLatencyMs": 48.0,
      "successRate": 1.0,
      "totalRequests": 92
    }
  ],
  "cache": {
    "l1Items": 42,
    "l2Status": "connected"
  }
}`}
                language="json"
              />
            </section>

            {/* 6. CLI Tooling */}
            <section id="cli" className="doc-section scroll-mt-28 space-y-5 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-sm shadow-blue-950/[.025] dark:border-zinc-800 dark:bg-zinc-900/90 sm:p-7">
              <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Command-Line Interface (npx sednicon)
              </h2>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Pull an optimized SVG into your project without installing a runtime dependency. The CLI downloads the rendered asset and writes it where you need it.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { title: 'No install step', detail: 'Run it on demand with npx.' },
                  { title: 'Any icon set', detail: 'Use names like lucide:rocket.' },
                  { title: 'Project-ready', detail: 'Choose the output path and size.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-blue-100 bg-[#f6f9ff] p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{item.detail}</p>
                  </div>
                ))}
              </div>

              <CodeBlock
                code={`# Save a vector into your source tree\nnpx sednicon get sparkles --out ./src/assets/sparkles.svg\n\n# Download a specific set at a custom size and color\nnpx sednicon get lucide:rocket --size 48 --color 2563eb --out ./src/assets/rocket.svg\n\n# Generate a ready-to-import React component\nnpx sednicon get terminal --format react --out ./src/icons/TerminalIcon.jsx`}
                language="bash"
              />
              <CodeBlock
                code={`# See all commands and supported formats\nnpx sednicon help`}
                language="bash"
              />
            </section>

            {/* 7. Edge Caching & Performance */}
            <section id="caching" className="doc-section scroll-mt-28 space-y-5 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-sm shadow-blue-950/[.025] dark:border-zinc-800 dark:bg-zinc-900/90 sm:p-7">
              <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Edge Caching & Performance
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Sednicon uses Vercel Edge Network routing and sets aggressive browser and CDN cache control headers:
              </p>
              <CodeBlock
                code={`Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000, immutable`}
                language="text"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Icons are cached on edge servers across 300+ global points of presence (PoPs), guaranteeing typical responses under 50 milliseconds.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
