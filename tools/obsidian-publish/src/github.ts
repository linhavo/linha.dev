// Sends one GitHub REST API request; the plugin wraps Obsidian's requestUrl, tests pass a stub.
export type Request = (request: {
	method: "GET" | "POST" | "PATCH";
	path: string;
	body?: unknown;
}) => Promise<{ status: number; json: unknown }>;

export type Repo = { owner: string; name: string; branch: string };

export type File = {
	path: string;
	content: string;
	encoding: "utf-8" | "base64";
};

type TreeEntry = {
	path: string;
	mode: "100644";
	type: "blob";
	sha?: string | null;
	content?: string;
};

// Makes the files under `owns` match `files` in one commit; returns null when nothing changes.
export async function syncFiles(
	request: Request,
	repo: Repo,
	change: { message: string; files: File[]; owns: (path: string) => boolean },
): Promise<{ sha: string; url: string } | null> {
	const api = async <T>(
		method: "GET" | "POST" | "PATCH",
		path: string,
		body?: unknown,
	) => {
		const response = await request({
			method,
			path: `/repos/${repo.owner}/${repo.name}${path}`,
			body,
		});
		if (response.status >= 300) {
			const message = (response.json as { message?: string } | null)?.message;
			throw new Error(
				`GitHub ${method} ${path} failed (${response.status}): ${message ?? "no message"}`,
			);
		}
		return response.json as T;
	};

	const ref = await api<{ object: { sha: string } }>(
		"GET",
		`/git/ref/heads/${repo.branch}`,
	);
	const head = await api<{ tree: { sha: string } }>(
		"GET",
		`/git/commits/${ref.object.sha}`,
	);
	const tree = await api<{
		truncated: boolean;
		tree: { path: string; type: string }[];
	}>("GET", `/git/trees/${head.tree.sha}?recursive=1`);
	if (tree.truncated) throw new Error("The repository tree is too large.");

	const paths = new Set(change.files.map((file) => file.path));
	const entries: TreeEntry[] = [];
	for (const file of change.files) {
		if (file.encoding === "utf-8") {
			entries.push(blob(file.path, { content: file.content }));
			continue;
		}
		const { sha } = await api<{ sha: string }>("POST", "/git/blobs", {
			content: file.content,
			encoding: "base64",
		});
		entries.push(blob(file.path, { sha }));
	}
	for (const item of tree.tree) {
		if (item.type === "blob" && change.owns(item.path) && !paths.has(item.path))
			entries.push(blob(item.path, { sha: null }));
	}
	if (entries.length === 0) return null;

	const newTree = await api<{ sha: string }>("POST", "/git/trees", {
		base_tree: head.tree.sha,
		tree: entries,
	});
	if (newTree.sha === head.tree.sha) return null;

	const commit = await api<{ sha: string; html_url: string }>(
		"POST",
		"/git/commits",
		{ message: change.message, tree: newTree.sha, parents: [ref.object.sha] },
	);
	await api("PATCH", `/git/refs/heads/${repo.branch}`, { sha: commit.sha });
	return { sha: commit.sha, url: commit.html_url };
}

function blob(path: string, data: Partial<TreeEntry>): TreeEntry {
	return { path, mode: "100644", type: "blob", ...data };
}
