<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEnquiryRequest;
use App\Models\Brand;
use App\Models\Catalogue;
use App\Models\Enquiry;
use App\Models\SeoSetting;
use App\Models\SiteSetting;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;

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

    /** Count a download, then stream the file as an attachment. */
    public function downloadCatalogue(int $id): \Symfony\Component\HttpFoundation\Response
    {
        $catalogue = Catalogue::active()->findOrFail($id);
        $catalogue->increment('download_count');

        $file = (string) $catalogue->file;

        // External URLs cannot be streamed locally - just redirect.
        if (\Illuminate\Support\Str::startsWith($file, ['http://', 'https://'])) {
            return redirect($file);
        }

        $path = public_path(ltrim($file, '/'));
        if (!is_file($path)) {
            return redirect($file);
        }

        $name = $catalogue->file_name ?: (\Illuminate\Support\Str::slug($catalogue->title) . '.pdf');

        return response()->download($path, $name);
    }

    /** Store a contact / enquiry submission from the public site. */
    public function storeEnquiry(StoreEnquiryRequest $request): RedirectResponse
    {
        Enquiry::create($request->validated());

        return back()->with('success', 'Thank you. Your enquiry has been received and we will get back to you shortly.');
    }
}
