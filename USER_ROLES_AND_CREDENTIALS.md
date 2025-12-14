# User Roles and Account Credentials

## System Roles Overview

This RDE Management System has **7 distinct roles** with different access levels and responsibilities.

---

## 🔐 Account Credentials by Role

### **1. Admin**
- **Email**: `boybawang141@gmail.com` (current) or `admin@usep.edu.ph`
- **Password**: `password`
- **Name**: Admin User
- **Description**: Full system access, manages all settings and users

---

### **2. RDD (Research Development Division)**
- **Email**: `rdd@usep.edu.ph`
- **Password**: `password`
- **Name**: Dr. Roberto Santos
- **Description**: Manages research proposals, reviews, and overall research development

---

### **3. OP (Office of the President)**
- **Email**: `op@usep.edu.ph`
- **Password**: `password`
- **Name**: Prof. Michael Cruz
- **Description**: Final approval authority for research proposals

---

### **4. OSUORU (Office of Student Affairs and University Relations)**
- **Email**: `osuur@usep.edu.ph`
- **Password**: `password`
- **Name**: Dr. Lisa Gonzales
- **Description**: Handles student and university relations aspects of research

---

### **5. CM (Center Manager)** - 21 accounts

**Sample Center Manager Accounts:**

| Email | Name | Research Center |
|-------|------|-----------------|
| cm-ict@usep.edu.ph | Dr. Jennifer Martinez | ICT Center |
| cm-academic@usep.edu.ph | Dr. Maria Santos | Academic Affairs |
| cm-environment@usep.edu.ph | Dr. Carlos Ramos | Environmental Studies |
| cm-indigenous@usep.edu.ph | Dr. Ana Torres | Indigenous Studies |
| cm-renewable@usep.edu.ph | Dr. Miguel Fernandez | Renewable Energy |
| cm-health@usep.edu.ph | Dr. Patricia Lopez | Health Informatics |
| cm-tourism@usep.edu.ph | Dr. Antonio Rivera | Tourism & Hospitality |
| cm-disaster@usep.edu.ph | Dr. Carmen Villanueva | Disaster Risk Reduction |
| cm-water@usep.edu.ph | Dr. Eduardo Mendoza | Water Resources |
| cm-community@usep.edu.ph | Dr. Sofia Herrera | Community Development |
| cm-edutech@usep.edu.ph | Dr. Rafael Castillo | Educational Technology |
| cm-cultural@usep.edu.ph | Dr. Isabel Morales | Cultural Studies |
| cm-telemedicine@usep.edu.ph | Dr. Francisco Jimenez | Telemedicine |
| cm-nutrition@usep.edu.ph | Dr. Elena Diaz | Public Health & Nutrition |
| cm-materials@usep.edu.ph | Dr. Gabriel Ortega | Materials Science |
| cm-agriculture@usep.edu.ph | Dr. Victoria Silva | Agricultural Research |
| cm-marine@usep.edu.ph | Dr. Alejandro Vega | Marine Biology |
| cm-urban@usep.edu.ph | Dr. Beatriz Romero | Urban Planning |
| cm-digital@usep.edu.ph | Dr. Daniel Navarro | Digital Innovation |
| cm-social@usep.edu.ph | Dr. Mariana Perez | Social Sciences |
| cm-sustainable@usep.edu.ph | Dr. Ricardo Gutierrez | Sustainable Development |

- **Password**: `password` (all accounts)
- **Description**: Manages research centers and endorses proposals from their centers

---

### **6. Proponent** - 27 accounts

**Sample Proponent Accounts:**

| Email | Name | Department/Center |
|-------|------|-------------------|
| sarah.johnson@usep.edu.ph | Dr. Sarah Johnson | ICT Center |
| maria.cruz@usep.edu.ph | Dr. Maria Cruz | Environmental Studies |
| juan.santos@usep.edu.ph | Prof. Juan Santos | Indigenous Studies |
| ana.reyes@usep.edu.ph | Dr. Ana Reyes | Renewable Energy |
| carlos.mendoza@usep.edu.ph | Dr. Carlos Mendoza | Health Informatics |
| elena.torres@usep.edu.ph | Dr. Elena Torres | Tourism Center |
| roberto.garcia@usep.edu.ph | Dr. Roberto Garcia | Disaster Management |
| patricia.lopez@usep.edu.ph | Dr. Patricia Lopez | Water Resources |
| miguel.fernandez@usep.edu.ph | Dr. Miguel Fernandez | Community Development |
| sofia.herrera@usep.edu.ph | Dr. Sofia Herrera | Educational Technology |
| rafael.castillo@usep.edu.ph | Dr. Rafael Castillo | Cultural Studies |
| isabel.morales@usep.edu.ph | Dr. Isabel Morales | Telemedicine |
| francisco.jimenez@usep.edu.ph | Dr. Francisco Jimenez | Nutrition |
| elena.diaz@usep.edu.ph | Dr. Elena Diaz | Materials Science |
| gabriel.ortega@usep.edu.ph | Dr. Gabriel Ortega | Agriculture |
| victoria.silva@usep.edu.ph | Dr. Victoria Silva | Marine Biology |
| alejandro.vega@usep.edu.ph | Dr. Alejandro Vega | Urban Planning |
| beatriz.romero@usep.edu.ph | Dr. Beatriz Romero | Digital Innovation |
| daniel.navarro@usep.edu.ph | Dr. Daniel Navarro | Social Sciences |
| mariana.perez@usep.edu.ph | Dr. Mariana Perez | Sustainable Development |
| ricardo.gutierrez@usep.edu.ph | Dr. Ricardo Gutierrez | College of Medicine |
| carmen.villanueva@usep.edu.ph | Prof. Carmen Villanueva | Engineering |
| eduardo.mendoza@usep.edu.ph | Dr. Eduardo Mendoza | Education |
| antonio.rivera@usep.edu.ph | Dr. Antonio Rivera | Arts & Sciences |
| carmen.lopez@usep.edu.ph | Dr. Carmen Lopez | Business Administration |
| luis.martinez@usep.edu.ph | Dr. Luis Martinez | Agriculture |
| rosa.gonzales@usep.edu.ph | Dr. Rosa Gonzales | Nursing |
| jose.ramirez@usep.edu.ph | Dr. Jose Ramirez | Computer Studies |

- **Password**: `password` (all accounts)
- **Description**: Submits and manages research proposals

---

### **7. Reviewer** - 5 accounts

| Email | Name | Department |
|-------|------|------------|
| james.miller@usep.edu.ph | Dr. James Miller | Academic Affairs |
| susan.wilson@usep.edu.ph | Dr. Susan Wilson | RDD |
| david.brown@usep.edu.ph | Dr. David Brown | ICT Center |
| linda.davis@usep.edu.ph | Dr. Linda Davis | Environmental Studies |
| robert.taylor@usep.edu.ph | Dr. Robert Taylor | Health Center |

- **Password**: `password` (all accounts)
- **Description**: Reviews and evaluates research proposals

---

## 📝 Important Notes

### Currently Active Account
Only the **Admin account** (`boybawang141@gmail.com`) exists from the migration. The admin account was created automatically during setup.

### Creating Test Users
To create all the seeded users listed above, run:
```bash
php artisan db:seed --class=UserSeeder
```

### Security Reminder
⚠️ **All default passwords are set to `password`**. For production use:
1. Change all default passwords immediately
2. Implement a password policy
3. Force users to change passwords on first login

### Password Reset
Users can reset their passwords through the forgot password feature in the login page.

---

## 🔄 Role Hierarchy & Workflow

1. **Proponent** → Submits research proposal
2. **CM** → Endorses proposal from their center
3. **RDD** → Reviews and processes proposal
4. **Reviewer** → Evaluates proposal quality
5. **OSUORU** → Reviews compliance aspects
6. **OP** → Final approval
7. **Admin** → System management and oversight

---

## Last Updated
December 14, 2025
