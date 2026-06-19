<?php

namespace Tests\Feature\Admin;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $editor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $this->editor = User::factory()->create(['role' => 'editor', 'is_active' => true]);
    }

    private function valid(array $o = []): array
    {
        return array_merge([
            'title' => 'My First Post',
            'excerpt' => 'A short summary.',
            'body' => '<p>Hello world</p>',
            'author' => 'GC',
            'status' => 'published',
            'meta_keywords' => 'switchgear, mcb, panel',
            'noindex' => false,
        ], $o);
    }

    // Admin authorization ---------------------------------------------------

    public function test_unauthenticated_redirected(): void
    {
        $this->get('/admin/blog')->assertRedirect('/admin/login');
    }

    public function test_admin_can_access_index(): void
    {
        $this->actingAs($this->admin)->get('/admin/blog')->assertStatus(200);
    }

    public function test_editor_cannot_access_index(): void
    {
        $this->actingAs($this->editor)->get('/admin/blog')->assertStatus(403);
    }

    public function test_editor_cannot_store(): void
    {
        $this->actingAs($this->editor)->post('/admin/blog', $this->valid())->assertStatus(403);
    }

    // Store -----------------------------------------------------------------

    public function test_store_creates_post_with_slug_and_keywords(): void
    {
        $this->actingAs($this->admin)->post('/admin/blog', $this->valid())->assertRedirect(route('admin.blog.index'));

        $post = Post::first();
        $this->assertNotNull($post);
        $this->assertEquals('my-first-post', $post->slug);
        $this->assertEquals(['switchgear', 'mcb', 'panel'], $post->meta_keywords);
        $this->assertNotNull($post->published_at);
    }

    public function test_store_generates_unique_slug(): void
    {
        $this->actingAs($this->admin)->post('/admin/blog', $this->valid());
        $this->actingAs($this->admin)->post('/admin/blog', $this->valid());

        $this->assertEquals(2, Post::distinct('slug')->count('slug'));
    }

    public function test_store_requires_title(): void
    {
        $this->actingAs($this->admin)->post('/admin/blog', $this->valid(['title' => '']))->assertSessionHasErrors('title');
    }

    public function test_update_and_destroy(): void
    {
        $this->actingAs($this->admin)->post('/admin/blog', $this->valid());
        $post = Post::first();

        $this->actingAs($this->admin)->post("/admin/blog/{$post->id}", $this->valid(['title' => 'Renamed']))->assertRedirect();
        $this->assertEquals('Renamed', $post->fresh()->title);

        $this->actingAs($this->admin)->delete("/admin/blog/{$post->id}")->assertRedirect();
        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }

    // Public ----------------------------------------------------------------

    public function test_public_blog_index_loads(): void
    {
        $this->get('/blog')->assertStatus(200);
    }

    public function test_public_shows_published_hides_draft(): void
    {
        Post::create(['title' => 'Live Post', 'slug' => 'live-post', 'status' => 'published', 'published_at' => now()]);
        Post::create(['title' => 'Hidden Draft', 'slug' => 'hidden-draft', 'status' => 'draft']);

        $response = $this->get('/blog');
        $response->assertSee('Live Post');
        $response->assertDontSee('Hidden Draft');
    }

    public function test_public_post_loads_when_published(): void
    {
        Post::create(['title' => 'Live Post', 'slug' => 'live-post', 'body' => '<p>Body here</p>', 'status' => 'published', 'published_at' => now()]);

        $this->get('/blog/live-post')->assertStatus(200)->assertSee('Body here', false);
    }

    public function test_public_post_404_for_draft(): void
    {
        Post::create(['title' => 'Draft', 'slug' => 'draft-post', 'status' => 'draft']);

        $this->get('/blog/draft-post')->assertStatus(404);
    }
}
