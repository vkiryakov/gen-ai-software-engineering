#!/usr/bin/env bash
# Start the homework-1 NestJS application.
# Usage: ./run.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/.."

if [ ! -f "$APP_DIR/package.json" ]; then
  echo "Error: cannot find homework-1 package.json at $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm is not installed. Install it with: npm install -g pnpm" >&2
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo ">> Installing dependencies with pnpm..."
  pnpm install
fi

echo ">> Starting NestJS server in watch mode (http://localhost:3000)"
echo ">> Swagger UI:  http://localhost:3000/docs"
echo ">> Press Ctrl+C to stop."
exec pnpm run start:dev
