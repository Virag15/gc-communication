<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\BomRequest;
use App\Models\Bom;
use App\Models\SiteSetting;
use App\Traits\Auditable;
use Inertia\Inertia;

class BomController extends Controller
{
    use Auditable;

    public function index()
    {
        $boms = Bom::latest()->get(['id', 'name', 'customer', 'material', 'width_ft', 'height_ft', 'grand_total', 'created_at', 'updated_at']);

        return Inertia::render('Admin/Bom/Index', [
            'boms' => $boms,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Bom/Create', [
            'company' => $this->company(),
        ]);
    }

    public function store(BomRequest $request)
    {
        $bom = Bom::create($this->prepare($request->validated()));
        $this->audit('created', $bom);

        return redirect()->route('admin.bom.index')->with('success', 'BOM saved successfully.');
    }

    public function show(int $id)
    {
        $bom = Bom::findOrFail($id);

        return Inertia::render('Admin/Bom/Show', [
            'bom' => $bom,
            'company' => $this->company(),
        ]);
    }

    public function edit(int $id)
    {
        $bom = Bom::findOrFail($id);

        return Inertia::render('Admin/Bom/Edit', [
            'bom' => $bom,
            'company' => $this->company(),
        ]);
    }

    public function update(BomRequest $request, int $id)
    {
        $bom = Bom::findOrFail($id);
        $bom->update($this->prepare($request->validated()));
        $this->audit('updated', $bom);

        return redirect()->route('admin.bom.index')->with('success', 'BOM updated successfully.');
    }

    public function destroy(int $id)
    {
        $bom = Bom::findOrFail($id);
        $bom->delete();
        $this->audit('deleted', $bom);

        return back()->with('success', 'BOM deleted.');
    }

    /**
     * Recompute line-item amounts + system/grand totals server-side
     * so the persisted figures never trust the client.
     */
    private function prepare(array $validated): array
    {
        $items = [];
        $lsps = 0.0;
        $ssps = 0.0;
        $sr = ['LSPS' => 0, 'SSPS' => 0];

        foreach ($validated['line_items'] as $li) {
            $qty = (float) $li['qty'];
            $mrp = (float) $li['mrp'];
            $amount = round($qty * $mrp, 2);
            $system = $li['system'];

            $items[] = [
                'system' => $system,
                'sr' => ++$sr[$system],
                'name' => $li['name'],
                'code' => $li['code'] ?? '',
                'finish' => $li['finish'] ?? '',
                'qty' => $qty,
                'mrp' => $mrp,
                'amount' => $amount,
                'custom' => (bool) ($li['custom'] ?? false),
            ];

            if ($system === 'LSPS') {
                $lsps += $amount;
            } else {
                $ssps += $amount;
            }
        }

        return array_merge($validated, [
            'line_items' => $items,
            'lsps_total' => $lsps,
            'ssps_total' => $ssps,
            'grand_total' => $lsps + $ssps,
            'template' => $validated['template'] ?? 'classic',
            'accent' => $validated['accent'] ?? '#2563eb',
        ]);
    }

    /** Letterhead details for the PDF, sourced from Site Settings. */
    private function company(): array
    {
        return [
            'name' => SiteSetting::get('site_name', config('app.name')),
            'phone' => SiteSetting::get('contact_phone', ''),
            'email' => SiteSetting::get('contact_email', ''),
            'address' => SiteSetting::get('contact_address', ''),
        ];
    }
}
