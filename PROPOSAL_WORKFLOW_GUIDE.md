# Research Proposal Workflow Guide

## Overview
This document explains the complete workflow for a research proposal from submission to approval, including which roles need to log in at each step.

---

## 📋 Proposal Statuses

The system uses 7 different statuses:

| Status ID | Status Name | Description |
|-----------|-------------|-------------|
| 1 | Draft | Proposal is being prepared |
| 2 | Submitted | Proposal submitted for review |
| 3 | Under Review | Being reviewed by committee |
| 4 | Revisions Required | Needs changes before approval |
| 5 | Approved | Final approval granted |
| 6 | Rejected | Proposal denied |
| 7 | Endorsed | Endorsed by CM or RDD |

---

## 🔄 Complete Proposal Workflow

### **Step 1: Proposal Creation & Submission**
**Role Required:** **Proponent**

**Actions:**
1. Log in as Proponent
2. Navigate to Dashboard → Submit New Proposal
3. Fill in proposal details:
   - Research Title
   - Description & Objectives
   - Research Center
   - Research Agenda (RDE)
   - DOST 6Ps
   - SDG alignment
   - Budget information
   - Upload required files:
     - Research Proposal Document (PDF)
     - SETI Assessment
     - GAD Compliance
     - Matrix of Compliance
4. Click "Submit Proposal"

**Result:** 
- Status: **Submitted** (statusID = 2)
- Notification sent to Center Manager (CM)

---

### **Step 2: Center Manager (CM) Review & Endorsement - First Review**
**Role Required:** **CM (Center Manager)**

**Actions:**
1. Log in as CM
2. Navigate to Dashboard → Pending Projects
3. Select the proposal to review
4. Review proposal details and uploaded documents
5. **Option A - Endorse to Co-CM:**
   - Click "Endorse"
   - Add endorsement comments
   - Status: "Approved"
   - This sends to another CM for second review
   
6. **Option B - Request Revisions:**
   - Click "Request Revisions"
   - Add revision comments
   - Status: "Rejected"

**Result (if endorsed):**
- First CM endorsement created (endorsementStatus = "approved")
- Notification sent to another CM in the same department/center
- Proposal remains visible in CM dashboard until second endorsement

**Result (if revisions requested):**
- Status: **Revisions Required** (statusID = 4)
- Notification sent back to Proponent

---

### **Step 2.5: Proponent Revisions (If Required by CM)**
**Role Required:** **Proponent**

**Actions:**
1. Log in as Proponent
2. Navigate to "For Revision" section
3. View CM's revision comments
4. Make required changes
5. Upload updated proposal document
6. Click "Resubmit"

**Result:**
- Status: **Submitted** (statusID = 2)
- `resubmittedAfterRevision` flag set
- Notification sent back to CM

**Go back to Step 2** for CM review

---

### **Step 3: Center Manager (CM) Second Endorsement**
**Role Required:** **CM (Another CM from same center)**

**Actions:**
1. Log in as CM
2. Navigate to Dashboard → Pending Projects
3. Review the already-endorsed proposal
4. **Option A - Endorse to RDD:**
   - Click "Endorse"
   - Add endorsement comments
   - Status: "Approved"
   - This is the FINAL CM endorsement
   
5. **Option B - Request Revisions:**
   - Click "Request Revisions"
   - Add revision comments
   - Status: "Rejected"

**Result (if endorsed):**
- Second CM endorsement created (endorsementCount = 2)
- Proposal immediately forwarded to RDD
- Notification sent to RDD users
- Proposal removed from CM "Pending" list
- Proposal appears in CM "Endorsed" list

**Result (if revisions requested):**
- Status: **Revisions Required** (statusID = 4)
- Notification sent back to Proponent
- **Go to Step 2.5**

---

### **Step 4: RDD (Research Development Division) Review & Endorsement**
**Role Required:** **RDD**

**Actions:**
1. Log in as RDD
2. Navigate to Dashboard → Review Proposals
3. Select the proposal (must have 2 CM endorsements)
4. Review proposal details, documents, and CM endorsement comments
5. **Option A - Endorse to OP:**
   - Click "Endorse"
   - Add endorsement comments (visible to OP)
   - Status: "Approved"
   
6. **Option B - Request Revisions:**
   - Click "Request Revisions"
   - Add revision comments
   - Status: "Rejected"

**Result (if endorsed):**
- RDD endorsement created (endorsementStatus = "approved")
- `archivedByRDD` timestamp set
- Status: **Endorsed** (statusID = 7)
- Proposal archived in RDD system
- Notification sent to OP (Office of the President)
- Proposal moved to RDD "Archived" section

**Result (if revisions requested):**
- Status: **Revisions Required** (statusID = 4)
- Notification sent back to Proponent
- **Go to Step 4.5**

---

### **Step 4.5: Proponent Revisions (If Required by RDD)**
**Role Required:** **Proponent**

**Actions:**
1. Log in as Proponent
2. Navigate to "For Revision" section
3. View RDD's revision comments
4. Make required changes
5. Upload updated proposal document
6. Click "Resubmit"

**Result:**
- Status: **Submitted** (statusID = 1)
- `resubmittedAfterRevision` flag set to RDD revision date
- Notification sent directly to RDD (skips CM review)

**Go back to Step 4** for RDD re-review

---

### **Step 5: Office of the President (OP) Final Approval**
**Role Required:** **OP (Office of the President)**

**Actions:**
1. Log in as OP
2. Navigate to Dashboard → Pending Approvals
3. Select the proposal (must have RDD endorsement)
4. Review complete proposal history:
   - All endorsements (CM and RDD)
   - All documents
   - All comments
5. **Option A - Approve:**
   - Click "Approve"
   - Add approval comments
   - Status: "Approved"
   
6. **Option B - Reject:**
   - Click "Reject"
   - Add rejection reason
   - Status: "Rejected"

**Result (if approved):**
- Status: **Approved** (statusID = 5)
- Notification sent to all parties:
  - Proponent
  - CM(s) who endorsed
  - RDD
- Proposal moved to "Approved Projects"
- Proponent can now submit progress reports

**Result (if rejected):**
- Status: **Rejected** (statusID = 6)
- Notification sent to Proponent with rejection reason
- Workflow ends

---

## 📊 Quick Reference: Role Login Requirements

### To Submit a Proposal:
- ✅ **Proponent**

### To Review & Endorse (First):
- ✅ **CM (Center Manager)**

### To Review & Endorse (Second):
- ✅ **CM (Different Center Manager)**

### To Review & Endorse (to OP):
- ✅ **RDD (Research Development Division)**

### To Give Final Approval:
- ✅ **OP (Office of the President)**

### To Resubmit After Revisions:
- ✅ **Proponent**

---

## 🔍 Endorsement Rules

### CM (Center Manager) Endorsement Rules:
- ✅ A proposal requires **2 CM endorsements** before going to RDD
- ✅ First CM endorsement: Sends to another CM for second review
- ✅ Second CM endorsement: Forwards directly to RDD
- ✅ Both endorsements must have `endorsementStatus = "approved"`
- ✅ If CM count >= 2, proposal is immediately removed from CM pending list

### RDD Endorsement Rules:
- ✅ Can only endorse proposals that have 2 CM endorsements
- ✅ RDD endorsement sets `archivedByRDD` timestamp
- ✅ After RDD endorsement, proposal goes to OP
- ✅ If RDD requests revision, resubmission goes DIRECTLY back to RDD (skips CM)

### Revision Workflow:
- ✅ CM requests revision → Goes back to Proponent → Resubmit → Goes to CM
- ✅ RDD requests revision → Goes back to Proponent → Resubmit → Goes DIRECTLY to RDD
- ✅ Resubmissions are tracked via `resubmittedAfterRevision` field

---

## 📧 Notification Flow

```
Proponent Submits
    ↓
[Notification to CM]
    ↓
CM Endorses (1st time)
    ↓
[Notification to another CM]
    ↓
CM Endorses (2nd time)
    ↓
[Notification to RDD]
    ↓
RDD Endorses
    ↓
[Notification to OP]
    ↓
OP Approves
    ↓
[Notification to Proponent, CM(s), RDD]
```

---

## 🎯 Timeline Stages

Proposals progress through these timeline stages:

1. **Proposal Submitted** - Proponent submits
2. **College Endorsement** - CM review (requires 2 endorsements)
3. **R&D Division Endorsement** - RDD review
4. **President's Office Review** - OP final approval
5. **Approved** - Final state

Each role can see where the proposal is in the timeline based on their permissions.

---

## 💡 Important Notes

1. **Role Permissions:**
   - Only the proposal owner (Proponent) can submit/resubmit
   - Only CM from the same research center can endorse
   - RDD can endorse ALL proposals (after CM endorsements)
   - OP can approve ALL proposals (after RDD endorsement)

2. **Document Requirements:**
   - Research Proposal Document (Required)
   - SETI Assessment (Required)
   - GAD Compliance (Required)
   - Matrix of Compliance (Required)
   - Supporting Documents (Optional)

3. **Status Tracking:**
   - All status changes are logged
   - All endorsements are timestamped
   - Revision history is maintained

4. **Testing the Workflow:**
   ```bash
   # First, seed the database with test users
   php artisan db:seed --class=UserSeeder
   ```
   
   Then follow the steps above using the test accounts from [USER_ROLES_AND_CREDENTIALS.md](USER_ROLES_AND_CREDENTIALS.md)

---

## Last Updated
December 14, 2025
