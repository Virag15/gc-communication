<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EstimateRequest;
use App\Models\Brand;
use App\Models\Customer;
use App\Models\Estimate;
use App\Models\EstimateSetting;
use App\Models\Product;
use App\Traits\Auditable;
use Inertia\Inertia;

class EstimateController extends Controller
{
    use Auditable;

    public function index()
    {
        $estimates = Estimate::latest()->get(['id', 'estimate_no', 'customer', 'grand_total', 'status', 'created_at', 'updated_at']);

        return Inertia::render('Admin/Bom/Index', [
            'estimates' => $estimates,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Bom/Editor', array_merge($this->editorData(), [
            'estimate' => null,
            'nextNo' => $this->nextNo(),
        ]));
    }

    public function store(EstimateRequest $request)
    {
        $estimate = Estimate::create($this->prepare($request));
        $this->audit('created', $estimate);

        return redirect()->route('admin.bom.index')->with('success', 'Estimate saved successfully.');
    }

    public function show(int $id)
    {
        $estimate = Estimate::findOrFail($id);

        return Inertia::render('Admin/Bom/Show', [
            'estimate' => $estimate,
            'settings' => EstimateSetting::current(),
            'brandLogos' => $this->brandLogos(),
        ]);
    }

    public function edit(int $id)
    {
        $estimate = Estimate::findOrFail($id);

        return Inertia::render('Admin/Bom/Editor', array_merge($this->editorData(), [
            'estimate' => $estimate,
            'nextNo' => $estimate->estimate_no,
        ]));
    }

    public function update(EstimateRequest $request, int $id)
    {
        $estimate = Estimate::findOrFail($id);
        $estimate->update($this->prepare($request, $estimate));
        $this->audit('updated', $estimate);

        return redirect()->route('admin.bom.index')->with('success', 'Estimate updated successfully.');
    }

    public function destroy(int $id)
    {
        $estimate = Estimate::findOrFail($id);
        $estimate->delete();
        $this->audit('deleted', $estimate);

        return redirect()->route('admin.bom.index')->with('success', 'Estimate deleted.');
    }

    /** Shared props for the create/edit editor. */
    private function editorData(): array
    {
        return [
            'products' => Product::active()->ordered()->get(['id', 'item_no', 'name', 'spec', 'price', 'mrp', 'bulk', 'image', 'category']),
            'customers' => Customer::orderBy('name')->get(['id', 'name', 'company', 'phone', 'email', 'address', 'gstin', 'ref_by']),
            'settings' => EstimateSetting::current(),
            'brandLogos' => $this->brandLogos(),
        ];
    }

    /** Active brand logos for the "Authorized dealer for" strip. */
    private function brandLogos(): array
    {
        if (! EstimateSetting::current()->use_brand_logos) {
            return [];
        }

        return Brand::active()->ordered()->whereNotNull('logo')->pluck('logo')->values()->all();
    }

    /** Build the persisted payload: snapshot customer, normalise lines, recompute totals. */
    private function prepare(EstimateRequest $request, ?Estimate $existing = null): array
    {
        $data = $request->validated();

        // Resolve / create the customer.
        $snapshot = $data['customer'];
        $customerId = $data['customer_id'] ?? null;
        if (! $customerId && ! empty($snapshot['name'])) {
            $customer = Customer::create([
                'name' => $snapshot['name'],
                'company' => $snapshot['company'] ?? null,
                'phone' => $snapshot['phone'] ?? null,
                'email' => $snapshot['email'] ?? null,
                'address' => $snapshot['address'] ?? null,
                'gstin' => $snapshot['gstin'] ?? null,
                'ref_by' => $snapshot['ref_by'] ?? null,
            ]);
            $customerId = $customer->id;
        }

        // Normalise line items.
        $lines = [];
        foreach ($data['line_items'] as $li) {
            $lines[] = [
                'product_id' => $li['product_id'] ?? null,
                'item_no' => $li['item_no'] ?? '',
                'name' => $li['name'],
                'spec' => $li['spec'] ?? '',
                'qty' => (float) $li['qty'],
                'unit_price' => (float) $li['unit_price'],
                'mrp' => isset($li['mrp']) ? (float) $li['mrp'] : null,
                'image' => $li['image'] ?? null,
            ];
        }

        $showScheme = (bool) ($data['show_scheme'] ?? true);
        $gstPct = (int) ($data['gst_pct'] ?? 0);
        $special = (float) ($data['special_discount'] ?? 0);
        $delivery = (float) ($data['delivery_fee'] ?? 0);
        $totals = $this->totals($lines, $showScheme, $gstPct, $special, $delivery);

        return [
            'estimate_no' => $existing?->estimate_no ?? $this->nextNo(),
            'customer_id' => $customerId,
            'customer' => $snapshot,
            'line_items' => $lines,
            'special_discount' => $special,
            'delivery_fee' => $delivery,
            'express' => (bool) ($data['express'] ?? false),
            'gst_pct' => $gstPct,
            'show_prices' => (bool) ($data['show_prices'] ?? true),
            'show_scheme' => $showScheme,
            'template' => $data['template'],
            'accent' => $data['accent'] ?? '#2563EB',
            'item_total' => $totals['itemTotal'],
            'scheme_off' => $totals['schemeOff'],
            'gst_amt' => $totals['gstAmt'],
            'grand_total' => $totals['grand'],
            'status' => $existing?->status ?? 'draft',
        ];
    }

    /** Server-side bill math (mirror of resources/js/lib/estimateMoney.ts). */
    private function totals(array $lines, bool $showScheme, int $gstPct, float $special, float $delivery): array
    {
        $itemTotal = 0.0;
        foreach ($lines as $l) {
            $itemTotal += (float) $l['unit_price'] * (float) $l['qty'];
        }
        $schemeOff = 0.0;
        if ($showScheme) {
            foreach ([[50000, 3], [25000, 2], [10000, 1]] as [$min, $off]) {
                if ($itemTotal >= $min) {
                    $schemeOff = round($itemTotal * $off / 100, 2);
                    break;
                }
            }
        }
        $special = max(0, $special);
        $delivery = max(0, $delivery);
        $subtotal = max(0, $itemTotal - $schemeOff - $special + $delivery);
        $gstAmt = $gstPct ? round($subtotal * $gstPct / 100, 2) : 0.0;

        return [
            'itemTotal' => round($itemTotal, 2),
            'schemeOff' => $schemeOff,
            'gstAmt' => $gstAmt,
            'grand' => round($subtotal + $gstAmt, 2),
        ];
    }

    private function nextNo(): string
    {
        do {
            $no = 'BOM-' . random_int(100000, 999999);
        } while (Estimate::where('estimate_no', $no)->exists());

        return $no;
    }
}
