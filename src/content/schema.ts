import { z } from "zod";

// Defines post frontmatter; the site and the Obsidian plugin both validate against it.
export const blogSchema = z.object({
	title: z.string(),
	subtitle: z.string().optional(),
	subject: z.string().optional(),
	semester: z.string().optional(),
	tags: z.array(z.string()),
	date: z.coerce.date(),
	draft: z.boolean().default(false),
});
