#!/usr/bin/env bash
# update-gallery.sh — Rebuild gallery-manifest.json from images/fishing/ and images/hunting/
# Run this after adding or removing photos, then commit & push.

set -euo pipefail
cd "$(dirname "$0")"

fishing=()
hunting=()

shopt -s nullglob
for f in images/fishing/*.jpg images/fishing/*.jpeg images/fishing/*.png images/fishing/*.webp; do
  fishing+=("\"$f\"")
done

for f in images/hunting/*.jpg images/hunting/*.jpeg images/hunting/*.png images/hunting/*.webp; do
  hunting+=("\"$f\"")
done
shopt -u nullglob

# Build JSON
{
  echo '{'
  echo '  "fishing": ['
  for i in "${!fishing[@]}"; do
    comma=","
    [ "$i" -eq $(( ${#fishing[@]} - 1 )) ] && comma=""
    echo "    ${fishing[$i]}${comma}"
  done
  echo '  ],'
  echo '  "hunting": ['
  for i in "${!hunting[@]}"; do
    comma=","
    [ "$i" -eq $(( ${#hunting[@]} - 1 )) ] && comma=""
    echo "    ${hunting[$i]}${comma}"
  done
  echo '  ]'
  echo '}'
} > gallery-manifest.json

echo "gallery-manifest.json updated:"
echo "  Fishing: ${#fishing[@]} photos"
echo "  Hunting: ${#hunting[@]} photos"
