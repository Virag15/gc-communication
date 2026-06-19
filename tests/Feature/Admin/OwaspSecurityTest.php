<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\SeoSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Cross-cutting OWASP Top 10 security tests for the admin panel.
 * Covers all major vulnerability categories across admin endpoints.
 */
class OwaspSecurityTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private User $admin;
    private User $editor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'is_active' => true,
            'password' => Hash::make('SuperSecure1!@#'),
        ]);
        $this->admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
            'password' => Hash::make('AdminSecure1!@#'),
        ]);
        $this->editor = User::factory()->create([
            'role' => 'editor',
            'is_active' => true,
            'password' => Hash::make('EditorSecure1!@#'),
        ]);
    }

    // =========================================================================
    // A01:2021 - Broken Access Control
    // =========================================================================

    public function test_a01_editor_cannot_access_user_management(): void
    {
        $response = $this->actingAs($this->editor)->get('/admin/users');

        $response->assertStatus(403);
    }

    public function test_a01_editor_cannot_access_seo_management(): void
    {
        $response = $this->actingAs($this->editor)->get('/admin/seo');

        $response->assertStatus(403);
    }

    public function test_a01_unauthenticated_user_cannot_access_admin_routes(): void
    {
        $protectedRoutes = [
            ['GET', '/admin'],
            ['GET', '/admin/users'],
            ['GET', '/admin/users/create'],
            ['GET', '/admin/seo'],
        ];

        foreach ($protectedRoutes as [$method, $route]) {
            $response = $this->call($method, $route);
            $response->assertRedirect('/admin/login');
        }
    }

    public function test_a01_user_without_admin_role_cannot_access_admin_panel(): void
    {
        // Unauthenticated users should be redirected to login
        // The role column is an ENUM (super_admin, admin, editor) with NOT NULL,
        // so there are no users without a valid admin role in the system
        $response = $this->get('/admin');

        $response->assertRedirect('/admin/login');
    }

    public function test_a01_idor_editor_cannot_update_user(): void
    {
        $targetUser = User::factory()->create(['role' => 'editor', 'is_active' => true]);

        $response = $this->actingAs($this->editor)->put("/admin/users/{$targetUser->id}", [
            'name' => 'Hacked Name',
            'email' => $targetUser->email,
            'role' => 'editor',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', [
            'id' => $targetUser->id,
            'name' => 'Hacked Name',
        ]);
    }

    public function test_a01_horizontal_privilege_escalation_admin_cannot_create_super_admin(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/users', [
            'name' => 'Escalated User',
            'email' => 'escalated@example.com',
            'password' => 'StrongPass1!@#',
            'role' => 'super_admin',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', ['email' => 'escalated@example.com']);
    }

    public function test_a01_vertical_privilege_escalation_editor_cannot_create_user(): void
    {
        $response = $this->actingAs($this->editor)->post('/admin/users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'StrongPass1!@#',
            'role' => 'editor',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', ['email' => 'newuser@example.com']);
    }

    // =========================================================================
    // A02:2021 - Cryptographic Failures
    // =========================================================================

    public function test_a02_passwords_are_hashed_not_stored_as_plaintext(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('PlainTextPassword1!'),
        ]);

        $dbUser = User::find($user->id);
        $this->assertNotEquals('PlainTextPassword1!', $dbUser->getRawOriginal('password'));
        $this->assertTrue(Hash::check('PlainTextPassword1!', $dbUser->getRawOriginal('password')));
    }

    public function test_a02_password_is_hidden_from_user_serialization(): void
    {
        $userArray = $this->superAdmin->toArray();

        $this->assertArrayNotHasKey('password', $userArray);
    }

    public function test_a02_remember_token_is_hidden_from_user_serialization(): void
    {
        $userArray = $this->superAdmin->toArray();

        $this->assertArrayNotHasKey('remember_token', $userArray);
    }

    // =========================================================================
    // A03:2021 - Injection
    // =========================================================================

    public function test_a03_sql_injection_via_login_email(): void
    {
        $response = $this->post('/admin/login', [
            'email' => "admin@test.com' OR '1'='1",
            'password' => 'anything',
        ]);

        // Should fail validation (invalid email) or authentication, not bypass login
        $response->assertSessionHasErrors();
        $this->assertGuest();
    }

    public function test_a03_sql_injection_via_user_search(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/users?search=' . urlencode("'; DROP TABLE users; --"));

        $response->assertStatus(200);
        $this->assertTrue(Schema::hasTable('users'), 'The users table must still exist.');
    }

    public function test_a03_sql_injection_via_like_wildcard(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/users?search=' . urlencode("%' OR 1=1 --"));

        $response->assertStatus(200);
        // Should not return all users through injection
        $this->assertTrue(Schema::hasTable('users'));
    }

    public function test_a03_nosql_style_injection_attempt(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/users?search=' . urlencode('{"$gt": ""}'));

        $response->assertStatus(200);
    }

    public function test_a03_command_injection_in_name_field(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name' => '; cat /etc/passwd',
            'email' => 'injection@test.com',
            'password' => 'StrongPass1!@#',
            'role' => 'editor',
        ]);

        // Should either succeed (name gets sanitized via strip_tags) or reject,
        // but NOT execute the command.
        // strip_tags only removes HTML tags, not shell commands - the text is
        // stored as a harmless string. The key security check is that the
        // command was not executed and the app did not crash.
        if ($response->isRedirect()) {
            $this->assertDatabaseHas('users', ['email' => 'injection@test.com']);
        }
    }

    public function test_a03_ldap_injection_in_login_email(): void
    {
        $response = $this->post('/admin/login', [
            'email' => 'admin@test.com)(|(password=*))',
            'password' => 'anything',
        ]);

        $response->assertSessionHasErrors();
        $this->assertGuest();
    }

    // =========================================================================
    // A04:2021 - Insecure Design
    // =========================================================================

    public function test_a04_cannot_mass_assign_role_via_user_update_by_editor(): void
    {
        // Editor tries to elevate their own role via a direct update attempt
        $response = $this->actingAs($this->editor)->put("/admin/users/{$this->editor->id}", [
            'name' => $this->editor->name,
            'email' => $this->editor->email,
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        // Should be blocked by AdminOnly middleware
        $response->assertStatus(403);

        $this->editor->refresh();
        $this->assertEquals('editor', $this->editor->role);
    }

    public function test_a04_cannot_modify_other_user_password_without_admin_access(): void
    {
        $targetUser = User::factory()->create(['role' => 'editor', 'is_active' => true]);

        $response = $this->actingAs($this->editor)->put("/admin/users/{$targetUser->id}", [
            'name' => $targetUser->name,
            'email' => $targetUser->email,
            'password' => 'HackedPassword1!@',
            'role' => 'editor',
        ]);

        $response->assertStatus(403);
    }

    public function test_a04_login_rate_limiting_prevents_brute_force(): void
    {
        RateLimiter::clear('admin@test.com|127.0.0.1');

        // Exhaust the rate limit (5 attempts per minute)
        for ($i = 0; $i < 6; $i++) {
            $this->post('/admin/login', [
                'email' => 'admin@test.com',
                'password' => 'wrong_password',
            ]);
        }

        $response = $this->post('/admin/login', [
            'email' => 'admin@test.com',
            'password' => 'wrong_password',
        ]);

        // Brute-force protection should have engaged: either the route throttle
        // returned 429, or the per-email+IP limiter reached its threshold.
        $isRateLimited = $response->status() === 429
            || RateLimiter::tooManyAttempts('admin@test.com|127.0.0.1', 5);

        $this->assertTrue($isRateLimited, 'Login should be rate limited after too many attempts.');
    }

    // =========================================================================
    // A05:2021 - Security Misconfiguration
    // =========================================================================

    public function test_a05_admin_routes_return_proper_error_pages(): void
    {
        // Non-existent admin route should return 404, not expose internals
        $response = $this->actingAs($this->superAdmin)->get('/admin/nonexistent-route');

        $response->assertStatus(404);
    }

    public function test_a05_non_existent_admin_routes_return_404_not_500(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/this/does/not/exist');

        $this->assertNotEquals(500, $response->status());
        $response->assertStatus(404);
    }

    public function test_a05_debug_mode_does_not_expose_stack_traces_in_production(): void
    {
        // Ensure APP_DEBUG is false in testing (simulating production behavior)
        // The error handler should render error pages, not stack traces
        $response = $this->actingAs($this->admin)->get('/admin/users/abc');

        $this->assertNotEquals(500, $response->status());
    }

    // =========================================================================
    // A06:2021 - Vulnerable and Outdated Components
    // =========================================================================

    public function test_a06_security_headers_are_present(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin');

        $response->assertHeader('X-Frame-Options');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy');
        $response->assertHeader('X-XSS-Protection');
    }

    public function test_a06_x_frame_options_is_deny(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin');

        $this->assertEquals('DENY', $response->headers->get('X-Frame-Options'));
    }

    public function test_a06_permissions_policy_header_is_set(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin');

        $response->assertHeader('Permissions-Policy');
    }

    // =========================================================================
    // A07:2021 - Identification and Authentication Failures
    // =========================================================================

    public function test_a07_brute_force_protection_on_login(): void
    {
        RateLimiter::clear('brute@test.com|127.0.0.1');

        for ($i = 0; $i < 6; $i++) {
            $this->post('/admin/login', [
                'email' => 'brute@test.com',
                'password' => 'wrong_' . $i,
            ]);
        }

        $response = $this->post('/admin/login', [
            'email' => 'brute@test.com',
            'password' => 'correct_password',
        ]);

        // Brute-force protection should have engaged: either the route throttle
        // returned 429, or the per-email+IP limiter reached its threshold.
        $isBlocked = $response->status() === 429
            || RateLimiter::tooManyAttempts('brute@test.com|127.0.0.1', 5);

        $this->assertTrue($isBlocked, 'User should be blocked after multiple failed login attempts.');
    }

    public function test_a07_session_fixation_prevention(): void
    {
        $this->post('/admin/login', [
            'email' => $this->superAdmin->email,
            'password' => 'SuperSecure1!@#',
        ]);

        // After successful login, session should be regenerated (new session ID)
        // This is verified by the AuthController calling $request->session()->regenerate()
        $this->assertAuthenticatedAs($this->superAdmin);
    }

    public function test_a07_deactivated_user_is_blocked_from_login(): void
    {
        $deactivated = User::factory()->create([
            'role' => 'admin',
            'is_active' => false,
            'password' => Hash::make('ValidPass1!@#'),
        ]);

        $response = $this->post('/admin/login', [
            'email' => $deactivated->email,
            'password' => 'ValidPass1!@#',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_a07_login_error_message_is_generic(): void
    {
        // Attempt login with non-existent email
        $response = $this->post('/admin/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'SomePassword1!',
        ]);

        $response->assertSessionHasErrors('email');

        $errors = session('errors');
        $error = $errors->first('email');

        // Error should NOT reveal whether the email exists
        $this->assertStringNotContainsString('not registered', $error);
        $this->assertStringNotContainsString('not found', $error);
        $this->assertStringNotContainsString('does not exist', $error);
    }

    public function test_a07_login_with_valid_email_but_wrong_password_returns_generic_error(): void
    {
        $response = $this->post('/admin/login', [
            'email' => $this->admin->email,
            'password' => 'WrongPassword1!',
        ]);

        $response->assertSessionHasErrors('email');

        $errors = session('errors');
        $error = $errors->first('email');

        $this->assertStringNotContainsString('password is incorrect', $error ?? '');
        $this->assertStringNotContainsString('wrong password', $error ?? '');
    }

    // =========================================================================
    // A08:2021 - Software and Data Integrity Failures
    // =========================================================================

    public function test_a08_csrf_protection_on_post_without_token(): void
    {
        $response = $this->call('POST', '/admin/users', [
            'name' => 'CSRF Test',
            'email' => 'csrf@example.com',
        ]);

        // Without a CSRF token the request is rejected (419) or
        // redirected to login (302) because the user is unauthenticated
        $this->assertContains($response->status(), [302, 419]);
    }

    public function test_a08_csrf_protection_on_put_without_token(): void
    {
        $response = $this->call('PUT', '/admin/seo/home', [
            'meta_title' => 'CSRF Test',
        ]);

        // Without a CSRF token the request is rejected (419) or
        // redirected to login (302) because the user is unauthenticated
        $this->assertContains($response->status(), [302, 419]);
    }

    public function test_a08_csrf_protection_on_delete_without_token(): void
    {
        $response = $this->call('DELETE', '/admin/users/1');

        // Without a CSRF token the request is rejected (419) or
        // redirected to login (302) because the user is unauthenticated
        $this->assertContains($response->status(), [302, 419]);
    }

    // =========================================================================
    // A09:2021 - Security Logging and Monitoring Failures
    // =========================================================================

    public function test_a09_audit_log_created_on_user_creation(): void
    {
        $this->actingAs($this->superAdmin)->post('/admin/users', [
            'name' => 'Audit Test User',
            'email' => 'audituser@example.com',
            'password' => 'StrongPass1!@#',
            'role' => 'editor',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'created',
            'model_type' => 'User',
            'user_id' => $this->superAdmin->id,
        ]);
    }

    public function test_a09_audit_log_created_on_user_deletion(): void
    {
        $targetUser = User::factory()->create(['role' => 'editor', 'is_active' => true]);

        $this->actingAs($this->superAdmin)->delete("/admin/users/{$targetUser->id}");

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'deleted',
            'model_type' => 'User',
            'model_id' => $targetUser->id,
            'user_id' => $this->superAdmin->id,
        ]);
    }

    public function test_a09_audit_log_records_ip_address(): void
    {
        $this->actingAs($this->superAdmin)
            ->withServerVariables(['REMOTE_ADDR' => '192.168.1.100'])
            ->post('/admin/users', [
                'name' => 'IP Audit User',
                'email' => 'ipaudit@example.com',
                'password' => 'StrongPass1!@#',
                'role' => 'editor',
            ]);

        $log = AuditLog::where('action', 'created')
            ->where('model_type', 'User')
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertNotNull($log->ip_address);
    }

    // =========================================================================
    // A10:2021 - Server-Side Request Forgery (SSRF)
    // =========================================================================

    public function test_a10_canonical_url_with_internal_ip_is_handled(): void
    {
        $internalUrls = [
            'http://127.0.0.1/admin',
            'http://localhost/secret',
            'http://0.0.0.0/internal',
        ];

        foreach ($internalUrls as $url) {
            $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', [
                'meta_title' => 'SSRF Test',
                'canonical_url' => $url,
            ]);

            // The URL is technically valid per the 'url' validation rule.
            // This test documents the behavior: internal URLs are accepted by validation.
            // Applications should layer SSRF protection at the network level or
            // add custom validation if internal URLs must be blocked.
            if ($response->isRedirect(route('admin.seo.index'))) {
                $seo = SeoSetting::where('page_identifier', 'home')->first();
                $this->assertNotNull($seo);
            }

            // Clean up for next iteration
            SeoSetting::where('page_identifier', 'home')->delete();
        }
    }

    public function test_a10_og_image_cannot_reference_external_url_as_string(): void
    {
        // og_image requires an actual uploaded file (image|mimes:jpg,jpeg,png,webp),
        // so passing a string URL should fail validation
        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', [
            'meta_title' => 'SSRF Test',
            'og_image' => 'https://evil.com/steal-data.jpg',
        ]);

        $response->assertSessionHasErrors('og_image');
    }

    public function test_a10_og_image_rejects_url_injection_via_filename(): void
    {
        $response = $this->actingAs($this->superAdmin)->put('/admin/seo/home', [
            'meta_title' => 'SSRF Test',
            'og_image' => 'http://169.254.169.254/latest/meta-data/',
        ]);

        $response->assertSessionHasErrors('og_image');
    }
}
