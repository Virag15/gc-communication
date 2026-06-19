<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('customer')->nullable();
            $table->string('material', 1)->default('P'); // W = wood, P = profile/aluminium
            $table->decimal('width_ft', 8, 2)->default(0);
            $table->decimal('height_ft', 8, 2)->default(0);
            $table->unsignedSmallInteger('lsps_fixed')->default(0);
            $table->unsignedSmallInteger('lsps_movable')->default(0);
            $table->unsignedSmallInteger('ssps_fixed')->default(0);
            $table->unsignedSmallInteger('ssps_movable')->default(0);
            $table->json('line_items');
            $table->decimal('lsps_total', 12, 2)->default(0);
            $table->decimal('ssps_total', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);
            $table->string('template', 40)->default('classic');
            $table->string('accent', 20)->default('#2563eb');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('boms');
    }
};
