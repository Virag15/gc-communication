<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\CatalogueController;
use App\Http\Controllers\Admin\EnquiryController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\PriceListController;
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

        // Products (catalog for the estimate creator + public range).
        Route::get('/products', [ProductController::class, 'index'])->name('admin.products.index');
        Route::get('/products/create', [ProductController::class, 'create'])->name('admin.products.create');
        Route::get('/products/import', [ProductController::class, 'importForm'])->name('admin.products.import');
        Route::post('/products/import', [ProductController::class, 'import'])->name('admin.products.import.store');
        Route::post('/products', [ProductController::class, 'store'])->name('admin.products.store');
        Route::get('/products/{id}/edit', [ProductController::class, 'edit'])->where('id', '[0-9]+')->name('admin.products.edit');
        Route::post('/products/{id}', [ProductController::class, 'update'])->where('id', '[0-9]+')->name('admin.products.update');
        Route::delete('/products/{id}', [ProductController::class, 'destroy'])->where('id', '[0-9]+')->name('admin.products.destroy');

        // Price lists: convert manufacturer PDFs (local OCR) and import the CSV from disk.
        Route::get('/price-lists', [PriceListController::class, 'index'])->name('admin.price-lists.index');
        Route::post('/price-lists/convert', [PriceListController::class, 'convert'])->name('admin.price-lists.convert');
        Route::get('/price-lists/status', [PriceListController::class, 'status'])->name('admin.price-lists.status');
        Route::post('/price-lists/import', [PriceListController::class, 'import'])->name('admin.price-lists.import');

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

        // NOTE: The BOM / estimate creator (with Products & Customers) is archived
        // under /archive. See archive/README.md to restore it.
    });
});
