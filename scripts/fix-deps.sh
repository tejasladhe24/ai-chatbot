#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Step 1: Checking for dependency mismatches..."
pnpm dlx syncpack list-mismatches || true

echo "🛠️  Step 2: Fixing mismatched dependency versions..."
pnpm dlx syncpack fix-mismatches || true

echo "🧩 Step 3: Restoring workspace:* protocol where needed..."
pnpm install

echo "🧹 Step 4: Running deduplication..."
pnpm dedupe

echo "🔎 Step 5: Detecting unused or missing dependencies..."
pnpm recursive exec -- depcheck || true

echo "⬆️  Step 6: Optionally upgrading dependencies (minor updates)..."
pnpm recursive exec -- ncu -t minor -u || true

echo "📦 Step 7: Reinstalling clean dependency tree..."
pnpm install --recursive

echo "✂️  Step 8: Pruning unused packages..."
pnpm prune

echo "✅ All done! Dependencies are now consistent, deduped, and clean."
