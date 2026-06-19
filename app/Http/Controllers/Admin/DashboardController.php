<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Catalogue;
use App\Models\Enquiry;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'from' => 'nullable|date',
            'to'   => 'nullable|date|after_or_equal:from',
        ]);

        $to = $request->input('to') ? Carbon::parse($request->input('to'))->endOfDay() : Carbon::now();
        $from = $request->input('from') ? Carbon::parse($request->input('from'))->startOfDay() : $to->copy()->subDays(30)->startOfDay();

        $stats = [
            'total_users'   => User::count(),
            'active_users'  => User::where('is_active', true)->count(),
            'brands'        => Brand::count(),
            'catalogues'    => Catalogue::count(),
            'downloads'     => (int) Catalogue::sum('download_count'),
            'new_enquiries' => Enquiry::where('status', 'new')->count(),
        ];

        $usersTrend = User::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', $from)
            ->where('created_at', '<=', $to)
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats'      => $stats,
            'usersTrend' => $usersTrend,
            'filters'    => [
                'from' => $request->input('from'),
                'to'   => $request->input('to'),
            ],
        ]);
    }
}
