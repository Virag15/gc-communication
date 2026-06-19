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
Route::get('/brands', [PublicController::class, 'brands'])->name('brands');
Route::get('/range', [PublicController::class, 'range'])->name('range');
Route::get('/catalogues', [PublicController::class, 'catalogues'])->name('catalogues');
Route::get('/catalogues/{id}/download', [PublicController::class, 'downloadCatalogue'])->whereNumber('id')->name('catalogues.download');
Route::get('/about', [PublicController::class, 'about'])->name('about');
Route::get('/contact', [PublicController::class, 'contact'])->name('contact');
Route::post('/enquiry', [PublicController::class, 'storeEnquiry'])->name('enquiry.store');
