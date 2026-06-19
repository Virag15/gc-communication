<?php

use App\Http\Controllers\PublicController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
|
| The public-facing, SEO-optimised website. The admin panel lives under
| /admin (see routes/admin.php).
|
*/

Route::get('/', [PublicController::class, 'home'])->name('home');
Route::get('/catalogues', [PublicController::class, 'catalogues'])->name('catalogues');
