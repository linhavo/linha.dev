import { type CollectionEntry, getCollection } from "astro:content";
import { slugify } from "./slug";

export type Post = CollectionEntry<"blog">;

// Returns all posts, oldest first, so a post's index is its number. Production builds leave out drafts.
export async function getPosts(): Promise<Post[]> {
	return (
		await getCollection(
			"blog",
			(post) => !(import.meta.env.PROD && post.data.draft),
		)
	).sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
}

export function tagSlug(tag: string): string {
	return slugify(tag);
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
