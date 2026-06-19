<?php

namespace Tests\Feature\Admin;

use App\Models\Customer;
use App\Models\Estimate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EstimateControllerTest extends TestCase
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

    private function valid(array $overrides = []): array
    {
        return array_merge([
            'customer' => ['name' => 'Test Customer', 'phone' => '+91 90000 00000'],
            'line_items' => [
                ['name' => 'Item A', 'item_no' => 'A1', 'qty' => 20, 'unit_price' => 350],
                ['name' => 'Item B', 'item_no' => 'B1', 'qty' => 1, 'unit_price' => 1450],
            ],
            'special_discount' => 0,
            'delivery_fee' => 0,
            'express' => false,
            'gst_pct' => 0,
            'show_prices' => true,
            'show_scheme' => true,
            'template' => 'classic',
            'accent' => '#2563EB',
        ], $overrides);
    }

    // Authorization ---------------------------------------------------------

    public function test_unauthenticated_redirected(): void
    {
        $this->get('/admin/bom')->assertRedirect('/admin/login');
    }

    public function test_admin_can_access_index(): void
    {
        $this->actingAs($this->admin)->get('/admin/bom')->assertStatus(200);
    }

    public function test_editor_cannot_access_index(): void
    {
        $this->actingAs($this->editor)->get('/admin/bom')->assertStatus(403);
    }

    public function test_editor_cannot_store(): void
    {
        $this->actingAs($this->editor)->post('/admin/bom', $this->valid())->assertStatus(403);
    }

    // Store -----------------------------------------------------------------

    public function test_store_creates_estimate_and_customer(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/bom', $this->valid());

        $response->assertRedirect(route('admin.bom.index'));
        $this->assertDatabaseHas('customers', ['name' => 'Test Customer']);
        $estimate = Estimate::first();
        $this->assertNotNull($estimate);
        $this->assertNotNull($estimate->customer_id);
        $this->assertEquals('Test Customer', $estimate->customer['name']);
    }

    public function test_store_recomputes_totals(): void
    {
        $this->actingAs($this->admin)->post('/admin/bom', $this->valid());

        $estimate = Estimate::first();
        $this->assertEquals(8450.0, $estimate->item_total); // 20*350 + 1*1450
        $this->assertEquals(8450.0, $estimate->grand_total); // below scheme threshold
    }

    public function test_store_applies_volume_scheme(): void
    {
        // 40 * 350 = 14000 -> 1% volume scheme = 140 off.
        $data = $this->valid(['line_items' => [['name' => 'Bulk', 'item_no' => 'BK', 'qty' => 40, 'unit_price' => 350]]]);
        $this->actingAs($this->admin)->post('/admin/bom', $data);

        $estimate = Estimate::first();
        $this->assertEquals(14000.0, $estimate->item_total);
        $this->assertEquals(140.0, $estimate->scheme_off);
        $this->assertEquals(13860.0, $estimate->grand_total);
    }

    public function test_store_uses_existing_customer(): void
    {
        $customer = Customer::create(['name' => 'Existing Co']);
        $data = $this->valid(['customer_id' => $customer->id, 'customer' => ['name' => 'Existing Co']]);

        $this->actingAs($this->admin)->post('/admin/bom', $data);

        $this->assertEquals(1, Customer::count()); // no new customer created
        $this->assertEquals($customer->id, Estimate::first()->customer_id);
    }

    public function test_store_requires_customer_name(): void
    {
        $this->actingAs($this->admin)
            ->post('/admin/bom', $this->valid(['customer' => ['name' => '']]))
            ->assertSessionHasErrors('customer.name');
    }

    public function test_store_requires_line_items(): void
    {
        $this->actingAs($this->admin)
            ->post('/admin/bom', $this->valid(['line_items' => []]))
            ->assertSessionHasErrors('line_items');
    }

    public function test_store_generates_unique_estimate_no(): void
    {
        $this->actingAs($this->admin)->post('/admin/bom', $this->valid());
        $this->actingAs($this->admin)->post('/admin/bom', $this->valid());

        $this->assertEquals(2, Estimate::distinct('estimate_no')->count('estimate_no'));
    }

    // Update / Destroy ------------------------------------------------------

    public function test_update_modifies_estimate(): void
    {
        $this->actingAs($this->admin)->post('/admin/bom', $this->valid());
        $estimate = Estimate::first();

        $this->actingAs($this->admin)
            ->put("/admin/bom/{$estimate->id}", $this->valid(['customer' => ['name' => 'Renamed Customer'], 'customer_id' => $estimate->customer_id]))
            ->assertRedirect(route('admin.bom.index'));

        $this->assertEquals('Renamed Customer', $estimate->fresh()->customer['name']);
    }

    public function test_destroy_deletes_estimate(): void
    {
        $this->actingAs($this->admin)->post('/admin/bom', $this->valid());
        $estimate = Estimate::first();

        $this->actingAs($this->admin)->delete("/admin/bom/{$estimate->id}")->assertRedirect();
        $this->assertDatabaseMissing('estimates', ['id' => $estimate->id]);
    }

    // Settings --------------------------------------------------------------

    public function test_editor_cannot_open_settings(): void
    {
        $this->actingAs($this->editor)->get('/admin/bom/settings')->assertStatus(403);
    }

    public function test_admin_can_save_settings(): void
    {
        $payload = [
            'company_name' => 'GC Communication',
            'valid_days' => 14,
            'template' => 'studio',
            'font' => 'inter',
            'logos_pos' => 'bottom',
            'gst_pct' => 18,
            'photos' => true,
            'show_prices' => true,
            'show_scheme' => false,
            'use_brand_logos' => true,
        ];

        $this->actingAs($this->admin)->post('/admin/bom/settings', $payload)->assertRedirect(route('admin.bom.settings'));
        $this->assertDatabaseHas('estimate_settings', ['valid_days' => 14, 'template' => 'studio', 'gst_pct' => 18]);
    }
}
