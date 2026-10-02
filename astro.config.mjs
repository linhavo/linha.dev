// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://linha.dev",
	// `output: 'static'` is the default: every page is prerendered to HTML at
	// build time, which is all GitHub Pages can serve.
	vite: {
		plugins: [tailwindcss()],
	},
});
