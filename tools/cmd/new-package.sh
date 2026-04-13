#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/../pkg-template"

cmd_new_package() {
    if [ "$#" -lt 1 ]; then
        echo "usage: new_package.sh PATH"
        return 1
    fi

    local name=""
    local target="$1"
    
    name="$(basename "$target")"

    # Create structure
    mkdir -p "$target"/{src/lib,sketch/playground,sketch/report,test,build}
    touch "$target/src/main.ts"

    # Copy template safely (handles empty dirs, dotfiles)
    cp -r "$TEMPLATE_DIR"/. "$target/"

    # Prompt overrides (optional)
    read -r -p "Package name [$name]: " input_name
    read -r -p "Description: " desc

    name="${input_name:-$name}"

    # Replace placeholders (portable, no useless cat)
    sed -i \
        -e "s|{pkg-name}|$name|g" \
        -e "s|{pkg-description}|$desc|g" \
        "$target/package.json"

    echo "✔ Package '$name' created at $target"
}

cmd_new_package "$@"