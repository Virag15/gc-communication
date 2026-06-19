<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeoSetting;
use App\Traits\Auditable;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;

class SeoController extends Controller
{
    use Auditable;

    /**
     * Pages whose SEO is managed, in tab order.
     * Add an entry here to enable a new page tab.
     */
    private const PAGES = [
        'home' => 'Home Page',
        'about' => 'About Page',
        'contact' => 'Contact Page',
        'products' => 'Products Page',
        'blog' => 'Blog Page',
        'legal' => 'Legal Page',
    ];

    /** @return string[] */
    private function allowed(): array
    {
        return array_keys(self::PAGES);
    }

    public function index()
    {
        $existing = SeoSetting::whereIn('page_identifier', $this->allowed())->get()->keyBy('page_identifier');

        $seoSettings = [];
        foreach (self::PAGES as $id => $label) {
            $seoSettings[$id] = $existing->get($id) ?? new SeoSetting(['page_identifier' => $id]);
        }

        $pages = [];
        foreach (self::PAGES as $id => $label) {
            $pages[] = ['identifier' => $id, 'label' => $label];
        }

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
            'appUrl' => config('app.url'),
        ]);
    }

    public function edit(string $pageIdentifier)
    {
        if (!in_array($pageIdentifier, $this->allowed(), true)) {
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
        if (!in_array($pageIdentifier, $this->allowed(), true)) {
            abort(404);
        }

        $validated = $request->validate([
            'meta_title' => 'nullable|string|max:70',
            'meta_description' => 'nullable|string|max:170',
            'og_title' => 'nullable|string|max:70',
            'og_description' => 'nullable|string|max:200',
            'og_type' => 'nullable|string|max:20',
            'og_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'meta_keywords' => 'nullable|string|max:500',
            'structured_data' => 'nullable|string|max:5000',
            'canonical_url' => 'nullable|url|max:500',
            'noindex' => 'boolean',
        ]);

        if (!empty($validated['structured_data'])) {
            json_decode($validated['structured_data']);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return back()->withErrors(['structured_data' => 'Structured data must be valid JSON.']);
            }
        }

        $seo = $this->persistSeo($pageIdentifier, $validated, $request->file('og_image'));
        $this->audit('updated', $seo);

        return redirect()->route('admin.seo.index')->with('success', 'SEO settings updated successfully.');
    }

    /** Bulk "Save All" for the tabbed editor. */
    public function updateAll(Request $request)
    {
        $request->validate([
            'pages' => 'array',
            'pages.*.meta_title' => 'nullable|string|max:70',
            'pages.*.meta_description' => 'nullable|string|max:170',
            'pages.*.og_title' => 'nullable|string|max:70',
            'pages.*.og_description' => 'nullable|string|max:200',
            'pages.*.og_type' => 'nullable|string|max:20',
            'pages.*.meta_keywords' => 'nullable|string|max:500',
            'pages.*.canonical_url' => 'nullable|url|max:500',
            'pages.*.structured_data' => 'nullable|json|max:5000',
            'pages.*.og_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'pages.*.noindex' => 'nullable',
        ]);

        $pages = $request->input('pages', []);
        foreach ($this->allowed() as $id) {
            if (!array_key_exists($id, $pages)) {
                continue;
            }
            $this->persistSeo($id, $pages[$id], $request->file("pages.$id.og_image"));
        }

        return redirect()->route('admin.seo.index')->with('success', 'SEO settings saved.');
    }

    /** Sanitise + persist a single page's SEO settings. */
    private function persistSeo(string $id, array $data, ?UploadedFile $ogImage): SeoSetting
    {
        $payload = [
            'meta_title' => isset($data['meta_title']) ? strip_tags($data['meta_title']) : null,
            'meta_description' => isset($data['meta_description']) ? strip_tags($data['meta_description']) : null,
            'og_title' => isset($data['og_title']) ? strip_tags($data['og_title']) : null,
            'og_description' => isset($data['og_description']) ? strip_tags($data['og_description']) : null,
            'og_type' => isset($data['og_type']) ? strip_tags($data['og_type']) : 'website',
            'canonical_url' => $data['canonical_url'] ?? null,
            'structured_data' => $data['structured_data'] ?? null,
            'noindex' => filter_var($data['noindex'] ?? false, FILTER_VALIDATE_BOOLEAN),
        ];

        if (array_key_exists('meta_keywords', $data)) {
            $payload['meta_keywords'] = $data['meta_keywords']
                ? array_values(array_filter(array_map(fn ($kw) => strip_tags(trim($kw)), explode(',', $data['meta_keywords']))))
                : [];
        }

        if ($ogImage) {
            $payload['og_image'] = '/storage/' . $ogImage->store('seo', 'public');
        }

        return SeoSetting::updateOrCreate(['page_identifier' => $id], $payload);
    }

    public function regenerateSitemap()
    {
        File::put(public_path('sitemap.xml'), $this->generateSitemapXml());

        return redirect()->route('admin.seo.index')->with('success', 'Sitemap regenerated successfully.');
    }

    private function generateSitemapXml(): string
    {
        $baseUrl = config('app.url');
        $staticPages = [
            ['loc' => '/', 'priority' => '1.0', 'changefreq' => 'weekly'],
            ['loc' => '/catalogues', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ];

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($staticPages as $url) {
            $xml .= '  <url>' . "\n";
            $xml .= '    <loc>' . htmlspecialchars($baseUrl . $url['loc'], ENT_XML1) . '</loc>' . "\n";
            $xml .= '    <changefreq>' . $url['changefreq'] . '</changefreq>' . "\n";
            $xml .= '    <priority>' . $url['priority'] . '</priority>' . "\n";
            $xml .= '  </url>' . "\n";
        }
        $xml .= '</urlset>';

        return $xml;
    }
}
