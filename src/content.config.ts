import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const kisk = defineCollection({
	loader: glob({ pattern: "*.md", base: "./src/content/kisk" }),
	schema: z.object({
		title: z.string(),
		subtitle: z.string().optional(),
		number: z.number().int(),
		subject: z.string(),
		semester: z.string(),
		tags: z.array(z.string()),
		date: z.coerce.date(),
	}),
});

export const collections = { kisk };
