<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSiteSettingsRequest;
use App\Models\SiteSetting;
use Inertia\Inertia;

class SiteSettingController extends Controller
{
    /** String settings managed by the form (consent + image uploads handled separately). */
    private const STRING_KEYS = [
        'gtm_id', 'ga4_id', 'meta_pixel_id',
        'google_site_verification', 'bing_site_verification',
        'site_name', 'default_meta_title', 'default_meta_description',
        'contact_email', 'contact_phone', 'contact_address',
        'social_facebook', 'social_instagram', 'social_linkedin',
        // Homepage hero + headline stats
        'hero_eyebrow', 'hero_headline', 'hero_subtext',
        'stat_years', 'stat_lines', 'stat_orders', 'stat_fill_rate',
        'locations', 'since_year',
        // Arbitrary code injected into every public page
        'custom_head_html', 'custom_body_html',
    ];

    /** Uploaded image settings: form key => storage sub-directory. */
    private const IMAGE_KEYS = [
        'default_og_image' => 'og',
        'org_logo' => 'branding',
        'hero_image' => 'hero',
    ];

    public function index()
    {
        return Inertia::render('Admin/Settings/Index', [
            'settings' => SiteSetting::map(),
            'appUrl' => config('app.url'),
        ]);
    }

    public function update(UpdateSiteSettingsRequest $request)
    {
        $data = $request->validated();

        foreach (self::STRING_KEYS as $key) {
            $value = $data[$key] ?? null;
            SiteSetting::put($key, ($value === '' || $value === null) ? null : $value);
        }

        // Store newly uploaded images; leave existing ones untouched when no file is sent.
        foreach (self::IMAGE_KEYS as $key => $dir) {
            if ($request->hasFile($key)) {
                $path = $request->file($key)->store($dir, 'public');
                SiteSetting::put($key, '/storage/' . $path);
            }
        }

        SiteSetting::put('consent_enabled', $request->boolean('consent_enabled') ? '1' : '0');

        return back()->with('success', 'Site settings saved.');
    }
}
