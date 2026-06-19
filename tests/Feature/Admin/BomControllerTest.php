<?php

namespace Tests\Feature\Admin;

use App\Models\Bom;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BomControllerTest extends TestCase
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

    private function validBom(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Test BOM',
            'customer' => 'ACME Corp',
            'material' => 'P',
            'width_ft' => 10,
            'height_ft' => 8,
            'lsps_fixed' => 2,
            'lsps_movable' => 2,
            'ssps_fixed' => 2,
            'ssps_movable' => 2,
            'line_items' => [
                ['system' => 'LSPS', 'name' => 'Item A', 'code' => 'A1', 'finish' => 'TN', 'qty' => 2, 'mrp' => 100, 'custom' => false],
                ['system' => 'SSPS', 'name' => 'Item B', 'code' => 'B1', 'finish' => 'AB', 'qty' => 3, 'mrp' => 50, 'custom' => true],
            ],
            'template' => 'classic',
            'accent' => '#2563eb',
            'notes' => 'Valid 30 days.',
        ], $overrides);
    }

    private function makeBom(): Bom
    {
        return Bom::create($this->validBom() + [
            'line_items' => [['system' => 'LSPS', 'sr' => 1, 'name' => 'X', 'code' => '', 'finish' => '', 'qty' => 1, 'mrp' => 10, 'amount' => 10, 'custom' => false]],
            'lsps_total' => 10,
            'ssps_total' => 0,
            'grand_total' => 10,
        ]);
    }

    // Authorization ---------------------------------------------------------

    public function test_unauthenticated_user_is_redirected(): void
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
        $this->actingAs($this->editor)->post('/admin/bom', $this->validBom())->assertStatus(403);
    }

    // Store -----------------------------------------------------------------

    public function test_store_creates_bom(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/bom', $this->validBom());

        $response->assertRedirect(route('admin.bom.index'));
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('boms', ['name' => 'Test BOM', 'customer' => 'ACME Corp']);
    }

    public function test_store_recomputes_totals_server_side(): void
    {
        // Client cannot lie about totals: amounts are derived from qty * mrp.
        $this->actingAs($this->admin)->post('/admin/bom', $this->validBom());

        $bom = Bom::first();
        $this->assertNotNull($bom);
        $this->assertEquals(200.0, $bom->lsps_total); // 2 * 100
        $this->assertEquals(150.0, $bom->ssps_total); // 3 * 50
        $this->assertEquals(350.0, $bom->grand_total);
        $this->assertEquals(200.0, $bom->line_items[0]['amount']);
    }

    public function test_store_requires_name(): void
    {
        $this->actingAs($this->admin)
            ->post('/admin/bom', $this->validBom(['name' => '']))
            ->assertSessionHasErrors('name');
    }

    public function test_store_rejects_invalid_material(): void
    {
        $this->actingAs($this->admin)
            ->post('/admin/bom', $this->validBom(['material' => 'X']))
            ->assertSessionHasErrors('material');
    }

    public function test_store_requires_line_items(): void
    {
        $this->actingAs($this->admin)
            ->post('/admin/bom', $this->validBom(['line_items' => []]))
            ->assertSessionHasErrors('line_items');
    }

    // Update / Destroy ------------------------------------------------------

    public function test_update_modifies_bom(): void
    {
        $bom = $this->makeBom();

        $this->actingAs($this->admin)
            ->put("/admin/bom/{$bom->id}", $this->validBom(['name' => 'Renamed BOM']))
            ->assertRedirect(route('admin.bom.index'));

        $this->assertDatabaseHas('boms', ['id' => $bom->id, 'name' => 'Renamed BOM']);
    }

    public function test_destroy_deletes_bom(): void
    {
        $bom = $this->makeBom();

        $this->actingAs($this->admin)->delete("/admin/bom/{$bom->id}")->assertRedirect();

        $this->assertDatabaseMissing('boms', ['id' => $bom->id]);
    }

    public function test_show_returns_404_for_missing_bom(): void
    {
        $this->actingAs($this->admin)->get('/admin/bom/9999')->assertStatus(404);
    }
}
