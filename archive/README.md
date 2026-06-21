# Archived: BOM / Estimate creator

Archived on request ("not needed as of now"). This folder preserves the full
estimate-creator feature so it can be restored later. Nothing here is loaded,
routed, bundled, or tested by the live app.

## What's here
- `app/Http/Controllers/Admin/` — EstimateController, EstimateSettingController, ProductController, CustomerController
- `app/Models/` — Estimate, EstimateSetting, Product, Customer
- `app/Http/Requests/EstimateRequest.php`
- `database/seeders/ProductSeeder.php`
- `tests/Feature/Admin/EstimateControllerTest.php`
- `resources/js/Pages/Admin/{Bom,Products,Customers}/`
- `resources/js/lib/{estimateMoney,estimatePdf,estimateBrand}.ts`

The `products`, `customers`, `estimates` and `estimate_settings` migrations were
left in `database/migrations` (harmless empty tables) so existing databases are
untouched.

## To restore
1. Move every file above back to the matching path under the project root.
2. In `routes/admin.php`: re-add the controller `use` imports and the `/products`,
   `/customers`, `/bom` (+ `/bom/settings`) route blocks inside the `AdminOnly` group.
3. In `resources/js/components/admin/AdminLayout.tsx`: re-add the nav items
   (Products → `Boxes`, Customers → `Contact`, BOM → `Calculator`) and their icon imports.
4. In `database/seeders/DatabaseSeeder.php`: re-add `$this->call(ProductSeeder::class);`.
5. Run `npm run build` and `php artisan test`.

Git history for all of it is intact (moved with `git mv`).
