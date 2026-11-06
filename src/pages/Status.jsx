import React, { useState, useEffect } from 'react';

export default function Status() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const isOperational = data?.status === 'operational';
  const upstreamMs = data?.upstream_check_ms;

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-sans text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
              System Telemetry & Status
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Real-time monitoring of Sednicon edge nodes and upstream dependencies.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-1.5 self-start rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 active:scale-95 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:self-auto"
          >
            <svg
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? 'Checking...' : 'Refresh'}</span>
          </button>
        </div>

        {/* ── OVERALL STATUS BANNER ── */}
        <div className="mt-8">
          {error ? (
            <div className="flex items-center gap-4 rounded-xl border border-red-500/30 bg-red-50/50 p-5 dark:border-red-500/30 dark:bg-red-950/20">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <div>
                <h2 className="text-base font-semibold text-red-900 dark:text-red-200">
                  Unable to reach status endpoint
                </h2>
                <p className="text-xs text-red-700 dark:text-red-400">
                  {error}. Check network connectivity.
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`flex items-center justify-between rounded-xl border p-5 shadow-sm transition ${
                isOperational
                  ? 'border-emerald-500/30 bg-emerald-50/30 dark:border-emerald-500/20 dark:bg-emerald-950/20'
                  : 'border-amber-500/30 bg-amber-50/30 dark:border-amber-500/20 dark:bg-amber-950/20'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${
                    isOperational ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}
                >
                  {isOperational ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </span>
                <div>
                  <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                    {data?.status === 'operational'
                      ? 'All Systems Operational'
                      : data?.status === 'degraded'
                      ? 'Degraded Performance'
                      : 'Checking Systems...'}
                  </h2>
                  <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    Last checked: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '—'}
                  </p>
                </div>
              </div>

              {upstreamMs !== undefined && (
                <div className="hidden text-right sm:block">
                  <span className="font-mono text-xs text-zinc-400 uppercase">Upstream Latency</span>
                  <div
                    className={`font-mono text-lg font-bold ${
                      upstreamMs < 200
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : upstreamMs < 500
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {upstreamMs}ms
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SERVICES HEALTH BREAKDOWN ── */}
        <div className="mt-8 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Components & Dependencies
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                id: 'render',
                name: 'Render API',
                desc: 'Edge SVG resolver & transformer',
                status: 'operational',
              },
              {
                id: 'generate',
                name: 'Generate API',
                desc: 'BYOK Multi-LLM vector compiler',
                status: 'operational',
              },
              {
                id: 'iconify',
                name: 'Iconify Upstream',
                desc: '200k+ global icon catalog CDN',
                status: data?.dependencies?.iconify || 'operational',
              },
            ].map((svc) => (
              <div
                key={svc.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {svc.name}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {svc.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {svc.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SYSTEM TELEMETRY ── */}
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Node Configuration
          </h2>

          <div className="mt-3 grid grid-cols-3 divide-x divide-zinc-200 text-center dark:divide-zinc-800">
            <div className="px-3">
              <span className="text-[11px] text-zinc-500">Engine Version</span>
              <div className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {data?.version || 'v3.5.0'}
              </div>
            </div>
            <div className="px-3">
              <span className="text-[11px] text-zinc-500">Region</span>
              <div className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase">
                {data?.region || 'Global Edge'}
              </div>
            </div>
            <div className="px-3">
              <span className="text-[11px] text-zinc-500">Protocol</span>
              <div className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                HTTP/2 & HTTP/3
              </div>
            </div>
          </div>
        </div>

        {/* ── ENDPOINTS LIST ── */}
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Live Edge Endpoints
            </h2>
          </div>

          <div className="divide-y divide-zinc-200 font-mono text-xs dark:divide-zinc-800">
            {[
              { method: 'GET', path: '/api/render', desc: 'Vector icon rendering & colorization' },
              { method: 'GET', path: '/api/sprite', desc: 'Batch SVG symbol sprite compiler' },
              { method: 'POST', path: '/api/generate', desc: 'BYOK AI Vector synthesis' },
              { method: 'GET', path: '/api/status', desc: 'Health check and telemetry JSON' },
            ].map((ep) => (
              <div key={ep.path} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      ep.method === 'GET'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {ep.path}
                  </span>
                </div>
                <span className="hidden font-sans text-xs text-zinc-500 sm:inline dark:text-zinc-400">
                  {ep.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
