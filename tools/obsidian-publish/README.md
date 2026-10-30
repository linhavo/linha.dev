# linha.dev Publish

An Obsidian plugin that publishes a note as a post on linha.dev. It pushes one commit to `main` through the GitHub API, and the push deploys the site.

## Install

1. Create a fine-grained GitHub token. Give it access to `linhavo/linha.dev` only, with **Contents: Read and write**.
2. From the repo root, run `OBSIDIAN_VAULT=/path/to/vault bun run plugin:install`.
3. In Obsidian, reload the app, then enable **linha.dev Publish** under Community plugins.
4. In the plugin settings, paste the token.

Obsidian stores the token as plain text in `.obsidian/plugins/linha-publish/data.json`. If the vault syncs, the token syncs with it.

To update the plugin, run step 2 again and reload Obsidian.

## Write a post

Give the note these properties. They follow the site schema in `src/content/schema.ts`.

| Property | Required | Example |
| --- | --- | --- |
| `title` | yes | `Co mě naučil první výzkum` |
| `tags` | yes | `[KISK, UX]` |
| `date` | yes | `2025-01-12` |
| `subtitle` | no | One sentence under the title. |
| `subject`, `semester` | no | Shown in the post's side column. |
| `draft` | no | `true` keeps the post off the live site. `bun run dev` still shows it. |

## Publish and unpublish

* **Publish note** (command palette) validates the properties, converts the note and pushes it. Run it again after an edit to update the post.
* **Unpublish note** deletes the post and its images from the repo.

On publish, the plugin writes two properties back to the note:

* `slug`: the URL segment, `/blog/<slug>`. It comes from the file name the first time. Later renames of the note do not change the URL. To change the URL, unpublish, edit `slug`, then publish again.
* `published`: `true` while the post is live. Links from other posts use it.

## What the conversion does

* `![[image.png]]` and `![](image.png)` become `./<slug>/<image>`. The plugin uploads the image next to the post, and Astro optimizes it at build time.
* `[[Note]]` and `[text](Note.md)` link to `/blog/<slug>` when that note is published. Otherwise only the text stays.
* `%%comments%%` are removed.
* A callout becomes a plain blockquote with its title in bold.
* Only the properties above go to the repo. Other properties stay in the vault.
* Code blocks and inline code are left as they are.

The plugin stops with a notice if a property is invalid or an image is missing.

## Develop

* `src/convert.ts` and `src/github.ts` are pure functions with no Obsidian API. `bun run test` covers them.
* `src/main.ts` connects them to Obsidian.
* `bun run plugin:build` bundles the plugin into `tools/obsidian-publish/dist/`.
* `manifest.json` sets `isDesktopOnly: true`. The code avoids Node APIs, so set it to `false` after a test on a phone.

Commits made through the API are not signed.
