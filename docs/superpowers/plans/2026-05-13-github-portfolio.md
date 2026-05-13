# github-portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a statically-rendered personal portfolio for github.com/natadecua that refreshes weekly from the GitHub API, displays each repo as a generative WebGL "specimen", and meets the design principles in `.impeccable.md`.

**Architecture:** Astro 4 static site on Cloudflare Pages. A scheduled GitHub Action (Sunday 03:00 UTC) fetches repo data with a fine-grained PAT, filters it through `portfolio.config.json`, sanitizes READMEs, commits `src/data/portfolio.json` + per-repo markdown + per-repo SVG fallbacks. Astro reads that data at build time. Only `<Specimen>` components hydrate on the client (React Three Fiber islands); everything else is static HTML.

**Tech Stack:** Astro 4, React 18 (only for R3F islands), React Three Fiber, Three.js, Octokit (REST), Vitest, Playwright, pnpm, GitHub Actions, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-05-13-github-portfolio-design.md`

---

## File Structure

```
.
├── .impeccable.md                              # design context (exists)
├── CLAUDE.md                                   # design context mirror (exists)
├── .gitignore                                  # exists
├── .github/workflows/
│   └── weekly-sync.yml                         # cron + manual trigger Action
├── astro.config.mjs                            # Astro config (static output, R3F integration)
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── portfolio.config.json                       # allowlist + ordering
├── scripts/
│   ├── fetch-github.mjs                        # Octokit pipeline, runs in Action and locally
│   ├── sanitize-readme.mjs                     # README sanitizer (pure fn)
│   ├── filter-repos.mjs                        # allowlist filter (pure fn)
│   ├── build-specimens.mjs                     # pre-rasterize SVG fallback specimens
│   └── specimen-seed.mjs                       # deterministic seed→geometry params (shared by SVG + R3F)
├── src/
│   ├── data/
│   │   ├── portfolio.json                      # committed weekly by the Action
│   │   └── readmes/                            # one .md per repo, committed weekly
│   ├── styles/
│   │   ├── tokens.css                          # CSS custom properties from spec
│   │   ├── reset.css
│   │   └── global.css                          # typography, layout primitives
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── SpecimensGrid.astro
│   │   ├── Specimen.tsx                        # React, R3F, client:visible island
│   │   ├── SpecimenFallback.astro              # inline SVG, no JS
│   │   ├── ProjectDetail.astro                 # view-transition expansion
│   │   ├── Rhythm.astro                        # typographic 52-week chart
│   │   ├── Footer.astro
│   │   └── ThemeToggle.astro                   # data-theme override
│   ├── lib/
│   │   ├── format.ts                           # relative-time, percent, etc.
│   │   └── seedRandom.ts                       # mulberry32 PRNG
│   └── pages/
│       └── index.astro                         # single-page entry
├── public/
│   ├── specimens/                              # generated SVG fallbacks
│   └── fonts/                                  # self-hosted webfonts
└── tests/
    ├── unit/
    │   ├── filter-repos.test.mjs
    │   ├── sanitize-readme.test.mjs
    │   └── specimen-seed.test.mjs
    └── e2e/
        └── smoke.spec.ts                       # Playwright build smoke test
```

Each file has one responsibility. The three pipeline scripts (`filter-repos`, `sanitize-readme`, `specimen-seed`) are pure functions so they can be unit-tested without network calls. `fetch-github.mjs` is the only file that touches Octokit.

---

## Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml` (not needed — single package; skip)
- Create: `tsconfig.json`
- Create: `astro.config.mjs`
- Create: `.nvmrc`
- Create: `.gitignore` (extend existing)

- [ ] **Step 1: Initialize Node project with pnpm**

Run from repo root:
```bash
corepack enable
corepack prepare pnpm@9.12.0 --activate
pnpm init
```

- [ ] **Step 2: Pin Node version**

Create `.nvmrc`:
```
20.18.0
```

- [ ] **Step 3: Install runtime + dev dependencies**

```bash
pnpm add astro@^4.16.0 @astrojs/react@^3.6.2 @astrojs/check@^0.9.0 react@^18.3.1 react-dom@^18.3.1 three@^0.169.0 @react-three/fiber@^8.17.10 @react-three/drei@^9.114.0 @octokit/rest@^21.0.2
pnpm add -D typescript@^5.6.3 @types/react@^18.3.11 @types/react-dom@^18.3.0 @types/three@^0.169.0 vitest@^2.1.3 @vitest/coverage-v8@^2.1.3 playwright@^1.48.0 @playwright/test@^1.48.0 jsdom@^25.0.1
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"]
    }
  },
  "include": ["src", "scripts", "tests"]
}
```

- [ ] **Step 5: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://natadecua.dev',
  output: 'static',
  integrations: [react()],
  vite: {
    ssr: { noExternal: ['three', '@react-three/fiber', '@react-three/drei'] },
  },
  build: { inlineStylesheets: 'auto' },
});
```

- [ ] **Step 6: Extend `.gitignore`**

Append to existing `.gitignore`:
```
node_modules/
dist/
.astro/
.cloudflare/
coverage/
playwright-report/
test-results/
*.log
.env
.env.local
```

- [ ] **Step 7: Add `package.json` scripts**

Edit `package.json` so the `"scripts"` section is exactly:
```json
{
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "check": "astro check",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "fetch": "node scripts/fetch-github.mjs",
  "specimens": "node scripts/build-specimens.mjs"
}
```

Set `"type": "module"` and `"private": true` at the top level of `package.json`.

- [ ] **Step 8: Verify scaffold builds**

```bash
mkdir -p src/pages
printf '%s\n' '---' '---' '<h1>scaffold</h1>' > src/pages/index.astro
pnpm build
```
Expected: `dist/index.html` exists and contains the string `scaffold`.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json astro.config.mjs .nvmrc .gitignore src/pages/index.astro
git commit -m "chore: scaffold astro + r3f project"
```

---

## Task 2: CSS tokens, reset, fonts

**Files:**
- Create: `src/styles/reset.css`
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Modify: `src/pages/index.astro`
- Create: `public/fonts/README.md` (placeholder noting font files go here)

- [ ] **Step 1: Write `src/styles/reset.css`**

```css
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
img, svg, canvas { display: block; max-width: 100%; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
a { color: inherit; text-decoration: none; }
```

- [ ] **Step 2: Write `src/styles/tokens.css`**

```css
:root {
  /* color */
  --ink:      oklch(0.16 0.01 80);
  --paper:    oklch(0.97 0.005 80);
  --hairline: color-mix(in oklch, var(--ink) 14%, transparent);
  --muted:    color-mix(in oklch, var(--ink) 55%, transparent);
  --accent:   oklch(0.65 0.22 35);

  /* spacing (4pt) */
  --s-1: 4px;  --s-2: 8px;   --s-3: 12px;  --s-4: 16px;
  --s-5: 24px; --s-6: 32px;  --s-7: 48px;  --s-8: 64px;  --s-9: 96px;

  /* type */
  --font-display: "PP Neue Montreal", "GT America", system-ui, sans-serif;
  --font-body:    "PP Neue Montreal", "GT America", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;

  /* motion */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 180ms;
  --dur-mid:  260ms;
}

@media (prefers-color-scheme: dark) {
  :root { --ink: oklch(0.97 0.005 80); --paper: oklch(0.16 0.01 80); }
}
:root[data-theme="light"] { --ink: oklch(0.16 0.01 80); --paper: oklch(0.97 0.005 80); }
:root[data-theme="dark"]  { --ink: oklch(0.97 0.005 80); --paper: oklch(0.16 0.01 80); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 3: Write `src/styles/global.css`**

```css
@import "./reset.css";
@import "./tokens.css";

html { color: var(--ink); background: var(--paper); }
body {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.55;
  font-feature-settings: "ss01", "ss02";
}
h1, h2, h3 { font-family: var(--font-display); font-weight: 800; letter-spacing: -0.035em; line-height: 0.98; margin: 0; }
h1 { font-size: clamp(2.5rem, 6vw, 5rem); }
h2 { font-size: clamp(1.5rem, 3vw, 2.25rem); }
h3 { font-size: 1.125rem; }
p  { max-width: 65ch; }
.mono { font-family: var(--font-mono); font-size: 0.78rem; letter-spacing: 0; }
.label { font-family: var(--font-mono); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.22em; color: var(--muted); }
.hairline { height: 1px; background: var(--hairline); border: 0; margin: 0; }
.accent { color: var(--accent); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
```

- [ ] **Step 4: Replace `src/pages/index.astro` with a styled placeholder**

```astro
---
import "../styles/global.css";
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>natadecua</title>
  </head>
  <body>
    <main style="padding: var(--s-7) var(--s-6);">
      <span class="label">N° 01 — Index</span>
      <h1>Built in the open<span class="accent">.</span></h1>
      <hr class="hairline" style="margin-top: var(--s-6);" />
    </main>
  </body>
</html>
```

- [ ] **Step 5: Verify**

```bash
pnpm build
```
Expected: `dist/index.html` contains `Built in the open` and references `tokens.css` variables.

- [ ] **Step 6: Commit**

```bash
git add src/styles src/pages/index.astro
git commit -m "feat(styles): add tokens, reset, global typography"
```

---

## Task 3: Allowlist filter (pure function + tests)

**Files:**
- Create: `scripts/filter-repos.mjs`
- Create: `tests/unit/filter-repos.test.mjs`
- Create: `portfolio.config.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.{ts,mjs}'],
    environment: 'node',
    coverage: { reporter: ['text', 'html'], include: ['scripts/**', 'src/lib/**'] },
  },
});
```

- [ ] **Step 2: Write failing test `tests/unit/filter-repos.test.mjs`**

```js
import { describe, it, expect } from 'vitest';
import { filterRepos } from '../../scripts/filter-repos.mjs';

const repo = (over = {}) => ({
  name: 'demo', private: false, stargazers_count: 0, fork: false, archived: false, ...over,
});

describe('filterRepos', () => {
  it('keeps public repos when include_public is true', () => {
    const out = filterRepos([repo({ name: 'a' }), repo({ name: 'b' })], { include_public: true });
    expect(out.map(r => r.name)).toEqual(['a', 'b']);
  });

  it('drops public repos when include_public is false', () => {
    const out = filterRepos([repo({ name: 'a' })], { include_public: false });
    expect(out).toEqual([]);
  });

  it('includes only explicitly listed private repos', () => {
    const repos = [repo({ name: 'pub' }), repo({ name: 'sec', private: true }), repo({ name: 'hidden', private: true })];
    const out = filterRepos(repos, { include_public: true, include_private_explicit: ['sec'] });
    expect(out.map(r => r.name).sort()).toEqual(['pub', 'sec']);
  });

  it('excludes names listed in exclude', () => {
    const out = filterRepos([repo({ name: 'a' }), repo({ name: 'b' })], { include_public: true, exclude: ['a'] });
    expect(out.map(r => r.name)).toEqual(['b']);
  });

  it('drops forks and archived', () => {
    const out = filterRepos(
      [repo({ name: 'a', fork: true }), repo({ name: 'b', archived: true }), repo({ name: 'c' })],
      { include_public: true },
    );
    expect(out.map(r => r.name)).toEqual(['c']);
  });

  it('applies min_stars', () => {
    const out = filterRepos(
      [repo({ name: 'low', stargazers_count: 1 }), repo({ name: 'high', stargazers_count: 50 })],
      { include_public: true, min_stars: 10 },
    );
    expect(out.map(r => r.name)).toEqual(['high']);
  });

  it('honors pinned_order then sorts remainder by pushed_at desc', () => {
    const r = (name, pushed) => repo({ name, pushed_at: pushed });
    const out = filterRepos(
      [r('old', '2020-01-01T00:00:00Z'), r('new', '2026-05-01T00:00:00Z'), r('pin', '2019-01-01T00:00:00Z')],
      { include_public: true, pinned_order: ['pin'] },
    );
    expect(out.map(r => r.name)).toEqual(['pin', 'new', 'old']);
  });

  it('truncates to max_repos', () => {
    const repos = Array.from({ length: 20 }, (_, i) => repo({ name: `r${i}`, pushed_at: `2026-05-${String(i+1).padStart(2,'0')}T00:00:00Z` }));
    const out = filterRepos(repos, { include_public: true, max_repos: 5 });
    expect(out).toHaveLength(5);
  });
});
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
pnpm test
```
Expected: FAIL — module `scripts/filter-repos.mjs` not found.

- [ ] **Step 4: Implement `scripts/filter-repos.mjs`**

```js
/**
 * @param {Array<Object>} repos       raw repos from Octokit
 * @param {Object} config             portfolio.config.json
 * @returns {Array<Object>}           filtered + ordered repos
 */
export function filterRepos(repos, config) {
  const {
    include_public = true,
    include_private_explicit = [],
    exclude = [],
    pinned_order = [],
    max_repos = 12,
    min_stars = 0,
  } = config ?? {};

  const allow = new Set(include_private_explicit);
  const deny = new Set(exclude);

  const eligible = repos.filter(r => {
    if (r.fork || r.archived) return false;
    if (deny.has(r.name)) return false;
    if ((r.stargazers_count ?? 0) < min_stars) return false;
    if (r.private) return allow.has(r.name);
    return include_public;
  });

  const pinSet = new Set(pinned_order);
  const pinned = pinned_order
    .map(name => eligible.find(r => r.name === name))
    .filter(Boolean);
  const rest = eligible
    .filter(r => !pinSet.has(r.name))
    .sort((a, b) => new Date(b.pushed_at ?? 0) - new Date(a.pushed_at ?? 0));

  return [...pinned, ...rest].slice(0, max_repos);
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
pnpm test
```
Expected: PASS (8 tests).

- [ ] **Step 6: Write `portfolio.config.json`**

```json
{
  "include_public": true,
  "include_private_explicit": [],
  "exclude": [],
  "pinned_order": [],
  "max_repos": 12,
  "min_stars": 0
}
```

- [ ] **Step 7: Commit**

```bash
git add scripts/filter-repos.mjs tests/unit/filter-repos.test.mjs vitest.config.ts portfolio.config.json
git commit -m "feat(pipeline): allowlist filter with tests"
```

---

## Task 4: README sanitizer (pure function + tests)

**Files:**
- Create: `scripts/sanitize-readme.mjs`
- Create: `tests/unit/sanitize-readme.test.mjs`

- [ ] **Step 1: Write failing test `tests/unit/sanitize-readme.test.mjs`**

```js
import { describe, it, expect } from 'vitest';
import { sanitizeReadme } from '../../scripts/sanitize-readme.mjs';

describe('sanitizeReadme', () => {
  it('strips <script> blocks', () => {
    const out = sanitizeReadme('# Hi\n\n<script>alert(1)</script>\n\ntext');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('# Hi');
    expect(out).toContain('text');
  });

  it('strips <iframe> blocks', () => {
    const out = sanitizeReadme('a\n<iframe src="x"></iframe>\nb');
    expect(out).not.toContain('iframe');
  });

  it('strips inline on* attributes', () => {
    const out = sanitizeReadme('<a href="x" onclick="bad()">link</a>');
    expect(out).not.toContain('onclick');
    expect(out).toContain('href="x"');
  });

  it('truncates at the first <details> tag', () => {
    const body = 'before\n<details>\nhidden content\n</details>\nafter';
    const out = sanitizeReadme(body);
    expect(out).toContain('before');
    expect(out).not.toContain('hidden content');
    expect(out).not.toContain('after');
  });

  it('truncates to 8KB when no <details> is present', () => {
    const long = 'x'.repeat(10_000);
    const out = sanitizeReadme(`# Title\n${long}`);
    expect(out.length).toBeLessThanOrEqual(8192);
    expect(out.startsWith('# Title')).toBe(true);
  });

  it('returns empty string for null/undefined', () => {
    expect(sanitizeReadme(null)).toBe('');
    expect(sanitizeReadme(undefined)).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm test
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `scripts/sanitize-readme.mjs`**

```js
const MAX_BYTES = 8192;
const SCRIPT_RE  = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi;
const IFRAME_RE  = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe\s*>/gi;
const ONATTR_RE  = /\son[a-z]+\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]+)/gi;
const DETAILS_RE = /<details\b/i;

function truncateBytes(str, max) {
  const buf = new TextEncoder().encode(str);
  if (buf.length <= max) return str;
  return new TextDecoder().decode(buf.slice(0, max));
}

export function sanitizeReadme(input) {
  if (input == null) return '';
  let out = String(input);
  out = out.replace(SCRIPT_RE, '');
  out = out.replace(IFRAME_RE, '');
  out = out.replace(ONATTR_RE, '');
  const idx = out.search(DETAILS_RE);
  if (idx >= 0) out = out.slice(0, idx);
  out = truncateBytes(out, MAX_BYTES);
  return out;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test
```
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/sanitize-readme.mjs tests/unit/sanitize-readme.test.mjs
git commit -m "feat(pipeline): readme sanitizer with tests"
```

---

## Task 5: Specimen seed (deterministic geometry params + tests)

**Files:**
- Create: `src/lib/seedRandom.ts`
- Create: `scripts/specimen-seed.mjs`
- Create: `tests/unit/specimen-seed.test.mjs`

- [ ] **Step 1: Write `src/lib/seedRandom.ts`**

```ts
// mulberry32 — 32-bit deterministic PRNG
export function seedFromString(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 2: Write failing test `tests/unit/specimen-seed.test.mjs`**

```js
import { describe, it, expect } from 'vitest';
import { specimenParams, GEOMETRY_FAMILIES } from '../../scripts/specimen-seed.mjs';

const repo = (over = {}) => ({
  name: 'demo', language: 'TypeScript', stargazers_count: 10, pushed_at: '2025-01-01T00:00:00Z', ...over,
});

describe('specimenParams', () => {
  it('is deterministic for the same repo inputs', () => {
    const a = specimenParams(repo({ name: 'foo' }));
    const b = specimenParams(repo({ name: 'foo' }));
    expect(a).toEqual(b);
  });

  it('produces different params for different repos', () => {
    const a = specimenParams(repo({ name: 'foo' }));
    const b = specimenParams(repo({ name: 'bar' }));
    expect(a).not.toEqual(b);
  });

  it('maps known languages to declared families', () => {
    expect(specimenParams(repo({ language: 'TypeScript' })).family).toBe('sphere');
    expect(specimenParams(repo({ language: 'Rust' })).family).toBe('polyhedron');
    expect(specimenParams(repo({ language: 'Python' })).family).toBe('torus');
    expect(specimenParams(repo({ language: 'Go' })).family).toBe('cylinder');
  });

  it('falls back to "generic" for unknown languages', () => {
    expect(specimenParams(repo({ language: 'Brainfuck' })).family).toBe('generic');
    expect(specimenParams(repo({ language: null })).family).toBe('generic');
  });

  it('stars increase density', () => {
    const low = specimenParams(repo({ name: 'x', stargazers_count: 0 })).density;
    const high = specimenParams(repo({ name: 'x', stargazers_count: 1000 })).density;
    expect(high).toBeGreaterThan(low);
  });

  it('older repos rotate slower (lower rotationRate)', () => {
    const old = specimenParams(repo({ name: 'x', pushed_at: '2018-01-01T00:00:00Z' })).rotationRate;
    const young = specimenParams(repo({ name: 'x', pushed_at: '2026-01-01T00:00:00Z' })).rotationRate;
    expect(young).toBeGreaterThan(old);
  });

  it('exports the canonical family list', () => {
    expect(GEOMETRY_FAMILIES).toEqual(['sphere','polyhedron','torus','cylinder','generic']);
  });
});
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
pnpm test
```
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `scripts/specimen-seed.mjs`**

```js
import { seedFromString, mulberry32 } from '../src/lib/seedRandom.js';

export const GEOMETRY_FAMILIES = ['sphere', 'polyhedron', 'torus', 'cylinder', 'generic'];

const LANGUAGE_FAMILY = {
  TypeScript: 'sphere',
  JavaScript: 'sphere',
  Rust:       'polyhedron',
  Python:     'torus',
  Go:         'cylinder',
};

function ageYears(pushedAt, now = Date.now()) {
  if (!pushedAt) return 5;
  const ms = now - new Date(pushedAt).getTime();
  return Math.max(0, ms / (365 * 24 * 3600 * 1000));
}

/**
 * Deterministic geometry parameters for a repo.
 * @param {{ name: string, language?: string|null, stargazers_count?: number, pushed_at?: string }} repo
 * @returns {{ family: string, density: number, rotationRate: number, jitter: number[], scale: number }}
 */
export function specimenParams(repo) {
  const family = LANGUAGE_FAMILY[repo.language] ?? 'generic';
  const rng = mulberry32(seedFromString(repo.name));

  // density: 0.3..1.0, grows with log(stars)
  const stars = Math.max(0, repo.stargazers_count ?? 0);
  const starsTerm = Math.min(1, Math.log10(1 + stars) / 3); // 0..1 across 0..1000+ stars
  const density = 0.3 + 0.6 * starsTerm + 0.1 * rng();

  // rotation: 0.05..0.6 rad/s, newer is faster
  const age = ageYears(repo.pushed_at);
  const youth = Math.exp(-age / 2); // 1 at age 0, ~0.13 at age 4
  const rotationRate = 0.05 + 0.55 * youth;

  // jitter: small per-axis offsets the renderer can apply
  const jitter = [rng() - 0.5, rng() - 0.5, rng() - 0.5];

  // scale: 0.85..1.15 so the grid has subtle variety
  const scale = 0.85 + 0.30 * rng();

  return { family, density, rotationRate, jitter, scale };
}
```

- [ ] **Step 5: Configure Node to import .ts as .js**

Edit `package.json`, ensure `"type": "module"`. Add `"imports"` field:
```json
"imports": {
  "#lib/*": "./src/lib/*"
}
```

Then change the import in `specimen-seed.mjs` and any consumers to use the file extension that resolves. Since vitest uses Vite for transforms it will resolve the `.ts` file directly via:

```js
import { seedFromString, mulberry32 } from '../src/lib/seedRandom.ts';
```

Update `scripts/specimen-seed.mjs` line 1 to use `.ts`:
```js
import { seedFromString, mulberry32 } from '../src/lib/seedRandom.ts';
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
pnpm test
```
Expected: PASS (7 tests).

- [ ] **Step 7: Commit**

```bash
git add src/lib/seedRandom.ts scripts/specimen-seed.mjs tests/unit/specimen-seed.test.mjs package.json
git commit -m "feat(specimens): deterministic seed -> geometry params"
```

---

## Task 6: GitHub fetch pipeline (integration script, no test)

**Files:**
- Create: `scripts/fetch-github.mjs`

This script runs only in the Action and on local manual triggers. We validate it by running it end-to-end with a real token; its pure sub-components are tested in Tasks 3-5.

- [ ] **Step 1: Write `scripts/fetch-github.mjs`**

```js
import { Octokit } from '@octokit/rest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { filterRepos } from './filter-repos.mjs';
import { sanitizeReadme } from './sanitize-readme.mjs';
import { specimenParams } from './specimen-seed.mjs';

const USER = 'natadecua';
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'src/data');
const READMES_DIR = path.join(DATA_DIR, 'readmes');

async function loadConfig() {
  const raw = await fs.readFile(path.join(ROOT, 'portfolio.config.json'), 'utf8');
  return JSON.parse(raw);
}

async function ensureClean() {
  await fs.mkdir(READMES_DIR, { recursive: true });
  const existing = await fs.readdir(READMES_DIR).catch(() => []);
  await Promise.all(existing.map(f => fs.rm(path.join(READMES_DIR, f), { force: true })));
}

async function fetchRepoReadme(octokit, repoName) {
  try {
    const res = await octokit.rest.repos.getReadme({ owner: USER, repo: repoName, mediaType: { format: 'raw' } });
    return typeof res.data === 'string' ? res.data : '';
  } catch (err) {
    if (err.status === 404) return '';
    throw err;
  }
}

async function fetchActivity(octokit) {
  // 52-week commit activity for the user across owned repos is non-trivial;
  // for v1 derive a coarse signal from pushed_at counts per week.
  const events = await octokit.paginate(octokit.rest.activity.listPublicEventsForUser, { username: USER, per_page: 100 });
  const weeks = new Array(52).fill(0);
  const now = Date.now();
  for (const ev of events) {
    if (ev.type !== 'PushEvent') continue;
    const ageMs = now - new Date(ev.created_at).getTime();
    const w = Math.floor(ageMs / (7 * 24 * 3600 * 1000));
    if (w >= 0 && w < 52) weeks[51 - w] += (ev.payload?.commits?.length ?? 1);
  }
  return weeks;
}

function languageTotals(repos) {
  const totals = {};
  for (const r of repos) {
    const lang = r.language ?? 'Other';
    totals[lang] = (totals[lang] ?? 0) + 1;
  }
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  return Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, +(v / sum).toFixed(3)]));
}

async function main() {
  const token = process.env.GH_READ_TOKEN;
  if (!token) throw new Error('GH_READ_TOKEN env var is required');

  const config = await loadConfig();
  const octokit = new Octokit({ auth: token });

  const all = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
    per_page: 100, visibility: 'all', affiliation: 'owner',
  });
  const filtered = filterRepos(all, config);

  await ensureClean();

  const out = [];
  for (const repo of filtered) {
    const raw = await fetchRepoReadme(octokit, repo.name);
    const readme = sanitizeReadme(raw);
    const readmePath = `src/data/readmes/${repo.name}.md`;
    await fs.writeFile(path.join(ROOT, readmePath), readme, 'utf8');

    out.push({
      name: repo.name,
      description: repo.description ?? '',
      language: repo.language ?? null,
      stars: repo.stargazers_count ?? 0,
      topics: repo.topics ?? [],
      pushed_at: repo.pushed_at,
      html_url: repo.html_url,
      is_private: !!repo.private,
      readme_path: readmePath,
      specimen_svg: `/specimens/${repo.name}.svg`,
      specimen: specimenParams(repo),
    });
  }

  const portfolio = {
    synced_at: new Date().toISOString(),
    languages_overall: languageTotals(filtered),
    activity_52w: await fetchActivity(octokit),
    repos: out,
  };

  await fs.writeFile(path.join(DATA_DIR, 'portfolio.json'), JSON.stringify(portfolio, null, 2), 'utf8');
  console.log(`Wrote ${out.length} repos to src/data/portfolio.json`);
}

main().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Manually trigger end-to-end**

Generate a fine-grained PAT in GitHub UI (Resource owner: natadecua; Repositories: all public, plus any private repos to include; Permissions: Metadata: Read, Contents: Read). Then:
```bash
export GH_READ_TOKEN=<paste-token>
pnpm fetch
```
Expected: `src/data/portfolio.json` exists, has a non-empty `repos` array, and `src/data/readmes/` contains one `.md` per included repo. `unset GH_READ_TOKEN` afterward.

- [ ] **Step 3: Commit data + script**

```bash
git add scripts/fetch-github.mjs src/data/portfolio.json src/data/readmes/
git commit -m "feat(pipeline): fetch + sync github data"
```

---

## Task 7: SVG fallback specimens (build-time rasterizer)

**Files:**
- Create: `scripts/build-specimens.mjs`

The SVG must be deterministic from the same seed so it visually matches the R3F render at rest. We render a 2D projection of the chosen geometry family.

- [ ] **Step 1: Write `scripts/build-specimens.mjs`**

```js
import fs from 'node:fs/promises';
import path from 'node:path';
import { seedFromString, mulberry32 } from '../src/lib/seedRandom.ts';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public/specimens');

function svgWrap(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-hidden="true">
  <rect width="120" height="120" fill="transparent"/>
  ${inner}
</svg>`;
}

function renderSphere(p, rng) {
  const cx = 60 + p.jitter[0] * 6, cy = 60 + p.jitter[1] * 6;
  const r = 30 * p.scale;
  const rings = Math.max(3, Math.round(6 * p.density));
  let s = '';
  for (let i = 0; i < rings; i++) {
    const k = (i + 1) / (rings + 1);
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${(r * k).toFixed(2)}" ry="${(r * (0.4 + 0.6 * k)).toFixed(2)}" fill="none" stroke="currentColor" stroke-width="0.7" opacity="${(0.25 + 0.6 * k).toFixed(2)}"/>`;
  }
  return s;
}

function renderPolyhedron(p, rng) {
  const cx = 60, cy = 60;
  const r = 32 * p.scale;
  const sides = 4 + Math.round(rng() * 4); // 4..8
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="none" stroke="currentColor" stroke-width="1.2"/>
          <polygon points="${pts.join(' ')}" fill="currentColor" opacity="${(0.05 + 0.15 * p.density).toFixed(2)}"/>`;
}

function renderTorus(p, rng) {
  const cx = 60, cy = 60;
  const R = 32 * p.scale, r = 12 * p.scale;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${R * 0.42}" fill="none" stroke="currentColor" stroke-width="1.2"/>
          <ellipse cx="${cx}" cy="${cy}" rx="${(R - r).toFixed(2)}" ry="${((R - r) * 0.42).toFixed(2)}" fill="none" stroke="currentColor" stroke-width="0.7" opacity="0.6"/>`;
}

function renderCylinder(p) {
  const cx = 60, cy = 60;
  const w = 40 * p.scale, h = 60 * p.scale;
  return `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" fill="none" stroke="currentColor" stroke-width="1.2"/>
          <ellipse cx="${cx}" cy="${cy - h / 2}" rx="${w / 2}" ry="${w / 6}" fill="none" stroke="currentColor" stroke-width="1.2"/>
          <ellipse cx="${cx}" cy="${cy + h / 2}" rx="${w / 2}" ry="${w / 6}" fill="none" stroke="currentColor" stroke-width="1.2"/>`;
}

function renderGeneric(p, rng) {
  const dots = Math.round(12 + 24 * p.density);
  let s = '';
  for (let i = 0; i < dots; i++) {
    const x = 20 + rng() * 80;
    const y = 20 + rng() * 80;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.6 + rng() * 1.8).toFixed(2)}" fill="currentColor" opacity="${(0.3 + rng() * 0.6).toFixed(2)}"/>`;
  }
  return s;
}

function renderSpecimen(repo) {
  const p = repo.specimen;
  const rng = mulberry32(seedFromString(repo.name));
  switch (p.family) {
    case 'sphere':     return svgWrap(renderSphere(p, rng));
    case 'polyhedron': return svgWrap(renderPolyhedron(p, rng));
    case 'torus':      return svgWrap(renderTorus(p, rng));
    case 'cylinder':   return svgWrap(renderCylinder(p));
    default:           return svgWrap(renderGeneric(p, rng));
  }
}

async function main() {
  const portfolio = JSON.parse(await fs.readFile(path.join(ROOT, 'src/data/portfolio.json'), 'utf8'));
  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const repo of portfolio.repos) {
    await fs.writeFile(path.join(OUT_DIR, `${repo.name}.svg`), renderSpecimen(repo), 'utf8');
  }
  console.log(`Wrote ${portfolio.repos.length} specimens to public/specimens/`);
}

main().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Run it against the data from Task 6**

```bash
pnpm specimens
```
Expected: `public/specimens/<repo>.svg` exists for each repo. Open one in a browser and confirm it renders a clean monochrome shape using `currentColor`.

- [ ] **Step 3: Commit**

```bash
git add scripts/build-specimens.mjs public/specimens/
git commit -m "feat(specimens): svg fallback rasterizer"
```

---

## Task 8: Format helpers (lib/format.ts + tests)

**Files:**
- Create: `src/lib/format.ts`
- Create: `tests/unit/format.test.ts`
- Modify: `vitest.config.ts` (already includes `.ts`)

- [ ] **Step 1: Write failing test `tests/unit/format.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { relativeTime, percent, syncedAgo } from '../../src/lib/format';

const FIXED = new Date('2026-05-13T12:00:00Z').getTime();

describe('relativeTime', () => {
  it('returns "today" for <24h', () => {
    expect(relativeTime('2026-05-13T03:00:00Z', FIXED)).toBe('today');
  });
  it('returns "Nd" for days', () => {
    expect(relativeTime('2026-05-10T12:00:00Z', FIXED)).toBe('3d');
  });
  it('returns "Nw" for weeks', () => {
    expect(relativeTime('2026-04-20T12:00:00Z', FIXED)).toBe('3w');
  });
  it('returns "Nmo" for months', () => {
    expect(relativeTime('2026-01-13T12:00:00Z', FIXED)).toBe('4mo');
  });
  it('returns "Ny" for years', () => {
    expect(relativeTime('2024-05-13T12:00:00Z', FIXED)).toBe('2y');
  });
});

describe('percent', () => {
  it('formats a 0..1 ratio as an integer percent', () => {
    expect(percent(0.547)).toBe('55%');
    expect(percent(0)).toBe('0%');
    expect(percent(1)).toBe('100%');
  });
});

describe('syncedAgo', () => {
  it('prefixes with "synced"', () => {
    expect(syncedAgo('2026-05-12T12:00:00Z', FIXED)).toBe('synced 1d ago');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm test
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/format.ts`**

```ts
const DAY = 24 * 3600 * 1000;

export function relativeTime(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  const days = Math.floor((now - t) / DAY);
  if (days < 1)   return 'today';
  if (days < 14)  return `${days}d`;
  if (days < 60)  return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

export function percent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function syncedAgo(iso: string, now: number = Date.now()): string {
  return `synced ${relativeTime(iso, now)} ago`;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test
```
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts tests/unit/format.test.ts
git commit -m "feat(lib): time + percent formatters"
```

---

## Task 9: Hero component (static)

**Files:**
- Create: `src/components/Hero.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/Hero.astro`**

```astro
---
import { syncedAgo } from '~/lib/format';
import portfolio from '~/data/portfolio.json';

const synced = syncedAgo(portfolio.synced_at);
---
<header style="padding: var(--s-7) var(--s-6) var(--s-6);">
  <div style="display:flex; justify-content:space-between; align-items:baseline;">
    <span class="label">N° 01 — Index</span>
    <span class="label">2026</span>
  </div>
  <h1 style="margin-top: var(--s-3);">A quiet archive of<br/>things, mostly built<br/>in public<span class="accent">.</span></h1>
  <div style="margin-top: var(--s-5); display:flex; gap: var(--s-4); align-items:center;">
    <span class="dot" aria-hidden="true"></span>
    <span class="mono" style="color: var(--muted);">{synced}</span>
    <span class="mono" style="color: var(--muted);">·</span>
    <a class="mono" href="https://github.com/natadecua" style="color: var(--muted);">github.com/natadecua</a>
  </div>
</header>
<style>
  .dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 10px color-mix(in oklch, var(--accent) 60%, transparent);
  }
  @media (prefers-reduced-motion: reduce) {
    .dot { box-shadow: none; }
  }
</style>
```

- [ ] **Step 2: Update `src/pages/index.astro`**

```astro
---
import "../styles/global.css";
import Hero from "../components/Hero.astro";
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="natadecua — a quiet archive of things, mostly built in public." />
    <title>natadecua</title>
  </head>
  <body>
    <main>
      <Hero />
    </main>
  </body>
</html>
```

- [ ] **Step 3: Verify**

```bash
pnpm build
```
Expected: `dist/index.html` contains `A quiet archive of` and `synced` text.

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.astro src/pages/index.astro
git commit -m "feat(ui): hero with live-sync indicator"
```

---

## Task 10: SpecimensGrid + SVG fallback row

**Files:**
- Create: `src/components/SpecimensGrid.astro`
- Create: `src/components/SpecimenFallback.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/SpecimenFallback.astro`**

```astro
---
import fs from 'node:fs/promises';
import path from 'node:path';
interface Props { name: string }
const { name } = Astro.props;
const svg = await fs.readFile(path.join(process.cwd(), 'public/specimens', `${name}.svg`), 'utf8');
---
<div class="specimen-fallback" set:html={svg} aria-hidden="true" />
<style>
  .specimen-fallback { width: 40px; height: 40px; color: var(--ink); }
  .specimen-fallback svg { width: 100%; height: 100%; }
</style>
```

- [ ] **Step 2: Write `src/components/SpecimensGrid.astro`**

```astro
---
import portfolio from '~/data/portfolio.json';
import { relativeTime } from '~/lib/format';
import SpecimenFallback from './SpecimenFallback.astro';
---
<section style="padding: 0 var(--s-6) var(--s-7);">
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding-bottom: var(--s-3);">
    <span class="label">Selected works</span>
    <span class="label">{portfolio.repos.length} repos</span>
  </div>
  <hr class="hairline" />
  <ol class="ledger">
    {portfolio.repos.map((r, i) => (
      <li class="row">
        <span class="rank mono">{String(i + 1).padStart(2, '0')}</span>
        <a class="title" href={r.html_url} rel="noopener">{r.name}</a>
        <span class="lang mono">{r.language ?? '—'}</span>
        <span class="stars mono">★ {r.stars}</span>
        <span class="ago mono">{relativeTime(r.pushed_at)}</span>
        <span class="specimen"><SpecimenFallback name={r.name} /></span>
      </li>
    ))}
  </ol>
</section>
<style>
  .ledger { list-style: none; padding: 0; margin: 0; }
  .row {
    display: grid;
    grid-template-columns: 36px 1fr 110px 70px 70px 48px;
    gap: var(--s-4);
    align-items: center;
    padding: var(--s-4) 0;
    border-bottom: 1px solid var(--hairline);
  }
  .rank, .lang, .stars, .ago { color: var(--muted); font-size: 0.74rem; }
  .title {
    font-family: var(--font-display);
    font-weight: 700; font-size: 1.05rem;
    letter-spacing: -0.015em;
  }
  .title:hover { color: var(--accent); }
  .specimen { justify-self: end; }
  @media (max-width: 720px) {
    .row { grid-template-columns: 28px 1fr 60px 40px; }
    .lang, .stars { display: none; }
  }
</style>
```

- [ ] **Step 3: Mount in `src/pages/index.astro`**

```astro
---
import "../styles/global.css";
import Hero from "../components/Hero.astro";
import SpecimensGrid from "../components/SpecimensGrid.astro";
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="natadecua — a quiet archive of things, mostly built in public." />
    <title>natadecua</title>
  </head>
  <body>
    <main>
      <Hero />
      <SpecimensGrid />
    </main>
  </body>
</html>
```

- [ ] **Step 4: Verify**

```bash
pnpm dev
```
Open http://localhost:4321. Confirm the grid lists all repos with names, language, stars, relative-time, and an inline SVG specimen on each row. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/SpecimensGrid.astro src/components/SpecimenFallback.astro src/pages/index.astro
git commit -m "feat(ui): specimens grid with svg fallback"
```

---

## Task 11: R3F Specimen island (progressive enhancement)

**Files:**
- Create: `src/components/Specimen.tsx`
- Modify: `src/components/SpecimensGrid.astro` (swap fallback for hydrated island)

- [ ] **Step 1: Write `src/components/Specimen.tsx`**

```tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

export interface SpecimenParams {
  family: 'sphere' | 'polyhedron' | 'torus' | 'cylinder' | 'generic';
  density: number;
  rotationRate: number;
  jitter: [number, number, number];
  scale: number;
}

function Mesh3D({ p }: { p: SpecimenParams }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * p.rotationRate * 0.7;
    ref.current.rotation.y += dt * p.rotationRate;
  });

  const segments = Math.max(8, Math.round(24 * p.density));
  const color = 'currentColor';

  switch (p.family) {
    case 'sphere':
      return (
        <mesh ref={ref} scale={p.scale}>
          <sphereGeometry args={[1, segments, segments]} />
          <meshBasicMaterial color={color} wireframe />
        </mesh>
      );
    case 'polyhedron':
      return (
        <mesh ref={ref} scale={p.scale}>
          <icosahedronGeometry args={[1.1, 0]} />
          <meshBasicMaterial color={color} wireframe />
        </mesh>
      );
    case 'torus':
      return (
        <mesh ref={ref} scale={p.scale}>
          <torusGeometry args={[0.8, 0.3, 12, segments]} />
          <meshBasicMaterial color={color} wireframe />
        </mesh>
      );
    case 'cylinder':
      return (
        <mesh ref={ref} scale={p.scale}>
          <cylinderGeometry args={[0.7, 0.7, 1.6, segments]} />
          <meshBasicMaterial color={color} wireframe />
        </mesh>
      );
    default:
      return (
        <points ref={ref} scale={p.scale}>
          <sphereGeometry args={[1, 8, 8]} />
          <pointsMaterial size={0.04} color={color} />
        </points>
      );
  }
}

export default function Specimen({ params }: { params: SpecimenParams }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return null; // fallback SVG is rendered server-side; we just skip hydration

  return (
    <div style={{ width: 40, height: 40, color: 'currentColor' }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 35 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <Mesh3D p={params} />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 2: Update `SpecimensGrid.astro` to render both layers**

Replace the `.specimen` span with:
```astro
<span class="specimen">
  <SpecimenFallback name={r.name} />
  <Specimen client:visible params={r.specimen} />
</span>
```
Add the import at the top:
```astro
import Specimen from './Specimen.tsx';
```
And in the `<style>` block, add:
```css
.specimen { position: relative; }
.specimen > div { position: absolute; inset: 0; }
.specimen > div:last-child { z-index: 1; }
```
The SVG renders immediately; the R3F canvas mounts on top once hydrated. Reduced-motion users see only the SVG because `Specimen` returns `null`.

- [ ] **Step 3: Verify visually**

```bash
pnpm dev
```
Open http://localhost:4321. Confirm specimens animate smoothly. Toggle reduced-motion in OS settings, hard-reload, confirm static SVG only. Stop dev.

- [ ] **Step 4: Commit**

```bash
git add src/components/Specimen.tsx src/components/SpecimensGrid.astro
git commit -m "feat(specimens): r3f hydrated island layered over svg"
```

---

## Task 12: ProjectDetail expansion (view transitions)

**Files:**
- Create: `src/components/ProjectDetail.astro`
- Modify: `src/components/SpecimensGrid.astro` (wrap row in a `<details>` containing the detail)
- Modify: `src/pages/index.astro` (enable view transitions)

- [ ] **Step 1: Enable Astro view transitions**

Edit `src/pages/index.astro` head:
```astro
import { ViewTransitions } from 'astro:transitions';
```
And inside `<head>`:
```astro
<ViewTransitions />
```

- [ ] **Step 2: Write `src/components/ProjectDetail.astro`**

```astro
---
import fs from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
interface Props {
  name: string;
  description: string;
  language: string | null;
  stars: number;
  html_url: string;
  topics: string[];
  pushed_at: string;
  readme_path: string;
}
const { name, description, language, stars, html_url, topics, pushed_at, readme_path } = Astro.props;
const raw = await fs.readFile(path.join(process.cwd(), readme_path), 'utf8').catch(() => '');
const html = raw ? marked.parse(raw, { breaks: true }) : '<p class="muted">No README.</p>';
---
<div class="detail">
  <div class="meta">
    <span class="label">Project</span>
    <h2 style="margin-top: var(--s-2);">{name}<span class="accent">.</span></h2>
    {description && <p style="margin-top: var(--s-2);">{description}</p>}
    <div class="chips mono">
      {language && <span>{language}</span>}
      <span>★ {stars}</span>
      {topics.slice(0, 4).map(t => <span>#{t}</span>)}
    </div>
    <a class="mono accent" href={html_url} rel="noopener">{html_url} ↗</a>
  </div>
  <hr class="hairline" />
  <article class="readme" set:html={html} />
</div>
<style>
  .detail { padding: var(--s-5) 0; max-width: 70ch; }
  .chips { display:flex; flex-wrap: wrap; gap: var(--s-3); color: var(--muted); margin-top: var(--s-3); }
  .readme :global(h1), .readme :global(h2) { font-family: var(--font-display); margin-top: var(--s-5); }
  .readme :global(p), .readme :global(li) { font-size: 0.96rem; }
  .readme :global(pre) { font-family: var(--font-mono); background: color-mix(in oklch, var(--ink) 6%, transparent); padding: var(--s-4); overflow-x: auto; }
  .readme :global(code) { font-family: var(--font-mono); }
  .readme :global(a) { color: var(--accent); }
</style>
```

- [ ] **Step 3: Install `marked`**

```bash
pnpm add marked@^14.1.3
```

- [ ] **Step 4: Modify `SpecimensGrid.astro` to wrap each row in `<details>`**

Replace the `<li class="row">…</li>` block with:
```astro
<li>
  <details class="row-details">
    <summary class="row">
      <span class="rank mono">{String(i + 1).padStart(2, '0')}</span>
      <span class="title">{r.name}</span>
      <span class="lang mono">{r.language ?? '—'}</span>
      <span class="stars mono">★ {r.stars}</span>
      <span class="ago mono">{relativeTime(r.pushed_at)}</span>
      <span class="specimen">
        <SpecimenFallback name={r.name} />
        <Specimen client:visible params={r.specimen} />
      </span>
    </summary>
    <ProjectDetail
      name={r.name}
      description={r.description}
      language={r.language}
      stars={r.stars}
      html_url={r.html_url}
      topics={r.topics}
      pushed_at={r.pushed_at}
      readme_path={r.readme_path}
    />
  </details>
</li>
```

Add to the top of the file:
```astro
import ProjectDetail from './ProjectDetail.astro';
```

In the `<style>` block append:
```css
.row-details > summary { list-style: none; cursor: pointer; }
.row-details > summary::-webkit-details-marker { display: none; }
.row-details[open] > summary .title { color: var(--accent); }
```

- [ ] **Step 5: Verify**

```bash
pnpm dev
```
Open http://localhost:4321. Click a row. Confirm the detail expands inline below it with the README, language chips, stars, link out. Reduced-motion users get an instant expand; everyone else gets the browser's smooth `<details>` animation. Stop dev.

- [ ] **Step 6: Commit**

```bash
git add src/components/ProjectDetail.astro src/components/SpecimensGrid.astro src/pages/index.astro package.json pnpm-lock.yaml
git commit -m "feat(detail): inline expansion with sanitized readme"
```

---

## Task 13: Rhythm chart

**Files:**
- Create: `src/components/Rhythm.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/Rhythm.astro`**

```astro
---
import portfolio from '~/data/portfolio.json';
import { percent } from '~/lib/format';

const weeks = portfolio.activity_52w as number[];
const max = Math.max(1, ...weeks);
const langs = Object.entries(portfolio.languages_overall as Record<string, number>)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 6);
---
<section style="padding: var(--s-7) var(--s-6); border-top: 1px solid var(--hairline);">
  <div style="display:flex; justify-content:space-between; align-items:baseline;">
    <span class="label">Rhythm</span>
    <span class="label">52 weeks</span>
  </div>
  <pre class="rhythm mono" aria-label="52-week activity">{weeks.map(w => {
    const intensity = w / max;
    const ch = intensity === 0 ? '·' : intensity < 0.25 ? '▁' : intensity < 0.5 ? '▃' : intensity < 0.75 ? '▅' : '█';
    return ch;
  }).join('')}</pre>

  <hr class="hairline" style="margin: var(--s-5) 0;" />

  <ul class="langs">
    {langs.map(([name, ratio]) => {
      const r = Math.round(ratio * 16);
      const bar = '█'.repeat(r) + '░'.repeat(16 - r);
      return (
        <li>
          <span class="lang-name">{name}</span>
          <span class="mono lang-bar">{bar}</span>
          <span class="mono lang-pct">{percent(ratio)}</span>
        </li>
      );
    })}
  </ul>
</section>
<style>
  .rhythm { font-size: 1.4rem; line-height: 1; letter-spacing: 0.05em; color: var(--ink); white-space: nowrap; overflow-x: auto; margin-top: var(--s-3); }
  .langs { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--s-2); }
  .langs li { display: grid; grid-template-columns: 1fr auto auto; gap: var(--s-4); align-items: baseline; }
  .lang-name { font-family: var(--font-display); font-weight: 600; }
  .lang-bar { color: var(--muted); letter-spacing: -0.05em; }
  .lang-pct { color: var(--muted); }
</style>
```

- [ ] **Step 2: Mount in `src/pages/index.astro`**

Add the import:
```astro
import Rhythm from "../components/Rhythm.astro";
```
Add in `<main>` after `<SpecimensGrid />`:
```astro
<Rhythm />
```

- [ ] **Step 3: Verify**

```bash
pnpm dev
```
Confirm the activity strip renders as block characters scaled to commit intensity and a typographic language bar list appears below it. Stop dev.

- [ ] **Step 4: Commit**

```bash
git add src/components/Rhythm.astro src/pages/index.astro
git commit -m "feat(rhythm): typographic 52w activity + language bars"
```

---

## Task 14: Footer + theme toggle

**Files:**
- Create: `src/components/Footer.astro`
- Create: `src/components/ThemeToggle.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/ThemeToggle.astro`**

```astro
<button id="theme-toggle" class="label" aria-label="Toggle theme">
  <span data-show="auto">auto</span>
  <span data-show="light" hidden>light</span>
  <span data-show="dark" hidden>dark</span>
</button>
<script is:inline>
(() => {
  const btn = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const order = ['auto', 'light', 'dark'];
  const stored = localStorage.getItem('theme') ?? 'auto';
  apply(stored);

  btn.addEventListener('click', () => {
    const cur = localStorage.getItem('theme') ?? 'auto';
    const next = order[(order.indexOf(cur) + 1) % order.length];
    localStorage.setItem('theme', next);
    apply(next);
  });

  function apply(mode) {
    if (mode === 'auto') html.removeAttribute('data-theme');
    else html.setAttribute('data-theme', mode);
    btn.querySelectorAll('[data-show]').forEach(el => {
      el.hidden = el.getAttribute('data-show') !== mode;
    });
  }
})();
</script>
<style>
  #theme-toggle { padding: var(--s-2) var(--s-3); border: 1px solid var(--hairline); border-radius: 2px; }
  #theme-toggle:hover { border-color: var(--ink); }
</style>
```

- [ ] **Step 2: Write `src/components/Footer.astro`**

```astro
---
import ThemeToggle from './ThemeToggle.astro';
---
<footer style="padding: var(--s-7) var(--s-6); border-top: 1px solid var(--hairline); display:flex; justify-content:space-between; gap: var(--s-5); flex-wrap: wrap;">
  <div style="max-width: 50ch;">
    <p style="font-size: 0.95rem;">
      Built by Nata Decua. This page reads its own data from <code class="mono">src/data/portfolio.json</code>, refreshed each Sunday by a GitHub Action. Source is public.
    </p>
    <p class="mono" style="margin-top: var(--s-3); color: var(--muted);">
      <a href="mailto:hi@natadecua.dev">hi@natadecua.dev</a> · <a href="https://github.com/natadecua">github</a>
    </p>
  </div>
  <ThemeToggle />
</footer>
```

- [ ] **Step 3: Mount in `src/pages/index.astro`**

Add the import and use it after `<Rhythm />`:
```astro
import Footer from "../components/Footer.astro";
```
```astro
<Footer />
```

- [ ] **Step 4: Verify**

```bash
pnpm dev
```
Confirm footer renders, theme toggle cycles auto → light → dark and persists across reload. Stop dev.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.astro src/components/ThemeToggle.astro src/pages/index.astro
git commit -m "feat(ui): footer + theme toggle"
```

---

## Task 15: Weekly GitHub Action

**Files:**
- Create: `.github/workflows/weekly-sync.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: weekly-sync
on:
  schedule:
    - cron: "0 3 * * 0"   # Sundays 03:00 UTC
  workflow_dispatch: {}

permissions:
  contents: write
  issues: write

jobs:
  sync:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - run: pnpm install --frozen-lockfile
      - name: Fetch GitHub data
        env:
          GH_READ_TOKEN: ${{ secrets.GH_READ_TOKEN }}
        run: pnpm fetch
      - name: Build SVG specimens
        run: pnpm specimens
      - name: Commit changes
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add src/data/ public/specimens/
          if git diff --cached --quiet; then
            echo "No changes."
          else
            git commit -m "chore(data): weekly refresh $(date -u +%Y-%m-%d)"
            git push
          fi
      - name: Open issue on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            const date = new Date().toISOString().slice(0, 10);
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `weekly sync failed ${date}`,
              body: `Workflow run: ${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`,
            });
```

- [ ] **Step 2: Add the secret**

In GitHub UI: Settings → Secrets and variables → Actions → New repository secret → name `GH_READ_TOKEN`, value = the fine-grained PAT from Task 6. Document the expiry date in a sticky note (an automated expiry reminder is intentionally out of scope for v1 — the spec mentions it but it'd require a separate Action; track it in a follow-up issue if needed).

- [ ] **Step 3: Verify with manual dispatch**

After committing and pushing, in GitHub UI: Actions → weekly-sync → Run workflow. Confirm the job succeeds and (if any data changed) a `chore(data)` commit appears on `main`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/weekly-sync.yml
git commit -m "ci: weekly github data sync"
git push
```

---

## Task 16: Playwright smoke test

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Install Playwright browsers**

```bash
pnpm exec playwright install --with-deps chromium
```

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:4321', headless: true },
  webServer: {
    command: 'pnpm build && pnpm preview --port 4321',
    url: 'http://localhost:4321',
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 3: Write `tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('home page renders hero, grid, rhythm, footer', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('A quiet archive');
  await expect(page.locator('.row').first()).toBeVisible();
  await expect(page.getByText('Rhythm')).toBeVisible();
  await expect(page.getByText('Built by Nata Decua')).toBeVisible();
});

test('JS-disabled path still reads end-to-end', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('A quiet archive');
  await expect(page.locator('.row').first()).toBeVisible();
  // SVG fallbacks must be present
  await expect(page.locator('.specimen-fallback svg').first()).toBeVisible();
});

test('reduced-motion skips R3F hydration', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  let canvasRequests = 0;
  page.on('request', req => { if (req.url().includes('three')) canvasRequests++; });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // The Specimen component bails before mounting a canvas; no <canvas> should appear.
  expect(await page.locator('canvas').count()).toBe(0);
});
```

- [ ] **Step 4: Run the suite**

```bash
pnpm test:e2e
```
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e/smoke.spec.ts
git commit -m "test(e2e): smoke + js-off + reduced-motion paths"
```

---

## Task 17: Cloudflare Pages connection + final build

**Files:** none in repo; configuration in Cloudflare dashboard.

- [ ] **Step 1: Connect repo in Cloudflare Pages**

Cloudflare dashboard → Workers & Pages → Create application → Pages → Connect to Git → select `github-portfolio`. Build settings:
- Framework preset: Astro
- Build command: `pnpm install --frozen-lockfile && pnpm build`
- Build output directory: `dist`
- Node version: 20
- Environment variables: none required (no token at deploy time; all data is committed).

- [ ] **Step 2: Trigger initial deploy**

Push the `main` branch if needed. Watch the Pages build complete. Open the assigned `*.pages.dev` URL and confirm the live site matches local `pnpm preview` output.

- [ ] **Step 3: (Optional) Attach a custom domain**

Cloudflare Pages → Custom domains → add the domain. Update DNS as instructed.

- [ ] **Step 4: Final verification**

- Open the site on desktop. Time-to-first-paint should feel instant (Pages serves from edge).
- Hard-reload with DevTools throttling = "Slow 4G". Confirm the page is readable before R3F bundle loads.
- Toggle the theme, click a project, scroll through Rhythm. Nothing should jank.
- View source: confirm no `GH_READ_TOKEN`, no obvious tokens, no leaked private repo content beyond what `portfolio.config.json` allows.

- [ ] **Step 5: Tag a release**

```bash
git tag v0.1.0 -m "initial public release"
git push --tags
```

---

## Notes on the design contract

Throughout implementation, every visual decision must be checked against [`.impeccable.md`](../../../.impeccable.md). Specifically:

1. **No gradient text. No left-stripe borders.** If you find yourself reaching for either, stop and use a different element entirely.
2. **One accent.** The vermillion `--accent` is the only non-neutral color on the page. Don't add a second.
3. **Hairlines, not borders.** `border: 1px solid var(--hairline)` or none. Never thicker.
4. **Banned fonts.** Inter, Roboto, DM Sans, Plus Jakarta, IBM Plex, Space Grotesk, Space Mono, Fraunces, Instrument, Outfit. If `PP Neue Montreal` is not licensed/available at implementation time, replace it via the visual review step in Task 9 — do **not** silently fall back to Inter.
5. **WebGL must be derived from data.** Adding a decorative shader, particles, or background blob during implementation is out of scope and should be rejected at review.
6. **First-viewport signal.** If a recruiter cannot learn name + role + activity + top language within the hero, the hero is wrong — adjust before shipping.

---

## Self-Review

**Spec coverage:** Architecture (Task 1, 17), components (Tasks 9-14), data flow (Tasks 3-7), security (Tasks 3, 4, 6, 15), error handling (Task 15 issue-on-failure, Task 7 SVG fallback, Task 11 reduced-motion path, Task 16 JS-off test), testing (Tasks 3-5, 8, 16), deployment (Task 15, 17). Implementation phases from spec map to: scaffold (1-2), pipeline (3-7), JS-off baseline (9-10), R3F (11), detail (12), rhythm/footer (13-14), cron (15), tests (16), deploy (17). All covered.

**Placeholders:** None. Every step has executable code, exact paths, or exact commands.

**Type consistency:** `SpecimenParams` shape is identical between `scripts/specimen-seed.mjs` (Task 5), `src/components/Specimen.tsx` (Task 11), and `scripts/build-specimens.mjs` (Task 7). Fields used by `SpecimensGrid.astro` (`r.name`, `r.html_url`, `r.language`, `r.stars`, `r.pushed_at`, `r.topics`, `r.description`, `r.readme_path`, `r.specimen`) exactly match the shape emitted in `scripts/fetch-github.mjs` (Task 6). `portfolio.json` top-level fields (`synced_at`, `activity_52w`, `languages_overall`, `repos`) match between writer (Task 6) and readers (Tasks 9, 10, 13).
