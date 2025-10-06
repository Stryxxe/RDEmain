<?php

require 'vendor/autoload.php';
require 'bootstrap/app.php';

$app = new Illuminate\Foundation\Application(realpath(__DIR__));
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking Proponent users...\n";

try {
    // Get all users with Proponent role
    $users = \App\Models\User::whereHas('role', function($q) {
        $q->where('userRole', 'Proponent');
    })->with('role', 'department')->get();

    echo "Found " . $users->count() . " Proponent users:\n\n";

    foreach($users as $user) {
        echo "ID: " . $user->userID . "\n";
        echo "Name: " . $user->fullName . "\n";
        echo "Email: " . $user->email . "\n";
        echo "Role: " . ($user->role ? $user->role->userRole : 'No Role') . "\n";
        echo "Department: " . ($user->department ? $user->department->name : 'No Department') . "\n";
        echo "Department ID: " . $user->departmentID . "\n";
        echo "Role ID: " . $user->userRolesID . "\n";
        echo "---\n";
    }

    // Also check all roles
    echo "\nAll available roles:\n";
    $roles = \App\Models\Role::all();
    foreach($roles as $role) {
        echo "Role ID: " . $role->userRoleID . ", Name: " . $role->userRole . "\n";
    }

    // Check if there are any users without proper role assignment
    echo "\nUsers without proper role assignment:\n";
    $usersWithoutRole = \App\Models\User::whereDoesntHave('role')->get();
    foreach($usersWithoutRole as $user) {
        echo "ID: " . $user->userID . ", Name: " . $user->fullName . ", Role ID: " . $user->userRolesID . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}



