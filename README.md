# PortfolioBuilder

Next.js site that builds itself from the content in the private
[DIodide/portfolio](https://github.com/DIodide/portfolio) repo. Content stays in
its own private repo; this public repo holds only the site code.

## Architecture

```
DIodide/portfolio (private)          DIodide/PortfolioBuilder (public)
  markdown + YAML frontmatter   ──►    submodule at content/portfolio
  portfolio-art/ images                scripts/prepare-content.mjs snapshots it
  code/ submodules (ignored)           src/lib/content.ts parses the snapshot
```

- `scripts/prepare-content.mjs` runs before every `dev`/`build`. It materializes
  the content into `.content/portfolio` (real files — locally the submodule path
  is a symlink, which bundler tracing can't follow) and mirrors every
  `portfolio-art/` image to `public/content-art/<same relative path>`.
- On Vercel the private submodule can't be fetched, so the script shallow-clones
  `portfolio@main` with `CONTENT_REPO_TOKEN` instead. **Deploys always build the
  latest content on `main`** — the submodule pointer is a local-dev convenience,
  not the deploy source of truth. Nested `code/` submodules are never fetched.
- `src/lib/content.ts` exposes frontmatter + raw body per document. Shaping and
  UI are intentionally not built yet.

## Redeploys

- Push to **PortfolioBuilder** → Vercel git integration deploys.
- Push to **portfolio** → its `redeploy-site.yml` workflow curls a Vercel deploy
  hook (stored as the `VERCEL_DEPLOY_HOOK_URL` secret in that repo).

## Local setup

```sh
pnpm install
scripts/dev-setup.sh                 # symlink mode: uses ~/information/portfolio
# or: scripts/dev-setup.sh submodule # real checkout (needs access to the private repo)
pnpm dev
```

`dev-setup.sh` also sets `core.hooksPath` to `.githooks`, whose pre-commit hook
blocks committing anything but a gitlink at `content/portfolio`.

### The symlink/submodule arrangement

`content/portfolio` is tracked in git as a submodule, but in symlink mode the
working-tree path is a symlink to your existing clone, hidden from git via
`git update-index --skip-worktree`. Don't `git add --force content/portfolio`;
if the path ever shows up as modified, re-run `scripts/dev-setup.sh`.

## Vercel environment

| Variable | Purpose |
| --- | --- |
| `CONTENT_REPO_TOKEN` | Fine-grained GitHub PAT, read-only **Contents** access to `DIodide/portfolio` only. Used to clone content at build time. |
| `CONTENT_BRANCH` (optional) | Content branch to build, default `main`. |
