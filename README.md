# 🎨 Sednicon - Headless Design API

![Sednicon](https://img.shields.io/badge/Status-Operational-success?style=flat-square)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

**A headless design API for icons that just work.**

Sednicon serves dynamic SVG icons directly over a URL — no packages, no build step, no bundler configuration. It unifies the icon sets developers already reach for (Material Design, FontAwesome, and more) with custom brand logos behind a single, predictable endpoint, and pairs that with a fully private, browser-based AI icon generator for the one-off cases a library can't cover.

The premise is simple: an icon should be as easy to drop into a project as an image is. Name it, style it, paste the URL.

```
https://sednicon.sednium.com/api/render?q=rocket&color=ff6600&size=32&anim=spin
```

That's the whole API surface. Everything else in this document is detail.

---

## Why Sednicon

Every frontend project eventually accumulates the same tax: an icon package installed for three glyphs, a `node_modules` folder bloated with SVGs you'll never render, and a build pipeline that now needs to know about yet another asset type. Sednicon exists to remove that tax entirely.

Because it's a URL, it works anywhere a URL works — raw HTML, React, Vue, Webflow, Framer, WordPress — without a single `npm install`. Because it runs on the edge with zero database dependencies, it resolves in under 50ms worldwide. And because customization lives in query parameters, changing an icon's color, size, or animation is a one-line edit, not a re-import.

## Features

- **Universal Compatibility** — drops into raw HTML, React, Vue, Webflow, Framer, and WordPress with no framework-specific tooling.
- **On-the-Fly Customization** — color (hex or named), size, and animation (`spin`, `pulse`, `bounce`) are all controlled via URL parameters.
- **Advanced Developer Exports** — export any icon to SVG, PNG, Data URI, React JSX, Flutter (`SvgPicture`), or Android Vector Drawable (XML).
- **Edge-Ready & Serverless** — built for Vercel Edge Functions, with a pure in-memory cache and no database dependency.
- **100% Private AI Generation** — bring your own API key (OpenAI, Gemini, Anthropic, Mistral, Groq, Nvidia, and others). Keys live in your browser's `localStorage` and are never sent to or stored on a server.
- **Smart Fallbacks & Resiliency** — high-fidelity brand SVGs are backed by the multi-CDN Iconify network, with automatic failover and semantic search when an exact match isn't found.
- **Batch Exporting** — select multiple icons in the Library and download a custom SVG sprite sheet in one pass.

## Usage

No heavy npm packages required. Use the URL directly, or reach for the zero-install CLI.

### The Terminal CLI (npx)

Download icons straight into your project folder:

```bash
npx sednicon get rocket --color ff6600 --size 32
```

### HTML & No-Code

The simplest integration — ideal for Webflow, WordPress, or plain HTML:

```html
<img 
  src="https://sednicon.sednium.com/api/render?q=google&color=red&size=24&anim=bounce" 
  alt="Google Logo" 
  width="24" 
/>
```

### React & Next.js

Wrap the endpoint in a component and drive it with props:

```jsx
export const Icon = ({ name, color, size = 24 }) => (
  <img 
    src={`https://sednicon.sednium.com/api/render?q=${name}&color=${color}&size=${size}`}
    className="w-6 h-6"
    alt={`${name} icon`}
  />
);

// Usage: <Icon name="github" color="black" />
```

### CSS Backgrounds

Well suited to pseudo-elements and custom buttons:

```css
.btn-icon {
  background-image: url('https://sednicon.sednium.com/api/render?q=menu&color=white&size=20');
  background-repeat: no-repeat;
  background-position: center;
}
```

## API Parameters

| Parameter | Type   | Default  | Example        | Description                                       |
|-----------|--------|----------|-----------------|---------------------------------------------------|
| `q`       | string | `circle` | `rocket`, `google` | The name of the icon or brand.                  |
| `color`   | string | `black`  | `FF0000`, `blue`   | Hex code (without `#`) or CSS color name.       |
| `size`    | number | `24`     | `48`, `128`         | The width and height of the SVG, in pixels.     |
| `anim`    | string | `null`   | `spin`, `pulse`     | Optional CSS animation (`spin`, `pulse`, `bounce`). |
| `set`     | string | `null`   | `lucide`, `mdi`     | Force a specific icon set, bypassing fallbacks. |

## Project Structure

Sednicon is split into a frontend configurator and a lightweight, zero-database backend edge function:

```
sednicon/
├── api/
│   ├── _lib/
│   │   ├── cors.js           # Shared CORS headers
│   │   ├── icon-resolver.js  # Core logic, mirror failovers, aliases, and sanitization
│   │   └── redis.js          # In-memory edge cache and rate limiter
│   ├── generate.js           # Secure, headless proxy for AI generation
│   ├── render.js             # The main API Edge Function (fetches & serves SVGs)
│   ├── sprite.js             # Batch icon fetching for custom sprite sheets
│   └── status.js             # Health check endpoint for dependencies
├── bin/
│   └── sednicon.js           # Terminal CLI execution script
├── index.html                # The frontend UI (landing page & URL configurator)
├── library.html              # The icon library explorer & sprite cart
├── generate.html              # 100% private AI icon generator UI
├── docs.html                  # Documentation UI
├── status.html                # Live status UI
├── package.json               # Dependencies & scripts
├── polish.css                 # Global UI polish layer
└── vercel.json                # Vercel routing configuration
```

---

*Part of the [Sednium](https://sednium.com) ecosystem.*
