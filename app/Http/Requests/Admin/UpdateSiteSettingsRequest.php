<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSiteSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Tracking / analytics
            'gtm_id' => ['nullable', 'string', 'max:50'],
            'ga4_id' => ['nullable', 'string', 'max:50'],
            'meta_pixel_id' => ['nullable', 'string', 'max:50'],

            // Search-engine verification
            'google_site_verification' => ['nullable', 'string', 'max:255'],
            'bing_site_verification' => ['nullable', 'string', 'max:255'],

            // SEO defaults
            'site_name' => ['nullable', 'string', 'max:120'],
            'default_meta_title' => ['nullable', 'string', 'max:70'],
            'default_meta_description' => ['nullable', 'string', 'max:200'],
            'default_og_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],

            // Organization / contact (also used for JSON-LD + footer)
            'org_logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:2048'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'contact_address' => ['nullable', 'string', 'max:500'],
            'social_facebook' => ['nullable', 'url', 'max:255'],
            'social_instagram' => ['nullable', 'url', 'max:255'],
            'social_linkedin' => ['nullable', 'url', 'max:255'],

            // Homepage hero + headline stats
            'hero_eyebrow' => ['nullable', 'string', 'max:120'],
            'hero_headline' => ['nullable', 'string', 'max:200'],
            'hero_subtext' => ['nullable', 'string', 'max:500'],
            'hero_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'stat_years' => ['nullable', 'string', 'max:20'],
            'stat_lines' => ['nullable', 'string', 'max:20'],
            'stat_orders' => ['nullable', 'string', 'max:20'],
            'stat_fill_rate' => ['nullable', 'string', 'max:20'],
            'locations' => ['nullable', 'string', 'max:120'],
            'since_year' => ['nullable', 'string', 'max:10'],

            // Arbitrary code injected on every public page (admin-trusted)
            'custom_head_html' => ['nullable', 'string', 'max:20000'],
            'custom_body_html' => ['nullable', 'string', 'max:20000'],

            // Privacy
            'consent_enabled' => ['boolean'],
        ];
    }
}
