<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
|
| Add your public-facing routes here. By default, the root URL
| redirects to the admin login page.
|
*/

Route::redirect('/', '/admin');
