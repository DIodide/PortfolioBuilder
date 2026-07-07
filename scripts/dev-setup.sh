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
INFO_DIR="${2:-$HOME/information}"

git config core.hooksPath .githooks
echo "core.hooksPath -> .githooks"

case "$MODE" in
  symlink)
    for name in portfolio thoughts; do
      CLONE="$INFO_DIR/$name"
      if [ ! -d "$CLONE" ]; then
        echo "WARN: $CLONE does not exist; clone DIodide/$name there for the symlink setup." >&2
        continue
      fi
      git submodule deinit -f "content/$name" 2>/dev/null || true
      rm -rf "content/$name" ".git/modules/content/$name"
      ln -s "$CLONE" "content/$name"
      git update-index --skip-worktree "content/$name"
      echo "content/$name -> $CLONE (skip-worktree set)"
    done
    ;;
  submodule)
    for name in portfolio thoughts; do
      git update-index --no-skip-worktree "content/$name" 2>/dev/null || true
      if [ -L "content/$name" ]; then rm "content/$name"; fi
      git submodule update --init "content/$name"
      echo "content/$name checked out as a real submodule"
    done
    ;;
  *)
    echo "Usage: $0 [symlink|submodule] [path-to-existing-clone]" >&2
    exit 1
    ;;
esac
