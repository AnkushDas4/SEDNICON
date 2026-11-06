import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRenderUrl } from '../utils/api';
import CodeBlock from '../components/CodeBlock';
import { useToast } from '../components/Toast';

const PRESET_ICONS = ['github', 'vercel', 'sparkles', 'terminal', 'rocket', 'heart', 'settings'];
const SIZES = [16, 24, 32, 48, 64];
const ANIMATIONS = [
  { id: 'none', label: 'None' },
  { id: 'spin', label: 'Spin' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'bounce', label: 'Bounce' },
];

const PRESET_COLORS = [
  { label: 'Blue', value: '#2563eb' },
  { label: 'Dark', value: '#09090b' },
  { label: 'White', value: '#ffffff' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Amber', value: '#f59e0b' },
];

export default function Home() {
  const { addToast } = useToast();

  // Configurator state
  const [query, setQuery] = useState('sparkles');
  const [color, setColor] = useState('#2563eb');
  const [size, setSize] = useState(48);
  const [anim, setAnim] = useState('none');
  const [exportTab, setExportTab] = useState('url');
  const [loadTime, setLoadTime] = useState(null);
  const [imageError, setImageError] = useState(false);

  const activeUrl = getRenderUrl({
    q: query || 'sparkles',
    color,
    size,
    anim: anim !== 'none' ? anim : null,
  });

  useEffect(() => {
    setImageError(false);
    const start = performance.now();
    const img = new Image();
    img.src = activeUrl;
    img.onload = () => {
      setLoadTime(Math.round(performance.now() - start));
    };
    img.onerror = () => {
      setImageError(true);
      setLoadTime(null);
    };
  }, [activeUrl]);

  // Code snippets generator
  const getSnippet = () => {
    switch (exportTab) {
      case 'url':
        return activeUrl;
      case 'html':
        return `<img src="${activeUrl}" alt="${query}" width="${size}" height="${size}" />`;
      case 'react':
        return `<img\n  src="${activeUrl}"\n  alt="${query}"\n  width={${size}}\n  height={${size}}\n  loading="lazy"\n/>`;
      case 'vue':
        return `<img :src="'${activeUrl}'" alt="${query}" width="${size}" height="${size}" />`;
      case 'css':
        return `.icon-${query} {\n  background-image: url('${activeUrl}');\n  width: ${size}px;\n  height: ${size}px;\n  background-size: contain;\n  background-repeat: no-repeat;\n}`;
      default:
        return activeUrl;
    }
  };

  const copyCli = () => {
    navigator.clipboard.writeText('npx sednicon get sparkles --size 48 --color 2563eb');
    addToast('Copied CLI command to clipboard!', 'success');
  };

  return (
    <div className="flex flex-col">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden border-b border-zinc-200 py-20 transition-colors dark:border-zinc-800 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Value pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-mono text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>One URL. Every Icon. Zero Setup.</span>
            </div>

            <h1 className="mt-6 font-sans text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl dark:text-zinc-50">
              Instant Vector Icons <br />
              <span className="text-blue-600 dark:text-blue-500">via Edge HTTP.</span>
            </h1>

            <p className="mt-6 text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
              Stream clean, recolorable SVGs straight into your HTML, JSX, markdown, or CSS.
              No multi-megabyte bundle dependencies, no icon font bloat, sub-50ms edge caching.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/library"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.98]"
              >
                <span>Explore 200k+ Icons</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              <Link
                to="/generate"
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span>Generate with AI</span>
              </Link>

              <button
                type="button"
                onClick={copyCli}
                className="group flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 font-mono text-xs text-zinc-700 transition hover:border-zinc-300 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700"
              >
                <span className="text-blue-500">$</span>
                <span>npx sednicon</span>
                <span className="rounded bg-zinc-200 px-1 py-0.5 text-[10px] text-zinc-600 transition group-hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400">
                  Copy
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE CONFIGURATOR WORKBENCH ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Interactive URL Workbench
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Customize query parameters and watch the edge HTTP response update live.
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Edge CDN Live</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Controls Column */}
              <div className="border-b border-zinc-200 p-6 dark:border-zinc-800 lg:col-span-5 lg:border-b-0 lg:border-r">
                <div className="space-y-6">
                  {/* Icon Query */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Icon Name or Query
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. github, sparkles, settings..."
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 font-mono text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600"
                      />
                    </div>
                    {/* Presets */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {PRESET_ICONS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setQuery(p)}
                          className={`rounded px-2 py-0.5 font-mono text-xs transition ${
                            query === p
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Controls */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Color Hex
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 shadow-inner dark:border-zinc-700">
                        <input
                          type="color"
                          value={color.startsWith('#') ? color : `#${color}`}
                          onChange={(e) => setColor(e.target.value)}
                          className="absolute -inset-2 h-14 w-14 cursor-pointer"
                        />
                      </div>
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    {/* Color Swatches */}
                    <div className="mt-2 flex items-center gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setColor(c.value)}
                          title={c.label}
                          style={{ backgroundColor: c.value }}
                          className={`h-5 w-5 rounded-full border border-zinc-300 transition-transform active:scale-95 dark:border-zinc-700 ${
                            color === c.value ? 'scale-110 ring-2 ring-blue-500' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Size & Animation */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Size (px)
                      </label>
                      <div className="mt-2 flex gap-1">
                        {SIZES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSize(s)}
                            className={`flex-1 rounded py-1 font-mono text-xs font-medium transition ${
                              size === s
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Animation
                      </label>
                      <div className="mt-2">
                        <select
                          value={anim}
                          onChange={(e) => setAnim(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-800 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                        >
                          {ANIMATIONS.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage & Code Output Column */}
              <div className="flex flex-col justify-between p-6 lg:col-span-7">
                {/* Visual Stage */}
                <div className="relative flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-zinc-200 bg-checker p-8 dark:border-zinc-800">
                  {/* Telemetry pill */}
                  <div className="absolute left-3 top-3 flex items-center gap-2 rounded border border-zinc-200 bg-white/90 px-2 py-0.5 font-mono text-[11px] text-zinc-600 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-400">
                    <span>{size}&times;{size}px</span>
                    {loadTime !== null && (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{loadTime}ms</span>
                      </>
                    )}
                  </div>

                  {imageError ? (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <span className="text-xs text-zinc-400">Icon query not found</span>
                      <span className="font-mono text-xs text-zinc-500">"{query}"</span>
                    </div>
                  ) : (
                    <img
                      src={activeUrl}
                      alt={query}
                      width={size}
                      height={size}
                      className="transition-all duration-150"
                      style={{ width: `${size}px`, height: `${size}px` }}
                    />
                  )}
                </div>

                {/* Code Export Tabs */}
                <div className="mt-6">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
                    <div className="flex gap-2">
                      {['url', 'html', 'react', 'vue', 'css'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setExportTab(tab)}
                          className={`rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                            exportTab === tab
                              ? 'bg-blue-600 text-white'
                              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3">
                    <CodeBlock code={getSnippet()} language={exportTab === 'url' ? 'text' : exportTab} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="border-t border-zinc-200 bg-zinc-50/50 py-20 dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
              Architected for Performance & Reliability
            </h2>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Everything you need to deliver icons at scale with zero client-side package overhead.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Zero-Dependency URLs',
                desc: 'Embed icons directly with <img> tags or CSS backgrounds. Eliminate gigabytes of node_modules and webpack bloat.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                ),
              },
              {
                title: 'Sub-50ms Edge Caching',
                desc: 'Vercel Edge Functions with globally distributed CDN edge caching and stale-while-revalidate headers.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                ),
              },
              {
                title: 'Multi-Set Smart Fallbacks',
                desc: 'Intelligent multi-tier resolver seamlessly queries Material Symbols, Simple Icons, and the 200k+ Iconify catalog.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                ),
              },
              {
                title: 'Batch Sprite Exports',
                desc: 'Select icons into your cart across multiple categories and download single optimized SVG sprite sheets with <symbol>.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                ),
              },
              {
                title: 'BYOK AI Generation',
                desc: 'Generate custom vector icons with your own API keys across Gemini, Claude, OpenAI, Groq, Mistral, and more.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                ),
              },
              {
                title: 'Developer CLI Tooling',
                desc: 'Fetch, download, and preview icons right inside your terminal via npx sednicon get <name> without install.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                ),
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {f.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TICKER TRACK ── */}
      <section className="overflow-hidden border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Unified Access To Over 150 Icon Sets
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            <span>Material Symbols</span>
            <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
            <span>Simple Icons</span>
            <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
            <span>Lucide</span>
            <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
            <span>Phosphor</span>
            <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
            <span>Tabler</span>
            <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
            <span>Feather</span>
            <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
            <span>Font Awesome</span>
            <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
            <span>Remix Icon</span>
          </div>
        </div>
      </section>
    </div>
  );
}
