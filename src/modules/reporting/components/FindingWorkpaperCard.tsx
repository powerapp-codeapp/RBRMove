import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Issue, CriticalityLevel, IssueStatus, IssueComment } from '../../../types/dataverse.types';
import { FieldCommentPopover, type CommentUser } from './FieldCommentPopover';
import {
  SharedButton,
  SharedSelectButton,
  SharedTextInput,
  SharedTextArea,
  SharedSelect,
  SharedMultiSelect,
  SharedCheckbox,
  SharedListBoxFilter,
  SharedTooltip,
  AIInput,
  ReferenceComponent,
} from '../../../components/shared';
import type { ListBoxFilterOption } from '../../../components/shared';
import {
  History,
  MessageSquare,
  Mail,
  MailOpen,
  Lock,
  Eye,
  RotateCcw,
  Ban,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Upload,
  FileText,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { synthesizeAiDraft } from '../utils/aiSynthesisHelper';
import { getRoleDetails } from '../utils/reportingWorkflowEngine';
import { AiVersionCompareDialog, type AiCompareFieldData } from './AiVersionCompareDialog';
import { GuidelinesDrawer } from './GuidelinesDrawer';
import {
  BusinessOwnerCommentsDrawer,
  type BusinessOwnerCommentItem,
} from './BusinessOwnerCommentsDrawer';
import { WorkflowSubmitButton } from './WorkflowSubmitButton';
import { WorkflowRemarksModal } from './WorkflowRemarksModal';
import { SystemusersService } from '../../../generated/services/SystemusersService';

interface FindingWorkpaperCardProps {
  issue: Issue;
  onUpdateIssue: (updated: Issue) => void;
  onOpenAiCompare?: () => void;
  onOpenLogs: () => void;
  onOpenComments?: (fieldKey: string, fieldLabel: string) => void;
  commentCounts?: Record<string, number>;
  comments?: IssueComment[];
  onAddComment?: (fieldKey: string, fieldLabel: string, content: string, taggedUser?: CommentUser) => void;
  onResolveComment?: (commentId: string) => void;
  isAiSynthesizing?: boolean;
  onTriggerAiSynthesis?: () => void;
  canEdit: boolean;
  editRestrictionReason?: string | null;
  onExcludeIssue?: (issueId: string) => void;
  onIncludeIssue?: (issueId: string) => void;
  onToggleLock?: (issueId: string) => void;
  onAcquireLock?: (issueId: string) => void;
  onOpenCallback?: (issueId: string) => void;
  onOpenSendTo?: (issueId: string) => void;
  onMarkNotAnIssue?: (issueId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  currentUser?: { name?: string; role?: string; avatar?: string; userId?: string; email?: string; isAdmin?: boolean };
  isAdmin?: boolean;
  onAdvanceWorkflow?: (targetStatus: IssueStatus, remarks?: string) => void;
  userRole?: string;
  hasCriticalFinding?: boolean;
}

const getCriticalityColor = (crit?: string): string => {
  const c = (crit || '').trim().toLowerCase();
  if (c === 'critical') return '#D8001D';
  if (c === 'major') return '#EA580C';
  if (c === 'moderate') return '#D97706';
  if (c === 'minor') return '#16A34A';
  return '#334155';
};

const CRITICALITY_OPTIONS = [
  { value: 'Critical', label: 'Critical' },
  { value: 'Major', label: 'Major' },
  { value: 'Minor', label: 'Minor' },
];


const PROCESS_AREA_OPTIONS = [
  { value: 'Access Control & IAM', label: 'Access Control & IAM' },
  { value: 'Cybersecurity & Infrastructure', label: 'Cybersecurity & Infrastructure' },
  { value: 'Regulatory Compliance & GxP', label: 'Regulatory Compliance & GxP' },
  { value: 'Supply Chain & Manufacturing', label: 'Supply Chain & Manufacturing' },
  { value: 'Financial Controls & SOX', label: 'Financial Controls & SOX' },
  { value: 'Change Management & DevOps', label: 'Change Management & DevOps' },
  { value: 'Quality Assurance & Calibration', label: 'Quality Assurance & Calibration' },
  { value: 'Catheter Line 3 Electrophysiology', label: 'Catheter Line 3 Electrophysiology' },
  { value: 'Cleanroom HVAC Unit 4', label: 'Cleanroom HVAC Unit 4' }
];

const TEST_PROCEDURE_OPTIONS = [
  { value: 'TP-101', label: 'TP-101: User Access & Authentication Review' },
  { value: 'TP-102', label: 'TP-102: Privileged Access Management Verification' },
  { value: 'TP-103', label: 'TP-103: Automated Telemetry & Calibration Logging Review' },
  { value: 'TP-104', label: 'TP-104: Segregation of Duties & Authorization Matrix' },
  { value: 'TP-105', label: 'TP-105: Third-Party Vendor Network Access Deprovisioning' },
  { value: 'TP-110', label: 'TP-110: GxP Software Validation & Data Integrity Audit' },
];

const YES_NO_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes' },
];

const ROOT_CAUSE_TYPE_OPTIONS = [
  { value: 'Process Gap', label: 'Process Gap' },
  { value: 'System Configuration', label: 'System Configuration' },
  { value: 'Human Oversight', label: 'Human Oversight' },
  { value: 'Third-Party Dependency', label: 'Third-Party Dependency' },
  { value: 'Resource Constraint', label: 'Resource Constraint' },
  { value: 'Operating Effectiveness', label: 'Operating Effectiveness' },
  { value: 'Design Effectiveness', label: 'Design Effectiveness' },
  { value: 'Automated Sensor Calibration Drift', label: 'Automated Sensor Calibration Drift' }
];

const ISSUE_TYPE_OPTIONS = [
  { value: 'Operational', label: 'Operational' },
  { value: 'Compliance', label: 'Compliance' },
  { value: 'Financial / SOX', label: 'Financial / SOX' },
  { value: 'IT / Cybersecurity', label: 'IT / Cybersecurity' },
  { value: 'Regulatory / GxP', label: 'Regulatory / GxP' },
  { value: 'Reputational / Strategic', label: 'Reputational / Strategic' }
];

const ISSUE_SOURCE_OPTIONS = [
  { value: 'Internal Audit', label: 'Internal Audit' },
  { value: 'External Audit (PwC)', label: 'External Audit (PwC)' },
  { value: 'Regulatory Inspection (FDA / ISO)', label: 'Regulatory Inspection (FDA / ISO)' },
  { value: 'Management Self-Identified', label: 'Management Self-Identified' },
  { value: 'Continuous Monitoring Feed', label: 'Continuous Monitoring Feed' }
];

const KEY_THEME_OPTIONS = [
  { value: 'Access Governance & Authorization Matrix', label: 'Access Governance & Authorization Matrix' },
  { value: 'Financial Close & Reporting', label: 'Financial Close & Reporting' },
  { value: 'Manufacturing Telemetry & Calibration', label: 'Manufacturing Telemetry & Calibration' },
  { value: 'Third-Party Vendor Risk', label: 'Third-Party Vendor Risk' },
  { value: 'Change Management & DevOps', label: 'Change Management & DevOps' },
  { value: 'GxP Electronic Records & Data Integrity', label: 'GxP Electronic Records & Data Integrity' }
];

const ACCOUNTABLE_FUNCTION_OPTIONS = [
  { value: 'IT Infrastructure & Identity Access Management', label: 'IT Infrastructure & Identity Access Management' },
  { value: 'Finance Operations & Internal Controls', label: 'Finance Operations & Internal Controls' },
  { value: 'Global Supply Chain & Logistics', label: 'Global Supply Chain & Logistics' },
  { value: 'Quality Assurance & Regulatory Compliance', label: 'Quality Assurance & Regulatory Compliance' },
  { value: 'Commercial & Marketing Operations', label: 'Commercial & Marketing Operations' },
  { value: 'Research & Development (R&D)', label: 'Research & Development (R&D)' }
];

const IT_ASSET_ACCOUNTABLE_SECTOR_OPTIONS = [
  { value: 'MT', label: 'MT (MedTech)' },
  { value: 'IM', label: 'IM (Innovative Medicine)' },
  { value: 'Consumer Health', label: 'Consumer Health' },
  { value: 'CORP', label: 'CORP (Corporate Enterprise)' },
  { value: 'ISRM', label: 'ISRM (InfoSec Risk Management)' },
  { value: 'TS', label: 'TS (Technology Services)' }
];

const IMPACTED_REGION_OPTIONS = [
  { value: 'NA', label: 'NA (North America)' },
  { value: 'EMEA', label: 'EMEA (Europe, Middle East, Africa)' },
  { value: 'LATAM', label: 'LATAM (Latin America)' },
  { value: 'APAC', label: 'APAC (Asia Pacific)' }
];

const IMPACTED_SECTOR_OPTIONS = [
  { value: 'MED', label: 'MED (Medical Devices)' },
  { value: 'PHR', label: 'PHR (Pharmaceuticals)' },
  { value: 'CPC', label: 'CPC' },
  { value: 'GS-NOP', label: 'GS-NOP' },
  { value: 'NOP', label: 'NOP' },
  { value: 'Ortho_Synthes', label: 'Ortho_Synthes' }
];

const IMPACTED_MRC_OPTIONS = [
  { value: 'MRC-01: Global Supply Chain & Manufacturing Operations', label: 'MRC-01: Supply Chain & Manufacturing' },
  { value: 'MRC-02: Commercial Operations & Revenue Assurance', label: 'MRC-02: Commercial Operations' },
  { value: 'MRC-03: Research & Development', label: 'MRC-03: Research & Development' },
  { value: 'MRC-04: Global Shared Services & Global Functions', label: 'MRC-04: Global Shared Services' },
  { value: 'MRC-05: Treasury & Capital Management', label: 'MRC-05: Treasury & Capital' }
];

const QUARTER_IMPACTED_OPTIONS = [
  { value: 'Q1 2026', label: 'Q1 2026' },
  { value: 'Q2 2026', label: 'Q2 2026' },
  { value: 'Q3 2026', label: 'Q3 2026' },
  { value: 'Q4 2026', label: 'Q4 2026' },
  { value: 'Q1 2025', label: 'Q1 2025' },
  { value: 'Q2 2025', label: 'Q2 2025' },
  { value: 'Q3 2025', label: 'Q3 2025' },
  { value: 'Q4 2025', label: 'Q4 2025' }
];

export type SectionTab = 'all' | 'basic' | 'ai' | 'taxonomies' | 'biz';

const SECTION_TAB_OPTIONS: ListBoxFilterOption<SectionTab>[] = [
  { value: 'all', label: 'All' },
  { value: 'basic', label: 'Basic' },
  { value: 'ai', label: 'AI Fields' },
  { value: 'taxonomies', label: 'Taxonomies' },
  { value: 'biz', label: 'Biz Response' },
];

export const FindingWorkpaperCard: React.FC<FindingWorkpaperCardProps> = ({
  issue,
  onUpdateIssue,
  onOpenAiCompare: _onOpenAiCompare,
  onOpenLogs,
  onOpenComments: _onOpenComments,
  commentCounts: _commentCounts = {},
  comments = [],
  onAddComment,
  onResolveComment,
  isAiSynthesizing: _isAiSynthesizing,
  onTriggerAiSynthesis: _onTriggerAiSynthesis,
  canEdit,
  editRestrictionReason,
  onExcludeIssue,
  onIncludeIssue,
  onToggleLock,
  onAcquireLock,
  onOpenCallback,
  onOpenSendTo,
  onMarkNotAnIssue,
  isCollapsed = false,
  onToggleCollapse,
  currentUser,
  isAdmin = false,
  onAdvanceWorkflow,
  userRole = 'Manager',
  hasCriticalFinding: _hasCriticalFinding = false,
}) => {
  void _hasCriticalFinding;
  const [activeSectionTab, setActiveSectionTab] = useState<SectionTab>('all');
  const [activeCommentField, setActiveCommentField] = useState<string | null>(null);
  const [popoverPlacement, setPopoverPlacement] = useState<'up' | 'down'>('down');
  const [remarksModalConfig, setRemarksModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionLabel: string;
    targetStatus: IssueStatus;
  } | null>(null);

  const isUserAdmin = Boolean(isAdmin);

  // User Tier Calculation based on userRole on the active engagement (supports TeamMate LogicKeys & role titles)
  const userTier = useMemo(() => {
    const r = (userRole || '').toLowerCase();
    if (r.includes('admin') || isUserAdmin) return 99;
    const { baseRole } = getRoleDetails(userRole);
    if (baseRole === 'auditor') return 1;
    if (baseRole === 'team-coordinator') return 2;
    if (baseRole === 'manager') return 3;
    if (baseRole === 'director') return 4;
    if (baseRole === 'vp') return 5;
    if (baseRole === 'primary-business-contact') return 4.5;
    return 1;
  }, [userRole, isUserAdmin]);

  // Finding Stage Tier Calculation
  const issueTier = useMemo(() => {
    const s = (issue.status || '').trim().toLowerCase();
    if (s.includes('exclude')) return -1;
    if (s.includes('complete') || s.includes('signed off')) return 6;
    if (s.includes('vp')) return 5;
    if (s.includes('business')) return 4.5;
    if (s.includes('ready for director')) return 3.8;
    if (s.includes('director')) return 4;
    if (s.includes('manager completed') || s.includes('waiting for other')) return 3.5;
    if (s.includes('manager') || s.includes('mgr')) return 3;
    if (s.includes('tc') || s.includes('coordinator')) return 2;
    if (s.includes('staff') || s.includes('draft') || s.includes('auditor') || !s) return 1;
    return 1;
  }, [issue.status]);

  // If finding is at a further review stage than the logged-in user's role
  const isFurtherStage = useMemo(() => {
    if (issue.isExcluded) return false;
    if (userTier === 99) return false;
    return issueTier > userTier && issueTier > 0;
  }, [issue.isExcluded, issueTier, userTier]);

  const { baseRole: parsedBaseRole } = getRoleDetails(userRole);
  const roleStr = (userRole || '').toLowerCase();
  const isAuditor = parsedBaseRole === 'auditor';
  const isTC = parsedBaseRole === 'team-coordinator';
  const isDirector = parsedBaseRole === 'director';
  const isVP = parsedBaseRole === 'vp';
  const isBusiness = parsedBaseRole === 'primary-business-contact' || roleStr.includes('business') || roleStr.includes('contact');
  const isManager = parsedBaseRole === 'manager';
  void isAuditor;
  void isTC;
  void isDirector;
  void isVP;
  void isBusiness;
  void isManager;

  // Compute read-only state
  const isExcluded = !!issue.isExcluded;
  const isLocked = !!issue.isLocked;

  // Check if locked and whether the current user is the one working on it
  const currentUserName = (currentUser?.name || '').trim().toLowerCase();
  const currentUserId = (currentUser?.userId || (currentUser as any)?.id || '').trim().toLowerCase();
  const currentUserEmail = (currentUser?.email || '').trim().toLowerCase();

  const lockedByName = (
    issue.lockedBy?.name ||
    (typeof (issue as any).lockedBy === 'string' ? (issue as any).lockedBy : '')
  ).trim().toLowerCase();
  const lockedById = (issue.lockedBy?.userId || '').trim().toLowerCase();
  const lockedByEmail = (issue.lockedBy?.email || '').trim().toLowerCase();

  const isLockedByCurrentUser = Boolean(
    isLocked && (
      (currentUserId && lockedById && currentUserId === lockedById) ||
      (currentUserEmail && lockedByEmail && currentUserEmail === lockedByEmail) ||
      (currentUserName && lockedByName && currentUserName === lockedByName)
    )
  );

  // Compute Call Back eligibility based on FRD Section 3.2.1 and role hierarchy
  // Call Back is ONLY valid when an issue has progressed past the user's review tier (issueTier > userTier).
  // E.g., for Manager (Tier 3): an issue in Pending TC (Tier 2) or Pending Staff (Tier 1) CANNOT be called back!
  const canCallBack = useMemo(() => {
    if (isExcluded) return false;
    // Non-function issues and issues locked by another user cannot be called back
    if (!canEdit) return false;
    if (isLocked && !isLockedByCurrentUser) return false;
    const status = (issue.status || '').trim();
    if (status === 'Completed' || status === 'Signed Off' || status === 'Excluded') return false;

    // Director can call back from Pending Business or Pending VP
    if (userTier === 4) {
      const s = status.toLowerCase();
      return s.includes('business') || s === 'pending vp';
    }

    // For Staff (1), TC (2), Manager (3):
    // Call back is valid ONLY IF the finding is at a higher review stage than the user's tier
    // If issueTier <= userTier, the finding has not passed the user's tier, so Call Back is invalid.
    if (userTier < 4) {
      return issueTier > userTier;
    }

    // For pure Admin (userTier 99), allow calling back if issue has moved past draft/staff
    if (userTier === 99) {
      return status !== 'Pending Staff' && status !== 'Draft';
    }

    return false;
  }, [isExcluded, canEdit, isLocked, isLockedByCurrentUser, issue.status, issueTier, userTier]);

  // Peer handover is available inside Issue Actions dropdown for active editable findings
  const canSendTo =
    canEdit &&
    !isExcluded &&
    issue.status !== 'Completed' &&
    issue.status !== 'Signed Off' &&
    (!isLocked || isLockedByCurrentUser) &&
    (!isFurtherStage || isUserAdmin);

  // If issue is at a further review stage than the user's role, or locked by another user, or domain restricted, it is non-editable (Read-Only)
  const isFieldDisabled = !canEdit || isExcluded || isFurtherStage || (isLocked && !isLockedByCurrentUser);

  // Exclude / Include is only allowed when the issue is editable (not read-only, not non-function, not in a higher review stage, not locked by another user, and not completed)
  const canExclude =
    canEdit &&
    !isFieldDisabled &&
    issue.status !== 'Completed' &&
    issue.status !== 'Signed Off';

  // For excluded issues, action buttons are not applicable
  const canShowIssueButtons = !isExcluded;

  const [systemUsers, setSystemUsers] = useState<{ value: string; label: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isSubscribed = true;
    SystemusersService.getAll()
      .then((res: any) => {
        if (!isSubscribed) return;
        const users = Array.isArray(res?.data) ? res.data : Array.isArray(res?.value) ? res.value : Array.isArray(res) ? res : [];
        if (users.length > 0) {
          const mapped = users
            .filter((u: any) => u.fullname || u.internalemailaddress)
            .map((u: any) => ({
              value: u.systemuserid || u.id || u.internalemailaddress,
              label: `${u.fullname || u.internalemailaddress}${u.internalemailaddress ? ` (${u.internalemailaddress})` : ''}`
            }));
          setSystemUsers(mapped);
        } else {
          setSystemUsers([
            { value: 'user-01', label: 'Vinay Narasimha (Lead Business Owner)' },
            { value: 'user-02', label: 'Rachel Green (FinOps Lead)' },
            { value: 'user-03', label: 'Marcus Vance (Quality Audit)' },
            { value: 'user-04', label: 'Sarah Jenkins (IT Lead)' }
          ]);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          setSystemUsers([
            { value: 'user-01', label: 'Vinay Narasimha (Lead Business Owner)' },
            { value: 'user-02', label: 'Rachel Green (FinOps Lead)' },
            { value: 'user-03', label: 'Marcus Vance (Quality Audit)' },
            { value: 'user-04', label: 'Sarah Jenkins (IT Lead)' }
          ]);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Close active comment popover on click outside (unless popped out to side drawer)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // If drawer mode is active, do not dismiss on click outside so user can work in center pane
      if (document.querySelector('[data-field-comment-drawer="true"]')) {
        return;
      }
      const target = e.target as HTMLElement;
      if (!target.closest('[data-field-comment-container]')) {
        setActiveCommentField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Available users for tagging in comments
  const availableUsers: CommentUser[] = useMemo(() => {
    if (systemUsers.length > 0) {
      return systemUsers.map((u, idx) => {
        const cleanName = u.label.split('(')[0].trim();
        const initials = cleanName
          .split(' ')
          .map((p) => p[0])
          .filter(Boolean)
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'U';
        const colors = ['#000099', '#eb1700', '#059669', '#0D9488', '#D97706', '#7C3AED'];
        return {
          userId: u.value,
          name: cleanName,
          role: u.label.includes('(') ? u.label.substring(u.label.indexOf('(') + 1, u.label.indexOf(')')) : 'Auditor',
          avatar: initials,
          avatarBg: colors[idx % colors.length],
        };
      });
    }
    return [
      { userId: 'USR-001', name: currentUser?.name || 'Current Auditor', role: userRole || 'Auditor', avatar: 'CA', avatarBg: '#000099' },
      { userId: 'USR-002', name: 'Sarah Jenkins', role: 'IT Audit Manager', avatar: 'SJ', avatarBg: '#eb1700' },
      { userId: 'USR-003', name: 'Brian Cox', role: 'IT Audit Director', avatar: 'BC', avatarBg: '#059669' },
      { userId: 'USR-004', name: 'Elena Rostova', role: 'VP Global Audit', avatar: 'ER', avatarBg: '#0D9488' },
    ];
  }, [systemUsers, currentUser, userRole]);

  const currentCommentUser: CommentUser = useMemo(
    () => ({
      userId: currentUser?.userId || 'USR-001',
      name: currentUser?.name || 'Current Auditor',
      role: userRole || 'Internal Audit',
      avatar: (currentUser?.name || 'CA')
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'CA',
      avatarBg: '#000099',
    }),
    [currentUser, userRole]
  );

  // Determine if function is IT or FinOps
  const isIT = (() => {
    const clean = (issue.function || (issue as any).functionType || issue.testProcedureCode || '')
      .toString()
      .trim()
      .toLowerCase();
    return (
      clean.includes('it') ||
      clean.includes('tp-101') ||
      clean.includes('tp-102') ||
      clean.includes('tp-103') ||
      clean.includes('tp-105') ||
      clean.includes('tp-110')
    );
  })();

  // AI regeneration tracking and comparison state
  const [lastGeneratedParams, setLastGeneratedParams] = useState<{
    originalIssue: string;
    function: 'IT' | 'FinOps';
    testProcedureCode: string;
  } | null>(null);

  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isAiLoadingLocal, setIsAiLoadingLocal] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isGuidelinesDrawerOpen, setIsGuidelinesDrawerOpen] = useState(false);
  const [isBizCommentsDrawerOpen, setIsBizCommentsDrawerOpen] = useState(false);
  const [bizCommentsByIssue, setBizCommentsByIssue] = useState<Record<string, BusinessOwnerCommentItem[]>>({});

  // Build or retrieve demo mock Business Owner comments for the current issue
  const currentBizComments: BusinessOwnerCommentItem[] = useMemo(() => {
    const issueKey = issue.id || 'default-issue';
    if (bizCommentsByIssue[issueKey]) {
      return bizCommentsByIssue[issueKey];
    }
    const primaryOwnerName =
      issue.primaryBusinessOwnerName ||
      issue.accountableContact ||
      issue.businessContactName ||
      'Thomas Wright';
    const primaryInitials = primaryOwnerName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'TW';

    return [
      {
        id: `${issueKey}-biz-1`,
        authorName: primaryOwnerName,
        authorInitials: primaryInitials,
        authorRole: 'Accountable Contact',
        authorTitle: 'VP, Global Operations & Process Governance',
        commentText:
          'We have reviewed the observation and agree with the overall control gap identified. However, please note in the Impact section that compensating manual monthly reconciliations were performed for Q3, so no financial misstatement occurred.',
        commentedAt: 'Oct 27, 2026 • 11:45 AM',
        isDone: false,
      },
      {
        id: `${issueKey}-biz-2`,
        authorName: 'Elena Rostova',
        authorInitials: 'ER',
        authorRole: 'Supporting Business Contact',
        authorTitle: 'Director, Quality Assurance & Compliance',
        commentText:
          'For Recommendation #2 regarding automated role recertification, our IT release calendar schedules the ERP patch deployment for Q1 2027. Requesting the target remediation date be aligned to March 31, 2027.',
        commentedAt: 'Oct 26, 2026 • 04:20 PM',
        isDone: false,
      },
      {
        id: `${issueKey}-biz-3`,
        authorName: primaryOwnerName,
        authorInitials: primaryInitials,
        authorRole: 'Accountable Contact',
        authorTitle: 'VP, Global Operations & Process Governance',
        commentText:
          'Confirmed that the SOP reference number in the finding description should cite SOP-QA-408 Rev 4 rather than Rev 3.',
        commentedAt: 'Oct 25, 2026 • 02:15 PM',
        isDone: true,
        doneBy: currentUser?.name || 'Audit Manager',
        doneAt: 'Oct 26, 2026 • 09:30 AM',
      },
    ];
  }, [
    bizCommentsByIssue,
    issue.id,
    issue.primaryBusinessOwnerName,
    issue.accountableContact,
    issue.businessContactName,
    currentUser?.name,
  ]);

  const openBizCommentsCount = useMemo(
    () => currentBizComments.filter((c) => !c.isDone).length,
    [currentBizComments]
  );

  const handleToggleBizCommentDone = (commentId: string) => {
    const issueKey = issue.id || 'default-issue';
    const updated = currentBizComments.map((c) => {
      if (c.id !== commentId) return c;
      const nextDone = !c.isDone;
      return {
        ...c,
        isDone: nextDone,
        doneBy: nextDone ? currentUser?.name || 'Reviewer' : undefined,
        doneAt: nextDone ? 'Just now' : undefined,
      };
    });
    setBizCommentsByIssue((prev) => ({
      ...prev,
      [issueKey]: updated,
    }));
  };

  const handleMarkAllBizCommentsDone = () => {
    const issueKey = issue.id || 'default-issue';
    const updated = currentBizComments.map((c) =>
      c.isDone
        ? c
        : {
            ...c,
            isDone: true,
            doneBy: currentUser?.name || 'Reviewer',
            doneAt: 'Just now',
          }
    );
    setBizCommentsByIssue((prev) => ({
      ...prev,
      [issueKey]: updated,
    }));
  };
  const [previousAiData, setPreviousAiData] = useState<AiCompareFieldData | null>(null);
  const [candidateAiData, setCandidateAiData] = useState<AiCompareFieldData | null>(null);
  const [fieldRemarks, setFieldRemarks] = useState({
    title: '',
    issueNarrative: '',
    rootCause: '',
    impact: '',
    recommendation: '',
  });

  // Initialize or reset tracking params when issue ID changes
  useEffect(() => {
    setIsBannerDismissed(false);
    setIsCompareOpen(false);
    setLastGeneratedParams({
      originalIssue: (issue.originalIssue || issue.description || issue.title || '').trim(),
      function: isIT ? 'IT' : 'FinOps',
      testProcedureCode: issue.testProcedureCode || '',
    });
    setFieldRemarks({
      title: '',
      issueNarrative: '',
      rootCause: '',
      impact: '',
      recommendation: '',
    });
  }, [issue.id]);

  const currentOriginalIssue = (issue.originalIssue || issue.description || issue.title || '').trim();
  const currentFunction: 'IT' | 'FinOps' = isIT ? 'IT' : 'FinOps';
  const currentTestProc = issue.testProcedureCode || '';

  const hasParamsChanged = Boolean(
    lastGeneratedParams && (
      lastGeneratedParams.originalIssue !== currentOriginalIssue ||
      lastGeneratedParams.function !== currentFunction ||
      lastGeneratedParams.testProcedureCode !== currentTestProc
    )
  );

  const isRegenerateActive = !isExcluded && canEdit && !isFurtherStage && hasParamsChanged && !isBannerDismissed;

  const handleFieldRemarkChange = (field: keyof typeof fieldRemarks, remark: string) => {
    setFieldRemarks((prev) => ({
      ...prev,
      [field]: remark,
    }));
  };

  const handleRegenerateAi = async () => {
    if (isFieldDisabled) return;
    setIsAiLoadingLocal(true);

    const prev: AiCompareFieldData = {
      title: issue.title || '',
      description: issue.issueNarrative || issue.description || issue.issue || '',
      rootCause: issue.rootCause || '',
      impact: issue.impact || '',
      recommendation: issue.recommendation || '',
      nonComplianceReferences: issue.nonComplianceReferences || '',
    };
    setPreviousAiData(prev);

    // Realistic synthesis delay
    await new Promise((res) => setTimeout(res, 800));

    const nextVer = (issue.activeAiVersionNumber || 1) + 1;
    const synthesized = synthesizeAiDraft(
      issue.testProcedureCode || 'TP-101',
      currentOriginalIssue,
      currentFunction,
      {
        updatedIssueHeader: fieldRemarks.title,
        description: fieldRemarks.issueNarrative,
        rootCause: fieldRemarks.rootCause,
        impact: fieldRemarks.impact,
        recommendation: fieldRemarks.recommendation,
      },
      nextVer
    );

    const candidate: AiCompareFieldData = {
      title: synthesized.updatedIssueHeader,
      description: synthesized.description,
      rootCause: synthesized.rootCause,
      impact: synthesized.impact,
      recommendation: synthesized.recommendation,
      nonComplianceReferences: synthesized.nonComplianceReferences || issue.nonComplianceReferences || '',
    };
    setCandidateAiData(candidate);

    setIsAiLoadingLocal(false);
    setIsCompareOpen(true);
  };

  const handleApplyAiMerge = (merged: AiCompareFieldData) => {
    onUpdateIssue({
      ...issue,
      title: merged.title,
      issueNarrative: merged.description,
      description: merged.description,
      rootCause: merged.rootCause,
      impact: merged.impact,
      recommendation: merged.recommendation,
      nonComplianceReferences: merged.nonComplianceReferences ?? issue.nonComplianceReferences,
      activeAiVersionNumber: (issue.activeAiVersionNumber || 1) + 1,
    });
    setLastGeneratedParams({
      originalIssue: currentOriginalIssue,
      function: currentFunction,
      testProcedureCode: currentTestProc,
    });
    setIsBannerDismissed(false);
    setIsCompareOpen(false);
  };

  const handleKeepPrevious = () => {
    setLastGeneratedParams({
      originalIssue: currentOriginalIssue,
      function: currentFunction,
      testProcedureCode: currentTestProc,
    });
    setIsBannerDismissed(true);
    setIsCompareOpen(false);
  };

  const handleFieldChange = (field: keyof Issue, value: any) => {
    if (isFieldDisabled) return;
    if (!isLocked && canEdit && !isExcluded && onAcquireLock) {
      onAcquireLock(issue.id);
    }
    if (field === 'function' || field === 'originalIssue' || field === 'testProcedureCode') {
      setIsBannerDismissed(false);
    }
    onUpdateIssue({
      ...issue,
      [field]: value,
    });
  };

  const renderCommentTrigger = (fieldKey: string, fieldLabel: string, isRowLevel = false) => {
    const commentsList = (comments || []).filter((c) => c.fieldKey === fieldKey);
    const isOpen = activeCommentField === fieldKey;
    const unresolvedCount = commentsList.filter((c) => !c.isResolved).length;
    const hasOpenComments = unresolvedCount > 0;

    const handleToggleComment = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isOpen) {
        setActiveCommentField(null);
      } else {
        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const placement = spaceBelow < 340 && spaceAbove > spaceBelow ? 'up' : 'down';
        setPopoverPlacement(placement);
        setActiveCommentField(fieldKey);
      }
    };

    return (
      <div
        data-field-comment-container="true"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          zIndex: isOpen ? 600 : 1,
        }}
      >
        {commentsList.length > 0 ? (
          <SharedTooltip
            title={`Comments on ${fieldLabel} (${commentsList.length} total, ${unresolvedCount} open) — Click to view thread & reply`}
            placement="top"
          >
            <button
              type="button"
              onClick={handleToggleComment}
              aria-label={`Comments on ${fieldLabel}: ${commentsList.length} comment(s), ${unresolvedCount} open`}
              style={{
                padding: isRowLevel ? '2px 5px' : '1px 6px',
                fontSize: 'var(--type-caption-size, 9.5px)',
                fontWeight: 600,
                borderRadius: '10px',
                border: isOpen ? '1px solid #000099' : '1px solid #CBD5E1',
                backgroundColor: isOpen ? '#EFF6FF' : '#F8FAFC',
                color: hasOpenComments || isOpen ? '#000099' : '#64748B',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 0.15s ease',
              }}
            >
              {hasOpenComments ? (
                <>
                  <Mail style={{ width: '9px', height: '9px', color: '#000099' }} />
                  <span>{isRowLevel ? unresolvedCount : `Comments ${unresolvedCount}`}</span>
                </>
              ) : (
                <>
                  <MailOpen style={{ width: '9px', height: '9px', color: isOpen ? '#000099' : '#94A3B8' }} />
                  <span>{isRowLevel ? commentsList.length : `Comments ${commentsList.length}`}</span>
                </>
              )}
            </button>
          </SharedTooltip>
        ) : (
          <SharedTooltip title={`Add a comment on ${fieldLabel}`} placement="top">
            <button
              type="button"
              onClick={handleToggleComment}
              aria-label={`Add comment on ${fieldLabel}`}
              style={{
                padding: isRowLevel ? '2px 5px' : '1px 6px',
                fontSize: 'var(--type-caption-size, 9.5px)',
                fontWeight: 600,
                borderRadius: '10px',
                border: isOpen ? '1px solid #000099' : '1px dashed #CBD5E1',
                backgroundColor: isOpen ? '#EFF6FF' : '#F8FAFC',
                color: isOpen ? '#000099' : '#64748B',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 0.15s ease',
              }}
            >
              <MessageSquare style={{ width: '9px', height: '9px', color: isOpen ? '#000099' : '#94A3B8' }} />
              <span>{isRowLevel ? '' : 'Comment'}</span>
            </button>
          </SharedTooltip>
        )}

        <FieldCommentPopover
          isOpen={isOpen}
          onClose={() => setActiveCommentField(null)}
          engagementId={issue.engagementId || issue.id}
          fieldKey={fieldKey}
          fieldLabel={fieldLabel}
          comments={commentsList}
          currentUser={currentCommentUser}
          availableUsers={availableUsers}
          placement={popoverPlacement}
          onAddComment={(text, taggedUser) => {
            onAddComment?.(fieldKey, fieldLabel, text, taggedUser);
          }}
          onResolveComment={(commentId) => {
            onResolveComment?.(commentId);
          }}
        />
      </div>
    );
  };

  // If collapsed, render 36px vertical rail
  if (isCollapsed) {
    return (
      <div
        style={{
          width: '36px',
          minWidth: '36px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #CBD5E1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '10px',
          gap: '16px',
          userSelect: 'none',
          flexShrink: 0,
          height: '100%',
        }}
      >
        <button
          onClick={() => onToggleCollapse?.(false)}
          title="Expand Form Editor"
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            color: '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#000099')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
        >
          <PanelLeftOpen style={{ width: '16px', height: '16px' }} />
        </button>
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: '10.5px',
            fontWeight: 800,
            color: '#475569',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
          }}
        >
          FORM EDITOR
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Pane 2 Top Header Section: Title, Info Container, Action Buttons */}
      <div
        style={{
          backgroundColor: '#FAFAFA',
          borderBottom: 'none',
          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          zIndex: 2,
          padding: 'clamp(10px, 1.2vh, 18px) var(--space-page-padding-x, 20px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(8px, 1vh, 12px)',
          flexShrink: 0,
        }}
      >
        {/* Row 1: Left collapse button + Title */}
        {/* Top Row: Status / Lock / Read-Only / Excluded Alert Container (Above Heading Row when available) */}
        {!isExcluded && isLocked && (
          <div
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderLeft: `3px solid ${isLockedByCurrentUser ? '#000099' : '#D97706'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 'var(--type-table-header-size, 12px)',
              color: '#334155',
              lineHeight: '1.4',
            }}
          >
            <Lock
              style={{
                width: '13px',
                height: '13px',
                color: isLockedByCurrentUser ? '#000099' : '#D97706',
                flexShrink: 0,
              }}
            />
            {isLockedByCurrentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <strong style={{ color: '#1E293B' }}>Editing Session Active</strong>
                {onToggleLock && (
                  <>
                    <span style={{ color: '#94A3B8' }}>&mdash;</span>
                    <button
                      type="button"
                      onClick={() => onToggleLock(issue.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#000099',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0,
                      }}
                    >
                      Unlock Now
                    </button>
                  </>
                )}
              </div>
            ) : (
              <span>
                Issue locked by{' '}
                <strong style={{ color: '#1E293B' }}>
                  {issue.lockedBy?.name ||
                    (typeof (issue as any).lockedBy === 'string' ? (issue as any).lockedBy : '') ||
                    'another auditor'}
                </strong>
              </span>
            )}
          </div>
        )}

        {!isExcluded && !isLocked && !canEdit && editRestrictionReason && (
          <div
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderLeft: '3px solid #64748B',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 'var(--type-table-header-size, 12px)',
              color: '#334155',
              lineHeight: '1.4',
            }}
          >
            <Eye style={{ width: '13px', height: '13px', color: '#64748B', flexShrink: 0 }} />
            <span>
              <strong style={{ color: '#1E293B' }}>Read Only:</strong> Non-Function Issue
            </span>
          </div>
        )}

        {!isExcluded && !isLocked && canEdit && isFurtherStage && (
          <div
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderLeft: '3px solid #64748B',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 'var(--type-table-header-size, 12px)',
              color: '#334155',
              lineHeight: '1.4',
            }}
          >
            <Eye style={{ width: '13px', height: '13px', color: '#64748B', flexShrink: 0 }} />
            <span>
              <strong style={{ color: '#1E293B' }}>Read Only:</strong> In {issue.status} &mdash; Call back to edit
            </span>
          </div>
        )}

        {isExcluded && (
          <div
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderLeft: '3px solid #EB1700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 'var(--type-table-header-size, 12px)',
              color: '#334155',
              lineHeight: '1.4',
            }}
          >
            <Ban style={{ width: '13px', height: '13px', color: '#EB1700', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <strong style={{ color: '#1E293B' }}>Issue Excluded</strong>
              {canEdit && (
                <>
                  <span style={{ color: '#94A3B8' }}>&mdash;</span>
                  <button
                    type="button"
                    onClick={() => onIncludeIssue?.(issue.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#000099',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    Include Issue
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Heading Row: Collapse Button, Criticality Dot, Issue Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={() => onToggleCollapse(true)}
              title="Collapse Form Editor Pane"
              aria-label="Collapse Form Editor Pane"
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                borderRadius: '4px',
                width: '28px',
                height: '28px',
                transition: 'color 0.15s ease, background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#000099';
                e.currentTarget.style.backgroundColor = '#F1F5F9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748B';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <PanelLeftClose style={{ width: '16px', height: '16px' }} />
            </button>
          )}

          {/* Criticality indicator circle */}
          <span
            title={`${issue.criticality || 'Normal'} Severity`}
            style={{
              width: '8.5px',
              height: '8.5px',
              borderRadius: '50%',
              backgroundColor: getCriticalityColor(issue.criticality),
              flexShrink: 0,
              display: 'inline-block',
            }}
          />

          <span
            className="type-studio-title"
            style={{
              fontSize: 'var(--type-studio-title-size, 15px)',
              fontWeight: 'var(--type-studio-title-weight, 500)' as any,
              fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
              color: 'var(--type-studio-title-color, #334155)',
              lineHeight: 'var(--type-studio-title-leading, 1.3)' as any,
            }}
          >
            {issue.title}
          </span>
        </div>

        {/* Row 3: Action Buttons Toolbar & Section Tab Filter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            paddingBottom: '2px',
            minHeight: '28px',
          }}
        >
          {/* Left Side: Section Filter Tabs (Always visible by default) */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <SharedListBoxFilter<SectionTab>
              options={SECTION_TAB_OPTIONS}
              value={activeSectionTab}
              onChange={(tab) => setActiveSectionTab(tab)}
              size="small"
              ariaLabel="Filter sections by tab"
            />
          </div>

          {/* Right Side: Action Buttons (Only shown if not locked or if current user is the person working) */}
          {canShowIssueButtons && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              {/* Primary Submit Button: ONLY shown if editable and NOT in further stage */}
              {canEdit && !isFurtherStage && (!isLocked || isLockedByCurrentUser) && onAdvanceWorkflow && (() => {
                const statusNorm = (issue.status || '').trim().toLowerCase();
                const isPendingStaff = !statusNorm || statusNorm.includes('staff') || statusNorm.includes('draft') || statusNorm.includes('auditor');
                const isPendingTC = (statusNorm.includes('tc') || statusNorm.includes('coordinator')) && !statusNorm.includes('manager');
                const isPendingManager = (statusNorm.includes('manager') || statusNorm.includes('mgr')) && !statusNorm.includes('completed') && !statusNorm.includes('waiting');
                const isPendingBusiness = statusNorm.includes('business');

                // Manager Submitting (Tier 3): Takes up lower-stage or Pending Manager
                if (userTier === 3 && (isPendingStaff || isPendingTC || isPendingManager)) {
                  return (
                    <WorkflowSubmitButton
                      label="Submit Issue"
                      onClickDirect={() => onAdvanceWorkflow('Ready for Director Submission' as any)}
                      onOpenRemarks={() =>
                        setRemarksModalConfig({
                          isOpen: true,
                          title: 'Submit Issue for Manager Review Completion',
                          actionLabel: 'Submit Issue',
                          targetStatus: 'Ready for Director Submission' as any,
                        })
                      }
                    />
                  );
                }

                // TC Submitting (Tier 2): Takes up Pending Staff or Pending TC, and submits to Manager
                if (userTier === 2 && (isPendingStaff || isPendingTC)) {
                  return (
                    <WorkflowSubmitButton
                      label="Submit to Manager"
                      onClickDirect={() => onAdvanceWorkflow('Pending Manager')}
                      onOpenRemarks={() =>
                        setRemarksModalConfig({
                          isOpen: true,
                          title: 'Submit Finding to Audit Manager',
                          actionLabel: 'Submit to Manager',
                          targetStatus: 'Pending Manager',
                        })
                      }
                    />
                  );
                }

                // Staff Submitting (Tier 1): Submits Pending Staff to TC (CANNOT submit Pending TC!)
                if (userTier === 1 && isPendingStaff) {
                  return (
                    <WorkflowSubmitButton
                      label="Submit to TC"
                      onClickDirect={() => onAdvanceWorkflow('Pending TC')}
                      onOpenRemarks={() =>
                        setRemarksModalConfig({
                          isOpen: true,
                          title: 'Submit Finding to Team Coordinator',
                          actionLabel: 'Submit to TC',
                          targetStatus: 'Pending TC',
                        })
                      }
                    />
                  );
                }

                // Business Management Submitting
                if (isPendingBusiness) {
                  return (
                    <WorkflowSubmitButton
                      label="Submit Response"
                      onClickDirect={() => onAdvanceWorkflow('Pending Manager')}
                      onOpenRemarks={() =>
                        setRemarksModalConfig({
                          isOpen: true,
                          title: 'Submit Management Response to Audit Team',
                          actionLabel: 'Submit Response',
                          targetStatus: 'Pending Manager',
                        })
                      }
                    />
                  );
                }

                // Admin super-user actions (acting as pure admin tier 99)
                if (userTier === 99) {
                  if (isPendingStaff) {
                    return (
                      <WorkflowSubmitButton
                        label="Submit to TC"
                        onClickDirect={() => onAdvanceWorkflow('Pending TC')}
                        onOpenRemarks={() =>
                          setRemarksModalConfig({
                            isOpen: true,
                            title: 'Submit Finding to Team Coordinator',
                            actionLabel: 'Submit to TC',
                            targetStatus: 'Pending TC',
                          })
                        }
                      />
                    );
                  }
                  if (isPendingTC) {
                    return (
                      <WorkflowSubmitButton
                        label="Submit to Manager"
                        onClickDirect={() => onAdvanceWorkflow('Pending Manager')}
                        onOpenRemarks={() =>
                          setRemarksModalConfig({
                            isOpen: true,
                            title: 'Submit Finding to Audit Manager',
                            actionLabel: 'Submit to Manager',
                            targetStatus: 'Pending Manager',
                          })
                        }
                      />
                    );
                  }
                  if (isPendingManager) {
                    return (
                      <WorkflowSubmitButton
                        label="Submit Issue"
                        onClickDirect={() => onAdvanceWorkflow('Ready for Director Submission' as any)}
                        onOpenRemarks={() =>
                          setRemarksModalConfig({
                            isOpen: true,
                            title: 'Submit Issue for Manager Review Completion',
                            actionLabel: 'Submit Issue',
                            targetStatus: 'Ready for Director Submission' as any,
                          })
                        }
                      />
                    );
                  }
                }

                return null;
              })()}

              {/* Issue Actions Dropdown */}
              <SharedSelectButton
                label="Issue Actions"
                size="small"
                menuWidth={240}
                title="Issue actions (Send To, Call Back, Track Changes, Functional Scope, Exclusion)"
                items={[
                  ...(onOpenSendTo
                    ? [
                      {
                        key: 'send-to-peer',
                        label: 'Send To',
                        icon: (
                          <Send
                            style={{
                              width: '13px',
                              height: '13px',
                              color: canSendTo ? '#000099' : '#94A3B8',
                            }}
                          />
                        ),
                        onClick: () => {
                          if (canSendTo) onOpenSendTo(issue.id);
                        },
                        disabled: !canSendTo,
                        dividerAfter: !onOpenCallback,
                        title: !canSendTo
                          ? 'Send To is not available for this finding in its current state.'
                          : 'Hand over this finding to another assigned team member on this engagement',
                      },
                    ]
                    : []),
                  ...(onOpenCallback
                    ? [
                      {
                        key: 'call-back',
                        label: 'Call Back Issue',
                        icon: (
                          <RotateCcw
                            style={{
                              width: '13px',
                              height: '13px',
                              color: canCallBack ? '#7C3AED' : '#94A3B8',
                            }}
                          />
                        ),
                        onClick: () => {
                          if (canCallBack) onOpenCallback(issue.id);
                        },
                        disabled: !canCallBack,
                        dividerAfter: true,
                        title: !canCallBack
                          ? !canEdit
                            ? 'Call Back is not available for Non-Function issues.'
                            : `Call Back is not valid: this finding is currently in ${issue.status || 'current stage'}, which has not progressed past your review tier (${userRole || 'Reviewer'}).`
                          : 'Call back this finding from higher review stage to your review bucket',
                      },
                    ]
                    : []),
                  {
                    key: 'track-changes',
                    label: 'Track Changes',
                    icon: <History style={{ width: '13px', height: '13px', color: '#eb1700' }} />,
                    onClick: () => onOpenLogs(),
                    dividerAfter: true,
                  },
                  {
                    key: 'not-my-function',
                    label: `Mark Not my Function Issue (Switch to ${(issue.function || (issue.tech === 'FinOps' ? 'FinOps' : 'IT')) === 'IT' ? 'FinOps' : 'IT'})`,
                    icon: (
                      <CheckCircle2
                        style={{
                          width: '13px',
                          height: '13px',
                          color: isFieldDisabled ? '#94A3B8' : '#047857',
                        }}
                      />
                    ),
                    disabled: isFieldDisabled,
                    title: isFieldDisabled
                      ? 'Function re-assignment is not available while this finding is read-only.'
                      : `Re-assign finding function from ${issue.function || (issue.tech === 'FinOps' ? 'FinOps' : 'IT')} to ${(issue.function || (issue.tech === 'FinOps' ? 'FinOps' : 'IT')) === 'IT' ? 'FinOps' : 'IT'}`,
                    onClick: () => {
                      if (!isFieldDisabled) onMarkNotAnIssue?.(issue.id);
                    },
                  },
                  {
                    key: 'exclude-include',
                    label: isExcluded ? 'Include Issue in Report' : 'Mark Exclude Issue',
                    icon: isExcluded ? (
                      <RotateCcw
                        style={{
                          width: '13px',
                          height: '13px',
                          color: canEdit ? '#059669' : '#94A3B8',
                        }}
                      />
                    ) : (
                      <AlertOctagon
                        style={{
                          width: '13px',
                          height: '13px',
                          color: canExclude ? '#991B1B' : '#94A3B8',
                        }}
                      />
                    ),
                    danger: !isExcluded && canExclude,
                    disabled: isExcluded ? !canEdit : !canExclude,
                    title: !(isExcluded ? canEdit : canExclude)
                      ? 'Exclude / Include is not available while this finding is read-only.'
                      : isExcluded
                        ? 'Include this finding back into the Audit Report'
                        : 'Mark this finding as Excluded from the Audit Report',
                    onClick: () => {
                      if (isExcluded) {
                        if (canEdit) onIncludeIssue?.(issue.id);
                      } else {
                        if (canExclude) onExcludeIssue?.(issue.id);
                      }
                    },
                  },
                ]}
              />
            </div>
          )}
        </div>

        {/* Row 4: Business Owner Issue-Level Comments Pill (Beneath Section Filter & Action Buttons Row) */}
        {currentBizComments.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', paddingTop: '2px' }}>
            <SharedTooltip
              title={
                openBizCommentsCount > 0
                  ? `Business Owner Comments (${openBizCommentsCount} open of ${currentBizComments.length}) — Click to view in right drawer`
                  : `All ${currentBizComments.length} Business Owner comments marked as done — Click to view`
              }
              placement="top"
            >
              <button
                type="button"
                onClick={() => setIsBizCommentsDrawerOpen(true)}
                aria-label="Open Business Owner Comments Drawer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <MessageSquare
                  size={13}
                  style={{
                    color: '#334155',
                    flexShrink: 0,
                  }}
                />
                <span>Business Comments</span>
                <span
                  style={{
                    backgroundColor: '#64748B',
                    color: '#FFFFFF',
                    borderRadius: '999px',
                    padding: '0 5px',
                    fontSize: '10px',
                    fontWeight: 700,
                    lineHeight: '15px',
                    minWidth: '15px',
                    textAlign: 'center',
                  }}
                >
                  {openBizCommentsCount > 0
                    ? openBizCommentsCount
                    : `✓ ${currentBizComments.length}`}
                </span>
              </button>
            </SharedTooltip>
          </div>
        )}
      </div>

      {/* Pane 2 Main Body */}
      <div
        className="no-scrollbar"
        onFocusCapture={() => {
          if (!isLocked && canEdit && !isExcluded && onAcquireLock) {
            onAcquireLock(issue.id);
          }
        }}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '24px clamp(16px, 1.6vw, 24px) 24px clamp(16px, 1.6vw, 24px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(16px, 1.8vh, 22px)',
          backgroundColor: '#ffffff',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >





        {/* ------------------------------------------------------------- */}
        {/* 1. PRIMARY INPUTS SECTION                                     */}
        {/* ------------------------------------------------------------- */}
        {(activeSectionTab === 'all' || activeSectionTab === 'basic') && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              flexShrink: 0,
            }}
          >

            {/* Row 1: Test Procedure & Function */}
            <div className="two-col-field-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: '24px', rowGap: '16px' }}>
              <SharedSelect
                label="Test Procedure"
                value={issue.testProcedureCode || 'TP-101'}
                onChange={(val) => handleFieldChange('testProcedureCode', val)}
                options={TEST_PROCEDURE_OPTIONS}
                required
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('testProcedureCode', 'Test Procedure')}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: 'var(--type-table-header-size, 12px)', fontWeight: 700, color: '#212121' }}>
                    Function <span style={{ color: '#eb1700' }}>*</span>
                  </span>
                  {renderCommentTrigger('function', 'Function')}
                </div>
                <div
                  style={{
                    minHeight: '38px',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #D8D8D8',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#212121',
                    cursor: 'default',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {((issue.function || (issue.tech === 'FinOps' ? 'FinOps' : 'IT')) === 'FinOps')
                      ? 'FinOps (Finance & Operations)'
                      : 'IT (Information Technology)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2: Original Issue */}
            <div>
              <SharedTextArea
                label="Original Issue"
                value={issue.originalIssue || issue.description || issue.title || ''}
                onChange={(val) => handleFieldChange('originalIssue', val)}
                placeholder="Detail initial audit observations, test sample exceptions, and discovered control gaps..."
                rows={4}
                required
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('originalIssue', 'Original Issue')}
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 2. AI GENERATED FIELDS SECTION (With Regenerate & Compare)     */}
        {/* ------------------------------------------------------------- */}
        {(activeSectionTab === 'all' || activeSectionTab === 'ai') && (
          <div
            style={{
              backgroundColor: '#FAFAFA',
              borderRadius: '8px',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.03)',
              overflow: 'visible',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              padding: '20px',
              gap: '16px',
            }}
          >
            {/* Single Top Row: Regenerate Container (left / remaining space) + AI POV Button (right end) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              {/* Always-Visible Regeneration Container */}
              <div
                style={{
                  flex: 1,
                  minWidth: '240px',
                  backgroundColor: isRegenerateActive ? '#EFF6FF' : '#F8FAFC',
                  border: isRegenerateActive ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: isRegenerateActive ? '0 1px 3px rgba(0, 0, 153, 0.08)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: isRegenerateActive ? '#DBEAFE' : '#F1F5F9',
                      border: isRegenerateActive ? '1px solid #93C5FD' : '1px solid #CBD5E1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isRegenerateActive ? '#000099' : '#94A3B8',
                      flexShrink: 0,
                    }}
                  >
                    {isRegenerateActive ? <AlertTriangle size={14} /> : <RotateCcw size={13} />}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '12.5px',
                        color: isRegenerateActive ? '#1E3A8A' : '#64748B',
                        lineHeight: 1.4,
                        fontWeight: isRegenerateActive ? 600 : 400,
                      }}
                    >
                      {isRegenerateActive
                        ? 'Changed the original issue or function, so generated AI might not be aligned. Please click Regenerate AI if needed.'
                        : 'Change the function or original issue to regenerate'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {isRegenerateActive && (
                    <SharedButton
                      variant="outline"
                      size="small"
                      onClick={() => setIsBannerDismissed(true)}
                      style={{ minHeight: '1.75rem', fontSize: '11.5px', padding: '0 12px' }}
                    >
                      Cancel
                    </SharedButton>
                  )}

                  <SharedButton
                    variant={isRegenerateActive ? 'primary' : 'outline'}
                    size="small"
                    startIcon={<RotateCcw size={12} />}
                    onClick={handleRegenerateAi}
                    disabled={!isRegenerateActive || isAiLoadingLocal || isFieldDisabled}
                    loading={isAiLoadingLocal}
                    style={
                      !isRegenerateActive
                        ? {
                            opacity: 0.6,
                            borderColor: '#CBD5E1',
                            color: '#94A3B8',
                            cursor: 'not-allowed',
                            backgroundColor: '#F8FAFC',
                          }
                        : undefined
                    }
                  >
                    {isAiLoadingLocal ? 'Regenerating...' : 'Regenerate AI'}
                  </SharedButton>
                </div>
              </div>

              <SharedButton
                variant="outline"
                size="small"
                startIcon={<BookOpen size={13} />}
                onClick={() => setIsGuidelinesDrawerOpen(true)}
                style={{
                  borderColor: '#000099',
                  color: '#000099',
                  fontWeight: 600,
                  backgroundColor: '#FFFFFF',
                  minHeight: '42px',
                  fontSize: '11.5px',
                  padding: '0 14px',
                  flexShrink: 0,
                }}
              >
                AI POV
              </SharedButton>
            </div>

            {/* Standard 6 AI Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 1. Issue Title */}
              <AIInput
                label="Issue Title"
                value={issue.title}
                onChange={(val) => handleFieldChange('title', val)}
                remark={fieldRemarks.title}
                onRemarkChange={(r) => handleFieldRemarkChange('title', r)}
                rows={2}
                required
                disabled={isFieldDisabled}
                isAiLoading={isAiLoadingLocal}
                placeholder="AI generated finding title..."
                inputBackgroundColor="#FFFFFF"
                extraHeaderActions={renderCommentTrigger('title', 'Issue Title')}
              />

              {/* 2. Issue Description */}
              <AIInput
                label="Issue Description"
                value={issue.issueNarrative || issue.description || issue.issue || ''}
                onChange={(val) => handleFieldChange('issueNarrative', val)}
                remark={fieldRemarks.issueNarrative}
                onRemarkChange={(r) => handleFieldRemarkChange('issueNarrative', r)}
                rows={5}
                required
                disabled={isFieldDisabled}
                isAiLoading={isAiLoadingLocal}
                placeholder="AI synthesized condition narrative & standard citations..."
                inputBackgroundColor="#FFFFFF"
                extraHeaderActions={renderCommentTrigger('issueNarrative', 'Issue Description')}
              />

              {/* 3. Root Cause */}
              <AIInput
                label="Root Cause"
                value={issue.rootCause || ''}
                onChange={(val) => handleFieldChange('rootCause', val)}
                remark={fieldRemarks.rootCause}
                onRemarkChange={(r) => handleFieldRemarkChange('rootCause', r)}
                rows={3}
                required
                disabled={isFieldDisabled}
                isAiLoading={isAiLoadingLocal}
                placeholder="Underlying operational or technical root cause gap..."
                inputBackgroundColor="#FFFFFF"
                extraHeaderActions={renderCommentTrigger('rootCause', 'Root Cause')}
              />

              {/* 4. Impact */}
              <AIInput
                label="Impact & Business Risk Exposure"
                value={issue.impact || ''}
                onChange={(val) => handleFieldChange('impact', val)}
                remark={fieldRemarks.impact}
                onRemarkChange={(r) => handleFieldRemarkChange('impact', r)}
                rows={3}
                required
                disabled={isFieldDisabled}
                isAiLoading={isAiLoadingLocal}
                placeholder="Compliance, financial, or data integrity impact..."
                inputBackgroundColor="#FFFFFF"
                extraHeaderActions={renderCommentTrigger('impact', 'Impact & Business Risk Exposure')}
              />

              {/* 5. Recommendations */}
              <AIInput
                label="Recommendations"
                value={issue.recommendation || ''}
                onChange={(val) => handleFieldChange('recommendation', val)}
                remark={fieldRemarks.recommendation}
                onRemarkChange={(r) => handleFieldRemarkChange('recommendation', r)}
                rows={4}
                required
                disabled={isFieldDisabled}
                isAiLoading={isAiLoadingLocal}
                placeholder="Numbered corrective actions and recommendations..."
                inputBackgroundColor="#FFFFFF"
                extraHeaderActions={renderCommentTrigger('recommendation', 'Recommendations')}
              />

              {/* 6. References */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <ReferenceComponent
                  label="References"
                  value={issue.nonComplianceReferences || ''}
                  onChange={(val) => handleFieldChange('nonComplianceReferences', val)}
                  disabled={isFieldDisabled}
                  isAiLoading={isAiLoadingLocal}
                  extraHeaderActions={renderCommentTrigger('nonComplianceReferences', 'References')}
                />
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 3. TAXONOMY & EXTENDED GOVERNANCE FIELDS                      */}
        {/* ------------------------------------------------------------- */}
        {(activeSectionTab === 'all' || activeSectionTab === 'taxonomies') && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flexShrink: 0,
            }}
          >
            {/* 1. Summary Finding Executive Summary */}
            <SharedTextArea
              label="Summary Finding Executive Summary"
              value={issue.summaryFinding || ''}
              onChange={(val) => handleFieldChange('summaryFinding', val)}
              placeholder="Brief executive summary narrative of finding..."
              rows={2}
              disabled={isFieldDisabled}
              extraHeaderActions={renderCommentTrigger('summaryFinding', 'Summary Finding Executive Summary')}
            />

            {/* 2. Auditor Response */}
            <SharedTextArea
              label="Auditor Response"
              value={issue.auditorResponse || ''}
              onChange={(val) => handleFieldChange('auditorResponse', val)}
              placeholder="Auditor validation or initial assessment notes..."
              rows={2}
              disabled={isFieldDisabled}
              extraHeaderActions={renderCommentTrigger('auditorResponse', 'Auditor Response')}
            />

            {/* 3. Mitigating Control */}
            <SharedTextArea
              label="Mitigating Control"
              value={issue.mitigatingControl || issue.mitigatingControls || ''}
              onChange={(val) => {
                handleFieldChange('mitigatingControl', val);
                handleFieldChange('mitigatingControls', val);
              }}
              placeholder="Existing compensating controls in place..."
              rows={2}
              disabled={isFieldDisabled}
              extraHeaderActions={renderCommentTrigger('mitigatingControl', 'Mitigating Control')}
            />

            {/* 4. Exception Remediation Comments */}
            <SharedTextArea
              label="Exception Remediation Comments"
              value={issue.exceptionRemedComments || ''}
              onChange={(val) => handleFieldChange('exceptionRemedComments', val)}
              placeholder="Remediation timeline comments..."
              rows={2}
              disabled={isFieldDisabled}
              extraHeaderActions={renderCommentTrigger('exceptionRemedComments', 'Exception Remediation Comments')}
            />

            {/* 5. Issue Type & 6. Issue Cause Type */}
            <div className="two-col-field-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: '24px', rowGap: '16px' }}>
              <SharedSelect
                label="Issue Type"
                value={issue.issueType || 'Operational'}
                onChange={(val) => handleFieldChange('issueType', val)}
                options={ISSUE_TYPE_OPTIONS}
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('issueType', 'Issue Type')}
              />
              <SharedSelect
                label="Issue Cause Type"
                value={issue.issueCauseType || issue.rootCauseType || 'Process Gap'}
                onChange={(val) => {
                  handleFieldChange('issueCauseType', val);
                  handleFieldChange('rootCauseType', val);
                }}
                options={ROOT_CAUSE_TYPE_OPTIONS}
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('issueCauseType', 'Issue Cause Type')}
              />
            </div>

            {/* 7. Criticality & 8. SOX Reportable */}
            <div className="two-col-field-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: '24px', rowGap: '16px' }}>
              <SharedSelect
                label="Criticality"
                value={issue.criticality || ''}
                onChange={(val) => handleFieldChange('criticality', val as CriticalityLevel)}
                options={
                  issue.criticality && !CRITICALITY_OPTIONS.some((o) => o.value === issue.criticality)
                    ? [{ value: issue.criticality, label: issue.criticality }, ...CRITICALITY_OPTIONS]
                    : CRITICALITY_OPTIONS
                }
                required
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('criticality', 'Criticality')}
              />
              <SharedSelect
                label="SOX Reportable"
                value={issue.soxReportable || (issue.criticality === 'Critical' ? 'Yes' : 'No')}
                onChange={(val) => handleFieldChange('soxReportable', val)}
                options={YES_NO_OPTIONS}
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('soxReportable', 'SOX Reportable')}
              />
            </div>

            {/* 9. Issue Finding Source & 10. Key Theme */}
            <div className="two-col-field-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: '24px', rowGap: '16px' }}>
              <SharedSelect
                label="Issue Finding Source"
                value={issue.issueSource || 'Internal Audit'}
                onChange={(val) => handleFieldChange('issueSource', val)}
                options={ISSUE_SOURCE_OPTIONS}
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('issueSource', 'Issue Finding Source')}
              />
              <SharedSelect
                label="Key Theme"
                value={issue.keyTheme || 'Access Governance & Authorization Matrix'}
                onChange={(val) => handleFieldChange('keyTheme', val)}
                options={KEY_THEME_OPTIONS}
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('keyTheme', 'Key Theme')}
              />
            </div>

            {/* 11. Area & 12. Repeat Finding */}
            <div className="two-col-field-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: '24px', rowGap: '16px' }}>
              <SharedSelect
                label="Area"
                value={issue.processArea || issue.accountableProcessArea || 'Access Control & IAM'}
                onChange={(val) => {
                  handleFieldChange('processArea', val);
                  handleFieldChange('accountableProcessArea', val);
                }}
                options={PROCESS_AREA_OPTIONS}
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('processArea', 'Area')}
              />
              <SharedSelect
                label="Repeat Finding"
                value={issue.repeatFinding || 'No'}
                onChange={(val) => handleFieldChange('repeatFinding', val)}
                options={YES_NO_OPTIONS}
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('repeatFinding', 'Repeat Finding')}
              />
            </div>

            {/* 13. IT Asset Accountable Sector & 14. Accountable Function */}
            <div className="two-col-field-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: '24px', rowGap: '16px' }}>
              <SharedSelect
                label="IT Asset Accountable Sector"
                value={issue.itAssetAccountableSector || 'MT'}
                onChange={(val) => handleFieldChange('itAssetAccountableSector', val)}
                options={IT_ASSET_ACCOUNTABLE_SECTOR_OPTIONS}
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('itAssetAccountableSector', 'IT Asset Accountable Sector')}
              />
              <SharedSelect
                label="Accountable Function"
                value={issue.accountableFunction || 'IT Infrastructure & Identity Access Management'}
                onChange={(val) => handleFieldChange('accountableFunction', val)}
                options={ACCOUNTABLE_FUNCTION_OPTIONS}
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('accountableFunction', 'Accountable Function')}
              />
            </div>

            {/* 15. Impacted Region & 16. Impacted Sector */}
            <div className="two-col-field-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: '24px', rowGap: '16px' }}>
              <SharedSelect
                label="Impacted Region"
                value={issue.impactedRegion || 'NA'}
                onChange={(val) => handleFieldChange('impactedRegion', val)}
                options={IMPACTED_REGION_OPTIONS}
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('impactedRegion', 'Impacted Region')}
              />
              <SharedSelect
                label="Impacted Sector"
                value={issue.impactedSector || 'MED'}
                onChange={(val) => handleFieldChange('impactedSector', val)}
                options={IMPACTED_SECTOR_OPTIONS}
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('impactedSector', 'Impacted Sector')}
              />
            </div>

            {/* 17. Impact MRC & 18. Quarter Impacted */}
            <div className="two-col-field-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: '24px', rowGap: '16px' }}>
              <SharedSelect
                label="Impact MRC"
                value={issue.impactedMrc || 'MRC-01: Global Supply Chain & Manufacturing Operations'}
                onChange={(val) => handleFieldChange('impactedMrc', val)}
                options={IMPACTED_MRC_OPTIONS}
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('impactedMrc', 'Impact MRC')}
              />
              <SharedSelect
                label="Quarter Impacted"
                value={issue.quarterImpacted || 'Q1 2026'}
                onChange={(val) => handleFieldChange('quarterImpacted', val)}
                options={QUARTER_IMPACTED_OPTIONS}
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('quarterImpacted', 'Quarter Impacted')}
              />
            </div>

            {/* 19. Sales (USD) & 20. IBT (USD) */}
            <div className="two-col-field-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: '24px', rowGap: '16px' }}>
              <SharedTextInput
                label="Sales (USD)"
                value={issue.salesUsd != null ? String(issue.salesUsd) : ''}
                onChange={(val) => handleFieldChange('salesUsd', val)}
                placeholder="$0.00"
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('salesUsd', 'Sales (USD)')}
              />
              <SharedTextInput
                label="IBT (USD)"
                value={issue.ibtUsd != null ? String(issue.ibtUsd) : ''}
                onChange={(val) => handleFieldChange('ibtUsd', val)}
                placeholder="$0.00"
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('ibtUsd', 'IBT (USD)')}
              />
            </div>

            {/* 21. Net Income (USD) & 22. Total Assets (USD) */}
            <div className="two-col-field-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: '24px', rowGap: '16px' }}>
              <SharedTextInput
                label="Net Income (USD)"
                value={issue.netIncomeUsd != null ? String(issue.netIncomeUsd) : ''}
                onChange={(val) => handleFieldChange('netIncomeUsd', val)}
                placeholder="$0.00"
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('netIncomeUsd', 'Net Income (USD)')}
              />
              <SharedTextInput
                label="Total Assets (USD)"
                value={issue.totalAssetsUsd != null ? String(issue.totalAssetsUsd) : ''}
                onChange={(val) => handleFieldChange('totalAssetsUsd', val)}
                placeholder="$0.00"
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('totalAssetsUsd', 'Total Assets (USD)')}
              />
            </div>

            {/* 23. Exception Remediation Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SharedCheckbox
                  checked={Boolean(issue.hasExceptionRemedDate || issue.exceptionRemedDate)}
                  onChange={(checked) => handleFieldChange('hasExceptionRemedDate', checked)}
                  label="Enable Exception Remediation Date"
                  disabled={isFieldDisabled}
                />
              </div>
              {(issue.hasExceptionRemedDate || issue.exceptionRemedDate) && (
                <div style={{ maxWidth: '280px' }}>
                  <SharedTextInput
                    label="Exception Remediation Date"
                    type="date"
                    value={issue.exceptionRemedDate || ''}
                    onChange={(val) => handleFieldChange('exceptionRemedDate', val)}
                    disabled={isFieldDisabled}
                    extraHeaderActions={renderCommentTrigger('exceptionRemedDate', 'Exception Remediation Date')}
                  />
                </div>
              )}
            </div>

            {/* 24. Accountable Contact */}
            <SharedSelect
              label="Accountable Contact"
              value={issue.primaryBusinessOwnerId || issue.businessContactId || issue.accountableContact || ''}
              onChange={(v) => {
                const selectedOpt = systemUsers.find(u => u.value === v);
                handleFieldChange('primaryBusinessOwnerId', v as string);
                handleFieldChange('businessContactId', v as string);
                if (selectedOpt) {
                  handleFieldChange('primaryBusinessOwnerName', selectedOpt.label);
                  handleFieldChange('accountableContact', selectedOpt.label);
                  handleFieldChange('businessContactName', selectedOpt.label);
                }
              }}
              options={systemUsers}
              placeholder="Select Accountable Contact..."
              disabled={isFieldDisabled}
              extraHeaderActions={renderCommentTrigger('primaryBusinessOwnerId', 'Accountable Contact')}
            />

            {/* 25. Supporting Business Contact(s) (Multi Select) */}
            <SharedMultiSelect
              label="Supporting Business Contact(s)"
              value={issue.secondaryBusinessOwnerIds || []}
              onChange={(vals) => handleFieldChange('secondaryBusinessOwnerIds', vals)}
              options={systemUsers}
              placeholder="Select Supporting Business Contact(s)..."
              disabled={isFieldDisabled}
              extraHeaderActions={renderCommentTrigger('secondaryBusinessOwnerIds', 'Supporting Business Contact(s)')}
            />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4. BUSINESS MANAGEMENT RESPONSE                               */}
        {/* ------------------------------------------------------------- */}
        {(activeSectionTab === 'all' || activeSectionTab === 'biz') && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flexShrink: 0,
            }}
          >
            {/* 1. Business Management Reason */}
            <SharedTextArea
              label="Business Management Reason"
              value={issue.businessManagementReason || ''}
              onChange={(val) => handleFieldChange('businessManagementReason', val)}
              placeholder="Provide business management rationale, root cause acceptance or disagreement rationale..."
              rows={3}
              disabled={isFieldDisabled}
              extraHeaderActions={renderCommentTrigger('businessManagementReason', 'Business Management Reason')}
            />

            {/* 2. Business Management Response */}
            <SharedTextArea
              label="Business Management Response"
              value={issue.businessManagementResponse || issue.managementResponse || ''}
              onChange={(val) => {
                handleFieldChange('businessManagementResponse', val);
                handleFieldChange('managementResponse', val);
              }}
              placeholder="Enter official management response, operational commitments, and corrective action plan (CAP)..."
              rows={4}
              disabled={isFieldDisabled}
              extraHeaderActions={renderCommentTrigger('businessManagementResponse', 'Business Management Response')}
            />

            {/* 3. Agreed Remediation Date */}
            <div style={{ maxWidth: '320px' }}>
              <SharedTextInput
                label="Agreed Remediation Date"
                type="date"
                value={issue.agreedRemediationDate || issue.remediationTargetDate || ''}
                onChange={(val) => {
                  handleFieldChange('agreedRemediationDate', val);
                  handleFieldChange('remediationTargetDate', val);
                }}
                disabled={isFieldDisabled}
                extraHeaderActions={renderCommentTrigger('agreedRemediationDate', 'Agreed Remediation Date')}
              />
            </div>

            {/* 4. Business Management Attachment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Business Management Attachment
                </label>
                {renderCommentTrigger('businessManagementAttachment', 'Business Management Attachment')}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFieldChange('businessManagementAttachment', file.name);
                  }
                }}
              />

              {issue.businessManagementAttachment ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000099',
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {issue.businessManagementAttachment}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Attached Evidence Document
                      </div>
                    </div>
                  </div>

                  {!isFieldDisabled && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('businessManagementAttachment', undefined)}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                      }}
                      title="Remove attachment"
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => {
                    if (!isFieldDisabled) {
                      fileInputRef.current?.click();
                    }
                  }}
                  style={{
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: '6px',
                    padding: '16px',
                    textAlign: 'center',
                    backgroundColor: isFieldDisabled ? '#FAFAFA' : '#FFFFFF',
                    cursor: isFieldDisabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div style={{ color: '#000099', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={16} />
                    <span style={{ fontSize: '12.5px', fontWeight: 600 }}>
                      {isFieldDisabled ? 'No Attachment Provided' : 'Click to Upload Management Attachment'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    PDF, DOCX, XLSX, or evidence zip package
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Version Comparison & Merge Dialog */}
      <AiVersionCompareDialog
        open={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        previousData={previousAiData || undefined}
        candidateData={candidateAiData || undefined}
        currentIssue={issue}
        onApplyMerge={handleApplyAiMerge}
        onKeepPrevious={handleKeepPrevious}
      />

      {/* Workflow Transition with Remarks Modal */}
      <WorkflowRemarksModal
        isOpen={Boolean(remarksModalConfig?.isOpen)}
        onClose={() => setRemarksModalConfig(null)}
        title={remarksModalConfig?.title || 'Submit Finding'}
        actionLabel={remarksModalConfig?.actionLabel || 'Submit'}
        itemTitle={issue.title || issue.testProcedureCode || issue.id || 'Finding'}
        targetStatusText={remarksModalConfig?.targetStatus}
        onConfirm={async (remarks) => {
          if (onAdvanceWorkflow && remarksModalConfig?.targetStatus) {
            onAdvanceWorkflow(remarksModalConfig.targetStatus, remarks);
          }
        }}
      />

      {/* Field-by-Field Quality Guidelines Drawer */}
      <GuidelinesDrawer
        open={isGuidelinesDrawerOpen}
        onClose={() => setIsGuidelinesDrawerOpen(false)}
      />

      {/* Issue-Level Business Owner Comments Slide-Over Drawer */}
      <BusinessOwnerCommentsDrawer
        open={isBizCommentsDrawerOpen}
        onClose={() => setIsBizCommentsDrawerOpen(false)}
        issueTitle={issue.title}
        issueRef={issue.testProcedureCode || issue.id}
        comments={currentBizComments}
        onToggleDone={handleToggleBizCommentDone}
        onMarkAllDone={handleMarkAllBizCommentsDone}
      />
    </div>
  );
};
