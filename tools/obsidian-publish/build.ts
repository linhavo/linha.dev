import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { build } from "esbuild";
import manifest from "./manifest.json";

// Bundles the plugin into dist/; with --install, also copies it into the vault from OBSIDIAN_VAULT.
const dir = import.meta.dirname;
const dist = join(dir, "dist");

await build({
	entryPoints: [join(dir, "src/main.ts")],
	outfile: join(dist, "main.js"),
	bundle: true,
	format: "cjs",
	target: "es2022",
	external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
	minify: true,
	logLevel: "info",
});
await copyFile(join(dir, "manifest.json"), join(dist, "manifest.json"));

if (process.argv.includes("--install")) {
	const vault = process.env.OBSIDIAN_VAULT;
	if (!vault) throw new Error("Set OBSIDIAN_VAULT to the path of your vault.");
	const target = join(vault, ".obsidian/plugins", manifest.id);
	await mkdir(target, { recursive: true });
	for (const file of ["main.js", "manifest.json"]) {
		await copyFile(join(dist, file), join(target, file));
	}
	console.log(`Installed into ${target}. Reload Obsidian to load it.`);
}
