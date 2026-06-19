<?php

use App\Http\Controllers\PublicController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
|
| The public-facing, SEO-optimised website. Add more public pages here;
| the admin panel lives under /admin (see routes/admin.php).
|
*/

Route::get('/', [PublicController::class, 'home'])->name('home');
