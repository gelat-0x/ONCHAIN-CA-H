#!/usr/bin/env bash
# One-time setup: push onchain-cash skeleton to GitHub
# Usage: ./scripts/push-to-github.sh YOUR_GITHUB_USERNAME onchain-cash

set -e
USER="${1:?Usage: ./scripts/push-to-github.sh USERNAME REPO_NAME}"
REPO="${2:-onchain-cash}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v git &>/dev/null; then
  echo "Install Xcode Command Line Tools: xcode-select --install"
  exit 1
fi

git init
git branch -M main

git add .
git status

git commit -m "$(cat <<'EOF'
Initial commit: ONCHAIN CA$H PegKeeper dashboard skeleton

Structured template with shared types/data, modular Express API,
React frontend, and docs for plugging in CoinGecko, DefiLlama, and Dune.
EOF
)"

if command -v gh &>/dev/null; then
  gh repo create "$USER/$REPO" --public --source=. --remote=origin --push
  echo "Done: https://github.com/$USER/$REPO"
else
  echo "Create empty repo at https://github.com/new?name=$REPO then run:"
  echo "  git remote add origin git@github.com:$USER/$REPO.git"
  echo "  git push -u origin main"
fi
