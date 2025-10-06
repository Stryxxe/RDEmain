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
            'OSUORU',
            'Reviewer'
        ];

        foreach ($roles as $index => $role) {
            Role::updateOrCreate(
                ['userRole' => $role],
                ['userRole' => $role]
            );
        }
    }
}
