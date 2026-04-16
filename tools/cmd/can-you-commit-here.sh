#!/usr/bin/env sh

set -e

BRANCH="$(git branch --show-current)"

PROTECTED_BRANCHES="main master dev"

for b in $PROTECTED_BRANCHES; do
  if [ "$BRANCH" = "$b" ]; then
    if [ "$ALLOW_PROTECTED_BRANCH" != "1" ]; then
      echo "❌ Protected branch detected: $BRANCH"
      echo "👉 To proceed, run:"
      echo "   ALLOW_PROTECTED_BRANCH=1 git commit"
      exit 1
    fi
  fi
done

exit 0