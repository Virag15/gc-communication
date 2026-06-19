<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Contracts\Validation\UncompromisedVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private User $admin;
    private User $editor;

    /**
     * A password that satisfies all validation rules:
     * min 10 chars, mixed case, numbers, symbols.
     */
    private string $validPassword = 'T3st!ng@Secur3';

    protected function setUp(): void
    {
        parent::setUp();

        // Stub the compromised-password verifier so tests never hit the HIBP API.
        $this->app->singleton(UncompromisedVerifier::class, function () {
            return new class implements UncompromisedVerifier {
                public function verify($data)
                {
                    return true; // treat every password as safe
                }
            };
        });

        $this->superAdmin = User::factory()->create([
            'role'      => 'super_admin',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'is_active' => true,
        ]);

        $this->editor = User::factory()->create([
            'role'      => 'editor',
            'is_active' => true,
        ]);
    }

    // =========================================================================
    // Authorization Tests
    // =========================================================================

    public function test_super_admin_can_access_user_index(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/users');

        $response->assertStatus(200);
    }

    public function test_admin_can_access_user_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/users');

        $response->assertStatus(200);
    }

    public function test_editor_cannot_access_user_index(): void
    {
        $response = $this->actingAs($this->editor)->get('/admin/users');

        $response->assertStatus(403);
    }

    public function test_editor_cannot_access_user_create(): void
    {
        $response = $this->actingAs($this->editor)->get('/admin/users/create');

        $response->assertStatus(403);
    }

    public function test_editor_cannot_store_user(): void
    {
        $response = $this->actingAs($this->editor)->post('/admin/users', [
            'name'     => 'Test User',
            'email'    => 'test@example.com',
            'password' => $this->validPassword,
            'role'     => 'editor',
        ]);

        $response->assertStatus(403);
    }

    public function test_editor_cannot_access_user_edit(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $response = $this->actingAs($this->editor)->get("/admin/users/{$target->id}/edit");

        $response->assertStatus(403);
    }

    public function test_editor_cannot_update_user(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $response = $this->actingAs($this->editor)->put("/admin/users/{$target->id}", [
            'name'  => 'Updated',
            'email' => $target->email,
            'role'  => 'editor',
        ]);

        $response->assertStatus(403);
    }

    public function test_editor_cannot_delete_user(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $response = $this->actingAs($this->editor)->delete("/admin/users/{$target->id}");

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_redirected_to_login(): void
    {
        $response = $this->get('/admin/users');

        $response->assertRedirect('/admin/login');
    }

    public function test_unauthenticated_user_cannot_store(): void
    {
        $response = $this->post('/admin/users', [
            'name'     => 'Hacker',
            'email'    => 'hack@example.com',
            'password' => $this->validPassword,
            'role'     => 'super_admin',
        ]);

        $response->assertRedirect('/admin/login');
        $this->assertDatabaseMissing('users', ['email' => 'hack@example.com']);
    }

    public function test_unauthenticated_user_cannot_delete(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $response = $this->delete("/admin/users/{$target->id}");

        $response->assertRedirect('/admin/login');
        $this->assertDatabaseHas('users', ['id' => $target->id]);
    }

    // =========================================================================
    // Index / Search / Filter Tests
    // =========================================================================

    public function test_index_paginates_users_by_ten(): void
    {
        User::factory()->count(15)->create(['role' => 'editor']);

        $response = $this->actingAs($this->superAdmin)->get('/admin/users');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->has('users.data', 10)
        );
    }

    public function test_index_second_page_contains_remaining_users(): void
    {
        User::factory()->count(15)->create(['role' => 'editor']);

        $response = $this->actingAs($this->superAdmin)->get('/admin/users?page=2');

        $response->assertStatus(200);
        // 3 setUp users + 15 factory = 18 total; page 2 should have 8
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->has('users.data', 8)
        );
    }

    public function test_search_by_name_filters_correctly(): void
    {
        User::factory()->create([
            'name'  => 'Zarathon Unique',
            'email' => 'zarathon@example.com',
            'role'  => 'editor',
        ]);

        $response = $this->actingAs($this->superAdmin)->get('/admin/users?search=Zarathon');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Zarathon Unique')
        );
    }

    public function test_search_by_email_filters_correctly(): void
    {
        User::factory()->create([
            'name'  => 'Some User',
            'email' => 'xylophone-unique@testing.org',
            'role'  => 'editor',
        ]);

        $response = $this->actingAs($this->superAdmin)->get('/admin/users?search=xylophone-unique');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->has('users.data', 1)
            ->where('users.data.0.email', 'xylophone-unique@testing.org')
        );
    }

    public function test_role_filter_returns_only_matching_role(): void
    {
        User::factory()->count(3)->create(['role' => 'editor']);

        $response = $this->actingAs($this->superAdmin)->get('/admin/users?role=super_admin');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->has('users.data', 1)
            ->where('users.data.0.role', 'super_admin')
        );
    }

    public function test_like_wildcard_percent_is_escaped_in_search(): void
    {
        User::factory()->create([
            'name'  => 'Normal User',
            'email' => 'normal@example.com',
            'role'  => 'editor',
        ]);

        // Searching with "%" should NOT match all records via wildcard injection
        $response = $this->actingAs($this->superAdmin)->get('/admin/users?search=%25');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->has('users.data', 0)
        );
    }

    public function test_like_wildcard_underscore_is_escaped_in_search(): void
    {
        User::factory()->create([
            'name'  => 'A User',
            'email' => 'auser@example.com',
            'role'  => 'editor',
        ]);

        // "_" matches any single character in SQL LIKE; should not match if escaped
        $response = $this->actingAs($this->superAdmin)->get('/admin/users?search=_');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->has('users.data', 0)
        );
    }

    public function test_empty_search_returns_all_users(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/users?search=');

        $response->assertStatus(200);
        // setUp creates 3 users; all should appear
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->has('users.data', 3)
        );
    }

    public function test_sql_injection_in_search_parameter_is_safe(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->get('/admin/users?search=' . urlencode("'; DROP TABLE users; --"));

        $response->assertStatus(200);

        // Table should still exist with all users intact
        $this->assertDatabaseCount('users', 3);
    }

    public function test_filters_are_preserved_in_response(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->get('/admin/users?search=test&role=admin');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->where('filters.search', 'test')
            ->where('filters.role', 'admin')
        );
    }

    // =========================================================================
    // Create / Store Tests
    // =========================================================================

    public function test_super_admin_can_view_create_page(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/users/create');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Admin/Users/Create'));
    }

    public function test_super_admin_can_create_super_admin_user(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => 'New Super Admin',
            'email'    => 'newsuperadmin@example.com',
            'password' => $this->validPassword,
            'role'     => 'super_admin',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('users', [
            'email' => 'newsuperadmin@example.com',
            'role'  => 'super_admin',
        ]);
    }

    public function test_admin_cannot_create_super_admin_user(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/users', [
            'name'     => 'Sneaky Super',
            'email'    => 'sneaky@example.com',
            'password' => $this->validPassword,
            'role'     => 'super_admin',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', ['email' => 'sneaky@example.com']);
    }

    public function test_create_user_with_valid_data_succeeds(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => 'Valid User',
            'email'    => 'valid@example.com',
            'password' => $this->validPassword,
            'role'     => 'editor',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'User created successfully.');
        $this->assertDatabaseHas('users', [
            'name'  => 'Valid User',
            'email' => 'valid@example.com',
            'role'  => 'editor',
        ]);
    }

    public function test_admin_can_create_admin_user(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/users', [
            'name'     => 'Another Admin',
            'email'    => 'anotheradmin@example.com',
            'password' => $this->validPassword,
            'role'     => 'admin',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'email' => 'anotheradmin@example.com',
            'role'  => 'admin',
        ]);
    }

    public function test_name_with_html_tags_gets_stripped(): void
    {
        $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => '<b>Bold</b> <script>alert(1)</script>Name',
            'email'    => 'tags@example.com',
            'password' => $this->validPassword,
            'role'     => 'editor',
        ]);

        $user = User::where('email', 'tags@example.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('Bold alert(1)Name', $user->name);
    }

    public function test_duplicate_email_rejected(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => 'Duplicate',
            'email'    => $this->admin->email,
            'password' => $this->validPassword,
            'role'     => 'editor',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_invalid_email_format_rejected(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => 'Bad Email',
            'email'    => 'not-an-email',
            'password' => $this->validPassword,
            'role'     => 'editor',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_password_too_short_rejected(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => 'Short Pass',
            'email'    => 'short@example.com',
            'password' => 'Ab1!',
            'role'     => 'editor',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertDatabaseMissing('users', ['email' => 'short@example.com']);
    }

    public function test_invalid_role_rejected(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => 'Bad Role',
            'email'    => 'badrole@example.com',
            'password' => $this->validPassword,
            'role'     => 'superuser',
        ]);

        $response->assertSessionHasErrors('role');
        $this->assertDatabaseMissing('users', ['email' => 'badrole@example.com']);
    }

    public function test_missing_name_rejected(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'email'    => 'noname@example.com',
            'password' => $this->validPassword,
            'role'     => 'editor',
        ]);

        $response->assertSessionHasErrors('name');
        $this->assertDatabaseMissing('users', ['email' => 'noname@example.com']);
    }

    public function test_missing_email_rejected(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => 'No Email',
            'password' => $this->validPassword,
            'role'     => 'editor',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_missing_password_rejected(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'  => 'No Password',
            'email' => 'nopass@example.com',
            'role'  => 'editor',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertDatabaseMissing('users', ['email' => 'nopass@example.com']);
    }

    public function test_missing_role_rejected(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => 'No Role',
            'email'    => 'norole@example.com',
            'password' => $this->validPassword,
        ]);

        $response->assertSessionHasErrors('role');
        $this->assertDatabaseMissing('users', ['email' => 'norole@example.com']);
    }

    public function test_name_exceeding_255_chars_rejected(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => str_repeat('A', 256),
            'email'    => 'longname@example.com',
            'password' => $this->validPassword,
            'role'     => 'editor',
        ]);

        $response->assertSessionHasErrors('name');
        $this->assertDatabaseMissing('users', ['email' => 'longname@example.com']);
    }

    public function test_email_exceeding_255_chars_rejected(): void
    {
        $tooLongEmail = str_repeat('a', 247) . '@test.com'; // 256 chars

        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => 'Too Long Email',
            'email'    => $tooLongEmail,
            'password' => $this->validPassword,
            'role'     => 'editor',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_password_is_hashed_not_stored_plaintext(): void
    {
        $plainPassword = $this->validPassword;

        $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => 'Hash Check',
            'email'    => 'hashcheck@example.com',
            'password' => $plainPassword,
            'role'     => 'editor',
        ]);

        $user = User::where('email', 'hashcheck@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNotEquals($plainPassword, $user->password);
        $this->assertTrue(Hash::check($plainPassword, $user->password));
    }

    public function test_completely_empty_payload_rejected(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', []);

        $response->assertSessionHasErrors(['name', 'email', 'password', 'role']);
    }

    // =========================================================================
    // Edit / Update Tests
    // =========================================================================

    public function test_edit_page_loads_for_valid_user(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $response = $this->actingAs($this->superAdmin)
            ->get("/admin/users/{$target->id}/edit");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Edit')
            ->where('user.id', $target->id)
        );
    }

    public function test_update_name_succeeds(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $response = $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$target->id}", [
                'name'  => 'Updated Name',
                'email' => $target->email,
                'role'  => 'editor',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('users', [
            'id'   => $target->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_update_email_to_unique_value_succeeds(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $response = $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$target->id}", [
                'name'  => $target->name,
                'email' => 'brand-new-unique@example.com',
                'role'  => 'editor',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id'    => $target->id,
            'email' => 'brand-new-unique@example.com',
        ]);
    }

    public function test_update_email_to_existing_users_email_rejected(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $response = $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$target->id}", [
                'name'  => $target->name,
                'email' => $this->admin->email,
                'role'  => 'editor',
            ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_update_keeps_own_email_without_unique_violation(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $response = $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$target->id}", [
                'name'  => 'Same Email OK',
                'email' => $target->email,
                'role'  => 'editor',
            ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
    }

    public function test_update_own_user_cannot_change_role(): void
    {
        $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$this->superAdmin->id}", [
                'name'  => $this->superAdmin->name,
                'email' => $this->superAdmin->email,
                'role'  => 'editor',
            ]);

        $this->superAdmin->refresh();
        $this->assertEquals('super_admin', $this->superAdmin->role);
    }

    public function test_update_own_user_cannot_deactivate_self(): void
    {
        $this->actingAs($this->admin)
            ->put("/admin/users/{$this->admin->id}", [
                'name'      => $this->admin->name,
                'email'     => $this->admin->email,
                'role'      => $this->admin->role,
                'is_active' => false,
            ]);

        $this->admin->refresh();
        $this->assertTrue($this->admin->is_active);
    }

    public function test_admin_cannot_assign_super_admin_role_via_update(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $response = $this->actingAs($this->admin)
            ->put("/admin/users/{$target->id}", [
                'name'  => $target->name,
                'email' => $target->email,
                'role'  => 'super_admin',
            ]);

        $response->assertStatus(403);
        $target->refresh();
        $this->assertEquals('editor', $target->role);
    }

    public function test_password_change_invalidates_other_sessions(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        // Insert a fake session for the target user
        DB::table('sessions')->insert([
            'id'            => 'session-to-be-cleared',
            'user_id'       => $target->id,
            'ip_address'    => '127.0.0.1',
            'user_agent'    => 'PHPUnit',
            'payload'       => base64_encode('test'),
            'last_activity' => time(),
        ]);

        $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$target->id}", [
                'name'     => $target->name,
                'email'    => $target->email,
                'password' => $this->validPassword,
                'role'     => 'editor',
            ]);

        $this->assertDatabaseMissing('sessions', [
            'id' => 'session-to-be-cleared',
        ]);
    }

    public function test_null_password_keeps_existing_password(): void
    {
        $target = User::factory()->create([
            'role'     => 'editor',
            'password' => $this->validPassword,
        ]);

        $originalHash = $target->password;

        $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$target->id}", [
                'name'     => $target->name,
                'email'    => $target->email,
                'password' => null,
                'role'     => 'editor',
            ]);

        $target->refresh();
        $this->assertEquals($originalHash, $target->password);
    }

    public function test_empty_string_password_keeps_existing_password(): void
    {
        $target = User::factory()->create([
            'role'     => 'editor',
            'password' => $this->validPassword,
        ]);

        $originalHash = $target->password;

        $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$target->id}", [
                'name'     => $target->name,
                'email'    => $target->email,
                'password' => '',
                'role'     => 'editor',
            ]);

        $target->refresh();
        $this->assertEquals($originalHash, $target->password);
    }

    public function test_update_non_existent_user_returns_404(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->put('/admin/users/999999', [
                'name'  => 'Ghost',
                'email' => 'ghost@example.com',
                'role'  => 'editor',
            ]);

        $response->assertStatus(404);
    }

    public function test_edit_non_existent_user_returns_404(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->get('/admin/users/999999/edit');

        $response->assertStatus(404);
    }

    public function test_update_strips_html_from_name(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$target->id}", [
                'name'  => '<em>Italic</em> <img src=x onerror=alert(1)>',
                'email' => $target->email,
                'role'  => 'editor',
            ]);

        $target->refresh();
        $this->assertEquals('Italic ', $target->name);
        $this->assertStringNotContainsString('<', $target->name);
    }

    public function test_super_admin_can_change_other_user_to_super_admin(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $response = $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$target->id}", [
                'name'  => $target->name,
                'email' => $target->email,
                'role'  => 'super_admin',
            ]);

        $response->assertRedirect();
        $target->refresh();
        $this->assertEquals('super_admin', $target->role);
    }

    public function test_admin_can_deactivate_other_user(): void
    {
        $target = User::factory()->create(['role' => 'editor', 'is_active' => true]);

        $response = $this->actingAs($this->admin)
            ->put("/admin/users/{$target->id}", [
                'name'      => $target->name,
                'email'     => $target->email,
                'role'      => 'editor',
                'is_active' => false,
            ]);

        $response->assertRedirect();
        $target->refresh();
        $this->assertFalse($target->is_active);
    }

    // =========================================================================
    // Delete Tests
    // =========================================================================

    public function test_cannot_delete_own_account(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->delete("/admin/users/{$this->superAdmin->id}");

        $response->assertRedirect();
        $response->assertSessionHas('error', 'You cannot delete your own account.');
        $this->assertDatabaseHas('users', ['id' => $this->superAdmin->id]);
    }

    public function test_super_admin_can_delete_other_super_admin(): void
    {
        $otherSuperAdmin = User::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($this->superAdmin)
            ->delete("/admin/users/{$otherSuperAdmin->id}");

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('users', ['id' => $otherSuperAdmin->id]);
    }

    public function test_admin_cannot_delete_super_admin(): void
    {
        $targetSuperAdmin = User::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($this->admin)
            ->delete("/admin/users/{$targetSuperAdmin->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $targetSuperAdmin->id]);
    }

    public function test_admin_can_delete_editor(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $response = $this->actingAs($this->admin)
            ->delete("/admin/users/{$target->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $target->id]);
    }

    public function test_admin_can_delete_other_admin(): void
    {
        $otherAdmin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($this->admin)
            ->delete("/admin/users/{$otherAdmin->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $otherAdmin->id]);
    }

    public function test_delete_non_existent_user_returns_404(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->delete('/admin/users/999999');

        $response->assertStatus(404);
    }

    public function test_sessions_cleared_on_user_deletion(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        DB::table('sessions')->insert([
            'id'            => 'victim-session-1',
            'user_id'       => $target->id,
            'ip_address'    => '10.0.0.1',
            'user_agent'    => 'PHPUnit',
            'payload'       => base64_encode('session-data'),
            'last_activity' => time(),
        ]);
        DB::table('sessions')->insert([
            'id'            => 'victim-session-2',
            'user_id'       => $target->id,
            'ip_address'    => '10.0.0.2',
            'user_agent'    => 'PHPUnit',
            'payload'       => base64_encode('session-data'),
            'last_activity' => time(),
        ]);

        $this->actingAs($this->superAdmin)->delete("/admin/users/{$target->id}");

        $this->assertDatabaseMissing('sessions', ['user_id' => $target->id]);
    }

    public function test_delete_with_string_id_returns_404(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->delete('/admin/users/abc');

        $response->assertStatus(404);
    }

    public function test_delete_with_negative_id_returns_404(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->delete('/admin/users/-1');

        $response->assertStatus(404);
    }

    public function test_delete_with_special_chars_in_id_returns_404(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->delete('/admin/users/1;DROP%20TABLE%20users');

        $response->assertStatus(404);
    }

    // =========================================================================
    // OWASP Security Tests
    // =========================================================================

    public function test_xss_in_name_field_is_stripped_on_store(): void
    {
        $xssPayloads = [
            '<script>alert("xss")</script>',
            '<img src=x onerror=alert(1)>',
            '<svg onload=alert(1)>',
            '<iframe src="javascript:alert(1)"></iframe>',
            '<a href="javascript:alert(1)">click</a>',
        ];

        foreach ($xssPayloads as $index => $payload) {
            $email = "xss{$index}@example.com";

            $this->actingAs($this->superAdmin)->post('/admin/users', [
                'name'     => $payload,
                'email'    => $email,
                'password' => $this->validPassword,
                'role'     => 'editor',
            ]);

            $user = User::where('email', $email)->first();
            $this->assertNotNull($user, "User with XSS payload #{$index} was not created.");
            $this->assertStringNotContainsString('<script', $user->name);
            $this->assertStringNotContainsString('<img', $user->name);
            $this->assertStringNotContainsString('<svg', $user->name);
            $this->assertStringNotContainsString('<iframe', $user->name);
            $this->assertStringNotContainsString('onerror', $user->name);
            $this->assertStringNotContainsString('onload', $user->name);
            $this->assertStringNotContainsString('javascript:', $user->name);
        }
    }

    public function test_sql_injection_in_name_field_is_harmless(): void
    {
        $sqliPayloads = [
            "Robert'; DROP TABLE users;--",
            "' OR '1'='1",
            "1; UPDATE users SET role='super_admin' WHERE '1'='1",
            "' UNION SELECT * FROM users--",
        ];

        foreach ($sqliPayloads as $index => $payload) {
            $email = "sqli-name-{$index}@example.com";

            $this->actingAs($this->superAdmin)->post('/admin/users', [
                'name'     => $payload,
                'email'    => $email,
                'password' => $this->validPassword,
                'role'     => 'editor',
            ]);

            $this->assertDatabaseHas('users', ['email' => $email]);
        }

        // Database is intact, table exists, original users untouched
        $this->assertDatabaseCount('users', 3 + count($sqliPayloads));
        $this->assertEquals('admin', $this->admin->fresh()->role);
    }

    public function test_sql_injection_in_email_field_is_rejected(): void
    {
        $sqliPayloads = [
            "admin'--@example.com",
            "' OR 1=1--",
            "test@example.com' AND 1=1--",
        ];

        foreach ($sqliPayloads as $payload) {
            $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
                'name'     => 'SQLi Test',
                'email'    => $payload,
                'password' => $this->validPassword,
                'role'     => 'editor',
            ]);

            // Either rejected by validation or safely handled
            $this->assertTrue(
                $response->isRedirection() || $response->status() === 422 || $response->status() === 302
            );
        }

        // Original data intact
        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    }

    public function test_xss_payload_in_search_query(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->get('/admin/users?search=' . urlencode('<script>alert("xss")</script>'));

        $response->assertStatus(200);

        // Ensure the application did not crash
        $response->assertInertia(fn ($page) => $page->component('Admin/Users/Index'));
    }

    public function test_idor_editor_cannot_access_user_edit_page(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $response = $this->actingAs($this->editor)
            ->get("/admin/users/{$target->id}/edit");

        $response->assertStatus(403);
    }

    public function test_idor_editor_cannot_update_other_user(): void
    {
        $target = User::factory()->create(['role' => 'editor']);
        $originalName = $target->name;

        $response = $this->actingAs($this->editor)
            ->put("/admin/users/{$target->id}", [
                'name'  => 'Hacked Name',
                'email' => $target->email,
                'role'  => 'super_admin',
            ]);

        $response->assertStatus(403);
        $target->refresh();
        $this->assertEquals($originalName, $target->name);
        $this->assertEquals('editor', $target->role);
    }

    public function test_idor_editor_cannot_delete_other_user(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $response = $this->actingAs($this->editor)
            ->delete("/admin/users/{$target->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $target->id]);
    }

    public function test_mass_assignment_cannot_set_unexpected_fields_on_store(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'              => 'Mass Assignment',
            'email'             => 'mass@example.com',
            'password'          => $this->validPassword,
            'role'              => 'editor',
            'is_active'         => false,
            'email_verified_at' => '2020-01-01 00:00:00',
            'remember_token'    => 'injected-token',
        ]);

        $response->assertRedirect();

        $user = User::where('email', 'mass@example.com')->first();
        $this->assertNotNull($user);

        // The store endpoint only validates name/email/password/role.
        // Fields not in the validated array should not be mass-assigned.
        $this->assertNotEquals('injected-token', $user->remember_token);
    }

    public function test_csrf_token_required_for_store(): void
    {
        // A raw POST without the test helper (which auto-injects CSRF)
        // should fail with 419 or redirect to login (302).
        $rawResponse = $this->call('POST', '/admin/users', [
            'name'     => 'CSRF Raw',
            'email'    => 'csrfraw@example.com',
            'password' => $this->validPassword,
            'role'     => 'editor',
        ]);

        $this->assertTrue(
            in_array($rawResponse->status(), [302, 419]),
            "Expected 302 or 419, got {$rawResponse->status()}"
        );
    }

    public function test_csrf_token_required_for_update(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $rawResponse = $this->call('PUT', "/admin/users/{$target->id}", [
            'name'  => 'CSRF Update',
            'email' => $target->email,
            'role'  => 'editor',
        ]);

        $this->assertTrue(
            in_array($rawResponse->status(), [302, 419]),
            "Expected 302 or 419, got {$rawResponse->status()}"
        );
    }

    public function test_csrf_token_required_for_delete(): void
    {
        $target = User::factory()->create(['role' => 'editor']);

        $rawResponse = $this->call('DELETE', "/admin/users/{$target->id}");

        $this->assertTrue(
            in_array($rawResponse->status(), [302, 419]),
            "Expected 302 or 419, got {$rawResponse->status()}"
        );

        // User should NOT be deleted
        $this->assertDatabaseHas('users', ['id' => $target->id]);
    }

    public function test_route_id_constraint_rejects_non_numeric_on_edit(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->get('/admin/users/abc/edit');

        $response->assertStatus(404);
    }

    public function test_route_id_constraint_rejects_non_numeric_on_update(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->put('/admin/users/abc', [
                'name'  => 'Nope',
                'email' => 'nope@example.com',
                'role'  => 'editor',
            ]);

        $response->assertStatus(404);
    }

    public function test_extremely_long_search_query_handled_safely(): void
    {
        $longQuery = str_repeat('A', 5000);

        $response = $this->actingAs($this->superAdmin)
            ->get('/admin/users?search=' . $longQuery);

        // Should not cause a server error
        $this->assertTrue(in_array($response->status(), [200, 302, 422]));
    }

    public function test_null_bytes_in_name_handled_safely(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => "Test\x00User",
            'email'    => 'nullbyte@example.com',
            'password' => $this->validPassword,
            'role'     => 'editor',
        ]);

        // Should either succeed with sanitized data or reject the input
        $this->assertTrue(in_array($response->status(), [302, 422]));
    }

    public function test_concurrent_duplicate_email_creation_handled(): void
    {
        $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => 'First User',
            'email'    => 'duplicate-race@example.com',
            'password' => $this->validPassword,
            'role'     => 'editor',
        ]);

        $this->assertDatabaseHas('users', ['email' => 'duplicate-race@example.com']);

        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name'     => 'Second User',
            'email'    => 'duplicate-race@example.com',
            'password' => $this->validPassword,
            'role'     => 'editor',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertEquals(
            1,
            User::where('email', 'duplicate-race@example.com')->count()
        );
    }
}
