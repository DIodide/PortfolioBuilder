# PortfolioBuilder

Next.js site that builds itself from two private content repos:
[DIodide/portfolio](https://github.com/DIodide/portfolio) (the portfolio
surface) and [DIodide/thoughts](https://github.com/DIodide/thoughts) (the
thought-sandboxes blog surface, an Obsidian vault). Content stays in its own
private repos; this public repo holds only the site code.

## Architecture

```
DIodide/portfolio (private)            DIodide/PortfolioBuilder (public)
  markdown + YAML frontmatter    ──►     submodule at content/portfolio
  portfolio-art/ + assets/ images        scripts/prepare-content.mjs snapshots both
  code/ submodules (ignored)             src/lib/content.ts parses the snapshots
                                         src/lib/markdown.ts renders post bodies
DIodide/thoughts (private)
  posts/*.md (Obsidian vault)     ──►    submodule at content/thoughts
  attachments/ images                    → the /thoughts surface
```

- `scripts/prepare-content.mjs` runs before every `dev`/`build`. It
  materializes the content into `.content/portfolio` and `.content/thoughts`
  (real files — locally the submodule paths are symlinks, which bundler
  tracing can't follow) and mirrors images to `public/content-art/`: every
  `portfolio-art/` file, every certification asset, and the thoughts repo's `attachments/`
  images referenced by a **published** post (served at
  `/content-art/thoughts/attachments/<name>`; draft-only attachments are
  withheld from public builds, mirrored under `SHOW_DRAFTS=1`).
- On Vercel the private submodules can't be fetched, so the script
  shallow-clones both repos with `CONTENT_REPO_TOKEN` instead. **Deploys
  always build the latest content on `main`** — the submodule pointers are a
  local-dev convenience, not the deploy source of truth. Nested `code/`
  submodules are never fetched.
- **Graceful degradation:** if the portfolio repo can't be sourced the build
  fails (the site is nothing without it). If only the *thoughts* repo can't be
  cloned — e.g. the token doesn't cover it — the build warns and continues
  with zero posts, and `/thoughts` renders its designed empty state.
- `src/lib/content.ts` parses the snapshots (portfolio documents + blog
  posts); `src/lib/markdown.ts` renders post bodies (GFM via marked, Obsidian
  `![[wikilink]]` embeds, heading ids, external-link policy). The full content
  contract lives in the portfolio repo's `PARSING.md`.

## Surfaces & routes

The UI is a terminal multiplexer with a **surfaces strip** across the top
(rendered by the root layout's grid: strip / sidebar+main / status bar). Each
surface is a route group under `src/app/`:

- **`1:portfolio`** — `src/app/(mux)`: Sidebar + pane machine + StatusBar,
  hosting the five workspaces at `/`, `/work`, `/projects`,
  `/certifications`, `/coursework`.
- **`2:thought-sandboxes`** — the blog surface at `/thoughts` (index) and
  `/thoughts/<slug>` (reader). One document sheet, two skins driven by the
  site theme: dark = "book" (Literata on `#11141a`), light = "paper" (STIX on
  `#faf8f4`). Accent: rose (`--acc-thoughts`).

Posts with `hide: true` are **drafts — excluded from public builds entirely**
(stripped in the parser, not hidden with CSS). Preview them locally with
`SHOW_DRAFTS=1 pnpm dev`; they render with a DRAFT ribbon. With zero published
posts the index shows a designed empty state instead of breaking.

## Redeploys

- Push to **PortfolioBuilder** → Vercel git integration deploys.
- Push to **portfolio** or **thoughts** → each repo's `redeploy-site.yml`
  workflow curls a Vercel deploy hook (stored as the `VERCEL_DEPLOY_HOOK_URL`
  secret in that repo).

## Local setup

```sh
pnpm install
scripts/dev-setup.sh                 # symlink mode: uses ~/information/{portfolio,thoughts}
# or: scripts/dev-setup.sh submodule # real checkouts (needs access to the private repos)
pnpm dev
```

`dev-setup.sh` also sets `core.hooksPath` to `.githooks`, whose pre-commit
hook blocks committing anything but a gitlink at `content/portfolio` and
`content/thoughts`.

### The symlink/submodule arrangement

`content/portfolio` and `content/thoughts` are tracked in git as submodules,
but in symlink mode each working-tree path is a symlink to your existing
clone, hidden from git via `git update-index --skip-worktree`. Don't
`git add --force` either path; if one ever shows up as modified, re-run
`scripts/dev-setup.sh`.

## Vercel environment

| Variable | Purpose |
| --- | --- |
| `CONTENT_REPO_TOKEN` | Fine-grained GitHub PAT, read-only **Contents** access to `DIodide/portfolio` **and** `DIodide/thoughts`. Used to clone content at build time. If it only covers `portfolio`, builds still succeed — with an empty `/thoughts`. |
| `CONTENT_BRANCH` (optional) | Portfolio content branch to build, default `main`. The thoughts clone always builds that repo's default branch. |
| `SHOW_DRAFTS` | **Never set on Vercel.** Local-only: `SHOW_DRAFTS=1` renders `hide: true` drafts with a DRAFT ribbon. |
