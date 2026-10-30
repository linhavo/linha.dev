import { describe, expect, test } from "bun:test";
import { type Request, syncFiles } from "./github";

const repo = { owner: "o", name: "r", branch: "main" };
const owns = (path: string) =>
	path === "blog/post.md" || path.startsWith("blog/post/");

// Fakes the GitHub API for a repo that already has a post with one image.
function fakeGitHub(options: { newTree?: string; refStatus?: number } = {}) {
	const calls: { method: string; path: string; body?: unknown }[] = [];
	const request: Request = async (call) => {
		calls.push(call);
		const path = call.path.replace("/repos/o/r", "");
		const responses: Record<string, unknown> = {
			"GET /git/ref/heads/main": { object: { sha: "head" } },
			"GET /git/commits/head": { tree: { sha: "tree" } },
			"GET /git/trees/tree?recursive=1": {
				truncated: false,
				tree: [
					{ path: "blog", type: "tree" },
					{ path: "blog/post.md", type: "blob" },
					{ path: "blog/post/old.png", type: "blob" },
					{ path: "blog/other.md", type: "blob" },
				],
			},
			"POST /git/blobs": { sha: "blob" },
			"POST /git/trees": { sha: options.newTree ?? "new-tree" },
			"POST /git/commits": { sha: "commit", html_url: "https://commit" },
			"PATCH /git/refs/heads/main": {},
		};
		const key = `${call.method} ${path}`;
		const status = key.startsWith("PATCH") ? (options.refStatus ?? 200) : 200;
		return { status, json: responses[key] ?? { message: "Not Found" } };
	};
	return { calls, request };
}

describe("syncFiles", () => {
	test("writes files and deletes stale ones in one commit", async () => {
		const github = fakeGitHub();
		const commit = await syncFiles(github.request, repo, {
			message: "publish",
			owns,
			files: [
				{ path: "blog/post.md", content: "# Hi", encoding: "utf-8" },
				{ path: "blog/post/new.png", content: "AAAA", encoding: "base64" },
			],
		});
		expect(commit).toEqual({ sha: "commit", url: "https://commit" });
		const tree = github.calls.find((call) => call.path.endsWith("/git/trees"));
		expect(tree?.body).toEqual({
			base_tree: "tree",
			tree: [
				{ path: "blog/post.md", mode: "100644", type: "blob", content: "# Hi" },
				{
					path: "blog/post/new.png",
					mode: "100644",
					type: "blob",
					sha: "blob",
				},
				{ path: "blog/post/old.png", mode: "100644", type: "blob", sha: null },
			],
		});
		expect(github.calls.at(-1)).toMatchObject({
			method: "PATCH",
			body: { sha: "commit" },
		});
	});

	test("returns null when the tree does not change", async () => {
		const github = fakeGitHub({ newTree: "tree" });
		const commit = await syncFiles(github.request, repo, {
			message: "publish",
			owns,
			files: [{ path: "blog/post.md", content: "# Hi", encoding: "utf-8" }],
		});
		expect(commit).toBeNull();
		expect(github.calls.some((call) => call.method === "PATCH")).toBe(false);
	});

	test("returns null when there is nothing to delete", async () => {
		const github = fakeGitHub();
		const commit = await syncFiles(github.request, repo, {
			message: "unpublish",
			owns: (path) => path.startsWith("blog/missing"),
			files: [],
		});
		expect(commit).toBeNull();
	});

	test("reports API errors", async () => {
		const github = fakeGitHub({ refStatus: 422 });
		await expect(
			syncFiles(github.request, repo, { message: "m", owns, files: [] }),
		).rejects.toThrow("failed (422)");
	});
});
