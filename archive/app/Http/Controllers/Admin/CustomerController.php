<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Traits\Auditable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    use Auditable;

    public function index(Request $request)
    {
        $query = Customer::latestFirst();

        if ($request->filled('search')) {
            $search = str_replace(['%', '_'], ['\%', '\_'], $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('company', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $customers = $query->get();

        return Inertia::render('Admin/Customers/Index', [
            'customers' => $customers,
            'filters'   => ['search' => $request->search],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Customers/Create');
    }

    public function edit(int $id)
    {
        $customer = Customer::findOrFail($id);

        return Inertia::render('Admin/Customers/Edit', [
            'customer' => $customer,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:160',
            'company' => 'nullable|string|max:160',
            'phone'   => 'nullable|string|max:40',
            'email'   => 'nullable|email|max:160',
            'address' => 'nullable|string|max:400',
            'gstin'   => 'nullable|string|max:20',
            'ref_by'  => 'nullable|string|max:160',
            'notes'   => 'nullable|string|max:1000',
        ]);

        $customer = Customer::create($validated);

        $this->audit('created', $customer);

        return redirect()->route('admin.customers.index')
            ->with('success', 'Customer created.');
    }

    public function update(Request $request, int $id)
    {
        $customer = Customer::findOrFail($id);

        $validated = $request->validate([
            'name'    => 'required|string|max:160',
            'company' => 'nullable|string|max:160',
            'phone'   => 'nullable|string|max:40',
            'email'   => 'nullable|email|max:160',
            'address' => 'nullable|string|max:400',
            'gstin'   => 'nullable|string|max:20',
            'ref_by'  => 'nullable|string|max:160',
            'notes'   => 'nullable|string|max:1000',
        ]);

        $customer->update($validated);

        $this->audit('updated', $customer, $validated);

        return redirect()->route('admin.customers.index')
            ->with('success', 'Customer updated.');
    }

    public function destroy(int $id)
    {
        $customer = Customer::findOrFail($id);

        $this->audit('deleted', $customer);

        $customer->delete();

        return back()->with('success', 'Customer deleted.');
    }
}
