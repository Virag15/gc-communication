# Research: fetching low-voltage switchgear products into our database

Goal: build and maintain a searchable product database for the six brands GC
distributes (C&S Electric, BCH, HPL, Suraj, Luker, Kaycee), sourced from the
manufacturers, for use on the public catalogue and internal tools (BOM, quotes).

> This is a **plan / feasibility** document. No scraping is built yet.

## 1. Reality of the sources

Indian LV-switchgear manufacturers generally do **not** expose a public product
API. Their product data lives in three places, in decreasing order of reliability:

| Source | Reliability | Effort | Notes |
| ------ | ----------- | ------ | ----- |
| **Official price lists** (Excel/PDF you receive as an authorised distributor) | Highest - authoritative SKUs, MRP, units | Low | You already get these; the cleanest path. |
| **Product catalogues / datasheets (PDF)** on brand sites | High for specs, weak for live price | Medium | Specs, ratings, dimensions; parse per template. |
| **Brand website product pages (HTML)** | Medium - marketing copy, images | High + fragile | Layouts change; scraping is brittle and ToS-sensitive. |

Per-brand starting points to verify (catalogue/price-list pages):
- C&S Electric, HPL, BCH, Suraj, Luker, Kaycee - each publishes catalogues and a
  dealer/price list. Confirm the exact, current URLs and whether the price list is
  shared with distributors directly (usually yes) before relying on the website.

## 2. Legal / compliance

- **Respect robots.txt and Terms of Service** for any scraping. Many sites
  disallow automated crawling.
- Product **specs and catalogue content are copyrighted**; reproducing them
  publicly may need permission. Safest: use the **price lists/catalogues you are
  authorised to use** as a distributor, and link to official datasheets rather
  than re-hosting them.
- Rate-limit and identify the crawler; cache; never hammer a site.
- Prices change often - treat any fetched MRP as needing periodic refresh.

## 3. Proposed data model

A `products` table (and `product_categories`), brand-scoped:

```
products
  id, brand_id (FK), category_id (FK, nullable)
  name, sku/code (unique per brand), slug
  description (text)
  specs (json)          -- ratings: poles, current A, breaking kA, etc.
  mrp (decimal), unit   -- 'No', 'Set', 'Mtr'
  datasheet_url, image
  is_active, source ('pricelist'|'catalogue'|'manual'), source_ref
  last_synced_at, timestamps
  unique (brand_id, sku)
```

Dedup/merge key = `(brand_id, sku)`; importers upsert on that.

## 4. Approaches (recommended order)

**Phase 1 - Price-list / CSV import (recommended first; lowest risk).**
- Admin "Import products" screen: upload the brand's Excel/CSV price list, map
  columns (SKU, name, MRP, unit, category), preview, then upsert by `(brand_id, sku)`.
- Tooling: `maatwebsite/excel` or `league/csv` + a queued import job.
- Gets a real, authoritative catalogue live quickly with zero legal risk.

**Phase 2 - PDF catalogue parsing.**
- For brands that only ship PDF catalogues: parse with `smalot/pdfparser` (text)
  per-brand template, or a table-extraction service. Map into the same schema.
- Per-brand parser config because every catalogue layout differs.

**Phase 3 - Targeted website fetch (only where permitted).**
- For brands that allow it (check robots/ToS): a per-brand adapter (Symfony
  DomCrawler / Goutte, or a headless browser for JS sites) that pulls listing +
  detail pages on a schedule, writing to the same `products` table.
- Keep adapters small and isolated; expect to maintain them as sites change.

**Ongoing sync.**
- A scheduled command per source (`php artisan products:sync {brand}`) run via the
  scheduler; log added/updated/removed; flag price changes for review.

## 5. Recommended phase-1 scope

1. `products` + `product_categories` tables + models.
2. Admin **Products** module (CRUD + search/filter by brand/category).
3. **CSV/Excel importer** with column mapping + upsert by SKU.
4. Public product listing/search on the site (and feed the BOM/quote tools).
5. Defer scraping until Phase 1 is in use and per-brand source access is confirmed.

This gets a genuine, legally-clean product database live fast, and leaves a clear
path to automated catalogue/website ingestion once sources are confirmed.
