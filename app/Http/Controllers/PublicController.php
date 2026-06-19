<?php

namespace App\Http\Controllers;

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
        ]);
    }
}
