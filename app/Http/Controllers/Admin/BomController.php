<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class BomController extends Controller
{
    /** BOM calculator (client-side tool; no persisted data). */
    public function index()
    {
        return Inertia::render('Admin/Bom/Index');
    }
}
