import React, { useState, useEffect } from 'react';
import { getIconVariations, getRenderUrl, svgToReact } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';
import CodeBlock from './CodeBlock';

export default function IconDetailModal({ iconName, initialColor = '#2563eb', onClose }) {
  const { isInCart, toggleInCart } = useCart();
  const { addToast } = useToast();

  const [color, setColor] = useState(initialColor);
  const [size, setSize] = useState(48);
  const [activeExportTab, setActiveExportTab] = useState('react');
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!iconName) return null;

  const displayName = iconName.includes(':') ? iconName.split(':').pop() : iconName;
  const variations = getIconVariations(iconName, color, size);
  const activeVariation = variations[selectedVariationIndex] || variations[0];
  const activeRenderUrl = activeVariation?.renderUrl || getRenderUrl({ q: iconName, color, size });
  const selected = isInCart(iconName);

  const getCodeSnippet = () => {
    switch (activeExportTab) {
      case 'url':
        return activeRenderUrl;
      case 'html':
        return `<img src="${activeRenderUrl}" alt="${displayName}" width="${size}" height="${size}" />`;
      case 'react':
        return `<img\n  src="${activeRenderUrl}"\n  alt="${displayName}"\n  width={${size}}\n  height={${size}}\n  loading="lazy"\n/>`;
      case 'vue':
        return `<img :src="'${activeRenderUrl}'" alt="${displayName}" width="${size}" height="${size}" />`;
      case 'css':
        return `.icon-${displayName} {\n  background-image: url('${activeRenderUrl}');\n  width: ${size}px;\n  height: ${size}px;\n  background-size: contain;\n  background-repeat: no-repeat;\n}`;
      default:
        return activeRenderUrl;
    }
  };

  const handleDownloadSvg = async () => {
    try {
      const res = await fetch(activeRenderUrl);
      const svgText = await res.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${displayName}-${activeVariation.id}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast(`Downloaded ${displayName}.svg!`, 'success');
    } catch {
      addToast('Failed to download SVG file.', 'error');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${displayName} icon details`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {displayName}
            </span>
            <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {activeVariation.label}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <span className="text-xl font-semibold leading-none">&times;</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* Visual Stage */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50/60 p-8 dark:border-zinc-800 dark:bg-zinc-950/60 md:col-span-5">
              <div
                className="flex items-center justify-center transition-[width,height] duration-150"
                style={{ width: `${size}px`, height: `${size}px` }}
              >
                <img
                  src={activeRenderUrl}
                  alt={displayName}
                  width={size}
                  height={size}
                  className="transition-transform duration-150"
                />
              </div>

              <div className="mt-6 flex items-center gap-2">
                <span className="font-mono text-xs text-zinc-400">
                  {size}&times;{size}px
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
                <span className="font-mono text-xs text-zinc-400 uppercase">
                  {color}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col justify-between space-y-4 md:col-span-7">
              {/* Color & Size Pickers */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Color
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-zinc-300 dark:border-zinc-700">
                      <input
                        type="color"
                        value={color.startsWith('#') ? color : `#${color}`}
                        onChange={(e) => setColor(e.target.value)}
                        className="absolute -inset-2 h-12 w-12 cursor-pointer"
                      />
                    </div>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-800 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Dimension ({size}px)
                  </label>
                  <div className="mt-1.5 flex gap-1.5">
                    {[16, 24, 32, 48, 64, 96].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`flex-1 rounded py-1 font-mono text-xs font-medium transition ${
                          size === s
                            ? 'bg-blue-600 text-white font-bold'
                            : 'border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => toggleInCart(iconName)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition active:scale-[0.96] ${
                    selected
                      ? 'bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200'
                  }`}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{selected ? 'Added in Batch Cart' : 'Add to Batch Cart'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.96] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download SVG</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── MULTIPLE VARIATIONS SELECTOR ── */}
          <div className="space-y-2 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Style & Set Variations ({variations.length})
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {variations.map((v, idx) => {
                const isActive = selectedVariationIndex === idx;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariationIndex(idx)}
                    className={`flex items-center gap-2.5 rounded-lg border p-2 text-left transition ${
                      isActive
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600 dark:border-blue-500 dark:bg-blue-950/40'
                        : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white dark:bg-zinc-900">
                      <img src={v.renderUrl || v.url} alt={v.label} width={20} height={20} loading="lazy" />
                    </div>
                    <span className="truncate text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                      {v.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── EXPORT CODE SNIPPETS ── */}
          <div className="space-y-2 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Code Snippets
              </h3>
              <div className="flex gap-1">
                {['react', 'html', 'url', 'vue', 'css'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveExportTab(tab)}
                    className={`rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider transition ${
                      activeExportTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <CodeBlock
              code={getCodeSnippet()}
              language={activeExportTab === 'url' ? 'text' : activeExportTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
