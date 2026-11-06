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
    setStatusMessage(`Prompting ${model}...`);
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
        model,
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
        model,
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
          model,
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

  return (
    <div className="py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-blue-600 dark:text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              BYOK Privacy-First AI
            </span>
          </div>
          <h1 className="font-sans text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
            Vector AI Icon Workbench
          </h1>
          <p className="max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Describe any icon in natural language. Powered by your choice of 8 state-of-the-art vision & code LLMs with real-time DOM recoloring.
          </p>
        </div>

        {/* ── WORKBENCH GRID ── */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ── LEFT PANEL: CONTROLS ── */}
          <div className="space-y-6 lg:col-span-6">
            {/* Prompt Card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
                className="mt-2.5 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600"
              />
            </div>

            {/* Style Parameters Card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Vector Geometry & Style
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-4">
                {/* Size */}
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Dimension (px)
                  </label>
                  <select
                    value={size}
                    onChange={(e) => handleSizeChange(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-800 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    {[16, 24, 32, 48, 64, 128].map((s) => (
                      <option key={s} value={s}>{s}px</option>
                    ))}
                  </select>
                </div>

                {/* Stroke Width */}
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Stroke Width
                  </label>
                  <select
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-800 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    <option value={1}>1 — Thin</option>
                    <option value={1.5}>1.5</option>
                    <option value={2}>2 — Regular</option>
                    <option value={2.5}>2.5</option>
                    <option value={3}>3 — Bold</option>
                  </select>
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
                    {['fill', 'stroke'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setRenderStyle(st)}
                        className={`flex-1 rounded py-1 text-xs font-medium capitalize transition ${
                          renderStyle === st
                            ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Corner Style
                  </label>
                  <div className="mt-1.5 flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
                    {['round', 'sharp'].map((cs) => (
                      <button
                        key={cs}
                        type="button"
                        onClick={() => setCornerStyle(cs)}
                        className={`flex-1 rounded py-1 text-xs font-medium capitalize transition ${
                          cornerStyle === cs
                            ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        {cs}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Provider & BYOK Card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                AI Provider Selection
              </h2>

              {/* Provider Grid */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                {PROVIDERS_LIST.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id)}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-xs font-medium transition ${
                      provider === p.id
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm ring-1 ring-blue-600 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>

              {/* Model Dropdown */}
              <div className="mt-4">
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 font-mono text-xs text-zinc-800 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                >
                  {(PROVIDER_MODELS[provider] || []).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
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
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-3 pr-10 font-mono text-xs text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-600 dark:text-zinc-400">
                    <input
                      type="checkbox"
                      checked={saveKeyLocally}
                      onChange={(e) => setSaveKeyLocally(e.target.checked)}
                      className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700"
                    />
                    <span>Remember key in browser localStorage</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Trigger Button */}
            <button
              type="button"
              disabled={generating}
              onClick={handleGenerate}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
            >
              {generating ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Generating ({elapsedTime}s)...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  <span>Generate Vector Icon</span>
                  <kbd className="ml-1 rounded bg-blue-700/60 px-1.5 py-0.5 font-mono text-[10px]">⌘↵</kbd>
                </>
              )}
            </button>
          </div>

          {/* ── RIGHT PANEL: PREVIEW & CODE ── */}
          <div className="space-y-6 lg:col-span-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleDownloadSvg}
                      className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      Download SVG
                    </button>
                  </div>
                )}
              </div>

              {/* Visual Display Stage */}
              <div className="relative mt-4 flex min-h-[260px] items-center justify-center rounded-lg border border-zinc-200 bg-checker p-6 dark:border-zinc-800">
                {currentSvg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: currentSvg }}
                    className="transition-all duration-150"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500">
                    <svg className="h-10 w-10 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-xs font-medium">Your generated icon will appear here</p>
                    <p className="mt-0.5 text-[11px]">Type a prompt and press Generate</p>
                  </div>
                )}
              </div>

              {/* Multi-Format Export Tabs */}
              {currentSvg && (
                <div className="mt-6">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
                    <div className="flex gap-1.5">
                      {[
                        { id: 'react', label: 'React' },
                        { id: 'html', label: 'HTML' },
                        { id: 'url', label: 'Data URI' },
                        { id: 'flutter', label: 'Flutter' },
                        { id: 'android', label: 'Android' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setExportTab(tab.id)}
                          className={`rounded px-2.5 py-1 text-xs font-semibold tracking-wider transition ${
                            exportTab === tab.id
                              ? 'bg-blue-600 text-white'
                              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
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

            {/* Session History Strip */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
                      className="group flex flex-col items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 p-2 transition hover:border-blue-500 hover:bg-blue-50/20 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-500"
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
