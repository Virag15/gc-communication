<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\CatalogueController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\EnquiryController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EstimateController;
use App\Http\Controllers\Admin\EstimateSettingController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\SeoController;
use App\Http\Controllers\Admin\SiteSettingController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Middleware\AdminAccess;
use App\Http\Middleware\AdminOnly;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

// Auth routes (no auth middleware). One shared throttle (7/min per IP) covers
// both viewing the form and submitting. Precise brute-force protection
// (7 tries per email+IP) lives in AuthController::login().
Route::middleware('throttle:7,1')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('admin.login');
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected admin routes (auth + role check)
Route::middleware(['auth', AdminAccess::class])->group(function () {
    // Logout
    Route::post('/logout', [AuthController::class, 'logout'])->name('admin.logout');

    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('admin.dashboard');

    // ──────────────────────────────────────────────
    // Add your resource routes here, e.g.:
    // Route::resource('/posts', PostController::class)->names('admin.posts');
    // ──────────────────────────────────────────────

    // Users & SEO (admin + super_admin only)
    Route::middleware(AdminOnly::class)->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('admin.users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('admin.users.create');
        Route::post('/users', [UserController::class, 'store'])->name('admin.users.store');
        Route::get('/users/{id}/edit', [UserController::class, 'edit'])->where('id', '[0-9]+')->name('admin.users.edit');
        Route::put('/users/{id}', [UserController::class, 'update'])->where('id', '[0-9]+')->name('admin.users.update');
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->where('id', '[0-9]+')->name('admin.users.destroy');

        Route::get('/seo', [SeoController::class, 'index'])->name('admin.seo.index');
        Route::post('/seo', [SeoController::class, 'updateAll'])->name('admin.seo.update-all');
        Route::post('/seo/sitemap/regenerate', [SeoController::class, 'regenerateSitemap'])->name('admin.seo.sitemap.regenerate');
        Route::get('/seo/{pageIdentifier}/edit', [SeoController::class, 'edit'])->where('pageIdentifier', '[a-z]+')->name('admin.seo.edit');
        Route::put('/seo/{pageIdentifier}', [SeoController::class, 'update'])->where('pageIdentifier', '[a-z]+')->name('admin.seo.update');

        // Site settings - analytics IDs, verification codes, SEO defaults, consent.
        Route::get('/settings', [SiteSettingController::class, 'index'])->name('admin.settings.index');
        Route::post('/settings', [SiteSettingController::class, 'update'])->name('admin.settings.update');

        // Brands (update via POST to allow logo uploads).
        Route::get('/brands', [BrandController::class, 'index'])->name('admin.brands.index');
        Route::get('/brands/create', [BrandController::class, 'create'])->name('admin.brands.create');
        Route::post('/brands', [BrandController::class, 'store'])->name('admin.brands.store');
        Route::get('/brands/{id}/edit', [BrandController::class, 'edit'])->where('id', '[0-9]+')->name('admin.brands.edit');
        Route::post('/brands/{id}', [BrandController::class, 'update'])->where('id', '[0-9]+')->name('admin.brands.update');
        Route::delete('/brands/{id}', [BrandController::class, 'destroy'])->where('id', '[0-9]+')->name('admin.brands.destroy');

        // Catalogues / PDF downloads (update via POST to allow file uploads).
        Route::get('/catalogues', [CatalogueController::class, 'index'])->name('admin.catalogues.index');
        Route::get('/catalogues/create', [CatalogueController::class, 'create'])->name('admin.catalogues.create');
        Route::post('/catalogues', [CatalogueController::class, 'store'])->name('admin.catalogues.store');
        Route::get('/catalogues/{id}/edit', [CatalogueController::class, 'edit'])->where('id', '[0-9]+')->name('admin.catalogues.edit');
        Route::post('/catalogues/{id}', [CatalogueController::class, 'update'])->where('id', '[0-9]+')->name('admin.catalogues.update');
        Route::delete('/catalogues/{id}', [CatalogueController::class, 'destroy'])->where('id', '[0-9]+')->name('admin.catalogues.destroy');

        // Products (catalog searched by the estimate creator; update via POST for image uploads).
        Route::get('/products', [ProductController::class, 'index'])->name('admin.products.index');
        Route::get('/products/create', [ProductController::class, 'create'])->name('admin.products.create');
        Route::post('/products', [ProductController::class, 'store'])->name('admin.products.store');
        Route::get('/products/{id}/edit', [ProductController::class, 'edit'])->where('id', '[0-9]+')->name('admin.products.edit');
        Route::post('/products/{id}', [ProductController::class, 'update'])->where('id', '[0-9]+')->name('admin.products.update');
        Route::delete('/products/{id}', [ProductController::class, 'destroy'])->where('id', '[0-9]+')->name('admin.products.destroy');

        // Customers (selectable in the estimate creator).
        Route::get('/customers', [CustomerController::class, 'index'])->name('admin.customers.index');
        Route::get('/customers/create', [CustomerController::class, 'create'])->name('admin.customers.create');
        Route::post('/customers', [CustomerController::class, 'store'])->name('admin.customers.store');
        Route::get('/customers/{id}/edit', [CustomerController::class, 'edit'])->where('id', '[0-9]+')->name('admin.customers.edit');
        Route::put('/customers/{id}', [CustomerController::class, 'update'])->where('id', '[0-9]+')->name('admin.customers.update');
        Route::delete('/customers/{id}', [CustomerController::class, 'destroy'])->where('id', '[0-9]+')->name('admin.customers.destroy');

        // Blog posts (rich text + per-post SEO; update via POST for image uploads).
        Route::get('/blog', [PostController::class, 'index'])->name('admin.blog.index');
        Route::get('/blog/create', [PostController::class, 'create'])->name('admin.blog.create');
        Route::post('/blog', [PostController::class, 'store'])->name('admin.blog.store');
        Route::get('/blog/{id}/edit', [PostController::class, 'edit'])->where('id', '[0-9]+')->name('admin.blog.edit');
        Route::post('/blog/{id}', [PostController::class, 'update'])->where('id', '[0-9]+')->name('admin.blog.update');
        Route::delete('/blog/{id}', [PostController::class, 'destroy'])->where('id', '[0-9]+')->name('admin.blog.destroy');

        // Enquiries (contact submissions from the public site).
        Route::get('/enquiries', [EnquiryController::class, 'index'])->name('admin.enquiries.index');
        Route::get('/enquiries/{id}', [EnquiryController::class, 'show'])->where('id', '[0-9]+')->name('admin.enquiries.show');
        Route::delete('/enquiries/{id}', [EnquiryController::class, 'destroy'])->where('id', '[0-9]+')->name('admin.enquiries.destroy');

        // BOM / estimate creator (customer + products -> discounts/GST -> save -> branded PDF).
        Route::get('/bom', [EstimateController::class, 'index'])->name('admin.bom.index');
        Route::get('/bom/create', [EstimateController::class, 'create'])->name('admin.bom.create');
        Route::post('/bom', [EstimateController::class, 'store'])->name('admin.bom.store');
        Route::get('/bom/settings', [EstimateSettingController::class, 'edit'])->name('admin.bom.settings');
        Route::post('/bom/settings', [EstimateSettingController::class, 'update'])->name('admin.bom.settings.update');
        Route::get('/bom/{id}', [EstimateController::class, 'show'])->where('id', '[0-9]+')->name('admin.bom.show');
        Route::get('/bom/{id}/edit', [EstimateController::class, 'edit'])->where('id', '[0-9]+')->name('admin.bom.edit');
        Route::put('/bom/{id}', [EstimateController::class, 'update'])->where('id', '[0-9]+')->name('admin.bom.update');
        Route::delete('/bom/{id}', [EstimateController::class, 'destroy'])->where('id', '[0-9]+')->name('admin.bom.destroy');
    });
});
