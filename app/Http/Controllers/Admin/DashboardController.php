<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
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
            'total_users'  => User::count(),
            'active_users' => User::where('is_active', true)->count(),
        ];

        $usersTrend = User::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', $from)
            ->where('created_at', '<=', $to)
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get();

        $recentActivity = AuditLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($log) => [
                'id' => $log->id,
                'user' => $log->user?->name ?? 'System',
                'action' => $log->action,
                'model' => class_basename($log->auditable_type),
                'created_at' => $log->created_at,
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats'          => $stats,
            'usersTrend'     => $usersTrend,
            'recentActivity' => $recentActivity,
            'filters'        => [
                'from' => $request->input('from'),
                'to'   => $request->input('to'),
            ],
        ]);
    }
}
