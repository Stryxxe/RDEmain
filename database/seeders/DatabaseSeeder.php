<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            DepartmentSeeder::class,
            RoleSeeder::class,
            StatusSeeder::class,
            UserSeeder::class,
            AssignUserDepartmentsSeeder::class,
            NotificationSeeder::class,
            MessageSeeder::class,
            ProposalSeeder::class,
            AdditionalProposalSeeder::class,
            SarahJohnsonProposalSeeder::class,
            ProposalFileSeeder::class,
        ]);
    }
}
