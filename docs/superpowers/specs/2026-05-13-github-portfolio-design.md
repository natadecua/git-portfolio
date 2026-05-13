# github-portfolio — Design Spec

**Date:** 2026-05-13
**Status:** Approved (ready for implementation plan)
**Owner:** natadecua

## Summary

A statically-built personal portfolio for [github.com/natadecua](https://github.com/natadecua), refreshed weekly from the GitHub API by a scheduled GitHub Action. The visual direction is **Editorial Brutalism × Spatial — "Floating Specimens"**: a calm, off-white (or deep-ink) typographic layout in which each repo is represented by a unique generative WebGL specimen seeded by real repo data. The site must deliver clear professional signal to a hiring manager within the first 10 seconds while still rewarding deeper exploration.

The design context (audience, brand personality, anti-references, aesthetic tokens, design principles) is defined in [`.impeccable.md`](../../../.impeccable.md) and mirrored in [`CLAUDE.md`](../../../CLAUDE.md). This spec defines the technical system that delivers that design.

## Goals & non-goals

**Goals**
- Communicate, in the first viewport, who the author is, what they build, what languages, and how active they are.
- Render real repo data (name, description, language, stars, topics, README, last activity) — never lorem ipsum, never placeholders.
- Refresh data weekly without manual work and without ever exposing a GitHub token to the browser.
- Visually distinct from generic AI/SaaS/Vercel-template portfolios; passes the "AI slop test" defined in the impeccable skill.
- Fully readable with JavaScript disabled and fully usable with reduced-motion preference.

**Non-goals**
- Not a CMS. No admin UI. Content edits happen via repo changes (`portfolio.config.json` or commits to source repos).
- Not a blog engine. There is no `/posts` route. (If desired later, it belongs in a separate spec.)
- Not an analytics dashboard. We do not display traffic, visitor counts, or vanity metrics.
- Not interactive at the repo level beyond detail expansion (no inline editing, no commenting, no GitHub auth flow for visitors).

## Architecture

```
github.com/natadecua/*  ─► GitHub Actions (cron: 0 3 * * 0, weekly)
                           ├─ fetch via fine-grained PAT (Metadata: read, Contents: read)
                           ├─ filter through portfolio.config.json allowlist
                           ├─ sanitize → src/data/portfolio.json + src/data/readmes/*.md
                           └─ git commit "chore(data): weekly refresh YYYY-MM-DD"
                               │
                               ▼
                           Cloudflare Pages auto-deploy (on push to main)
                               │
                               ▼
                           Astro static site
                             - HTML/CSS shipped from build
                             - Only <Specimen> components hydrate (R3F islands)
                             - portfolio.json baked into the build, no runtime API
```

The PAT lives only as a GitHub Actions secret. It is never present in the built site. The deployed artifact is static HTML, CSS, JS, and JSON — there is no runtime call to the GitHub API.

## Components

### Pipeline (build-time / Action-time)

- **`scripts/fetch-github.mjs`** — Octokit client. Reads `portfolio.config.json`, lists user repos (public + explicitly allowlisted private), pulls metadata + README for each, applies sanitization (see below), writes `src/data/portfolio.json` and `src/data/readmes/{repo}.md`.
- **`scripts/build-specimens.mjs`** — pre-rasterizes a static SVG fallback for each repo's specimen, written to `public/specimens/{repo}.svg`. The browser only loads R3F if WebGL is available; otherwise it renders the SVG inline.
- **`portfolio.config.json`** — single source of truth for allowlisting:
  ```json
  {
    "include_public": true,
    "include_private_explicit": [],
    "exclude": ["dotfiles", "test-repo"],
    "pinned_order": [],
    "max_repos": 12,
    "min_stars": 0
  }
  ```

### Astro site (`src/`)

- **`<Hero>`** — name, one-line role, GitHub link, live-status indicator showing "synced Xd ago" derived from `portfolio.json.synced_at`. Pure HTML/CSS, no hydration.
- **`<SpecimensGrid>`** — server-rendered grid. Each row is a `<Specimen client:visible>` island plus static metadata (rank, name, language, stars, last-commit relative time).
- **`<Specimen>`** — React Three Fiber canvas, ~120px square. Generative form deterministically seeded by `{name, language, stars, age_days}`:
  - language → geometry family (TypeScript → sphere variants, Rust → polyhedra, Python → tori, Go → cylinders, etc.; one family per top-N language, generic family for the rest)
  - stars → density / subdivision count
  - age → rotation rate (older = slower)
  - hover → exponential scale-up to 200%, neighbors fade to 40% opacity
- **`<ProjectDetail>`** — expansion view triggered by clicking a specimen. Uses the View Transitions API to morph the specimen into a hero position. Renders the repo's README (truncated, see Data Flow), a typographic language bar, last 5 commit messages with relative dates, and an outbound link to the repo. Closing returns to the grid with a reverse transition.
- **`<Rhythm>`** — 52-week activity strip rendered as monospace cells in a single line; intensity expressed as text opacity, not color squares. Below it, a typographic language breakdown: `typescript ████░░░░░ 54%`. All from data, no live API.
- **`<Footer>`** — one paragraph, mailto link, two-or-three socials. Plain text, no icons.

### Visual tokens (CSS custom properties)

```css
:root {
  --ink:      oklch(0.16 0.01 80);
  --paper:    oklch(0.97 0.005 80);
  --hairline: color-mix(in oklch, var(--ink) 14%, transparent);
  --muted:    color-mix(in oklch, var(--ink) 55%, transparent);
  --accent:   oklch(0.65 0.22 35);  /* vermillion */
  /* 4pt spacing scale */
  --s-1: 4px;  --s-2: 8px;   --s-3: 12px;  --s-4: 16px;
  --s-5: 24px; --s-6: 32px;  --s-7: 48px;  --s-8: 64px;  --s-9: 96px;
}
@media (prefers-color-scheme: dark) {
  :root { --ink: oklch(0.97 0.005 80); --paper: oklch(0.16 0.01 80); }
}
```

A manual theme override (`data-theme="light|dark"` on `<html>`) takes precedence over the media query. Toggle persists via `localStorage`.

### Typography

Display + body share one family; mono is reserved for actual metadata (stars, dates, language tags). Final pick happens during implementation via a side-by-side visual review, chosen from candidates that satisfy the impeccable banned-font rule: PP Neue Montreal, GT America (Mono cut for metadata), ABC Diatype, or Söhne. JetBrains Mono is acceptable strictly for code blocks inside README rendering. Fluid `clamp()` on hero and section headings; fixed `rem` on body and UI.

## Data flow

```
GitHub API (Octokit, server-side, runner-only)
  ↓
filter:    apply portfolio.config.json (include_public, allowlist, exclude, max_repos, min_stars)
  ↓
sanitize:  pick { name, description, language, stars, topics, pushed_at, html_url, is_private }
           pick README → strip HTML/<script>, truncate at first <details> or 8KB
           never include: full file tree, commit diffs, issue contents, collaborator info
  ↓
emit:      src/data/portfolio.json      (one array of repos + meta { synced_at, languages: {…} })
           src/data/readmes/{name}.md   (one file per repo)
           public/specimens/{name}.svg  (static fallback specimen)
  ↓
git commit & push → Cloudflare Pages deploy
```

`portfolio.json` shape:

```jsonc
{
  "synced_at": "2026-05-12T03:00:00Z",
  "languages_overall": { "TypeScript": 0.54, "Python": 0.22, "Rust": 0.14, "Other": 0.10 },
  "activity_52w": [0,2,1,0,…],  // 52 ints, commits per week
  "repos": [
    {
      "name": "repo-one",
      "description": "…",
      "language": "TypeScript",
      "stars": 142,
      "topics": ["cli","developer-tools"],
      "pushed_at": "2026-05-09T14:22:00Z",
      "html_url": "https://github.com/natadecua/repo-one",
      "is_private": false,
      "readme_path": "src/data/readmes/repo-one.md",
      "specimen_svg": "/specimens/repo-one.svg"
    }
  ]
}
```

## Security model

1. **Token scope.** Fine-grained PAT. Resource owner: natadecua. Selected repos: every repo listed in `include_private_explicit` plus all public repos (PAT auto-includes public ones). Permissions: `Metadata: read`, `Contents: read`. Nothing else. Expiry: 365 days; rotation reminder issue auto-opened by the Action 14 days before expiry.
2. **Storage.** PAT stored as `GH_READ_TOKEN` in GitHub Actions repository secrets. Never logged, never printed (Actions auto-redacts named secrets). Never sent to the client.
3. **Allowlist defense in depth.** Even if the PAT could read more, the build only ever reads repos that pass `portfolio.config.json`. The config file is committed and reviewable.
4. **README sanitation.** READMEs may contain inline HTML. The Action strips `<script>`, `<iframe>`, and on-* attributes via a markdown→HTML pipeline that runs at build time. Output is then re-serialized as markdown so Astro renders it through its own trusted markdown plugin.
5. **Truncation.** READMEs are cut at the first `<details>` tag or 8KB, whichever comes first. This prevents accidentally exposing the full content of a long private repo README.
6. **No comment/collaborator surfaces.** The Action never fetches issues, PRs, discussions, or collaborator lists. This is enforced by the fact that the Action only calls `repos.listForUser`, `repos.get`, and `repos.getReadme` endpoints.

## Error handling

- **Action failure** (auth error, rate limit, network) — previous `portfolio.json` remains committed. Site continues to serve last good data. Action opens a GitHub issue titled `weekly sync failed YYYY-MM-DD` with the error excerpt.
- **Repo removed/renamed** — drops out of `portfolio.json` on next run. Stale `readmes/{old}.md` and `specimens/{old}.svg` are pruned by the Action.
- **WebGL unsupported / `prefers-reduced-motion: reduce` / JS disabled** — the static SVG fallback specimen renders inline; no R3F bundle loads at all. Layout is unchanged.
- **PAT expired** — Action fails immediately with a clear error in the auto-opened issue. The expiry-reminder issue (14 days prior) should have prevented this.

## Testing

- **Vitest** unit tests for security-critical pipeline pieces:
  - allowlist filter (include/exclude/max_repos behavior)
  - sanitizer (script/iframe stripping, README truncation at `<details>` and 8KB)
  - specimen seed determinism (same inputs → same SVG)
- **Playwright** smoke test:
  - `astro build && astro preview` → page loads under 200ms
  - hero text present, at least one specimen mounts on a WebGL-enabled browser
  - reduced-motion path: SVG fallback renders, no R3F bundle requested
  - JS-disabled path (`page.context().route` to block `*.js`): layout still reads end-to-end
- **Manual visual review** during implementation, gated by the impeccable principles in `.impeccable.md`. No PR merges without an explicit "passes AI-slop test" check.

## Deployment & operations

- **Host:** Cloudflare Pages, custom domain TBD.
- **Build command:** `pnpm install && pnpm build`
- **Output dir:** `dist/`
- **Branch:** `main` deploys to production.
- **Cron:** Action workflow `.github/workflows/weekly-sync.yml` runs `on: schedule: cron: "0 3 * * 0"` (Sundays 03:00 UTC) and `workflow_dispatch` for manual triggers.
- **Secrets:** `GH_READ_TOKEN` (PAT).
- **Repo:** the portfolio repo itself is public. Source is open, data is sanitized, the only sensitive value is the runner-only PAT.

## Implementation phases (preview — full plan comes from writing-plans skill)

1. Repo scaffold + Astro skeleton + Cloudflare Pages connection + `.impeccable.md` already in place.
2. GitHub fetch pipeline + `portfolio.config.json` + sanitization + Vitest tests. Manually triggered once to produce real data.
3. Hero + SpecimensGrid + static SVG specimen rasterizer. No WebGL yet. This is the "JS-off baseline".
4. `<Specimen>` R3F component with one geometry family. Visual review against `.impeccable.md` principles before adding more families.
5. ProjectDetail with View Transitions.
6. Rhythm chart + Footer.
7. Weekly cron workflow + expiry-reminder issue logic.
8. Playwright smoke test + impeccable polish pass + ship.

Each phase ends with a visible artifact and a verification step. Specifics are deferred to the implementation plan produced by `writing-plans`.
