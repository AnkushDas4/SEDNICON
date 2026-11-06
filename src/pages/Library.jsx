import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CATEGORIES, getRenderUrl } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';

const SIZES = [16, 24, 32, 48, 64];
const SWATCHES = ['#2563eb', '#09090b', '#ffffff', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

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
  const [displayLimit, setDisplayLimit] = useState(96);

  // Iconify search results state
  const [iconifyResults, setIconifyResults] = useState([]);
  const [iconifySearching, setIconifySearching] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 120);
    return () => clearTimeout(timer);
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

  // Search Iconify API when query has 2+ characters
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setIconifyResults([]);
      setIconifySearching(false);
      return;
    }

    let isCurrent = true;
    setIconifySearching(true);

    fetch(`https://api.iconify.design/search?query=${encodeURIComponent(debouncedQuery)}&limit=36`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCurrent) return;
        const icons = data.icons || [];
        setIconifyResults(icons);
        setIconifySearching(false);
      })
      .catch(() => {
        if (isCurrent) setIconifySearching(false);
      });

    return () => {
      isCurrent = false;
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
    setDisplayLimit(96);
  };

  return (
    <div className="py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-sans text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
              Icon Catalog
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Search 200,000+ vector icons across Simple Icons, Material Symbols, and Iconify.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="hidden sm:inline">Press</span>
            <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
              /
            </kbd>
            <span className="hidden sm:inline">to search &bull; Click card to add to batch sprite</span>
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
                    className={`rounded px-2.5 py-1 font-mono text-xs font-medium transition ${
                      iconSize === s
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
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
                    className={`h-4 w-4 rounded-full border border-zinc-300 transition-transform dark:border-zinc-700 ${
                      color === swatch ? 'scale-110 ring-2 ring-blue-500' : ''
                    }`}
                  />
                ))}
              </div>

              {/* Reset button */}
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-4 flex items-center gap-1 overflow-x-auto border-t border-zinc-100 pt-3 scrollbar-none dark:border-zinc-800/80">
            <button
              type="button"
              onClick={() => setSelectedCat('all')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                selectedCat === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={`whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition ${
                  selectedCat === cat.id
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
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
                No matching icons for "{debouncedQuery}". Try a different keyword or generate it with AI!
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
                    const renderUrl = getRenderUrl({
                      q: name,
                      color: color.replace('#', ''),
                      size: iconSize,
                      set: cat.id === 'brands' ? 'simple-icons' : null,
                    });
                    const fallbackUrl = cat.id === 'brands'
                      ? `https://api.iconify.design/simple-icons/${name}.svg?color=%23${color.replace('#', '')}`
                      : `https://api.iconify.design/material-symbols/${name.replace(/_/g, '-')}.svg?color=%23${color.replace('#', '')}`;

                    return (
                      <div
                        key={name}
                        onClick={() => toggleInCart(name)}
                        className={`group relative flex flex-col items-center justify-center rounded-lg border p-3 transition-all duration-150 cursor-pointer ${
                          selected
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600 dark:border-blue-500 dark:bg-blue-950/40 dark:ring-blue-500'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                        }`}
                      >
                        {/* Selected indicator */}
                        {selected && (
                          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}

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
                          className="flex items-center justify-center"
                          style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                        >
                          <img
                            src={renderUrl}
                            alt={name}
                            loading="lazy"
                            width={iconSize}
                            height={iconSize}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = fallbackUrl;
                            }}
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
                  const selected = isInCart(iconName);
                  const iconifyUrl = `https://api.iconify.design/${prefix}/${iconName}.svg?color=%23${color.replace('#', '')}&width=${iconSize}&height=${iconSize}`;

                  return (
                    <div
                      key={id}
                      onClick={() => toggleInCart(iconName)}
                      className={`group relative flex flex-col items-center justify-center rounded-lg border p-3 transition cursor-pointer ${
                        selected
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600 dark:border-blue-500 dark:bg-blue-950/40'
                          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                      }`}
                    >
                      {selected && (
                        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}

                      <div
                        className="flex items-center justify-center"
                        style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                      >
                        <img
                          src={iconifyUrl}
                          alt={iconName}
                          loading="lazy"
                          width={iconSize}
                          height={iconSize}
                        />
                      </div>

                      <span className="mt-2.5 w-full truncate text-center font-mono text-[11px] text-zinc-600 transition-colors group-hover:text-zinc-950 dark:text-zinc-400 dark:group-hover:text-zinc-100">
                        {iconName}
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
