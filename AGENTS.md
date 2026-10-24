# Workspace Rules, Constraints & Project Architecture

## 1. Strictly Read-Only Backup Directories (Critical Constraint)

The following folders are strictly preserved for **read-only reference**:
- `Backup_IAR-components/` (Source for J&J brand theme & standardized UI components)
- `Backup_JNJ_IAR/` (Source for audit business logic, workflows, and mock schemas)

### Strict Guidelines:
1. **NEVER write, edit, rename, move, delete, or modify** any files or folders inside `Backup_IAR-components` or `Backup_JNJ_IAR`.
2. Both directories are strictly preserved for **read-only reference**.
3. All new work, development, modifications, and project files must be created outside these two directories.

---

## 2. Project Overview & Scope

- **Application Name**: **IAR (Intelligent Audit Reporting)**
- **Platform Stack**:
  - **Frontend**: **Power Apps Code App** (React & TypeScript)
  - **Data Storage**: **Microsoft Dataverse** (relational database for all entities)
  - **Integration & Automations**: **Power Automate** (Instant HTTP flows for UI buttons; Scheduled flows for batch jobs)
  - **File & Big Data Storage**: **SharePoint Online** (workpapers, evidence, PDF reports) and **Azure Data Lake Storage / ADLS Gen2** (forensic logs, ERP sample extracts)
- **Module & Navigation Boundaries**:
  - Top Navigation includes all 6 phases: `Pre-Planning`, `Planning`, `Fieldwork`, `Reporting`, `Wrap-up`, `Dashboards`.
  - **Current Development Scope**: Fully implement the **Reporting Module** with all workflows, AI generation, review tiers, and business responses. The other 5 phases remain as standby placeholder views.
- **Data Ingestion & Application Ownership Boundary**:
  - **One-Time Deployment Seed Master Data (One-Time Setup Flow)**:
    - Table: `iar_tmroleses` (`iar_tmroles`).
    - Mechanism: Loaded **only one time post-deployment** via a Power Automate setup flow from **TeamMate**.
    - Permission & User Model: User assignments in `iar_securityassignmentses` store `iar_tmroleid` and `iar_useremailid`. The app matches `iar_useremailid` against `systemusers.internalemailaddress` to resolve user display name, avatar initials, and Dataverse identity; and matches `iar_tmroleid` against `iar_tmroleses.iar_tmid` to resolve the **`LogicKey`**, which drives all authorization, review transitions, and UI action button visibility.

  - **Upstream Synchronized Master Data (1-Hour Scheduled Flow Sync from TeamMate)**:
    - Tables: `iar_assessments`, `iar_engagements` (`iar_engagementses`), `iar_procedures` (`iar_procedureses`), `iar_securityassignments` (`iar_securityassignmentses`), `iar_taxonomiesmasters`, `iar_taxonomies` (`iar_taxonomieses`).
    - Mechanism: Loaded & refreshed via **Scheduled Power Automate flows executing every 1 hour**, which check for newly created or modified records in **TeamMate** and update Dataverse.
    - Application Role: Read-only reference / lookup datasets in the UI (queue listing, procedures dropdown, assigned roles, taxonomies).
  - **Application-Managed Operational & Governance Data (Native Code App System of Record)**:
    - Tables: `iar_administratorses` (app administrators directory), `iar_issueses` (findings), `iar_issuebusinessownerses` (secondary business owners & delegations), `iar_aiissuegeneratedlogses` (AI generation request logs), `iar_aigeneratedfieldlogses` (AI generated field snapshots), `iar_aigeneratedfieldeditlogses` (auditor edits to AI fields), `iar_aiformattingcontextses` (reformatting options & prompt instructions), `iar_aiformattedlogses` (text reformatting execution logs), `iar_issuelogses` (issue audit trail & workflow logs), `iar_issuecommentses` (field-level comments across 31 fields).
    - Upcoming Tables: `iar_executivesummaryreports`, `iar_summaryreportlogs`, `iar_aisummaryreportgenerations`, `iar_summaryreportcomments`, `iar_businesscomments`, `iar_issuesbusinessresponses`, `iar_userlogs`.
    - AI Engine Architecture: Built with **FastAPI microservices deployed in Azure Kubernetes Service (AKS)**, invoked via Power Automate logic flows (`AIIssueGeneration` and `AITextFormatting`).
    - Application Role: Natively created, modified, transitioned through 5 review tiers, synthesized via AI, commented on, and signed off directly within the IAR Code App.





---

## 3. Requirements & Architecture Documentation Index

Always refer to the following project specifications located in `docs/`:

1. [docs/REQUIREMENTS.md](file:///d:/IAR/docs/REQUIREMENTS.md) — Master High-Level Requirements & System Architecture.
2. [docs/REFERENCE_MAPPING.md](file:///d:/IAR/docs/REFERENCE_MAPPING.md) — Master Repository Cross-Reference & Source Mapping (Mock JSON $\rightarrow$ Dataverse, Button actions $\rightarrow$ Power Automate).
3. [docs/FRD_REPORTING_MODULE.md](file:///d:/IAR/docs/FRD_REPORTING_MODULE.md) — Detailed Functional Requirements for Reporting (Audit Queue, Workpapers, AI Synthesis, State Machine, Business Response Loop, Sign-Offs, Comments).
4. [docs/UI_DESIGN_HARMONIZATION_SPEC.md](file:///d:/IAR/docs/UI_DESIGN_HARMONIZATION_SPEC.md) — Corporate Brand Standards, Colors, Typography & Standardized UI Components (`SharedTable`, `SharedAccordion`, `SharedButton`, inputs).
5. [docs/DATAVERSE_SCHEMA_SPEC.md](file:///d:/IAR/docs/DATAVERSE_SCHEMA_SPEC.md) — Foundational Dataverse Data Model, Entities, and OptionSets.
6. [docs/INTEGRATION_AUTOMATION_SPEC.md](file:///d:/IAR/docs/INTEGRATION_AUTOMATION_SPEC.md) — Foundational Power Automate Flow Contracts, SharePoint Folders, and ADLS Containers.

---

## 4. Architectural & Domain Best Practices

### 4.1 UI & Design System Consistency
- **Strict Brand Styling**: All UI components must adhere to the J&J brand palette:
  - Primary Blue (`#000099`), Primary Red (`#eb1700`), Dark Text (`#212121`), Border Grey (`#d8d8d8`), Background (`#f4f4f4`).
  - Typography: `"jj-circular", Arial, Helvetica, sans-serif`.
- **Corporate Header Chrome & Brand Assets**:
  - **Logo & Subtitle**: Authentic signature `jj-logo.png` on the top-left with `GA&A INTERNAL AUDIT REPORTING` in bold uppercase subtitle.
  - **Active Navigation Indicator**: Thick J&J Red (`#eb1700`, 4px height) underline indicator positioned directly beneath the active navigation label with clean white clearance separating it from the blue ribbon.
  - **Sub-Header Blue Ribbon**: Full-width repeating blue patterned ribbon (`header-bg.png`, 13px height, `repeat-x`) directly beneath the white header with elevation drop shadow (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)`).
  - **User Profile Widget**: Circle user silhouette outline icon, display name (e.g. `Tamilselvan`), and chevron down for persona switching.
- **Reusable Component Consumption**: Always utilize the standardized components based on `Backup_IAR-components/src/components/shared/`:
  - Tables $\rightarrow$ `SharedTable` (with sorting, pagination, and `.strength` risk dots).
  - Collapsible finding sections $\rightarrow$ `SharedAccordion`.
  - Action buttons $\rightarrow$ `SharedButton` (`contained` blue, `outlined` red border, `text` bright blue).
  - Form fields $\rightarrow$ `SharedTextInput`, `SharedTextArea`, `SharedSelect` (with red chevron), `SharedMultiSelect`, `SharedAutocomplete`, `SharedFieldLabel`, `SharedFieldError`.

### 4.2 Business Logic & Governance Enforcement
- **State Machine Fidelity & Creator-Driven Initial Review Status**: Strictly follow the review workflow and status progression defined in `FRD_REPORTING_MODULE.md`:
  `Pending Staff` $\rightarrow$ `Pending TC` $\rightarrow$ `Pending Manager` $\rightarrow$ `Ready for Director Submission` $\rightarrow$ `Pending Director` $\rightarrow$ `Pending Business` (submitted exclusively by Director) $\rightarrow$ `Pending Manager` (reviewing Business response) $\rightarrow$ `Pending Director` $\rightarrow$ `Pending VP` (if $\ge 1$ Critical issue) / `Completed`.
  - **Issue Creation Initial Status Rules (by Creator Persona & Action)**:
    - **Staff Auditor Creator**:
      - Clicking **Save Draft**: Finding enters **`Pending Staff`** (`822500000`).
      - Clicking **Submit**: Finding transitions directly to **`Pending TC`** (`822500001`).
    - **Team Coordinator (TC) Creator**:
      - Clicking **Save Draft**: Finding enters **`Pending TC`** (`822500001`).
      - Clicking **Submit**: Finding transitions directly to **`Pending Manager`** (`822500002`).
    - **Audit Manager Creator**:
      - Clicking **Save Draft**: Finding enters **`Pending Manager`** (`822500002`).
      - Clicking **Submit**: Evaluates sibling active (non-excluded) issues under the engagement:
        - If other active issues are still pending: Finding enters **`Manager Completed (Waiting for Other Issues)`** (`822500003`).
        - If all other active issues in the engagement are completed by Manager: Sibling batch transitions to **`Ready for Director Submission`** (`822500004`). *(Note: Excluded issues are treated as soft-deleted and do NOT block or influence this batch transition).*
- **`Function` vs. `Accountable Function` Distinction**:
  - **`Function`** (`iar_function`): Stores track value `IT` (`822500000`) or `FinOps` (`822500001`). This field is used **strictly to populate the AI calling parameter `technology_related`** (boolean: `true` for IT, `false` for FinOps) when invoking `AIIssueGeneration`.
  - **`Accountable Function`** (`iar_AccountableFunction`): A separate finding column in `iar_issueses` storing the operational business function responsible for the auditable area (taxonomy-driven lookup to `iar_taxonomieses`), independent of the AI invocation track.
- **Two-Stage Mandatory Fields Progression**:
  - **Stage 1 (Initial Issue Creation in `CreateIssueDialog` / AI Generation)**:
    - ONLY 3 fields are strictly mandatory:
      1. **Test Procedure** (`iar_TestProcedure`)
      2. **Function** (`iar_function`: IT [`822500000`] or FinOps [`822500001`])
      3. **Original Issue** (`iar_originalissue`)
    - All other finding attributes (Primary Business Owner, Criticality, Accountable Function, Process Area, etc.) are optional during initial creation.
  - **Stage 2 (Manager Submission Gate)**:
    - Before an issue can advance from Audit Manager review (`Pending Manager` $\rightarrow$ `Ready for Director Submission` / batch submission to Director), the following fields become **strictly mandatory**:
      1. **Primary Business Owner** (`iar_PrimaryBusinessOwner`) — MUST be assigned before leaving Manager tier.
      2. **Criticality** (`iar_criticality`)
      3. **Root Cause** (`iar_rootcause`)
      4. **Impact** (`iar_impact`)
      5. **Recommendations** (`iar_recommendations`)
      6. **Accountable Function** (`iar_AccountableFunction`)
      7. **Accountable Process Area** (Taxonomy)
- **Director-Only Submission to Business (`Send to Business` Action)**: Distinct from the general peer routing "Send To" feature, "Send to Business" is a dedicated governance action available exclusively to the **Audit Director** upon review completion at `Pending Director` stage to formally route findings to the Business Contact (`Pending Business`). The Audit Manager submits completed issues to the Audit Director (`Ready for Director Submission` / `Pending Director`).
- **Business Auditee Licensing & SharePoint Dual-List Architecture**:
  - Business Contacts / Auditees do **not** access the Power Apps Code App directly, eliminating enterprise Dataverse Premium licensing costs.
  - Business auditees view issues and submit comments / formal Management Responses via a companion **Power Apps Canvas App connected to two SharePoint Online Lists**:
    1. **`IAR_Issues_List` (SharePoint Issues List)**: Synchronized whenever an issue is created or modified in the Code App via Power Automate.
       - *In-Between Business Comments & Intuitive UI Indication*: Between the time a Primary Business Owner is assigned and when the Director formally submits for business response (`Pending Business`), the Business Owner can view the issue in Canvas App and post comments at the issue level. These sync into Dataverse table **`iar_businesscomments`**. In the Code App, an intuitive visual badge (`💬 Biz Feedback: [count]`) on the Finding Navigator card and a dedicated **"Business Auditee Dialogue & Comments"** workpaper panel immediately surface these comments to the audit team in real time.
    2. **`IAR_BusinessOwnerResponses_List` (SharePoint Business Owner Response List)**: Provisioned when Director clicks "Send to Business". When the Business Owner submits their formal response (Management Response, Root Cause acceptance, CAP, target date) in Canvas App, an event flow syncs it to Dataverse table **`iar_issuesbusinessresponses`** and automatically transitions the finding back to **`Pending Manager`** (`822500002`).
- **Dedicated "Complete and Sign-Off" Buttons & Engagement Lifecycle Progression**:
  - **Audit Report Stage Finalization**:
    - Dedicated **"Complete and Sign-Off"** button on Audit Report Studio:
      - **Audit Director**: Holds the button if there are **0 Critical issues** in the engagement.
      - **Vice President (VP)**: If there is **$\ge 1$ Critical issue**, Director clearance routes to `Pending VP` (`822500007`), and the **VP** holds the dedicated "Complete and Sign-Off" button.
    - **Direct One-Click Button Action**: Clicking "Complete and Sign-Off" is a **clean, direct one-click button action without requiring remarks or an electronic signature confirmation modal**.
    - Clicking "Complete and Sign-Off" on the Audit Report automatically transitions engagement lifecycle status `iar_reportstatus` from **`Audit Report Inprogress`** (`822500001`) $\rightarrow$ **`Executive Report Inprogress`** (`822500002`).
  - **Executive Report Stage Finalization**:
    - Dedicated **"Complete and Sign-Off"** button on Executive Report Studio held by Director (0 Critical) or VP ($\ge 1$ Critical).
    - **Direct One-Click Button Action**: Clicking "Complete and Sign-Off" directly executes final sign-off without remarks or signature modal, transitioning `iar_reportstatus` from **`Executive Report Inprogress`** (`822500002`) $\rightarrow$ **`Completed`** (`822500003`).
  - **Zero-Issue Reporting Entirely Bypasses Audit Report**:
    - For audits concluding fieldwork with zero findings, the Audit Report Studio is **entirely bypassed**.
    - Queue row provides direct action **"Work on Executive Summary"**.
    - Lifecycle moves directly: `Not Started` $\rightarrow$ `Executive Report Inprogress` $\rightarrow$ `Completed`.
    - **Standard Review Tier Progression**: Executive Summary drafting and clearance strictly follows the **standard review tier progression** (`Staff Drafting` $\rightarrow$ `Pending TC` $\rightarrow$ `Pending Manager` $\rightarrow$ `Pending Director` $\rightarrow$ `Pending VP` [if required by policy] $\rightarrow$ `Completed`).
- **Official Report Export Format**: Official audit and executive summary reports are produced and archived exclusively in **PDF Format**.
- **Field-Level Commenting & Strict Resolution Governance**:
  - In-situ commenting across all 31 finding fields backed by `iar_issuecommentses`.
  - **Tagged Comments (`@mention`)**: **ONLY the tagged individual** can resolve / mark as done ("Mark as Done"). For all other users, resolution is disabled.
  - **Non-Tagged Comments**: Can be resolved / marked as done by **any user assigned to the engagement** in `iar_securityassignmentses`.
- **Strictly No Permanent Deletion**: Findings are **never permanently deleted**; audit trail integrity and GxP non-repudiation mandate that removal occurs strictly via soft exclusion (`iar_issuestatus: 822500009` `Excluded`).
- **Single Role per Engagement & Cumulative Permissions**: A user holds at most one assigned role on any single engagement in `iar_securityassignmentses`. The app evaluates permissions automatically; if any user holds multiple assignments on an engagement, cumulative permissions are granted without requiring a manual role switcher.
- **Engagement Ownership & Queue Avatar Display**: All assigned auditors on an engagement are equal team members; there is no operational concept of "Lead Auditor" or "Co-owner". In the Audit Queue's "My Action Audits" tab, the logged-in user is always the primary visible avatar. In "All Associated", the logged-in user is shown if they are part of the current queue of any active issue, or otherwise the first assigned user alphabetically. The multi-user popover (`+ more users`) lists all assignees alphabetically with their role name appended in parentheses (e.g. `Tamilselvan (IT MGR)`).
- **Issue-Level Business Owner Mapping & Delegation**: Business Owners are **not** part of TeamMate roles (`iar_tmroleses`) or security assignments (`iar_securityassignmentses`). They are mapped directly at the **Issue Level**:
  - Primary Business Owner is bound via `iar_issueses."iar_PrimaryBusinessOwner@odata.bind"` to `systemusers`.
  - Secondary Business Owners are maintained in `iar_issuebusinessownerses` (`"iar_IssueID@odata.bind"`, `"iar_SecondaryOwner@odata.bind"`) with full delegation tracking (`iar_isdelegated`, `iar_delegatedby`, `iar_delegateddatetime`).
- **Global Administrator Table (`iar_administratorses`)**: Application admins are maintained in a dedicated Dataverse table (`iar_administratorses`) with a user lookup to `systemusers`. Admins possess cross-engagement visibility, super-user oversight, and configuration access independent of TeamMate engagement assignments.
- **Admin User Impersonation**: For global administrators (`iar_administratorses`), the user profile menu exposes an **"Impersonate User"** modal to search and select any user, viewing the application queue and workflows from their exact perspective.
- **Assessment Invariant & Portfolio Filtering**: Assessments (`iar_assessments`) strictly maintain a 1:1 relationship with calendar years (never multiple years per assessment; never multiple assessments per year). In the Audit Queue, the portfolio filter renders the Assessment Year with its current Assessment State pill (`Open`, `Finalized`, `Reopened`). In Executive Reports, `iar_assessmenttitle` populates the official Assessment Period.
- **Procedure Scoping & State Pass-Through**: Audit procedures (`iar_procedureses`) are strictly scoped to their parent engagement (`"iar_EngagementID@odata.bind"`). When authoring a finding, the auditor selects an active procedure belonging to that engagement. Upstream `iar_procedurestate` and `iar_procedurestateid` have **no operational significance** in app business logic; all active procedures in the engagement are selectable.
- **Engagement Presentation & Lifecycle Source of Truth**: `iar_engagementname` is the headline title rendered across all views and studio headers (the Audit Queue does not display an engagement ID column). Upstream `iar_engagementtype` and `iar_engagementstate` have **no operational significance** in app business logic. Engagement lifecycle progress is tracked exclusively via `iar_reportstatus` (`Not Started` $\rightarrow$ `Audit Report Inprogress` upon first issue creation, or directly $\rightarrow$ `Executive Report Inprogress` for zero-issue audits upon executive summary save/submit $\rightarrow$ `Completed`).
- **Post-Response Review Loop**: Upon submission of a Management Response by the Business Contact, the issue automatically routes back to `Pending Manager` for adequacy validation, then back to the Director.
- **Criticality Escalation Gate**: Never bypass the VP sign-off rule when an engagement contains $\ge 1$ Critical issue.
- **AI Microservices & Multi-Tier Audit Ledger**:
  - Enterprise AI is built with **FastAPI microservices deployed in Azure Kubernetes Service (AKS)**, invoked via Power Automate logic flows (`AIIssueGeneration` and `AITextFormatting`).
  - **Create Issue AI Lifecycle**:
    1. In the Create Issue dialog, user enters mandatory fields (*Test Procedure*, *Function*, *Original Issue*) and optional fields (Criticality, SOX Reportable, etc.). Note: `Function` determines `technology_related` (boolean `true` for `IT`, `false` for `FinOps`).
    2. Clicking **"Generate With AI"** creates a record in `iar_aiissuegeneratedlogses` with `iar_aigenerationstatus: 1` (`Pending`), `iar_type: 822500000` (`Generation`), and `iar_additionalinformation` storing serialized key-value JSON text of optional fields + `created_by` and `created_on`.
    3. Triggers flow `AIIssueGeneration` passing `auditable_entity`, `audit_engagement_id`, `audit_job_id`, `issue_id` (`iar_aiissuegeneratedlogsid`), `technology_related` (boolean, `true` for IT, `false` for FinOps), `issue`, `operation_type`, and `additional_info`.
    4. Upon receiving `generateoutput`, parses JSON response into 6 granular records in `iar_aigeneratedfieldlogses` linked via `"iar_AIGenerationID@odata.bind"`:
       - `1`: `Issue Title` $\leftarrow$ `response.issue_header`
       - `2`: `Description` $\leftarrow$ `response.rectified_issue`
       - `3`: `Root Cause` $\leftarrow$ `response.root_cause`
       - `4`: `Impact` $\leftarrow$ `response.impact`
       - `5`: `Recommendation` $\leftarrow$ `response.recommendations`
       - `6`: `Non Compliance Reference` $\leftarrow$ `response.non_compliance_references` (received as JSON value)
    5. Parent log status is updated to `2` (`Success`) or `3` (`Failed`).
    6. UI renders AI review screen with synthesized fields; auditor can edit text and supply field-level feedback via `iar_remark`.
    7. On **Create Issue**: Inserts finding into `iar_issueses` with initial review status based on creator persona and action:
       - Staff Creator: Save $\rightarrow$ `Pending Staff` (`822500000`); Submit $\rightarrow$ `Pending TC` (`822500001`).
       - TC Creator: Save $\rightarrow$ `Pending TC` (`822500001`); Submit $\rightarrow$ `Pending Manager` (`822500002`).
       - Manager Creator: Save $\rightarrow$ `Pending Manager` (`822500002`); Submit $\rightarrow$ `Manager Completed` (`822500003`) or `Ready for Director Submission` (`822500004`).
       - Updates accepted generation log status to `4` (`Issue Created`), and binds `"iar_IssueID@odata.bind"` across all session generation logs.
    8. On **Cancel**: Updates parent log status to `5` (`Issue Cancelled`).
    9. On **Regenerate**: Re-invokes flow with `operation_type: "Regeneration"` and `iar_type: 822500001`.
- **Audit Report Studio Interactive Operations**:
  - **Call Back**: Flexible pull mechanism enabling any persona to recall an issue from any upper-level review down to `Pending with [Calling Persona]` (Staff $\rightarrow$ `Pending Staff`, TC $\rightarrow$ `Pending TC`, Manager $\rightarrow$ `Pending Manager`, Director $\rightarrow$ `Pending Director`) with mandatory remarks, logged in `iar_issuelogses` (`iar_logtype: 2`, `iar_logsubtype: 2`, `iar_workflowremarks: [Reason]`).
  - **Send To**: Standalone button (adjacent to Call Back) enabling routing to any peer reviewer. On click, opens a modal listing **only users assigned to the current engagement** in `iar_securityassignmentses`, displaying their persona role and user name. Selecting a recipient transitions `iar_issuestatus` to `Pending [Target Persona]`, binds `"iar_CurrentOwner@odata.bind"` on `iar_issueses` to that user's `systemusers` record, and logs to `iar_issuelogses` (`iar_logtype: 2`, `iar_logsubtype: 3`, `iar_workflowremarks: [Remarks]`). Distinct from Director-only "Send to Business".
  - **Team Member Editability Across Pending Tiers**: Any team member assigned to the engagement can edit finding fields during any active `Pending` status (`Pending Staff`, `Pending TC`, `Pending Manager`, `Pending Director`), fostering agile collaborative review.
  - **Submissions with Remarks**: All status advancements support entering reviewer remarks stored in `iar_issuelogses.iar_workflowremarks` and `iar_issueses.iar_workflowremarks`.
  - **Include & Exclude Issues (Status `822500009: Excluded`, Batch Exemption & Persona Re-inclusion)**: Softly excludes a finding from the final report by setting `iar_issuestatus: 822500009` (`Excluded`) with remarks. Details become read-only with an amber exclusion banner. Excluded issues are treated as soft-deleted and **do NOT block or influence** Manager batch progression to `Ready for Director Submission`. Re-inclusion ("Include Issue in Report") transitions the finding directly into **`Pending with [Persona performing include]`** (Staff $\rightarrow$ `Pending Staff`, TC $\rightarrow$ `Pending TC`, Manager $\rightarrow$ `Pending Manager`, Director $\rightarrow$ `Pending Director`), logging to `iar_issuelogses` (`iar_logsubtype: 10 Include`).
  - **Mark Not My Function**: Toggles `iar_function` between `IT` (`822500000`) and `FinOps` (`822500001`), maintaining current review stage while transferring domain ownership to the peer track, logging scope modification in `iar_issuelogses` (`iar_functiontype: 2 Scope Modified`).
  - **Automatic Inactivity-Aware Soft Locking & 1-Hour Auto-Unlock**: Soft record locking is **not a manual button action**; it is acquired dynamically as soon as an active user begins modifying a finding (`iar_lockstatus = true`, `iar_LockedBy` bound to editor GUID). For all other viewers, fields and workflow transition buttons are disabled, displaying an active editor banner (*"🔒 Currently being edited by [User Name] — changes are locked for other users"*). When the current editor finishes or leaves (clicking Submit, clicking Cancel, switching findings in the Navigator, or closing the browser tab), the lock is released immediately and other users are enabled. If the current editor enters inactive mode, the system enforces **auto-unlock after 1 hour of user inactivity**: at 59 minutes, a 60-second countdown prompt appears; if no keystrokes or mouse actions occur, the application automatically clears the lock (`iar_lockstatus = false`, `iar_LockedBy = null`), reverts the view to read-only, and re-enables all other users. Stale locks (> 1 hour without active heartbeat) are automatically evicted on concurrent access. Logged in `iar_issuelogses` (`iar_logsubtype: 4 Locking`).
  - **Audit Report Page Auto-Save (Manual Submissions Only)**: On the Audit Report page workpapers, all finding field modifications (narratives, dropdowns, references) are **automatically saved (auto-saved)** to Dataverse via debounced updates (1.5s–2s) as the auditor edits, accompanied by an intuitive visual status indicator (*"Saving..."* / *"All changes saved at [time]"*). Only formal workflow submissions (`Submit to TC`, `Submit to Manager`, `Batch Submit to Director`, `Send to Business`, `Complete and Sign-Off`) remain strictly manual via dedicated action buttons with reviewer remarks. To prevent log bloat from high-frequency typing patches, GxP field-level audit trail logs in `iar_issuelogses` (`iar_logtype: 3 Field Edits`) are emitted on field blur or workflow submission rather than on every raw keystroke auto-save.
- **Regulatory Audit Trail**: Ensure every state advancement, lock/unlock, AI adoption, exclusion, and sign-off writes an immutable entry to `iar_issuelogses` / `iar_auditreportlogs`.




---

## 5. Power Apps Code Apps & Codebase Engineering Best Practices

### 5.1 Clean Architecture & Service Layer Abstraction
- **Decoupled Data Services**: Never bind UI components directly to raw API fetches or static JSON files. Implement a clean service abstraction layer (`services/`):
  - `dataverseService.ts`: Centralizes Dataverse Web API OData queries, CRUD operations, and pagination.
  - `flowService.ts`: Centralizes Power Automate HTTP trigger invocations (AI synthesis, workflow progression, notifications).
  - `storageService.ts`: Encapsulates SharePoint file uploads/downloads and ADLS queries.
- **Local Dev vs. Power Apps Runtime Adapter (Dual-Mode)**:
  - Implement an environment-aware Data Provider interface (`IDataProvider`).
  - When running locally in Vite (`import.meta.env.DEV`), initialize the application using mock/seed adapters that mirror Dataverse entity structures.
  - When deployed inside Power Apps Code App context, seamlessly switch to native Dataverse Web API / PCF WebApi context without code refactoring.

### 5.2 State Management & Performance Optimization
- **Predictable Central Store**: Manage global application state (active assessment, active engagement, user persona/role, drawer visibility) using a unified React Context or custom hook architecture.
- **Prevent Unnecessary Re-Renders**:
  - Audit workpapers contain extensive text fields and collapsible sections. Use `React.memo`, `useMemo`, and `useCallback` for finding cards, list items, and table rows to prevent lag during rapid keystrokes.
  - Use debouncing (300ms) on search inputs and auto-save fields.
- **Optimistic UI with Rollback**: For status transitions and comment resolution, update UI state optimistically while dispatching the background service call; rollback cleanly and toast an alert if the service returns an error.

### 5.3 Dataverse OData & Power Automate Best Practices
- **Lean OData Queries**:
  - Always specify `$select` to fetch only required fields (e.g. avoid fetching bulky rich-text descriptions when listing issues in grids).
  - Use `$expand` judiciously for related entities (`cr_testprocedure`, `systemuser`).
  - Implement `$top` and `$skip` (or `@odata.nextLink`) for server-side pagination.
- **Concurrency & Soft-Locking**:
  - Implement soft record locking (`isLocked`, `lockedBy`, `lockedAt`) to prevent two reviewers from modifying the same finding simultaneously.
  - Check ETags (`If-Match`) on Dataverse updates to prevent lost updates.
- **Resilient Flow Invocations**:
  - Wrap all Power Automate HTTP flow calls in timeout guards (e.g. 30s timeout for LLM synthesis) with user-friendly retry banners.
  - Display non-blocking loading skeletons or button spinners during async flow execution.

### 5.4 TypeScript & Enterprise Code Quality Standards
- **Strict Typing Throughout**:
  - Define explicit TypeScript interfaces in `types/` for every entity (`Engagement`, `Issue`, `AiVersion`, `Comment`, `Assignment`, `ComplianceStandard`).
  - Strict prohibition of `any` types; use union types, generic constraints, and discriminated unions for workflow states.
- **Modular Component Sizing**:
  - Maintain small, single-responsibility files (target < 300 lines). Break large studios into distinct child components (`FindingNavigator`, `WorkpaperSection`, `ActionDock`, `AiComparisonModal`).
- **Error Boundaries & Defensive Coding**:
  - Enclose major views (`AuditReportStudio`, `ExecutiveStudio`, `Queue`) in React Error Boundaries to prevent full-app crashes.
  - Validate all inbound API and Flow payloads before writing to local state.

### 5.5 GxP Security, Accessibility & Regulatory Traceability
- **Immutable Log Emission**: Every state transition, AI adoption, and sign-off must trigger an audit trail entry containing user ID, timestamp, prior state, and new state.
- **Security & Sanitization**: Sanitize all rich text and markdown content before rendering to eliminate XSS risks. Never hardcode credentials, flow URLs, or API keys in source code; use Power Platform environment variables.
- **Accessibility Compliance**: Ensure full keyboard navigation (`Tab`, `Esc` for modals/drawers), ARIA labels on icon buttons, and color contrast compliance (WCAG 2.1 AA).
