<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Catalogue;
use App\Models\SeoSetting;
use App\Models\SiteSetting;
use Illuminate\Contracts\View\View;

class PublicController extends Controller
{
    /** Public marketing home page (server-rendered for SEO). */
    public function home(): View
    {
        return view('public.home', [
            'settings' => SiteSetting::map(),
            'seo' => SeoSetting::where('page_identifier', 'home')->first(),
            'brands' => Brand::active()->ordered()->get(),
            'catalogueCount' => Catalogue::active()->count(),
        ]);
    }

    /** Public catalogue / downloads page. */
    public function catalogues(): View
    {
        return view('public.catalogues', [
            'settings' => SiteSetting::map(),
            'seo' => SeoSetting::where('page_identifier', 'catalogues')->first(),
            'brands' => Brand::active()->ordered()->get(),
            'catalogues' => Catalogue::active()->ordered()->with('brand')->get(),
        ]);
    }
}
