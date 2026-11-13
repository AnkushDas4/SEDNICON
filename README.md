# 🎨 Sednicon - Multi-Provider Headless Icon Infrastructure

![Sednicon](https://img.shields.io/badge/Status-Operational-success?style=flat-square)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Version](https://img.shields.io/badge/Version-v3.5.0-blue?style=flat-square)

**A resilient, multi-provider icon resolution engine that eliminates single-upstream dependencies.**

Sednicon streams vector SVG icons directly over a clean URL — zero runtime packages, zero build-step overhead, and zero single-point-of-failure vulnerabilities. It coordinates multiple independent upstream sources (direct npm CDNs, GitHub repos, specialized catalog APIs, and Universal Iconify JSON package extractors) behind intelligent tier routing, hedged concurrent requests, circuit breakers, and edge caching.

```
https://sednicon.sednium.com/api/render?q=lucide:rocket&color=2563eb&size=32&anim=pulse
```

---

## ⚡ Multi-Provider Architecture

Sednicon coordinates 10 decoupled logical layers:

1. **Request Normalization & Validation**: Query sanitation, synonym aliasing (`gear` → `settings`), and style parameter mapping.
2. **L1 In-Memory LRU Cache**: High-speed bounded edge cache with fine-grained TTL.
3. **L2 Redis Cache**: Non-blocking Upstash REST / Redis integration with automatic fallback to L1 if unreachable.
4. **Provider Orchestration**: Request coalescing (in-flight deduplication) and hedged concurrent upstream requests.
5. **Primary Provider Resolution**: Direct npm CDNs (jsDelivr) for instant SVG resolution.
6. **Secondary Provider Resolution**: unpkg fallback mirror and Universal Iconify JSON package parser.
7. **Specialized Providers**: Devicon (tech stacks), SVGL (modern logos), and Cryptocurrency Icons.
8. **SVG Validation & Sanitization**: Multi-pass security pipeline rejecting scripts, event handlers, XXE injections, and unquoted vectors while preserving gradients, clipPaths, and masks.
9. **SVG Transformation**: Responsive sizing, animations (`spin`, `pulse`, `bounce`), stroke customization, and automatic multi-color logo preservation.
10. **Cache Persistence & Streamed Response**: Immediate edge streaming with `X-Sednicon-Provider` and `X-Sednicon-Cache` diagnostic headers.

---

## 📦 Supported Providers & Collections

| Provider ID | Provider Name | Tier | Supported Collections | Style Variants |
|---|---|---|---|---|
| `jsdelivr-npm` | jsDelivr npm CDN | Tier 2 | `lucide`, `simple-icons`, `tabler`, `heroicons`, `phosphor`, `bootstrap-icons`, `feather`, `octicons` | `outline`, `filled`, `solid`, `regular`, `duotone` |
| `unpkg-npm` | unpkg npm CDN | Tier 3 | `lucide`, `simple-icons`, `tabler`, `heroicons`, `phosphor`, `bootstrap-icons`, `feather`, `octicons` | `outline`, `filled`, `solid`, `regular`, `duotone` |
| `iconify-json` | Universal Iconify JSON | Tier 3 | 150+ Iconify sets (`material-symbols`, `mdi`, `fluent`, `carbon`, `ri`, etc.) | Fully reconstructed from offline collection JSON packages |
| `iconify-api` | Iconify API Cluster | Tier 3 | All public Iconify sets via 3-mirror failover (`iconify.design`, `simplesvg.com`, `unisvg.com`) | All upstream styles |
| `devicon` | Devicon | Tier 4 | `devicon` developer & programming language icons | `original`, `plain` |
| `svgl` | SVGL | Tier 4 | `svgl` curated company & product brand logos | `light`, `dark` |
| `crypto-icons` | Cryptocurrency Icons | Tier 4 | `crypto`, `cryptocurrency` token symbols | `color`, `black`, `white`, `icon` |

---

## 🛡️ Upstream Resilience & Circuit Breakers

Each upstream provider is guarded by an independent 3-state circuit breaker (`CLOSED`, `OPEN`, `HALF_OPEN`):
- **Hedged Requests**: Primary provider is started first. If it does not resolve within 350ms, the secondary provider is started concurrently, returning the fastest valid SVG.
- **Circuit Breaker**: After 5 consecutive upstream failures or timeouts, the circuit transitions to `OPEN` for a 30-second cooldown period, preventing request amplification.
- **Request Coalescing**: Simultaneous requests for the same uncached icon share a single in-flight upstream promise.
- **Failover Chain**: If all external CDNs fail, Sednicon gracefully returns a clean fallback SVG placeholder.

---

## 🔌 API Endpoints

### 1. `GET /api/render`
Render dynamic vector icons as SVG.

```bash
curl "https://sednicon.sednium.com/api/render?q=devicon:python&style=original&size=48"
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `q` | `string` | `circle` | Icon name or `prefix:name` (e.g. `rocket`, `lucide:rocket`, `devicon:react`, `crypto:btc`). |
| `color` | `string` | `000000` | Hex code or CSS color name. Ignored on multi-color logos unless explicit recolor is needed. |
| `size` | `number` | `24` | Width and height in pixels (1–2048). |
| `anim` | `string` | `null` | Optional keyframe animation: `spin`, `pulse`, `bounce`. |
| `style` | `string` | `null` | Style variant: `outline`, `filled`, `solid`, `regular`, `duotone`, `color`, `black`, `original`, `plain`, `light`, `dark`. |
| `set` | `string` | `null` | Optional target collection prefix hint. |

### 2. `GET` / `POST /api/sprite`
Batch icon resolution returning SVG symbol sprites or JSON arrays:

```bash
# Query-based GET batching
curl "https://sednicon.sednium.com/api/sprite?icons=github,twitter,linkedin&size=24&color=000000"
```

### 3. `GET /api/status`
Operational health check and dependency telemetry.

### 4. `GET /api/health/providers`
Safe telemetry showing circuit states, rolling average latencies, and success rates across all registered providers:

```json
{
  "status": "operational",
  "timestamp": "2026-11-08T00:27:00.000Z",
  "providers": [
    {
      "id": "jsdelivr-npm",
      "health": "operational",
      "circuitState": "CLOSED",
      "avgLatencyMs": 38.4,
      "successRate": 1.0,
      "totalRequests": 142
    }
  ],
  "cache": {
    "l1Items": 28,
    "l2Status": "connected"
  }
}
```

---

## 🧰 Command-Line Interface

Fetch an icon without adding a runtime dependency:

```bash
npx sednicon get lucide:rocket --size 48 --color 2563eb --out ./src/assets/rocket.svg
```

Write a React component instead, or print a reusable endpoint URL:

```bash
npx sednicon get terminal --format react --out ./src/icons/TerminalIcon.jsx
npx sednicon get heart --format url
npx sednicon help
```

`--out` (also `--output`) accepts a filename or a directory. The CLI supports `svg`, `react`/`jsx`, and `url` formats.

---

## 💻 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL for distributed L2 cache | Optional (falls back to L1) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Bearer token | Optional |
| `VERCEL_REGION` | Automatic Vercel deployment edge region | Automatic |

---

*Part of the [Sednium](https://sednium.com) ecosystem.*
