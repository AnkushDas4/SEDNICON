import React from 'react';
import { Link } from 'react-router-dom';
import { useToast } from './Toast';

export default function Footer() {
  const { addToast } = useToast();

  const copyCli = () => {
    navigator.clipboard.writeText('npx sednicon get heart');
    addToast('Copied CLI command to clipboard!', 'success');
  };

  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-50/50 transition-colors dark:border-zinc-800 dark:bg-zinc-950/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* Left info */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-sans text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Sednicon
              </span>
              <span className="text-zinc-400 dark:text-zinc-600">/</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Instant Edge SVG Microservice
              </span>
            </div>
            <p className="max-w-md text-xs text-zinc-500 dark:text-zinc-400">
              Zero-runtime-overhead icons, smart multi-set fallbacks, and BYOK AI icon generation. Built by{' '}
              <a
                href="https://sednium.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 transition hover:text-blue-600 dark:text-zinc-300 dark:decoration-zinc-700 dark:hover:text-blue-400"
              >
                Sednium
              </a>
              .
            </p>
          </div>

          {/* Quick links & status */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-600 dark:text-zinc-400">
            <Link to="/status" className="flex items-center gap-2 transition hover:text-zinc-900 dark:hover:text-zinc-100">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Edge Status</span>
            </Link>

            <Link to="/library" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
              Library
            </Link>
            <Link to="/generate" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
              AI Generator
            </Link>
            <Link to="/docs" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
              Docs
            </Link>
            <a
              href="https://github.com/AnkushDas4/SEDNICON"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              GitHub
            </a>

            {/* CLI Pill */}
            <button
              type="button"
              onClick={copyCli}
              className="group flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 font-mono text-[11px] text-zinc-700 shadow-sm transition hover:border-zinc-300 active:scale-[0.96] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700"
            >
              <span>npx sednicon</span>
              <svg className="h-3 w-3 text-zinc-400 transition group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-zinc-200/60 pt-6 text-[11px] text-zinc-400 dark:border-zinc-800/60 dark:text-zinc-500 sm:flex-row sm:items-center">
          <div>
            &copy; {new Date().getFullYear()} Sednicon. Open source under the MIT License.
          </div>
          <div>
            Powered by Iconify &bull; Simple Icons &bull; Material Symbols
          </div>
        </div>
      </div>
    </footer>
  );
}
