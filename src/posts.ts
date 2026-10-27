import { type CollectionEntry, getCollection } from "astro:content";

export type Post = CollectionEntry<"blog">;

// Returns all posts, oldest first, so a post's index is its number.
export async function getPosts(): Promise<Post[]> {
	return (await getCollection("blog")).sort(
		(a, b) => a.data.date.getTime() - b.data.date.getTime(),
	);
}

// Turns a tag like "výzkum" into a URL segment like "vyzkum".
export function tagSlug(tag: string): string {
	return tag
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export function tagHref(tag: string): string {
	return `/blog/tag/${tagSlug(tag)}`;
}

// Gives tag list pages a custom heading; other tags use their name.
export const tagPages: Record<string, { title: string; description: string }> =
	{
		kisk: {
			title: "KISK Portfolio",
			description: "Aneb jak jsem studoval v Brně",
		},
	};

export function formatNumber(n: number): string {
	return String(n).padStart(2, "0");
}
