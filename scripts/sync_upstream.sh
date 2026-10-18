#!/bin/sh
# Merge in a disposable clone, never modify the user's checkout or production.
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
origin=$(git -C "$root" remote get-url origin)
upstream=$(git -C "$root" remote get-url upstream)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT HUP INT TERM
git clone --quiet --no-tags "$origin" "$tmp/repo"
cd "$tmp/repo"
git remote add upstream "$upstream"
git fetch --quiet --no-tags upstream main
sha=$(git rev-parse upstream/main)
if git merge-base --is-ancestor "$sha" origin/main; then
    echo 'Upstream already integrated; no changes.'
    exit 0
fi
branch="sync/upstream-$sha"
if test -n "$(git ls-remote --heads origin "refs/heads/$branch")"; then
    echo "Existing candidate: $branch"
    exit 0
fi
git switch --quiet -c "$branch" origin/main
if ! git -c user.name='HealthBridge Sync' -c user.email='healthbridge-sync@users.noreply.github.com' merge --no-edit --no-ff upstream/main; then
    echo 'Upstream merge conflict; no branch pushed and main unchanged.' >&2
    exit 2
fi
git push origin "HEAD:refs/heads/$branch"
echo "Candidate pushed for review and validation: $branch"
