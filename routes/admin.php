<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
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
        Route::post('/seo/sitemap/regenerate', [SeoController::class, 'regenerateSitemap'])->name('admin.seo.sitemap.regenerate');
        Route::get('/seo/{pageIdentifier}/edit', [SeoController::class, 'edit'])->where('pageIdentifier', '[a-z]+')->name('admin.seo.edit');
        Route::put('/seo/{pageIdentifier}', [SeoController::class, 'update'])->where('pageIdentifier', '[a-z]+')->name('admin.seo.update');

        // Site settings — analytics IDs, verification codes, SEO defaults, consent.
        Route::get('/settings', [SiteSettingController::class, 'index'])->name('admin.settings.index');
        Route::put('/settings', [SiteSettingController::class, 'update'])->name('admin.settings.update');
    });
});
