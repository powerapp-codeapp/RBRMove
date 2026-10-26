import React, { useState, useEffect, useRef } from 'react';
import type { Issue, CriticalityLevel, IssueStatus } from '../../../types/dataverse.types';
import {
  SharedButton,
  SharedSelectButton,
  SharedTextInput,
  SharedTextArea,
  SharedSelect,
  SharedMultiSelect,
  SharedCheckbox,
  SharedListBoxFilter,
  AIInput,
} from '../../../components/shared';
import type { ListBoxFilterOption } from '../../../components/shared';
import {
  History,
  MessageSquare,
  Lock,
  Unlock,
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
} from 'lucide-react';
import { synthesizeAiDraft } from '../utils/aiSynthesisHelper';
import { AiVersionCompareDialog, type AiCompareFieldData } from './AiVersionCompareDialog';
import { SystemusersService } from '../../../generated/services/SystemusersService';

interface FindingWorkpaperCardProps {
  issue: Issue;
  onUpdateIssue: (updated: Issue) => void;
  onOpenAiCompare?: () => void;
  onOpenLogs: () => void;
  onOpenComments: (fieldKey: string, fieldLabel: string) => void;
  commentCounts: Record<string, number>;
  isAiSynthesizing?: boolean;
  onTriggerAiSynthesis?: () => void;
  canEdit: boolean;
  editRestrictionReason?: string | null;
  onExcludeIssue?: (issueId: string) => void;
  onIncludeIssue?: (issueId: string) => void;
  onToggleLock?: (issueId: string) => void;
  onOpenCallback?: (issueId: string) => void;
  onMarkNotAnIssue?: (issueId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  currentUser?: { name?: string; role?: string; avatar?: string };
  onAdvanceWorkflow?: (targetStatus: IssueStatus) => void;
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

const FUNCTION_OPTIONS = [
  { value: 'IT', label: 'IT' },
  { value: 'FinOps', label: 'FinOps' },
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
  onOpenComments,
  commentCounts,
  isAiSynthesizing: _isAiSynthesizing,
  onTriggerAiSynthesis: _onTriggerAiSynthesis,
  canEdit,
  editRestrictionReason,
  onExcludeIssue,
  onIncludeIssue,
  onToggleLock,
  onOpenCallback,
  onMarkNotAnIssue,
  isCollapsed = false,
  onToggleCollapse,
  currentUser,
  onAdvanceWorkflow,
  userRole = 'Manager',
  hasCriticalFinding = false,
}) => {
  const [activeSectionTab, setActiveSectionTab] = useState<SectionTab>('all');
  const roleStr = (userRole || '').toLowerCase();
  const isAuditor = roleStr.includes('auditor');
  const isTC = roleStr.includes('coordinator') || roleStr.includes('tc');
  const isDirector = roleStr.includes('director');
  const isVP = roleStr.includes('vp');
  const isBusiness = roleStr.includes('business') || roleStr.includes('contact');
  const isManager = roleStr.includes('manager') && !isDirector;

  // Compute read-only state
  const isExcluded = !!issue.isExcluded;
  const isLocked = !!issue.isLocked;

  // Check if locked and whether the current user is the one working on it
  const currentUserName = (currentUser?.name || '').trim().toLowerCase();
  const lockedByName = (
    issue.lockedBy?.name ||
    (typeof (issue as any).lockedBy === 'string' ? (issue as any).lockedBy : '')
  ).trim().toLowerCase();

  const isLockedByCurrentUser = Boolean(
    isLocked &&
    currentUserName &&
    lockedByName &&
    currentUserName === lockedByName
  );

  // If issue is locked, only the person working on it can edit
  const isFieldDisabled = !canEdit || isExcluded || (isLocked && !isLockedByCurrentUser);

  // For excluded issues, read-only issues, or locked issues (unless current user is the worker), action buttons are not applicable
  const canShowIssueButtons = !isExcluded && canEdit && (!isLocked || isLockedByCurrentUser);

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

  const showRegenerateBanner = !isExcluded && canEdit && hasParamsChanged && !isBannerDismissed;

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
    if (field === 'function' || field === 'originalIssue' || field === 'testProcedureCode') {
      setIsBannerDismissed(false);
    }
    onUpdateIssue({
      ...issue,
      [field]: value,
    });
  };

  const getCommentBadge = (fieldKey: string) => {
    const count = commentCounts[fieldKey] || 0;
    return count > 0 ? (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#eb1700',
          color: '#ffffff',
          fontSize: '10px',
          fontWeight: 800,
          borderRadius: '50%',
          width: '16px',
          height: '16px',
          marginLeft: '4px',
        }}
      >
        {count}
      </span>
    ) : null;
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

        {/* Row 2: One-liner Locked Alert Container (if locked) */}
        {!isExcluded && isLocked && (
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 'var(--type-table-header-size, 12px)',
              color: '#92400E',
              lineHeight: '1.4',
            }}
          >
            <span className="lock-icon-blink" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              <Lock style={{ width: '13px', height: '13px', color: '#D97706', flexShrink: 0 }} />
              <strong>Issue Locked:</strong>
            </span>
            <span>
              {issue.lockedBy?.name ||
                (typeof (issue as any).lockedBy === 'string' ? (issue as any).lockedBy : '') ||
                'Another auditor'}{' '}
              is currently working on the issue, so it&apos;s available only in read mode.
            </span>
          </div>
        )}

        {/* Row 2: One-liner Domain Restricted / Read-Only Alert Container */}
        {!isExcluded && !isLocked && !canEdit && editRestrictionReason && (
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 'var(--type-table-header-size, 12px)',
              color: '#92400E',
              lineHeight: '1.4',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              <Lock style={{ width: '13px', height: '13px', color: '#D97706', flexShrink: 0 }} />
              <strong>Read Only:</strong>
            </span>
            <span>
              {editRestrictionReason}
            </span>
          </div>
        )}

        {/* Row 2: One-liner Excluded Alert Container (if excluded) */}
        {isExcluded && (
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              fontSize: 'var(--type-table-header-size, 12px)',
              color: '#92400E',
              lineHeight: '1.4',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span className="lock-icon-blink" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                <Ban style={{ width: '13px', height: '13px', color: '#D97706', flexShrink: 0 }} />
                <strong>Issue Excluded:</strong>
              </span>
              <span style={{ color: '#92400E' }}>
                Issue excluded from report.
              </span>
            </div>

            <SharedButton
              variant="success"
              size="small"
              startIcon={<RotateCcw size={11} />}
              onClick={() => onIncludeIssue?.(issue.id)}
              style={{
                minHeight: 'var(--control-min-height-compact, 1.5rem)',
                fontSize: 'var(--type-caption-size, 11px)',
                padding: '0 10px',
              }}
            >
              Include Issue
            </SharedButton>
          </div>
        )}

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
              {/* Workflow Advance Action Buttons (Role-based: Send to Business, Submit to Director, etc.) */}
              {onAdvanceWorkflow && (
                <>
                  {isAuditor && (
                    <SharedButton
                      variant="primary"
                      size="small"
                      startIcon={<Send size={12} />}
                      onClick={() => onAdvanceWorkflow('Pending TC')}
                      style={{ minHeight: 'var(--control-min-height-compact, 1.75rem)', fontSize: 'var(--type-caption-size, 11px)', padding: '0 10px' }}
                    >
                      Submit to TC
                    </SharedButton>
                  )}

                  {isTC && (
                    <SharedButton
                      variant="primary"
                      size="small"
                      startIcon={<Send size={12} />}
                      onClick={() => onAdvanceWorkflow('Pending Manager')}
                      style={{ minHeight: 'var(--control-min-height-compact, 1.75rem)', fontSize: 'var(--type-caption-size, 11px)', padding: '0 10px' }}
                    >
                      Submit to Manager
                    </SharedButton>
                  )}

                  {isManager && (
                    <SharedButton
                      variant="primary"
                      size="small"
                      startIcon={<Send size={12} />}
                      onClick={() => onAdvanceWorkflow('Pending Director')}
                      style={{ minHeight: 'var(--control-min-height-compact, 1.75rem)', fontSize: 'var(--type-caption-size, 11px)', padding: '0 10px' }}
                    >
                      Submit to Director
                    </SharedButton>
                  )}

                  {isBusiness && (
                    <SharedButton
                      variant="primary"
                      size="small"
                      startIcon={<Send size={12} />}
                      onClick={() => onAdvanceWorkflow('Pending Director')}
                      style={{ minHeight: 'var(--control-min-height-compact, 1.75rem)', fontSize: 'var(--type-caption-size, 11px)', padding: '0 10px' }}
                    >
                      Submit Response to Director
                    </SharedButton>
                  )}

                  {isDirector && (
                    hasCriticalFinding ? (
                      <SharedButton
                        variant="primary"
                        size="small"
                        startIcon={<Send size={12} />}
                        onClick={() => onAdvanceWorkflow('Pending VP')}
                        style={{ minHeight: 'var(--control-min-height-compact, 1.75rem)', fontSize: 'var(--type-caption-size, 11px)', padding: '0 10px' }}
                        title="Mandatory VP Sign-Off Rule (contains Critical issue)"
                      >
                        Submit to VP
                      </SharedButton>
                    ) : (
                      <SharedButton
                        variant="success"
                        size="small"
                        startIcon={<CheckCircle2 size={12} />}
                        onClick={() => onAdvanceWorkflow('Signed Off')}
                        style={{ minHeight: 'var(--control-min-height-compact, 1.75rem)', fontSize: 'var(--type-caption-size, 11px)', padding: '0 10px' }}
                      >
                        Executive Sign-Off
                      </SharedButton>
                    )
                  )}

                  {isVP && (
                    <SharedButton
                      variant="success"
                      size="small"
                      startIcon={<CheckCircle2 size={12} />}
                      onClick={() => onAdvanceWorkflow('Signed Off')}
                      style={{ minHeight: 'var(--control-min-height-compact, 1.75rem)', fontSize: 'var(--type-caption-size, 11px)', padding: '0 10px' }}
                    >
                      Executive Sign-Off &amp; Seal
                    </SharedButton>
                  )}
                </>
              )}

              {/* Issue Actions Dropdown */}
              <SharedSelectButton
                label="Issue Actions"
                size="small"
                menuWidth={240}
                title="Issue actions (Call Back, Lock/Unlock, Track Changes, Functional Scope, Exclusion)"
                items={[
                  ...(onAdvanceWorkflow && isManager
                    ? [
                      {
                        key: 'send-to-business',
                        label: 'Send to Business',
                        icon: <Send style={{ width: '13px', height: '13px', color: '#000099' }} />,
                        onClick: () => onAdvanceWorkflow('Pending with Business'),
                      },
                    ]
                    : []),
                  ...(onOpenCallback
                    ? [
                      {
                        key: 'call-back',
                        label: 'Call Back Issue',
                        icon: <RotateCcw style={{ width: '13px', height: '13px', color: '#7C3AED' }} />,
                        onClick: () => onOpenCallback(issue.id),
                      },
                    ]
                    : []),
                  ...(onToggleLock
                    ? [
                      {
                        key: 'lock-unlock',
                        label: isLocked ? 'Unlock Issue' : 'Lock Issue',
                        icon: isLocked ? (
                          <Unlock style={{ width: '13px', height: '13px', color: '#047857' }} />
                        ) : (
                          <Lock style={{ width: '13px', height: '13px', color: '#D97706' }} />
                        ),
                        onClick: () => onToggleLock(issue.id),
                        dividerAfter: true,
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
                    label: 'Mark Not my Function Issue',
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
                    onClick: () => onMarkNotAnIssue?.(issue.id),
                  },
                  {
                    key: 'exclude-include',
                    label: isExcluded ? 'Include Issue in Report' : 'Mark Exclude Issue',
                    icon: isExcluded ? (
                      <RotateCcw style={{ width: '13px', height: '13px', color: '#059669' }} />
                    ) : (
                      <AlertOctagon style={{ width: '13px', height: '13px', color: '#991B1B' }} />
                    ),
                    danger: !isExcluded,
                    onClick: () => {
                      if (isExcluded) {
                        onIncludeIssue?.(issue.id);
                      } else {
                        onExcludeIssue?.(issue.id);
                      }
                    },
                  },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Pane 2 Main Body */}
      <div
        className="no-scrollbar"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 'clamp(12px, 1.4vh, 20px) clamp(12px, 1.4vw, 24px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(12px, 1.4vh, 20px)',
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <SharedSelect
                label="Test Procedure"
                value={issue.testProcedureCode || 'TP-101'}
                onChange={(val) => handleFieldChange('testProcedureCode', val)}
                options={TEST_PROCEDURE_OPTIONS}
                required
                disabled={isFieldDisabled}
              />
              <SharedSelect
                label="Function"
                value={(issue.function || (issue.tech === 'FinOps' ? 'FinOps' : 'IT')) as 'IT' | 'FinOps'}
                onChange={(val) => {
                  handleFieldChange('function', val);
                  handleFieldChange('tech', val);
                }}
                options={FUNCTION_OPTIONS}
                required
                disabled={isFieldDisabled}
              />
            </div>

            {/* Row 2: Original Issue / Initial Observation */}
            <div>
              <SharedTextArea
                label="Original Issue / Auditor Observation"
                value={issue.originalIssue || issue.description || issue.title || ''}
                onChange={(val) => handleFieldChange('originalIssue', val)}
                placeholder="Detail initial audit observations, test sample exceptions, and discovered control gaps..."
                rows={4}
                required
                disabled={isFieldDisabled}
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
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              padding: '20px',
              gap: '16px',
            }}
          >
            {/* Conditional Regeneration Notice (only shown when original issue or function changed) */}
            {showRegenerateBanner && (
              <div
                style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  boxShadow: '0 1px 3px rgba(0, 0, 153, 0.08)',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#DBEAFE',
                      border: '1px solid #93C5FD',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000099',
                      flexShrink: 0,
                    }}
                  >
                    <AlertTriangle size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--type-table-header-size, 12.5px)', color: '#1E3A8A', lineHeight: 1.45, fontWeight: 500 }}>
                      Changed the issue or function, so generated AI might not be valid, please click on Regenerate AI if needed.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <SharedButton
                    variant="outline"
                    size="small"
                    onClick={() => setIsBannerDismissed(true)}
                    style={{
                      minHeight: 'var(--control-min-height-compact, 1.625rem)',
                      fontSize: 'var(--type-caption-size, 11.5px)',
                      padding: '0 12px',
                    }}
                  >
                    Cancel
                  </SharedButton>

                  <SharedButton
                    variant="primary"
                    size="small"
                    startIcon={<RotateCcw size={12} />}
                    onClick={handleRegenerateAi}
                    disabled={isAiLoadingLocal || isFieldDisabled}
                    loading={isAiLoadingLocal}
                  >
                    {isAiLoadingLocal ? 'Regenerating...' : 'Regenerate AI'}
                  </SharedButton>
                </div>
              </div>
            )}

            {/* Standard AI Fields (Always visible in edit mode) */}
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
              />

              {/* 2. Condition Narrative & Observed Exceptions */}
              <AIInput
                label="Condition Narrative & Observed Exceptions"
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
                extraHeaderActions={
                  <button
                    type="button"
                    onClick={() => onOpenComments('issueNarrative', 'Condition Narrative')}
                    aria-label="Open comments for Condition Narrative"
                    className="type-caption"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748B',
                      fontSize: 'var(--type-caption-size, 11px)',
                      fontWeight: 700,
                      padding: '0 4px',
                      height: '18px',
                      lineHeight: '18px',
                      borderRadius: '3px',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#000099')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                  >
                    <MessageSquare size={12} />
                    <span>Comments</span>
                    {getCommentBadge('issueNarrative')}
                  </button>
                }
              />

              {/* 3. Root Cause */}
              <AIInput
                label="Root Cause Analysis"
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
                extraHeaderActions={
                  <button
                    type="button"
                    onClick={() => onOpenComments('rootCause', 'Root Cause')}
                    aria-label="Open comments for Root Cause"
                    className="type-caption"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748B',
                      fontSize: 'var(--type-caption-size, 11px)',
                      fontWeight: 700,
                      padding: '0 4px',
                      height: '18px',
                      lineHeight: '18px',
                      borderRadius: '3px',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#000099')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                  >
                    <MessageSquare size={12} />
                    <span>Comments</span>
                    {getCommentBadge('rootCause')}
                  </button>
                }
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
                extraHeaderActions={
                  <button
                    type="button"
                    onClick={() => onOpenComments('impact', 'Impact')}
                    aria-label="Open comments for Impact"
                    className="type-caption"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748B',
                      fontSize: 'var(--type-caption-size, 11px)',
                      fontWeight: 700,
                      padding: '0 4px',
                      height: '18px',
                      lineHeight: '18px',
                      borderRadius: '3px',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#000099')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                  >
                    <MessageSquare size={12} />
                    <span>Comments</span>
                    {getCommentBadge('impact')}
                  </button>
                }
              />

              {/* 5. Recommendations */}
              <AIInput
                label="Recommendations & Remediation Criteria"
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
                extraHeaderActions={
                  <button
                    type="button"
                    onClick={() => onOpenComments('recommendation', 'Recommendation')}
                    aria-label="Open comments for Recommendation"
                    className="type-caption"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748B',
                      fontSize: 'var(--type-caption-size, 11px)',
                      fontWeight: 700,
                      padding: '0 4px',
                      height: '18px',
                      lineHeight: '18px',
                      borderRadius: '3px',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#000099')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                  >
                    <MessageSquare size={12} />
                    <span>Comments</span>
                    {getCommentBadge('recommendation')}
                  </button>
                }
              />
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
            />

            {/* 2. Auditor Response */}
            <SharedTextArea
              label="Auditor Response"
              value={issue.auditorResponse || ''}
              onChange={(val) => handleFieldChange('auditorResponse', val)}
              placeholder="Auditor validation or initial assessment notes..."
              rows={2}
              disabled={isFieldDisabled}
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
            />

            {/* 4. Exception Remediation Comments */}
            <SharedTextArea
              label="Exception Remediation Comments"
              value={issue.exceptionRemedComments || ''}
              onChange={(val) => handleFieldChange('exceptionRemedComments', val)}
              placeholder="Remediation timeline comments..."
              rows={2}
              disabled={isFieldDisabled}
            />

            {/* 5. Issue Type & 6. Issue Cause Type */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <SharedSelect
                label="Issue Type"
                value={issue.issueType || 'Operational'}
                onChange={(val) => handleFieldChange('issueType', val)}
                options={ISSUE_TYPE_OPTIONS}
                disabled={isFieldDisabled}
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
              />
            </div>

            {/* 7. Criticality & 8. SOX Reportable */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <SharedSelect
                label="Criticality Severity"
                value={issue.criticality}
                onChange={(val) => handleFieldChange('criticality', val as CriticalityLevel)}
                options={CRITICALITY_OPTIONS}
                required
                disabled={isFieldDisabled}
              />
              <SharedSelect
                label="SOX Reportable"
                value={issue.soxReportable || (issue.criticality === 'Critical' ? 'Yes' : 'No')}
                onChange={(val) => handleFieldChange('soxReportable', val)}
                options={YES_NO_OPTIONS}
                disabled={isFieldDisabled}
              />
            </div>

            {/* 9. Issue Finding Source & 10. Key Theme */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <SharedSelect
                label="Issue Finding Source"
                value={issue.issueSource || 'Internal Audit'}
                onChange={(val) => handleFieldChange('issueSource', val)}
                options={ISSUE_SOURCE_OPTIONS}
                disabled={isFieldDisabled}
              />
              <SharedSelect
                label="Key Theme"
                value={issue.keyTheme || 'Access Governance & Authorization Matrix'}
                onChange={(val) => handleFieldChange('keyTheme', val)}
                options={KEY_THEME_OPTIONS}
                disabled={isFieldDisabled}
              />
            </div>

            {/* 11. Area & 12. Repeat Finding */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <SharedSelect
                label="Area"
                value={issue.processArea || issue.accountableProcessArea || 'Access Control & IAM'}
                onChange={(val) => {
                  handleFieldChange('processArea', val);
                  handleFieldChange('accountableProcessArea', val);
                }}
                options={PROCESS_AREA_OPTIONS}
                disabled={isFieldDisabled}
              />
              <SharedSelect
                label="Repeat Finding"
                value={issue.repeatFinding || 'No'}
                onChange={(val) => handleFieldChange('repeatFinding', val)}
                options={YES_NO_OPTIONS}
                disabled={isFieldDisabled}
              />
            </div>

            {/* 13. IT Asset Accountable Sector & 14. Accountable Function */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <SharedSelect
                label="IT Asset Accountable Sector"
                value={issue.itAssetAccountableSector || 'MT'}
                onChange={(val) => handleFieldChange('itAssetAccountableSector', val)}
                options={IT_ASSET_ACCOUNTABLE_SECTOR_OPTIONS}
                disabled={isFieldDisabled}
              />
              <SharedSelect
                label="Accountable Function"
                value={issue.accountableFunction || 'IT Infrastructure & Identity Access Management'}
                onChange={(val) => handleFieldChange('accountableFunction', val)}
                options={ACCOUNTABLE_FUNCTION_OPTIONS}
                disabled={isFieldDisabled}
              />
            </div>

            {/* 15. Impacted Region & 16. Impacted Sector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <SharedSelect
                label="Impacted Region"
                value={issue.impactedRegion || 'NA'}
                onChange={(val) => handleFieldChange('impactedRegion', val)}
                options={IMPACTED_REGION_OPTIONS}
                disabled={isFieldDisabled}
              />
              <SharedSelect
                label="Impacted Sector"
                value={issue.impactedSector || 'MED'}
                onChange={(val) => handleFieldChange('impactedSector', val)}
                options={IMPACTED_SECTOR_OPTIONS}
                disabled={isFieldDisabled}
              />
            </div>

            {/* 17. Impact MRC & 18. Quarter Impacted */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <SharedSelect
                label="Impact MRC"
                value={issue.impactedMrc || 'MRC-01: Global Supply Chain & Manufacturing Operations'}
                onChange={(val) => handleFieldChange('impactedMrc', val)}
                options={IMPACTED_MRC_OPTIONS}
                disabled={isFieldDisabled}
              />
              <SharedSelect
                label="Quarter Impacted"
                value={issue.quarterImpacted || 'Q1 2026'}
                onChange={(val) => handleFieldChange('quarterImpacted', val)}
                options={QUARTER_IMPACTED_OPTIONS}
                disabled={isFieldDisabled}
              />
            </div>

            {/* 19. Sales (USD) & 20. IBT (USD) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <SharedTextInput
                label="Sales (USD)"
                value={issue.salesUsd != null ? String(issue.salesUsd) : ''}
                onChange={(val) => handleFieldChange('salesUsd', val)}
                placeholder="$0.00"
                disabled={isFieldDisabled}
              />
              <SharedTextInput
                label="IBT (USD)"
                value={issue.ibtUsd != null ? String(issue.ibtUsd) : ''}
                onChange={(val) => handleFieldChange('ibtUsd', val)}
                placeholder="$0.00"
                disabled={isFieldDisabled}
              />
            </div>

            {/* 21. Net Income (USD) & 22. Total Assets (USD) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <SharedTextInput
                label="Net Income (USD)"
                value={issue.netIncomeUsd != null ? String(issue.netIncomeUsd) : ''}
                onChange={(val) => handleFieldChange('netIncomeUsd', val)}
                placeholder="$0.00"
                disabled={isFieldDisabled}
              />
              <SharedTextInput
                label="Total Assets (USD)"
                value={issue.totalAssetsUsd != null ? String(issue.totalAssetsUsd) : ''}
                onChange={(val) => handleFieldChange('totalAssetsUsd', val)}
                placeholder="$0.00"
                disabled={isFieldDisabled}
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
                  />
                </div>
              )}
            </div>

            {/* 24. Primary Business Owner */}
            <SharedSelect
              label="Primary Business Owner"
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
              placeholder="Select Primary Business Owner..."
              disabled={isFieldDisabled}
            />

            {/* 25. Add New Secondary Business Owner (Multi Select) */}
            <SharedMultiSelect
              label="Add New Secondary Business Owner"
              value={issue.secondaryBusinessOwnerIds || []}
              onChange={(vals) => handleFieldChange('secondaryBusinessOwnerIds', vals)}
              options={systemUsers}
              placeholder="Select Secondary Business Owners..."
              disabled={isFieldDisabled}
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
              />
            </div>

            {/* 4. Business Management Attachment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Business Management Attachment
              </label>

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
    </div>
  );
};
