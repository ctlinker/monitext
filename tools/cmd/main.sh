#!/usr/bin/env bash
set -euo pipefail

# Where this script lives
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# --- Parse input ---
if [ "$#" -lt 1 ]; then
    echo "usage: $0 <command> [args...]"
    exit 1
fi

cmd="$1"
shift  # remove command, keep rest as args

# --- Resolve command script ---
cmd_path="$SCRIPT_DIR/$cmd.sh"

if [ ! -f "$cmd_path" ]; then
    echo "Unknown command: $cmd"
    echo "Available commands:"
    find "$SCRIPT_DIR"/*.sh -print0 | xargs -n1 basename | sed 's/\.sh$//' || true
    exit 1
fi

# --- Execute ---
exec bash "$cmd_path" "$@"