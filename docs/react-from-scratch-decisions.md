# Building a React App From Scratch — Full Decision Reference

Every row is a problem that needs solving, not a tool you're obligated to add. Add each piece only once you can say *why* it's there. Ordered roughly in the sequence you'd actually configure them.

Tags used below: **[P1]** = relevant to the business-card site now. **[P2]** = defer to `/lab/` experiments later, not needed yet.

---

## 1. Runtime + package manager — **[P1]**

**Problem it solves:** something has to execute your JS outside the browser (to run build tools, scripts, tests) and something has to resolve/install what your project depends on.

**Options:**
- **Node.js + npm** — the original, ships together, npm is bundled with Node. Still what most CI images and tutorials assume by default.
- **Node.js + pnpm** — same runtime, different package manager. pnpm's content-addressable store avoids duplicate installs across projects, and its strict `node_modules` layout prevents "phantom dependencies" (importing a package you never declared, which happened to be hoisted next to one you did). This is the closest thing to an **industry default at companies with real monorepos** right now.
- **Node.js + Yarn** — historically the pnpm-before-pnpm option (introduced workspaces, lockfiles). Still common in older/larger codebases, less often the default choice for new projects today.
- **Bun** — both the runtime *and* the package manager in one binary. Fast installs, native TypeScript execution (no separate transpile step for your own scripts), built-in test runner and bundler if you want them. The real tradeoff: it's newer, so a smaller fraction of production companies run it as their primary deploy runtime versus using it just for local dev/tooling speed — worth knowing that gap exists even though for a personal site it doesn't matter.
- **Deno** — the other modern contender, secure-by-default (explicit permissions for filesystem/network), built-in TypeScript, but a noticeably different ecosystem/import style (URL imports historically, npm compat layer now). Least common of the four for a React app specifically.

**Your situation:** you already said you like Bun — use it. This row is genuinely low-stakes; nothing else in the list depends on which one you pick, since they all read the same `package.json`.

---

## 2. Framework vs. plain build tool — **[P1]**, this is the decision that reorganizes everything below it

**Problem it solves:** a React app needs *something* to serve it in dev, bundle it for production, and — if you want more than a single static page — handle routing, data-fetching, and possibly server rendering.

This is the fork React's own docs now put front and center, since Create React App (the old one-size-fits-all default) is gone.

**Option A — a framework** (opinionated, does more for you):
- **Next.js** — the biggest one. Full-stack (server rendering, API routes, file-based routing) built in. Overkill for a static business card, genuinely useful once a site needs a backend of its own.
- **React Router (v7, framework mode)** — React Router grew into a full framework, not just a routing library — file-based routes, data loading, SSR if wanted. Lighter footprint than Next.js if you want *some* structure without Next's full server model.
- **Expo** — this is for React Native (mobile), listed here only so you don't confuse it with a web option if you see it recommended alongside the other two.

**Option B — a plain build tool** (you assemble the pieces):
- **Vite** — dev server + HMR + production bundling, framework-agnostic. You add routing, data-fetching, etc. yourself, à la carte. This is what we've been assuming throughout this whole conversation, and it's still the right call for you specifically: a single-page business card doesn't need Next's server model, and Vite is what gives you the consistent per-framework tooling your `/lab/` mirrors need later.
- **Parcel** — the zero-config alternative — point it at an HTML file, it infers the rest. Less mature per-framework plugin depth than Vite, but genuinely worth trying once, given how much you've been drawn to "the obvious path isn't always best."
- **Rsbuild** — newer, built on the Rust-based Rspack bundler, positioned as a faster Webpack-compatible alternative wrapped in a friendlier config layer. Worth knowing it exists; not yet as battle-tested or as broadly plugin-supported as Vite.

**Your situation:** stick with Vite for the reasons already established — but now you know it's a deliberate choice against a real alternative (a framework), not just "the default everyone uses."

---

## 3. JSX transform — **[P1]**

**Problem it solves:** `<div>{name}</div>` isn't valid JavaScript — something has to turn it into `React.createElement(...)` calls (or the newer automatic runtime's equivalent) before the browser ever sees it.

**Options:**
- **Skip JSX, write `React.createElement` by hand** — zero tooling required for this specific concern, maximally transparent, genuinely painful past a few components. A good one-time exercise, not a real setup.
- **Babel-based transform** — the original approach, still what Create React App used. A general-purpose JS compiler with a React plugin.
- **esbuild/SWC-based transform** — what Vite's `@vitejs/plugin-react` and `@vitejs/plugin-react-swc` use under the hood. Faster than Babel for this specific job. **This is the current default** for anyone on Vite — you get it automatically by installing the React plugin, no separate JSX decision needed once you've picked Vite.

**Your situation:** resolved automatically by picking Vite + its React plugin. Worth knowing it's happening, not worth hand-configuring.

---

## 4. TypeScript or not — **[P1]**

**Problem it solves:** JavaScript has no compile-time type checking — typos in prop names or wrong argument types only surface at runtime, sometimes in production.

**Options:**
- **Plain JavaScript** — zero extra tooling, fastest to start, no safety net.
- **JS + JSDoc type comments** — `/** @type {string} */`-style comments that your editor (VS Code) reads for autocomplete/type-checking, with **zero compiler step** — no `tsc`, no `.ts` files. Genuinely underused; worth knowing this middle option exists.
- **Full TypeScript** — `.tsx` files, a `tsconfig.json`, real compile-time checking. This is the **default assumption in most professional React codebases today** — most component libraries ship their own types expecting it, and most job postings list it as a given.

**Your situation:** given you're building this partly to understand fundamentals, doing at least one experiment in plain JS is worth it precisely so you feel what TypeScript is adding — but for the actual business card, TS is the standard call.

---

## 5. Where React itself comes from — **[P1]**

**Problem it solves:** you need the actual `react`/`react-dom` code available at runtime.

**Options:**
- **npm package**, resolved by your package manager, bundled by Vite into your output — **the standard approach**, what enables tree-shaking (unused code gets dropped from the final bundle) and version-locking via your lockfile.
- **CDN `<script>` tag** (unpkg, esm.sh, or React's own CDN links), exposing global `React`/`ReactDOM` — zero build step involvement for this piece specifically. Legitimate for a genuinely tiny page or a learning exercise; not how production React apps are shipped, because you lose tree-shaking and version-pinning discipline.
- **Preact** — a much smaller (~3KB) React-API-compatible alternative, often swapped in via a bundler alias with near-zero code changes. Worth knowing about even if you don't use it — it's evidence that "React" and "the React API" are somewhat separable, which is a genuinely interesting fact about how the ecosystem is layered.

**Your situation:** npm package, no real debate here — you already know React fluently, this row is just about knowing the CDN option exists as the "see it stripped down" version.

---

## 6. CSS approach — **[P1]** (but see prior conversation — you've called this settled)

**Problem it solves:** styling components.

**Options:** plain CSS files, CSS Modules (scoped class names, zero extra syntax to learn — just `import styles from './Button.module.css'`), Sass/SCSS (preprocessor — nesting, variables, mixins, compiles to plain CSS), Tailwind (utility-first, compose classes instead of writing rules), CSS-in-JS (styled-components, Emotion — write CSS inside your JS files; notably **fallen out of favor somewhat** industry-wide compared to its 2019–2021 peak, partly over runtime performance concerns, with CSS Modules or Tailwind more commonly recommended for new projects now).

**Your situation:** already resolved per your earlier call — whatever you're fastest in for the main site, and this whole axis becomes a `/lab/` comparison later.

---

## 7. Routing — **[P2]** for the single-page business card, real decision once the site grows

**Problem it solves:** showing different content for different URLs without a full page reload.

**Options:**
- **None** — a single page with scroll-anchored sections (`<a href="#work">`). This is genuinely fine and often *better* for a small business-card site — no extra dependency, no config, and it's what we assumed for Phase 1 earlier.
- **React Router (library mode)** — the de facto standard client-side router if you do need multiple pages, used stand-alone (not the full framework mode from row 2).
- **TanStack Router** — newer, fully type-safe routing (route params are typed automatically), growing adoption especially in TypeScript-heavy codebases, worth knowing as the more modern alternative.

**Your situation:** skip it for now per the single-page plan — add it the moment the site actually needs a second real page.

---

## 8. State management — **[P2]**, likely unnecessary for the business card at all

**Problem it solves:** sharing and updating data across components that aren't directly related in the component tree.

**Options:**
- **Nothing — just `useState`/`props`** — correct default until you actually feel the pain of prop-drilling. Most small sites never need more than this.
- **Context API** (built into React) — for occasional global values (theme, current user) shared across a few components without a full library.
- **Zustand** — small, minimal-boilerplate external store, currently the most commonly reached-for lightweight option when Context isn't enough.
- **Redux Toolkit** — the modern, much-less-boilerplate-than-classic-Redux version of the long-time industry standard, still common in larger/older codebases and jobs that assume it.
- **TanStack Query** — technically a different problem (server-state / caching data from an API, not client UI state), but frequently mentioned in the same breath — worth knowing it's solving something distinct from Zustand/Redux.

**Your situation:** a business card has no real shared state to manage. Skip this row entirely for now; it's a `/lab/` topic if you want to feel the difference between these approaches later.

---

## 9. Linting & formatting — **[P1]**, optional but cheap

**Problem it solves:** catching bugs/style issues before runtime (linting) and removing bikeshedding over code style (formatting). Zero effect on the shipped app.

**Options:**
- **ESLint + Prettier** — the long-standing combination: ESLint checks code quality/correctness rules (including React-specific ones like the Hooks rules), Prettier owns formatting. Still the **most widely adopted combination**, and what Vite's own React template scaffolds by default.
- **Biome** — a newer, Rust-based single tool that does both linting and formatting in one, dramatically faster than the ESLint+Prettier pair, growing in adoption particularly on projects that value simplicity/speed over ESLint's much larger plugin ecosystem. Not yet as dominant, but a legitimate current alternative rather than a fringe one.

**Your situation:** purely a DX call, add whichever later, changes nothing about how the app runs — fine to skip entirely at first and add once it's annoying not to have it.

---

## 10. Testing — **[P2]** for a business card, real for anything with actual logic

**Problem it solves:** verifying behavior automatically instead of manually re-checking the browser every change.

**Options:**
- **None** — legitimate for a mostly-static business card with no complex interactive logic.
- **Vitest** — Vite-native test runner, shares your existing Vite config, fast. **The natural default once you're already on Vite**, and has largely become the go-to for new Vite-based projects specifically.
- **Jest** — the older, still extremely widely used standard, especially in codebases not built on Vite (e.g., anything still on Webpack, or React Native). Slower to configure alongside Vite than Vitest, since it wasn't designed for Vite's config shape.
- **Testing Library** (`@testing-library/react`) — not a test *runner* at all, but the standard *way* of writing component tests regardless of which runner you use (query the DOM the way a user would, rather than reaching into component internals). Pairs with either Vitest or Jest.
- **Playwright / Cypress** — end-to-end testing (drives a real browser, clicks actual buttons), a different layer than the above (which test components in isolation). Overkill for a business card, genuinely useful once `/lab/` apps get interactive enough to want a real click-through test.

**Your situation:** skip for the business card; a good candidate for a dedicated `/lab/` exercise later, since "what does a test actually verify and how" is its own fundamentals question.

---

## 11. Environment variables — **[P1]**, small but real

**Problem it solves:** config that differs between local dev and production (API URLs, feature flags) without hardcoding it into source.

**Options:**
- **Vite's built-in `import.meta.env`** with `.env` files (`.env`, `.env.production`) — the standard mechanism if you're on Vite, no extra package needed. Only variables prefixed `VITE_` get exposed to client code — a deliberate safety boundary worth understanding, not an arbitrary rule.
- **Nothing** — if the business card genuinely has zero config that differs by environment (plausible — a static portfolio might not), this row can be skipped entirely.

**Your situation:** likely minimal need now, but worth knowing the `VITE_` prefix rule before you hit it as a confusing bug later.

---

## 12. Git hooks / commit conventions — **[P2]**, pure team-process tooling

**Problem it solves:** enforcing lint/format/tests *before* a commit lands, and standardizing commit message shape for auto-generated changelogs.

**Options:** **Husky + lint-staged** (run checks on staged files pre-commit) — the standard pairing where this is wanted at all. **Commitlint + Conventional Commits** — enforces a `feat:`/`fix:`-style message format, mainly valuable when a changelog or semantic-release pipeline reads those messages automatically.

**Your situation:** genuinely a solo-project non-issue — this exists to keep *teams* consistent. Skip entirely unless you specifically want the discipline for yourself.

---

## 13. CI — **[P1]**, but trivial at this scale

**Problem it solves:** running your build (and lint/tests if you add them) automatically on push, before deploying.

**Options:** **GitHub Actions** — the default if your repo's already on GitHub, generous free tier for a public repo. Alternatives (GitLab CI, CircleCI) only matter if you're not on GitHub at all.

**Your situation:** one job — build on push to main, deploy on success — exactly as scoped earlier.

---

## 14. Build output / deploy target — **[P1]**, already decided

**Problem it solves:** getting the `dist/` folder Vite produces onto a public URL.

Already settled in this conversation: **Cloudflare Pages**, for the reliability reasons specific to a business card versus a pure playground.

---

## What this leaves you to actually decide right now

For the business card, the only genuinely open rows are **1** (pick Bun, low-stakes) and **9** (lint/format, add now or later, your call) — everything else in the [P1] rows already has a clear answer from either this doc's reasoning or our earlier conversation. Rows marked [P2] are explicitly *not* yours to decide yet — they're future `/lab/` material, and deciding them now would be re-introducing the exact scope creep we caught earlier.
