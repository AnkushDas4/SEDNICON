import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';

export default function Navbar({ onOpenCart }) {
  const { theme, toggleTheme } = useTheme();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);

  const navLinks = [
    { to: '/library', label: 'Library', description: 'Browse the icon catalog', icon: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z' },
    { to: '/generate', label: 'Generate', description: 'Create a custom vector', icon: 'M12 3v4m0 10v4m9-9h-4M7 12H3m15.36 6.36-2.83-2.83M8.47 8.47 5.64 5.64m12.72 0-2.83 2.83m-7.06 7.06-2.83 2.83M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' },
    { to: '/docs', label: 'Docs', description: 'API guides and examples', icon: 'M6 3h9l4 4v14H6zM15 3v5h5M9 13h7M9 17h7' },
    { to: '/status', label: 'Status', description: 'Live service health', icon: 'M3 12h4l3-8 4 16 3-8h4' },
  ];

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 w-full border-b border-blue-100/80 bg-[#fbfdff]/90 shadow-[0_1px_12px_rgba(37,99,235,.035)] backdrop-blur-xl transition-colors dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="group flex items-center gap-2.5 text-zinc-900 transition-colors dark:text-zinc-100"
          >
            <img
              src="/favicon.svg"
              alt=""
              aria-hidden="true"
              width="36"
              height="36"
              className="h-9 w-9 rounded-xl shadow-[0_5px_12px_-4px_rgba(29,78,216,.7)] ring-1 ring-blue-800/20 transition-transform group-hover:scale-105 active:scale-[0.96]"
            />
            <span className="font-sans text-lg font-bold tracking-[-.03em]">Sednicon</span>
          </Link>

          <span className="hidden rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-blue-600 dark:text-blue-400 sm:inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            v3.5.0 Edge
          </span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm font-semibold tracking-normal transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-100 dark:bg-blue-950/50 dark:text-blue-200 dark:ring-blue-900'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Cart Badge Button */}
          {cartCount > 0 && (
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-1.5 rounded-md border border-blue-500/30 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 active:scale-[0.96] dark:border-blue-500/30 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50"
              title="Open Batch Exporter"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>{cartCount}</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-100 active:scale-[0.96] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {theme === 'dark' ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* GitHub Icon Link */}
          <a
            href="https://github.com/AnkushDas4/SEDNICON"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-100 active:scale-[0.96] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-100 active:scale-[0.96] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
          >
            {mobileMenuOpen ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="absolute left-0 right-0 top-full z-50 px-3 pb-3 md:hidden">
          <div className="mobile-menu-panel mx-auto max-w-7xl overflow-hidden rounded-[1.35rem] border border-blue-100 bg-[#fbfdff]/[.98] p-3 shadow-[0_24px_64px_-24px_rgba(30,64,175,.32)] ring-1 ring-slate-900/5 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/[.98] dark:ring-white/10">
            <div className="flex items-center justify-between px-1 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-700 dark:text-blue-300">Navigation</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Where would you like to go?</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/80 px-2.5 py-1 font-mono text-[10px] text-blue-800 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> v3.5.0 Edge
              </span>
            </div>
            <nav className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `group flex min-h-[76px] items-center gap-2.5 rounded-xl border p-2.5 transition-[background-color,border-color,box-shadow] ${
                      isActive
                        ? 'border-blue-200 bg-blue-50/90 shadow-sm dark:border-blue-800 dark:bg-blue-950/50'
                        : 'border-transparent bg-white/65 hover:border-blue-100 hover:bg-white dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-blue-700 text-white shadow-sm' : 'bg-blue-50 text-blue-700 group-hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-300 dark:group-hover:bg-slate-700'}`}>
                        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d={link.icon} />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-semibold ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-slate-800 dark:text-slate-100'}`}>{link.label}</span>
                        <span className="mt-0.5 block truncate text-[10px] leading-4 text-slate-500 dark:text-slate-400">{link.description}</span>
                      </span>
                      <svg className={`h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${isActive ? 'text-blue-600 dark:text-blue-300' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                      </svg>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-blue-100/80 px-1 pt-3 text-[10px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span>One URL · every icon</span>
              <span className="font-mono text-blue-700 dark:text-blue-300">200k+ vectors</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
