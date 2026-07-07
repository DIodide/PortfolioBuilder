#!/bin/sh
# One-time local setup after cloning PortfolioBuilder.
#
# Two modes for the content submodule at content/portfolio:
#   symlink   — link to an existing clone of DIodide/portfolio (default: ~/information/portfolio)
#   submodule — normal `git submodule update --init` checkout (needs access to the private repo)
#
# Usage: scripts/dev-setup.sh [symlink|submodule] [path-to-existing-clone]
set -e
cd "$(dirname "$0")/.."

MODE="${1:-symlink}"
CLONE="${2:-$HOME/information/portfolio}"

git config core.hooksPath .githooks
echo "core.hooksPath -> .githooks"

case "$MODE" in
  symlink)
    if [ ! -d "$CLONE" ]; then
      echo "ERROR: $CLONE does not exist; clone DIodide/portfolio there first or pass its path." >&2
      exit 1
    fi
    git submodule deinit -f content/portfolio 2>/dev/null || true
    rm -rf content/portfolio .git/modules/content
    ln -s "$CLONE" content/portfolio
    git update-index --skip-worktree content/portfolio
    echo "content/portfolio -> $CLONE (skip-worktree set)"
    ;;
  submodule)
    git update-index --no-skip-worktree content/portfolio 2>/dev/null || true
    if [ -L content/portfolio ]; then rm content/portfolio; fi
    git submodule update --init content/portfolio
    echo "content/portfolio checked out as a real submodule"
    ;;
  *)
    echo "Usage: $0 [symlink|submodule] [path-to-existing-clone]" >&2
    exit 1
    ;;
esac
