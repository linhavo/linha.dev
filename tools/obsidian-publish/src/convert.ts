import { blogSchema } from "../../../src/content/schema";
import { slugify } from "../../../src/slug";

// Looks up link targets in the vault; the plugin passes Obsidian-backed functions, tests pass stubs.
export type Resolver = {
	// Returns the slug of a published note, or null.
	note(linkpath: string): string | null;
	// Returns the vault path of an existing file, or null.
	file(linkpath: string): string | null;
};

export type Image = { vaultPath: string; name: string };

export type Converted = {
	markdown: string;
	images: Image[];
	errors: string[];
};

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|svg)$/i;
const FENCE = /^\s*(```|~~~)/;
// Matches a wikilink or embed, or a Markdown link or image.
const LINK =
	/(!?)\[\[([^\]|#^]*)([#^][^\]|]*)?(?:\|([^\]]*))?\]\]|(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const CALLOUT = /^(\s*(?:>\s*)+)\[!\w+\][+-]?\s*(.*)$/;

// Uses the `slug` property when set, otherwise the note's file name.
export function postSlug(
	frontmatter: Record<string, unknown>,
	basename: string,
): string {
	const slug = frontmatter.slug;
	return slugify(typeof slug === "string" && slug ? slug : basename);
}

// Validates the note's properties against the site schema and returns one message per problem.
export function validate(frontmatter: Record<string, unknown>): string[] {
	const result = blogSchema.safeParse(frontmatter);
	if (result.success) return [];
	return result.error.issues.map(
		(issue) => `${issue.path.join(".") || "properties"}: ${issue.message}`,
	);
}

// Writes only the schema's fields, so vault-only properties stay private.
export function frontmatterYaml(frontmatter: Record<string, unknown>): string {
	const lines = Object.keys(blogSchema.shape)
		.filter((key) => frontmatter[key] !== undefined)
		.map((key) => `${key}: ${JSON.stringify(frontmatter[key])}`);
	return `---\n${lines.join("\n")}\n---\n`;
}

// Converts Obsidian syntax to plain Markdown and collects the images the post uses.
export function convertBody(
	body: string,
	slug: string,
	resolve: Resolver,
): Converted {
	const images = new Map<string, Image>();
	const errors: string[] = [];

	const imageLink = (linkpath: string, alt: string) => {
		const vaultPath = resolve.file(linkpath);
		if (!vaultPath) {
			errors.push(`Image not found: ${linkpath}`);
			return alt;
		}
		let image = images.get(vaultPath);
		if (!image) {
			image = { vaultPath, name: imageName(vaultPath, images) };
			images.set(vaultPath, image);
		}
		return `![${alt}](./${slug}/${image.name})`;
	};

	const noteLink = (linkpath: string, text: string) => {
		const target = resolve.note(linkpath);
		return target ? `[${text}](/blog/${target})` : text;
	};

	const convertLinks = (text: string) =>
		text.replace(
			LINK,
			(match, wikiEmbed, wikiTarget, anchor, alias, mdEmbed, mdText, mdUrl) => {
				if (wikiTarget !== undefined) {
					const target = wikiTarget.trim();
					if (wikiEmbed && IMAGE_EXTENSIONS.test(target)) {
						const alt = alias && !/^\d+(x\d+)?$/.test(alias) ? alias : "";
						return imageLink(target, alt);
					}
					const text =
						alias ?? (target ? basename(target) : (anchor ?? "").slice(1));
					return target ? noteLink(target, text) : text;
				}
				if (/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(mdUrl)) return match;
				const target = decodeURI(mdUrl);
				if (mdEmbed && IMAGE_EXTENSIONS.test(target)) {
					return imageLink(target, mdText);
				}
				if (/\.md$/i.test(target)) {
					return noteLink(target.replace(/\.md$/i, ""), mdText);
				}
				return match;
			},
		);

	const markdown = splitFences(body)
		.map(({ code, text }) => (code ? text : convertProse(text, convertLinks)))
		.join("\n");

	return { markdown, images: [...images.values()], errors };
}

// Strips comments, flattens callouts and converts links outside inline code.
function convertProse(text: string, convertLinks: (text: string) => string) {
	return text
		.replace(/%%[\s\S]*?%%/g, "")
		.split("\n")
		.flatMap((line) => {
			const callout = line.match(CALLOUT);
			if (!callout) return [line];
			return callout[2] ? [`${callout[1]}**${callout[2]}**`] : [];
		})
		.join("\n")
		.split(/(`[^`\n]*`)/)
		.map((part, i) => (i % 2 ? part : convertLinks(part)))
		.join("");
}

// Splits the body into fenced code blocks and the prose between them.
function splitFences(body: string): { code: boolean; text: string }[] {
	const chunks: { code: boolean; lines: string[] }[] = [];
	let fence: string | null = null;
	for (const line of body.split("\n")) {
		const marker = line.match(FENCE)?.[1];
		const code = fence !== null || marker !== undefined;
		const last = chunks.at(-1);
		if (last && last.code === code) last.lines.push(line);
		else chunks.push({ code, lines: [line] });
		if (fence === null && marker) fence = marker;
		else if (fence !== null && marker === fence) fence = null;
	}
	return chunks.map(({ code, lines }) => ({ code, text: lines.join("\n") }));
}

// Names the published image after its file name, unique within the post.
function imageName(vaultPath: string, taken: Map<string, Image>): string {
	const file = basename(vaultPath);
	const dot = file.lastIndexOf(".");
	const stem = slugify(file.slice(0, dot)) || "image";
	const extension = file.slice(dot + 1).toLowerCase();
	const names = new Set([...taken.values()].map((image) => image.name));
	let name = `${stem}.${extension}`;
	for (let i = 2; names.has(name); i++) name = `${stem}-${i}.${extension}`;
	return name;
}

function basename(path: string): string {
	return path.slice(path.lastIndexOf("/") + 1);
}
