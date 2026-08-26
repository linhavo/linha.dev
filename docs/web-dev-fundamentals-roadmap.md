# Web Dev Fundamentals — Bottom-Up Roadmap

A pyramid, not a list. Each layer exists to solve a real problem the layer below it couldn't. Understanding *why* a layer exists is the actual goal — the tools (Vite, Sass, React...) are just the current answers to old questions, and those answers keep changing.

For each layer: **Core question → Key concepts → Why it exists → Hands-on check.**

---

## Layer 0 — How a URL becomes pixels (networking)

**Core question:** What actually happens between typing a URL and seeing a page?

**Concepts:** DNS resolution, TCP/TLS handshake, HTTP request/response cycle, status codes, headers, client vs. server, what "hosting" concretely is (a machine with an open port, listening).

**Why it matters:** Everything above assumes this. "Deploying a website" is meaningless until you know what a server is actually doing when a browser asks it for something.

**Hands-on check:** Open DevTools → Network tab on any site. Watch a request: DNS lookup, TLS handshake, request headers, response headers, status code. Then do the same thing with `curl -v https://example.com` from a terminal — same information, no browser UI hiding it.

---

## Layer 1 — HTML & the DOM

**Core question:** What's the difference between "the HTML I wrote" and "the page that exists in the browser"?

**Concepts:** HTML as markup (elements, attributes, semantics). The **DOM** — the browser parses your HTML into a live tree of objects in memory. The DOM is not your HTML file; it's the browser's working model, and it's what JavaScript actually touches. This distinction is one people skip and then get confused by, for years.

**Why it matters:** Every framework you'll ever touch is, underneath, a system for changing the DOM efficiently. You can't judge whether a framework's approach is smart until you've felt what it's automating.

**Hands-on check:** No framework, no build tool — just a `<script>` tag. Use `document.querySelector`, `appendChild`, `.textContent` to build and mutate a small page by hand. Feel how tedious it gets past a handful of elements. That tedium is the entire reason frameworks exist (Layer 6).

---

## Layer 2 — CSS: the box model & layout

**Core question:** How does the browser decide where things go and how conflicting styles resolve?

**Concepts:** The cascade + specificity (why "cascading" is in the name — later/more-specific rules win, in defined ways). The box model (content/padding/border/margin). Layout systems: normal flow, **Flexbox** (one-dimensional), **Grid** (two-dimensional) — as actual different mental models, not interchangeable property lists. Responsive basics: media queries, relative units.

**Why it matters:** This is the layer your design background will click into fastest — but "knowing CSS" and "knowing why a layout algorithm produces this result" are different levels of fluency.

**Hands-on check:** Build one non-trivial layout (e.g., a card grid with a sticky header) using only raw CSS, no framework, no preprocessor. Notice where it gets annoying — repetition, no variables, deep nesting via `.parent .child .grandchild` selectors. That annoyance is the setup for the next layer.

---

## Layer 2.5 — Sass vs. Tailwind (not actually the same category)

**Core question:** What specific pain does each one remove — and are they even solving the same problem?

**Concepts:**
- **Sass** is a *preprocessor*: it compiles down to plain CSS, adding nesting, variables, mixins, functions. You're still writing custom CSS rules — just with less repetition and more structure.
- **Tailwind** is a *utility-first framework*: instead of writing CSS rules at all, you compose pre-made single-purpose classes (`flex`, `pt-4`, `text-slate-600`) directly in markup. It's solving a different problem — naming things, context-switching between HTML and CSS files, keeping a design system consistent — not "CSS is repetitive," but "custom CSS at scale drifts."

These aren't really competitors on the same axis, even though they get pitted against each other online. (They can even be combined, though that's less common now.)

**Hands-on check:** Build the *same* small component three ways — raw CSS, Sass, Tailwind. This is genuinely the most valuable exercise in this whole layer, and it's basically the "mirror" idea from earlier, just applied to styling instead of frameworks.

---

## Layer 3 — JavaScript: the language vs. the browser

**Core question:** What is actually "JavaScript," and what's the browser handing you for free?

**Concepts:** The language itself — variables, functions, closures, the event loop (how async/promises actually get scheduled, not just the syntax). Separately: **Web APIs** — `fetch`, DOM methods, `localStorage` — are *not* JavaScript language features. They're provided by the browser as host environment. This split matters because Node.js gives you the same language with a different set of host APIs (no DOM, but `fs`, etc.) — which is exactly why "JavaScript everywhere" was ever a viable pitch.

**Hands-on check:** Build one small interactive thing — a form with validation, a toggle — with a single `<script>` tag, zero build tool, zero framework, zero npm.

---

## Layer 4 — Modules & the packaging problem

**Core question:** Once your JS spans multiple files, how do they share code — and how do you use code someone else wrote?

**Concepts:** The historical split between **CommonJS** (Node's `require`/`module.exports`) and **ES Modules** (`import`/`export`, now the browser-native standard) — worth knowing both exist because you'll still see CommonJS in older tooling configs. **npm** and package managers: the actual problems they solve are dependency *resolution* (what needs what), versioning (semver), and reproducibility (lockfiles pin exact versions so "works on my machine" doesn't happen). `node_modules` is just the on-disk result of that resolution.

**Hands-on check:** `npm init` a bare folder, `npm install` one small package (no framework), open `node_modules`, look at `package.json` vs. `package-lock.json`. Understand what the lockfile is pinning and why.

---

## Layer 5 — The build tool / bundler (this is where Vite actually slots in)

**Core question:** Why can't the browser just load your modules and packages directly?

**Concepts:** Two real gaps: (1) browsers historically choked on hundreds of individual module requests over the network (a request waterfall), and (2) browsers don't understand JSX, TypeScript, Sass, or "import a package by bare name from `node_modules`" natively — someone has to transform that into plain JS/CSS the browser *does* understand. A bundler (Vite, and what it wraps — esbuild for dev, Rollup/Rolldown for prod) does: transpilation, bundling, a dev server with hot module replacement, and an asset pipeline for CSS/images.

This is the direct answer to last week's question — now it lands as "the specific gap it fills," instead of an assumed starting point.

**Hands-on check:** Take the Layer 4 setup — a package installed via npm — and try to `import` it directly in a `<script type="module">` with no build tool. Watch it fail or need an import map. Then run the identical code through Vite and watch it just work. That gap *is* the lesson.

---

## Layer 6 — Frameworks (React, Svelte, Vue, Solid...)

**Core question:** Once UI has many interdependent pieces of state, why does manual DOM manipulation stop scaling?

**Concepts:** Frameworks replace "manually call `appendChild`/`textContent` when data changes" (Layer 1, felt directly) with a **declarative model**: describe what the UI *should* look like for a given state, and let the framework handle diffing/updating the real DOM. Different frameworks (React's virtual DOM diffing, Svelte's compile-time reactivity, Solid's fine-grained signals) are different answers to *how* to do that translation efficiently — this is where your original mirror-the-frameworks idea plugs back in, now sitting on an actual foundation instead of skipping to it.

**Hands-on check:** This is the point where your existing plan (React fluency, mirror in Svelte/Vue/etc.) becomes the right next move — you'll actually be able to tell what each framework is doing *for* you, because you built the same thing by hand in Layer 1.

---

## Layer 7 — Deployment & production concerns

**Core question:** What changes between "runs on my machine" and "a stranger loads it over the internet"?

**Concepts:** Static hosting vs. server rendering vs. edge rendering, CDNs, caching headers, environment differences (this is where our earlier Vite/GitHub Pages/Cloudflare Pages conversation actually belongs — as the last layer, not the first decision).

---

## How this connects to what we discussed before

Everything in the last few messages — Vite, package managers, GitHub Pages vs. Cloudflare Pages — was **Layers 4, 5, and 7**. Perfectly good questions, just answered out of order relative to the actual dependency chain. Once you've built through Layers 0–3 by hand, those tooling decisions stop being abstract tradeoffs and start being obvious — you'll *feel* the problem each tool solves because you'll have hit it yourself first.

## Suggested pace

Not a race — but roughly: Layers 0–1 (network + DOM) can be a single focused session each, since they're conceptual rather than build-heavy. Layer 2/2.5 (CSS) rewards more time given your design background — you'll get more out of depth here than speed. Layers 3–5 build on each other directly, so keep them close together. Layer 6 is genuinely open-ended — that's your long-running framework-mirror project, once it has a foundation under it.
