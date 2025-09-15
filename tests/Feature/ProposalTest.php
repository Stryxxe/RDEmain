<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Proposal;
use App\Models\Status;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ProposalTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_can_create_proposal()
    {
        // Create a status first
        $status = Status::create([
            'statusName' => 'Under Review',
            'statusDescription' => 'Proposal is under review'
        ]);
        
        // Create a department
        $department = \App\Models\Department::create([
            'name' => 'Test Department'
        ]);
        
        // Create a role
        $role = \App\Models\Role::create([
            'userRole' => 'Proponent'
        ]);
        
        // Create a test user
        $user = User::create([
            'firstName' => 'Test',
            'lastName' => 'User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'departmentID' => $department->departmentID,
            'userRolesID' => $role->userRoleID
        ]);

        // Create test file
        Storage::fake('public');
        $file = UploadedFile::fake()->create('test.pdf', 1000, 'application/pdf');

        // Prepare proposal data
        $proposalData = [
            'researchTitle' => 'Test Research Proposal',
            'description' => 'This is a test research proposal description',
            'objectives' => 'To test the proposal creation functionality',
            'researchCenter' => 'Center for Research and Development',
            'researchAgenda' => json_encode(['Agenda 1', 'Agenda 2']),
            'dostSPs' => json_encode(['SP 1', 'SP 2']),
            'sustainableDevelopmentGoals' => json_encode(['SDG 1', 'SDG 2']),
            'proposedBudget' => 100000.50,
            'reportFile' => $file
        ];

        // Make authenticated request
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/proposals', $proposalData);

        // Assert response
        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Proposal submitted successfully'
            ]);

        // Assert proposal was created in database
        $this->assertDatabaseHas('proposals', [
            'researchTitle' => 'Test Research Proposal',
            'description' => 'This is a test research proposal description',
            'objectives' => 'To test the proposal creation functionality',
            'researchCenter' => 'Center for Research and Development',
            'proposedBudget' => 100000.50,
            'userID' => $user->userID,
            'statusID' => 1
        ]);

        // Assert file was stored
        $proposal = Proposal::where('researchTitle', 'Test Research Proposal')->first();
        $this->assertNotNull($proposal);
        $this->assertCount(1, $proposal->files);
    }
}
