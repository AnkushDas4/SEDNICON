# Fix SEDNICON Issues Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve security vulnerabilities (XSS, CORS bypass), API contract discrepancies, rate limiting and caching inefficiencies, CLI path/OS issues, and clean up orphaned files while preserving 100% of the existing design UI.

**Architecture:** Edge-first and zero-dependency. Hardens the shared icon resolution pipeline (`api/_lib/icon-resolver.js`), standardizes CORS headers (`api/_lib/cors.js`) to match public API documentation, unifies color normalization across endpoints, fixes rate limiting weighting in `redis.js`, hardens the CLI tool (`bin/sednicon.js`), removes dead files (`js/auth.js`), and adds automated Node tests (`test/`).

**Tech Stack:** JavaScript (ES Modules, Vercel Edge Runtime compatible), Node.js native test runner (`node --test`), HTML5, CSS3.

**Spec:** The issue analysis and findings documented in the conversation.

## Global Constraints
- Preserve 100% of the existing user interface styling and visual layout (no design changes).
- Maintain 0 external npm dependencies in `package.json` (keep edge cold-starts instant).
- All changes in `api/` must remain compatible with Vercel Edge Function environment.

---

### Task 1: Fix SVG Sanitization & SVG Transformations

**Files:**
- Modify: `api/_lib/icon-resolver.js`
- Create: `test/icon-resolver.test.js`

**Interfaces:**
- Consumes: Raw SVG string, icon query, size, cleanColor, anim
- Produces: `sanitizeSvg(svgString)`, `svgTransformer(svgRaw, size, cleanColor, anim)`, `resolveIcon(q, setHint)`

- [ ] **Step 1: Write tests for SVG sanitization and transformation**
Create `test/icon-resolver.test.js` using Node.js built-in `node:test` and `node:assert`:
- Test XSS attack vectors: single-quoted `href='javascript:...'`, newline/tab event handlers `<svg\nonload=...>`, nested `<scr<script>ipt>`.
- Test valid SVGs are preserved without damage.
- Test SVG transformation on SVGs with XML declarations `<?xml ...?>` or leading newlines.
- Test color normalization with `#` and without `#`.
- Test animation generation includes `transform-box: fill-box;` and unique keyframe ids.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test test/icon-resolver.test.js`
Expected: FAIL due to existing sanitizer regex gaps and missing features.

- [ ] **Step 3: Update `api/_lib/icon-resolver.js` implementation**
- Fix `sanitizeSvg`:
  - Broaden event handler detection to match any whitespace or `/` (`[\s/]on\w+`).
  - Strip dangerous tags including `<script>`, `<iframe>`, `<object>`, `<embed>`, `<foreignObject>` even when self-closed or nested.
  - Strip `href` and `xlink:href` containing `javascript:`, `data:`, `vbscript:`, `file:` with single, double, or no quotes.
- Fix `svgTransformer`:
  - Replace `<svg\b` instead of `^<svg` so that leading XML declarations or comments don't break width/height and fill injection.
  - Add `transform-box: fill-box;` to animation rules so animations rotate correctly around glyph center in WebKit/Safari.
- Optimize probing cascade:
  - Reduce redundant mirror roundtrips on misses and timeout safely.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test test/icon-resolver.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
`git add api/_lib/icon-resolver.js test/icon-resolver.test.js && git commit -m "fix(security): harden SVG sanitization and fix transformer"`

---

### Task 2: Standardize CORS Headers & Fix Public API Access

**Files:**
- Modify: `api/_lib/cors.js`
- Modify: `api/sprite.js`
- Test: `test/cors.test.js`

**Interfaces:**
- Consumes: Incoming `Request` object
- Produces: `corsHeaders(request, extra)` returning headers with `Access-Control-Allow-Origin: *` for public icon rendering and preflight

- [ ] **Step 1: Write tests for CORS headers**
Create `test/cors.test.js`:
- Test that public GET/OPTIONS/POST requests receive `Access-Control-Allow-Origin: *` as documented in `docs.html`.
- Test OPTIONS preflight headers have `Access-Control-Allow-Methods: GET, POST, OPTIONS`.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test test/cors.test.js`
Expected: FAIL due to origin whitelist returning `sednicon.sednium.com` for external origins.

- [ ] **Step 3: Update `api/_lib/cors.js` and `api/sprite.js`**
- Set `Access-Control-Allow-Origin: *` by default in `cors.js` for public CDN compatibility.
- Set `Access-Control-Allow-Methods: GET, POST, OPTIONS`.
- Ensure `corsHeaders` includes proper caching headers for preflights (`Access-Control-Max-Age: 86400`).

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test test/cors.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
`git add api/_lib/cors.js api/sprite.js test/cors.test.js && git commit -m "fix(cors): allow public origin access matching documentation"`

---

### Task 3: Fix Rate Limiting Weighting & Consolidate Caching

**Files:**
- Modify: `api/_lib/redis.js`
- Modify: `api/render.js`
- Modify: `api/sprite.js`
- Test: `test/rate-limit.test.js`

**Interfaces:**
- Consumes: `ip`, `weight`
- Produces: `checkRateLimit(ip, weight = 1)`

- [ ] **Step 1: Write test for rate limiting with weights**
Create `test/rate-limit.test.js`:
- Test rate limit allows requests up to max limit.
- Test weight parameter counts towards the limit correctly (e.g. weight of 10 increments count by 10).
- Test key doesn't leak batch size into the identifier.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test test/rate-limit.test.js`
Expected: FAIL because `checkRateLimit` ignores weight.

- [ ] **Step 3: Implement weighted rate limit & consolidate cache in `render.js`**
- Update `checkRateLimit(ip, weight = 1)` in `redis.js` to increment `record.count += weight`.
- In `api/sprite.js`, call `checkRateLimit(clientIp, Math.max(1, Math.min(50, icons.length)))` instead of appending `:batch:${icons.length}` to the key string.
- In `api/render.js`, remove redundant `memCache` and rely on `cacheGet` and `cacheSet` from `redis.js`.
- Fix color parsing in `render.js` to accept hex colors with leading `#` (e.g. `%23ff6600` or `#ff6600`).

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test test/rate-limit.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
`git add api/_lib/redis.js api/render.js api/sprite.js test/rate-limit.test.js && git commit -m "fix(perf): implement weighted rate limiting and consolidate edge cache"`

---

### Task 4: Fix AI Generator Endpoint Edge Cases

**Files:**
- Modify: `api/generate.js`
- Test: `test/generate.test.js`

**Interfaces:**
- Consumes: POST body `{ prompt, provider, model, apiKey, color, size, ... }`
- Produces: JSON `{ svg, size, color, provider, model }` with CORS headers

- [ ] **Step 1: Write test for `api/generate.js` helper validation**
Create `test/generate.test.js`:
- Test that missing API key returns 400 with CORS and JSON headers.
- Test that hex color with `#` doesn't produce `##color`.
- Test that invalid provider returns 400 with a descriptive error rather than attempting an empty fetch URL.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test test/generate.test.js`
Expected: FAIL.

- [ ] **Step 3: Update `api/generate.js`**
- Ensure 400 responses include JSON headers and CORS headers.
- Sanitize `color`: `const cleanColor = (color || '000000').replace(/^#/, '');` and replace with `#${cleanColor}`.
- Validate `provider` against supported list (`['gemini', 'openai', 'anthropic', 'groq', 'mistral', 'together', 'nvidia', 'openrouter']`) before constructing request; return 400 if unknown.
- Safeguard error extraction when `data.error` is an object.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test test/generate.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
`git add api/generate.js test/generate.test.js && git commit -m "fix(api): handle generate error cases and color normalization"`

---

### Task 5: Improve Sprite Generation & CLI Script

**Files:**
- Modify: `api/sprite.js`
- Modify: `bin/sednicon.js`
- Test: `test/cli.test.js`

**Interfaces:**
- Consumes: CLI args
- Produces: Safe SVG download file, error message on invalid commands

- [ ] **Step 1: Write test for CLI input validation**
Create `test/cli.test.js`:
- Test unknown commands print help / error and exit with non-zero.
- Test icon name sanitization (e.g. `lucide:rocket` becomes `lucide-rocket.svg` or safe filename without colons).
- Test path traversal attempts (`../../test`) are sanitized to safe filename.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test test/cli.test.js`
Expected: FAIL.

- [ ] **Step 3: Update `bin/sednicon.js` and `api/sprite.js`**
- In `bin/sednicon.js`:
  - Sanitize output filename: replace colons `:` with `-`, strip directory traversal sequences (`path.basename(iconName)`).
  - Handle unknown commands by displaying error and help, exiting with status 1.
- In `api/sprite.js`:
  - Use semantic icon ID `<symbol id="${safeId}">` (where `safeId` is `icon-${r.q.replace(/[^a-zA-Z0-9_-]/g, '-')}` or `r.q`) instead of just `icon-${i}`.
  - Remove dead code `resolveSVG`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test test/cli.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
`git add bin/sednicon.js api/sprite.js test/cli.test.js && git commit -m "fix(cli): sanitize filenames and handle unknown commands"`

---

### Task 6: Clean Up Dead Code, Relative Base URL & Spec Fixes

**Files:**
- Delete: `js/auth.js`
- Modify: `library.html`
- Modify: `openapi.json`
- Modify: `package.json`

**Interfaces:**
- Dynamic relative API base URL in `library.html` while keeping exact same UI styling and features.
- Accurate OpenAPI spec and clean repository without orphaned files.

- [ ] **Step 1: Remove orphaned `js/auth.js`**
Delete `js/auth.js` and remove any reference if existing.

- [ ] **Step 2: Update `library.html` base URL without changing UI**
- Change `const BASE = 'https://sednicon.sednium.com/api/render';` to use relative endpoint `window.location.origin + '/api/render'` or `/api/render` when accessed in browser, falling back to production if origin is `file://`.
- Keep 100% of HTML, CSS, layouts, styles, and controls identical.

- [ ] **Step 3: Fix `openapi.json` metadata & formats**
- Update GitHub repository URL from `IconFlow` to `SEDNICON`.
- Align format parameter description with actual supported behavior.

- [ ] **Step 4: Update `package.json`**
- Add `"test": "node --test"` to `scripts` in `package.json` so test suite is easily runnable.

- [ ] **Step 5: Run full test suite**
Run: `npm test`
Expected: All tests PASS.

- [ ] **Step 6: Commit**
`git add -A && git commit -m "chore: clean orphaned files, update metadata and test scripts"`
