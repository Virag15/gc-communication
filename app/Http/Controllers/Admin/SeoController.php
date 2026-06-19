<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeoSetting;
use App\Traits\Auditable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;

class SeoController extends Controller
{
    use Auditable;

    /**
     * Allowed page identifiers for SEO settings.
     * Add your own page identifiers here as you build out your site.
     */
    private const ALLOWED_PAGES = ['home'];

    public function index()
    {
        $seoSettings = SeoSetting::orderBy('page_identifier')->get();

        // Define your public pages here for SEO management.
        $pages = [
            ['identifier' => 'home', 'label' => 'Home Page'],
            // ['identifier' => 'about', 'label' => 'About Page'],
            // ['identifier' => 'contact', 'label' => 'Contact Page'],
        ];

        $sitemapPath = public_path('sitemap.xml');
        $sitemapInfo = [
            'exists' => file_exists($sitemapPath),
            'last_generated' => file_exists($sitemapPath) ? date('Y-m-d H:i:s', filemtime($sitemapPath)) : null,
            'url' => url('/sitemap.xml'),
        ];

        return Inertia::render('Admin/Seo/Index', [
            'seoSettings' => $seoSettings,
            'pages' => $pages,
            'sitemapInfo' => $sitemapInfo,
        ]);
    }

    public function edit(string $pageIdentifier)
    {
        if (!in_array($pageIdentifier, self::ALLOWED_PAGES, true)) {
            abort(404);
        }

        $seo = SeoSetting::firstOrCreate(
            ['page_identifier' => $pageIdentifier],
            ['meta_title' => '', 'meta_description' => '']
        );

        return Inertia::render('Admin/Seo/Edit', [
            'seo' => $seo,
        ]);
    }

    public function update(Request $request, string $pageIdentifier)
    {
        if (!in_array($pageIdentifier, self::ALLOWED_PAGES, true)) {
            abort(404);
        }

        $validated = $request->validate([
            'meta_title' => 'nullable|string|max:70',
            'meta_description' => 'nullable|string|max:170',
            'og_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'meta_keywords' => 'nullable|string|max:500',
            'structured_data' => 'nullable|string|max:5000',
            'canonical_url' => 'nullable|url|max:500',
            'noindex' => 'boolean',
        ]);

        $validated['meta_title'] = isset($validated['meta_title']) ? strip_tags($validated['meta_title']) : null;
        $validated['meta_description'] = isset($validated['meta_description']) ? strip_tags($validated['meta_description']) : null;

        if (!empty($validated['structured_data'])) {
            json_decode($validated['structured_data']);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return back()->withErrors(['structured_data' => 'Structured data must be valid JSON.']);
            }
        }

        if ($request->hasFile('og_image')) {
            $path = $request->file('og_image')->store('seo', 'public');
            $validated['og_image'] = '/storage/' . $path;
        } else {
            unset($validated['og_image']);
        }

        if (isset($validated['meta_keywords'])) {
            $validated['meta_keywords'] = array_values(array_filter(
                array_map(fn($kw) => strip_tags(trim($kw)), explode(',', $validated['meta_keywords']))
            ));
        }

        $seo = SeoSetting::updateOrCreate(
            ['page_identifier' => $pageIdentifier],
            $validated
        );

        $this->audit('updated', $seo);

        return redirect()->route('admin.seo.index')
            ->with('success', 'SEO settings updated successfully.');
    }

    public function regenerateSitemap()
    {
        $sitemapXml = $this->generateSitemapXml();

        $sitemapPath = public_path('sitemap.xml');
        File::put($sitemapPath, $sitemapXml);

        return redirect()->route('admin.seo.index')
            ->with('success', 'Sitemap regenerated successfully.');
    }

    /**
     * Generate sitemap XML.
     * Add your dynamic routes here (e.g., blog posts, products).
     */
    private function generateSitemapXml(): string
    {
        $urls = [];
        $baseUrl = config('app.url');

        // Static pages - add your public pages here
        $staticPages = [
            ['loc' => '/', 'priority' => '1.0', 'changefreq' => 'weekly'],
            // ['loc' => '/about', 'priority' => '0.8', 'changefreq' => 'monthly'],
            // ['loc' => '/contact', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ];

        foreach ($staticPages as $page) {
            $urls[] = $page;
        }

        // ──────────────────────────────────────────────
        // Add dynamic routes here, e.g.:
        // $posts = BlogPost::published()->get();
        // foreach ($posts as $post) {
        //     $urls[] = [
        //         'loc' => "/blog/{$post->slug}",
        //         'lastmod' => $post->updated_at->toW3cString(),
        //         'priority' => '0.7',
        //         'changefreq' => 'weekly',
        //     ];
        // }
        // ──────────────────────────────────────────────

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($urls as $url) {
            $xml .= '  <url>' . "\n";
            $xml .= '    <loc>' . htmlspecialchars($baseUrl . $url['loc'], ENT_XML1) . '</loc>' . "\n";
            if (isset($url['lastmod'])) {
                $xml .= '    <lastmod>' . $url['lastmod'] . '</lastmod>' . "\n";
            }
            $xml .= '    <changefreq>' . $url['changefreq'] . '</changefreq>' . "\n";
            $xml .= '    <priority>' . $url['priority'] . '</priority>' . "\n";
            $xml .= '  </url>' . "\n";
        }
        $xml .= '</urlset>';

        return $xml;
    }
}
