<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enquiry;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EnquiryController extends Controller
{
    public function index(Request $request)
    {
        $query = Enquiry::latestFirst();

        if ($request->filled('search')) {
            $search = str_replace(['%', '_'], ['\%', '\_'], $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        $enquiries = $query->get();

        return Inertia::render('Admin/Enquiries/Index', [
            'enquiries' => $enquiries,
            'filters'   => ['search' => $request->search],
        ]);
    }

    public function show(int $id)
    {
        $enquiry = Enquiry::findOrFail($id);

        if ($enquiry->status === 'new') {
            $enquiry->status = 'read';
            $enquiry->save();
        }

        return Inertia::render('Admin/Enquiries/Show', [
            'enquiry' => $enquiry,
        ]);
    }

    public function destroy(int $id)
    {
        $enquiry = Enquiry::findOrFail($id);

        $enquiry->delete();

        // Always return to the list - back() would 404 when deleting from the
        // enquiry's own Show page (its URL no longer resolves).
        return redirect()->route('admin.enquiries.index')
            ->with('success', 'Enquiry deleted.');
    }
}
