import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CATEGORIES, getRenderUrl } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import IconDetailModal from '../components/IconDetailModal';

const SIZES = [16, 24, 32, 48, 64];
const SWATCHES = ['#2563eb', '#09090b', '#ffffff', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

function fallbackPreview(event, fallbackUrl) {
  const image = event.currentTarget;
  if (image.dataset.resolverFallback) {
    image.onerror = null;
    image.src = '/favicon.svg';
    return;
  }
  image.dataset.resolverFallback = 'true';
  image.src = fallbackUrl;
}

export default function Library() {
  const { isInCart, toggleInCart } = useCart();
  const { addToast } = useToast();

  const searchInputRef = useRef(null);

  // Filter state
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [iconSize, setIconSize] = useState(32);
  const [color, setColor] = useState('#2563eb');
  const [displayLimit, setDisplayLimit] = useState(120);

  // Modal inspection state
  const [inspectIcon, setInspectIcon] = useState(null);

  // Iconify search results state
  const [iconifyResults, setIconifyResults] = useState([]);
  const [iconifySearching, setIconifySearching] = useState(false);
  const searchControllerRef = useRef(null);

  // Debounce typing and immediately cancel stale network results while the query changes.
  useEffect(() => {
    const normalizedQuery = query.trim().toLowerCase();
    searchControllerRef.current?.abort();
    setIconifyResults([]);
    setIconifySearching(normalizedQuery.length >= 2);

    const timer = setTimeout(() => {
      setDebouncedQuery(normalizedQuery);
    }, 220);

    return () => {
      clearTimeout(timer);
      searchControllerRef.current?.abort();
    };
  }, [query]);

  // Keyboard shortcut: '/' to focus search, 'Escape' to blur
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter curated icons
  const filteredCategories = useMemo(() => {
    if (!debouncedQuery && selectedCat === 'all') {
      return CATEGORIES;
    }

    return CATEGORIES.map((cat) => {
      if (selectedCat !== 'all' && cat.id !== selectedCat) {
        return { ...cat, icons: [] };
      }
      if (!debouncedQuery) {
        return cat;
      }
      const matchingIcons = cat.icons.filter((name) =>
        name.toLowerCase().includes(debouncedQuery)
      );
      return { ...cat, icons: matchingIcons };
    }).filter((cat) => cat.icons.length > 0);
  }, [debouncedQuery, selectedCat]);

  const totalCuratedMatches = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.icons.length, 0);
  }, [filteredCategories]);

  // Query the full Iconify ecosystem and keep late responses from replacing newer searches.
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setIconifyResults([]);
      setIconifySearching(false);
      return undefined;
    }

    const controller = new AbortController();
    searchControllerRef.current = controller;
    setIconifySearching(true);

    fetch(`https://api.iconify.design/search?query=${encodeURIComponent(debouncedQuery)}&limit=48`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Icon search is unavailable');
        return response.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        const queryKey = debouncedQuery.replace(/[\s_-]+/g, '');
        const icons = (Array.isArray(data.icons) ? data.icons : [])
          .filter((id) => typeof id === 'string' && id.includes(':'))
          .sort((left, right) => {
            const rank = (id) => {
              const name = id.split(':').slice(1).join(':').toLowerCase().replace(/[\s_-]+/g, '');
              if (name === queryKey) return 0;
              if (name.startsWith(queryKey)) return 1;
              if (name.includes(queryKey)) return 2;
              return 3;
            };
            return rank(left) - rank(right);
          });
        setIconifyResults(icons);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setIconifyResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIconifySearching(false);
      });

    return () => {
      controller.abort();
      if (searchControllerRef.current === controller) searchControllerRef.current = null;
    };
  }, [debouncedQuery]);

  const handleCopyUrl = (e, name) => {
    e.stopPropagation();
    const url = getRenderUrl({ q: name, color, size: iconSize });
    navigator.clipboard.writeText(url);
    addToast(`Copied URL for "${name}"`, 'success');
  };

  const handleReset = () => {
    setQuery('');
    setSelectedCat('all');
    setIconSize(32);
    setColor('#2563eb');
    setDisplayLimit(120);
  };

  const cleanColorHex = color.replace(/^#/, '');

  return (
    <div className="py-10 sm:py-12">
      {/* Icon Inspection Modal */}
      {inspectIcon && (
        <IconDetailModal
          iconName={inspectIcon}
          initialColor={color}
          onClose={() => setInspectIcon(null)}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-sans text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
              Icon Catalog & Variations
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Browse 200,000+ icons. Click any card to inspect multiple set variations (Outline, Rounded, Sharp).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="hidden sm:inline">Press</span>
            <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
              /
            </kbd>
            <span className="hidden sm:inline">to search &bull; Click to view variations & code</span>
          </div>
        </div>

        {/* ── FILTER & CONTROLS TOOLBAR ── */}
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search icons (e.g. github, home, check, arrow, play)..."
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-10 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <span className="text-sm font-semibold">&times;</span>
                </button>
              )}
            </div>

            {/* Controls: Size, Color, Reset */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Size Buttons */}
              <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setIconSize(s)}
                    className={`rounded px-2.5 py-1 font-mono text-xs font-medium transition active:scale-95 ${
                      iconSize === s
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Color picker + swatches */}
              <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded border border-zinc-300 dark:border-zinc-700">
                  <input
                    type="color"
                    value={color.startsWith('#') ? color : `#${color}`}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute -inset-2 h-10 w-10 cursor-pointer"
                  />
                </div>
                {SWATCHES.slice(0, 4).map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setColor(swatch)}
                    style={{ backgroundColor: swatch }}
                    className={`h-4 w-4 rounded-full border border-zinc-300 transition-transform active:scale-95 dark:border-zinc-700 ${
                      color === swatch ? 'scale-110 ring-2 ring-blue-500' : ''
                    }`}
                  />
                ))}
              </div>

              {/* Reset button */}
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 active:scale-95 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Clean Wrapped Category Pills (No Ugly Scrollbar!) */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={() => setSelectedCat('all')}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition active:scale-95 ${
                selectedCat === 'all'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition active:scale-95 ${
                  selectedCat === cat.id
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── ICONS DISPLAY ── */}
        <div className="mt-8 space-y-10">
          {totalCuratedMatches === 0 && iconifyResults.length === 0 && !iconifySearching && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
              <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">No icons found</h3>
              <p className="mt-1 text-xs text-zinc-500">
                No matching icons for "{debouncedQuery}". Try another keyword or create one with the AI generator!
              </p>
            </div>
          )}

          {/* Curated Categories */}
          {filteredCategories.map((cat) => {
            const iconsToShow = cat.icons.slice(0, displayLimit);
            return (
              <section key={cat.id} className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    {cat.name}
                  </h2>
                  <span className="font-mono text-xs text-zinc-400">
                    {cat.icons.length} {cat.icons.length === 1 ? 'icon' : 'icons'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {iconsToShow.map((name) => {
                    const selected = isInCart(name);
                    const isBrand = cat.id === 'brands';
                    // Fast reliable direct multi-CDN source for client previews
                    const fastPreviewSrc = isBrand
                      ? `https://api.iconify.design/simple-icons/${name}.svg?color=%23${cleanColorHex}&width=${iconSize}&height=${iconSize}`
                      : `https://api.iconify.design/material-symbols/${name.replace(/_/g, '-')}.svg?color=%23${cleanColorHex}&width=${iconSize}&height=${iconSize}`;
                    const resolverFallbackSrc = getRenderUrl({
                      q: name,
                      color,
                      size: iconSize,
                      set: isBrand ? 'simple-icons' : null,
                    });

                    return (
                      <div
                        key={name}
                        onClick={() => setInspectIcon(name)}
                        className={`group relative flex flex-col items-center justify-center rounded-xl border p-3.5 transition-all duration-150 cursor-pointer active:scale-95 ${
                          selected
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600 dark:border-blue-500 dark:bg-blue-950/40 dark:ring-blue-500'
                            : 'border-zinc-200 bg-white hover:border-blue-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                        }`}
                      >
                        {/* Cart toggle pill */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleInCart(name);
                          }}
                          title={selected ? 'Remove from batch sprite' : 'Add to batch sprite'}
                          className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md text-xs transition ${
                            selected
                              ? 'bg-blue-600 text-white'
                              : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {selected ? (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <span className="text-sm font-bold leading-none">+</span>
                          )}
                        </button>

                        {/* Copy URL Hover Button */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyUrl(e, name)}
                          title="Copy direct URL"
                          className="absolute left-1.5 top-1.5 hidden rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 group-hover:block dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>

                        {/* Icon Image */}
                        <div
                          className="flex items-center justify-center pointer-events-none"
                          style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                        >
                          <img
                            key={`${name}-${fastPreviewSrc}`}
                            src={fastPreviewSrc}
                            alt={name}
                            loading="lazy"
                            decoding="async"
                            width={iconSize}
                            height={iconSize}
                            onError={(event) => fallbackPreview(event, resolverFallbackSrc)}
                          />
                        </div>

                        {/* Name */}
                        <span className="mt-2.5 w-full truncate text-center font-mono text-[11px] text-zinc-600 transition-colors group-hover:text-zinc-950 dark:text-zinc-400 dark:group-hover:text-zinc-100">
                          {name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* More Results from Iconify 200k+ Catalog */}
          {(iconifyResults.length > 0 || iconifySearching) && (
            <section className="space-y-3 pt-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Iconify Ecosystem Results
                  </h2>
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    200k+ catalog
                  </span>
                </div>
                {iconifySearching && (
                  <span className="font-mono text-xs text-zinc-400 animate-pulse">Searching...</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {iconifyResults.map((id) => {
                  const [prefix, iconName] = id.split(':');
                  const selected = isInCart(id);
                  const iconifyUrl = `https://api.iconify.design/${prefix}/${iconName}.svg?color=%23${cleanColorHex}&width=${iconSize}&height=${iconSize}`;
                  const resolverFallbackSrc = getRenderUrl({ q: id, color, size: iconSize });

                  return (
                    <div
                      key={id}
                      onClick={() => setInspectIcon(id)}
                      className={`group relative flex flex-col items-center justify-center rounded-xl border p-3.5 transition active:scale-95 cursor-pointer ${
                        selected
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600 dark:border-blue-500 dark:bg-blue-950/40'
                          : 'border-zinc-200 bg-white hover:border-blue-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleInCart(id);
                        }}
                        className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md text-xs transition ${
                          selected
                            ? 'bg-blue-600 text-white'
                            : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {selected ? (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <span className="text-sm font-bold leading-none">+</span>
                        )}
                      </button>

                      <div
                        className="flex items-center justify-center pointer-events-none"
                        style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                      >
                        <img
                          key={`${id}-${iconifyUrl}`}
                          src={iconifyUrl}
                          alt={iconName}
                          loading="lazy"
                          decoding="async"
                          width={iconSize}
                          height={iconSize}
                          onError={(event) => fallbackPreview(event, resolverFallbackSrc)}
                        />
                      </div>

                      <span title={id} className="mt-2.5 w-full truncate text-center font-mono text-[10px] text-zinc-600 transition-colors group-hover:text-zinc-950 dark:text-zinc-400 dark:group-hover:text-zinc-100">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{prefix}:</span>{iconName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Load More Button */}
          {displayLimit < 300 && totalCuratedMatches > displayLimit && (
            <div className="flex justify-center pt-6">
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => prev + 96)}
                className="rounded-lg border border-zinc-200 bg-white px-5 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Load More Icons
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
