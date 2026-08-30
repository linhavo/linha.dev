# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **Bun**.

- `bun run dev` — dev server
- `bun run build` — `tsc` (no emit) + Vite build
- `bun run check` — Biome lint + format check (sole lint/format tool)
- `bun run format` — Biome, writes fixes

No test suite configured.

## Architecture

Single static page: `src/main.tsx` mounts `src/App.tsx`, no router/state library.

Tailwind CSS v4 via `@tailwindcss/vite` — no `tailwind.config.js`; tokens live in an `@theme` block in `src/index.css`. Tailwind's `@theme`/`@apply` at-rules need explicit opt-in to parse: `biome.json` sets `css.parser.tailwindDirectives: true`, `.zed/settings.json` sets `css.lint.unknownAtRules: "ignore"`.

`eslint.config.js` was removed in favor of Biome; `eslint`/`typescript-eslint` deps in `package.json` are leftovers from that migration (`biome.json`'s verbose `overrides` block looks `biome migrate eslint`-generated), not active tooling.

Deploy: GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`), custom domain via root `CNAME`. `docs/*.md` are historical planning memos (an earlier, unbuilt monorepo plan with Cloudflare Pages) — not a description of current structure.
