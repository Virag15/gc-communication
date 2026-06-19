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

    /** Brands we hold (authorised distribution). */
    public function brands(): View
    {
        return view('public.brands', [
            'settings' => SiteSetting::map(),
            'seo' => null,
            'brands' => Brand::active()->ordered()->get(),
        ]);
    }

    /** Product range / line card overview. */
    public function range(): View
    {
        return view('public.range', [
            'settings' => SiteSetting::map(),
            'seo' => SeoSetting::where('page_identifier', 'products')->first(),
        ]);
    }

    /** About the company. */
    public function about(): View
    {
        return view('public.about', [
            'settings' => SiteSetting::map(),
            'seo' => SeoSetting::where('page_identifier', 'about')->first(),
        ]);
    }

    /** Contact / enquiry page. */
    public function contact(): View
    {
        return view('public.contact', [
            'settings' => SiteSetting::map(),
            'seo' => SeoSetting::where('page_identifier', 'contact')->first(),
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

    /** Public blog listing (published posts only). */
    public function blog(): View
    {
        return view('public.blog.index', [
            'settings' => SiteSetting::map(),
            'seo' => SeoSetting::where('page_identifier', 'blog')->first(),
            'posts' => \App\Models\Post::published()->latestFirst()->get(),
        ]);
    }

    /** A single published blog post. */
    public function blogPost(string $slug): View
    {
        $post = \App\Models\Post::published()->where('slug', $slug)->firstOrFail();
        // Fall back to the cover image for social sharing when no OG image is set.
        $post->og_image = $post->og_image ?: $post->cover_image;

        return view('public.blog.show', [
            'settings' => SiteSetting::map(),
            'seo' => $post,
            'post' => $post,
        ]);
    }

    /** Store a contact / enquiry submission from the public site. */
    public function storeEnquiry(StoreEnquiryRequest $request): RedirectResponse
    {
        Enquiry::create($request->validated());

        return back()->with('success', 'Thank you. Your enquiry has been received and we will get back to you shortly.');
    }
}
