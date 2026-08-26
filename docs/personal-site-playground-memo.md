# Personal Site + Learning Playground — Planning Memo

**Date:** 2026-08-26
**Status:** 📝 Planning — repo not yet created, no code written. Two reference docs produced this session (`web-dev-fundamentals-roadmap.md`, `react-from-scratch-decisions.md`); decisions below build on that pairing.

---

## Purpose

Two projects, one repo, deliberately decoupled in scope and stakes:

1. **Business card site** — compact freelance portfolio, real stakes (needs to reliably work when sent to a client)
2. **`/lab/`** — long-running, open-ended learning playground: web fundamentals from the ground up, then framework mirrors (Svelte/Vue/Solid/Angular) once fundamentals are solid

Plus a **`/work/<project>/`** slot for an existing HTML/JS/CSS project, linked from the main site as a portfolio piece (not a `/lab/` mirror — no shared tokens/content wiring needed for it).

---

## Repo Structure (planned)

```
site/
├── apps/
│   ├── main/                 # React + Vite — business card, ships first
│   ├── work-<legacy-name>/   # old HTML/JS/CSS project, copied in as-is
│   └── (lab-*/ added one at a time, later — not pre-scaffolded)
├── packages/
│   ├── tokens/                # shared CSS custom properties
│   └── content/                # shared copy/project data (JSON/MDX)
├── package.json (workspaces)
└── build.ts                    # Bun script: build all apps, stitch into one dist/
```

- No Turborepo/Nx needed at this size — `bun run --filter '*' build` covers a handful of small apps
- Legacy project's likely absolute asset paths (`href="/style.css"` etc.) need checking/fixing before nesting under `/work/<name>/`

---

## Three-Role Split (learning vs. building vs. recording)

| Role | Tool | What it holds |
|---|---|---|
| Coverage check | roadmap.sh/frontend | topic checklist + external resource links — **not** where the learning happens |
| Experimentation | this repo, `/lab/*` | actual code for each experiment |
| Findings | Obsidian vault | memo per experiment — what was done, what was observed, cross-links between concepts |

Rejected: a separate dedicated docs repo — Obsidian already does backlinking/graph view better, and a docs-only repo would just duplicate that with no benefit.

---

## Learning Methodology (for `/lab/`)

- **Bottom-up pyramid**, not framework-first: each layer exists to solve a problem the layer below it couldn't. Full breakdown lives in `web-dev-fundamentals-roadmap.md` — Layers 0–7: networking → DOM → CSS/Sass/Tailwind → JS language vs. browser APIs → modules/package managers → bundlers → frameworks → deployment.
- **Method per topic: isolate-and-observe experiments**, not tutorial-following or "build a small thing." Same instinct as the `curl -vk --resolve` trick used to isolate Caddy from cloudflared in the Immich tunnel memo — strip away everything except the one variable, then watch the mechanism directly instead of reading about it.
  - e.g. Layer 5 (bundler): try to `import` an npm package via a bare specifier with no bundler, watch the exact browser error; then run the same file through `vite build` and diff the transformed output in `dist/`.
- Each experiment gets an Obsidian memo — same habit as the homelab gotchas logs, applied to a new domain.

---

## Tooling Decisions — Business Card (Phase 1)

| Concern | Decision | Why |
|---|---|---|
| Runtime + package manager | Bun | already preferred; low-stakes, nothing else in the stack depends on this choice |
| Framework vs. plain build tool | **Plain build tool** (not Next.js / React Router framework mode) | static single-page site doesn't need a server model |
| Build tool | Vite | best per-framework HMR/plugin depth across React now and Svelte/Vue/Solid mirrors later — this is the actual reason it beat Parcel/Rsbuild/Turbopack, not just "the default" |
| JSX / TypeScript | TypeScript, JSX handled automatically via Vite's React plugin | current default assumption in professional React work |
| Routing | None — single page, scroll-anchored sections | no second page yet; add React Router (library mode) only once one's actually needed |
| State management | None needed | no real shared state on a business card |
| CSS approach | User's call — whatever's fastest (Tailwind/Sass/plain) | main site isn't the CSS-approach experiment; that comparison belongs in `/lab/` instead |
| Lint/format | Open — ESLint+Prettier (standard) or Biome (faster, newer, single tool) | purely DX, zero runtime effect, safe to decide later |
| Testing | Skipped for now | no complex logic yet; good `/lab/` topic later (Vitest vs. Jest, Testing Library) |
| Env vars | Vite's `import.meta.env` + `.env` files, if/when needed | client-exposed vars require `VITE_` prefix — worth knowing before it's a confusing bug |
| CI | GitHub Actions, one job (build → deploy) | trivial at this scale |
| Deploy | **Cloudflare Pages** | reliability matters now that it's a real business deliverable — different calculus than a pure playground, where self-hosting on aperture would've been equally reasonable |

Deliberately **not** decided yet — explicitly deferred to `/lab/`, not oversights: multi-page routing, state management approach, testing setup. Re-deciding these now would be re-introducing the exact scope creep this conversation caught itself doing earlier.

---

## Corrections Made Mid-Conversation (worth keeping)

| Initial framing | Correction |
|---|---|
| Treat main site + `/lab/` infra as one simultaneous decision | Split by stakes: business card ships lean now (Cloudflare Pages, Vite, no router); `/lab/` grows one experiment at a time, fed by whichever fundamentals layer is current |
| "Hands-on check" = build a small thing per topic | Should be isolate-and-observe experiments — one variable at a time, watched directly, not built as a mini-project |
| roadmap.sh as "where the learning happens" | It's a coverage checklist + resource links only; the actual learning is the hands-on experiment plus the Obsidian memo written afterward |
| GitHub Pages' lack of PR previews mattered as a deploy factor | Didn't, once clarified that testing happens locally before merge — removed as a deciding factor |
| Vite treated as an unexamined default | Corrected: React's current official guidance (post-Create-React-App deprecation) frames framework-vs-build-tool as the first fork; Vite is a deliberate choice against Next.js/React Router framework mode, not a rubber-stamped default |

---

## Reference Docs Produced This Session

- **`web-dev-fundamentals-roadmap.md`** — the Layer 0–7 pyramid, with a hands-on experiment per layer
- **`react-from-scratch-decisions.md`** — full concern-by-concern breakdown for building a React app without a generated scaffold, each row tagged [P1] (business card, now) or [P2] (defer to `/lab/`)

Both intended to move into the new repo (or link from Obsidian if kept out of git) — placement still the user's call.

---

## Open Follow-ups

- [ ] Create the actual repo; decide public visibility (needed either way for Cloudflare Pages + a public `/lab/`)
- [ ] Move or link `web-dev-fundamentals-roadmap.md` and `react-from-scratch-decisions.md` into the repo or Obsidian
- [ ] Scaffold `apps/main/` from an empty folder, row-by-row per the decision doc — deliberately not via `create vite`
- [ ] Decide lint/format tooling (ESLint+Prettier vs. Biome) — low-stakes, can be deferred
- [ ] Draft business card content/copy — not yet written
- [ ] Audit legacy HTML/JS/CSS project for absolute paths before nesting under `/work/<name>/`
- [ ] Set up the Cloudflare Pages project once the repo exists
- [ ] Confirm single-page-with-anchors is the final call, or whether distinct sections need real nav

---

## Sources / Related Context

- Homelab memo conventions this format follows: `aperture-backup-memo.md`, `hermes-agent-vps-memo.md`, `aperture-docker-logging-memo.md`
- React's Create React App deprecation announcement: https://react.dev/blog/2025/02/14/sunsetting-create-react-app
- roadmap.sh/frontend: https://roadmap.sh/frontend
