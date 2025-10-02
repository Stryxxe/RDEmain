<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Proposal;
use App\Models\User;
use App\Models\Status;
use App\Models\Department;
use Carbon\Carbon;

class AdditionalProposalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get departments
        $academicDept = Department::where('name', 'Academic Affairs')->first();
        $cmDept = Department::where('name', 'College of Medicine')->first();
        $rddDept = Department::where('name', 'Research and Development Division')->first();
        
        if (!$academicDept || !$cmDept || !$rddDept) {
            $this->command->error('Required departments not found. Please run DepartmentSeeder first.');
            return;
        }

        // Get statuses
        $underReview = Status::where('statusName', 'Under Review')->first();
        $approved = Status::where('statusName', 'Approved')->first();
        $ongoing = Status::where('statusName', 'Ongoing')->first();
        $completed = Status::where('statusName', 'Completed')->first();

        // Get additional users from different departments (these should already exist from UserSeeder)
        $mariaCruz = User::where('email', 'maria.cruz@usep.edu.ph')->first();
        $juanSantos = User::where('email', 'juan.santos@usep.edu.ph')->first();
        $anaReyes = User::where('email', 'ana.reyes@usep.edu.ph')->first();
        $carlosMendoza = User::where('email', 'carlos.mendoza@usep.edu.ph')->first();
        $elenaTorres = User::where('email', 'elena.torres@usep.edu.ph')->first();
        $sofiaHerrera = User::where('email', 'sofia.herrera@usep.edu.ph')->first();
        $rafaelCastillo = User::where('email', 'rafael.castillo@usep.edu.ph')->first();
        $isabelMorales = User::where('email', 'isabel.morales@usep.edu.ph')->first();
        $franciscoJimenez = User::where('email', 'francisco.jimenez@usep.edu.ph')->first();
        $elenaDiaz = User::where('email', 'elena.diaz@usep.edu.ph')->first();
        $gabrielOrtega = User::where('email', 'gabriel.ortega@usep.edu.ph')->first();
        $victoriaSilva = User::where('email', 'victoria.silva@usep.edu.ph')->first();
        $alejandroVega = User::where('email', 'alejandro.vega@usep.edu.ph')->first();
        $beatrizRomero = User::where('email', 'beatriz.romero@usep.edu.ph')->first();
        $danielNavarro = User::where('email', 'daniel.navarro@usep.edu.ph')->first();
        $marianaPerez = User::where('email', 'mariana.perez@usep.edu.ph')->first();
        $ricardoGutierrez = User::where('email', 'ricardo.gutierrez@usep.edu.ph')->first();
        $carmenVillanueva = User::where('email', 'carmen.villanueva@usep.edu.ph')->first();
        $eduardoMendoza = User::where('email', 'eduardo.mendoza@usep.edu.ph')->first();
        $antonioRivera = User::where('email', 'antonio.rivera@usep.edu.ph')->first();
        $carmenLopez = User::where('email', 'carmen.lopez@usep.edu.ph')->first();
        $luisMartinez = User::where('email', 'luis.martinez@usep.edu.ph')->first();
        $rosaGonzales = User::where('email', 'rosa.gonzales@usep.edu.ph')->first();
        $joseRamirez = User::where('email', 'jose.ramirez@usep.edu.ph')->first();

        // Create proposals from different departments
        $proposals = [
            // Educational Technology proposals
            [
                'researchTitle' => 'Digital Learning Platform for Mathematics Education in Philippine Schools',
                'description' => 'This research develops an interactive digital learning platform specifically designed for mathematics education in Philippine schools, focusing on K-12 curriculum alignment and local learning contexts.',
                'objectives' => '1. Develop interactive mathematics learning modules\n2. Align content with Philippine K-12 curriculum\n3. Test effectiveness with local students\n4. Train teachers on platform usage\n5. Evaluate learning outcomes',
                'researchCenter' => 'Center for Educational Technology and Innovation',
                'researchAgenda' => ['Educational Technology', 'Mathematics Education', 'Digital Learning', 'Curriculum Development'],
                'dostSPs' => ['Priority 2: Information and Communications Technology', 'Priority 4: Social Sciences and Humanities'],
                'sustainableDevelopmentGoals' => ['SDG 4: Quality Education', 'SDG 10: Reduced Inequalities'],
                'proposedBudget' => 800000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Educational Technology', 'Mathematics Education', 'Digital Learning', 'Curriculum Development'],
                    'dostSPs' => ['Priority 2: Information and Communications Technology', 'Priority 4: Social Sciences and Humanities'],
                    'sustainableDevelopmentGoals' => ['SDG 4: Quality Education', 'SDG 10: Reduced Inequalities'],
                    'proposedBudget' => 800000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(10),
                'statusID' => $underReview->statusID,
                'userID' => $sofiaHerrera->userID // EduTech Center proponent
            ],
            [
                'researchTitle' => 'Cultural Heritage Documentation and Preservation in Mindanao',
                'description' => 'This study focuses on documenting and preserving cultural heritage sites and practices in Mindanao, creating digital archives and community engagement programs.',
                'objectives' => '1. Document cultural heritage sites in Mindanao\n2. Create digital preservation archives\n3. Engage local communities in preservation\n4. Develop educational materials\n5. Establish heritage tourism guidelines',
                'researchCenter' => 'Center for Cultural Studies and Heritage Preservation',
                'researchAgenda' => ['Cultural Studies', 'Heritage Preservation', 'Digital Archives', 'Community Engagement'],
                'dostSPs' => ['Priority 4: Social Sciences and Humanities', 'Priority 2: Information and Communications Technology'],
                'sustainableDevelopmentGoals' => ['SDG 11: Sustainable Cities and Communities', 'SDG 4: Quality Education'],
                'proposedBudget' => 950000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Cultural Studies', 'Heritage Preservation', 'Digital Archives', 'Community Engagement'],
                    'dostSPs' => ['Priority 4: Social Sciences and Humanities', 'Priority 2: Information and Communications Technology'],
                    'sustainableDevelopmentGoals' => ['SDG 11: Sustainable Cities and Communities', 'SDG 4: Quality Education'],
                    'proposedBudget' => 950000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(5),
                'statusID' => $approved->statusID,
                'userID' => $rafaelCastillo->userID // Cultural Center proponent
            ],
            // Health and Medicine proposals
            [
                'researchTitle' => 'Telemedicine Implementation for Rural Healthcare in Davao Region',
                'description' => 'This research implements and evaluates a telemedicine system for rural healthcare delivery in the Davao Region, focusing on accessibility and quality of care.',
                'objectives' => '1. Implement telemedicine infrastructure in rural areas\n2. Train healthcare workers on telemedicine use\n3. Evaluate patient outcomes and satisfaction\n4. Develop protocols for remote consultations\n5. Assess cost-effectiveness of the system',
                'researchCenter' => 'Center for Telemedicine and Digital Health',
                'researchAgenda' => ['Telemedicine', 'Rural Healthcare', 'Digital Health', 'Healthcare Access'],
                'dostSPs' => ['Priority 3: Health', 'Priority 2: Information and Communications Technology'],
                'sustainableDevelopmentGoals' => ['SDG 3: Good Health and Well-being', 'SDG 10: Reduced Inequalities'],
                'proposedBudget' => 1200000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Telemedicine', 'Rural Healthcare', 'Digital Health', 'Healthcare Access'],
                    'dostSPs' => ['Priority 3: Health', 'Priority 2: Information and Communications Technology'],
                    'sustainableDevelopmentGoals' => ['SDG 3: Good Health and Well-being', 'SDG 10: Reduced Inequalities'],
                    'proposedBudget' => 1200000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(7),
                'statusID' => $ongoing->statusID,
                'userID' => $isabelMorales->userID // Telemedicine Center proponent
            ],
            [
                'researchTitle' => 'Nutritional Assessment and Intervention Program for Malnourished Children',
                'description' => 'This study assesses nutritional status of children in underserved communities and implements intervention programs to address malnutrition.',
                'objectives' => '1. Assess nutritional status of target children\n2. Identify causes of malnutrition\n3. Develop intervention programs\n4. Train community health workers\n5. Monitor and evaluate program effectiveness',
                'researchCenter' => 'Center for Public Health and Nutrition',
                'researchAgenda' => ['Public Health', 'Nutrition', 'Child Health', 'Community Intervention'],
                'dostSPs' => ['Priority 3: Health', 'Priority 1: Agriculture, Aquatic and Natural Resources'],
                'sustainableDevelopmentGoals' => ['SDG 2: Zero Hunger', 'SDG 3: Good Health and Well-being'],
                'proposedBudget' => 700000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Public Health', 'Nutrition', 'Child Health', 'Community Intervention'],
                    'dostSPs' => ['Priority 3: Health', 'Priority 1: Agriculture, Aquatic and Natural Resources'],
                    'sustainableDevelopmentGoals' => ['SDG 2: Zero Hunger', 'SDG 3: Good Health and Well-being'],
                    'proposedBudget' => 700000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(3),
                'statusID' => $completed->statusID,
                'userID' => $franciscoJimenez->userID // Nutrition Center proponent
            ],
            // Engineering and Materials proposals
            [
                'researchTitle' => 'Advanced Materials Research for Sustainable Construction',
                'description' => 'This research develops advanced materials for sustainable construction practices, focusing on locally available resources and environmental impact reduction.',
                'objectives' => '1. Develop sustainable construction materials\n2. Test material properties and durability\n3. Assess environmental impact\n4. Create construction guidelines\n5. Train local construction workers',
                'researchCenter' => 'Center for Materials Science and Engineering',
                'researchAgenda' => ['Materials Science', 'Sustainable Construction', 'Environmental Engineering', 'Civil Engineering'],
                'dostSPs' => ['Priority 1: Agriculture, Aquatic and Natural Resources', 'Priority 2: Information and Communications Technology'],
                'sustainableDevelopmentGoals' => ['SDG 9: Industry, Innovation and Infrastructure', 'SDG 11: Sustainable Cities and Communities'],
                'proposedBudget' => 1500000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Materials Science', 'Sustainable Construction', 'Environmental Engineering', 'Civil Engineering'],
                    'dostSPs' => ['Priority 1: Agriculture, Aquatic and Natural Resources', 'Priority 2: Information and Communications Technology'],
                    'sustainableDevelopmentGoals' => ['SDG 9: Industry, Innovation and Infrastructure', 'SDG 11: Sustainable Cities and Communities'],
                    'proposedBudget' => 1500000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(12),
                'statusID' => $underReview->statusID,
                'userID' => $elenaDiaz->userID // Materials Center proponent
            ],
            // Agriculture and Marine proposals
            [
                'researchTitle' => 'Sustainable Aquaculture Practices for Davao Gulf',
                'description' => 'This research develops sustainable aquaculture practices for the Davao Gulf region, focusing on environmental protection and economic viability for local fishing communities.',
                'objectives' => '1. Assess current aquaculture practices in Davao Gulf\n2. Develop sustainable farming techniques\n3. Implement environmental monitoring systems\n4. Train local aquaculture operators\n5. Evaluate economic and environmental impacts',
                'researchCenter' => 'Center for Marine Biology and Oceanography',
                'researchAgenda' => ['Marine Biology', 'Aquaculture', 'Environmental Conservation', 'Sustainable Development'],
                'dostSPs' => ['Priority 1: Agriculture, Aquatic and Natural Resources', 'Priority 3: Health'],
                'sustainableDevelopmentGoals' => ['SDG 14: Life Below Water', 'SDG 8: Decent Work and Economic Growth'],
                'proposedBudget' => 1100000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Marine Biology', 'Aquaculture', 'Environmental Conservation', 'Sustainable Development'],
                    'dostSPs' => ['Priority 1: Agriculture, Aquatic and Natural Resources', 'Priority 3: Health'],
                    'sustainableDevelopmentGoals' => ['SDG 14: Life Below Water', 'SDG 8: Decent Work and Economic Growth'],
                    'proposedBudget' => 1100000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(6),
                'statusID' => $ongoing->statusID,
                'userID' => $victoriaSilva->userID // Marine Center proponent
            ],
            [
                'researchTitle' => 'Smart Farming Technologies for Rice Production in Davao Region',
                'description' => 'This study implements smart farming technologies for rice production in the Davao Region, using IoT sensors, data analytics, and precision agriculture techniques.',
                'objectives' => '1. Implement IoT sensors for soil and weather monitoring\n2. Develop data analytics for crop management\n3. Test precision irrigation systems\n4. Train farmers on technology use\n5. Evaluate yield improvements and cost savings',
                'researchCenter' => 'Center for Agricultural Research and Development',
                'researchAgenda' => ['Smart Agriculture', 'Precision Farming', 'IoT Technology', 'Crop Science'],
                'dostSPs' => ['Priority 1: Agriculture, Aquatic and Natural Resources', 'Priority 2: Information and Communications Technology'],
                'sustainableDevelopmentGoals' => ['SDG 2: Zero Hunger', 'SDG 9: Industry, Innovation and Infrastructure'],
                'proposedBudget' => 1300000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Smart Agriculture', 'Precision Farming', 'IoT Technology', 'Crop Science'],
                    'dostSPs' => ['Priority 1: Agriculture, Aquatic and Natural Resources', 'Priority 2: Information and Communications Technology'],
                    'sustainableDevelopmentGoals' => ['SDG 2: Zero Hunger', 'SDG 9: Industry, Innovation and Infrastructure'],
                    'proposedBudget' => 1300000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(9),
                'statusID' => $approved->statusID,
                'userID' => $gabrielOrtega->userID // Agriculture Center proponent
            ],
            // Urban Planning and Social Sciences proposals
            [
                'researchTitle' => 'Smart City Infrastructure Planning for Davao City',
                'description' => 'This research develops a comprehensive smart city infrastructure plan for Davao City, focusing on sustainable urban development and digital integration.',
                'objectives' => '1. Assess current urban infrastructure in Davao City\n2. Develop smart city master plan\n3. Design integrated digital systems\n4. Create implementation roadmap\n5. Engage stakeholders in planning process',
                'researchCenter' => 'Center for Urban Planning and Development',
                'researchAgenda' => ['Urban Planning', 'Smart Cities', 'Infrastructure Development', 'Digital Integration'],
                'dostSPs' => ['Priority 2: Information and Communications Technology', 'Priority 4: Social Sciences and Humanities'],
                'sustainableDevelopmentGoals' => ['SDG 11: Sustainable Cities and Communities', 'SDG 9: Industry, Innovation and Infrastructure'],
                'proposedBudget' => 1800000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Urban Planning', 'Smart Cities', 'Infrastructure Development', 'Digital Integration'],
                    'dostSPs' => ['Priority 2: Information and Communications Technology', 'Priority 4: Social Sciences and Humanities'],
                    'sustainableDevelopmentGoals' => ['SDG 11: Sustainable Cities and Communities', 'SDG 9: Industry, Innovation and Infrastructure'],
                    'proposedBudget' => 1800000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(4),
                'statusID' => $underReview->statusID,
                'userID' => $alejandroVega->userID // Urban Center proponent
            ],
            [
                'researchTitle' => 'Digital Innovation Hub for Davao Region Startups',
                'description' => 'This project establishes a digital innovation hub to support startups and entrepreneurs in the Davao Region, providing resources, mentorship, and technology infrastructure.',
                'objectives' => '1. Establish physical innovation hub space\n2. Develop startup support programs\n3. Create mentorship networks\n4. Provide technology resources\n5. Measure startup success and impact',
                'researchCenter' => 'Center for Digital Innovation and Technology',
                'researchAgenda' => ['Digital Innovation', 'Entrepreneurship', 'Technology Transfer', 'Startup Ecosystem'],
                'dostSPs' => ['Priority 2: Information and Communications Technology', 'Priority 4: Social Sciences and Humanities'],
                'sustainableDevelopmentGoals' => ['SDG 8: Decent Work and Economic Growth', 'SDG 9: Industry, Innovation and Infrastructure'],
                'proposedBudget' => 2000000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Digital Innovation', 'Entrepreneurship', 'Technology Transfer', 'Startup Ecosystem'],
                    'dostSPs' => ['Priority 2: Information and Communications Technology', 'Priority 4: Social Sciences and Humanities'],
                    'sustainableDevelopmentGoals' => ['SDG 8: Decent Work and Economic Growth', 'SDG 9: Industry, Innovation and Infrastructure'],
                    'proposedBudget' => 2000000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(2),
                'statusID' => $ongoing->statusID,
                'userID' => $beatrizRomero->userID // Digital Center proponent
            ],
            [
                'researchTitle' => 'Social Impact Assessment of Development Projects in Mindanao',
                'description' => 'This research develops a comprehensive framework for assessing the social impact of development projects in Mindanao, ensuring community benefits and sustainable outcomes.',
                'objectives' => '1. Develop social impact assessment framework\n2. Test framework with existing projects\n3. Train assessors and evaluators\n4. Create reporting and monitoring systems\n5. Evaluate framework effectiveness',
                'researchCenter' => 'Center for Social Sciences and Humanities Research',
                'researchAgenda' => ['Social Impact Assessment', 'Development Studies', 'Community Research', 'Policy Analysis'],
                'dostSPs' => ['Priority 4: Social Sciences and Humanities', 'Priority 1: Agriculture, Aquatic and Natural Resources'],
                'sustainableDevelopmentGoals' => ['SDG 10: Reduced Inequalities', 'SDG 16: Peace, Justice and Strong Institutions'],
                'proposedBudget' => 900000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Social Impact Assessment', 'Development Studies', 'Community Research', 'Policy Analysis'],
                    'dostSPs' => ['Priority 4: Social Sciences and Humanities', 'Priority 1: Agriculture, Aquatic and Natural Resources'],
                    'sustainableDevelopmentGoals' => ['SDG 10: Reduced Inequalities', 'SDG 16: Peace, Justice and Strong Institutions'],
                    'proposedBudget' => 900000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(8),
                'statusID' => $completed->statusID,
                'userID' => $danielNavarro->userID // Social Center proponent
            ],
            [
                'researchTitle' => 'Sustainable Development Goals Implementation Framework for Davao Region',
                'description' => 'This research creates a comprehensive framework for implementing and monitoring Sustainable Development Goals (SDGs) in the Davao Region, ensuring coordinated and effective progress.',
                'objectives' => '1. Analyze current SDG implementation in Davao Region\n2. Develop integrated implementation framework\n3. Create monitoring and evaluation systems\n4. Train stakeholders on SDG implementation\n5. Establish regional SDG coordination mechanisms',
                'researchCenter' => 'Center for Sustainable Development Studies',
                'researchAgenda' => ['Sustainable Development', 'SDG Implementation', 'Regional Planning', 'Policy Coordination'],
                'dostSPs' => ['Priority 4: Social Sciences and Humanities', 'Priority 1: Agriculture, Aquatic and Natural Resources'],
                'sustainableDevelopmentGoals' => ['SDG 17: Partnerships for the Goals', 'SDG 11: Sustainable Cities and Communities'],
                'proposedBudget' => 1600000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Sustainable Development', 'SDG Implementation', 'Regional Planning', 'Policy Coordination'],
                    'dostSPs' => ['Priority 4: Social Sciences and Humanities', 'Priority 1: Agriculture, Aquatic and Natural Resources'],
                    'sustainableDevelopmentGoals' => ['SDG 17: Partnerships for the Goals', 'SDG 11: Sustainable Cities and Communities'],
                    'proposedBudget' => 1600000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(11),
                'statusID' => $approved->statusID,
                'userID' => $marianaPerez->userID // Sustainable Center proponent
            ],
        ];

        foreach ($proposals as $proposalData) {
            // Check if proposal already exists by title
            $existingProposal = Proposal::where('researchTitle', $proposalData['researchTitle'])->first();
            
            if (!$existingProposal) {
                Proposal::create($proposalData);
                $this->command->info("Created proposal: {$proposalData['researchTitle']}");
            } else {
                $this->command->info("Proposal '{$proposalData['researchTitle']}' already exists, skipping...");
            }
        }

        $this->command->info('Additional proposal seeding completed successfully!');
    }
}
