<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use App\Models\ResearchCenter;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'firstName' => ['required', 'string', 'max:50'],
            'lastName' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:50', 'unique:users,email'],
            'password' => ['required', 'confirmed', 'min:8'],
            'role' => ['required', 'string'],
            'department' => ['nullable', 'string', 'max:255'],
            'researchCenter' => ['nullable', 'string', 'max:255'],
        ]);

        // For RDD Staff, department and researchCenter are not required
        if ($validated['role'] === 'rdd') {
            $validated['department'] = null;
            $validated['researchCenter'] = null;
        }

        try {
            // Map role slug to role name
            $roleName = $this->getRoleNameFromSlug($validated['role']);
            $role = Role::firstOrCreate(
                ['userRole' => $roleName],
                ['userRole' => $roleName]
            );

            // Resolve department if provided
            $departmentID = null;
            if (!empty($validated['department'])) {
                $department = $this->resolveDepartment($validated['department']);
                $departmentID = $department->departmentID;
            }

            // Resolve research center if provided
            $researchCenterID = null;
            if (!empty($validated['researchCenter'])) {
                $researchCenter = ResearchCenter::where('name', $validated['researchCenter'])
                    ->orWhere(function($q) use ($validated) {
                        $q->whereRaw('LOWER(name) = ?', [strtolower($validated['researchCenter'])]);
                    })
                    ->first();
                
                if ($researchCenter) {
                    $researchCenterID = $researchCenter->centerID;
                    
                    // Ensure research center belongs to selected department
                    if ($departmentID && $researchCenter->departmentID != $departmentID) {
                        return back()->withErrors([
                            'researchCenter' => 'The selected research center does not belong to the selected department.'
                        ]);
                    }
                }
            }

            // Create user data
            $createData = [
                'firstName' => $validated['firstName'],
                'lastName' => $validated['lastName'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'userRolesID' => $role->userRoleID,
            ];

            // Only include departmentID if it's not null
            if ($departmentID !== null) {
                $createData['departmentID'] = $departmentID;
            }

            // Only include researchCenterID if it's not null
            if ($researchCenterID !== null) {
                $createData['researchCenterID'] = $researchCenterID;
            }

            // Set status to inactive by default for new registrations
            if (Schema::hasColumn((new User())->getTable(), 'status')) {
                $createData['status'] = 'inactive';
            }

            $user = User::create($createData);

            event(new Registered($user));

            // Don't auto-login, redirect to login page instead
            return redirect()->route('login')->with('status', 'Account created successfully! Please log in.');
        } catch (\Exception $e) {
            \Log::error('Registration failed: ' . $e->getMessage());
            return back()->withErrors([
                'email' => 'Registration failed. Please try again.'
            ]);
        }
    }

    protected function getRoleNameFromSlug(string $slug): string
    {
        return match (strtolower($slug)) {
            'admin' => 'Admin',
            'central_manager', 'center_manager' => 'CM',
            'rdd', 'rdd_staff' => 'RDD',
            'rde' => 'RDE',
            'op' => 'OP',
            'osuoro' => 'OSUORU',
            default => 'Proponent',
        };
    }

    protected function resolveDepartment(string $departmentName): Department
    {
        $table = (new Department())->getTable();

        $query = Department::query()->where('name', $departmentName);

        if (Schema::hasColumn($table, 'departmentName')) {
            $query->orWhere('departmentName', $departmentName);
        }

        $department = $query->first();

        if ($department) {
            return $department;
        }

        $data = ['name' => $departmentName];

        if (Schema::hasColumn($table, 'departmentName')) {
            $data['departmentName'] = $departmentName;
        }

        return Department::create($data);
    }
}
