# github-portfolio

GitHub-driven personal portfolio for [natadecua](https://github.com/natadecua). Statically built, weekly auto-refreshed from the GitHub API, deployed to a static host.

## Design Context

### Users
**Primary audience: hiring managers and senior engineers / tech leads.** They arrive cold, often from a resume link or LinkedIn, and decide in roughly 10 seconds whether to keep reading. They are not looking for an art piece; they are looking for *signal* — what does this person build, how often, in what languages, with what depth. Visual ambition has to serve that scan, not replace it.

Context of use: desktop on a work machine during a hiring screen, occasionally mobile during a commute. Reduced-motion users are common in this audience.

Secondary audience: fellow engineers who land here from a repo link and will tolerate more depth.

### Brand Personality
Three words: **technical, raw, honest** — overlaid with **precise, quiet, confident**.

The portfolio represents the work, not a persona. It should read like someone who would rather show the source than the slide deck. No founder-grin, no marketing voice, no "I help teams ship". Body copy is sparse and factual. The flex is in restraint and in the craft of the specimens, not in adjectives.

### Aesthetic Direction
**Editorial Brutalism × Spatial — "Floating Specimens"** direction.

- **Surface:** off-white paper in light mode (~`oklch(0.97 0.005 80)`), deep ink in dark mode (~`oklch(0.16 0.01 80)`). Both modes tinted slightly warm — not cool slate. System-driven via `prefers-color-scheme`, plus a manual override.
- **Type:** distinctive display face paired with a refined neutral body. **Banned fonts:** Inter, Roboto, DM Sans, Plus Jakarta, IBM Plex (any), Space Grotesk, Space Mono, Fraunces, Instrument Sans/Serif, Outfit. Candidates worth evaluating: Söhne, Neue Haas Grotesk, ABC Diatype, GT America, PP Neue Montreal, PP Editorial New. JetBrains Mono only if used for actual code.
- **Accent:** exactly one. Warm vermillion / signal-orange around `oklch(0.65 0.22 35)`. Used sparingly — full-stops, focus rings, hover states, live-status dot. Never on body text, never as a gradient, never on hero text.
- **Layout:** hairlines instead of borders, generous gaps instead of card containers. No glass, no neon glow, no gradient text, no left-stripe alerts.
- **WebGL:** purposeful, never ambient. Each repo gets a unique generative specimen — seeded by repo name, language, age, and star count — rendered with React Three Fiber. Specimens parallax gently on scroll. **No** atmospheric hero shader, **no** particles, **no** floating background blobs.

**Anti-references (must not resemble):**
- Generic Vercel / shadcn dark dashboard aesthetic.
- Awwwards-agency over-design.
- Corporate SaaS landing pages.

### Design Principles

1. **Signal in the first viewport.** A recruiter must learn within 10 seconds: who, what languages, how active, what's worth clicking. Decoration that delays signal is cut.
2. **Restraint is the flex.** One accent color, one display font, one body font, hairlines not borders, one piece of motion per moment.
3. **Every specimen is data.** Generative 3D objects are derived from real repo facts. If the data can't drive it, it doesn't ship.
4. **Quiet, not slow.** Calm visually, instantaneous mechanically. No intro loader, no blocking animation. Reduced-motion users get a fully static version that loses nothing structural.
5. **WebGL serves the work, not the portfolio.** If JS is disabled or the GPU is weak, the layout still reads end-to-end. Specimens are progressive enhancement.
