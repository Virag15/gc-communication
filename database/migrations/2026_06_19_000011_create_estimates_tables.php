<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The old spsBom-based "boms" table is replaced by the estimate creator.
        Schema::dropIfExists('boms');

        Schema::create('estimates', function (Blueprint $table) {
            $table->id();
            $table->string('estimate_no')->unique();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->json('customer');      // snapshot at save time
            $table->json('line_items');
            $table->decimal('special_discount', 12, 2)->default(0);
            $table->decimal('delivery_fee', 12, 2)->default(0);
            $table->boolean('express')->default(false);
            $table->unsignedSmallInteger('gst_pct')->default(0);
            $table->boolean('show_prices')->default(true);
            $table->boolean('show_scheme')->default(true);
            $table->string('template', 20)->default('classic');
            $table->string('accent', 20)->default('#2563EB');
            $table->decimal('item_total', 12, 2)->default(0);
            $table->decimal('scheme_off', 12, 2)->default(0);
            $table->decimal('gst_amt', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);
            $table->string('status', 20)->default('draft');
            $table->timestamps();
        });

        Schema::create('estimate_settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name')->default('GC Communication');
            $table->string('prepared_by')->nullable();
            $table->string('doc_title')->default('Bill of Materials');
            $table->text('note')->nullable();
            $table->text('terms')->nullable();
            $table->unsignedSmallInteger('valid_days')->default(7);
            $table->string('template', 20)->default('classic');
            $table->string('accent', 20)->default('#2563EB');
            $table->string('paper', 20)->default('#FFFFFF');
            $table->string('font', 20)->default('inter');
            $table->string('footer_color', 20)->default('#696E74');
            $table->string('side_color', 20)->default('#696E74');
            $table->string('wordmark_color', 20)->default('#1A1C1F');
            $table->string('logos_pos', 10)->default('top');
            $table->boolean('photos')->default(true);
            $table->boolean('show_prices')->default(true);
            $table->boolean('show_scheme')->default(true);
            $table->boolean('use_brand_logos')->default(true);
            $table->unsignedSmallInteger('gst_pct')->default(0);
            $table->string('watermark')->nullable();
            $table->string('dealer_addr1')->nullable();
            $table->string('dealer_addr2')->nullable();
            $table->string('dealer_phone')->nullable();
            $table->string('dealer_email')->nullable();
            $table->string('dealer_website')->nullable();
            $table->string('dealer_gstin')->nullable();
            $table->string('logo')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estimates');
        Schema::dropIfExists('estimate_settings');
    }
};
