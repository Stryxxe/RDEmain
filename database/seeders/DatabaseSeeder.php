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
            // ProposalSeeder::class, // Commented out - dummy proposals removed
            // AdditionalProposalSeeder::class, // Commented out - dummy proposals removed
            // SarahJohnsonProposalSeeder::class, // Commented out - dummy proposals removed
            // ProposalFileSeeder::class, // Commented out - dummy proposal files removed
        ]);
    }
}
