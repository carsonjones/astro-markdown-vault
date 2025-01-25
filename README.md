# Astro Markdown Vault

An Astro template for creating posts from local markdown files in another project.

Isolate your content from your website code. Use file-first tools for writing your content, like ([Obsidian](https://obsidian.md/), [iA Writer](https://ia.net/writer)).

## Setup

Copy the `.env.example` file as `.env` and add your variables.

| VAR                       | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `CONTENT_DIR`             | Location of your notes / content                 |
| `POSTS_DIR`               | Location of copied collection, synced with your content |
| `WATCH_INTERVAL_MINUTES`  | Minutes for background sync (explained below)    |


## Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `bun install`             | Install dependencies                             |
| `bun dev`                 | Runs Astro server on http://localhost:4321       |
| `bun content:copy`        | Copy from your vault to site                     |
| `bun content:watch`       | Start background watch + sync service            |


### Background Sync + Publish

On the go? Within any file in your content directory, simply add the following front matter at the top of your markdown file.

```md
---
title: Title of Post
slug: url-for-post
published: true
---
```

If you are running the `bun content:watch` process locally, this will:
- look for any changes to files with this front matter (markdown only)
- commit and push to main branch

### Local Publish

If you want to control when to publish, simply run the `bun content:sync` command.

## References
- Astro [documentation](https://docs.astro.build)
- Inspired by the [file over app](https://stephango.com/file-over-app) philosophy and [Vault Technique](https://stephango.com/vault) by Steph Ango
