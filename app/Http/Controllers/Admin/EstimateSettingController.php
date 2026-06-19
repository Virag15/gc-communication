<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EstimateSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EstimateSettingController extends Controller
{
    public function edit()
    {
        return Inertia::render('Admin/Bom/Settings', [
            'settings' => EstimateSetting::current(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:120',
            'prepared_by' => 'nullable|string|max:120',
            'doc_title' => 'nullable|string|max:60',
            'note' => 'nullable|string|max:1000',
            'terms' => 'nullable|string|max:2000',
            'valid_days' => 'required|integer|min:1|max:365',
            'template' => 'required|in:classic,bold,studio',
            'accent' => 'nullable|string|max:20',
            'paper' => 'nullable|string|max:20',
            'font' => 'required|in:inter,pjs',
            'footer_color' => 'nullable|string|max:20',
            'side_color' => 'nullable|string|max:20',
            'wordmark_color' => 'nullable|string|max:20',
            'logos_pos' => 'required|in:top,bottom',
            'photos' => 'boolean',
            'show_prices' => 'boolean',
            'show_scheme' => 'boolean',
            'use_brand_logos' => 'boolean',
            'gst_pct' => 'required|integer|in:0,5,12,18,28',
            'watermark' => 'nullable|string|max:40',
            'dealer_addr1' => 'nullable|string|max:160',
            'dealer_addr2' => 'nullable|string|max:160',
            'dealer_phone' => 'nullable|string|max:60',
            'dealer_email' => 'nullable|string|max:160',
            'dealer_website' => 'nullable|string|max:160',
            'dealer_gstin' => 'nullable|string|max:30',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp,svg|max:2048',
        ]);

        $settings = EstimateSetting::current();

        if ($request->hasFile('logo')) {
            $validated['logo'] = '/storage/' . $request->file('logo')->store('estimate', 'public');
        } else {
            unset($validated['logo']);
        }

        foreach (['photos', 'show_prices', 'show_scheme', 'use_brand_logos'] as $b) {
            $validated[$b] = filter_var($request->input($b), FILTER_VALIDATE_BOOLEAN);
        }

        $settings->update($validated);

        return redirect()->route('admin.bom.settings')->with('success', 'Estimate settings saved.');
    }
}
