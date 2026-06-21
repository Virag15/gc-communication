#!/usr/bin/env bash
# Convert every PDF in ../../price-list/ to a CSV in ./out/
# Usage:  ./convert-all.sh            (converts all)
#         ./convert-all.sh "<one.pdf>"
set -euo pipefail
cd "$(dirname "$0")"

SRC_DIR="${PRICELIST_DIR:-../../price-list}"
OUT_DIR="./out"
mkdir -p "$OUT_DIR"

shopt -s nullglob
files=()
if [ "$#" -gt 0 ]; then files=("$@"); else files=("$SRC_DIR"/*.pdf); fi

if [ "${#files[@]}" -eq 0 ]; then echo "No PDFs found in $SRC_DIR"; exit 1; fi

for f in "${files[@]}"; do
  base="$(basename "$f" .pdf)"
  out="$OUT_DIR/${base}.csv"
  echo ">>> $base"
  node convert.mjs "$f" > "$out"
  echo "    -> $out  ($(($(wc -l < "$out") - 1)) rows)"
done
echo "Done. CSVs are in $OUT_DIR/ — review, then upload each via Admin > Products > Import."
