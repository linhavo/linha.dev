# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **Bun**.

- `bun run dev` — dev server
- `bun run build` — `astro check` (type/diagnostics) + `astro build`
- `bun run check` — Biome lint + format check (sole lint/format tool)
- `bun run format` — Biome, writes fixes

No test suite configured.

## Architecture

**Astro**, static output. `src/pages/*.astro` is the routing table — one file
per URL, no router config. `src/layouts/Base.astro` owns `<html>`/`<head>` and
takes `title`/`description` as props; `Post.astro` wraps it for article-shaped
pages. Both pages currently build to **zero bytes of JS**; keep it that way
unless something genuinely needs interactivity, in which case add a framework
island rather than making the whole page dynamic.

`output: 'static'` is Astro's default and is load-bearing here — GitHub Pages
can only serve prerendered HTML.

Tailwind CSS v4 via `@tailwindcss/vite`, wired through `vite.plugins` in
`astro.config.mjs` — no `tailwind.config.js`; tokens live in an `@theme` block
in `src/styles/index.css`, imported by `Base.astro`. Tailwind's `@theme`/
`@apply` at-rules need explicit opt-in to parse: `biome.json` sets
`css.parser.tailwindDirectives: true`, `.zed/settings.json` sets
`css.lint.unknownAtRules: "ignore"`.

Biome lints and formats `.astro` too, via `html.experimentalFullSupportEnabled`.
That support is experimental — if it starts mangling `.astro` output, exclude
the extension from the formatter rather than reintroducing Prettier.

Images go through `astro:assets` (`<Image>`), which optimizes at build time;
import from `src/assets/`, not `public/`.

Deploy: GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`) uploads
`./dist`. Custom domain via `public/CNAME`, which must stay in `public/` to end
up in the build artifact. `docs/*.md` are historical planning memos (an earlier,
unbuilt monorepo plan with Cloudflare Pages) — not a description of current
structure.

## History

The repo was a Vite + React SPA, then React Router framework mode
(`ssr: false` + a prerender list), before moving to Astro. If you find
references to `app/`, `react-router.config.ts` or `build/client`, they are
stale.
