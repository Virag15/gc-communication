<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Product;
use App\Traits\Auditable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductController extends Controller
{
    use Auditable;

    public function index()
    {
        $products = Product::with('brand')->ordered()->get();

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'brands' => Brand::ordered()->get(['id', 'name']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Products/Create', [
            'brands' => Brand::ordered()->get(['id', 'name']),
        ]);
    }

    public function edit(int $id)
    {
        $product = Product::findOrFail($id);

        return Inertia::render('Admin/Products/Edit', [
            'product' => $product,
            'brands' => Brand::ordered()->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateProduct($request);

        $validated['is_active'] = $request->boolean('is_active');
        $validated['sort_order'] = $validated['sort_order'] ?? 0;

        if ($request->hasFile('image')) {
            $validated['image'] = '/storage/' . $request->file('image')->store('products', 'public');
        }

        $product = DB::transaction(function () use ($validated) {
            return Product::create($validated);
        });

        $this->audit('created', $product);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product created successfully.');
    }

    public function update(Request $request, int $id)
    {
        $product = Product::findOrFail($id);

        $validated = $this->validateProduct($request);

        $validated['is_active'] = $request->boolean('is_active');
        $validated['sort_order'] = $validated['sort_order'] ?? 0;

        if ($request->hasFile('image')) {
            $validated['image'] = '/storage/' . $request->file('image')->store('products', 'public');
        } else {
            unset($validated['image']);
        }

        DB::transaction(function () use ($product, $validated) {
            $product->update($validated);
        });

        $this->audit('updated', $product, $validated);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(int $id)
    {
        $product = Product::findOrFail($id);

        $this->audit('deleted', $product);

        DB::transaction(function () use ($product) {
            $product->delete();
        });

        return back()->with('success', 'Product deleted successfully.');
    }

    /** Import screen: pick a brand, upload a price list, map columns. */
    public function importForm()
    {
        return Inertia::render('Admin/Products/Import', [
            'brands' => Brand::ordered()->get(['id', 'name']),
        ]);
    }

    /** Bulk upsert mapped rows by (brand_id, item_no). */
    public function import(Request $request)
    {
        $request->validate([
            'brand_id' => 'nullable|integer|exists:brands,id',
            'rows' => 'required|array|min:1|max:20000',
        ]);

        $brandId = $request->input('brand_id') ?: null;
        [$created, $updated, $skipped] = $this->upsertRows($request->input('rows', []), $brandId);

        $msg = "Import complete: {$created} added, {$updated} updated";
        if ($skipped) {
            $msg .= ", {$skipped} skipped";
        }

        return redirect()->route('admin.products.index')->with('success', $msg.'.');
    }

    /**
     * Upsert product rows resiliently: trim/clip to column limits and skip rows
     * missing a code or name, so one oversized/blank row never fails the batch.
     *
     * @return array{0:int,1:int,2:int} [created, updated, skipped]
     */
    public function upsertRows(array $rows, ?int $brandId): array
    {
        $created = 0;
        $updated = 0;
        $skipped = 0;
        $clip = fn ($v, $n) => $v === null || $v === '' ? null : mb_substr(trim((string) $v), 0, $n);
        $num = fn ($v) => is_numeric($v) ? (float) $v : null;

        DB::transaction(function () use ($rows, $brandId, $clip, $num, &$created, &$updated, &$skipped) {
            foreach ($rows as $row) {
                if (! is_array($row)) {
                    $skipped++;
                    continue;
                }
                $itemNo = $clip($row['item_no'] ?? null, 190);
                $name = $clip($row['name'] ?? null, 250);
                if (! $itemNo || ! $name) {
                    $skipped++;
                    continue;
                }
                $mrp = $num($row['mrp'] ?? null);
                $attrs = [
                    'name' => $name,
                    'spec' => $clip($row['spec'] ?? null, 250),
                    'price' => $num($row['price'] ?? null) ?? $mrp ?? 0,
                    'mrp' => $mrp,
                    'category' => $clip($row['category'] ?? null, 120),
                    'is_active' => true,
                ];
                // Only set image when provided, so re-imports never wipe an existing photo.
                if (! empty($row['image'])) {
                    $attrs['image'] = $clip($row['image'], 250);
                }
                $product = Product::updateOrCreate(
                    ['brand_id' => $brandId, 'item_no' => $itemNo],
                    $attrs,
                );
                $product->wasRecentlyCreated ? $created++ : $updated++;
            }
        });

        return [$created, $updated, $skipped];
    }

    private function validateProduct(Request $request): array
    {
        return $request->validate([
            'item_no' => 'required|string|max:60',
            'name' => 'required|string|max:200',
            'spec' => 'nullable|string|max:200',
            'price' => 'required|numeric|min:0',
            'mrp' => 'nullable|numeric|min:0',
            'brand_id' => 'nullable|exists:brands,id',
            'category' => 'nullable|string|max:80',
            'bulk' => 'nullable|string|max:60',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp,svg|max:2048',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);
    }
}
