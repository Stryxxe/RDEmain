<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Proposal;
use App\Models\User;
use App\Models\Status;
use Carbon\Carbon;

class ProposalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the proponent user
        $proponent = User::where('email', 'proponent@usep.edu.ph')->first();
        
        if (!$proponent) {
            $this->command->error('Proponent user not found. Please run UserSeeder first.');
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
                'researchTitle' => 'Development of Smart Irrigation System for Sustainable Agriculture in Davao Region',
                'description' => 'This research aims to develop an IoT-based smart irrigation system that optimizes water usage for agricultural crops in the Davao Region. The system will integrate soil moisture sensors, weather data, and automated irrigation controls to improve crop yield while conserving water resources.',
                'objectives' => '1. Design and develop an IoT-based smart irrigation system\n2. Implement machine learning algorithms for water optimization\n3. Test the system in local agricultural settings\n4. Evaluate water savings and crop yield improvements\n5. Create a user-friendly mobile application for farmers',
                'researchCenter' => 'Center for Information and Communications Technology',
                'researchAgenda' => [
                    'Agricultural Technology',
                    'Internet of Things (IoT)',
                    'Sustainable Development',
                    'Smart Agriculture'
                ],
                'dostSPs' => [
                    'Priority 1: Agriculture, Aquatic and Natural Resources',
                    'Priority 2: Information and Communications Technology'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 2: Zero Hunger',
                    'SDG 6: Clean Water and Sanitation',
                    'SDG 9: Industry, Innovation and Infrastructure',
                    'SDG 12: Responsible Consumption and Production'
                ],
                'proposedBudget' => 850000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Agricultural Technology', 'Internet of Things (IoT)', 'Sustainable Development', 'Smart Agriculture'],
                    'dostSPs' => ['Priority 1: Agriculture, Aquatic and Natural Resources', 'Priority 2: Information and Communications Technology'],
                    'sustainableDevelopmentGoals' => ['SDG 2: Zero Hunger', 'SDG 6: Clean Water and Sanitation', 'SDG 9: Industry, Innovation and Infrastructure', 'SDG 12: Responsible Consumption and Production'],
                    'proposedBudget' => 850000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(15),
                'statusID' => $underReview->statusID,
                'userID' => $proponent->userID
            ],
            [
                'researchTitle' => 'Assessment of Microplastic Contamination in Davao Gulf and Its Impact on Marine Biodiversity',
                'description' => 'This study will investigate the presence and distribution of microplastics in Davao Gulf, assess their impact on marine biodiversity, and develop strategies for mitigation. The research will contribute to understanding marine pollution in the region and support conservation efforts.',
                'objectives' => '1. Quantify microplastic concentration in Davao Gulf waters\n2. Identify sources of microplastic pollution\n3. Assess impact on marine organisms and biodiversity\n4. Develop community-based mitigation strategies\n5. Create awareness programs for local communities',
                'researchCenter' => 'Center for Environmental Studies and Research',
                'researchAgenda' => [
                    'Marine Biology',
                    'Environmental Science',
                    'Pollution Studies',
                    'Biodiversity Conservation'
                ],
                'dostSPs' => [
                    'Priority 1: Agriculture, Aquatic and Natural Resources',
                    'Priority 3: Health'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 14: Life Below Water',
                    'SDG 15: Life on Land',
                    'SDG 6: Clean Water and Sanitation'
                ],
                'proposedBudget' => 1200000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Marine Biology', 'Environmental Science', 'Pollution Studies', 'Biodiversity Conservation'],
                    'dostSPs' => ['Priority 1: Agriculture, Aquatic and Natural Resources', 'Priority 3: Health'],
                    'sustainableDevelopmentGoals' => ['SDG 14: Life Below Water', 'SDG 15: Life on Land', 'SDG 6: Clean Water and Sanitation'],
                    'proposedBudget' => 1200000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(8),
                'statusID' => $approved->statusID,
                'userID' => $proponent->userID
            ],
            [
                'researchTitle' => 'Development of Indigenous Language Learning Mobile Application for Mindanao Languages',
                'description' => 'This project focuses on creating a comprehensive mobile application for learning indigenous languages of Mindanao, particularly those spoken in the Davao Region. The app will include interactive lessons, cultural context, and community engagement features to preserve and promote local languages.',
                'objectives' => '1. Document and digitize indigenous languages of Mindanao\n2. Develop interactive learning modules\n3. Create cultural context integration\n4. Implement community participation features\n5. Test effectiveness with target communities',
                'researchCenter' => 'Center for Indigenous Studies and Cultural Heritage',
                'researchAgenda' => [
                    'Indigenous Studies',
                    'Language Preservation',
                    'Educational Technology',
                    'Cultural Heritage'
                ],
                'dostSPs' => [
                    'Priority 2: Information and Communications Technology',
                    'Priority 4: Social Sciences and Humanities'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 4: Quality Education',
                    'SDG 10: Reduced Inequalities',
                    'SDG 11: Sustainable Cities and Communities'
                ],
                'proposedBudget' => 650000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Indigenous Studies', 'Language Preservation', 'Educational Technology', 'Cultural Heritage'],
                    'dostSPs' => ['Priority 2: Information and Communications Technology', 'Priority 4: Social Sciences and Humanities'],
                    'sustainableDevelopmentGoals' => ['SDG 4: Quality Education', 'SDG 10: Reduced Inequalities', 'SDG 11: Sustainable Cities and Communities'],
                    'proposedBudget' => 650000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(25),
                'statusID' => $ongoing->statusID,
                'userID' => $proponent->userID
            ],
            [
                'researchTitle' => 'Renewable Energy Integration in Off-Grid Communities of Davao Oriental',
                'description' => 'This research aims to develop and implement renewable energy solutions for off-grid communities in Davao Oriental. The study will focus on solar and wind energy systems, energy storage solutions, and community-based energy management systems.',
                'objectives' => '1. Assess energy needs of off-grid communities\n2. Design hybrid renewable energy systems\n3. Implement pilot projects in selected communities\n4. Train local technicians for system maintenance\n5. Evaluate economic and social impacts',
                'researchCenter' => 'Center for Renewable Energy and Sustainability',
                'researchAgenda' => [
                    'Renewable Energy',
                    'Rural Development',
                    'Energy Systems',
                    'Community Development'
                ],
                'dostSPs' => [
                    'Priority 1: Agriculture, Aquatic and Natural Resources',
                    'Priority 2: Information and Communications Technology'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 7: Affordable and Clean Energy',
                    'SDG 11: Sustainable Cities and Communities',
                    'SDG 1: No Poverty'
                ],
                'proposedBudget' => 1500000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Renewable Energy', 'Rural Development', 'Energy Systems', 'Community Development'],
                    'dostSPs' => ['Priority 1: Agriculture, Aquatic and Natural Resources', 'Priority 2: Information and Communications Technology'],
                    'sustainableDevelopmentGoals' => ['SDG 7: Affordable and Clean Energy', 'SDG 11: Sustainable Cities and Communities', 'SDG 1: No Poverty'],
                    'proposedBudget' => 1500000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(5),
                'statusID' => $rejected->statusID,
                'userID' => $proponent->userID
            ],
            [
                'researchTitle' => 'Digital Health Monitoring System for Elderly Care in Davao City',
                'description' => 'This project develops a comprehensive digital health monitoring system specifically designed for elderly care in Davao City. The system will include wearable devices, health data analytics, and telemedicine capabilities to improve healthcare access for senior citizens.',
                'objectives' => '1. Develop wearable health monitoring devices\n2. Create health data analytics platform\n3. Implement telemedicine consultation features\n4. Design caregiver notification system\n5. Conduct pilot testing with elderly participants',
                'researchCenter' => 'Center for Health Informatics and Telemedicine',
                'researchAgenda' => [
                    'Health Informatics',
                    'Geriatric Care',
                    'Telemedicine',
                    'Wearable Technology'
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
                    'researchAgenda' => ['Health Informatics', 'Geriatric Care', 'Telemedicine', 'Wearable Technology'],
                    'dostSPs' => ['Priority 3: Health', 'Priority 2: Information and Communications Technology'],
                    'sustainableDevelopmentGoals' => ['SDG 3: Good Health and Well-being', 'SDG 10: Reduced Inequalities', 'SDG 9: Industry, Innovation and Infrastructure'],
                    'proposedBudget' => 1100000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(12),
                'statusID' => $completed->statusID,
                'userID' => $proponent->userID
            ],
            [
                'researchTitle' => 'Sustainable Tourism Development Framework for Davao Region Heritage Sites',
                'description' => 'This research develops a comprehensive framework for sustainable tourism development focusing on heritage sites in the Davao Region. The study will assess current tourism impacts, develop sustainable practices, and create community-based tourism models.',
                'objectives' => '1. Inventory and assess heritage sites in Davao Region\n2. Analyze current tourism impacts and challenges\n3. Develop sustainable tourism guidelines\n4. Create community engagement strategies\n5. Implement pilot sustainable tourism programs',
                'researchCenter' => 'Center for Tourism and Hospitality Studies',
                'researchAgenda' => [
                    'Sustainable Tourism',
                    'Heritage Conservation',
                    'Community Development',
                    'Cultural Studies'
                ],
                'dostSPs' => [
                    'Priority 4: Social Sciences and Humanities',
                    'Priority 1: Agriculture, Aquatic and Natural Resources'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 8: Decent Work and Economic Growth',
                    'SDG 11: Sustainable Cities and Communities',
                    'SDG 12: Responsible Consumption and Production'
                ],
                'proposedBudget' => 750000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Sustainable Tourism', 'Heritage Conservation', 'Community Development', 'Cultural Studies'],
                    'dostSPs' => ['Priority 4: Social Sciences and Humanities', 'Priority 1: Agriculture, Aquatic and Natural Resources'],
                    'sustainableDevelopmentGoals' => ['SDG 8: Decent Work and Economic Growth', 'SDG 11: Sustainable Cities and Communities', 'SDG 12: Responsible Consumption and Production'],
                    'proposedBudget' => 750000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(3),
                'statusID' => $underReview->statusID,
                'userID' => $proponent->userID
            ],
            [
                'researchTitle' => 'Machine Learning-Based Early Warning System for Landslide Prediction in Davao Region',
                'description' => 'This research develops an advanced early warning system for landslide prediction using machine learning algorithms and real-time environmental data. The system will help protect communities in landslide-prone areas of the Davao Region.',
                'objectives' => '1. Collect and analyze historical landslide data\n2. Develop machine learning prediction models\n3. Integrate real-time environmental sensors\n4. Create early warning notification system\n5. Test system accuracy and reliability',
                'researchCenter' => 'Center for Disaster Risk Reduction and Management',
                'researchAgenda' => [
                    'Disaster Risk Reduction',
                    'Machine Learning',
                    'Environmental Monitoring',
                    'Geological Studies'
                ],
                'dostSPs' => [
                    'Priority 2: Information and Communications Technology',
                    'Priority 1: Agriculture, Aquatic and Natural Resources'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 11: Sustainable Cities and Communities',
                    'SDG 13: Climate Action',
                    'SDG 9: Industry, Innovation and Infrastructure'
                ],
                'proposedBudget' => 1300000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Disaster Risk Reduction', 'Machine Learning', 'Environmental Monitoring', 'Geological Studies'],
                    'dostSPs' => ['Priority 2: Information and Communications Technology', 'Priority 1: Agriculture, Aquatic and Natural Resources'],
                    'sustainableDevelopmentGoals' => ['SDG 11: Sustainable Cities and Communities', 'SDG 13: Climate Action', 'SDG 9: Industry, Innovation and Infrastructure'],
                    'proposedBudget' => 1300000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(20),
                'statusID' => $approved->statusID,
                'userID' => $proponent->userID
            ],
            [
                'researchTitle' => 'Community-Based Waste Management System for Davao City Barangays',
                'description' => 'This study develops and implements a community-based waste management system for selected barangays in Davao City. The research will focus on waste segregation, recycling programs, and community engagement strategies to improve waste management practices.',
                'objectives' => '1. Assess current waste management practices in target barangays\n2. Develop community-based waste segregation programs\n3. Implement recycling and composting initiatives\n4. Train community waste management coordinators\n5. Evaluate program effectiveness and sustainability',
                'researchCenter' => 'Center for Environmental Studies and Research',
                'researchAgenda' => [
                    'Waste Management',
                    'Community Development',
                    'Environmental Education',
                    'Sustainable Practices'
                ],
                'dostSPs' => [
                    'Priority 1: Agriculture, Aquatic and Natural Resources',
                    'Priority 4: Social Sciences and Humanities'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 11: Sustainable Cities and Communities',
                    'SDG 12: Responsible Consumption and Production',
                    'SDG 6: Clean Water and Sanitation'
                ],
                'proposedBudget' => 600000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Waste Management', 'Community Development', 'Environmental Education', 'Sustainable Practices'],
                    'dostSPs' => ['Priority 1: Agriculture, Aquatic and Natural Resources', 'Priority 4: Social Sciences and Humanities'],
                    'sustainableDevelopmentGoals' => ['SDG 11: Sustainable Cities and Communities', 'SDG 12: Responsible Consumption and Production', 'SDG 6: Clean Water and Sanitation'],
                    'proposedBudget' => 600000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(7),
                'statusID' => $ongoing->statusID,
                'userID' => $proponent->userID
            ],
            [
                'researchTitle' => 'Development of Low-Cost Water Purification System for Rural Communities',
                'description' => 'This research focuses on developing an affordable and effective water purification system for rural communities in the Davao Region. The system will use locally available materials and renewable energy sources to provide clean drinking water.',
                'objectives' => '1. Design low-cost water purification system\n2. Test system effectiveness with local water sources\n3. Train community members on system operation\n4. Implement pilot projects in selected communities\n5. Evaluate health and economic impacts',
                'researchCenter' => 'Center for Water Resources and Environmental Engineering',
                'researchAgenda' => [
                    'Water Treatment',
                    'Rural Development',
                    'Public Health',
                    'Appropriate Technology'
                ],
                'dostSPs' => [
                    'Priority 1: Agriculture, Aquatic and Natural Resources',
                    'Priority 3: Health'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 6: Clean Water and Sanitation',
                    'SDG 3: Good Health and Well-being',
                    'SDG 1: No Poverty'
                ],
                'proposedBudget' => 900000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Water Treatment', 'Rural Development', 'Public Health', 'Appropriate Technology'],
                    'dostSPs' => ['Priority 1: Agriculture, Aquatic and Natural Resources', 'Priority 3: Health'],
                    'sustainableDevelopmentGoals' => ['SDG 6: Clean Water and Sanitation', 'SDG 3: Good Health and Well-being', 'SDG 1: No Poverty'],
                    'proposedBudget' => 900000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(1),
                'statusID' => $underReview->statusID,
                'userID' => $proponent->userID
            ],
            [
                'researchTitle' => 'Digital Literacy Program for Senior Citizens in Davao City',
                'description' => 'This project develops and implements a comprehensive digital literacy program specifically designed for senior citizens in Davao City. The program will help elderly individuals adapt to digital technologies and improve their quality of life.',
                'objectives' => '1. Assess digital literacy needs of senior citizens\n2. Develop age-appropriate learning modules\n3. Train volunteer instructors from the community\n4. Implement pilot programs in selected areas\n5. Evaluate program impact and effectiveness',
                'researchCenter' => 'Center for Community Development and Social Services',
                'researchAgenda' => [
                    'Digital Literacy',
                    'Geriatric Studies',
                    'Community Education',
                    'Social Inclusion'
                ],
                'dostSPs' => [
                    'Priority 4: Social Sciences and Humanities',
                    'Priority 2: Information and Communications Technology'
                ],
                'sustainableDevelopmentGoals' => [
                    'SDG 4: Quality Education',
                    'SDG 10: Reduced Inequalities',
                    'SDG 11: Sustainable Cities and Communities'
                ],
                'proposedBudget' => 450000.00,
                'matrixOfCompliance' => [
                    'researchAgenda' => ['Digital Literacy', 'Geriatric Studies', 'Community Education', 'Social Inclusion'],
                    'dostSPs' => ['Priority 4: Social Sciences and Humanities', 'Priority 2: Information and Communications Technology'],
                    'sustainableDevelopmentGoals' => ['SDG 4: Quality Education', 'SDG 10: Reduced Inequalities', 'SDG 11: Sustainable Cities and Communities'],
                    'proposedBudget' => 450000.00
                ],
                'uploadedAt' => Carbon::now()->subDays(18),
                'statusID' => $completed->statusID,
                'userID' => $proponent->userID
            ]
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

        $this->command->info('Proposal seeding completed successfully!');
    }
}

