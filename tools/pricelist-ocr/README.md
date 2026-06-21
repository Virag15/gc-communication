# Price-list PDF → CSV converter (macOS)

Turns the manufacturers' PDF price lists (C&S, BCH, Luker) into clean CSVs you can
upload through **Admin → Products → Import**.

## Why this exists

The PDFs are designed brochures, not data tables, and they can't be read with a normal
PDF text parser:

- **C&S** embeds subset fonts with broken character maps — whole digits (e.g. `2`, `3`)
  are simply missing from the text layer. `630A` extracts as `6 0A`. The page *looks*
  right but is corrupt to any text-based reader. We confirmed this can't be fixed by
  supplying font/cmap data.
- **BCH / Luker** have intact text but multi-column magazine layouts that scramble
  reading order.

So instead of reading the text layer, this tool **renders each page to an image and
runs OCR on the pixels** with Apple's Vision framework (the best engine available, and
already on every Mac — no installs). OCR reads what's printed, so the data comes back
intact, including C&S's missing digits.

## Requirements

- macOS with the Swift toolchain (`swift` / `swiftc` — ships with Xcode Command Line
  Tools: `xcode-select --install`).
- Node.js (already used by this project).

No Homebrew, no Python, no API keys, nothing leaves your machine.

## Usage

```bash
cd tools/pricelist-ocr

# Convert every PDF in ../../price-list/ → ./out/*.csv
./convert-all.sh

# Or one file
node convert.mjs "../../price-list/LV-Pricelist-WEF-1st-June26 C&S.pdf" > out/cs.csv

# Or just a few pages while checking
node convert.mjs "../../price-list/....pdf" --pages 25,57 > sample.csv
```

The Swift OCR binary (`ocrbin`) is compiled automatically on first run.

## Then import

1. Open each CSV in Excel/Numbers and **eyeball it**. The `Raw Line` column shows exactly
   what was on that line so you can spot-fix any OCR slip (most are obvious: `I`↔`1`,
   a stray letter in a catalogue code).
2. In the admin: **Products → Import**, pick the brand, upload the CSV. The columns
   (`Item No, Name, Spec, MRP, Category`) auto-map. Review the preview, then import.

## What it captures

- **Item No** — the catalogue/reference code. For C&S template codes ending in `-*`
  ("replace * with the rating"), the rating is substituted in so each code is unique.
- **MRP** — the price paired to each code.
- **Spec** — the rating/description to the left of the code (e.g. `125`, `36kA`).
- **Category** — the product family heading on that page (e.g. `MCCB`, `Contactor`).
- **Page / Raw Line** — provenance, for your review.

Every `Item No` is made globally unique so the importer's upsert never silently
overwrites two different products.

## Known limits (why you should review the CSV)

- OCR occasionally confuses characters inside a code (`I`/`1`, `O`/`0`, `4`/`A`,
  case of a trailing letter). The `Raw Line` column is there to catch these.
- Where the source **visually merges a price cell** across several ratings, only the
  row showing the number gets an MRP; the others come through blank. Fill them from the
  catalogue if needed.
- Deep/odd sub-tables (coil voltage matrices, accessory grids) extract as best-effort
  rows; check those sections.
