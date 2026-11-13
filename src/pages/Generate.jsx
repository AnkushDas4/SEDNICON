import React, { useState, useEffect, useRef } from 'react';
import {
  PROVIDER_MODELS,
  PROVIDERS_LIST,
  recolorSvg,
  svgToDataUri,
  svgToReact,
  svgToFlutter,
  svgToAndroidXml,
} from '../utils/api';
import CodeBlock from '../components/CodeBlock';
import CustomSelect from '../components/CustomSelect';
import ProviderLogo from '../components/ProviderLogos';
import { useToast } from '../components/Toast';

export default function Generate() {
  const { addToast } = useToast();

  // Workbench Form State
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState(24);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [color, setColor] = useState('#2563eb');
  const [renderStyle, setRenderStyle] = useState('fill');
  const [cornerStyle, setCornerStyle] = useState('round');

  // AI Provider State
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState(PROVIDER_MODELS.gemini[0]);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelName, setCustomModelName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saveKeyLocally, setSaveKeyLocally] = useState(false);

  // Generation & Status State
  const [generating, setGenerating] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const timerRef = useRef(null);

  // Result & Preview State
  const [currentSvg, setCurrentSvg] = useState(null);
  const [currentMeta, setCurrentMeta] = useState(null);
  const [exportTab, setExportTab] = useState('react');
  const [sessionHistory, setSessionHistory] = useState([]);

  // Load saved key when provider changes
  useEffect(() => {
    const saved = localStorage.getItem(`sednicon_key_${provider}`);
    if (saved) {
      setApiKey(saved);
      setSaveKeyLocally(true);
    } else {
      setApiKey('');
      setSaveKeyLocally(false);
    }
    // Update default model for provider
    if (PROVIDER_MODELS[provider]?.length) {
      setModel(PROVIDER_MODELS[provider][0]);
      setIsCustomModel(false);
    }
  }, [provider]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to generate
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Handle color or size change on already rendered SVG (DOM-based, no LLM call!)
  const handleColorChange = (newColor) => {
    setColor(newColor);
    if (currentSvg) {
      const recolored = recolorSvg(currentSvg, newColor, size);
      setCurrentSvg(recolored);
    }
  };

  const handleSizeChange = (newSize) => {
    const numSize = parseInt(newSize, 10);
    setSize(numSize);
    if (currentSvg) {
      const resized = recolorSvg(currentSvg, color, numSize);
      setCurrentSvg(resized);
    }
  };

  const effectiveModel = isCustomModel && customModelName.trim() ? customModelName.trim() : model;

  const handleGenerate = async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      addToast('Please enter an icon description.', 'warning');
      return;
    }
    if (!apiKey.trim()) {
      addToast(`Please provide an API key for ${provider.toUpperCase()}.`, 'warning');
      return;
    }

    // Persist or clear key based on checkbox
    if (saveKeyLocally) {
      localStorage.setItem(`sednicon_key_${provider}`, apiKey.trim());
    } else {
      localStorage.removeItem(`sednicon_key_${provider}`);
    }

    setGenerating(true);
    setStatusMessage(`Prompting ${effectiveModel}...`);
    setElapsedTime(0);

    const startTime = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedTime(((Date.now() - startTime) / 1000).toFixed(1));
    }, 100);

    try {
      const payload = {
        prompt: cleanPrompt,
        provider,
        model: effectiveModel,
        size,
        color: color.replace(/^#/, ''),
        style: renderStyle,
        strokeWidth,
        corner: cornerStyle,
        apiKey: apiKey.trim(),
      };

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.svg) {
        throw new Error(data.error || 'Failed to generate SVG icon');
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      setCurrentSvg(data.svg);
      setCurrentMeta({
        provider,
        model: effectiveModel,
        time: totalTime,
        prompt: cleanPrompt,
      });

      // Add to session history
      setSessionHistory((prev) => [
        {
          id: Date.now(),
          svg: data.svg,
          prompt: cleanPrompt,
          provider,
          model: effectiveModel,
          color,
          size,
        },
        ...prev,
      ]);

      addToast(`Generated icon in ${totalTime}s!`, 'success');
    } catch (err) {
      addToast(err.message || 'Error communicating with AI provider', 'error');
    } finally {
      setGenerating(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleDownloadSvg = () => {
    if (!currentSvg) return;
    const blob = new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icon-${prompt.slice(0, 15).replace(/[^a-z0-9]/gi, '_') || 'generated'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Downloaded SVG file!', 'success');
  };

  // Convert current SVG to selected export snippet
  const getExportSnippet = () => {
    if (!currentSvg) return '';
    switch (exportTab) {
      case 'url':
        return svgToDataUri(currentSvg);
      case 'html':
        return currentSvg;
      case 'react':
        return svgToReact(currentSvg, 'GeneratedIcon');
      case 'flutter':
        return svgToFlutter(currentSvg, size);
      case 'android':
        return svgToAndroidXml(currentSvg, size, color);
      default:
        return currentSvg;
    }
  };

  // Model options for selected provider + Custom option
  const providerModels = (PROVIDER_MODELS[provider] || []).map((m) => ({ value: m, label: m }));
  const modelOptions = [...providerModels, { value: '__custom__', label: '✏️ Custom Model Name...' }];

  return (
    <div className="py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Studio introduction */}
        <header className="hero-paper relative isolate overflow-hidden rounded-[1.75rem] border border-blue-100 p-5 shadow-[0_20px_60px_-40px_rgba(30,64,175,.35)] sm:p-8 lg:p-9">
          <div className="hero-contour pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
          <div className="relative grid items-end gap-7 lg:grid-cols-[1fr_310px]">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-blue-800 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> BYOK vector studio
              </span>
              <h1 className="display-type mt-5 text-4xl font-bold leading-[.98] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Make the icon<br /><span className="hero-blue-ink">you can’t find.</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Describe the shape, pick a model and style, then export a clean SVG for your project.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-[0_14px_40px_-24px_rgba(30,64,175,.32)] backdrop-blur sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-800">From brief to vector</span>
                <span className="font-mono text-[10px] text-blue-700">3 STEPS</span>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  ['01', 'Describe the shape'],
                  ['02', 'Choose your model'],
                  ['03', 'Refine & export SVG'],
                ].map(([number, label]) => (
                  <div key={number} className="flex items-center gap-3 rounded-xl bg-[#f5f9ff] px-3 py-2.5">
                    <span className="font-mono text-[10px] font-semibold text-blue-600">{number}</span>
                    <span className="text-xs font-medium text-slate-700">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* ── WORKBENCH GRID ── */}
        <div className="mt-7 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* ── LEFT PANEL: CONTROLS ── */}
          <div className="space-y-5 lg:col-span-7">
            {/* Prompt Card */}
            <div className="rounded-2xl border border-blue-100 bg-white/95 p-5 shadow-[0_12px_30px_-24px_rgba(30,64,175,.35)] dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Prompt
                </label>
                <span className="font-mono text-xs text-zinc-400">
                  {prompt.length}/300
                </span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 300))}
                placeholder="A geometric cyber skull with glowing monocle, minimalist vector lines..."
                rows={3}
                className="mt-2.5 w-full resize-y rounded-xl border border-blue-100 bg-[#f8fbff] p-3.5 text-sm leading-6 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Try a brief</span>
                {[
                  'A tiny paper plane, one-color outline',
                  'A friendly cloud with a small sun',
                  'A clean checkmark inside a soft square',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setPrompt(suggestion)}
                    className="rounded-full border border-blue-100 bg-white px-2.5 py-1.5 text-[10px] font-medium text-blue-800 transition hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-blue-200 dark:hover:bg-zinc-800"
                  >
                    {suggestion.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Parameters Card */}
            <div className="rounded-2xl border border-blue-100 bg-white/95 p-5 shadow-[0_12px_30px_-24px_rgba(30,64,175,.35)] dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Vector Geometry & Style
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-4">
                {/* Size */}
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Dimension
                  </label>
                  <div className="mt-1.5">
                    <CustomSelect
                      value={size}
                      onChange={(v) => handleSizeChange(v)}
                      options={[
                        { value: 16, label: '16px (Micro)' },
                        { value: 24, label: '24px (Standard)' },
                        { value: 32, label: '32px (Medium)' },
                        { value: 48, label: '48px (Large)' },
                        { value: 64, label: '64px (Extra)' },
                        { value: 128, label: '128px (Hero)' },
                      ]}
                    />
                  </div>
                </div>

                {/* Stroke Width */}
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Stroke Width
                  </label>
                  <div className="mt-1.5">
                    <CustomSelect
                      value={strokeWidth}
                      onChange={(v) => setStrokeWidth(parseFloat(v))}
                      options={[
                        { value: 1, label: '1 — Thin hairline' },
                        { value: 1.5, label: '1.5 — Light' },
                        { value: 2, label: '2 — Regular' },
                        { value: 2.5, label: '2.5 — Medium' },
                        { value: 3, label: '3 — Bold' },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Color Selector */}
              <div className="mt-4">
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Target Color (Live DOM Recoloring)
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-zinc-300 dark:border-zinc-700">
                    <input
                      type="color"
                      value={color.startsWith('#') ? color : `#${color}`}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="absolute -inset-2 h-12 w-12 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-800 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Toggles: Fill/Stroke & Round/Sharp */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Render Style
                  </label>
                  <div className="mt-1.5 flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
                    {['fill', 'stroke'].map((st) => {
                      const isActive = renderStyle === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setRenderStyle(st)}
                          className={`flex-1 rounded py-1 text-xs font-medium capitalize transition active:scale-[0.96] ${
                            isActive
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Corner Style
                  </label>
                  <div className="mt-1.5 flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
                    {['round', 'sharp'].map((cs) => {
                      const isActive = cornerStyle === cs;
                      return (
                        <button
                          key={cs}
                          type="button"
                          onClick={() => setCornerStyle(cs)}
                          className={`flex-1 rounded py-1 text-xs font-medium capitalize transition active:scale-[0.96] ${
                            isActive
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                          }`}
                        >
                          {cs}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Provider & BYOK Card with Authentic Logos */}
            <div className="rounded-2xl border border-blue-100 bg-white/95 p-5 shadow-[0_12px_30px_-24px_rgba(30,64,175,.35)] dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                AI Provider Selection
              </h2>

              {/* Provider Grid with Authentic Logos */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                {PROVIDERS_LIST.map((p) => {
                  const isSelected = provider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-medium transition active:scale-[0.96] ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 text-blue-700 shadow-sm ring-1 ring-blue-600 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex h-6 w-6 items-center justify-center">
                        <ProviderLogo provider={p.id} />
                      </div>
                      <span className="mt-1.5 font-semibold">{p.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Model Dropdown + Custom Model Option */}
              <div className="mt-4">
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Model
                </label>
                <div className="mt-1.5">
                  <CustomSelect
                    value={isCustomModel ? '__custom__' : model}
                    onChange={(v) => {
                      if (v === '__custom__') {
                        setIsCustomModel(true);
                      } else {
                        setIsCustomModel(false);
                        setModel(v);
                      }
                    }}
                    options={modelOptions}
                  />
                </div>

                {isCustomModel && (
                  <div className="mt-2 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={customModelName}
                      onChange={(e) => setCustomModelName(e.target.value)}
                      placeholder="Type custom model name (e.g. gpt-4o-2025-05-15)..."
                      className="w-full rounded-lg border border-blue-500 bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-900 focus:outline-none dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                )}
              </div>

              {/* API Key */}
              <div className="mt-4">
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {provider.toUpperCase()} API Key (BYOK)
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Enter your ${provider} secret key...`}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-3 pr-14 font-mono text-xs text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 font-mono text-[11px] font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showKey ? 'HIDE' : 'SHOW'}
                  </button>
                </div>

                {/* Refined Toggle Switch for Remember Key */}
                <div className="mt-3.5 flex items-center justify-between rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-2.5 dark:border-zinc-800/80 dark:bg-zinc-950/70">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        Remember key on this browser
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Stored in this browser; sent with your generation request
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={saveKeyLocally}
                    onClick={() => setSaveKeyLocally(!saveKeyLocally)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      saveKeyLocally ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        saveKeyLocally ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Clean Single Action Trigger Button (No Nested Buttons!) */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={generating}
                onClick={handleGenerate}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 enabled:active:scale-[0.96] disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Generating Vector Icon ({elapsedTime}s)...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    <span>Generate Vector Icon</span>
                  </>
                )}
              </button>

              <p className="text-center font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                Shortcut: <span className="text-zinc-600 dark:text-zinc-300">⌘↵</span> or <span className="text-zinc-600 dark:text-zinc-300">Ctrl+Enter</span> to generate
              </p>
            </div>
          </div>

          {/* ── RIGHT PANEL: PREVIEW & CODE ── */}
          <div className="space-y-5 self-start lg:sticky lg:top-24 lg:col-span-5">
            <div className="rounded-2xl border border-blue-100 bg-white/95 p-5 shadow-[0_12px_30px_-24px_rgba(30,64,175,.35)] dark:border-zinc-800 dark:bg-zinc-900">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Live Vector Output
                  </h2>
                  {currentMeta && (
                    <span className="font-mono text-[11px] text-zinc-400">
                      {currentMeta.time}s &bull; {currentMeta.model}
                    </span>
                  )}
                </div>

                {currentSvg && (
                  <button
                    type="button"
                    onClick={handleDownloadSvg}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 active:scale-[0.96] dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download SVG</span>
                  </button>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
                <span className="inline-flex min-w-0 items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${generating ? 'animate-pulse bg-blue-500' : currentSvg ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                  <span className="truncate">{generating ? statusMessage : currentSvg ? 'Vector ready to refine' : 'Preview is waiting for a brief'}</span>
                </span>
                <span className="shrink-0 font-mono text-zinc-400">{generating ? `${elapsedTime}s` : currentSvg ? `${size}px SVG` : 'SVG'}</span>
              </div>

              {/* Visual Display Stage */}
              <div className="specimen-grid relative mt-3 flex min-h-[260px] items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-[#f6f9ff] p-8 dark:border-zinc-800 dark:bg-zinc-950/70">
                {currentSvg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: currentSvg }}
                    className="transition-[color] duration-150"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500">
                    <svg className="h-10 w-10 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-xs font-medium">Your generated icon will appear here</p>
                    <p className="mt-0.5 text-[11px]">Type a prompt and press Generate Icon</p>
                  </div>
                )}
              </div>

              {/* Multi-Format Export Tabs with Click Highlight */}
              {currentSvg && (
                <div className="mt-6">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {[
                        { id: 'react', label: 'React' },
                        { id: 'html', label: 'HTML' },
                        { id: 'url', label: 'Data URI' },
                        { id: 'flutter', label: 'Flutter' },
                        { id: 'android', label: 'Android' },
                      ].map((tab) => {
                        const isTabActive = exportTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setExportTab(tab.id)}
                            className={`rounded-md px-2 py-1 text-[11px] font-semibold tracking-wider transition active:scale-[0.96] sm:px-3 sm:text-xs ${
                              isTabActive
                                ? 'bg-blue-600 text-white font-bold shadow-sm'
                                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3">
                    <CodeBlock
                      code={getExportSnippet()}
                      language={exportTab === 'react' ? 'jsx' : exportTab === 'url' ? 'text' : exportTab === 'android' ? 'xml' : 'html'}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Session History Strip with Click Highlights */}
            <div className="rounded-2xl border border-blue-100 bg-white/95 p-5 shadow-[0_12px_30px_-24px_rgba(30,64,175,.35)] dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Session Generations ({sessionHistory.length})
              </h2>

              {sessionHistory.length === 0 ? (
                <p className="mt-3 text-xs text-zinc-400">No icons generated in this session yet.</p>
              ) : (
                <div className="mt-3 grid grid-cols-4 gap-2.5 sm:grid-cols-6">
                  {sessionHistory.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCurrentSvg(item.svg);
                        setCurrentMeta({
                          provider: item.provider,
                          model: item.model,
                          time: 'cached',
                          prompt: item.prompt,
                        });
                        setPrompt(item.prompt);
                        addToast(`Loaded "${item.prompt.slice(0, 20)}..." into workbench`, 'info');
                      }}
                      className="group flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 transition hover:border-blue-500 hover:bg-blue-50/20 active:scale-[0.96] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-500"
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: item.svg }}
                        className="h-8 w-8 flex items-center justify-center overflow-hidden"
                      />
                      <span className="mt-1 w-full truncate font-mono text-[10px] text-zinc-500 group-hover:text-blue-600">
                        {item.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
