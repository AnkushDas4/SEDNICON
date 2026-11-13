import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRenderUrl } from '../utils/api';
import CodeBlock from '../components/CodeBlock';
import CustomSelect from '../components/CustomSelect';

const PRESET_ICONS = ['github', 'vercel', 'sparkles', 'terminal', 'rocket', 'heart', 'settings'];
const SIZES = [16, 24, 32, 48, 64];
const ANIMATIONS = [
  { id: 'none', label: 'No Animation' },
  { id: 'spin', label: 'Spin (360° Rotate)' },
  { id: 'pulse', label: 'Pulse (Breathing Scale)' },
  { id: 'bounce', label: 'Bounce (Vertical Hop)' },
];

const PRESET_COLORS = [
  { label: 'Blue', value: '#2563eb' },
  { label: 'Dark', value: '#09090b' },
  { label: 'White', value: '#ffffff' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Amber', value: '#f59e0b' },
];

const ICON_SETS = [
  'Material Symbols',
  'Simple Icons',
  'Lucide Icons',
  'Phosphor',
  'Tabler',
  'Feather',
  'Font Awesome',
  'Remix Icon',
  'Carbon Design',
  'Fluent UI',
  'Octicons',
  'Heroicons',
  'Bootstrap Icons',
  'Ant Design',
  'Boxicons',
];

export default function Home() {
  // Configurator state
  const [query, setQuery] = useState('sparkles');
  const [color, setColor] = useState('#2563eb');
  const [size, setSize] = useState(48);
  const [anim, setAnim] = useState('none');
  const [exportTab, setExportTab] = useState('url');
  const [svgContent, setSvgContent] = useState('');
  const [loadTime, setLoadTime] = useState(null);
  const [imageError, setImageError] = useState(false);

  const activeUrl = getRenderUrl({
    q: query || 'sparkles',
    color,
    size,
    anim: anim !== 'none' ? anim : null,
  });

  // Fetch SVG text to render inline with overflow:visible so keyframe animations (spin, bounce) never clip
  useEffect(() => {
    setImageError(false);
    const start = performance.now();
    let isCurrent = true;

    fetch(activeUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Icon not found');
        return res.text();
      })
      .then((text) => {
        if (!isCurrent) return;
        if (text.startsWith('<svg') || text.includes('<svg')) {
          // Ensure root SVG allows visible overflow for animations
          const preparedSvg = text.replace(/<svg\b([^>]*)>/, '<svg$1 style="overflow:visible;">');
          setSvgContent(preparedSvg);
          setLoadTime(Math.round(performance.now() - start));
        } else {
          throw new Error('Invalid SVG payload');
        }
      })
      .catch(() => {
        if (isCurrent) {
          setImageError(true);
          setSvgContent('');
          setLoadTime(null);
        }
      });

    return () => {
      isCurrent = false;
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

  return (
    <div className="flex flex-col">
      {/* ── HERO SECTION ── */}
      <section className="hero-paper relative isolate overflow-hidden border-b border-blue-100/80 py-16 dark:border-zinc-800 sm:py-20 lg:py-24">
        <div className="hero-contour pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div className="relative z-10 mx-auto grid w-full min-w-0 grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:max-w-7xl lg:grid-cols-[1.04fr_.96fr] lg:px-8">
          <div className="w-full min-w-0 max-w-2xl">
            <h1 className="display-type max-w-xl text-5xl font-semibold leading-[.98] tracking-[-.045em] text-slate-950 dark:text-zinc-50 sm:text-6xl lg:text-[4.65rem]">
              Every icon.<br />
              <span className="hero-blue-ink">One tiny URL.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-zinc-400 sm:text-xl sm:leading-8">
              A whole world of crisp, recolorable SVGs—served right where your interface needs them. No bundle, no setup, just a link.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/library" className="group inline-flex items-center gap-3 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(29,78,216,.65)] transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-[0_12px_24px_-8px_rgba(29,78,216,.55)] active:translate-y-0">
                Browse the library
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" /></svg>
              </Link>
              <Link to="/docs" className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white/75 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-white hover:text-blue-800 dark:border-zinc-700 dark:bg-zinc-900/75 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-blue-300">
                Read the quickstart <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-blue-100 pt-5 text-sm text-slate-600 dark:border-zinc-800 dark:text-zinc-400">
              <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /><strong className="font-semibold text-slate-900 dark:text-zinc-100">200k+</strong> icons</span>
              <span><strong className="font-semibold text-slate-900 dark:text-zinc-100">150+</strong> icon sets</span>
              <span className="inline-flex items-center gap-2"><svg className="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0L16.95 7.05M7.05 16.95l-1.414 1.414M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>Edge-ready</span>
            </div>
          </div>

          <div className="hero-specimen relative mx-auto w-full min-w-0 max-w-[550px]">
            <div className="absolute -right-5 -top-5 h-28 w-28 rounded-full bg-sky-200/70 blur-3xl dark:bg-sky-500/10" />
            <div className="absolute -bottom-7 -left-6 h-36 w-36 rounded-full bg-blue-200/70 blur-3xl dark:bg-blue-500/10" />
            <div className="relative min-w-0 overflow-hidden rounded-[1.65rem] border border-blue-200/80 bg-white/90 p-4 shadow-[0_28px_80px_-38px_rgba(30,64,175,.42)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b border-blue-100 pb-4 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h10M4 17h7" /></svg></div>
                  <div><div className="text-sm font-bold text-slate-900 dark:text-zinc-100">Icon, on demand</div><div className="text-[11px] text-slate-500 dark:text-zinc-400">A live edge response</div></div>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-[9px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 sm:px-2.5 sm:text-[10px]">200 OK · 18ms</span>
              </div>
              <div className="specimen-grid relative mt-5 flex min-h-[235px] items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-[#f5f9ff] dark:border-zinc-800 dark:bg-zinc-950/70">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(96,165,250,.17),transparent_62%)]" />
                <div className="relative grid grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { name: 'sparkles', size: 66, box: 'bg-blue-700 text-white shadow-[0_16px_35px_-14px_rgba(29,78,216,.8)]' },
                    { name: 'layers', size: 48, box: 'bg-white text-blue-700 border border-blue-100 shadow-lg dark:bg-zinc-900 dark:text-blue-300 dark:border-zinc-700' },
                    { name: 'rocket', size: 52, box: 'bg-sky-100 text-blue-800 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900' },
                    { name: 'terminal', size: 46, box: 'bg-white text-slate-700 border border-blue-100 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700' },
                    { name: 'heart', size: 42, box: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900' },
                    { name: 'globe', size: 48, box: 'bg-white text-blue-600 border border-blue-100 shadow-sm dark:bg-zinc-900 dark:text-blue-400 dark:border-zinc-700' },
                  ].map((item, index) => (
                    <div key={item.name} className={`specimen-icon flex items-center justify-center rounded-2xl ${item.box}`} style={{ width: index === 0 ? 'clamp(72px, 23vw, 90px)' : 'clamp(58px, 19vw, 72px)', height: index === 0 ? 'clamp(72px, 23vw, 90px)' : 'clamp(58px, 19vw, 72px)', animationDelay: `${index * 110}ms` }}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" className={index === 0 ? 'h-11 w-11' : 'h-8 w-8'}>
                        {item.name === 'sparkles' && <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" /><path d="m19 14 1 2.5 2 1-2 1-1 2.5-1-2.5-2-1 2-1 1-2.5Z" /></>}
                        {item.name === 'layers' && <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>}
                        {item.name === 'rocket' && <g transform="translate(-1 1)"><path d="M5 13c-2 1-2 5-2 6 1 0 5 0 6-2" /><path d="M9 15 6 12c2-5 6-8 14-9-1 8-4 12-9 14l-2-2Z" /><circle cx="15" cy="9" r="1.5" /></g>}
                        {item.name === 'terminal' && <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3m6 0h4" /></>}
                        {item.name === 'heart' && <path d="M20.8 8.8c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.8 2.4Z" />}
                        {item.name === 'globe' && <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>}
                      </svg>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-3 right-3 rounded-lg border border-blue-100 bg-white/90 px-2.5 py-1.5 font-mono text-[10px] text-slate-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-400">vectors, not bitmaps</div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-100 bg-[#f8fbff] p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m13 2-3 8H4l7 12 3-8h6L13 2Z" /></svg></span>
                <code className="min-w-0 truncate text-[11px] text-slate-600 dark:text-zinc-400 sm:text-xs">sednicon.sednium.com/api/render?q=sparkles</code>
                <span className="ml-auto shrink-0 font-mono text-[10px] font-semibold text-blue-700 dark:text-blue-300">GET</span>
              </div>
            </div>
            <div className="absolute -left-4 top-[31%] hidden items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 sm:flex">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Recolorable SVG
            </div>
            <div className="absolute -right-3 bottom-[18%] hidden rounded-xl border border-blue-100 bg-white px-3 py-2 font-mono text-[11px] text-blue-800 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-blue-300 md:block">#2563eb</div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE CONFIGURATOR WORKBENCH ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
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
              <div className="min-w-0 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:p-6 lg:col-span-5 lg:border-b-0 lg:border-r">
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
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 font-mono text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600"
                      />
                    </div>
                    {/* Presets with Click Highlight */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {PRESET_ICONS.map((p) => {
                        const isSelected = query === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setQuery(p)}
                            className={`rounded-md px-2.5 py-1 font-mono text-xs transition active:scale-[0.96] ${
                              isSelected
                                ? 'bg-blue-600 text-white font-bold shadow-sm ring-1 ring-blue-500'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
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
                    <div className="mt-2.5 flex items-center gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setColor(c.value)}
                          title={c.label}
                          style={{ backgroundColor: c.value }}
                          className={`h-6 w-6 rounded-full border border-zinc-300 transition-transform active:scale-90 dark:border-zinc-700 ${
                            color === c.value ? 'scale-110 ring-2 ring-blue-500 shadow' : 'hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Size Buttons & Animation Custom Dropdown */}
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
                            className={`flex-1 rounded py-1.5 font-mono text-xs font-medium transition active:scale-[0.96] ${
                              size === s
                                ? 'bg-blue-600 text-white font-bold shadow-sm ring-1 ring-blue-500'
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
                        <CustomSelect
                          value={anim}
                          onChange={(val) => setAnim(val)}
                          options={ANIMATIONS}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage & Code Output Column */}
              <div className="flex min-w-0 flex-col justify-between p-4 sm:p-6 lg:col-span-7">
                {/* Visual Stage - No cutting, clean stage with generous breathing room */}
                <div className="relative flex min-h-[220px] flex-col items-center justify-center overflow-visible rounded-xl border border-zinc-200 bg-zinc-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-950/70 sm:min-h-[240px] sm:p-10">
                  {/* Telemetry pill */}
                  <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md border border-zinc-200 bg-white/90 px-2.5 py-1 font-mono text-[11px] text-zinc-600 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-400">
                    <span>{size}&times;{size}px</span>
                    {loadTime !== null && (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{loadTime}ms</span>
                      </>
                    )}
                  </div>

                  {imageError ? (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <span className="text-xs text-zinc-400">Icon query not found</span>
                      <span className="font-mono text-xs text-zinc-500">"{query}"</span>
                    </div>
                  ) : svgContent ? (
                    <div
                      className="flex items-center justify-center transition-transform duration-200"
                      style={{ overflow: 'visible', padding: '16px' }}
                      dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    </div>
                  )}
                </div>

                {/* Code Export Tabs with Click Highlight */}
                <div className="mt-6">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {['url', 'html', 'react', 'vue', 'css'].map((tab) => {
                        const isTabActive = exportTab === tab;
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setExportTab(tab)}
                            className={`rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider transition active:scale-[0.96] sm:px-3 sm:text-xs ${
                              isTabActive
                                ? 'bg-blue-600 text-white font-bold shadow-sm'
                                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                            }`}
                          >
                            {tab}
                          </button>
                        );
                      })}
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

      {/* ── CONTINUOUS MOVING TICKER BANNER ── */}
      <section className="relative overflow-hidden border-t border-zinc-200 bg-white py-10 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-5">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Unified Access To Over 150 Icon Sets
          </p>
        </div>

        {/* Gradient edge masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent dark:from-zinc-950 z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent dark:from-zinc-950 z-10" />

        {/* Continuous sliding track */}
        <div className="flex overflow-hidden">
          <div className="animate-marquee-continuous flex items-center gap-6 py-2">
            {[...ICON_SETS, ...ICON_SETS].map((setName, idx) => (
              <div
                key={`${setName}-${idx}`}
                className="flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-4 py-2 font-mono text-xs font-medium text-zinc-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-blue-400 dark:hover:text-blue-400 whitespace-nowrap"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>{setName}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
