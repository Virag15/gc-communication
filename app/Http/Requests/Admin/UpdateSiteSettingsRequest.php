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
            'default_og_image' => ['nullable', 'string', 'max:500'],

            // Organization / contact (also used for JSON-LD + footer)
            'org_logo' => ['nullable', 'string', 'max:500'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'contact_address' => ['nullable', 'string', 'max:500'],
            'social_facebook' => ['nullable', 'url', 'max:255'],
            'social_instagram' => ['nullable', 'url', 'max:255'],
            'social_linkedin' => ['nullable', 'url', 'max:255'],

            // Privacy
            'consent_enabled' => ['boolean'],
        ];
    }
}
