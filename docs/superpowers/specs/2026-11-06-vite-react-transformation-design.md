# Sednicon: Vite + React Transformation & Human-Crafted UI Design Spec

**Date:** 2026-11-06  
**Status:** Approved for Implementation  
**Project:** Sednicon (github.com/AnkushDas4/SEDNICON)

---

## 1. Executive Summary & Goals

Transform Sednicon from five standalone HTML files (`index.html`, `library.html`, `generate.html`, `docs.html`, `status.html`) into a modern, production-grade **Vite + React** single-page application with **Tailwind CSS**.

### Key Objectives
1. **Human-Crafted, Anti-Slop UI Aesthetic**:
   - Eliminate custom cursor hacks (`cursor: none` and floating circles), restore native OS mouse interaction.
   - Enable native browser text selection across the entire application.
   - Replace neon gradients, excessive glowing blurs, and fake macOS window chrome with a refined, tactile developer-tool aesthetic (inspired by Linear, Vercel, and Raycast).
   - Use a zinc/slate neutral palette with hairline 1px borders and a purposeful blue accent.
2. **Unified React SPA with Dedicated Page Views**:
   - Convert pages into modular React routes: Home (`/`), Library (`/library`), Generate (`/generate`), Docs (`/docs`), Status (`/status`).
   - Shared `Layout` containing a sticky `Navbar` and minimalist `Footer`.
   - Global `ThemeContext` (Dark/Light mode with system preference auto-detection and persistence).
   - Global `CartContext` for persistent batch icon selection and sprite generation across page navigation.
3. **Preserve 100% of Backend Serverless API**:
   - Existing Vercel Edge functions (`/api/render`, `/api/generate`, `/api/sprite`, `/api/status`) remain completely functional and untouched.
   - Vercel routing configured so `/api/*` proxies to edge handlers and all other routes serve the SPA.
4. **Project Identity**:
   - Update repository and package naming references cleanly to **Sednicon**.

---

## 2. Technology Stack

- **Build Tool**: Vite 6+
- **Frontend Framework**: React 18 / 19 + ReactDOM
- **Routing**: `react-router-dom` (v6+)
- **Styling**: Tailwind CSS + Custom CSS Variables for theme tokens
- **Typography**: `Inter` (UI elements, headings, labels) + `JetBrains Mono` (code, parameters, dimensions)
- **Icons**: Clean SVG vectors matching native design tokens
- **Deployment**: Vercel (Edge Functions in `/api`, Static Vite SPA in `/dist`)

---

## 3. Architecture & File Structure

```
SEDNICON/
├── api/                           # Vercel Edge Functions (Preserved)
│   ├── _lib/
│   │   ├── icon-resolver.js       # Resolution pipeline & SVG sanitizer
│   │   ├── redis.js               # Edge cache & rate limiter
│   │   └── cors.js                # CORS headers
│   ├── render.js                  # GET /api/render
│   ├── generate.js                # POST /api/generate
│   ├── sprite.js                  # POST /api/sprite
│   └── status.js                  # GET /api/status
├── bin/
│   └── sednicon.js                # Node CLI script (npx sednicon)
├── public/                        # Static assets (favicons, og-image, robots, sitemap)
│   ├── favicon.svg
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── og-image.png
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── main.jsx                   # React root entry
│   ├── App.jsx                    # Router, ThemeProvider & CartProvider
│   ├── index.css                  # Tailwind directives, font imports, design tokens
│   ├── context/
│   │   ├── ThemeContext.jsx       # Theme state & toggle (dark / light)
│   │   └── CartContext.jsx        # Batch sprite selection state
│   ├── components/
│   │   ├── Layout.jsx             # App layout wrapper (Navbar + Content + Footer)
│   │   ├── Navbar.jsx             # Fixed header with logo, nav links & theme toggle
│   │   ├── Footer.jsx             # Minimal footer with status indicator & links
│   │   ├── CodeBlock.jsx          # Syntax-styled code block with copy action
│   │   ├── Toast.jsx              # Feedback toast for copy/download actions
│   │   └── CartDrawer.jsx         # Bottom drawer for Library icon cart
│   ├── pages/
│   │   ├── Home.jsx               # Hero, live icon configurator, features, ticker
│   │   ├── Library.jsx            # 200k+ icon catalog explorer, search & filters
│   │   ├── Generate.jsx           # AI Icon workbench (BYOK, live preview, multi-exports)
│   │   ├── Docs.jsx               # Interactive API docs & quickstarts
│   │   └── Status.jsx             # Real-time latency & upstream status monitor
│   └── utils/
│       └── api.js                 # API endpoint builder & helpers
├── index.html                     # Vite HTML template with metadata
├── vite.config.js                 # Vite configuration with API proxy for dev
├── tailwind.config.js             # Tailwind theme extension & colors
├── package.json                   # Updated dependencies, scripts & "sednicon" name
├── vercel.json                    # Rewrite rules for SPA and API
└── test/                          # Existing test suite for API & CLI
```

---

## 4. Design System & Anti-Slop Guidelines

1. **Native Cursor & Selection**:
   - Zero custom cursor elements. No pointer event traps.
   - Text selection enabled by default everywhere (`user-select: text`).
2. **Color Palette**:
   - Backgrounds: Clean crisp white (`#ffffff`) in light mode; deep zinc-950 (`#09090b`) in dark mode.
   - Surfaces: Neutral zinc-50 / zinc-100 (`#f4f4f5`) light; zinc-900 (`#18181b`) dark.
   - Borders: Subdued hairline dividers (`#e4e4e7` light, `#27272a` dark).
   - Accents: Direct electric blue (`#2563eb` light, `#3b82f6` dark) used purposefully on active states, focus rings, and primary actions.
3. **Typography**:
   - Headers & UI: `Inter`, weights 400, 500, 600, 700. Clean line heights and tight letter spacing (`tracking-tight`).
   - Code & Data: `JetBrains Mono`, weights 400, 500. Used for URLs, query strings, dimensions, and CLI snippets.
4. **Micro-Interactions**:
   - Keyboard affordances surfaced clearly with keycaps: `<kbd>/</kbd>` to focus search, `<kbd>⌘↵</kbd>` to generate.
   - Tactile button press feedback (`active:scale-[0.98]`).
   - Accessible focus rings: `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none`.

---

## 5. Component & Page Specifications

### 5.1 Navbar (`src/components/Navbar.jsx`)
- Fixed top navigation with backdrop blur (`backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800`).
- Left: Logo with blue status pill (`Sednicon`).
- Center/Right: Nav links (`Library`, `Generate`, `Docs`, `Status`) with active route indicator.
- Far Right: Theme toggle button (Sun/Moon icons) and GitHub repository link.

### 5.2 Home (`src/pages/Home.jsx`)
- **Hero Section**:
  - Direct value proposition: "One URL. Every Icon. Zero Setup."
  - Call-to-action buttons: "Explore Library" and "Generate with AI".
- **Interactive Icon Configurator**:
  - Live preview stage with subtle checkerboard canvas.
  - Controls: Icon name query, color picker with hex text sync, size selector, animation selector (`spin`, `pulse`, `bounce`).
  - Code export tabs (`URL`, `HTML`, `React`, `Vue`, `CSS`) with one-click copy and instant visual feedback.
- **Features Grid**:
  - 6 clean cards detailing zero-dependency URLs, sub-50ms edge caching, multi-set fallbacks, batch exports, and privacy-first AI.
- **Ticker Track**:
  - Infinite marquee highlighting supported sets and brand integrations.

### 5.3 Library (`src/pages/Library.jsx`)
- **Header & Search Bar**:
  - Fast search input with `<kbd>/</kbd>` focus shortcut and instant fuzzy filtering.
  - Size controls (16, 24, 32, 48, 64) and color picker.
- **Category Navigation**:
  - Segmented pills: `All`, `Brands`, `Social`, `UI`, `Developer`, `Finance`, `Media`, `Files`, `Comm`, `Actions`.
- **Icon Grid**:
  - Responsive grid of icon cards.
  - Hover displays tooltip with icon name.
  - Clicking an icon adds/removes it from the batch cart.
- **Batch Cart Drawer (`src/components/CartDrawer.jsx`)**:
  - Floating bottom drawer appearing when 1+ icons are selected.
  - Shows selected count, "Clear" button, and "Download SVG Sprite" action calling `/api/sprite` or building clean `<symbol>` sheet.

### 5.4 Generate (`src/pages/Generate.jsx`)
- **Workbench Layout**:
  - **Left (Controls Panel)**:
    - Textarea for icon description with 300-char counter and `<kbd>⌘↵</kbd>` shortcut.
    - Style controls: Size, stroke width, color picker, render style toggle (Fill vs Stroke), and corner style (Round vs Sharp).
    - Provider Grid: 8 supported providers (Gemini, OpenAI, Claude, Groq, Mistral, Together, Nvidia, OpenRouter) with crisp vector logos and active model selector.
    - API Key Input: Password input with visibility toggle, "Save locally in browser" checkbox (`localStorage`), and privacy note.
    - Primary "Generate Icon" button with live elapsed time ticker.
  - **Right (Preview & Code)**:
    - Centered preview stage with checkered transparency canvas.
    - Real-time color/size adjustment: changing color or size instantly updates the rendered SVG without re-generating!
    - Action buttons: Copy SVG, Copy Data URI, Download SVG file.
    - Multi-platform code tabs: `URL (Data URI)`, `HTML`, `React`, `Flutter`, `Android Vector XML`.
    - Session History strip: Click any previous icon to inspect and re-export.

### 5.5 Docs (`src/pages/Docs.jsx`)
- Structured developer guide covering:
  - Quickstart examples (`<img src="...">`, React component, CLI `npx sednicon`).
  - Query parameters table (`q`, `color`, `size`, `anim`, `set`).
  - Supported icon sets and fallback hierarchy.
  - Batching (`/api/sprite`) and health status endpoint documentation.

### 5.6 Status (`src/pages/Status.jsx`)
- Real-time health monitor:
  - Fetches `/api/status` on mount and provides a "Refresh" button.
  - Displays upstream response latency in milliseconds with latency-based badge colors.
  - Service breakdown: Icon Render API, AI Generation API, Iconify Network.
  - Clean endpoint index table.

---

## 6. Vercel Configuration & Deployment

`vercel.json` will be updated to handle Vite client-side routing while preserving the `/api/` edge routes:

```json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 7. Quality Assurance & Verification

1. **Unit & API Tests**:
   - Run existing test suite (`npm test`) to guarantee all 21 API tests pass.
2. **Build Verification**:
   - `npm run build` must succeed without warnings or broken imports.
3. **Feature Parity**:
   - Verify all 5 views match full functionality: live configurator, library search & cart, AI generator with live recoloring, documentation, and live status.
