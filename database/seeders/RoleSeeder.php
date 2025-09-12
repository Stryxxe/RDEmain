<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run()
    {
        $roles = [
            'Admin',
            'RDD',
            'CM',
            'Proponent',
            'OP',
            'OSUURU',
            'Reviewer'
        ];

        foreach ($roles as $role) {
            Role::create(['userRole' => $role]);
        }
    }
}
