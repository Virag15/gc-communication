<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSiteSettingsRequest;
use App\Models\SiteSetting;
use Inertia\Inertia;

class SiteSettingController extends Controller
{
    /** String settings managed by the form (the consent toggle is handled separately). */
    private const STRING_KEYS = [
        'gtm_id', 'ga4_id', 'meta_pixel_id',
        'google_site_verification', 'bing_site_verification',
        'site_name', 'default_meta_title', 'default_meta_description', 'default_og_image',
        'org_logo', 'contact_email', 'contact_phone', 'contact_address',
        'social_facebook', 'social_instagram', 'social_linkedin',
    ];

    public function index()
    {
        return Inertia::render('Admin/Settings/Index', [
            'settings' => SiteSetting::map(),
        ]);
    }

    public function update(UpdateSiteSettingsRequest $request)
    {
        $data = $request->validated();

        foreach (self::STRING_KEYS as $key) {
            $value = $data[$key] ?? null;
            SiteSetting::put($key, ($value === '' || $value === null) ? null : $value);
        }

        SiteSetting::put('consent_enabled', $request->boolean('consent_enabled') ? '1' : '0');

        return back()->with('success', 'Site settings saved.');
    }
}
