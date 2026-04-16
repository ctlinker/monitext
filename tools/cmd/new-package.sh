#!/usr/bin/env bash
# new_package.sh — scaffold a new TypeScript package from template
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/../pkg-template"

# ── helpers ────────────────────────────────────────────────────────────────────

die()  { echo "error: $*" >&2; exit 1; }
info() { echo "  $*"; }

# ── validation ─────────────────────────────────────────────────────────────────

[ -d "$TEMPLATE_DIR" ] || die "template directory not found: $TEMPLATE_DIR"

# ── main ───────────────────────────────────────────────────────────────────────

cmd_new_package() {
  [ "$#" -ge 1 ] || { echo "usage: new_package.sh <path>" >&2; exit 1; }

  local target="$1"
  local name
  name="$(basename "$target")"

  # Bail early if target already exists
  [ ! -e "$target" ] || die "target already exists: $target"

  # Prompt overrides — do this before touching the filesystem
  read -r -p "Package name [$name]: " input_name
  read -r -p "Description: "           input_desc
  name="${input_name:-$name}"
  local desc="${input_desc:-}"

  # Validate package name (npm-safe: lowercase, alphanumeric + hyphens)
  [[ "$name" =~ ^[a-z0-9][a-z0-9-]*$ ]] \
    || die "invalid package name '$name' (use lowercase letters, numbers, hyphens)"

  # Create directory structure
  info "creating $target ..."
  mkdir -p "$target"/{src/lib,sketch/playground,sketch/report,test,build}
  touch "$target/src/main.ts"

  # Copy template (handles empty dirs and dotfiles)
  cp -r "$TEMPLATE_DIR"/. "$target/"

  # Substitute placeholders in package.json
  # Use a temp file for portability (sed -i behaves differently on macOS vs GNU)
  local pkg="$target/package.json"
  if [ -f "$pkg" ]; then
    local tmp
    tmp="$(mktemp)"
    sed \
      -e "s|{pkg-name}|$name|g" \
      -e "s|{pkg-description}|$desc|g" \
      "$pkg" > "$tmp" && mv "$tmp" "$pkg"
  else
    info "warning: package.json not found in template, skipping substitution"
  fi

  echo "✔ package '$name' created at $target"
}

cmd_new_package "$@"