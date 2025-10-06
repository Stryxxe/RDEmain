<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        // Get roles
        $adminRole = Role::where('userRole', 'Admin')->first();
        $rddRole = Role::where('userRole', 'RDD')->first();
        $cmRole = Role::where('userRole', 'CM')->first();
        $proponentRole = Role::where('userRole', 'Proponent')->first();
        $opRole = Role::where('userRole', 'OP')->first();
        $osuurRole = Role::where('userRole', 'OSUORU')->first();
        $reviewerRole = Role::where('userRole', 'Reviewer')->first();

        // Get departments
        $opDept = Department::where('name', 'Office of the President')->first();
        $rddDept = Department::where('name', 'Research and Development Division')->first();
        $academicDept = Department::where('name', 'Academic Affairs')->first();
        $osuurDept = Department::where('name', 'Office of Student Affairs and University Relations Unit')->first();
        $cmDept = Department::where('name', 'College of Medicine')->first() 
                 ?? Department::where('name', 'College of Technology')->first();
        $engineeringDept = Department::where('name', 'College of Engineering')->first();
        $educationDept = Department::where('name', 'College of Education')->first();
        $artsDept = Department::where('name', 'College of Arts and Sciences')->first();
        $businessDept = Department::where('name', 'College of Business Administration')->first();
        $agricultureDept = Department::where('name', 'College of Agriculture')->first() 
                          ?? Department::where('name', 'College of Applied Economics')->first();
        $nursingDept = Department::where('name', 'College of Nursing')->first() 
                      ?? Department::where('name', 'College of Technology')->first();
        $computerDept = Department::where('name', 'College of Computer Studies')->first() 
                       ?? Department::where('name', 'College of Information and Computing')->first();
        
        // Research Centers - Use existing departments as fallback
        $ictCenter = Department::where('name', 'Center for Information and Communications Technology')->first() 
                    ?? Department::where('name', 'College of Information and Computing')->first();
        $envCenter = Department::where('name', 'Center for Environmental Studies and Research')->first() 
                    ?? Department::where('name', 'College of Technology')->first();
        $indigenousCenter = Department::where('name', 'Center for Indigenous Studies and Cultural Heritage')->first() 
                           ?? Department::where('name', 'College of Arts and Sciences')->first();
        $renewableCenter = Department::where('name', 'Center for Renewable Energy and Sustainability')->first() 
                          ?? Department::where('name', 'College of Technology')->first();
        $healthCenter = Department::where('name', 'Center for Health Informatics and Telemedicine')->first() 
                       ?? Department::where('name', 'College of Technology')->first();
        $tourismCenter = Department::where('name', 'Center for Tourism and Hospitality Studies')->first() 
                        ?? Department::where('name', 'College of Business Administration')->first();
        $disasterCenter = Department::where('name', 'Center for Disaster Risk Reduction and Management')->first() 
                         ?? Department::where('name', 'College of Technology')->first();
        $waterCenter = Department::where('name', 'Center for Water Resources and Environmental Engineering')->first() 
                      ?? Department::where('name', 'College of Engineering')->first();
        $communityCenter = Department::where('name', 'Center for Community Development and Social Services')->first() 
                          ?? Department::where('name', 'College of Applied Economics')->first();
        $eduTechCenter = Department::where('name', 'Center for Educational Technology and Innovation')->first() 
                        ?? Department::where('name', 'College of Education')->first();
        $culturalCenter = Department::where('name', 'Center for Cultural Studies and Heritage Preservation')->first() 
                         ?? Department::where('name', 'College of Arts and Sciences')->first();
        $telemedicineCenter = Department::where('name', 'Center for Telemedicine and Digital Health')->first() 
                             ?? Department::where('name', 'College of Technology')->first();
        $nutritionCenter = Department::where('name', 'Center for Public Health and Nutrition')->first() 
                          ?? Department::where('name', 'College of Technology')->first();
        $materialsCenter = Department::where('name', 'Center for Materials Science and Engineering')->first() 
                          ?? Department::where('name', 'College of Engineering')->first();
        $agricultureCenter = Department::where('name', 'Center for Agricultural Research and Development')->first() 
                            ?? Department::where('name', 'College of Applied Economics')->first();
        $marineCenter = Department::where('name', 'Center for Marine Biology and Oceanography')->first() 
                       ?? Department::where('name', 'College of Arts and Sciences')->first();
        $urbanCenter = Department::where('name', 'Center for Urban Planning and Development')->first() 
                      ?? Department::where('name', 'College of Engineering')->first();
        $digitalCenter = Department::where('name', 'Center for Digital Innovation and Technology')->first() 
                        ?? Department::where('name', 'College of Information and Computing')->first();
        $socialCenter = Department::where('name', 'Center for Social Sciences and Humanities Research')->first() 
                       ?? Department::where('name', 'College of Arts and Sciences')->first();
        $sustainableCenter = Department::where('name', 'Center for Sustainable Development Studies')->first() 
                            ?? Department::where('name', 'College of Applied Economics')->first();

        // Create users for each role and department
        $users = [
            // Administrative Users
            [
                'firstName' => 'Dr. Maria Elena',
                'lastName' => 'Reyes',
                'email' => 'admin@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $opDept->departmentID,
                'userRolesID' => $adminRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Roberto',
                'lastName' => 'Santos',
                'email' => 'rdd@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $rddDept->departmentID,
                'userRolesID' => $rddRole->userRoleID,
            ],
            
            [
                'firstName' => 'Prof. Michael',
                'lastName' => 'Cruz',
                'email' => 'op@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $opDept->departmentID,
                'userRolesID' => $opRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Lisa',
                'lastName' => 'Gonzales',
                'email' => 'osuur@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $osuurDept->departmentID,
                'userRolesID' => $osuurRole->userRoleID,
            ],
            
            // Center Managers for different research centers
            [
                'firstName' => 'Dr. Jennifer',
                'lastName' => 'Martinez',
                'email' => 'cm-ict@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $ictCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Maria',
                'lastName' => 'Santos',
                'email' => 'cm-academic@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $academicDept->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Carlos',
                'lastName' => 'Ramos',
                'email' => 'cm-environment@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $envCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Ana',
                'lastName' => 'Torres',
                'email' => 'cm-indigenous@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $indigenousCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Miguel',
                'lastName' => 'Fernandez',
                'email' => 'cm-renewable@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $renewableCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Patricia',
                'lastName' => 'Lopez',
                'email' => 'cm-health@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $healthCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Antonio',
                'lastName' => 'Rivera',
                'email' => 'cm-tourism@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $tourismCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Carmen',
                'lastName' => 'Villanueva',
                'email' => 'cm-disaster@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $disasterCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Eduardo',
                'lastName' => 'Mendoza',
                'email' => 'cm-water@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $waterCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Sofia',
                'lastName' => 'Herrera',
                'email' => 'cm-community@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $communityCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Rafael',
                'lastName' => 'Castillo',
                'email' => 'cm-edutech@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $eduTechCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Isabel',
                'lastName' => 'Morales',
                'email' => 'cm-cultural@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $culturalCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Francisco',
                'lastName' => 'Jimenez',
                'email' => 'cm-telemedicine@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $telemedicineCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Elena',
                'lastName' => 'Diaz',
                'email' => 'cm-nutrition@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $nutritionCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Gabriel',
                'lastName' => 'Ortega',
                'email' => 'cm-materials@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $materialsCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Victoria',
                'lastName' => 'Silva',
                'email' => 'cm-agriculture@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $agricultureCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Alejandro',
                'lastName' => 'Vega',
                'email' => 'cm-marine@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $marineCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Beatriz',
                'lastName' => 'Romero',
                'email' => 'cm-urban@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $urbanCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Daniel',
                'lastName' => 'Navarro',
                'email' => 'cm-digital@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $digitalCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Mariana',
                'lastName' => 'Perez',
                'email' => 'cm-social@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $socialCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Ricardo',
                'lastName' => 'Gutierrez',
                'email' => 'cm-sustainable@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $sustainableCenter->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            // Proponents from different departments and research centers
            [
                'firstName' => 'Dr. Sarah',
                'lastName' => 'Johnson',
                'email' => 'sarah.johnson@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $ictCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Maria',
                'lastName' => 'Cruz',
                'email' => 'maria.cruz@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $envCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Prof. Juan',
                'lastName' => 'Santos',
                'email' => 'juan.santos@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $indigenousCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Ana',
                'lastName' => 'Reyes',
                'email' => 'ana.reyes@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $renewableCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Carlos',
                'lastName' => 'Mendoza',
                'email' => 'carlos.mendoza@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $healthCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Elena',
                'lastName' => 'Torres',
                'email' => 'elena.torres@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $tourismCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Roberto',
                'lastName' => 'Garcia',
                'email' => 'roberto.garcia@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $disasterCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Patricia',
                'lastName' => 'Lopez',
                'email' => 'patricia.lopez@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $waterCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Miguel',
                'lastName' => 'Fernandez',
                'email' => 'miguel.fernandez@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $communityCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Sofia',
                'lastName' => 'Herrera',
                'email' => 'sofia.herrera@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $eduTechCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Rafael',
                'lastName' => 'Castillo',
                'email' => 'rafael.castillo@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $culturalCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Isabel',
                'lastName' => 'Morales',
                'email' => 'isabel.morales@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $telemedicineCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Francisco',
                'lastName' => 'Jimenez',
                'email' => 'francisco.jimenez@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $nutritionCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Elena',
                'lastName' => 'Diaz',
                'email' => 'elena.diaz@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $materialsCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Gabriel',
                'lastName' => 'Ortega',
                'email' => 'gabriel.ortega@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $agricultureCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Victoria',
                'lastName' => 'Silva',
                'email' => 'victoria.silva@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $marineCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Alejandro',
                'lastName' => 'Vega',
                'email' => 'alejandro.vega@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $urbanCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Beatriz',
                'lastName' => 'Romero',
                'email' => 'beatriz.romero@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $digitalCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Daniel',
                'lastName' => 'Navarro',
                'email' => 'daniel.navarro@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $socialCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Mariana',
                'lastName' => 'Perez',
                'email' => 'mariana.perez@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $sustainableCenter->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            // Additional proponents from academic colleges
            [
                'firstName' => 'Dr. Ricardo',
                'lastName' => 'Gutierrez',
                'email' => 'ricardo.gutierrez@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $cmDept->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Prof. Carmen',
                'lastName' => 'Villanueva',
                'email' => 'carmen.villanueva@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $engineeringDept->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Eduardo',
                'lastName' => 'Mendoza',
                'email' => 'eduardo.mendoza@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $educationDept->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Antonio',
                'lastName' => 'Rivera',
                'email' => 'antonio.rivera@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $artsDept->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Carmen',
                'lastName' => 'Lopez',
                'email' => 'carmen.lopez@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $businessDept->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Luis',
                'lastName' => 'Martinez',
                'email' => 'luis.martinez@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $agricultureDept->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Rosa',
                'lastName' => 'Gonzales',
                'email' => 'rosa.gonzales@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $nursingDept->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Jose',
                'lastName' => 'Ramirez',
                'email' => 'jose.ramirez@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $computerDept->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            // Reviewers from different departments
            [
                'firstName' => 'Dr. James',
                'lastName' => 'Miller',
                'email' => 'james.miller@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $academicDept->departmentID,
                'userRolesID' => $reviewerRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Susan',
                'lastName' => 'Wilson',
                'email' => 'susan.wilson@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $rddDept->departmentID,
                'userRolesID' => $reviewerRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. David',
                'lastName' => 'Brown',
                'email' => 'david.brown@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $ictCenter->departmentID,
                'userRolesID' => $reviewerRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Linda',
                'lastName' => 'Davis',
                'email' => 'linda.davis@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $envCenter->departmentID,
                'userRolesID' => $reviewerRole->userRoleID,
            ],
            
            [
                'firstName' => 'Dr. Robert',
                'lastName' => 'Taylor',
                'email' => 'robert.taylor@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $healthCenter->departmentID,
                'userRolesID' => $reviewerRole->userRoleID,
            ],
        ];

        foreach ($users as $userData) {
            // Check if user already exists by email
            $existingUser = User::where('email', $userData['email'])->first();
            
            if (!$existingUser) {
                User::create($userData);
                $this->command->info("Created user: {$userData['firstName']} {$userData['lastName']} ({$userData['email']})");
            } else {
                $this->command->info("User with email {$userData['email']} already exists, skipping...");
            }
        }
    }
}
