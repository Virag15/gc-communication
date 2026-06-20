<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCatalogueRequest;
use App\Http\Requests\Admin\UpdateCatalogueRequest;
use App\Models\Brand;
use App\Models\Catalogue;
use App\Traits\Auditable;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CatalogueController extends Controller
{
    use Auditable;

    public function index()
    {
        $catalogues = Catalogue::ordered()->with('brand')->get();

        return Inertia::render('Admin/Catalogues/Index', [
            'catalogues' => $catalogues,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Catalogues/Create', [
            'brands' => Brand::ordered()->get(['id', 'name', 'logo']),
        ]);
    }

    public function edit(int $id)
    {
        $catalogue = Catalogue::findOrFail($id);

        return Inertia::render('Admin/Catalogues/Edit', [
            'catalogue' => $catalogue,
            'brands' => Brand::ordered()->get(['id', 'name', 'logo']),
        ]);
    }

    public function store(StoreCatalogueRequest $request)
    {
        $validated = $request->validated();

        $validated['title'] = strip_tags($validated['title']);
        $validated['sort_order'] = $validated['sort_order'] ?? 0;
        $validated['is_active'] = $request->boolean('is_active');

        $file = $request->file('file');
        $validated['file_name'] = $file->getClientOriginalName();
        $validated['file_size'] = $file->getSize();
        $validated['file'] = '/storage/' . $file->store('catalogues', 'public');

        $catalogue = DB::transaction(function () use ($validated) {
            return Catalogue::create($validated);
        });

        $this->audit('created', $catalogue);

        return redirect()->route('admin.catalogues.index')
            ->with('success', 'Catalogue created successfully.');
    }

    public function update(UpdateCatalogueRequest $request, int $id)
    {
        $catalogue = Catalogue::findOrFail($id);

        $validated = $request->validated();

        $validated['title'] = strip_tags($validated['title']);
        $validated['sort_order'] = $validated['sort_order'] ?? 0;
        $validated['is_active'] = $request->boolean('is_active');

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $validated['file_name'] = $file->getClientOriginalName();
            $validated['file_size'] = $file->getSize();
            $validated['file'] = '/storage/' . $file->store('catalogues', 'public');
        } else {
            unset($validated['file']);
        }

        DB::transaction(function () use ($catalogue, $validated) {
            $catalogue->update($validated);
        });

        $this->audit('updated', $catalogue, $validated);

        return redirect()->route('admin.catalogues.index')
            ->with('success', 'Catalogue updated successfully.');
    }

    public function destroy(int $id)
    {
        $catalogue = Catalogue::findOrFail($id);

        $this->audit('deleted', $catalogue);

        DB::transaction(function () use ($catalogue) {
            $catalogue->delete();
        });

        return back()->with('success', 'Catalogue deleted successfully.');
    }
}
