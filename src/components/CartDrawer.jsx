import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';
import { getRenderUrl } from '../utils/api';

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, removeFromCart, clearCart, cartCount } = useCart();
  const { addToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  if (cartCount === 0) return null;

  const handleDownloadSprite = async () => {
    setDownloading(true);
    addToast('Generating SVG sprite sheet...', 'info');

    try {
      // First attempt backend sprite generator
      const iconList = cart.join(',');
      const backendUrl = `/api/sprite?icons=${encodeURIComponent(iconList)}`;

      const res = await fetch(backendUrl);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sednicon-sprite.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(`Downloaded sprite sheet with ${cartCount} icons!`, 'success');
        setDownloading(false);
        return;
      }
      throw new Error('Backend sprite API failed, falling back to client');
    } catch {
      // Client-side fallback: fetch individual SVGs and wrap in <symbol>
      try {
        let symbols = '';
        for (const name of cart) {
          try {
            const url = getRenderUrl({ q: name, size: 24, color: 'currentColor' });
            const r = await fetch(url);
            if (r.ok) {
              const svgText = await r.text();
              const inner = svgText.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').trim();
              symbols += `\n  <symbol id="${name}" viewBox="0 0 24 24">\n    ${inner}\n  </symbol>`;
            }
          } catch {
            // ignore individual icon failure
          }
        }
        const fullSprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none;">${symbols}\n</svg>`;
        const blob = new Blob([fullSprite], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sednicon-sprite.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(`Downloaded sprite sheet with ${cartCount} icons!`, 'success');
      } catch (err) {
        addToast('Failed to download sprite sheet: ' + err.message, 'error');
      } finally {
        setDownloading(false);
      }
    }
  };

  const handleCopyUsage = () => {
    const sample = cart[0] || 'icon-name';
    const usage = `<!-- Usage with SVG Sprite Sheet -->
<svg class="icon">
  <use href="/sednicon-sprite.svg#${sample}"></use>
</svg>`;
    navigator.clipboard.writeText(usage);
    addToast('Copied sprite usage snippet to clipboard!', 'success');
  };

  return (
    <aside aria-label="Selected icons drawer" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-300 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        {/* Left: summary & tags */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-mono text-xs font-bold text-white">
            {cartCount}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {cartCount} {cartCount === 1 ? 'icon' : 'icons'} selected
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-[11px] text-zinc-500 scrollbar-none">
              {cart.slice(0, 5).map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => removeFromCart(name)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    title={`Remove ${name}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
              {cartCount > 5 && (
                <span className="font-mono text-zinc-400">+{cartCount - 5} more</span>
              )}
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleCopyUsage}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            title="Copy HTML <use> snippet"
          >
            Copy Snippet
          </button>

          <button
            type="button"
            disabled={downloading}
            onClick={handleDownloadSprite}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-500 active:scale-95 disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{downloading ? 'Building...' : 'Download Sprite'}</span>
          </button>

          <button
            type="button"
            onClick={clearCart}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            Clear
          </button>
        </div>
      </div>
    </aside>
  );
}
