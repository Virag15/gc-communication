<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminOnly
{
    /**
     * Restrict access to super_admin and admin roles only.
     * Editors are blocked from sensitive operations (user management, SEO).
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || !in_array($request->user()->role, ['super_admin', 'admin'])) {
            abort(403, 'This action requires admin privileges.');
        }

        return $next($request);
    }
}
