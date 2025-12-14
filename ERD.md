# Entity Relationship Diagram (ERD)
## RDE System Database Schema

This document represents the Entity Relationship Diagram based on the database migrations.

---

## Entities and Relationships

### Core User Management

#### **user_roles**
- `userRoleID` (PK)
- `userRole` (string, 50)
- `timestamps`

**Default Roles:** RDD, CM, Proponent, OP, OSUORU, Admin, Reviewer

#### **users**
- `userID` (PK)
- `firstName` (string, 50)
- `lastName` (string, 50)
- `email` (string, 50, unique)
- `password` (string)
- `phone` (string, 50, nullable)
- `departmentID` (FK → departments.departmentID, nullable)
- `researchCenterID` (FK → research_centers.centerID, nullable)
- `userRolesID` (FK → user_roles.userRoleID)
- `avatar` (string, nullable)
- `rememberToken`
- `timestamps`

**Relationships:**
- Belongs to: `departments`, `research_centers`, `user_roles`
- Has many: `proposals`, `reviews`, `decisions`, `notifications`, `messages` (as sender/recipient), `progress_reports`, `proposal_proponents`, `activity_logs`, `activities`

---

### Department and Research Center Management

#### **departments**
- `departmentID` (PK)
- `name` (string, 100)
- `college_idNo` (string, 50, nullable)
- `timestamps`

**Relationships:**
- Has many: `users`, `research_centers`, `progress_reports`

#### **research_centers**
- `centerID` (PK)
- `name` (string)
- `departmentID` (FK → departments.departmentID, nullable)
- `timestamps`

**Relationships:**
- Belongs to: `departments`
- Has many: `users`, `progress_reports`

---

### Proposal Management

#### **status**
- `statusID` (PK)
- `statusName` (string, 50)
- `statusDescription` (text, nullable)
- `timestamps`

**Default Statuses:** Draft, Submitted, Under Review, Revisions Required, Approved, Rejected, Endorsed

#### **proposals**
- `proposalID` (PK)
- `custom_proposal_id` (string, 100, nullable, unique)
- `researchTitle` (string)
- `description` (text, nullable)
- `objectives` (text, nullable)
- `researchCenter` (string, nullable)
- `researchAgenda` (json, nullable)
- `dostSPs` (json, nullable)
- `sustainableDevelopmentGoals` (json, nullable)
- `proposedBudget` (decimal, 15, 2, nullable)
- `budgetBreakdown` (json, nullable)
- `revisionFile` (string, nullable)
- `matrixOfCompliance` (json, nullable)
- `uploadedAt` (timestamp)
- `archivedByRDD` (timestamp, nullable)
- `resubmittedAfterRevision` (timestamp, nullable)
- `statusID` (FK → status.statusID)
- `userID` (FK → users.userID)
- `timestamps`

**Relationships:**
- Belongs to: `status`, `users`
- Has many: `files`, `checklist`, `decisions`, `endorsements`, `reviews`, `proposal_proponents`, `progress_reports` (nullable)

#### **proposal_proponents**
- `id` (PK)
- `proposalID` (FK → proposals.proposalID)
- `userID` (FK → users.userID)
- `projectRoleID` (FK → project_roles.projectRoleID, nullable)
- `timestamps`
- Unique constraint: (`proposalID`, `userID`)

**Relationships:**
- Belongs to: `proposals`, `users`, `project_roles`

#### **project_roles**
- `projectRoleID` (PK)
- `roleName` (string, 100)
- `isActive` (boolean, default: true)
- `timestamps`

**Default Roles:** Principal Investigator, Co-Investigator, Research Assistant, Data Analyst, Project Coordinator

---

### Review and Decision Management

#### **review_decisions**
- `decisionID` (PK)
- `decision` (string, 50)
- `timestamps`

**Default Decisions:** Approved, Rejected, Revisions Required

#### **reviews**
- `reviewID` (PK)
- `remarks` (text, nullable)
- `matrixOfCompliance` (json, nullable)
- `reviewedAt` (timestamp)
- `proposalID` (FK → proposals.proposalID)
- `reviewerID` (FK → users.userID)
- `decisionID` (FK → review_decisions.decisionID)
- `timestamps`

**Relationships:**
- Belongs to: `proposals`, `users` (as reviewer), `review_decisions`

#### **decisions**
- `decisionID` (PK)
- `proposalID` (FK → proposals.proposalID)
- `decisionMakerID` (FK → users.userID)
- `decisionType` (string, 50)
- `decisionComments` (text, nullable)
- `decisionDate` (timestamp)
- `timestamps`

**Relationships:**
- Belongs to: `proposals`, `users` (as decision maker)

#### **endorsements**
- `endorsementID` (PK)
- `proposalID` (FK → proposals.proposalID)
- `endorserID` (FK → users.userID)
- `endorsementComments` (text, nullable)
- `endorsementStatus` (string, default: 'pending')
- `endorsedAt` (timestamp)
- `timestamps`

**Relationships:**
- Belongs to: `proposals`, `users` (as endorser)

---

### File Management

#### **files**
- `fileID` (PK)
- `fileName` (string)
- `filePath` (string)
- `fileType` (string, 25)
- `fileSize` (bigInteger, nullable)
- `uploadedAt` (timestamp)
- `proposalID` (FK → proposals.proposalID, nullable)
- `reportID` (FK → progress_reports.reportID, nullable)
- `timestamps`

**Relationships:**
- Belongs to: `proposals` (nullable), `progress_reports` (nullable)

#### **checklist**
- `checkListID` (PK)
- `section` (string, 100)
- `values` (json)
- `proposalID` (FK → proposals.proposalID)
- `timestamps`

**Relationships:**
- Belongs to: `proposals`

---

### Progress Reporting

#### **progress_reports**
- `reportID` (PK)
- `proposalID` (FK → proposals.proposalID, nullable)
- `userID` (FK → users.userID)
- `researchCenterID` (FK → research_centers.centerID, nullable)
- `departmentID` (FK → departments.departmentID, nullable)
- `reportType` (string) - Quarterly, Annual, Final, Interim
- `reportPeriod` (string) - e.g., Q1 2025, 2025
- `progressPercentage` (integer, default: 0)
- `budgetUtilized` (decimal, 15, 2, nullable)
- `achievements` (text, nullable)
- `challenges` (text, nullable)
- `nextMilestone` (text, nullable)
- `additionalNotes` (text, nullable)
- `submittedAt` (timestamp)
- `timestamps`

**Relationships:**
- Belongs to: `proposals` (nullable), `users`, `research_centers` (nullable), `departments` (nullable)
- Has many: `files`

---

### Communication

#### **notifications**
- `id` (PK)
- `userID` (FK → users.userID)
- `type` (string) - success, error, info, warning
- `title` (string)
- `message` (text)
- `data` (json, nullable)
- `read` (boolean, default: false)
- `read_at` (timestamp, nullable)
- `timestamps`
- Indexes: (`userID`, `read`), `created_at`

**Relationships:**
- Belongs to: `users`

#### **messages**
- `id` (PK)
- `senderID` (FK → users.userID)
- `recipientID` (FK → users.userID)
- `subject` (string)
- `content` (text)
- `type` (string, default: 'general') - general, proposal_update, system
- `read` (boolean, default: false)
- `read_at` (timestamp, nullable)
- `timestamps`
- Indexes: (`recipientID`, `read`), `created_at`

**Relationships:**
- Belongs to: `users` (as sender), `users` (as recipient)

---

### System Configuration

#### **settings**
- `settingID` (PK)
- `key` (string, unique)
- `value` (text, nullable)
- `type` (string, default: 'string') - string, integer, boolean, json
- `timestamps`

**Default Settings:** allowed_file_types, max_file_size

#### **timeline_stages**
- `stageID` (PK)
- `stageName` (string, 100)
- `stageDescription` (text, nullable)
- `orderIndex` (integer, default: 0)
- `statusID` (FK → status.statusID, nullable)
- `isActive` (boolean, default: true)
- `icon` (string, nullable)
- `color` (string, default: 'gray')
- `timestamps`

**Relationships:**
- Belongs to: `status` (nullable)

**Default Stages:** Proposal Submitted, College Endorsement, R&D Division, Proposal Review, Ethics Review, OVPRDE, President, OSOURU, Implementation, Monitoring, For Completion

---

### Activity Tracking

#### **activity_logs**
- `activityID` (PK)
- `userID` (FK → users.userID)
- `action` (string, 100) - created, updated, deleted
- `entity_type` (string, 100) - user, department, setting
- `entity_id` (unsignedBigInteger, nullable)
- `description` (text)
- `ip_address` (string, 45, nullable)
- `user_agent` (text, nullable)
- `timestamps`
- Indexes: (`userID`, `created_at`), `created_at`

**Relationships:**
- Belongs to: `users`

#### **activities**
- `activityID` (PK)
- `userID` (FK → users.userID, nullable)
- `action` (string) - create, update, delete, login, etc.
- `description` (string)
- `model_type` (string, nullable) - User, Proposal, Department, etc.
- `model_id` (unsignedBigInteger, nullable)
- `old_values` (json, nullable)
- `new_values` (json, nullable)
- `ip_address` (string, nullable)
- `user_agent` (text, nullable)
- `timestamps`
- Indexes: `userID`, `action`, `model_type`, `created_at`

**Relationships:**
- Belongs to: `users` (nullable)

---

## Entity Relationship Diagram (Mermaid Format)

```mermaid
erDiagram
    user_roles ||--o{ users : "has"
    departments ||--o{ users : "has"
    departments ||--o{ research_centers : "has"
    departments ||--o{ progress_reports : "has"
    research_centers ||--o{ users : "has"
    research_centers ||--o{ progress_reports : "has"
    status ||--o{ proposals : "has"
    status ||--o{ timeline_stages : "references"
    users ||--o{ proposals : "creates"
    users ||--o{ reviews : "makes"
    users ||--o{ decisions : "makes"
    users ||--o{ endorsements : "makes"
    users ||--o{ notifications : "receives"
    users ||--o{ messages : "sends"
    users ||--o{ messages : "receives"
    users ||--o{ progress_reports : "submits"
    users ||--o{ proposal_proponents : "is"
    users ||--o{ activity_logs : "performs"
    users ||--o{ activities : "performs"
    proposals ||--o{ files : "has"
    proposals ||--o{ checklist : "has"
    proposals ||--o{ decisions : "has"
    proposals ||--o{ endorsements : "has"
    proposals ||--o{ reviews : "has"
    proposals ||--o{ proposal_proponents : "has"
    proposals ||--o{ progress_reports : "tracks"
    review_decisions ||--o{ reviews : "determines"
    project_roles ||--o{ proposal_proponents : "assigns"
    progress_reports ||--o{ files : "has"

    user_roles {
        bigint userRoleID PK
        string userRole
        timestamps
    }
    
    users {
        bigint userID PK
        string firstName
        string lastName
        string email UK
        string password
        string phone
        bigint departmentID FK
        bigint researchCenterID FK
        bigint userRolesID FK
        string avatar
        timestamps
    }
    
    departments {
        bigint departmentID PK
        string name
        string college_idNo
        timestamps
    }
    
    research_centers {
        bigint centerID PK
        string name
        bigint departmentID FK
        timestamps
    }
    
    status {
        bigint statusID PK
        string statusName
        text statusDescription
        timestamps
    }
    
    proposals {
        bigint proposalID PK
        string custom_proposal_id UK
        string researchTitle
        text description
        text objectives
        string researchCenter
        json researchAgenda
        json dostSPs
        json sustainableDevelopmentGoals
        decimal proposedBudget
        json budgetBreakdown
        string revisionFile
        json matrixOfCompliance
        timestamp uploadedAt
        timestamp archivedByRDD
        timestamp resubmittedAfterRevision
        bigint statusID FK
        bigint userID FK
        timestamps
    }
    
    files {
        bigint fileID PK
        string fileName
        string filePath
        string fileType
        bigint fileSize
        timestamp uploadedAt
        bigint proposalID FK
        bigint reportID FK
        timestamps
    }
    
    checklist {
        bigint checkListID PK
        string section
        json values
        bigint proposalID FK
        timestamps
    }
    
    review_decisions {
        bigint decisionID PK
        string decision
        timestamps
    }
    
    reviews {
        bigint reviewID PK
        text remarks
        json matrixOfCompliance
        timestamp reviewedAt
        bigint proposalID FK
        bigint reviewerID FK
        bigint decisionID FK
        timestamps
    }
    
    decisions {
        bigint decisionID PK
        bigint proposalID FK
        bigint decisionMakerID FK
        string decisionType
        text decisionComments
        timestamp decisionDate
        timestamps
    }
    
    endorsements {
        bigint endorsementID PK
        bigint proposalID FK
        bigint endorserID FK
        text endorsementComments
        string endorsementStatus
        timestamp endorsedAt
        timestamps
    }
    
    notifications {
        bigint id PK
        bigint userID FK
        string type
        string title
        text message
        json data
        boolean read
        timestamp read_at
        timestamps
    }
    
    messages {
        bigint id PK
        bigint senderID FK
        bigint recipientID FK
        string subject
        text content
        string type
        boolean read
        timestamp read_at
        timestamps
    }
    
    progress_reports {
        bigint reportID PK
        bigint proposalID FK
        bigint userID FK
        bigint researchCenterID FK
        bigint departmentID FK
        string reportType
        string reportPeriod
        integer progressPercentage
        decimal budgetUtilized
        text achievements
        text challenges
        text nextMilestone
        text additionalNotes
        timestamp submittedAt
        timestamps
    }
    
    proposal_proponents {
        bigint id PK
        bigint proposalID FK
        bigint userID FK
        bigint projectRoleID FK
        timestamps
    }
    
    project_roles {
        bigint projectRoleID PK
        string roleName
        boolean isActive
        timestamps
    }
    
    settings {
        bigint settingID PK
        string key UK
        text value
        string type
        timestamps
    }
    
    timeline_stages {
        bigint stageID PK
        string stageName
        text stageDescription
        integer orderIndex
        bigint statusID FK
        boolean isActive
        string icon
        string color
        timestamps
    }
    
    activity_logs {
        bigint activityID PK
        bigint userID FK
        string action
        string entity_type
        bigint entity_id
        text description
        string ip_address
        text user_agent
        timestamps
    }
    
    activities {
        bigint activityID PK
        bigint userID FK
        string action
        string description
        string model_type
        bigint model_id
        json old_values
        json new_values
        string ip_address
        text user_agent
        timestamps
    }
```

---

## Key Relationships Summary

1. **User Management:**
   - Users belong to departments, research centers, and have roles
   - Users can create proposals, make reviews, decisions, and endorsements
   - Users can send/receive messages and notifications

2. **Proposal Workflow:**
   - Proposals go through status changes
   - Proposals can have multiple proponents with different project roles
   - Proposals are reviewed, decided upon, and endorsed
   - Proposals can have files and checklists attached

3. **Review Process:**
   - Reviews link proposals, reviewers, and review decisions
   - Decisions are made by decision makers on proposals
   - Endorsements track proposal endorsements by endorsers

4. **Progress Tracking:**
   - Progress reports can be linked to proposals (optional)
   - Progress reports can be submitted by users for research centers/departments
   - Files can be attached to progress reports

5. **Communication:**
   - Notifications alert users of system events
   - Messages enable user-to-user communication

6. **System Configuration:**
   - Settings store system configuration
   - Timeline stages define the proposal workflow stages

7. **Activity Tracking:**
   - Activity logs and activities track user actions and system changes

