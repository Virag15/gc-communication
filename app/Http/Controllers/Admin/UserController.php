<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\Auditable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class UserController extends Controller
{
    use Auditable;

    public function index(Request $request)
    {
        $query = User::orderBy('name');

        if ($request->filled('search')) {
            $search = str_replace(['%', '_'], ['\%', '\_'], $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Users/Create');
    }

    public function edit(int $id)
    {
        $user = User::findOrFail($id);

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email',
            'password' => ['required', 'string', Rules\Password::defaults()],
            'role'     => 'required|string|in:super_admin,admin,editor',
        ]);

        $validated['name'] = strip_tags($validated['name']);

        // Only super_admin can create super_admin users
        if (auth()->user()->role !== 'super_admin' && $validated['role'] === 'super_admin') {
            abort(403, 'Only super admins can assign the super_admin role.');
        }

        $validated['password'] = Hash::make($validated['password']);

        $user = DB::transaction(function () use ($validated) {
            return User::create($validated);
        });

        $this->audit('created', $user);

        return redirect()->route('admin.users.index')
            ->with('success', 'User created successfully.');
    }

    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => 'required|email|max:255|unique:users,email,' . $user->id,
            'password'  => ['nullable', 'string', Rules\Password::defaults()],
            'role'      => 'required|string|in:super_admin,admin,editor',
            'is_active' => 'boolean',
        ]);

        $validated['name'] = strip_tags($validated['name']);

        // Prevent self-role change or self-deactivation
        if ($user->id === auth()->id()) {
            unset($validated['role'], $validated['is_active']);
        }

        // Only super_admin can create/change super_admin roles
        if (auth()->user()->role !== 'super_admin' && ($validated['role'] ?? null) === 'super_admin') {
            abort(403, 'Only super admins can assign the super_admin role.');
        }

        $passwordChanged = false;
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
            $passwordChanged = true;
        } else {
            unset($validated['password']);
        }

        DB::transaction(function () use ($user, $validated, $passwordChanged) {
            $user->update($validated);

            // Invalidate other sessions when password is changed
            if ($passwordChanged && $user->id !== auth()->id()) {
                DB::table('sessions')
                    ->where('user_id', $user->id)
                    ->delete();
            }
        });

        $this->audit('updated', $user, $validated);

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    public function destroy(int $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return redirect()->route('admin.users.index')
                ->with('error', 'You cannot delete your own account.');
        }

        // Prevent non-super_admin from deleting super_admin users
        if ($user->role === 'super_admin' && auth()->user()->role !== 'super_admin') {
            abort(403, 'Only super admins can delete super admin accounts.');
        }

        $this->audit('deleted', $user);

        DB::transaction(function () use ($user) {
            // Invalidate all sessions for deleted user
            DB::table('sessions')->where('user_id', $user->id)->delete();
            $user->delete();
        });

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully.');
    }
}
