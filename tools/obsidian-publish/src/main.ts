import {
	type App,
	arrayBufferToBase64,
	getFrontMatterInfo,
	Notice,
	normalizePath,
	Plugin,
	PluginSettingTab,
	requestUrl,
	Setting,
	type TFile,
} from "obsidian";
import {
	convertBody,
	frontmatterYaml,
	postSlug,
	type Resolver,
	validate,
} from "./convert";
import { type File, type Repo, type Request, syncFiles } from "./github";

type Settings = {
	token: string;
	repo: string;
	branch: string;
	contentPath: string;
};

const DEFAULT_SETTINGS: Settings = {
	token: "",
	repo: "linhavo/linha.dev",
	branch: "main",
	contentPath: "src/content/blog",
};

export default class LinhaPublish extends Plugin {
	settings: Settings = DEFAULT_SETTINGS;

	async onload() {
		this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
		this.addSettingTab(new SettingsTab(this.app, this));
		this.addCommand({
			id: "publish",
			name: "Publish note",
			checkCallback: (checking) => this.withNote(checking, this.publish),
		});
		this.addCommand({
			id: "unpublish",
			name: "Unpublish note",
			checkCallback: (checking) => this.withNote(checking, this.unpublish),
		});
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// Enables a command only for Markdown notes and reports its errors as a notice.
	private withNote(checking: boolean, run: (file: TFile) => Promise<void>) {
		const file = this.app.workspace.getActiveFile();
		if (file?.extension !== "md") return false;
		if (!checking) {
			run.call(this, file).catch((error: Error) => {
				console.error(error);
				new Notice(`Publishing failed: ${error.message}`, 0);
			});
		}
		return true;
	}

	private async publish(file: TFile) {
		const frontmatter = this.frontmatter(file);
		const problems = validate(frontmatter);
		if (problems.length > 0) {
			new Notice(`Fix these properties first:\n${problems.join("\n")}`, 0);
			return;
		}

		const slug = postSlug(frontmatter, file.basename);
		const content = await this.app.vault.read(file);
		const body = content.slice(getFrontMatterInfo(content).contentStart);
		const converted = convertBody(body, slug, this.resolver(file));
		if (converted.errors.length > 0) {
			new Notice(`Fix these links first:\n${converted.errors.join("\n")}`, 0);
			return;
		}

		const base = this.settings.contentPath;
		const files: File[] = [
			{
				path: `${base}/${slug}.md`,
				content: frontmatterYaml(frontmatter) + converted.markdown,
				encoding: "utf-8",
			},
		];
		for (const image of converted.images) {
			const data = await this.app.vault.adapter.readBinary(image.vaultPath);
			files.push({
				path: `${base}/${slug}/${image.name}`,
				content: arrayBufferToBase64(data),
				encoding: "base64",
			});
		}

		new Notice(`Publishing ${slug}…`);
		const commit = await this.sync({
			message: `feat(blog): publish "${frontmatter.title}"`,
			files,
			owns: ownedBy(base, slug),
		});
		await this.app.fileManager.processFrontMatter(file, (data) => {
			data.slug = slug;
			data.published = true;
		});
		const status = frontmatter.draft
			? "Pushed as a draft, so the site leaves it out."
			: "Published. The site updates in about a minute.";
		notify(commit ? status : "Nothing changed.", commit?.url);
	}

	private async unpublish(file: TFile) {
		const slug = postSlug(this.frontmatter(file), file.basename);
		const commit = await this.sync({
			message: `feat(blog): unpublish "${slug}"`,
			files: [],
			owns: ownedBy(this.settings.contentPath, slug),
		});
		await this.app.fileManager.processFrontMatter(file, (data) => {
			data.published = false;
		});
		notify(
			commit ? "Unpublished." : "The post was not published.",
			commit?.url,
		);
	}

	private async sync(change: Parameters<typeof syncFiles>[2]) {
		const { token, repo, branch } = this.settings;
		if (!token) throw new Error("Set a GitHub token in the plugin settings.");
		const [owner, name] = repo.split("/");
		const request: Request = async ({ method, path, body }) => {
			const response = await requestUrl({
				url: `https://api.github.com${path}`,
				method,
				headers: {
					Accept: "application/vnd.github+json",
					Authorization: `Bearer ${token}`,
					"X-GitHub-Api-Version": "2022-11-28",
				},
				contentType: "application/json",
				body: body === undefined ? undefined : JSON.stringify(body),
				throw: false,
			});
			return { status: response.status, json: parseJson(response.text) };
		};
		const target: Repo = { owner, name, branch };
		return syncFiles(request, target, change);
	}

	private frontmatter(file: TFile): Record<string, unknown> {
		return { ...this.app.metadataCache.getFileCache(file)?.frontmatter };
	}

	// Resolves links the way Obsidian does, with a fallback for paths relative to the note.
	private resolver(file: TFile): Resolver {
		const { metadataCache, vault } = this.app;
		const find = (linkpath: string) =>
			metadataCache.getFirstLinkpathDest(linkpath, file.path) ??
			vault.getFileByPath(
				normalizePath(`${file.parent?.path ?? ""}/${linkpath}`),
			);
		return {
			file: (linkpath) => find(linkpath)?.path ?? null,
			note: (linkpath) => {
				const target = find(linkpath);
				if (!target) return null;
				const data = metadataCache.getFileCache(target)?.frontmatter;
				if (data?.published !== true) return null;
				return postSlug(data, target.basename);
			},
		};
	}
}

class SettingsTab extends PluginSettingTab {
	private plugin: LinhaPublish;

	constructor(app: App, plugin: LinhaPublish) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		this.containerEl.empty();
		const fields: { key: keyof Settings; name: string; desc: string }[] = [
			{
				key: "token",
				name: "GitHub token",
				desc: "Fine-grained token with Contents: read and write on the repository only. Obsidian stores it as plain text in this vault.",
			},
			{ key: "repo", name: "Repository", desc: "owner/name" },
			{ key: "branch", name: "Branch", desc: "A push here deploys the site." },
			{
				key: "contentPath",
				name: "Content folder",
				desc: "Folder of the blog collection in the repository.",
			},
		];
		for (const field of fields) {
			new Setting(this.containerEl)
				.setName(field.name)
				.setDesc(field.desc)
				.addText((text) => {
					if (field.key === "token") text.inputEl.type = "password";
					text
						.setValue(this.plugin.settings[field.key])
						.onChange(async (value) => {
							this.plugin.settings[field.key] = value.trim();
							await this.plugin.saveSettings();
						});
				});
		}
	}
}

// Matches the post file and its image folder.
function ownedBy(base: string, slug: string) {
	return (path: string) =>
		path === `${base}/${slug}.md` || path.startsWith(`${base}/${slug}/`);
}

function notify(message: string, url?: string) {
	new Notice(
		createFragment((fragment) => {
			fragment.appendText(`${message} `);
			if (url) fragment.createEl("a", { text: "View commit", href: url });
		}),
		10_000,
	);
}

function parseJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}
