// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://linha.dev",
	// `file` emits `kisk.html` instead of `kisk/index.html`, so /kisk serves
	// directly rather than 301-ing to /kisk/. The home page is unaffected:
	// the root is always index.html.
	build: { format: "file" },
	// `output: 'static'` is the default: every page is prerendered to HTML at
	// build time, which is all GitHub Pages can serve.
	vite: {
		plugins: [tailwindcss()],
	},
});
