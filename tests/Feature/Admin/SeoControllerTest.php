<?php

namespace Tests\Feature\Admin;

use App\Models\SeoSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SeoControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private User $admin;
    private User $editor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create(['role' => 'super_admin', 'is_active' => true]);
        $this->admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $this->editor = User::factory()->create(['role' => 'editor', 'is_active' => true]);
    }

    private function validSeoData(array $overrides = []): array
    {
        return array_merge([
            'meta_title' => 'Page Title for SEO',
            'meta_description' => 'A concise description for search engines.',
            'meta_keywords' => 'health, clinic, medical',
            'structured_data' => '{"@context":"https://schema.org","@type":"WebPage"}',
            'canonical_url' => 'https://example.com/home',
            'noindex' => false,
        ], $overrides);
    }

    // -------------------------------------------------------------------------
    // Authentication & Authorization
    // -------------------------------------------------------------------------

    public function test_super_admin_can_access_seo_index(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/seo');

        $response->assertStatus(200);
    }

    public function test_admin_can_access_seo_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/seo');

        $response->assertStatus(200);
    }

    public function test_editor_cannot_access_seo_index(): void
    {
        $response = $this->actingAs($this->editor)->get('/admin/seo');

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_is_redirected_from_seo(): void
    {
        $response = $this->get('/admin/seo');

        $response->assertRedirect('/admin/login');
    }

    public function test_editor_cannot_update_seo(): void
    {
        $response = $this->actingAs($this->editor)->put('/admin/seo/home', $this->validSeoData());

        $response->assertStatus(403);
    }

    public function test_editor_cannot_access_seo_edit(): void
    {
        $response = $this->actingAs($this->editor)->get('/admin/seo/home/edit');

        $response->assertStatus(403);
    }

    public function test_editor_cannot_regenerate_sitemap(): void
    {
        $response = $this->actingAs($this->editor)->post('/admin/seo/sitemap/regenerate');

        $response->assertStatus(403);
    }

    // -------------------------------------------------------------------------
    // Index
    // -------------------------------------------------------------------------

    public function test_index_returns_seo_settings_and_pages(): void
    {
        SeoSetting::create([
            'page_identifier' => 'home',
            'meta_title' => 'Home',
            'meta_description' => 'Welcome',
        ]);

        $response = $this->actingAs($this->superAdmin)->get('/admin/seo');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Seo/Index')
            ->has('seoSettings')
            ->has('pages')
            ->has('sitemapInfo')
        );
    }

    // -------------------------------------------------------------------------
    // Edit
    // -------------------------------------------------------------------------

    public function test_edit_loads_valid_page_identifier(): void
    {
        // Mirrors SeoController::ALLOWED_PAGES — add identifiers there to enable more pages.
        $allowedPages = ['home'];

        foreach ($allowedPages as $page) {
            $response = $this->actingAs($this->superAdmin)->get("/admin/seo/{$page}/edit");
            $response->assertStatus(200);
        }
    }

    public function test_edit_returns_404_for_invalid_page_identifier(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/seo/nonexistent/edit');

        $response->assertStatus(404);
    }

    public function test_edit_returns_404_for_non_allowed_page_identifier(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/seo/dashboard/edit');

        $response->assertStatus(404);
    }

    public function test_edit_creates_seo_setting_if_not_exists(): void
    {
        $this->assertDatabaseMissing('seo_settings', ['page_identifier' => 'home']);

        $this->actingAs($this->superAdmin)->get('/admin/seo/home/edit');

        $this->assertDatabaseHas('seo_settings', ['page_identifier' => 'home']);
    }

    // -------------------------------------------------------------------------
    // Update - Valid Data
    // -------------------------------------------------------------------------

    public function test_update_saves_valid_seo_data(): void
    {
        $data = $this->validSeoData();

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $response->assertRedirect(route('admin.seo.index'));
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('seo_settings', [
            'page_identifier' => 'home',
            'meta_title' => 'Page Title for SEO',
        ]);
    }

    public function test_update_returns_404_for_non_allowed_page(): void
    {
        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/pricing', $this->validSeoData());

        $response->assertStatus(404);
    }

    // -------------------------------------------------------------------------
    // Update - Meta Title Validation
    // -------------------------------------------------------------------------

    public function test_update_rejects_meta_title_exceeding_70_characters(): void
    {
        $data = $this->validSeoData(['meta_title' => str_repeat('T', 71)]);

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $response->assertSessionHasErrors('meta_title');
    }

    // -------------------------------------------------------------------------
    // Update - Meta Description Validation
    // -------------------------------------------------------------------------

    public function test_update_rejects_meta_description_exceeding_170_characters(): void
    {
        $data = $this->validSeoData(['meta_description' => str_repeat('D', 171)]);

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $response->assertSessionHasErrors('meta_description');
    }

    // -------------------------------------------------------------------------
    // Update - Structured Data Validation
    // -------------------------------------------------------------------------

    public function test_update_rejects_invalid_structured_data_json(): void
    {
        $data = $this->validSeoData(['structured_data' => '{invalid json content}']);

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $response->assertSessionHasErrors('structured_data');
    }

    public function test_update_accepts_valid_structured_data_json(): void
    {
        $json = json_encode([
            '@context' => 'https://schema.org',
            '@type' => 'MedicalClinic',
            'name' => 'Example Business',
        ]);

        $data = $this->validSeoData(['structured_data' => $json]);

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $response->assertRedirect(route('admin.seo.index'));
        $this->assertDatabaseHas('seo_settings', [
            'page_identifier' => 'home',
            'structured_data' => $json,
        ]);
    }

    // -------------------------------------------------------------------------
    // Update - Canonical URL Validation
    // -------------------------------------------------------------------------

    public function test_update_rejects_invalid_canonical_url(): void
    {
        $data = $this->validSeoData(['canonical_url' => 'not-a-url']);

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $response->assertSessionHasErrors('canonical_url');
    }

    public function test_update_accepts_valid_canonical_url(): void
    {
        $data = $this->validSeoData(['canonical_url' => 'https://www.example.com/about']);

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $response->assertRedirect(route('admin.seo.index'));
        $this->assertDatabaseHas('seo_settings', [
            'page_identifier' => 'home',
            'canonical_url' => 'https://www.example.com/about',
        ]);
    }

    // -------------------------------------------------------------------------
    // Update - Sanitization
    // -------------------------------------------------------------------------

    public function test_update_strips_html_from_meta_title(): void
    {
        $data = $this->validSeoData([
            'meta_title' => '<script>alert("xss")</script>Title',
        ]);

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $seo = SeoSetting::where('page_identifier', 'home')->first();
        $this->assertNotNull($seo);
        $this->assertStringNotContainsString('<script>', $seo->meta_title);
        $this->assertStringContainsString('Title', $seo->meta_title);
    }

    public function test_update_strips_html_from_meta_description(): void
    {
        $data = $this->validSeoData([
            'meta_description' => '<b>Bold</b> <script>evil()</script>description',
        ]);

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $seo = SeoSetting::where('page_identifier', 'home')->first();
        $this->assertNotNull($seo);
        $this->assertStringNotContainsString('<script>', $seo->meta_description);
        $this->assertStringNotContainsString('<b>', $seo->meta_description);
        $this->assertStringContainsString('description', $seo->meta_description);
    }

    // -------------------------------------------------------------------------
    // Update - Keywords Processing
    // -------------------------------------------------------------------------

    public function test_update_splits_and_trims_keywords(): void
    {
        $data = $this->validSeoData([
            'meta_keywords' => '  health , clinic , <b>medical</b> , wellness  ',
        ]);

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $seo = SeoSetting::where('page_identifier', 'home')->first();
        $this->assertNotNull($seo);
        $this->assertIsArray($seo->meta_keywords);
        $this->assertContains('health', $seo->meta_keywords);
        $this->assertContains('clinic', $seo->meta_keywords);
        $this->assertContains('medical', $seo->meta_keywords);
        $this->assertContains('wellness', $seo->meta_keywords);
        $this->assertNotContains('<b>medical</b>', $seo->meta_keywords);
    }

    // -------------------------------------------------------------------------
    // Update - OG Image Upload
    // -------------------------------------------------------------------------

    public function test_update_stores_uploaded_og_image(): void
    {
        Storage::fake('public');
        $file = UploadedFile::fake()->image('og-image.jpg', 1200, 630);

        $data = $this->validSeoData();
        $data['og_image'] = $file;

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $response->assertRedirect(route('admin.seo.index'));
        Storage::disk('public')->assertExists('seo/' . $file->hashName());
    }

    public function test_update_rejects_non_image_og_image(): void
    {
        Storage::fake('public');
        $file = UploadedFile::fake()->create('document.pdf', 100);

        $data = $this->validSeoData();
        $data['og_image'] = $file;

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $response->assertSessionHasErrors('og_image');
    }

    public function test_update_rejects_og_image_exceeding_2mb(): void
    {
        Storage::fake('public');
        $file = UploadedFile::fake()->image('large.jpg')->size(3000);

        $data = $this->validSeoData();
        $data['og_image'] = $file;

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $response->assertSessionHasErrors('og_image');
    }

    // -------------------------------------------------------------------------
    // Sitemap Regeneration
    // -------------------------------------------------------------------------

    public function test_regenerate_sitemap_creates_file_and_redirects(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/seo/sitemap/regenerate');

        $response->assertRedirect(route('admin.seo.index'));
        $response->assertSessionHas('success');
        $this->assertFileExists(public_path('sitemap.xml'));

        $sitemapContent = file_get_contents(public_path('sitemap.xml'));
        $this->assertStringContainsString('<?xml version="1.0"', $sitemapContent);
        $this->assertStringContainsString('<urlset', $sitemapContent);

        // Cleanup
        @unlink(public_path('sitemap.xml'));
    }

    // -------------------------------------------------------------------------
    // OWASP Security
    // -------------------------------------------------------------------------

    public function test_xss_in_meta_title_is_stripped(): void
    {
        $data = $this->validSeoData([
            'meta_title' => '<img src=x onerror=alert(1)>Page',
        ]);

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $seo = SeoSetting::where('page_identifier', 'home')->first();
        $this->assertNotNull($seo);
        $this->assertStringNotContainsString('<img', $seo->meta_title);
        $this->assertStringNotContainsString('onerror', $seo->meta_title);
    }

    public function test_xss_in_meta_description_is_stripped(): void
    {
        $data = $this->validSeoData([
            'meta_description' => '<svg onload=alert("xss")>Desc',
        ]);

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $seo = SeoSetting::where('page_identifier', 'home')->first();
        $this->assertNotNull($seo);
        $this->assertStringNotContainsString('<svg', $seo->meta_description);
    }

    public function test_sql_injection_in_structured_data_is_handled(): void
    {
        $data = $this->validSeoData([
            'structured_data' => "'; DROP TABLE seo_settings; --",
        ]);

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        // Invalid JSON should be rejected
        $response->assertSessionHasErrors('structured_data');
        $this->assertTrue(
            \Illuminate\Support\Facades\Schema::hasTable('seo_settings'),
            'The seo_settings table must still exist.'
        );
    }

    public function test_script_tag_in_canonical_url_is_rejected(): void
    {
        $data = $this->validSeoData([
            'canonical_url' => 'javascript:alert("xss")',
        ]);

        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', $data);

        $response->assertSessionHasErrors('canonical_url');
    }

    public function test_path_traversal_in_page_identifier_is_rejected(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/seo/../../etc/passwd/edit');

        // The route constraint [a-z]+ prevents non-alpha characters, returning 404
        $response->assertStatus(404);
    }

    public function test_page_identifier_with_special_characters_returns_404(): void
    {
        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home%00admin', $this->validSeoData());

        $response->assertStatus(404);
    }
}
