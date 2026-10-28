import { describe, expect, test } from "bun:test";
import {
	convertBody,
	frontmatterYaml,
	postSlug,
	type Resolver,
	validate,
} from "./convert";

const resolver: Resolver = {
	note: (linkpath) =>
		({ "Published note": "published-note" })[
			linkpath.split("/").at(-1) ?? ""
		] ?? null,
	file: (linkpath) =>
		({
			"Photo 1.png": "attachments/Photo 1.png",
			"attachments/Photo 1.png": "attachments/Photo 1.png",
			"other/photo 1.PNG": "other/photo 1.PNG",
		})[linkpath] ?? null,
};

const convert = (body: string) => convertBody(body, "post", resolver);

describe("postSlug", () => {
	test("uses the slug property", () => {
		expect(postSlug({ slug: "my-post" }, "Ignored")).toBe("my-post");
	});

	test("falls back to the file name", () => {
		expect(postSlug({}, "Můj první výzkum")).toBe("muj-prvni-vyzkum");
	});
});

describe("validate", () => {
	test("accepts valid properties", () => {
		expect(
			validate({ title: "T", tags: ["KISK"], date: "2025-01-12" }),
		).toEqual([]);
	});

	test("reports missing and wrong properties", () => {
		const problems = validate({ tags: "KISK", date: "2025-01-12" });
		expect(problems.map((problem) => problem.split(":")[0])).toEqual([
			"title",
			"tags",
		]);
	});
});

describe("frontmatterYaml", () => {
	test("keeps schema fields only", () => {
		expect(
			frontmatterYaml({
				title: 'Say "hi"',
				tags: ["a"],
				date: "2025-01-12",
				slug: "x",
				published: true,
				aliases: ["y"],
			}),
		).toBe(
			'---\ntitle: "Say \\"hi\\""\ntags: ["a"]\ndate: "2025-01-12"\n---\n',
		);
	});
});

describe("convertBody", () => {
	test("links published notes and flattens unpublished ones", () => {
		expect(
			convert("[[Published note]], [[Published note|this]] and [[Private]]")
				.markdown,
		).toBe(
			"[Published note](/blog/published-note), [this](/blog/published-note) and Private",
		);
	});

	test("converts Markdown links to notes", () => {
		expect(convert("[see](folder/Published%20note.md)").markdown).toBe(
			"[see](/blog/published-note)",
		);
	});

	test("keeps external and heading links", () => {
		const body = "[a](https://x.cz) [b](#top) [c](/blog/x) [[#Heading]]";
		expect(convert(body).markdown).toBe(
			"[a](https://x.cz) [b](#top) [c](/blog/x) Heading",
		);
	});

	test("converts image embeds and collects images", () => {
		const result = convert(
			"![[Photo 1.png]]\n![[Photo 1.png|A photo]]\n![[Photo 1.png|300]]\n![alt](attachments/Photo%201.png)",
		);
		expect(result.markdown).toBe(
			"![](./post/photo-1.png)\n![A photo](./post/photo-1.png)\n![](./post/photo-1.png)\n![alt](./post/photo-1.png)",
		);
		expect(result.images).toEqual([
			{ vaultPath: "attachments/Photo 1.png", name: "photo-1.png" },
		]);
	});

	test("gives images with the same name unique names", () => {
		const result = convert("![[Photo 1.png]] ![](other/photo%201.PNG)");
		expect(result.markdown).toBe(
			"![](./post/photo-1.png) ![](./post/photo-1-2.png)",
		);
	});

	test("reports missing images", () => {
		expect(convert("![[Missing.png]]").errors).toEqual([
			"Image not found: Missing.png",
		]);
	});

	test("leaves code untouched", () => {
		const body =
			"```md\n[[Private]] %%kept%%\n```\n`[[Private]]` and [[Private]]\n~~~\n```\n[[Private]]\n~~~";
		expect(convert(body).markdown).toBe(
			"```md\n[[Private]] %%kept%%\n```\n`[[Private]]` and Private\n~~~\n```\n[[Private]]\n~~~",
		);
	});

	test("removes comments", () => {
		expect(
			convert("Public %%private%% text\n%%\nhidden\n%%\nend").markdown,
		).toBe("Public  text\n\nend");
	});

	test("turns callouts into blockquotes", () => {
		expect(
			convert("> [!note] Title\n> Body\n\n> [!tip]-\n> Only body").markdown,
		).toBe("> **Title**\n> Body\n\n> Only body");
	});
});
