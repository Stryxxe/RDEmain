<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Proposal;
use App\Models\User;
use App\Models\Status;
use Carbon\Carbon;

class SarahJohnsonProposalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get Sarah Johnson user
        $sarahJohnson = User::where('email', 'sarah.johnson@usep.edu.ph')->first();
        
        if (!$sarahJohnson) {
            $this->command->error('Sarah Johnson user not found. Please run UserSeeder first.');
            return;
        }

        // Get statuses
        $underReview = Status::where('statusName', 'Under Review')->first();
        $approved = Status::where('statusName', 'Approved')->first();
        $rejected = Status::where('statusName', 'Rejected')->first();
        $ongoing = Status::where('statusName', 'Ongoing')->first();
        $completed = Status::where('statusName', 'Completed')->first();

        $proposals = [
            [
                'researchTitle' => 'AI-Powered Educational Assessment System for Philippine Universities',
                'description' => 'This research develops an artificial intelligence-powered educational assessment system specifically designed for Philippine universities. The system will use machine learning algorithms to provide personalized learning assessments, automated grading, and learning analytics to improve educational outcomes.',
                'objectives' => '1. Develop AI algorithms for educational assessment\n2. Create automated grading system for various subjects\n3. Implement learning analytics dashboard\n4. Test system with university students and faculty\n5. Evaluate impact on learning outcomes and teaching efficiency',
                'researchCenter' => 'Center for Information and Communications Technology',
                'researchAgenda' => [
                    'Artificial Intelligence',
                    'Educational Technology',
                    'Learning Analytics',
                    'Assessment Systems'
                ],
                'dostSPs' => [
                    'Priority 2: Information and Communications Technology',
                    'Priority 4: Social Sciences and Humanities'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 4: Quality Education',
                    'SDG 9: Industry, Innovation and Infrastructure',
                    'SDG 10: Reduced Inequalities'
                ],
                'proposedBudget' => 1200000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Artificial Intelligence', 'Educational Technology', 'Learning Analytics', 'Assessment Systems'],
                    'dostSPs' => ['Priority 2: Information and Communications Technology', 'Priority 4: Social Sciences and Humanities'],
                    'sustainableDevelopmentGoals' => ['SDG 4: Quality Education', 'SDG 9: Industry, Innovation and Infrastructure', 'SDG 10: Reduced Inequalities'],
                    'proposedBudget' => 1200000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(2),
                'statusID' => $underReview->statusID,
                'userID' => $sarahJohnson->userID
            ],
            [
                'researchTitle' => 'Blockchain-Based Academic Credential Verification System',
                'description' => 'This project develops a blockchain-based system for verifying academic credentials in Philippine universities. The system will provide secure, tamper-proof digital certificates and transcripts, improving the credibility and efficiency of academic credential verification.',
                'objectives' => '1. Design blockchain architecture for credential verification\n2. Develop smart contracts for certificate issuance\n3. Create user-friendly interface for verification\n4. Implement security protocols and encryption\n5. Test system with partner universities and employers',
                'researchCenter' => 'Center for Information and Communications Technology',
                'researchAgenda' => [
                    'Blockchain Technology',
                    'Digital Security',
                    'Academic Credentials',
                    'Verification Systems'
                ],
                'dostSPs' => [
                    'Priority 2: Information and Communications Technology',
                    'Priority 4: Social Sciences and Humanities'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 4: Quality Education',
                    'SDG 9: Industry, Innovation and Infrastructure',
                    'SDG 16: Peace, Justice and Strong Institutions'
                ],
                'proposedBudget' => 950000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Blockchain Technology', 'Digital Security', 'Academic Credentials', 'Verification Systems'],
                    'dostSPs' => ['Priority 2: Information and Communications Technology', 'Priority 4: Social Sciences and Humanities'],
                    'sustainableDevelopmentGoals' => ['SDG 4: Quality Education', 'SDG 9: Industry, Innovation and Infrastructure', 'SDG 16: Peace, Justice and Strong Institutions'],
                    'proposedBudget' => 950000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(5),
                'statusID' => $approved->statusID,
                'userID' => $sarahJohnson->userID
            ],
            [
                'researchTitle' => 'IoT-Based Smart Campus Management System for Davao Universities',
                'description' => 'This research develops a comprehensive IoT-based smart campus management system for universities in Davao. The system will integrate various sensors and devices to monitor campus facilities, optimize energy usage, enhance security, and improve overall campus operations.',
                'objectives' => '1. Deploy IoT sensors across campus facilities\n2. Develop centralized management platform\n3. Implement energy monitoring and optimization\n4. Create security and safety monitoring systems\n5. Train campus staff on system operation and maintenance',
                'researchCenter' => 'Center for Information and Communications Technology',
                'researchAgenda' => [
                    'Internet of Things (IoT)',
                    'Smart Campus',
                    'Energy Management',
                    'Campus Security'
                ],
                'dostSPs' => [
                    'Priority 2: Information and Communications Technology',
                    'Priority 1: Agriculture, Aquatic and Natural Resources'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 9: Industry, Innovation and Infrastructure',
                    'SDG 11: Sustainable Cities and Communities',
                    'SDG 7: Affordable and Clean Energy'
                ],
                'proposedBudget' => 1800000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Internet of Things (IoT)', 'Smart Campus', 'Energy Management', 'Campus Security'],
                    'dostSPs' => ['Priority 2: Information and Communications Technology', 'Priority 1: Agriculture, Aquatic and Natural Resources'],
                    'sustainableDevelopmentGoals' => ['SDG 9: Industry, Innovation and Infrastructure', 'SDG 11: Sustainable Cities and Communities', 'SDG 7: Affordable and Clean Energy'],
                    'proposedBudget' => 1800000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(8),
                'statusID' => $ongoing->statusID,
                'userID' => $sarahJohnson->userID
            ],
            [
                'researchTitle' => 'Mobile Health Application for Chronic Disease Management in Davao Region',
                'description' => 'This project develops a comprehensive mobile health application specifically designed for chronic disease management in the Davao Region. The app will help patients track their health metrics, manage medications, and communicate with healthcare providers.',
                'objectives' => '1. Develop mobile health application for chronic disease management\n2. Integrate health monitoring features and medication reminders\n3. Create patient-provider communication platform\n4. Implement data analytics for health insights\n5. Test application with patients and healthcare providers',
                'researchCenter' => 'Center for Information and Communications Technology',
                'researchAgenda' => [
                    'Mobile Health (mHealth)',
                    'Chronic Disease Management',
                    'Health Informatics',
                    'Patient Care'
                ],
                'dostSPs' => [
                    'Priority 3: Health',
                    'Priority 2: Information and Communications Technology'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 3: Good Health and Well-being',
                    'SDG 10: Reduced Inequalities',
                    'SDG 9: Industry, Innovation and Infrastructure'
                ],
                'proposedBudget' => 1100000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Mobile Health (mHealth)', 'Chronic Disease Management', 'Health Informatics', 'Patient Care'],
                    'dostSPs' => ['Priority 3: Health', 'Priority 2: Information and Communications Technology'],
                    'sustainableDevelopmentGoals' => ['SDG 3: Good Health and Well-being', 'SDG 10: Reduced Inequalities', 'SDG 9: Industry, Innovation and Infrastructure'],
                    'proposedBudget' => 1100000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(12),
                'statusID' => $completed->statusID,
                'userID' => $sarahJohnson->userID
            ],
            [
                'researchTitle' => 'Cybersecurity Framework for Small and Medium Enterprises in Davao',
                'description' => 'This research develops a comprehensive cybersecurity framework specifically tailored for small and medium enterprises (SMEs) in Davao. The framework will provide affordable, practical cybersecurity solutions to protect local businesses from cyber threats.',
                'objectives' => '1. Assess cybersecurity needs of Davao SMEs\n2. Develop affordable cybersecurity framework\n3. Create training programs for SME staff\n4. Implement pilot cybersecurity solutions\n5. Evaluate framework effectiveness and business impact',
                'researchCenter' => 'Center for Information and Communications Technology',
                'researchAgenda' => [
                    'Cybersecurity',
                    'Small and Medium Enterprises',
                    'Digital Security',
                    'Business Protection'
                ],
                'dostSPs' => [
                    'Priority 2: Information and Communications Technology',
                    'Priority 4: Social Sciences and Humanities'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 8: Decent Work and Economic Growth',
                    'SDG 9: Industry, Innovation and Infrastructure',
                    'SDG 16: Peace, Justice and Strong Institutions'
                ],
                'proposedBudget' => 750000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Cybersecurity', 'Small and Medium Enterprises', 'Digital Security', 'Business Protection'],
                    'dostSPs' => ['Priority 2: Information and Communications Technology', 'Priority 4: Social Sciences and Humanities'],
                    'sustainableDevelopmentGoals' => ['SDG 8: Decent Work and Economic Growth', 'SDG 9: Industry, Innovation and Infrastructure', 'SDG 16: Peace, Justice and Strong Institutions'],
                    'proposedBudget' => 750000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(15),
                'statusID' => $rejected->statusID,
                'userID' => $sarahJohnson->userID
            ],
            [
                'researchTitle' => 'Virtual Reality Learning Environment for Technical Skills Training',
                'description' => 'This project develops a virtual reality learning environment specifically designed for technical skills training in Philippine universities. The VR system will provide immersive, hands-on training experiences for students in engineering, medicine, and other technical fields.',
                'objectives' => '1. Develop VR learning modules for technical skills training\n2. Create immersive training scenarios for various disciplines\n3. Implement assessment and progress tracking features\n4. Train instructors on VR technology usage\n5. Evaluate learning effectiveness compared to traditional methods',
                'researchCenter' => 'Center for Information and Communications Technology',
                'researchAgenda' => [
                    'Virtual Reality (VR)',
                    'Technical Skills Training',
                    'Immersive Learning',
                    'Educational Technology'
                ],
                'dostSPs' => [
                    'Priority 2: Information and Communications Technology',
                    'Priority 4: Social Sciences and Humanities'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 4: Quality Education',
                    'SDG 9: Industry, Innovation and Infrastructure',
                    'SDG 10: Reduced Inequalities'
                ],
                'proposedBudget' => 1500000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Virtual Reality (VR)', 'Technical Skills Training', 'Immersive Learning', 'Educational Technology'],
                    'dostSPs' => ['Priority 2: Information and Communications Technology', 'Priority 4: Social Sciences and Humanities'],
                    'sustainableDevelopmentGoals' => ['SDG 4: Quality Education', 'SDG 9: Industry, Innovation and Infrastructure', 'SDG 10: Reduced Inequalities'],
                    'proposedBudget' => 1500000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(1),
                'statusID' => $underReview->statusID,
                'userID' => $sarahJohnson->userID
            ],
            [
                'researchTitle' => 'Data Analytics Platform for Agricultural Decision Support in Mindanao',
                'description' => 'This research develops a comprehensive data analytics platform to support agricultural decision-making in Mindanao. The platform will analyze weather data, soil conditions, market trends, and crop performance to provide farmers with actionable insights for improved agricultural productivity.',
                'objectives' => '1. Collect and integrate agricultural data from various sources\n2. Develop machine learning models for crop prediction\n3. Create user-friendly dashboard for farmers\n4. Implement real-time weather and market data integration\n5. Test platform effectiveness with local farming communities',
                'researchCenter' => 'Center for Information and Communications Technology',
                'researchAgenda' => [
                    'Data Analytics',
                    'Agricultural Technology',
                    'Decision Support Systems',
                    'Machine Learning'
                ],
                'dostSPs' => [
                    'Priority 1: Agriculture, Aquatic and Natural Resources',
                    'Priority 2: Information and Communications Technology'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 2: Zero Hunger',
                    'SDG 9: Industry, Innovation and Infrastructure',
                    'SDG 12: Responsible Consumption and Production'
                ],
                'proposedBudget' => 1300000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Data Analytics', 'Agricultural Technology', 'Decision Support Systems', 'Machine Learning'],
                    'dostSPs' => ['Priority 1: Agriculture, Aquatic and Natural Resources', 'Priority 2: Information and Communications Technology'],
                    'sustainableDevelopmentGoals' => ['SDG 2: Zero Hunger', 'SDG 9: Industry, Innovation and Infrastructure', 'SDG 12: Responsible Consumption and Production'],
                    'proposedBudget' => 1300000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(6),
                'statusID' => $ongoing->statusID,
                'userID' => $sarahJohnson->userID
            ]
        ];

        foreach ($proposals as $proposalData) {
            // Check if proposal already exists by title
            $existingProposal = Proposal::where('researchTitle', $proposalData['researchTitle'])->first();
            
            if (!$existingProposal) {
                Proposal::create($proposalData);
                $this->command->info("Created Sarah Johnson's proposal: {$proposalData['researchTitle']}");
            } else {
                $this->command->info("Sarah Johnson's proposal '{$proposalData['researchTitle']}' already exists, skipping...");
            }
        }

        $this->command->info('Sarah Johnson proposal seeding completed successfully!');
    }
}
