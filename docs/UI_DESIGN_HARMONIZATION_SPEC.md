# UI & UX Design System Specification
## Component Harmonization Guide & Corporate Brand Standards

---

## 1. Executive Purpose & Design Philosophy

The customer requires the **IAR (Intelligent Audit Reporting)** application to match the visual language, colors, typography, and component ergonomics of their existing enterprise auditor application.

This specification formalizes the design system extracted from [`Backup_IAR-components`](file:///d:/IAR/Backup_IAR-components/) and outlines the exact migration rules to transform the prototype views from [`Backup_JNJ_IAR`](file:///d:/IAR/Backup_JNJ_IAR/) into a unified, corporate-grade **Power Apps Code App**.

---

## 2. Brand Identity & Design Token Palette

All styles derive from the central design tokens defined in [`mui.theme.tsx`](file:///d:/IAR/Backup_IAR-components/src/mui.theme.tsx), [`index.css`](file:///d:/IAR/Backup_IAR-components/src/index.css), and [`App.css`](file:///d:/IAR/Backup_IAR-components/src/App.css):

### 2.1 Corporate Brand Colors

| Token Name | CSS Variable | Hex Code | Visual Swatch & Application |
| :--- | :--- | :--- | :--- |
| **J&J Primary Blue** | `--jj-blue` | `#000099` | Primary brand color, primary contained buttons, active navigation indicators, major headers. |
| **J&J Primary Red** | `--jj-red` | `#eb1700` | Secondary brand color, outlined button borders, dropdown arrows, notification badges, critical alerts. |
| **J&J Dark Red** | `--jj-red-dark` | `#801206` | Hover state for red elements, critical risk emphasis. |
| **J&J Charcoal Black** | `--jj-black` | `#212121` | Primary body typography, high-contrast headings, dark table headers. |
| **J&J Grey Dark** | `--jj-grey-dark` | `#63666a` | Subtitle text, inactive tabs, secondary metadata. |
| **J&J Neutral Grey** | `--jj-grey` | `#888b8d` | Table head column labels, placeholder text, border dividers. |
| **J&J Light Grey** | `--jj-grey-light` | `#d8d8d8` | Standard input borders, card borders, table row dividers. |
| **J&J Extra Light Grey** | `--jj-grey-extra-light`| `#f4f4f4` | Page background, alternating zebra rows, disabled input backgrounds. |
| **Bright Blue Accent** | `--blue-bright` | `#0e65e8` | Text button variants, clickable hyperlinks, focused input rings. |
| **Light Blue Tint** | `--blue-light` | `#f1f4ff` | Table selected row background, informational callout cards. |

---

### 2.2 Severity & Risk Assessment Tokens

Used consistently across Issue criticality chips, risk indicators, and executive matrices:

| Severity Level | CSS Variable | Hex Code | Dot Indicator Class | Usage Example |
| :--- | :--- | :--- | :--- | :--- |
| **Critical / Very High** | `--risk-high` | `#e35050` / `#eb1700` | `.strengthHigh`, `.strengthVeryHigh` | Critical findings, GxP violations, VP sign-off triggers. |
| **Major / High** | `--orange` | `#ff8200` | `.strengthModerate` | Major audit findings, overdue remediation dates. |
| **Moderate / Medium** | `--orange` | `#ff8200` | `.strengthModerate` | Control deficiencies with medium financial/operational impact. |
| **Minor / Low** | `--risk-low` | `#087d0d` | `.strengthLow`, `.strengthNone` | Procedural oversights, minor documentation gaps. |
| **Informational / Unassigned** | `--jj-grey-dark` | `#63666a` | `.strengthUnknown` | Standby issues, pending categorization. |

---

### 2.3 Typography Standards

- **Primary Font Family**: `"jj-circular", Arial, Helvetica, sans-serif`
- **Fallback**: System sans-serif stack.
- **Font Scale Hierarchy**:
  - `Display / Page Title`: 24px (1.5rem), Weight: 900 (Bold), Line Height: 1.2
  - `Section Header (H2)`: 18px (1.125rem), Weight: 700, Line Height: 1.3
  - `Card / Workpaper Title (H3)`: 15px (0.9375rem), Weight: 700, Line Height: 1.4
  - `Standard Body`: 13px (0.8125rem), Weight: 400 (Regular), Line Height: 1.5, Color: `#212121`
  - `Form Labels`: 12px (0.75rem), Weight: 700 (Medium/Bold), Color: `#212121`
  - `Table Headers & Badges`: 11px (0.6875rem), Weight: 600, Text Transform: Uppercase / None, Color: `#63666a`
  - `Caption / Audit Timestamps`: 11px (0.6875rem), Weight: 400, Color: `#888b8d`

---

## 3. Standardized Shared Component Catalog

All views in the new IAR application must strictly consume the components located in [`Backup_IAR-components/src/components/shared/`](file:///d:/IAR/Backup_IAR-components/src/components/shared/):

```
Backup_IAR-components/src/components/shared/
├── SharedTable.tsx           <-- Unified Grid with Sorting, Selection & Pagination
├── SharedAccordion.tsx       <-- Standard Collapsible Findings & Workpaper Sections
├── buttons/
│   └── SharedButton.tsx      <-- Primary, Outlined Secondary & Text Actions
├── inputs/
│   ├── SharedTextInput.tsx   <-- Single-line text input
│   ├── SharedTextArea.tsx    <-- Finding narratives, root cause, recommendations
│   ├── SharedSelect.tsx      <-- Single select with J&J Red Chevron
│   ├── SharedMultiSelect.tsx <-- Multi-value selection with chip pills
│   ├── SharedAutocomplete.tsx<-- Searchable typeahead (Test Procedures / Users)
│   ├── SharedSearchInput.tsx <-- Instant debounce search field
│   └── SharedRadioGroup.tsx  <-- Binary / option selection
└── common/
    ├── SharedFieldLabel.tsx  <-- Standard label with required asterisk (*)
    └── SharedFieldError.tsx  <-- Inline validation feedback
```

### 3.1 Component Specifications

#### A. `SharedTable`
- **Source**: [`SharedTable.tsx`](file:///d:/IAR/Backup_IAR-components/src/components/shared/SharedTable.tsx)
- **Used In**: `MyAuditsView` (Audit Queue), `AuditIssuesView` (Global Issue Ledger), `ExecutiveReportView` (Scope Matrix).
- **Key Features**:
  - Typed column definition interface `TableColumn<T>`.
  - Native sorting with direction indicators (`asc` / `desc`).
  - Checkbox multi-row selection for batch actions.
  - Built-in pagination with configurable rows-per-page (10, 25, 50).
  - Selected row highlight using `--blue-light` (`#f1f4ff`).
  - Severity status dot indicator via `.strength` class.

#### B. `SharedAccordion`
- **Source**: [`SharedAccordion.tsx`](file:///d:/IAR/Backup_IAR-components/src/components/shared/SharedAccordion.tsx)
- **Used In**: `AuditReportView` (Workpaper Sections: Root Cause, Impact, Recommendation, Mitigations, Management Response).
- **Key Features**:
  - Zero elevation (`elevation: 0`) with clean bottom border divider.
  - Multi-column header summary showing section status, completion badge, and comment bubble.
  - Smooth animation collapse/expand with controlled accordion groups.

#### C. `SharedButton`
- **Source**: [`SharedButton.tsx`](file:///d:/IAR/Backup_IAR-components/src/components/shared/buttons/SharedButton.tsx)
- **Variants**:
  - `contained`: Solid J&J Blue background (`#000099`), white text. Used for primary calls to action (`Save Issue`, `Submit for Review`, `Sign Off`).
  - `outlined`: White background, J&J Red border (`#eb1700`), dark text (`#212121`). Used for secondary actions (`Cancel`, `Export PDF`, `Regenerate AI`).
  - `text`: Borderless, bright blue text (`#0e65e8`). Used for auxiliary inline actions (`View History`, `Filter Reset`).
- **States**: Built-in loading spinner, disabled state with opacity attenuation.

#### D. Form Inputs (`SharedTextInput`, `SharedTextArea`, `SharedSelect`)
- **Sources**: [`SharedTextInput.tsx`](file:///d:/IAR/Backup_IAR-components/src/components/shared/inputs/SharedTextInput.tsx), [`SharedTextArea.tsx`](file:///d:/IAR/Backup_IAR-components/src/components/shared/inputs/SharedTextArea.tsx), [`SharedSelect.tsx`](file:///d:/IAR/Backup_IAR-components/src/components/shared/inputs/SharedSelect.tsx)
- **Styling Rules**:
  - Consistent border color: `--jj-grey-light` (`#d8d8d8`).
  - Focus state: Subtle bright blue border with 2px ring.
  - Dropdown arrows: Stylized J&J Red SVG chevron (`#eb1700`).
  - Paired with `SharedFieldLabel` (includes red `*` when `required={true}`).
- **Master Data Read-Only vs. App-Managed Field States**:
  - **Upstream Synced Master Fields**: Data originating from the 1-hour scheduled flow (`iar_assessments`, `iar_engagementses`, `iar_procedureses`, `iar_securityassignmentses`) must render in a read-only or disabled presentation (`disabled={true}`, read-only badge, or non-editable summary box). This preserves data integrity by preventing users from mutating upstream source planning/ERP records.
  - **App-Managed Narrative & Governance Fields**: Fields authored in the application (Issue Title, Original Issue, Root Cause, Impact, Recommendation, Mitigating Controls, Management Response, Action Plan, and Comments) are fully interactive and editable by authorized audit personas based on review status.

---


## 4. Screen Harmonization & Migration Blueprint

| Screen / View | Prototype Implementation (`Backup_JNJ_IAR`) | Target Harmonized Implementation (`Backup_IAR-components`) |
| :--- | :--- | :--- |
| **Global Top Header** | Dark slate / custom flex header with custom phase pills. | **J&J Corporate App Header**: Clean white background, authentic `jj-logo.png` (553x113) with `GA&A INTERNAL AUDIT REPORTING` subtitle, clean horizontal phase navigation with solid J&J Red (`#eb1700`, 4px) active underline indicator, user profile widget with avatar circle (`Tamilselvan`), and full-width repeating blue patterned ribbon (`header-bg.png`, 13px height) with bottom elevation shadow. |
| **My Audits (Audit Queue)** | Custom grid cards with ad-hoc badge colors. | **`SharedTable` Integration**: Uniform data grid with engagement status pills, sortable columns, and primary blue action buttons (`Work on Report`). |
| **Workpaper Sections & Finding Navigator** | Custom open cards with loose form inputs. | **`SharedAccordion` Groups & Intuitive Feedback Indicators**: Structured, collapsible finding sections with section completion badges and field-level comment counts. <br/>• **Intuitive Business Feedback Indicator**: Dedicated chip on Finding Navigator card (`💬 Biz Feedback: [count]`) with unread notification dot.<br/>• **Business Dialogue Section**: Dedicated `SharedAccordion` section rendering in-between auditee comments from `iar_businesscomments` with read-acknowledgement. |
| **Workpaper Inputs** | Native HTML `<textarea>` and `<input>`. | **`SharedTextArea` and `SharedTextInput`**: Corporate padding, typography, auto-resize, character limits, and focus borders. |
| **Criticality Selectors**| Custom select boxes with inline hex colors. | **`SharedSelect` with J&J Red Chevron**: Options rendered with standardized severity dot indicators (`.strengthHigh`, `.strengthModerate`, `.strengthLow`). |
| **AI Generation Drawer / Dialog** | Custom Tailwind drawer with bright gradients. | **Standardized `CreateIssueDialog`**: <br/>• **Step 1 (Input)**: Clean dialog with `SharedSelect` for Test Procedure and Function (`IT` \| `FinOps`), `SharedTextArea` for Original Issue, and expandable accordion for optional fields (Criticality, SOX Reportable, Process Area, Root Cause Type). Action button: `SharedButton` (`contained` blue) **"Generate With AI"** (with spinner state).<br/>• **Step 2 (AI Review Screen)**: Renders synthesized fields (`Issue Title`, `Description`, `Root Cause`, `Impact`, `Recommendation`, `Non Compliance Reference`) with editable inputs and inline `iar_remark` feedback fields for fine-tuning. Action buttons: `SharedButton` (`contained` blue) **"Create Issue"** (transitions log to `Issue Created` [4] and binds issue ID), `SharedButton` (`outlined` red) **"Regenerate"**, and **"Cancel"** (transitions log to `Issue Cancelled` [5]). |
| **Workflow Actions Bar & Sign-Off** | Floating custom action buttons. | **Fixed Sticky Action Bar**: Bottom dock with review status breadcrumbs and action button suite: <br/>• **Auto-Save Status Pill**: Continuous debounced auto-save status indicator in toolbar (*"🔄 Saving..."* / *"☁️ All changes saved at [time]"*).<br/>• **`Call Back`**: Standalone button prompting for recall reason.<br/>• **`Send To`**: Standalone button opening a recipient selection modal listing all personas and their assigned user names on the engagement with mandatory notes.<br/>• **Persona Transition Actions**: J&J Blue contained primary actions, J&J Red outlined secondary actions (e.g. `Submit to TC`, `Submit Batch to Director`). Submissions are manual only.<br/>• **`Send to Business`**: Standalone Director-only button visible exclusively in `Pending Director` upon review completion to dispatch findings to the Business Contact Canvas App.<br/>• **`Complete and Sign-Off`**: Dedicated J&J Blue `contained` button held by Director (0 Critical) or VP ($\ge 1$ Critical). **Direct one-click execution without remarks or e-signature dialogs**, instantly advancing `iar_reportstatus`. |
| **Audit Report Finding Actions & Modals** | Ad-hoc alert dialogs and inline menus. | **Standardized Finding Management Suite**: <br/>• **More Actions Menu**: Three-dots popup with *Track Changes*, *Mark Not My Function Issue*, and *Mark Exclude Issue* (or *Include Issue in Report*).<br/>• **Call Back Modal**: Standard modal prompting reviewer transition remarks/rationale.<br/>• **Send To Modal**: Recipient selection modal displaying all personas and user names assigned to the engagement with mandatory instructions input.<br/>• **Soft Exclusion Banner**: Prominent amber banner (*"This finding has been softly excluded from the audit report: [Reason]. Do you want to include?"*).<br/>• **Concurrency Lock Banner**: Informational banner with editor avatar and name (*"🔒 Locked by [User Name] — currently editing. Auto-unlocks after 1 hour of inactivity."*).<br/>• **Inactivity Warning Countdown Modal**: Modal alert appearing at 59 minutes with a 60-second countdown before auto-unlock.<br/>• **Reorder Warning Modal**: Confirmation modal triggered on dragging/re-ordering findings, informing that report reference numbers will be re-sequenced across all findings. |


---

## 5. Header Chrome & Ribbon Visual Specifications

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Johnson&Johnson      Pre-Planning   Planning   Fieldwork   Reporting   Wrap-up  Dashboards   🔔  👤 Tamilselvan ▾ │
│  GA&A INTERNAL AUDIT REPORTING                              ═════════                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ [BLUE PATTERN RIBBON: 13px header-bg.png] ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Brand Logo Unit**:
   - Asset: `src/assets/jj-logo.png`
   - Render Height: `28px` (maintaining natural aspect ratio).
   - Subtitle: `GA&A INTERNAL AUDIT REPORTING` (Font: `10px`, weight: `700`, letter-spacing: `0.8px`, color: `#63666a`).
2. **Navigation Items**:
   - Font: `14px`, weight: `700` (`#000000`), hover: `#eb1700`.
   - Active Indicator: Solid J&J Red (`#eb1700`, `4px` height) rendered via `border-bottom: 4px solid #eb1700` directly under the active navigation text, with a clean white clearance (~16px) above the blue patterned ribbon without touching or overlapping it.
3. **Sub-Header Blue Ribbon**:
   - Asset: `src/assets/header-bg.png` (dimensions `1905x13`).
   - Styling: `height: 13px; width: 100%; background-repeat: repeat-x; background-size: auto 13px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);`.
4. **User & Utility Controls**:
   - Bell: Clean line stroke icon (`20px`, `#000000`) with subtle unread red pip indicator.
   - User Profile: Circle user silhouette outline icon, display name `Tamilselvan`, and small chevron down (`#000000`). Clicking opens the role/persona popover.
   - **Admin Impersonate User**: For Global Administrators (`iar_administratorses`), the profile popover includes an **"Impersonate User"** action modal allowing the admin to search and select any user to preview their assigned queue and review states.
   - **Active Impersonation Header Banner**: When active, a persistent alert banner displays directly beneath the header ribbon: *"You are viewing as [User Name] (Role: [LogicKey]) — [Exit Impersonation]"* (Background `#fff3cd`, Text `#856404`, Border `#ffeeba`, padding `8px 24px`, exit button: `#000099`).


5. **Audit Queue Filters & Assessment Year Status Pills**:
   - The Assessment Year filter dropdown displays each year accompanied by its current **Assessment State** pill badge:
     - **`Open`**: Background `#e6f4ea`, Text `#137333`, Border `#ceead6` (8px pill, 11px font weight 700).
     - **`Reopened`**: Background `#fef7e0`, Text `#b06000`, Border `#fdd663`.
     - **`Finalized`**: Background `#f1f3f4`, Text `#5f6368`, Border `#dadce0`.



