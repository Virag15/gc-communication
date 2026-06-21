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
        $validated = $request->validate([
            'brand_id' => 'nullable|integer|exists:brands,id',
            'rows' => 'required|array|min:1|max:10000',
            'rows.*.item_no' => 'required|string|max:60',
            'rows.*.name' => 'required|string|max:200',
            'rows.*.spec' => 'nullable|string|max:200',
            'rows.*.price' => 'nullable|numeric|min:0',
            'rows.*.mrp' => 'nullable|numeric|min:0',
            'rows.*.category' => 'nullable|string|max:80',
        ]);

        $brandId = $validated['brand_id'] ?? null;
        $created = 0;
        $updated = 0;

        DB::transaction(function () use ($validated, $brandId, &$created, &$updated) {
            foreach ($validated['rows'] as $row) {
                $price = $row['price'] ?? $row['mrp'] ?? 0;
                $product = Product::updateOrCreate(
                    ['brand_id' => $brandId, 'item_no' => $row['item_no']],
                    [
                        'name' => $row['name'],
                        'spec' => $row['spec'] ?? null,
                        'price' => $price,
                        'mrp' => $row['mrp'] ?? null,
                        'category' => $row['category'] ?? null,
                        'is_active' => true,
                    ],
                );
                $product->wasRecentlyCreated ? $created++ : $updated++;
            }
        });

        return redirect()->route('admin.products.index')
            ->with('success', "Import complete: {$created} added, {$updated} updated.");
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
