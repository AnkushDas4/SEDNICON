import React, { useState } from 'react';
import CodeBlock from '../components/CodeBlock';

const SECTIONS = [
  { id: 'quickstart', label: 'Quick Start' },
  { id: 'render-api', label: 'GET /api/render' },
  { id: 'sprite-api', label: 'GET /api/sprite' },
  { id: 'generate-api', label: 'POST /api/generate' },
  { id: 'status-api', label: 'GET /api/status' },
  { id: 'cli', label: 'CLI Tooling (npx)' },
  { id: 'caching', label: 'Edge Caching & Performance' },
];

export default function Docs() {
  const [activeSection, setActiveSection] = useState('quickstart');

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 font-mono text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <span>Sednicon API Reference & Developer Guide</span>
          </div>
          <h1 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
            Documentation
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Learn how to stream icons via edge HTTP, generate dynamic SVG sprites, use BYOK AI generation, and integrate with your frameworks.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* ── STICKY SIDEBAR NAV ── */}
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-20 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                On this page
              </span>
              <nav className="mt-2 flex flex-col space-y-1 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                {SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollTo(sec.id)}
                    className={`text-left text-xs font-medium transition ${
                      activeSection === sec.id
                        ? 'text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── CONTENT BODY ── */}
          <div className="space-y-16 lg:col-span-9">
            {/* 1. Quick Start */}
            <section id="quickstart" className="space-y-4">
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
            <section id="render-api" className="space-y-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
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
                      <td className="p-3 text-zinc-950 dark:text-zinc-100">set</td>
                      <td className="p-3 text-blue-600">string</td>
                      <td className="p-3">auto</td>
                      <td className="p-3 font-sans">Override icon library (e.g. <code>simple-icons</code>, <code>material-symbols</code>).</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Multi-Tier Resolution Hierarchy
                </h4>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-zinc-600 dark:text-zinc-400">
                  <li><strong>Explicit prefix:</strong> If query contains <code>prefix:name</code>, routes directly to that set in Iconify.</li>
                  <li><strong>Curated cache:</strong> Checks high-frequency internal map for instant hits.</li>
                  <li><strong>Brand match:</strong> Checked against Simple Icons (2,500+ tech and brand marks).</li>
                  <li><strong>UI symbol:</strong> Checked against Google Material Symbols.</li>
                  <li><strong>Universal catalog:</strong> Queries the global 200,000+ Iconify index.</li>
                </ol>
              </div>
            </section>

            {/* 3. GET /api/sprite */}
            <section id="sprite-api" className="space-y-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
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
                code={`<!-- 1. Fetch sprite sheet -->
<svg style="display:none;" src="https://sednicon.sednium.com/api/sprite?icons=github,twitter,linkedin&size=24&color=000000"></svg>

<!-- 2. Reference any symbol by ID -->
<svg class="icon"><use href="#github"></use></svg>
<svg class="icon"><use href="#twitter"></use></svg>`}
                language="html"
              />
            </section>

            {/* 4. POST /api/generate */}
            <section id="generate-api" className="space-y-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
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
            <section id="status-api" className="space-y-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
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
  "version": "3.0.0",
  "region": "edge",
  "dependencies": {
    "iconify": "operational"
  },
  "upstream_check_ms": 38,
  "timestamp": 1740000000000
}`}
                language="json"
              />
            </section>

            {/* 6. CLI Tooling */}
            <section id="cli" className="space-y-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
              <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Command-Line Interface (npx sednicon)
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Fetch icons directly into your repository or terminal without creating npm configuration files.
              </p>

              <CodeBlock
                code={`# Download SVG directly to assets/
npx sednicon get sparkles --output ./src/assets/sparkles.svg

# Specify size and custom color
npx sednicon get github --size 48 --color 2563eb

# Output as a React JSX component
npx sednicon get terminal --format react > TerminalIcon.jsx`}
                language="bash"
              />
            </section>

            {/* 7. Edge Caching & Performance */}
            <section id="caching" className="space-y-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
              <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Edge Caching & Performance
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Sednicon uses Vercel Edge Network routing and sets aggressive browser and CDN cache control headers:
              </p>
              <CodeBlock
                code={`Cache-Control: public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400`}
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
